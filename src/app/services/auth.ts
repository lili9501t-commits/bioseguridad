import { Injectable, computed, signal } from '@angular/core';
import { Rol, Usuario } from '../models/usuario';

interface UsuarioMock extends Usuario {
  password: string;
}

/**
 * Datos simulados (Mock Data) mientras se integra el backend FastAPI + PostgreSQL.
 * Reemplazar `login()` por una petición HTTP real cuando el esquema esté listo.
 */
const USUARIOS_MOCK: UsuarioMock[] = [
  {
    id: 1,
    nombre: 'Docente',
    correo: 'docente@gmail.com',
    password: '12345646',
    rol: 'docente',
  },
  {
    id: 2,
    nombre: 'Rosalinda',
    correo: 'rosalinda@gmail.com',
    password: '12345646',
    rol: 'estudiante',
  },
];

const CLAVE_SESION = 'bioseguridad.sesion';

export type ResultadoLogin =
  | { ok: true; usuario: Usuario }
  | { ok: false; error: string };

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly _usuario = signal<Usuario | null>(this.leerSesion());

  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);
  readonly rol = computed(() => this._usuario()?.rol ?? null);

  /**
   * El rol (docente / estudiante) NO lo elige el usuario: se obtiene del
   * registro del correo en la base de datos (por ahora, datos simulados).
   */
  login(correo: string, password: string): ResultadoLogin {
    const encontrado = USUARIOS_MOCK.find(
      (u) => u.correo === correo.trim().toLowerCase() && u.password === password,
    );
    if (!encontrado) {
      return { ok: false, error: 'Correo o contraseña incorrectos.' };
    }
    const { password: _omitida, ...usuario } = encontrado;
    this._usuario.set(usuario);
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
    return { ok: true, usuario };
  }

  logout(): void {
    this._usuario.set(null);
    sessionStorage.removeItem(CLAVE_SESION);
  }

  /** Ruta de inicio según el rol del usuario. */
  rutaInicio(rol: Rol): string {
    return rol === 'docente' ? '/docente' : '/estudiante';
  }

  private leerSesion(): Usuario | null {
    try {
      const raw = sessionStorage.getItem(CLAVE_SESION);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  }
}
