import { Routes } from '@angular/router';
import { invitadoGuard, rolGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'docente',
    canActivate: [rolGuard('docente')],
    loadComponent: () => import('./components/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'cursos' },
      {
        path: 'cursos',
        loadComponent: () => import('./pages/mis-cursos/mis-cursos').then((m) => m.MisCursos),
      },
      {
        path: 'panel-control',
        loadComponent: () =>
          import('./pages/panel-control/panel-control').then((m) => m.PanelControl),
      },
      {
        path: 'historial',
        loadComponent: () =>
          import('./pages/historial-inspecciones/historial-inspecciones').then(
            (m) => m.HistorialInspecciones,
          ),
      },
      {
        path: 'estudiantes',
        loadComponent: () =>
          import('./pages/gestion-estudiantes/gestion-estudiantes').then(
            (m) => m.GestionEstudiantes,
          ),
      },
    ],
  },
  {
    path: 'estudiante',
    canActivate: [rolGuard('estudiante')],
    loadComponent: () => import('./components/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'escaneo' },
      {
        path: 'escaneo',
        loadComponent: () => import('./pages/escaneo/escaneo').then((m) => m.Escaneo),
      },
      {
        path: 'resultado/:id',
        loadComponent: () =>
          import('./pages/resultado-escaneo/resultado-escaneo').then((m) => m.ResultadoEscaneo),
      },
      {
        path: 'historial',
        loadComponent: () => import('./pages/mi-historial/mi-historial').then((m) => m.MiHistorial),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
