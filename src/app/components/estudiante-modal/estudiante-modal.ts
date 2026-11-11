import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import readXlsxFile from 'read-excel-file';
import { Curso } from '../../models/curso';
import { CARRERA_POR_DEFECTO, Estudiante, EstudianteFormulario } from '../../models/estudiante';
import { Estudiantes } from '../../services/estudiantes';

type Pestania = 'individual' | 'excel';

interface FilaExcel {
  datos: EstudianteFormulario;
  error: string | null;
}

const TAMANIO_MAX_FOTO = 2 * 1024 * 1024; // 2 MB
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Encabezados aceptados en el Excel -> campo de la BD. */
const ENCABEZADOS: Record<string, keyof EstudianteFormulario> = {
  student_code: 'student_code',
  matricula: 'student_code',
  'matricula/ru': 'student_code',
  ru: 'student_code',
  first_name: 'first_name',
  nombres: 'first_name',
  nombre: 'first_name',
  last_name: 'last_name',
  apellidos: 'last_name',
  apellido: 'last_name',
  email: 'email',
  correo: 'email',
};

const normalizar = (t: unknown) =>
  String(t ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

@Component({
  selector: 'app-estudiante-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './estudiante-modal.html',
  styleUrl: './estudiante-modal.css',
})
export class EstudianteModal implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly estudiantesSrv = inject(Estudiantes);

  /** Estudiante a editar; null = crear. */
  readonly estudiante = input<Estudiante | null>(null);
  /** Cursos (grupos clínicos) habilitados del docente. */
  readonly cursos = input.required<Curso[]>();
  /** Grupo preseleccionado (p. ej. al venir desde "Gestionar Alumnos"). */
  readonly grupoInicial = input<number | null>(null);

  readonly cerrar = output<void>();
  readonly guardado = output<string>();

  protected readonly pestania = signal<Pestania>('individual');
  protected readonly error = signal<string | null>(null);
  protected readonly fotoPreview = signal<string | null>(null);

  protected readonly form = this.fb.group({
    student_code: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/^\d{2}-\d{3,5}$/)]),
    first_name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]),
    last_name: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(60)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    career: this.fb.nonNullable.control({ value: CARRERA_POR_DEFECTO, disabled: true }),
    clinical_group: this.fb.control<number | null>(null, Validators.required),
    is_active: this.fb.nonNullable.control(true),
  });

  // Carga masiva
  protected readonly grupoExcel = signal<number | null>(null);
  protected readonly archivoExcel = signal<string | null>(null);
  protected readonly filasExcel = signal<FilaExcel[]>([]);
  protected readonly leyendoExcel = signal(false);

  ngOnInit(): void {
    const e = this.estudiante();
    if (e) {
      this.form.patchValue({
        student_code: e.student_code,
        first_name: e.first_name,
        last_name: e.last_name,
        email: e.email,
        clinical_group: e.clinical_group,
        is_active: e.is_active,
      });
      this.fotoPreview.set(e.photo_url);
    } else {
      this.form.patchValue({ clinical_group: this.grupoInicial() });
      this.grupoExcel.set(this.grupoInicial());
    }
  }

  protected etiquetaCurso(c: Curso): string {
    return `${c.nombre} - Grupo ${c.grupo} (${c.sigla}, ${c.turno})`;
  }

  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && c.touched;
  }

  // ---------- Registro individual ----------
  protected seleccionarFoto(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith('image/')) {
      this.error.set('La foto debe ser una imagen (JPG o PNG).');
      return;
    }
    if (archivo.size > TAMANIO_MAX_FOTO) {
      this.error.set('La foto no debe superar los 2 MB.');
      return;
    }
    this.error.set(null);
    const lector = new FileReader();
    lector.onload = () => this.fotoPreview.set(lector.result as string);
    lector.readAsDataURL(archivo);
  }

  protected guardarIndividual(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos: EstudianteFormulario = {
      student_code: v.student_code.trim(),
      first_name: v.first_name.trim(),
      last_name: v.last_name.trim(),
      email: v.email.trim().toLowerCase(),
      career: CARRERA_POR_DEFECTO,
      clinical_group: Number(v.clinical_group),
      photo_url: this.fotoPreview(),
      is_active: v.is_active,
    };
    const editando = this.estudiante();
    const r = editando
      ? this.estudiantesSrv.editar(editando.id, datos)
      : this.estudiantesSrv.crear(datos);
    if (!r.ok) {
      this.error.set(r.error);
      return;
    }
    this.guardado.emit(
      editando ? 'Estudiante actualizado correctamente.' : 'Estudiante registrado correctamente.',
    );
  }

  // ---------- Carga masiva Excel ----------
  protected async seleccionarExcel(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    this.filasExcel.set([]);
    this.error.set(null);
    if (!archivo) return;
    if (!/\.xlsx$/i.test(archivo.name)) {
      this.error.set('Seleccione un archivo Excel (.xlsx).');
      input.value = '';
      return;
    }
    this.archivoExcel.set(archivo.name);
    this.leyendoExcel.set(true);
    try {
      const filas = await readXlsxFile(archivo);
      this.filasExcel.set(this.mapearFilas(filas));
      if (!this.filasExcel().length) this.error.set('El archivo no contiene filas de estudiantes.');
    } catch {
      this.error.set('No se pudo leer el archivo. Verifique que sea un Excel válido.');
    } finally {
      this.leyendoExcel.set(false);
    }
  }

  private mapearFilas(filas: unknown[][]): FilaExcel[] {
    if (filas.length < 2) return [];
    const columnas = filas[0].map((h) => ENCABEZADOS[normalizar(h)]);
    const faltantes = (['student_code', 'first_name', 'last_name', 'email'] as const).filter(
      (c) => !columnas.includes(c),
    );
    if (faltantes.length) {
      this.error.set(`Faltan columnas en el Excel: ${faltantes.join(', ')}.`);
      return [];
    }
    return filas
      .slice(1)
      .filter((f) => f.some((celda) => String(celda ?? '').trim() !== ''))
      .map((f) => {
        const datos: EstudianteFormulario = {
          student_code: '',
          first_name: '',
          last_name: '',
          email: '',
          career: CARRERA_POR_DEFECTO,
          clinical_group: null,
          photo_url: null,
          is_active: true,
        };
        columnas.forEach((campo, i) => {
          if (campo) (datos as unknown as Record<string, string>)[campo] = String(f[i] ?? '').trim();
        });
        datos.email = datos.email.toLowerCase();
        let error: string | null = null;
        if (!datos.student_code || !datos.first_name || !datos.last_name || !datos.email) {
          error = 'Datos incompletos';
        } else if (!EMAIL_RE.test(datos.email)) {
          error = 'Correo no válido';
        }
        return { datos, error };
      });
  }

  protected filasValidas(): FilaExcel[] {
    return this.filasExcel().filter((f) => !f.error);
  }

  protected importarExcel(): void {
    const grupo = this.grupoExcel();
    if (grupo === null) {
      this.error.set('Seleccione el grupo clínico al que se asignarán los estudiantes.');
      return;
    }
    const validas = this.filasValidas().map((f) => ({ ...f.datos, clinical_group: grupo }));
    if (!validas.length) {
      this.error.set('No hay filas válidas para importar.');
      return;
    }
    const { creados, errores } = this.estudiantesSrv.crearLote(validas);
    if (errores.length && !creados) {
      this.error.set(errores.slice(0, 3).join(' '));
      return;
    }
    const omitidos = errores.length + this.filasExcel().length - validas.length;
    this.guardado.emit(
      `${creados} estudiante(s) importado(s)` + (omitidos ? `, ${omitidos} omitido(s) por errores o duplicados.` : '.'),
    );
  }
}
