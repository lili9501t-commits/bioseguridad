import { Injectable, signal } from '@angular/core';
import { RegistroInspeccion } from '../models/inspeccion';
import { inspeccionesMock } from './inspecciones.mock';

/**
 * Registro de inspecciones. La API todavía no persiste inspecciones en PostgreSQL;
 * cuando exista (POST /inspections y GET /inspections?student_code=), reemplazar aquí.
 */
@Injectable({ providedIn: 'root' })
export class Inspecciones {
  private readonly _registros = signal<RegistroInspeccion[]>(inspeccionesMock());
  readonly registros = this._registros.asReadonly();

  registrar(datos: Omit<RegistroInspeccion, 'id'>): RegistroInspeccion {
    const id = Math.max(0, ...this._registros().map((r) => r.id)) + 1;
    const registro: RegistroInspeccion = { ...datos, id };
    this._registros.update((l) => [registro, ...l]);
    return registro;
  }

  obtener(id: number): RegistroInspeccion | undefined {
    return this._registros().find((r) => r.id === id);
  }

  /** Solo las inspecciones de un estudiante, de la más reciente a la más antigua. */
  delEstudiante(studentCode: string): RegistroInspeccion[] {
    return this._registros()
      .filter((r) => r.student_code === studentCode)
      .sort((a, b) => b.resultado.inspection_timestamp.localeCompare(a.resultado.inspection_timestamp));
  }
}
