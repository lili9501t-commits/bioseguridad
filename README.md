# 🦷 Plataforma Web de Control de Bioseguridad (Frontend)
### Facultad de Odontología - USFX | Proyecto Académico

Este repositorio contiene el código fuente de la plataforma web y la interfaz de usuario de escritorio desarrollada en **Angular 21** para el sistema de verificación visual de Elementos de Protección Personal (EPP). La aplicación interactúa de forma síncrona con el microservicio de Inteligencia Artificial (FastAPI + YOLO) y la persistencia de datos administrada en PostgreSQL.

---

## 🎨 Identidad Visual y UI (Temática de Salud)
La interfaz de usuario implementa las directrices de diseño específicas para entornos clínicos y odontológicos:
* **Paleta de Colores:** Uso prioritario de Verde Clínico (`#0D9488`) para la identidad institucional, Verde Menta claro para estados de cumplimiento normativo, Rojo Clínico suave para alertas de incumplimiento y Gris Pizarra para tipografías legibles.
* **Diseño Desktop Widescreen:** Optimizado estructuralmente para monitores de computadoras en estaciones de control fijas, distribuyendo el flujo de la cámara y los tableros en columnas paralelas lado a lado para evitar el apilamiento vertical (Mobile-First desactivado).

---

## 🏗️ Módulos de la Plataforma Web
La aplicación se compone de tres vistas de usuario principales administradas de manera modular por el enrutador de Angular:
1. **Panel de Control de la Cámara:** Gestiona la inicialización de la webcam e invoca el análisis de la IA cuadro por cuadro, mostrando en tiempo real si el alumno `CUMPLE` o `INCUMPLE`.
2. **Historial de Inspecciones:** Tabla de consultas avanzadas conectada a PostgreSQL para buscar registros históricos mediante el Código Estudiantil.
3. **Gestión de Estudiantes:** Módulo administrativo para dar de alta al padrón de alumnos de Odontología habilitados para las evaluaciones.

---

## 🛠️ Especificaciones Técnicas
* **Framework:** Angular 21 (Single Page Application).
* **Renderizado:** Client-Side Rendering (CSR) forzado (`--no-ssr`) para asegurar latencia cero en el procesamiento de video local y evitar errores de hidratación con la cámara web.
* **Estilos:** Bootstrap + Bootstrap Icons.
* **Asistencia con IA:** Configuración nativa optimizada para **Claude AI** mediante directrices estrictas de Angular (Standalone Components y control de flujo moderno).

---

## 🚀 Plan de Trabajo Actual: Simulación y Aprobación Visual
Con el fin de mitigar retrabajos y asegurar la validación metodológica por parte de los docentes revisores de la USFX antes de acoplar la base de datos definitiva, el frontend implementa la siguiente estrategia:
1. **Diseño de Interfases en Stitch:** Creación de mockups de alta fidelidad con la paleta de colores aprobada.
2. **Datos Simulados (Mock Data):** Uso temporal de objetos JSON estáticos dentro de Angular para simular el comportamiento de alumnos aprobados y reprobados de forma autónoma.
3. **Conexión Final:** Reemplazo de los flujos de datos simulados por peticiones HTTP reales al servicio backend una vez consolidado el esquema en PostgreSQL.

---

## 📋 Instrucciones de Ejecución Local

Asegúrate de contar con [Node.js](https://nodejs.org) (Versión 18 o superior) en tu sistema.

```bash
# 1. Asegurarse de estar en la carpeta del frontend
cd bioseguridad-frontend

# 2. Instalar los paquetes y dependencias globales (Bootstrap e Iconos)
npm install

# 3. Levantar el servidor local de desarrollo de Angular
ng serve
```

Una vez completada la compilación local, abre tu navegador web e ingresa a: **`http://localhost:4200/`**
