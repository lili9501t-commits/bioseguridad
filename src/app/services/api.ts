import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CameraConfigRequest,
  CameraStatusResponse,
  CaptureInspectionRequest,
  CaptureMode,
  CatalogoBioseguridad,
  HealthResponse,
  InspectionEvaluationResponse,
} from '../models/inspeccion';

/**
 * Cliente HTTP de la API de reconocimiento de bioseguridad (FastAPI).
 * Documentación interactiva de la API: {apiUrl}/docs
 */
@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);
  readonly baseUrl = environment.apiUrl;

  // ---------- Estado ----------
  health(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`).pipe(catchError(manejarError));
  }

  // ---------- Cámara ----------
  estadoCamara(): Observable<CameraStatusResponse> {
    return this.http
      .get<CameraStatusResponse>(`${this.baseUrl}/camera/status`)
      .pipe(catchError(manejarError));
  }

  iniciarCamara(config?: CameraConfigRequest): Observable<CameraStatusResponse> {
    return this.http
      .post<CameraStatusResponse>(`${this.baseUrl}/camera/start`, config ?? null)
      .pipe(catchError(manejarError));
  }

  detenerCamara(): Observable<CameraStatusResponse> {
    return this.http
      .post<CameraStatusResponse>(`${this.baseUrl}/camera/stop`, null)
      .pipe(catchError(manejarError));
  }

  /** URL del video MJPEG: se usa directo en <img [src]="...">, no con HttpClient. */
  urlStream(captureMode: CaptureMode = 'upper_body', showGuide = true): string {
    const params = new HttpParams().set('capture_mode', captureMode).set('show_guide', showGuide);
    return `${this.baseUrl}/camera/stream?${params}`;
  }

  /** URL de una instantánea JPEG (agregar ?t=Date.now() para evitar caché). */
  urlSnapshot(): string {
    return `${this.baseUrl}/camera/snapshot?t=${Date.now()}`;
  }

  // ---------- Inspecciones ----------
  catalogo(): Observable<CatalogoBioseguridad> {
    return this.http
      .get<CatalogoBioseguridad>(`${this.baseUrl}/inspections/catalog`)
      .pipe(catchError(manejarError));
  }

  capturarYEvaluar(req: CaptureInspectionRequest): Observable<InspectionEvaluationResponse> {
    return this.http
      .post<InspectionEvaluationResponse>(`${this.baseUrl}/inspections/capture-and-evaluate`, req)
      .pipe(catchError(manejarError));
  }

  evaluarImagen(
    archivo: File,
    opciones: Omit<CaptureInspectionRequest, 'save_image'> & { save_image?: boolean } = {},
  ): Observable<InspectionEvaluationResponse> {
    const form = new FormData();
    form.append('file', archivo);
    if (opciones.capture_mode) form.append('capture_mode', opciones.capture_mode);
    if (opciones.student_code) form.append('student_code', opciones.student_code);
    if (opciones.save_image !== undefined) form.append('save_image', String(opciones.save_image));
    if (opciones.include_base64_image !== undefined)
      form.append('include_base64_image', String(opciones.include_base64_image));
    return this.http
      .post<InspectionEvaluationResponse>(`${this.baseUrl}/inspections/evaluate-image`, form)
      .pipe(catchError(manejarError));
  }
}

/** Convierte errores HTTP de FastAPI ({ detail }) en un Error con mensaje legible. */
function manejarError(err: HttpErrorResponse): Observable<never> {
  let mensaje: string;
  if (err.status === 0) {
    mensaje = 'No se pudo conectar con la API. Verifique que el servidor esté encendido.';
  } else if (typeof err.error?.detail === 'string') {
    mensaje = err.error.detail;
  } else if (Array.isArray(err.error?.detail)) {
    mensaje = err.error.detail.map((d: { msg: string }) => d.msg).join(' ');
  } else {
    mensaje = `Error ${err.status}: ${err.statusText}`;
  }
  return throwError(() => new Error(mensaje));
}
