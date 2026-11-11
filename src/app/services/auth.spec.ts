import { TestBed } from '@angular/core/testing';
import { Auth } from './auth';

describe('Auth', () => {
  let auth: Auth;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    auth = TestBed.inject(Auth);
  });

  it('inicia sesión como docente con credenciales válidas', () => {
    const r = auth.login('docente@gmail.com', '12345646');
    expect(r.ok).toBe(true);
    expect(auth.rol()).toBe('docente');
  });

  it('asigna el rol de estudiante según el correo registrado', () => {
    const r = auth.login('rosalinda@gmail.com', '12345646');
    expect(r.ok).toBe(true);
    expect(auth.rol()).toBe('estudiante');
  });

  it('rechaza contraseña incorrecta', () => {
    expect(auth.login('docente@gmail.com', 'mala').ok).toBe(false);
  });

  it('cierra sesión', () => {
    auth.login('docente@gmail.com', '12345646');
    auth.logout();
    expect(auth.usuario()).toBeNull();
  });
});
