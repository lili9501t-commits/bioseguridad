/**
 * Curso tal como lo devuelve la API (app/schemas/course.py -> CourseResponse).
 * Los nombres de campo coinciden con la tabla `courses` de PostgreSQL.
 */
export interface Curso {
  id: number;
  /** Sigla oficial, p. ej. ODO-401 (única) */
  code: string;
  name: string;
  /** Grupo o paralelo, p. ej. "Grupo A" */
  group_name: string | null;
  /** Gestión académica, p. ej. "2026-II" */
  academic_period: string | null;
  teacher_name: string | null;
  description: string | null;
  is_active: boolean;
  /** Calculado por la API */
  student_count: number;
  created_at: string;
  updated_at: string;
}

/** Cuerpo de POST /courses y PUT /courses/{id} (CourseCreate / CourseUpdate). */
export type CursoFormulario = Pick<
  Curso,
  'code' | 'name' | 'group_name' | 'academic_period' | 'teacher_name' | 'description' | 'is_active'
>;

/** "Clínica Integral I - Grupo A" */
export function etiquetaCurso(c: Pick<Curso, 'name' | 'group_name'>): string {
  return c.group_name ? `${c.name} - ${c.group_name}` : c.name;
}

/** Gestión vigente según la fecha: enero–junio = I, julio–diciembre = II. */
export function gestionActual(fecha = new Date()): string {
  return `${fecha.getFullYear()}-${fecha.getMonth() < 6 ? 'I' : 'II'}`;
}
