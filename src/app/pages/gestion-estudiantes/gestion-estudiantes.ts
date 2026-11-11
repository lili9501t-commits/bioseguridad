import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Cursos } from '../../services/cursos';
import { Estudiantes } from '../../services/estudiantes';
import { Estudiante } from '../../models/estudiante';
import { Curso } from '../../models/curso';
import { EstudianteModal } from '../../components/estudiante-modal/estudiante-modal';

type FiltroEstado = 'todos' | 'activos' | 'inactivos';

@Component({
  selector: 'app-gestion-estudiantes',
  imports: [EstudianteModal],
  templateUrl: './gestion-estudiantes.html',
  styleUrl: './gestion-estudiantes.css',
})
export class GestionEstudiantes {
  private readonly estudiantesSrv = inject(Estudiantes);
  private readonly cursosSrv = inject(Cursos);

  protected readonly anioActual = new Date().getFullYear();
  protected readonly estudiantes = this.estudiantesSrv.lista;
  protected readonly activos = this.estudiantesSrv.activos;
  protected readonly inactivos = this.estudiantesSrv.inactivos;
  protected readonly cursos = this.cursosSrv.cursos;
  /** Solo los cursos habilitados se pueden asignar. */
  protected readonly cursosHabilitados = this.cursosSrv.activos;

  // Filtros
  protected readonly busqueda = signal('');
  protected readonly filtroCurso = signal<number | null>(null);
  protected readonly filtroEstado = signal<FiltroEstado>('todos');

  // Paginación
  protected readonly porPagina = signal(10);
  protected readonly pagina = signal(1);

  // Modal y avisos
  protected readonly modalAbierto = signal(false);
  protected readonly editando = signal<Estudiante | null>(null);
  protected readonly aviso = signal<string | null>(null);

  protected readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const curso = this.filtroCurso();
    const estado = this.filtroEstado();
    return this.estudiantes().filter((e) => {
      if (curso !== null && e.clinical_group !== curso) return false;
      if (estado === 'activos' && !e.is_active) return false;
      if (estado === 'inactivos' && e.is_active) return false;
      if (!q) return true;
      return `${e.student_code} ${e.first_name} ${e.last_name} ${e.email}`.toLowerCase().includes(q);
    });
  });

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtrados().length / this.porPagina())),
  );
  protected readonly paginaActual = computed(() => {
    const inicio = (this.pagina() - 1) * this.porPagina();
    return this.filtrados().slice(inicio, inicio + this.porPagina());
  });
  protected readonly rango = computed(() => {
    const total = this.filtrados().length;
    const desde = total ? (this.pagina() - 1) * this.porPagina() + 1 : 0;
    return { desde, hasta: Math.min(total, this.pagina() * this.porPagina()), total };
  });
  protected readonly paginas = computed(() =>
    Array.from({ length: this.totalPaginas() }, (_, i) => i + 1),
  );

  constructor() {
    // Viene desde "Gestionar Alumnos" en Mis Cursos: /docente/estudiantes?curso=<id>
    const curso = inject(ActivatedRoute).snapshot.queryParamMap.get('curso');
    if (curso) this.filtroCurso.set(Number(curso));

    // Volver a la página 1 al cambiar filtros
    effect(() => {
      this.busqueda();
      this.filtroCurso();
      this.filtroEstado();
      this.porPagina();
      this.pagina.set(1);
    });
  }

  protected cursoDe(e: Estudiante): Curso | undefined {
    return this.cursos().find((c) => c.id === e.clinical_group);
  }

  protected iniciales(e: Estudiante): string {
    return (e.first_name.charAt(0) + e.last_name.charAt(0)).toUpperCase();
  }

  protected abrirCrear(): void {
    this.editando.set(null);
    this.modalAbierto.set(true);
  }

  protected abrirEditar(e: Estudiante): void {
    this.editando.set(e);
    this.modalAbierto.set(true);
  }

  protected alGuardar(mensaje: string): void {
    this.modalAbierto.set(false);
    this.mostrarAviso(mensaje);
  }

  protected eliminar(e: Estudiante): void {
    if (e.has_history) return;
    if (!confirm(`¿Eliminar a ${e.first_name} ${e.last_name} (${e.student_code})?`)) return;
    if (this.estudiantesSrv.eliminar(e.id)) this.mostrarAviso('Estudiante eliminado.');
  }

  private mostrarAviso(mensaje: string): void {
    this.aviso.set(mensaje);
    setTimeout(() => this.aviso.set(null), 3500);
  }
}
