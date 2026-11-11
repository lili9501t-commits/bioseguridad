import { Injectable, computed, signal } from '@angular/core';
import { Curso, CursoFormulario } from '../models/curso';

/**
 * Datos simulados (Mock Data). Cuando esté la API, reemplazar cada método
 * por su petición HTTP (GET /cursos, POST /cursos, PUT /cursos/:id, PATCH /cursos/:id/estado).
 */
const CURSOS_MOCK: Curso[] = [
  {
    id: 1,
    sigla: 'ODO-401',
    nombre: 'Clínica Integral I',
    grupo: 'A',
    turno: 'Mañana',
    anio: 2026,
    activo: true,
    fechaRegistro: '2026-02-10T08:15:00',
  },
  {
    id: 2,
    sigla: 'ODO-502',
    nombre: 'Cirugía Bucal II',
    grupo: 'B',
    turno: 'Tarde',
    anio: 2026,
    activo: true,
    fechaRegistro: '2026-02-11T14:40:00',
  },
  {
    id: 3,
    sigla: 'ODO-405',
    nombre: 'Endodoncia Clínica',
    grupo: 'C',
    turno: 'Mañana',
    anio: 2025,
    activo: false,
    fechaRegistro: '2025-08-04T09:05:00',
  },
];

@Injectable({ providedIn: 'root' })
export class Cursos {
  private readonly _cursos = signal<Curso[]>(CURSOS_MOCK);

  readonly cursos = this._cursos.asReadonly();
  readonly activos = computed(() => this._cursos().filter((c) => c.activo));

  crear(datos: CursoFormulario): Curso {
    const nuevo: Curso = {
      ...datos,
      id: Math.max(0, ...this._cursos().map((c) => c.id)) + 1,
      activo: true,
      fechaRegistro: new Date().toISOString(),
    };
    this._cursos.update((lista) => [nuevo, ...lista]);
    return nuevo;
  }

  editar(id: number, datos: CursoFormulario): void {
    this._cursos.update((lista) => lista.map((c) => (c.id === id ? { ...c, ...datos } : c)));
  }

  cambiarEstado(id: number, activo: boolean): void {
    this._cursos.update((lista) => lista.map((c) => (c.id === id ? { ...c, activo } : c)));
  }
}
