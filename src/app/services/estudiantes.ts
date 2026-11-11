import { Injectable, computed, signal } from '@angular/core';
import { CARRERA_POR_DEFECTO, Estudiante, EstudianteFormulario } from '../models/estudiante';

/**
 * Datos simulados (Mock Data). Endpoints previstos de la API (Python + PostgreSQL):
 *   GET    /estudiantes            -> Estudiante[]
 *   POST   /estudiantes            -> Estudiante           (registro individual)
 *   POST   /estudiantes/lote       -> Estudiante[]         (carga masiva Excel)
 *   PUT    /estudiantes/:id        -> Estudiante
 *   DELETE /estudiantes/:id        -> 204 (rechazado si has_history = true)
 */
const ESTUDIANTES_MOCK: Estudiante[] = [
  { id: 1, student_code: '24-1589', first_name: 'Andrea Valeria', last_name: 'Flores Choque', email: 'andrea.flores@gmail.com', career: CARRERA_POR_DEFECTO, clinical_group: 2, photo_url: null, is_active: true, has_history: false, created_at: '2026-02-12T09:10:00' },
  { id: 2, student_code: '24-1802', first_name: 'Carlos Eduardo', last_name: 'Morales Quispe', email: 'carlos.morales@gmail.com', career: CARRERA_POR_DEFECTO, clinical_group: 2, photo_url: null, is_active: true, has_history: true, created_at: '2026-02-12T09:12:00' },
  { id: 3, student_code: '24-1644', first_name: 'Mariana Rocío', last_name: 'Rojas Gutiérrez', email: 'mariana.rojas@gmail.com', career: CARRERA_POR_DEFECTO, clinical_group: 1, photo_url: null, is_active: true, has_history: true, created_at: '2026-02-12T09:15:00' },
  { id: 4, student_code: '23-0941', first_name: 'Jorge Luis', last_name: 'Torrico Villarroel', email: 'jorge.torrico@gmail.com', career: CARRERA_POR_DEFECTO, clinical_group: 3, photo_url: null, is_active: false, has_history: false, created_at: '2025-08-05T10:00:00' },
  { id: 5, student_code: '24-2105', first_name: 'Sofía Lucía', last_name: 'Lima Paredes', email: 'sofia.lima@gmail.com', career: CARRERA_POR_DEFECTO, clinical_group: 1, photo_url: null, is_active: true, has_history: true, created_at: '2026-02-13T11:30:00' },
  { id: 6, student_code: '24-1990', first_name: 'Rosalinda', last_name: 'Mamani Cruz', email: 'rosalinda@gmail.com', career: CARRERA_POR_DEFECTO, clinical_group: 1, photo_url: null, is_active: true, has_history: false, created_at: '2026-02-13T11:45:00' },
];

export type ResultadoGuardar = { ok: true; estudiante: Estudiante } | { ok: false; error: string };

@Injectable({ providedIn: 'root' })
export class Estudiantes {
  private readonly _lista = signal<Estudiante[]>(ESTUDIANTES_MOCK);

  readonly lista = this._lista.asReadonly();
  readonly activos = computed(() => this._lista().filter((e) => e.is_active).length);
  readonly inactivos = computed(() => this._lista().filter((e) => !e.is_active).length);

  /** Cantidad de estudiantes asignados a un curso. */
  contarPorCurso(cursoId: number): number {
    return this._lista().filter((e) => e.clinical_group === cursoId).length;
  }

  /** Valida unicidad de matrícula y correo (en la BD serán UNIQUE). */
  private duplicado(datos: EstudianteFormulario, ignorarId?: number): string | null {
    const codigo = datos.student_code.toLowerCase();
    const correo = datos.email.toLowerCase();
    for (const e of this._lista()) {
      if (e.id === ignorarId) continue;
      if (e.student_code.toLowerCase() === codigo) return `La matrícula ${datos.student_code} ya está registrada.`;
      if (e.email.toLowerCase() === correo) return `El correo ${datos.email} ya está registrado.`;
    }
    return null;
  }

  crear(datos: EstudianteFormulario): ResultadoGuardar {
    const error = this.duplicado(datos);
    if (error) return { ok: false, error };
    const nuevo: Estudiante = {
      ...datos,
      id: Math.max(0, ...this._lista().map((e) => e.id)) + 1,
      has_history: false,
      created_at: new Date().toISOString(),
    };
    this._lista.update((l) => [nuevo, ...l]);
    return { ok: true, estudiante: nuevo };
  }

  /** Carga masiva: registra los válidos y devuelve los errores por fila. */
  crearLote(filas: EstudianteFormulario[]): { creados: number; errores: string[] } {
    let creados = 0;
    const errores: string[] = [];
    filas.forEach((f, i) => {
      const r = this.crear(f);
      if (r.ok) creados++;
      else errores.push(`Fila ${i + 2}: ${r.error}`);
    });
    return { creados, errores };
  }

  editar(id: number, datos: EstudianteFormulario): ResultadoGuardar {
    const error = this.duplicado(datos, id);
    if (error) return { ok: false, error };
    let actualizado!: Estudiante;
    this._lista.update((l) =>
      l.map((e) => (e.id === id ? (actualizado = { ...e, ...datos }) : e)),
    );
    return { ok: true, estudiante: actualizado };
  }

  eliminar(id: number): boolean {
    const e = this._lista().find((x) => x.id === id);
    if (!e || e.has_history) return false;
    this._lista.update((l) => l.filter((x) => x.id !== id));
    return true;
  }
}
