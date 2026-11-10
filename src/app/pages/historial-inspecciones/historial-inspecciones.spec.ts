import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialInspecciones } from './historial-inspecciones';

describe('HistorialInspecciones', () => {
  let component: HistorialInspecciones;
  let fixture: ComponentFixture<HistorialInspecciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialInspecciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialInspecciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
