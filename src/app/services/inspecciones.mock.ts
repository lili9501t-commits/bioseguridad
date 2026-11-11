import {
  CaptureMode,
  ElementEvaluationResult,
  EvaluationStatus,
  InspectionEvaluationResponse,
  RegistroInspeccion,
} from '../models/inspeccion';

/**
 * Inspecciones históricas simuladas (Mock Data) hasta que la API exponga
 * GET /inspections?student_code=... desde PostgreSQL.
 */
const CATALOGO = [
  { id: 'mandil_clinico', name: 'Mandil clínico', zona: 'torso_arms', superior: true },
  { id: 'pijama_clinico', name: 'Pijama clínico', zona: 'torso_arms', superior: true },
  { id: 'zapatos_clinicos', name: 'Zapatos clínicos', zona: 'feet', superior: false },
  { id: 'cubre_zapatos', name: 'Cubre zapatos', zona: 'feet', superior: false },
  { id: 'barbijo', name: 'Barbijo', zona: 'nose_mouth', superior: true },
  { id: 'gafas_proteccion', name: 'Gafas de protección tipo Google', zona: 'eyes', superior: true },
  { id: 'protector_facial', name: 'Protector facial', zona: 'face', superior: true },
  { id: 'gorro_bioseguridad', name: 'Gorro de bioseguridad', zona: 'head', superior: true },
  { id: 'guantes_latex', name: 'Guantes de látex', zona: 'hands', superior: true },
];

const DETALLE_INCUMPLE: Record<string, string> = {
  barbijo: 'Barbijo debajo de la nariz o del mentón, o visiblemente mal colocado.',
  gorro_bioseguridad: 'Gorro mal colocado: cabello expuesto.',
  guantes_latex: 'No se detectaron guantes de látex en manos visibles.',
  mandil_clinico: 'Mandil de manga corta o ausente.',
  gafas_proteccion: 'No se detectaron gafas de protección.',
  cubre_zapatos: 'Cubre zapatos mal colocado o roto.',
};

function construirResultado(
  fecha: Date,
  studentCode: string,
  modo: CaptureMode,
  incumplidos: string[],
): InspectionEvaluationResponse {
  const elements: ElementEvaluationResult[] = CATALOGO.map((c, i) => {
    let status: EvaluationStatus = 'cumple';
    let detalle = `${c.name} detectado y colocado correctamente.`;
    if (modo === 'upper_body' && !c.superior) {
      status = 'no_evaluado';
      detalle = `No evaluado en modalidad 'upper_body' (corresponde a inspección de cuerpo completo).`;
    } else if (incumplidos.includes(c.id)) {
      status = 'incumple';
      detalle = DETALLE_INCUMPLE[c.id] ?? `${c.name} ausente o mal colocado.`;
    }
    return {
      order: i + 1,
      element_id: c.id,
      name: c.name,
      status,
      is_visible_zone: status !== 'no_evaluado',
      detected_present: status === 'no_evaluado' ? null : status === 'cumple',
      confidence: status === 'no_evaluado' ? null : 0.7 + ((i * 7) % 25) / 100,
      condition_code: status,
      condition_detail: detalle,
      bounding_box: null,
    };
  });
  const cuenta = (s: EvaluationStatus) => elements.filter((e) => e.status === s);
  const incumple = cuenta('incumple');
  const evaluados = elements.length - cuenta('no_evaluado').length;
  return {
    inspection_timestamp: fecha.toISOString(),
    student_code: studentCode,
    capture_mode: modo,
    overall_status: incumple.length ? 'incumple' : 'cumple',
    overall_message: incumple.length
      ? `Incumple: se identificaron ${incumple.length} elemento(s) con incumplimiento de ${evaluados} evaluado(s).`
      : `Cumple: los ${evaluados} elementos evaluados están correctamente colocados.`,
    model_mode: 'mock',
    image_quality: {
      resolution: '1280x720',
      mean_brightness: 120,
      sharpness_score: 180,
      brightness_ok: true,
      sharpness_ok: true,
      person_detected: true,
      visible_body_zones: {},
      warnings: [],
    },
    summary: {
      total_elements: elements.length,
      evaluated_count: evaluados,
      compliant_count: cuenta('cumple').length,
      non_compliant_count: incumple.length,
      not_evaluated_count: cuenta('no_evaluado').length,
      compliant_elements: cuenta('cumple').map((e) => e.name),
      missing_elements: incumple.map((e) => e.name),
      incorrect_conditions: [],
      not_evaluated_elements: cuenta('no_evaluado').map((e) => e.name),
    },
    elements,
    non_visual_conditions_disclaimer: [],
    saved_image_path: null,
    annotated_image_base64: null,
  };
}

