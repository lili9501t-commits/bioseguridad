export type Turno = 'Mañana' | 'Tarde';

export interface Curso {
  id: number;
  /** Sigla de la cátedra, p. ej. ODO-401 */
  sigla: string;
  nombre: string;
  /** Paralelo / grupo, p. ej. "A" */
  grupo: string;
  turno: Turno;
  anio: number;
  activo: boolean;
  /** Fecha y hora de registro (ISO 8601) */
  fechaRegistro: string;
}

/** Datos que el docente llena en el formulario de crear / editar. */
export type CursoFormulario = Omit<Curso, 'id' | 'activo' | 'fechaRegistro'>;
