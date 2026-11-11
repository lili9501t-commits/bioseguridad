import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { Rol } from '../models/usuario';

/** Permite el acceso solo a usuarios autenticados con el rol indicado. */
export const rolGuard =
  (rolPermitido: Rol): CanActivateFn =>
  () => {
    const auth = inject(Auth);
    const router = inject(Router);
    const rol = auth.rol();
    if (!rol) return router.parseUrl('/login');
    if (rol !== rolPermitido) return router.parseUrl(auth.rutaInicio(rol));
    return true;
  };

/** Evita volver al login si ya hay una sesión activa. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const rol = auth.rol();
  return rol ? inject(Router).parseUrl(auth.rutaInicio(rol)) : true;
};
