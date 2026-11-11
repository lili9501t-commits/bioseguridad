import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Api } from './api';

describe('Api', () => {
  let api: Api;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(Api);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta /health', () => {
    let estado = '';
    api.health().subscribe((r) => (estado = r.estado));
    http.expectOne(`${api.baseUrl}/health`).flush({ estado: 'ok' });
    expect(estado).toBe('ok');
  });

  it('envía la captura a /inspections/capture-and-evaluate', () => {
    api.capturarYEvaluar({ student_code: '24-1589', capture_mode: 'upper_body' }).subscribe();
    const req = http.expectOne(`${api.baseUrl}/inspections/capture-and-evaluate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.student_code).toBe('24-1589');
    req.flush({});
  });

  it('traduce el detail de FastAPI a un mensaje de error', () => {
    let mensaje = '';
    api.iniciarCamara().subscribe({ error: (e: Error) => (mensaje = e.message) });
    http
      .expectOne(`${api.baseUrl}/camera/start`)
      .flush({ detail: 'Cámara no disponible' }, { status: 503, statusText: 'Service Unavailable' });
    expect(mensaje).toBe('Cámara no disponible');
  });
});
