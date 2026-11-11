import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../services/auth';

interface ItemMenu {
  ruta: string;
  etiqueta: string;
  icono: string;
}

const MENU_DOCENTE: ItemMenu[] = [
  { ruta: '/docente/cursos', etiqueta: 'Mis Cursos', icono: 'bi-collection' },
  { ruta: '/docente/estudiantes', etiqueta: 'Gestión de Estudiantes', icono: 'bi-people' },
  { ruta: '/docente/historial', etiqueta: 'Historial General', icono: 'bi-clock-history' },
  { ruta: '/docente/panel-control', etiqueta: 'Panel de Inspección', icono: 'bi-camera-video' },
];

const MENU_ESTUDIANTE: ItemMenu[] = [
  { ruta: '/estudiante/escaneo', etiqueta: 'Nuevo Escaneo', icono: 'bi-camera-video' },
  { ruta: '/estudiante/historial', etiqueta: 'Mi Historial', icono: 'bi-clock-history' },
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  protected readonly usuario = this.auth.usuario;
  protected readonly menu = computed(() =>
    this.auth.rol() === 'docente' ? MENU_DOCENTE : MENU_ESTUDIANTE,
  );

  protected cerrarSesion(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
