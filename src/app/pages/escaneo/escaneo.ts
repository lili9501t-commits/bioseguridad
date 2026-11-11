import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { EMPTY, Subscription, catchError, exhaustMap, interval, timer } from 'rxjs';
import { Api } from '../../services/api';
import { Auth } from '../../services/auth';
import { Cursos } from '../../services/cursos';
import { Estudiantes } from '../../services/estudiantes';
import { Inspecciones } from '../../services/inspecciones';
import { CaptureMode, ElementEvaluationResult, HealthResponse } from '../../models/inspeccion';

/** Cada cuánto se consulta la pre-verificación en vivo (ms). */
const INTERVALO_EN_VIVO = 3000;

@Component({
  selector: 'app-escaneo',
  imports: [DatePipe],
  templateUrl: './escaneo.html',
  styleUrl: './escaneo.css',
})
export class Escaneo implements OnInit {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly inspecciones = inject(Inspecciones);
  private readonly cursosSrv = inject(Cursos);
  private readonly estudiantesSrv = inject(Estudiantes);
  private readonly destroyRef = inject(DestroyRef);

  private readonly usuario = inject(Auth).usuario;
  /** Registro del estudiante en el padrón (por su correo). */
  protected readonly estudiante = computed(() => {
    const u = this.usuario();
    return u ? this.estudiantesSrv.buscarPorCorreo(u.correo) : undefined;
  });

  // Grupos del estudiante (solo cursos habilitados donde está asignado)
  protected readonly misGrupos = computed(() => {
    const est = this.estudiante();
    return this.cursosSrv.activos().filter((c) => c.id === est?.clinical_group);
  });
  protected readonly grupoId = signal<number | null>(null);
  protected readonly grupo = computed(() => this.misGrupos().find((c) => c.id === this.grupoId()));

  // Fecha y hora automáticas
  protected readonly ahora = signal(new Date());
  protected readonly fechaIngreso = new Date();

  // Estado de la API y la cámara
  protected readonly servidor = signal<HealthResponse | null>(null);
  protected readonly servidorCaido = signal(false);
  protected readonly camaraActiva = signal(false);
  protected readonly procesandoCamara = signal(false);
  protected readonly infoCamara = signal<string | null>(null);
  protected readonly modo = signal<CaptureMode>('upper_body');
  /** Cambia en cada encendido para forzar la reconexión del stream MJPEG. */
  private readonly sesionStream = signal(0);
  protected readonly urlStream = computed(
    () => `${this.api.urlStream(this.modo())}&s=${this.sesionStream()}`,
  );

  // Detecciones en vivo y captura final
  protected readonly enVivo = signal<ElementEvaluationResult[]>([]);
  protected readonly mensajeEnVivo = signal<string | null>(null);
  protected readonly capturando = signal(false);
  protected readonly error = signal<string | null>(null);
  private sondeo?: Subscription;

  constructor() {
    const reloj = interval(1000).subscribe(() => this.ahora.set(new Date()));
    this.destroyRef.onDestroy(() => {
      reloj.unsubscribe();
      this.detenerSondeo();
    });
  }

  ngOnInit(): void {
    // Preseleccionar el grupo si solo tiene uno
    const grupos = this.misGrupos();
    if (grupos.length === 1) this.grupoId.set(grupos[0].id);

    this.api.health().subscribe({
      next: (h) => {
        this.servidor.set(h);
        this.servidorCaido.set(false);
      },
      error: () => this.servidorCaido.set(true),
    });
    this.api.estadoCamara().subscribe({
      next: (c) => {
        if (c.is_running) this.marcarCamaraActiva(c.resolution, c.fps);
      },
      error: () => {},
    });
  }

  protected seleccionarGrupo(valor: string): void {
    this.grupoId.set(valor ? Number(valor) : null);
  }

  protected cambiarModo(modo: CaptureMode): void {
    this.modo.set(modo);
    this.enVivo.set([]);
  }

  // ---------- Cámara ----------
  protected activarCamara(): void {
    this.error.set(null);
    this.procesandoCamara.set(true);
    this.api.iniciarCamara().subscribe({
      next: (c) => {
        this.procesandoCamara.set(false);
        this.marcarCamaraActiva(c.resolution, c.fps);
      },
      error: (e: Error) => {
        this.procesandoCamara.set(false);
        this.error.set(e.message);
      },
    });
  }

  protected apagarCamara(): void {
    this.detenerSondeo();
    this.camaraActiva.set(false);
    this.enVivo.set([]);
    this.procesandoCamara.set(true);
    this.api.detenerCamara().subscribe({
      next: () => this.procesandoCamara.set(false),
      error: (e: Error) => {
        this.procesandoCamara.set(false);
        this.error.set(e.message);
      },
    });
  }

  protected streamConError(): void {
    if (!this.camaraActiva()) return;
    this.error.set('Se perdió la señal de video. Reinicie la cámara.');
  }

  private marcarCamaraActiva(resolucion: string, fps: number): void {
    this.sesionStream.update((n) => n + 1);
    this.camaraActiva.set(true);
    this.infoCamara.set(`${resolucion} • ${Math.round(fps)} FPS`);
    this.iniciarSondeo();
  }

  // ---------- Pre-verificación en vivo (IA) ----------
  private iniciarSondeo(): void {
    this.detenerSondeo();
    this.sondeo = timer(800, INTERVALO_EN_VIVO)
      .pipe(
        exhaustMap(() =>
          this.api
            .capturarYEvaluar({
              student_code: this.estudiante()?.student_code,
              capture_mode: this.modo(),
              save_image: false,
              include_base64_image: false,
            })
            .pipe(
              catchError((e: Error) => {
                this.mensajeEnVivo.set(e.message);
                return EMPTY;
              }),
            ),
        ),
      )
      .subscribe((r) => {
        this.enVivo.set(r.elements);
        this.mensajeEnVivo.set(r.image_quality.person_detected ? null : 'No se detecta a ninguna persona en el encuadre.');
      });
  }

  private detenerSondeo(): void {
    this.sondeo?.unsubscribe();
    this.sondeo = undefined;
  }

  // ---------- Captura final ----------
  protected capturar(): void {
    const est = this.estudiante();
    const grupo = this.grupo();
    if (!est || !grupo) {
      this.error.set('Seleccione su grupo / asignatura antes de capturar.');
      return;
    }
    if (!this.camaraActiva()) {
      this.error.set('Active la cámara antes de capturar.');
      return;
    }
    this.error.set(null);
    this.capturando.set(true);
    this.detenerSondeo();

    this.api
      .capturarYEvaluar({
        student_code: est.student_code,
        capture_mode: this.modo(),
        save_image: true,
        include_base64_image: true,
      })
      .subscribe({
        next: (resultado) => {
          const registro = this.inspecciones.registrar({
            student_code: est.student_code,
            estudiante_nombre: `${est.first_name} ${est.last_name}`,
            clinical_group: grupo.id,
            grupo_nombre: `${grupo.nombre} - Grupo ${grupo.grupo}`,
            fecha_ingreso: this.fechaIngreso.toISOString(),
            resultado,
          });
          this.capturando.set(false);
          // Redirección automática a resultados
          this.router.navigate(['/estudiante/resultado', registro.id]);
        },
        error: (e: Error) => {
          this.capturando.set(false);
          this.error.set(e.message);
          this.iniciarSondeo();
        },
      });
  }
}

