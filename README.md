# 🦷 Plataforma Web de Control de Bioseguridad (Frontend)
### Facultad de Odontología - USFX | Proyecto Académico

Interfaz web en **Angular 21** del sistema de verificación visual de Elementos de Protección Personal (EPP). Consume el microservicio de Inteligencia Artificial **`reconocimiento_bioseguridad`** (FastAPI + YOLO + OpenCV) para el escaneo de los 9 elementos de bioseguridad.

> **Estado actual:** el escaneo con cámara y la evaluación de fotografías usan la **API real**. El inicio de sesión, los cursos, los estudiantes y el historial usan **datos simulados** (ver [Datos simulados](#-datos-simulados-y-conexión-pendiente)).

---

## 📋 Requisitos

| Herramienta | Versión |
|---|---|
| [Node.js](https://nodejs.org) | **20.19+**, 22.12+ o 24+ (exigido por Angular 21) |
| npm | 10+ (incluido con Node) |
| API `reconocimiento_bioseguridad` | Necesaria solo para el escaneo (cámara / foto) |

No hace falta instalar Angular CLI globalmente: los comandos usan `npm`.

---

## 🚀 Instalación y ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/lili9501t-commits/bioseguridad.git
cd bioseguridad

# 2. Instalar dependencias (Angular, Bootstrap, Bootstrap Icons, read-excel-file)
npm install

# 3. Levantar el servidor de desarrollo
npm start
```

Abrir **http://localhost:4200/** en el navegador.

### Levantar la API de IA (para escanear)

En otra terminal, dentro del proyecto `reconocimiento_bioseguridad` (ver su propio README para crear el entorno virtual e instalar dependencias):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Documentación interactiva de la API: http://localhost:8000/docs
- Si la API corre en otro host o puerto, cambiar `apiUrl` en [`src/environments/environment.ts`](src/environments/environment.ts).
- La API ya tiene CORS habilitado para cualquier origen.

Sin la API encendida, la aplicación funciona igual, pero la pantalla de escaneo mostrará **"Servidor de Detección: Sin conexión"**.

---

## 🔑 Usuarios de prueba

El rol se determina automáticamente por el correo registrado (no hay selector de rol).

| Rol | Correo | Contraseña | Página inicial |
|---|---|---|---|
| Docente | `docente@gmail.com` | `12345646` | `/docente/cursos` |
| Estudiante | `rosalinda@gmail.com` | `12345646` | `/estudiante/escaneo` |

Los usuarios están definidos en [`src/app/services/auth.ts`](src/app/services/auth.ts). La sesión se guarda en `sessionStorage` (se cierra al cerrar la pestaña).

---

## 🏗️ Módulos implementados

| HU | Módulo | Rol | Ruta |
|---|---|---|---|
| HU-01 | Inicio de sesión con detección de rol | Ambos | `/login` |
| HU-02 | Mis Cursos y Grupos: crear, editar, habilitar/deshabilitar | Docente | `/docente/cursos` |
| HU-03 | Gestión de Estudiantes: registro individual (con foto) y carga masiva Excel | Docente | `/docente/estudiantes` |
| HU-07 | Nuevo Escaneo en vivo (cámara + detecciones en tiempo real) | Estudiante | `/estudiante/escaneo` |
| HU-08 | Escaneo alternativo subiendo una fotografía | Estudiante | `/estudiante/escaneo` (pestaña "Subir Fotografía") |
| — | Resultado del escaneo (9 elementos) | Estudiante | `/estudiante/resultado/:id` |
| HU-05 | Mi Historial (solo lectura, con detalle en modal) | Estudiante | `/estudiante/historial` |

Pendientes (páginas vacías): **Panel de Inspección** e **Historial General** del docente.

Las rutas están protegidas por rol ([`src/app/guards/auth.guard.ts`](src/app/guards/auth.guard.ts)): un estudiante no puede entrar a `/docente/*` ni ver resultados de otros estudiantes.

### Formato del Excel para carga masiva (HU-03)

Archivo `.xlsx` con una hoja cuya **primera fila** tenga estos encabezados (se aceptan los nombres en español):

| student_code (Matrícula) | first_name (Nombres) | last_name (Apellidos) | email (Correo) |
|---|---|---|---|
| 24-1589 | Andrea Valeria | Flores Choque | andrea.flores@gmail.com |

El grupo clínico se elige en el modal antes de importar. La carrera se asigna como `Odontología`.

---

## 🔌 Endpoints de la API utilizados

Cliente HTTP en [`src/app/services/api.ts`](src/app/services/api.ts); tipos equivalentes a los esquemas Pydantic en [`src/app/models/inspeccion.ts`](src/app/models/inspeccion.ts).

| Endpoint | Uso en el frontend |
|---|---|
| `GET /health` | Indicador "Servidor de Detección" |
| `GET /camera/status` · `POST /camera/start` · `POST /camera/stop` | Botones de cámara |
| `GET /camera/stream` | Video en vivo (MJPEG en un `<img>`) |
| `POST /inspections/capture-and-evaluate` | Detecciones en vivo (cada 3 s) y captura final |
| `POST /inspections/evaluate-image` | Análisis de fotografía subida (HU-08) |
| `GET /inspections/catalog` · `GET /camera/snapshot` | Disponibles en `api.ts`, aún sin pantalla |

---

## 🧪 Datos simulados y conexión pendiente

Mientras la API no tenga estos endpoints, los datos viven en memoria del navegador y **se reinician al recargar la página**:

| Dato | Archivo | Endpoints que faltan en la API |
|---|---|---|
| Usuarios / login | `services/auth.ts` | `POST /auth/login` (debe devolver el rol) |
| Cursos | `services/cursos.ts` | `GET/POST/PUT /courses`, `PATCH /courses/:id/estado` |
| Estudiantes | `services/estudiantes.ts` | `GET/POST/PUT/DELETE /students`, `POST /students/lote` |
| Historial de inspecciones | `services/inspecciones.ts` + `inspecciones.mock.ts` | `POST /inspections`, `GET /inspections?student_code=` |

Los modelos ya usan los nombres de columna de PostgreSQL (`student_code`, `first_name`, `clinical_group`, etc.), así que al conectar la API solo hay que reemplazar el cuerpo de cada método del servicio por la llamada `HttpClient` correspondiente.

---

## 📁 Estructura

```
src/
├── environments/environment.ts   # URL de la API
└── app/
    ├── components/   # layout, sidebar, modal de estudiante, lista de 9 elementos
    ├── guards/       # protección de rutas por rol
    ├── models/       # interfaces (usuario, curso, estudiante, inspección)
    ├── pages/        # una carpeta por pantalla
    ├── services/     # api.ts (HTTP real) + servicios con datos simulados
    └── app.routes.ts # rutas /login, /docente/*, /estudiante/*
```

---

## 🛠️ Comandos

| Comando | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo en http://localhost:4200 |
| `npm run build` | Compilación de producción en `dist/` |
| `npm test` | Pruebas unitarias (Vitest) |

---

## 🎨 Identidad visual
* **Paleta:** Verde Clínico (`#0D9488`) institucional, Verde Menta para cumplimiento, Rojo Clínico para incumplimiento y Gris Pizarra para textos.
* **Diseño desktop:** optimizado para monitores de estaciones de control, con cámara y paneles en columnas paralelas.

## 🧰 Especificaciones técnicas
* **Framework:** Angular 21 (standalone components, signals, control de flujo `@if` / `@for`).
* **Renderizado:** solo cliente (sin SSR), para el manejo de la cámara.
* **Estilos:** Bootstrap 5 + Bootstrap Icons, fuente Inter.
* **Excel:** `read-excel-file` para la carga masiva de estudiantes.
