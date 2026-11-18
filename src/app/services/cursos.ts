import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Curso, CursoFormulario } from '../models/curso';
import { manejarError } from './api';

/**
 * Cursos desde la API (FastAPI + PostgreSQL):
 *   GET   /courses          listar
 *   POST  /courses          crear
 *   PUT   /courses/{id}     editar
 *   PATCH /courses/{id}     habilitar / deshabilitar ({ is_active })
 * Mantiene una copia en memoria (signal) para que todas las pantallas compartan la lista.
 */
@Injectable({ providedIn: 'root' })
export class Cursos {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/courses`;

  private readonly _cursos = signal<Curso[]>([]);
  readonly cursos = this._cursos.asReadonly();
  readonly activos = computed(() => this._cursos().filter((c) => c.is_active));

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  private cargado = false;

  /** Carga la lista desde la API. Con `forzar = false` solo la pide la primera vez. */
  cargar(forzar = false): void {
    if (this.cargado && !forzar) return;
    this.cargando.set(true);
    this.error.set(null);
    this.http
      .get<Curso[]>(this.url, { params: { limit: 100 } })
      .pipe(
        catchError(manejarError),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        next: (lista) => {
          this._cursos.set(lista);
          this.cargado = true;
        },
        error: (e: Error) => this.error.set(e.message),
      });
  }

  crear(datos: CursoFormulario): Observable<Curso> {
    return this.http.post<Curso>(this.url, datos).pipe(
      catchError(manejarError),
      tap((nuevo) => this._cursos.update((l) => [nuevo, ...l])),
    );
  }

  editar(id: number, datos: CursoFormulario): Observable<Curso> {
    return this.http.put<Curso>(`${this.url}/${id}`, datos).pipe(
      catchError(manejarError),
      tap((act) => this.reemplazar(act)),
    );
  }

  cambiarEstado(id: number, is_active: boolean): Observable<Curso> {
    return this.http.patch<Curso>(`${this.url}/${id}`, { is_active }).pipe(
      catchError(manejarError),
      tap((act) => this.reemplazar(act)),
    );
  }

  private reemplazar(curso: Curso): void {
    this._cursos.update((l) => l.map((c) => (c.id === curso.id ? curso : c)));
  }
}
