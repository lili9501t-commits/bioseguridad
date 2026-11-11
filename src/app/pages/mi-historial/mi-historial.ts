import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Auth } from '../../services/auth';
import { Estudiantes } from '../../services/estudiantes';
import { Inspecciones } from '../../services/inspecciones';
import { EvaluationStatus, RegistroInspeccion } from '../../models/inspeccion';
import { ListaElementos } from '../../components/lista-elementos/lista-elementos';

type FiltroEstado = 'todos' | EvaluationStatus;

const POR_PAGINA = 5;

/** HU-05: historial personal del estudiante (solo lectura). */
@Component({
  selector: 'app-mi-historial',
  imports: [DatePipe, DecimalPipe, ListaElementos],
  templateUrl: './mi-historial.html',
  styleUrl: './mi-historial.css',
})
export class MiHistorial {
  private readonly inspecciones = inject(Inspecciones);
  private readonly usuario = inject(Auth).usuario;
  private readonly estudiantesSrv = inject(Estudiantes);

  protected readonly estudiante = computed(() => {
    const u = this.usuario();
    return u ? this.estudiantesSrv.buscarPorCorreo(u.correo) : undefined;
  });

  /** Únicamente los registros del usuario logueado. */
  protected readonly misRegistros = computed(() => {
    const est = this.estudiante();
    return est ? this.inspecciones.delEstudiante(est.student_code) : [];
  });

  protected readonly cumplimiento = computed(() => {
    const total = this.misRegistros().length;
    if (!total) return null;
    const cumple = this.misRegistros().filter((r) => r.resultado.overall_status === 'cumple').length;
    return (cumple / total) * 100;
  });

  // Filtros
  protected readonly filtroEstado = signal<FiltroEstado>('todos');
  protected readonly desde = signal('');
  protected readonly hasta = signal('');

  protected readonly filtrados = computed(() => {
    const estado = this.filtroEstado();
    const desde = this.desde();
    const hasta = this.hasta();
    return this.misRegistros().filter((r) => {
      if (estado !== 'todos' && r.resultado.overall_status !== estado) return false;
      const dia = this.diaLocal(r.resultado.inspection_timestamp);
      if (desde && dia < desde) return false;
      if (hasta && dia > hasta) return false;
      return true;
    });
  });

  protected contar(estado: FiltroEstado): number {
    return estado === 'todos'
      ? this.misRegistros().length
      : this.misRegistros().filter((r) => r.resultado.overall_status === estado).length;
  }

  // Paginación
  protected readonly pagina = signal(1);
  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtrados().length / POR_PAGINA)),
  );
  protected readonly paginas = computed(() =>
    Array.from({ length: this.totalPaginas() }, (_, i) => i + 1),
  );
  protected readonly paginaActual = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.filtrados().slice(inicio, inicio + POR_PAGINA);
  });
  protected readonly rango = computed(() => {
    const total = this.filtrados().length;
    const desde = total ? (this.pagina() - 1) * POR_PAGINA + 1 : 0;
    return { desde, hasta: Math.min(total, this.pagina() * POR_PAGINA), total };
  });

  // Modal de detalle
  protected readonly seleccionado = signal<RegistroInspeccion | null>(null);

  constructor() {
    effect(() => {
      this.filtroEstado();
      this.desde();
      this.hasta();
      this.pagina.set(1);
    });
  }

  protected restablecer(): void {
    this.filtroEstado.set('todos');
    this.desde.set('');
    this.hasta.set('');
  }

  protected haceCuanto(iso: string): string {
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return 'Hace un momento';
    if (min < 60) return `Hace ${min} min`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    const dias = Math.floor(horas / 24);
    return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  }

  /** yyyy-MM-dd en hora local (para comparar con los <input type="date">). */
  private diaLocal(iso: string): string {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
}
