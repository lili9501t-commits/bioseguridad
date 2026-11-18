import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MisCursos } from './mis-cursos';
import { Cursos } from '../../services/cursos';
import { environment } from '../../../environments/environment';
import { CURSOS_PRUEBA } from '../../testing/cursos.fixture';

const URL = `${environment.apiUrl}/courses`;

describe('MisCursos (API /courses)', () => {
  let fixture: ComponentFixture<MisCursos>;
  let el: HTMLElement;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisCursos],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MisCursos);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  async function cargarCursos() {
    const req = http.expectOne((r) => r.url === URL && r.method === 'GET');
    expect(req.request.params.get('limit')).toBe('100');
    req.flush(CURSOS_PRUEBA);
    await fixture.whenStable();
  }

  it('lista los cursos de GET /courses con student_count de la API', async () => {
    await cargarCursos();
    const tarjetas = el.querySelectorAll('article.tarjeta');
    expect(tarjetas.length).toBe(3);
    expect(tarjetas[0].textContent).toContain('ODO-401');
    expect(tarjetas[0].textContent).toContain('Clínica Integral I - Grupo A');
    expect(tarjetas[0].querySelector('.detalle dd')?.textContent?.trim()).toBe('3');
    // 3 + 2 estudiantes en cursos activos
    expect(el.querySelectorAll('.ind-valor')[1].textContent).toContain('5');
  });

  it('muestra error y permite reintentar si la API no responde', async () => {
    http.expectOne((r) => r.url === URL).error(new ProgressEvent('error'), { status: 0 });
    await fixture.whenStable();
    expect(el.querySelector('.estado-carga.error')?.textContent).toContain('No se pudo conectar');
    el.querySelector<HTMLButtonElement>('.estado-carga button')!.click();
    await cargarCursos();
    expect(el.querySelectorAll('article.tarjeta').length).toBe(3);
  });

  it('crea un curso con POST /courses', async () => {
    await cargarCursos();
    el.querySelector<HTMLButtonElement>('.encabezado .btn-primario')!.click();
    await fixture.whenStable();
    const escribir = (id: string, valor: string) => {
      const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
      input.value = valor;
      input.dispatchEvent(new Event('input'));
    };
    escribir('code', 'odo-999');
    escribir('name', 'Prótesis Fija');
    escribir('group_name', 'Grupo D');
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));

    const req = http.expectOne((r) => r.url === URL && r.method === 'POST');
    expect(req.request.body).toEqual(
      expect.objectContaining({ code: 'ODO-999', name: 'Prótesis Fija', group_name: 'Grupo D', is_active: true }),
    );
    req.flush({ ...CURSOS_PRUEBA[0], ...req.request.body, id: 10, student_count: 0 });
    await fixture.whenStable();
    expect(el.querySelector('[role="dialog"]')).toBeNull();
    expect(el.querySelectorAll('article.tarjeta').length).toBe(4);
  });

  it('muestra el error de la API (sigla duplicada) dentro del modal', async () => {
    await cargarCursos();
    const btnEditar = el.querySelector<HTMLButtonElement>('article.tarjeta .btn-icono')!;
    btnEditar.click();
    await fixture.whenStable();
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'));
    const req = http.expectOne((r) => r.url === `${URL}/1` && r.method === 'PUT');
    req.flush({ detail: "El código 'ODO-401' ya está asignado a otro curso." }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();
    expect(el.querySelector('[role="dialog"] .alerta-error')?.textContent).toContain('ya está asignado');
  });

  it('deshabilita con PATCH /courses/{id} y revierte el switch si falla', async () => {
    await cargarCursos();
    const sw = el.querySelector<HTMLInputElement>('article.tarjeta .switch input')!;
    sw.checked = false;
    sw.dispatchEvent(new Event('change'));
    const req = http.expectOne((r) => r.url === `${URL}/1` && r.method === 'PATCH');
    expect(req.request.body).toEqual({ is_active: false });
    req.flush({ detail: 'Error' }, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    expect(sw.checked).toBe(true);
    expect(TestBed.inject(Cursos).cursos()[0].is_active).toBe(true);
  });
});
