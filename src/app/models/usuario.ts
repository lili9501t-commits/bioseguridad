export type Rol = 'docente' | 'estudiante';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  /** Código estudiantil (solo estudiantes). */
  codigo?: string;
}
