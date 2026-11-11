import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Auth } from '../../services/auth';

/** Estructura principal (sidebar + cabecera + contenido) compartida por ambos roles. */
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Sidebar],
  template: `
    <div class="d-flex">
      <app-sidebar />
      <div class="flex-grow-1 d-flex flex-column" style="height: 100vh; min-width: 0">
        <header class="cabecera">
          <i class="bi bi-bank2 fs-5" style="color:#0f5f56"></i>
          <div class="flex-grow-1 lh-sm">
            <strong>Universidad Mayor, Real y Pontificia de San Francisco Xavier de Chuquisaca</strong>
            <small>Facultad de Odontología • Sistema de Control de Bioseguridad IA</small>
          </div>
          @if (usuario(); as u) {
            <span class="chip-rol">● {{ u.rol === 'docente' ? 'Docente' : 'Estudiante' }}</span>
            <span class="avatar" [title]="u.nombre"><i class="bi bi-person-fill"></i></span>
          }
        </header>
        <main class="flex-grow-1 overflow-auto p-4" style="background: #f1f5f9">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: `
    .cabecera {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.7rem 1.5rem; background: #fff; border-bottom: 1px solid #e2e8f0;
    }
    .cabecera strong { display: block; font-size: 0.8rem; color: #0f172a; }
    .cabecera small { font-size: 0.72rem; color: #64748b; }
    .chip-rol {
      padding: 0.2rem 0.6rem; font-size: 0.7rem; font-weight: 600; color: #0f5f56;
      border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc;
    }
    .avatar {
      display: grid; place-items: center; width: 32px; height: 32px;
      color: #fff; border-radius: 8px; background: #0f5f56;
    }
  `,
})
export class Layout {
  protected readonly usuario = inject(Auth).usuario;
}