interface Semilla {
  diasAtras: number;
  hora: string;
  student_code: string;
  estudiante_nombre: string;
  clinical_group: number;
  grupo_nombre: string;
  modo: CaptureMode;
  incumplidos: string[];
}

const SEMILLAS: Semilla[] = [
  // Rosalinda Mamani Cruz (24-1990) — Clínica Integral I - Grupo A
  { diasAtras: 1, hora: '08:10', student_code: '24-1990', estudiante_nombre: 'Rosalinda Mamani Cruz', clinical_group: 1, grupo_nombre: 'Clínica Integral I - Grupo A', modo: 'upper_body', incumplidos: ['barbijo'] },
  { diasAtras: 3, hora: '09:15', student_code: '24-1990', estudiante_nombre: 'Rosalinda Mamani Cruz', clinical_group: 1, grupo_nombre: 'Clínica Integral I - Grupo A', modo: 'full_body', incumplidos: [] },
  { diasAtras: 6, hora: '16:00', student_code: '24-1990', estudiante_nombre: 'Rosalinda Mamani Cruz', clinical_group: 1, grupo_nombre: 'Clínica Integral I - Grupo A', modo: 'upper_body', incumplidos: [] },
  { diasAtras: 8, hora: '10:45', student_code: '24-1990', estudiante_nombre: 'Rosalinda Mamani Cruz', clinical_group: 1, grupo_nombre: 'Clínica Integral I - Grupo A', modo: 'full_body', incumplidos: ['cubre_zapatos'] },
  { diasAtras: 13, hora: '14:20', student_code: '24-1990', estudiante_nombre: 'Rosalinda Mamani Cruz', clinical_group: 1, grupo_nombre: 'Clínica Integral I - Grupo A', modo: 'upper_body', incumplidos: ['gorro_bioseguridad', 'guantes_latex'] },
  { diasAtras: 15, hora: '08:30', student_code: '24-1990', estudiante_nombre: 'Rosalinda Mamani Cruz', clinical_group: 1, grupo_nombre: 'Clínica Integral I - Grupo A', modo: 'upper_body', incumplidos: [] },
  { diasAtras: 20, hora: '11:05', student_code: '24-1990', estudiante_nombre: 'Rosalinda Mamani Cruz', clinical_group: 1, grupo_nombre: 'Clínica Integral I - Grupo A', modo: 'full_body', incumplidos: [] },
  // Otros estudiantes (no deben verse en el historial de Rosalinda)
  { diasAtras: 2, hora: '08:00', student_code: '24-1644', estudiante_nombre: 'Mariana Rocío Rojas Gutiérrez', clinical_group: 1, grupo_nombre: 'Clínica Integral I - Grupo A', modo: 'upper_body', incumplidos: ['mandil_clinico'] },
  { diasAtras: 4, hora: '14:40', student_code: '24-1802', estudiante_nombre: 'Carlos Eduardo Morales Quispe', clinical_group: 2, grupo_nombre: 'Cirugía Bucal II - Grupo B', modo: 'full_body', incumplidos: [] },
];

export function inspeccionesMock(): RegistroInspeccion[] {
  return SEMILLAS.map((s, i) => {
    const [h, m] = s.hora.split(':').map(Number);
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - s.diasAtras);
    fecha.setHours(h, m, 0, 0);
    return {
      id: i + 1,
      student_code: s.student_code,
      estudiante_nombre: s.estudiante_nombre,
      clinical_group: s.clinical_group,
      grupo_nombre: s.grupo_nombre,
      fecha_ingreso: fecha.toISOString(),
      resultado: construirResultado(fecha, s.student_code, s.modo, s.incumplidos),
    };
  });
}
