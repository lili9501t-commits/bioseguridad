import { Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ListaElementos } from '../../components/lista-elementos/lista-elementos';
import { RouterLink } from '@angular/router';
import { Inspecciones } from '../../services/inspecciones';
import { Auth } from '../../services/auth';
import { Estudiantes } from '../../services/estudiantes';

@Component({
  selector: 'app-resultado-escaneo',
  imports: [DatePipe, RouterLink, ListaElementos],
  templateUrl: './resultado-escaneo.html',
  styleUrl: './resultado-escaneo.css',
})
export class ResultadoEscaneo {
  private readonly inspecciones = inject(Inspecciones);
  private readonly usuario = inject(Auth).usuario;
  private readonly estudiantesSrv = inject(Estudiantes);

  /** Parámetro de ruta :id (withComponentInputBinding). */
  readonly id = input.required<string>();

  /** Solo se muestra si la inspección pertenece al estudiante logueado. */
  protected readonly registro = computed(() => {
    const reg = this.inspecciones.obtener(Number(this.id()));
    const u = this.usuario();
    const est = u ? this.estudiantesSrv.buscarPorCorreo(u.correo) : undefined;
    return reg && est && reg.student_code === est.student_code ? reg : undefined;
  });
}
