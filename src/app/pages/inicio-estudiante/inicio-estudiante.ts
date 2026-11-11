import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-inicio-estudiante',
  imports: [RouterLink],
  template: `
    @if (usuario(); as u) {
      <h1 class="h4 fw-bold mb-1">Bienvenido(a), {{ u.nombre }}</h1>
      <p class="text-secondary mb-4">{{ u.correo }}</p>
    }
    <div class="card border-0 shadow-sm" style="max-width: 520px">
      <div class="card-body">
        <h2 class="h6 fw-semibold"><i class="bi bi-clipboard2-check text-success"></i> Mis inspecciones de bioseguridad</h2>
        <p class="small text-secondary mb-3">
          Consulta el resultado (CUMPLE / INCUMPLE) de tus evaluaciones de EPP registradas por tus docentes.
        </p>
        <a routerLink="/estudiante/historial" class="btn btn-sm text-white" style="background:#0d9488">
          Ver historial <i class="bi bi-arrow-right"></i>
        </a>
      </div>
    </div>
  `,
})
export class InicioEstudiante {
  protected readonly usuario = inject(Auth).usuario;
}
