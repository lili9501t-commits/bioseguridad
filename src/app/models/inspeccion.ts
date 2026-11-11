/**
 * Tipos que reflejan los esquemas Pydantic de la API `reconocimiento_bioseguridad`
 * (app/schemas/inspection.py y app/schemas/camera.py). Mantener sincronizados.
 */
export type CaptureMode = 'full_body' | 'upper_body';
export type EvaluationStatus = 'cumple' | 'incumple' | 'no_evaluado';

// ---------- /health ----------
export interface HealthResponse {
  estado: string;
  mensaje: string;
  version: string;
  camara_activa: boolean;
  modo_detector: string;
  modelo_yolo_personalizado_cargado: boolean;
}

// ---------- /camera ----------
export interface CameraConfigRequest {
  camera_index?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface CameraStatusResponse {
  is_running: boolean;
  camera_index: number;
  resolution: string;
  fps: number;
  last_frame_available: boolean;
  message: string;
}

// ---------- /inspections/catalog ----------
export interface CatalogoBioseguridad {
  capture_modes: { id: CaptureMode; name: string; description: string }[];
  elements: {
    order: number;
    id: string;
    name: string;
    required_zone: string;
    modes: CaptureMode[];
    non_compliance_conditions: string[];
  }[];
  non_visual_conditions: string[];
}

// ---------- /inspections/capture-and-evaluate y /evaluate-image ----------
export interface CaptureInspectionRequest {
  student_code?: string | null;
  capture_mode?: CaptureMode;
  save_image?: boolean | null;
  include_base64_image?: boolean;
}

export interface ImageQualityInfo {
  resolution: string;
  mean_brightness: number;
  sharpness_score: number;
  brightness_ok: boolean;
  sharpness_ok: boolean;
  person_detected: boolean;
  visible_body_zones: Record<string, boolean>;
  warnings: string[];
}

export interface ElementEvaluationResult {
  order: number;
  element_id: string;
  name: string;
  status: EvaluationStatus;
  is_visible_zone: boolean;
  detected_present: boolean | null;
  confidence: number | null;
  condition_code: string;
  condition_detail: string;
  bounding_box: number[] | null;
}

export interface InspectionSummary {
  total_elements: number;
  evaluated_count: number;
  compliant_count: number;
  non_compliant_count: number;
  not_evaluated_count: number;
  compliant_elements: string[];
  missing_elements: string[];
  incorrect_conditions: string[];
  not_evaluated_elements: string[];
}

export interface InspectionEvaluationResponse {
  inspection_timestamp: string;
  student_code: string | null;
  capture_mode: CaptureMode;
  overall_status: EvaluationStatus;
  overall_message: string;
  model_mode: string;
  image_quality: ImageQualityInfo;
  summary: InspectionSummary;
  elements: ElementEvaluationResult[];
  non_visual_conditions_disclaimer: string[];
  saved_image_path: string | null;
  annotated_image_base64: string | null;
}

// ---------- Registro local de una inspección (pendiente: endpoint en la API) ----------
export interface RegistroInspeccion {
  id: number;
  student_code: string;
  estudiante_nombre: string;
  /** id del curso / grupo clínico */
  clinical_group: number;
  grupo_nombre: string;
  /** Fecha y hora en que el estudiante inició la sesión de escaneo */
  fecha_ingreso: string;
  resultado: InspectionEvaluationResponse;
}
