import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GestionEstudiantes } from './gestion-estudiantes';
import { Estudiantes } from '../../services/estudiantes';
import { CARRERA_POR_DEFECTO } from '../../models/estudiante';

describe('GestionEstudiantes', () => {
  let fixture: ComponentFixture<GestionEstudiantes>;
  let el: HTMLElement;
  let srv: Estudiantes;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionEstudiantes],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(GestionEstudiantes);
    srv = TestBed.inject(Estudiantes);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('muestra el título y una fila por estudiante', () => {
    expect(el.querySelector('h1')?.textContent).toContain('Gestión de Estudiantes');
    expect(el.querySelectorAll('tbody tr').length).toBe(srv.lista().length);
  });

  it('abre el modal con las pestañas al pulsar Crear Estudiante', async () => {
    el.querySelector<HTMLButtonElement>('.encabezado .btn-primario')!.click();
    await fixture.whenStable();
    const tabs = el.querySelectorAll('.pestanias button');
    expect(tabs.length).toBe(2);
    expect(tabs[0].textContent).toContain('Registro Individual');
    expect(tabs[1].textContent).toContain('Carga Masiva Excel');
    const carrera = el.querySelector<HTMLInputElement>('#career')!;
    expect(carrera.value).toBe(CARRERA_POR_DEFECTO);
  });

  it('rechaza matrícula duplicada', () => {
    const existente = srv.lista()[0];
    const r = srv.crear({
      student_code: existente.student_code, first_name: 'X', last_name: 'Y', email: 'nuevo@gmail.com',
      career: CARRERA_POR_DEFECTO, clinical_group: 1, photo_url: null, is_active: true,
    });
    expect(r.ok).toBe(false);
  });

  it('no elimina estudiantes con historial', () => {
    const conHistorial = srv.lista().find((e) => e.has_history)!;
    expect(srv.eliminar(conHistorial.id)).toBe(false);
  });
});
