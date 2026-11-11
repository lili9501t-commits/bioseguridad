import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Cursos } from '../../services/cursos';
import { Estudiantes } from '../../services/estudiantes';
import { Curso, Turno } from '../../models/curso';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-mis-cursos',
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './mis-cursos.html',
  styleUrl: './mis-cursos.css',
})
export class MisCursos {
  private readonly cursosSrv = inject(Cursos);
  private readonly estudiantesSrv = inject(Estudiantes);
  private readonly fb = inject(FormBuilder);

  protected readonly anioActual = new Date().getFullYear();
  protected readonly cursos = this.cursosSrv.cursos;
  protected readonly totalActivos = computed(() => this.cursosSrv.activos().length);
  /** Estudiantes asignados a cursos habilitados (desde el padrón). */
  protected readonly totalEstudiantes = computed(() =>
    this.cursosSrv.activos().reduce((suma, c) => suma + this.estudiantesSrv.contarPorCurso(c.id), 0),
  );

  protected estudiantesDe(curso: Curso): number {
    return this.estudiantesSrv.contarPorCurso(curso.id);
  }

  // Filtros
  protected readonly busqueda = signal('');
  protected readonly filtroEstado = signal<FiltroEstado>('todos');
  protected readonly cursosFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const estado = this.filtroEstado();
    return this.cursos().filter((c) => {
      if (estado === 'activos' && !c.activo) return false;
      if (estado === 'inactivos' && c.activo) return false;
      if (!q) return true;
      return [c.nombre, c.sigla, c.grupo, c.turno, String(c.anio)].some((v) =>
        v.toLowerCase().includes(q),
      );
    });
  });

  // Modal crear / editar
  protected readonly modalAbierto = signal(false);
  protected readonly cursoEditando = signal<Curso | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    sigla: ['', [Validators.required, Validators.maxLength(12)]],
    nombre: ['', [Validators.required, Validators.maxLength(80)]],
    grupo: ['', [Validators.required, Validators.maxLength(5)]],
    turno: ['Mañana' as Turno, Validators.required],
    anio: [this.anioActual, [Validators.required, Validators.min(2000), Validators.max(2100)]],
  });

  protected abrirCrear(): void {
    this.cursoEditando.set(null);
    this.form.reset({
      sigla: '',
      nombre: '',
      grupo: '',
      turno: 'Mañana',
      anio: this.anioActual,
    });
    this.modalAbierto.set(true);
  }

  protected abrirEditar(curso: Curso): void {
    this.cursoEditando.set(curso);
    this.form.reset({
      sigla: curso.sigla,
      nombre: curso.nombre,
      grupo: curso.grupo,
      turno: curso.turno,
      anio: curso.anio,
    });
    this.modalAbierto.set(true);
  }

  protected cerrarModal(): void {
    this.modalAbierto.set(false);
  }

  protected guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const datos = this.form.getRawValue();
    datos.sigla = datos.sigla.trim().toUpperCase();
    datos.grupo = datos.grupo.trim().toUpperCase();
    datos.nombre = datos.nombre.trim();

    const editando = this.cursoEditando();
    if (editando) {
      this.cursosSrv.editar(editando.id, datos);
    } else {
      this.cursosSrv.crear(datos);
    }
    this.cerrarModal();
  }

  protected cambiarEstado(curso: Curso, evento: Event): void {
    this.cursosSrv.cambiarEstado(curso.id, (evento.target as HTMLInputElement).checked);
  }

  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && c.touched;
  }
}
