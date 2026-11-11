/**
 * Estudiante tal como lo devolverá la API (Python) en JSON.
 * Los nombres de campo coinciden con las columnas de PostgreSQL.
 */
export interface Estudiante {
  id: number;
  /** Matrícula / RU */
  student_code: string;
  first_name: string;
  last_name: string;
  email: string;
  /** Prellenado con 'Odontología' */
  career: string;
  /** id del curso / grupo clínico asignado */
  clinical_group: number | null;
  /** URL de la foto institucional (en el mock: data URL) */
  photo_url: string | null;
  is_active: boolean;
  /** true si tiene inspecciones registradas por la IA (no se puede eliminar) */
  has_history: boolean;
  created_at: string;
}

/** Cuerpo del POST /estudiantes y PUT /estudiantes/:id */
export type EstudianteFormulario = Pick<
  Estudiante,
  'student_code' | 'first_name' | 'last_name' | 'email' | 'career' | 'clinical_group' | 'photo_url' | 'is_active'
>;

export const CARRERA_POR_DEFECTO = 'Odontología';
