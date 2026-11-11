import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ElementEvaluationResult } from '../../models/inspeccion';

/** Lista de los 9 elementos de bioseguridad con su dictamen (verde / rojo / gris). */
@Component({
  selector: 'app-lista-elementos',
  imports: [DecimalPipe],
  templateUrl: './lista-elementos.html',
  styleUrl: './lista-elementos.css',
})
export class ListaElementos {
  readonly elementos = input.required<ElementEvaluationResult[]>();
}
