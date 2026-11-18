import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Cursos } from '../../services/cursos';
import { Auth } from '../../services/auth';
import { Curso, CursoFormulario, etiquetaCurso, gestionActual } from '../../models/curso';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-mis-cursos',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './mis-cursos.html',
  styleUrl: './mis-cursos.css',
})
export class MisCursos implements OnInit {
  private readonly cursosSrv = inject(Cursos);
  private readonly usuario = inject(Auth).usuario;
  private readonly fb = inject(FormBuilder);

  protected readonly etiqueta = etiquetaCurso;
  protected readonly anioActual = new Date().getFullYear();
  protected readonly gestion = gestionActual();

  protected readonly cursos = this.cursosSrv.cursos;
  protected readonly cargando = this.cursosSrv.cargando;
  protected readonly errorCarga = this.cursosSrv.error;
  protected readonly totalActivos = computed(() => this.cursosSrv.activos().length);
  /** Estudiantes en cursos habilitados (student_count lo calcula la API). */
  protected readonly totalEstudiantes = computed(() =>
    this.cursosSrv.activos().reduce((suma, c) => suma + c.student_count, 0),
  );

  // Filtros
  protected readonly busqueda = signal('');
  protected readonly filtroEstado = signal<FiltroEstado>('todos');
  protected readonly cursosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const estado = this.filtroEstado();
    return this.cursos().filter((c) => {
      if (estado === 'activos' && !c.is_active) return false;
      if (estado === 'inactivos' && c.is_active) return false;
      if (!q) return true;
      return [c.name, c.code, c.group_name, c.academic_period, c.teacher_name].some((v) =>
        (v ?? '').toLowerCase().includes(q),
      );
    });
  });

  // Modal crear / editar
  protected readonly modalAbierto = signal(false);
  protected readonly cursoEditando = signal<Curso | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorModal = signal<string | null>(null);
  /** Aviso cuando falla el switch de habilitar / deshabilitar. */
  protected readonly aviso = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    group_name: ['', [Validators.required, Validators.maxLength(50)]],
    academic_period: [this.gestion, [Validators.required, Validators.maxLength(50)]],
    teacher_name: ['', Validators.maxLength(150)],
    description: [''],
  });

  ngOnInit(): void {
    this.cursosSrv.cargar(true);
  }

  protected reintentar(): void {
    this.cursosSrv.cargar(true);
  }

  protected abrirCrear(): void {
    this.cursoEditando.set(null);
    this.errorModal.set(null);
    this.form.reset({
      code: '',
      name: '',
      group_name: '',
      academic_period: this.gestion,
      teacher_name: this.usuario()?.nombre ?? '',
      description: '',
    });
    this.modalAbierto.set(true);
  }

  protected abrirEditar(curso: Curso): void {
    this.cursoEditando.set(curso);
    this.errorModal.set(null);
    this.form.reset({
      code: curso.code,
      name: curso.name,
      group_name: curso.group_name ?? '',
      academic_period: curso.academic_period ?? '',
      teacher_name: curso.teacher_name ?? '',
      description: curso.description ?? '',
    });
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    if (this.guardando()) return;
    this.modalAbierto.set(false);
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const editando = this.cursoEditando();
    const datos: CursoFormulario = {
      code: v.code.trim().toUpperCase(),
      name: v.name.trim(),
      group_name: v.group_name.trim() || null,
      academic_period: v.academic_period.trim() || null,
      teacher_name: v.teacher_name.trim() || null,
      description: v.description.trim() || null,
      is_active: editando ? editando.is_active : true,
    };

    this.guardando.set(true);
    this.errorModal.set(null);
    const peticion = editando
      ? this.cursosSrv.editar(editando.id, datos)
      : this.cursosSrv.crear(datos);
    peticion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.modalAbierto.set(false);
      },
      error: (e: Error) => {
        this.guardando.set(false);
        this.errorModal.set(e.message);
      },
    });
  }

  protected cambiarEstado(curso: Curso, evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const nuevo = input.checked;
    input.disabled = true;
    this.cursosSrv.cambiarEstado(curso.id, nuevo).subscribe({
      next: () => (input.disabled = false),
      error: (e: Error) => {
        // Revertir el switch si la API rechazó el cambio
        input.checked = !nuevo;
        input.disabled = false;
        this.aviso.set(`No se pudo ${nuevo ? 'habilitar' : 'deshabilitar'} el curso: ${e.message}`);
        setTimeout(() => this.aviso.set(null), 5000);
      },
    });
  }

  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && c.touched;
  }
}
