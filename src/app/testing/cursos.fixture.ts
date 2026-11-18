import { Curso } from '../models/curso';

/** Respuestas de ejemplo de GET /courses para las pruebas. */
export const CURSOS_PRUEBA: Curso[] = [
  {
    id: 1, code: 'ODO-401', name: 'Clínica Integral I', group_name: 'Grupo A', academic_period: '2026-II',
    teacher_name: 'Docente', description: null, is_active: true, student_count: 3,
    created_at: '2026-02-10T08:15:00Z', updated_at: '2026-02-10T08:15:00Z',
  },
  {
    id: 2, code: 'ODO-502', name: 'Cirugía Bucal II', group_name: 'Grupo B', academic_period: '2026-II',
    teacher_name: 'Docente', description: 'Turno tarde', is_active: true, student_count: 2,
    created_at: '2026-02-11T14:40:00Z', updated_at: '2026-02-11T14:40:00Z',
  },
  {
    id: 3, code: 'ODO-405', name: 'Endodoncia Clínica', group_name: 'Grupo C', academic_period: '2025-II',
    teacher_name: null, description: null, is_active: false, student_count: 1,
    created_at: '2025-08-04T09:05:00Z', updated_at: '2025-08-04T09:05:00Z',
  },
];
