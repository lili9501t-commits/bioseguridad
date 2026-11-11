import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MiHistorial } from './mi-historial';
import { Auth } from '../../services/auth';
import { Inspecciones } from '../../services/inspecciones';

describe('MiHistorial', () => {
  let fixture: ComponentFixture<MiHistorial>;
  let el: HTMLElement;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({ imports: [MiHistorial] }).compileComponents();
    TestBed.inject(Auth).login('rosalinda@gmail.com', '12345646');
    fixture = TestBed.createComponent(MiHistorial);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('muestra solo las inspecciones del estudiante logueado', () => {
    const propias = TestBed.inject(Inspecciones).delEstudiante('24-1990').length;
    const todas = TestBed.inject(Inspecciones).registros().length;
    expect(propias).toBeLessThan(todas);
    expect(el.querySelector('.ind-valor')?.textContent?.trim()).toBe(String(propias));
    expect(el.textContent).not.toContain('Mariana');
    expect(el.textContent).not.toContain('Carlos');
  });

  it('no tiene botones de edición ni eliminación', () => {
    expect(el.querySelector('.bi-pencil, .bi-trash')).toBeNull();
  });

  it('abre el modal con el detalle de los 9 elementos', async () => {
    el.querySelector<HTMLButtonElement>('.btn-detalle')!.click();
    await fixture.whenStable();
    expect(el.querySelector('[role="dialog"]')).not.toBeNull();
    expect(el.querySelectorAll('[role="dialog"] li.elemento').length).toBe(9);
  });
});
