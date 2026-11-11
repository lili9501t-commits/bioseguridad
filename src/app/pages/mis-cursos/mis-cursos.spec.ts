import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MisCursos } from './mis-cursos';
import { Cursos } from '../../services/cursos';

describe('MisCursos', () => {
  let fixture: ComponentFixture<MisCursos>;
  let el: HTMLElement;
  let cursos: Cursos;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisCursos],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(MisCursos);
    cursos = TestBed.inject(Cursos);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('muestra una tarjeta por curso', () => {
    expect(el.querySelectorAll('article.tarjeta').length).toBe(cursos.cursos().length);
  });

  it('crea un curso nuevo habilitado con fecha de registro', () => {
    const antes = cursos.cursos().length;
    const nuevo = cursos.crear({
      sigla: 'ODO-999', nombre: 'Prueba', grupo: 'D', turno: 'Tarde', anio: 2026,
    });
    expect(cursos.cursos().length).toBe(antes + 1);
    expect(nuevo.activo).toBe(true);
    expect(nuevo.fechaRegistro).toBeTruthy();
  });

  it('edita un curso', () => {
    const c = cursos.cursos()[0];
    cursos.editar(c.id, { ...c, nombre: 'Editado' });
    expect(cursos.cursos()[0].nombre).toBe('Editado');
  });

  it('deshabilita un curso con el switch', async () => {
    const id = cursos.cursos()[0].id;
    const sw = el.querySelector<HTMLInputElement>('article.tarjeta .switch input')!;
    sw.checked = false;
    sw.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(cursos.cursos().find((c) => c.id === id)!.activo).toBe(false);
  });
});
