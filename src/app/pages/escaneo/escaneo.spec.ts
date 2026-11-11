import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { Escaneo } from './escaneo';
import { Auth } from '../../services/auth';
import { Api } from '../../services/api';
import { Inspecciones } from '../../services/inspecciones';

describe('Escaneo', () => {
  let fixture: ComponentFixture<Escaneo>;
  let http: HttpTestingController;
  let api: Api;
  let el: HTMLElement;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Escaneo],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    TestBed.inject(Auth).login('rosalinda@gmail.com', '12345646');
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(Api);
    fixture = TestBed.createComponent(Escaneo);
    el = fixture.nativeElement;
    fixture.detectChanges();
    http.expectOne(`${api.baseUrl}/health`).flush({ estado: 'ok', modo_detector: 'YOLO' });
    http.expectOne(`${api.baseUrl}/camera/status`).flush({ is_running: false });
    await fixture.whenStable();
  });

  afterEach(() => fixture.destroy());

  it('muestra al estudiante con su grupo preseleccionado', () => {
    expect(el.textContent).toContain('24-1990');
    const select = el.querySelector<HTMLSelectElement>('#grupo')!;
    expect(select.value).toBe('1');
  });

  it('activa la cámara y muestra el stream en vivo', async () => {
    el.querySelector<HTMLButtonElement>('.btn-activar')!.click();
    http.expectOne(`${api.baseUrl}/camera/start`).flush({ is_running: true, resolution: '1280x720', fps: 30 });
    await fixture.whenStable();
    const img = el.querySelector<HTMLImageElement>('.video img')!;
    expect(img.src).toContain('/camera/stream');
  });

  it('captura, registra y redirige a resultados', async () => {
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    el.querySelector<HTMLButtonElement>('.btn-activar')!.click();
    http.expectOne(`${api.baseUrl}/camera/start`).flush({ is_running: true, resolution: '1280x720', fps: 30 });
    await fixture.whenStable();

    el.querySelector<HTMLButtonElement>('.btn-capturar')!.click();
    const req = http.expectOne(`${api.baseUrl}/inspections/capture-and-evaluate`);
    expect(req.request.body.save_image).toBe(true);
    req.flush({ overall_status: 'cumple', elements: [], summary: {}, image_quality: { warnings: [] } });

    const nuevo = TestBed.inject(Inspecciones).registros()[0];
    expect(nuevo.student_code).toBe('24-1990');
    expect(nav).toHaveBeenCalledWith(['/estudiante/resultado', nuevo.id]);
  });

  describe('HU-08: subir fotografía', () => {
    async function irAModoFoto() {
      const tabs = el.querySelectorAll<HTMLButtonElement>('.pestanias-captura .nav-link');
      tabs[1].click();
      await fixture.whenStable();
    }

    function elegirArchivo(archivo: File) {
      const input = el.querySelector<HTMLInputElement>('.zona-foto input[type="file"]')!;
      Object.defineProperty(input, 'files', { value: [archivo], configurable: true });
      input.dispatchEvent(new Event('change'));
    }

    it('oculta los botones de cámara y muestra la zona de carga', async () => {
      await irAModoFoto();
      expect(el.querySelector('.btn-activar')).toBeNull();
      expect(el.querySelector('.btn-capturar')).toBeNull();
      expect(el.querySelector('.zona-foto')).not.toBeNull();
      expect(el.querySelector('.btn-analizar')?.textContent).toContain('Analizar Fotografía y Ver Resultados');
    });

    it('rechaza archivos que no son JPG/PNG', async () => {
      await irAModoFoto();
      elegirArchivo(new File(['x'], 'notas.pdf', { type: 'application/pdf' }));
      await fixture.whenStable();
      expect(el.querySelector('.alerta-error')?.textContent).toContain('JPG');
    });

    it('envía la foto a /inspections/evaluate-image y redirige a resultados', async () => {
      const nav = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
      await irAModoFoto();
      elegirArchivo(new File(['img'], 'foto.png', { type: 'image/png' }));
      await new Promise((r) => setTimeout(r, 20)); // FileReader
      await fixture.whenStable();
      expect(el.querySelector('.preview img')).not.toBeNull();

      el.querySelector<HTMLButtonElement>('.btn-analizar')!.click();
      const req = http.expectOne(`${api.baseUrl}/inspections/evaluate-image`);
      const cuerpo = req.request.body as FormData;
      expect(cuerpo.get('student_code')).toBe('24-1990');
      expect(cuerpo.get('capture_mode')).toBe('upper_body');
      expect((cuerpo.get('file') as File).name).toBe('foto.png');
      req.flush({ overall_status: 'cumple', elements: [], summary: {}, image_quality: { warnings: [] } });

      const nuevo = TestBed.inject(Inspecciones).registros()[0];
      expect(nav).toHaveBeenCalledWith(['/estudiante/resultado', nuevo.id]);
    });
  });
});
