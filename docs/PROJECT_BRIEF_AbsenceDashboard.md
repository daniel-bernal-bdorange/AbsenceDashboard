# PROJECT BRIEF — Absence Dashboard
## Orange Business | HR Analytics Web Application

---

## 1. RESUMEN EJECUTIVO

Desarrollo de una **Single Page Application (SPA)** interna para visualización y análisis de ausencias de empleados. La aplicación lee automáticamente ficheros Excel depositados en una carpeta de SharePoint, consolida los datos y los presenta en un dashboard interactivo con identidad visual de Orange Business.

La aplicación es de acceso restringido a usuarios autorizados mediante autenticación Azure Entra ID (SSO corporativo) y se despliega en Azure Static Web Apps dentro del tenant corporativo.

---

## 2. CONTEXTO DE NEGOCIO

- **Cliente interno**: Departamento de RRHH / Management
- **Problema**: Los datos de ausencias se gestionan en Everwin (sistema de gestión) y se exportan periódicamente como ficheros Excel a SharePoint. No existe una vista consolidada, visual y filtrable de esos datos.
- **Solución**: Dashboard web que lee automáticamente todos los ficheros de la carpeta SharePoint, consolida los datos y ofrece visualizaciones de tendencias, histórico y previsiones.
- **Audiencia**: RRHH, managers de equipo (Prod y Back Office)
- **Datos sensibles**: Sí. Datos personales de empleados → control de acceso obligatorio.

---

## 3. ARQUITECTURA TÉCNICA

### Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript |
| Estilos | Tailwind CSS 3 |
| Gráficos | Apache ECharts (via echarts-for-react) |
| Autenticación | MSAL.js v3 (@azure/msal-browser) |
| API de datos | Microsoft Graph API v1.0 |
| Internacionalización | i18next + react-i18next |
| Build | Vite |
| Hosting | Azure Static Web Apps (Free tier) |
| CI/CD | GitHub Actions |
| Control de versiones | GitHub |
| IDE / AI | GitHub Copilot |

### Infraestructura Azure

```
[Usuario corporativo]
        ↓ HTTPS
[Azure Static Web Apps]  ←→  [Entra ID / MSAL]
        ↓ Bearer Token
[Microsoft Graph API]
        ↓
[SharePoint — Carpeta /Ausencias/]
        ↓
[Ficheros .xls/.xlsx — exports Everwin]
```

### Repositorio GitHub

- **Estructura de ramas**: `main` (producción) / `develop` (desarrollo) / `feature/*`
- **Deploy automático**: push a `main` → GitHub Actions → Azure Static Web Apps

---

## 4. MODELO DE DATOS

### Estructura del fichero fuente (export Everwin)

Fichero Excel con una única hoja `Export ASA`. Columnas:

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `Code` | string | Código único del empleado | `cperez-041` |
| `Employee` | string | Username del empleado | `cperez` |
| `Type` | string (enum) | Tipo de ausencia | `Vacaciones` |
| `From` | string (datetime) | Inicio de la ausencia | `01/01/2026 Morning` |
| `Till` | string (datetime) | Fin de la ausencia | `05/01/2026 End of the day` |
| `Request date` | string (ISO datetime) | Fecha de solicitud | `2025-10-23T13:56:00.000` |
| `Number of days` | float | Días de ausencia | `2.0` |
| `Status` | string (enum) | Estado de la solicitud | `Accepted` |
| `Validation status` | string (enum) | Estado de validación | `HR validation` |

### Tipos de ausencia (enum `Type`)

```typescript
enum AbsenceType {
  VACATION = 'Vacaciones',
  VACATION_PREV_YEAR = 'Vacaciones año anterior',
  SICK_LEAVE = 'Baja por enfermedad',
  MATERNITY_PATERNITY = 'Permiso maternidad/paternidad',
  SPECIAL_FAMILY_ILLNESS = 'Permisos especiales/ Enfermedad u operación de un familiar',
  SPECIAL_BEREAVEMENT = 'Permisos especiales/ Fallecimiento familiar',
  SPECIAL_MARRIAGE = 'Permisos especiales/ Matrimonio',
  SPECIAL_MOVING = 'Permisos especiales/ Mudanza',
}
```

### Estados (enum `Status`)

```typescript
enum AbsenceStatus {
  ACCEPTED = 'Accepted',
  REFUSED = 'Refused',
  CANCELED = 'Canceled',
  CANCELLATION = 'Cancellation',
  RUNNING = 'Running',
  EMPLOYEE_VALIDATION = 'Employee validation',
  HR_VALIDATION = 'HR validation',
}
```

### Modelo interno normalizado (TypeScript)

```typescript
interface Employee {
  code: string;          // 'cperez-041'
  username: string;      // 'cperez'
  displayName: string;   // Derivado del username o Graph API
  department: Department; // 'Prod' | 'BackOffice' | 'Unknown'
}

interface AbsenceRecord {
  id: string;            // Generated UUID
  employeeCode: string;
  employeeUsername: string;
  type: AbsenceType;
  category: AbsenceCategory; // Agrupación simplificada
  from: Date;
  till: Date;
  requestDate: Date;
  numberOfDays: number;
  status: AbsenceStatus;
  validationStatus: string;
  sourceFile: string;    // Nombre del fichero Excel origen
}

type Department = 'Prod' | 'BackOffice' | 'Unknown';

type AbsenceCategory = 'Vacation' | 'SickLeave' | 'Maternity' | 'Special';
```

### Mapeo departamentos

El campo departamento (`Prod` / `BackOffice`) no está en el Excel actual. Se implementará mediante un **fichero de configuración** `employee-departments.json` almacenado en la misma carpeta de SharePoint, editable por RRHH:

```json
{
  "mappings": [
    { "username": "cperez", "department": "Prod" },
    { "username": "ldouzet", "department": "BackOffice" }
  ]
}
```

---

## 5. CONFIGURACIÓN AZURE / ENTRA ID

### App Registration (Entra ID)

- **Nombre**: `absence-dashboard-app`
- **Tipo**: Single-page application (SPA)
- **Redirect URI**: URL de producción de Azure Static Web Apps
- **Permisos API requeridos** (Delegated):
  - `User.Read` — leer perfil del usuario logado
  - `Files.Read.All` — leer ficheros de SharePoint
  - `Sites.Read.All` — acceder a sites de SharePoint

### Variables de entorno (`.env` / Azure Static Web App settings)

```env
VITE_AAD_CLIENT_ID=<app-registration-client-id>
VITE_AAD_TENANT_ID=<tenant-id>
VITE_SHAREPOINT_SITE_ID=<sharepoint-site-id>
VITE_SHAREPOINT_DRIVE_ID=<drive-id>
VITE_SHAREPOINT_FOLDER_PATH=/Ausencias
VITE_DEPT_CONFIG_FILE=employee-departments.json
```

### Control de acceso

- Solo usuarios del tenant `@adflux.net` (o el dominio corporativo) pueden autenticarse
- Grupo de Entra ID `SG-Dashboard-Ausencias` controla quién tiene acceso
- La app verifica la pertenencia al grupo antes de mostrar datos
- Token JWT se renueva automáticamente con MSAL

---

## 6. ESTRUCTURA DEL PROYECTO

```
absence-dashboard/
├── .github/
│   └── workflows/
│       └── azure-static-web-apps.yml   # CI/CD pipeline
├── public/
│   └── favicon.ico
├── src/
│   ├── auth/
│   │   ├── msalConfig.ts               # Configuración MSAL
│   │   ├── AuthProvider.tsx            # Context provider auth
│   │   └── useAuth.ts                  # Hook de autenticación
│   ├── api/
│   │   ├── graphClient.ts              # Cliente Graph API
│   │   ├── sharepoint.ts               # Leer ficheros de SharePoint
│   │   └── excelParser.ts              # Parsear ficheros Excel → AbsenceRecord[]
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx            # Layout principal
│   │   │   ├── Sidebar.tsx             # Navegación lateral
│   │   │   └── Header.tsx              # Header con usuario logado
│   │   ├── filters/
│   │   │   ├── FilterPanel.tsx         # Panel de filtros
│   │   │   ├── EmployeeFilter.tsx      # Filtro por empleado
│   │   │   ├── DepartmentFilter.tsx    # Filtro Prod / BackOffice
│   │   │   ├── DateRangeFilter.tsx     # Filtro rango de fechas
│   │   │   └── AbsenceTypeFilter.tsx   # Filtro tipo de ausencia
│   │   ├── kpis/
│   │   │   ├── KPIBar.tsx              # Barra de KPIs principales
│   │   │   ├── KPICard.tsx             # Tarjeta KPI individual
│   │   │   └── kpiCalculations.ts      # Lógica de cálculo de KPIs
│   │   ├── charts/
│   │   │   ├── MonthlyStackedBar.tsx   # Días ausentes por mes y tipo
│   │   │   ├── AbsenceCalendar.tsx     # Heatmap calendario anual
│   │   │   ├── TrendLine.tsx           # Tendencia mensual YoY
│   │   │   ├── AbsenceTypeDonut.tsx    # Distribución por tipo
│   │   │   └── DepartmentComparison.tsx # Prod vs BackOffice
│   │   ├── tables/
│   │   │   ├── AbsenceTable.tsx        # Tabla detalle paginada
│   │   │   └── EmployeeSummaryTable.tsx # Resumen por empleado
│   │   └── common/
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── EmptyState.tsx
│   │       └── Badge.tsx               # Badge colores por tipo
│   ├── pages/
│   │   ├── Dashboard.tsx               # Vista principal
│   │   ├── EmployeeDetail.tsx          # Detalle por empleado
│   │   ├── Trends.tsx                  # Vista de tendencias
│   │   └── Login.tsx                   # Página de login
│   ├── store/
│   │   ├── useAbsenceStore.ts          # Zustand store — datos
│   │   └── useFilterStore.ts           # Zustand store — filtros activos
│   ├── types/
│   │   └── index.ts                    # Todos los tipos TypeScript
│   ├── utils/
│   │   ├── dateUtils.ts                # Parseo de fechas del Excel
│   │   ├── absenceUtils.ts             # Helpers de lógica de negocio
│   │   └── colorMap.ts                 # Colores por tipo de ausencia
│   ├── i18n/
│   │   ├── index.ts                    # Configuración i18next
│   │   ├── locales/
│   │   │   ├── es/
│   │   │   │   ├── common.json         # Textos generales UI
│   │   │   │   ├── dashboard.json      # KPIs, títulos de secciones
│   │   │   │   ├── filters.json        # Labels de filtros
│   │   │   │   ├── charts.json         # Títulos y leyendas de gráficos
│   │   │   │   ├── table.json          # Headers de tabla, paginación
│   │   │   │   ├── absenceTypes.json   # Traducción de tipos de ausencia
│   │   │   │   └── errors.json         # Mensajes de error
│   │   │   └── en/
│   │   │       ├── common.json
│   │   │       ├── dashboard.json
│   │   │       ├── filters.json
│   │   │       ├── charts.json
│   │   │       ├── table.json
│   │   │       ├── absenceTypes.json
│   │   │       └── errors.json
│   │   └── useTranslation.ts           # Re-export tipado del hook
│   ├── App.tsx
│   └── main.tsx
├── staticwebapp.config.json            # Config auth Azure SWA
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 7. IDENTIDAD VISUAL

### Paleta Orange Business

```css
:root {
  --ob-orange:        #FF6600;  /* Naranja corporativo principal */
  --ob-orange-dark:   #CC5200;  /* Hover / estados activos */
  --ob-orange-light:  #FF8533;  /* Acentos secundarios */
  --ob-orange-pale:   #FFF0E6;  /* Fondos sutiles */
  --ob-black:         #1A1A1A;  /* Textos principales */
  --ob-gray-dark:     #333333;
  --ob-gray-mid:      #666666;
  --ob-gray-light:    #F5F5F5;  /* Fondos de página */
  --ob-white:         #FFFFFF;
  --ob-success:       #2E7D32;
  --ob-warning:       #F57C00;
  --ob-error:         #C62828;
  --ob-info:          #0277BD;
}
```

### Colores por tipo de ausencia (charts)

```typescript
const ABSENCE_COLORS = {
  'Vacaciones':           '#FF6600',  // Orange corporativo
  'Vacaciones año anterior': '#FF8533',
  'Baja por enfermedad':  '#C62828',  // Rojo
  'Permiso maternidad/paternidad': '#0277BD',  // Azul
  'Permisos especiales/...': '#2E7D32',  // Verde
}
```

### Tipografía

- **Display / Headers**: `'Nunito Sans'` (Google Fonts) — moderno, cercano al estilo Orange
- **Body / Datos**: `'IBM Plex Sans'` — legible, técnico, datos tabulares

### Componentes UI

- Bordes redondeados: `border-radius: 8px` (cards), `4px` (badges, botones)
- Sombras sutiles en cards: `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`
- Header con fondo `#1A1A1A` y logo Orange Business
- Sidebar con fondo `#FF6600` o variante oscura

---

## 8. FUNCIONALIDADES DETALLADAS

### F-01 — Autenticación SSO
- Login automático con cuenta Microsoft corporativa via MSAL
- Redirección a login si no autenticado
- Verificación de pertenencia a grupo `SG-Dashboard-Ausencias`
- Logout con limpieza de sesión MSAL
- Mostrar nombre y avatar del usuario logado en el header

### F-02 — Carga de datos desde SharePoint
- Leer lista de ficheros de la carpeta `/Ausencias/` via Graph API
- Filtrar solo ficheros `.xls` y `.xlsx`
- Parsear cada fichero y normalizar al modelo `AbsenceRecord`
- Leer fichero `employee-departments.json` para asignar departamentos
- Consolidar todos los registros en un único dataset
- Mostrar indicador de progreso durante la carga
- Cachear los datos en memoria durante la sesión (no recargar en cada navegación)
- Botón de refresco manual para forzar recarga desde SharePoint

### F-03 — Filtros globales
- **Por empleado**: multiselect con búsqueda de texto
- **Por departamento**: toggle Prod / Back Office / Todos
- **Por tipo de ausencia**: checkboxes por categoría
- **Por rango de fechas**: date picker inicio y fin
- **Por año**: selector rápido de año (útil para comparativas)
- **Por estado**: Accepted / Pending / Refused
- Los filtros son persistentes durante la sesión (Zustand store)
- Botón "Limpiar filtros" visible cuando hay filtros activos
- Contador de registros que muestra cuántos registros aplican al filtro actual

### F-04 — Dashboard principal (KPIs)
Métricas calculadas sobre el período seleccionado:
- **Total días ausentes** — suma `numberOfDays` de registros Accepted
- **Empleados actualmente fuera** — ausencias activas a fecha de hoy
- **Empleado con más ausencias** — ranking top 1
- **Tipo de ausencia más frecuente** — por número de registros
- **Tasa de absentismo** — `(días ausentes / (empleados * días laborables)) * 100`
- **Comparativa vs mes anterior** — delta porcentual con flecha ↑↓

### F-05 — Gráfico barras apiladas mensuales
- Eje X: meses del año seleccionado
- Eje Y: total días ausentes
- Series apiladas por tipo de ausencia (colores del colorMap)
- Tooltip detallado al hover
- Posibilidad de mostrar/ocultar series clickando en la leyenda
- Exportar como imagen PNG

### F-06 — Heatmap calendario de ausencias
- Vista de todo el año, estilo GitHub contributions
- Cada celda = un día, color según intensidad de ausencias ese día
- Tooltip: quién está ausente ese día y por qué
- Navegación entre años

### F-07 — Gráfico de tendencias Year-over-Year
- Línea mensual año actual vs año anterior
- Área sombreada para visualizar la diferencia
- Predicción para los meses restantes del año (media histórica)

### F-08 — Distribución por tipo (Donut chart)
- Porcentaje de días por cada tipo de ausencia
- Filtrable por departamento para comparar Prod vs BackOffice
- Leyenda interactiva

### F-09 — Comparativa Prod vs Back Office
- Barras horizontales lado a lado
- Días ausentes, tasa de absentismo, tipos principales
- Por mes o por año (toggle)

### F-10 — Tabla de detalle
- Listado paginado (25 registros por página) de todas las ausencias
- Columnas: Empleado, Tipo, Desde, Hasta, Días, Estado
- Ordenación por cualquier columna
- Exportar CSV con los datos filtrados activos
- Click en fila → abre drawer lateral con detalle completo

### F-11 — Vista detalle por empleado
- Accesible desde la tabla o desde el filtro de empleado
- Resumen: total días este año por categoría
- Historial completo en línea de tiempo vertical
- Mini calendario con sus ausencias marcadas
- Comparativa vs media del equipo

### F-12 — Previsiones
- Proyección de días de vacaciones restantes por empleado (si se conoce el cupo anual)
- Tendencia de bajas por enfermedad: media móvil 3 meses
- Alerta visual si un empleado supera un umbral configurable de días

---

## 9. ARQUITECTURA i18n

### Librería: i18next + react-i18next

La elección de i18next es estándar en el ecosistema React, con excelente soporte de GitHub Copilot y documentación amplia. Se complementa con:

- `i18next-browser-languagedetector` — detecta idioma desde `navigator.language`, URL, o localStorage
- `i18next-http-backend` — carga los JSON de traducción de forma lazy (no aumenta el bundle inicial)

### Configuración base

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['es', 'en'],
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'filters', 'charts', 'table', 'absenceTypes', 'errors'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ob-dashboard-lang',
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
```

### Estructura de namespaces

| Namespace | Contenido |
|-----------|-----------|
| `common` | Botones, acciones, textos genéricos (Guardar, Cancelar, Cargando...) |
| `dashboard` | Títulos de KPIs, secciones del dashboard |
| `filters` | Labels de todos los filtros, placeholders |
| `charts` | Títulos de gráficos, labels de ejes, tooltips |
| `table` | Headers de columnas, paginación, exportar |
| `absenceTypes` | Mapeo de los 8 tipos del Excel a su traducción |
| `errors` | Mensajes de error de auth, Graph API, parseo |

### Traducciones de tipos de ausencia

```json
// src/i18n/locales/es/absenceTypes.json
{
  "Vacaciones": "Vacaciones",
  "Vacaciones año anterior": "Vacaciones año anterior",
  "Baja por enfermedad": "Baja por enfermedad",
  "Permiso maternidad/paternidad": "Permiso maternidad/paternidad",
  "Permisos especiales/ Enfermedad u operación de un familiar": "Permiso especial - Enfermedad familiar",
  "Permisos especiales/ Fallecimiento familiar": "Permiso especial - Fallecimiento",
  "Permisos especiales/ Matrimonio": "Permiso especial - Matrimonio",
  "Permisos especiales/ Mudanza": "Permiso especial - Mudanza"
}

// src/i18n/locales/en/absenceTypes.json
{
  "Vacaciones": "Vacation",
  "Vacaciones año anterior": "Previous Year Vacation",
  "Baja por enfermedad": "Sick Leave",
  "Permiso maternidad/paternidad": "Maternity / Paternity Leave",
  "Permisos especiales/ Enfermedad u operación de un familiar": "Special Leave - Family Illness",
  "Permisos especiales/ Fallecimiento familiar": "Special Leave - Bereavement",
  "Permisos especiales/ Matrimonio": "Special Leave - Marriage",
  "Permisos especiales/ Mudanza": "Special Leave - Moving"
}
```

### Hook tipado (autocompletado en Copilot)

```typescript
// src/i18n/useTranslation.ts
import { useTranslation as useI18nTranslation } from 'react-i18next';

type Namespace = 'common' | 'dashboard' | 'filters' | 'charts' | 'table' | 'absenceTypes' | 'errors';

export const useTranslation = (ns: Namespace = 'common') => {
  return useI18nTranslation(ns);
};
```

### Formato de fechas con date-fns

```typescript
// src/utils/dateUtils.ts
import { format } from 'date-fns';
import { es, enGB } from 'date-fns/locale';
import i18n from '../i18n';

const getLocale = () => (i18n.language.startsWith('en') ? enGB : es);

export const formatDate = (date: Date) =>
  format(date, 'dd/MM/yyyy', { locale: getLocale() });

export const formatMonthYear = (date: Date) =>
  format(date, 'MMMM yyyy', { locale: getLocale() }); // "enero 2026" / "January 2026"
```

### Componente LanguageSwitcher

```tsx
// src/components/common/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const isEs = i18n.language.startsWith('es');

  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      <button
        onClick={() => i18n.changeLanguage('es')}
        className={isEs ? 'text-ob-orange font-bold' : 'text-gray-400 hover:text-white'}
      >
        ES
      </button>
      <span className="text-gray-600">|</span>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={!isEs ? 'text-ob-orange font-bold' : 'text-gray-400 hover:text-white'}
      >
        EN
      </button>
    </div>
  );
};
```

### Consideraciones para escalabilidad futura

Si en el futuro se añaden más idiomas (FR, PT, DE), el proceso es:
1. Crear carpeta `src/i18n/locales/{lang}/`
2. Copiar los JSON de `en/` como base
3. Traducir los valores
4. Añadir el código al array `supportedLngs` en la configuración

No requiere cambios en ningún componente.

---

## 10. HISTORIAS DE USUARIO

> Para importar en Azure DevOps como Work Items. Cada historia incluye criterios de aceptación (AC).

---

### ÉPICA 1 — Autenticación y acceso

**US-001 — Login con SSO corporativo**
*Como empleado autorizado, quiero iniciar sesión con mi cuenta de Microsoft corporativa para acceder al dashboard sin crear credenciales adicionales.*

AC:
- [ ] Al acceder a la URL sin sesión, se redirige automáticamente a la pantalla de login de Microsoft
- [ ] Tras autenticación correcta, se muestra el dashboard principal
- [ ] El nombre y foto del usuario aparecen en el header
- [ ] Si el usuario no pertenece al grupo `SG-Dashboard-Ausencias`, se muestra pantalla de acceso denegado con mensaje claro
- [ ] El token se renueva automáticamente sin interrumpir al usuario
- [ ] El botón de logout limpia la sesión y redirige al login

**US-002 — Cierre de sesión**
*Como usuario, quiero poder cerrar sesión de forma segura para proteger los datos en equipos compartidos.*

AC:
- [ ] Botón de logout visible en el header
- [ ] El logout limpia completamente el token MSAL
- [ ] Tras logout, la URL del dashboard redirige al login
- [ ] No quedan datos en memoria accesibles sin reautenticación

---

### ÉPICA 2 — Carga y sincronización de datos

**US-003 — Carga automática de ficheros desde SharePoint**
*Como sistema, quiero leer automáticamente todos los ficheros Excel de la carpeta de SharePoint para tener siempre los datos más recientes.*

AC:
- [ ] Al iniciar sesión, la app lista automáticamente todos los `.xls/.xlsx` de la carpeta `/Ausencias/` de SharePoint
- [ ] Se parsean todos los ficheros y se consolida un único dataset en memoria
- [ ] Se muestra una barra de progreso durante la carga indicando fichero actual / total
- [ ] Si un fichero tiene un error de parseo, se registra el error pero se continúa con los demás
- [ ] Al finalizar la carga se muestra el número de registros cargados y la fecha de la última actualización
- [ ] Los ficheros sin datos o vacíos se ignoran sin error

**US-004 — Refresco manual de datos**
*Como usuario de RRHH, quiero poder forzar una recarga de datos para ver los cambios más recientes sin cerrar y abrir la aplicación.*

AC:
- [ ] Existe un botón "Actualizar datos" visible en el header o dashboard
- [ ] Al pulsar, se vuelven a leer todos los ficheros de SharePoint
- [ ] Durante la recarga se muestra un spinner y se bloquea la interacción
- [ ] Tras la recarga se muestra toast de confirmación con número de registros y timestamp

**US-005 — Configuración de departamentos**
*Como administrador de RRHH, quiero gestionar la asignación de empleados a departamentos (Prod/BackOffice) mediante un fichero de configuración para no depender de IT.*

AC:
- [ ] La app lee el fichero `employee-departments.json` de la carpeta de SharePoint al cargar
- [ ] Los empleados sin asignación aparecen como "Sin departamento" y no se filtran por error
- [ ] Si el fichero no existe, la app funciona correctamente sin filtro de departamento
- [ ] La estructura del JSON está documentada en el README del proyecto

---

### ÉPICA 3 — Filtros

**US-006 — Filtro por empleado**
*Como manager, quiero filtrar el dashboard por uno o varios empleados concretos para analizar sus patrones de ausencia.*

AC:
- [ ] Existe un multiselect con todos los empleados del dataset
- [ ] El multiselect tiene búsqueda de texto en tiempo real
- [ ] Seleccionar empleados actualiza todos los gráficos y tablas simultáneamente
- [ ] Se pueden seleccionar múltiples empleados a la vez
- [ ] Hay un botón para deseleccionar todos
- [ ] El número de empleados seleccionados se muestra en el selector

**US-007 — Filtro por departamento**
*Como director, quiero alternar entre ver datos de Prod, Back Office o todos para comparar el absentismo entre equipos.*

AC:
- [ ] Existe un toggle de 3 estados: Todos / Prod / Back Office
- [ ] El filtro actualiza todos los gráficos en tiempo real
- [ ] El estado activo del toggle es visualmente claro (color naranja corporativo)

**US-008 — Filtro por rango de fechas**
*Como usuario, quiero definir un período de análisis concreto para centrarme en un trimestre o año específico.*

AC:
- [ ] Existe un date range picker con selector de inicio y fin
- [ ] Hay accesos directos rápidos: "Este año", "Año anterior", "Último trimestre", "Último mes"
- [ ] El rango seleccionado se muestra en el header del dashboard
- [ ] Por defecto muestra el año en curso

**US-009 — Filtro por tipo de ausencia**
*Como usuario de RRHH, quiero filtrar por uno o varios tipos de ausencia para analizar por ejemplo solo las bajas por enfermedad.*

AC:
- [ ] Checkboxes para cada tipo de ausencia con su color identificativo
- [ ] Todos marcados por defecto
- [ ] Acciones rápidas: "Solo vacaciones", "Solo bajas", "Todos"

---

### ÉPICA 4 — Dashboard y KPIs

**US-010 — Vista de KPIs principales**
*Como manager, quiero ver de un vistazo los indicadores clave de absentismo para el período seleccionado.*

AC:
- [ ] KPI: Total días ausentes en el período
- [ ] KPI: Número de empleados con alguna ausencia en el período
- [ ] KPI: Empleados actualmente fuera (ausencia activa hoy)
- [ ] KPI: Tasa de absentismo (%) con delta vs período anterior
- [ ] KPI: Tipo de ausencia más frecuente
- [ ] Las flechas de tendencia (↑↓) indican si es mayor o menor que el período anterior
- [ ] Los KPIs se actualizan al cambiar cualquier filtro

**US-011 — Gráfico de barras apiladas mensuales**
*Como usuario, quiero ver la evolución mensual de ausencias desglosada por tipo para identificar patrones estacionales.*

AC:
- [ ] Barras mensuales apiladas por tipo de ausencia con los colores del colorMap
- [ ] Tooltip al hover muestra desglose detallado del mes
- [ ] Click en una barra filtra la tabla de detalle a ese mes
- [ ] Leyenda interactiva para mostrar/ocultar tipos
- [ ] Botón para exportar el gráfico como imagen PNG

**US-012 — Heatmap calendario anual**
*Como usuario de RRHH, quiero ver en formato calendario qué días del año tienen mayor concentración de ausencias.*

AC:
- [ ] Vista de 12 meses, cada día representado por una celda
- [ ] Intensidad del color proporcional al número de días de ausencia acumulados ese día
- [ ] Tooltip muestra: fecha, número de ausencias, lista de empleados ausentes
- [ ] Selector de año para navegar entre años disponibles en el dataset
- [ ] Los fines de semana y festivos son visualmente diferenciables

**US-013 — Gráfico de tendencia Year-over-Year**
*Como director, quiero comparar la evolución mensual del año actual con el año anterior para detectar desviaciones.*

AC:
- [ ] Dos líneas: año actual (naranja) y año anterior (gris)
- [ ] El área entre ambas líneas está sombreada
- [ ] Los meses futuros del año actual muestran la proyección (línea discontinua) basada en la media histórica
- [ ] Tooltip comparativo al hover muestra ambos valores y la diferencia

---

### ÉPICA 5 — Análisis por empleado y equipo

**US-014 — Comparativa Prod vs Back Office**
*Como director, quiero comparar las métricas de absentismo entre los dos departamentos para identificar diferencias estructurales.*

AC:
- [ ] Barras horizontales paralelas (Prod en naranja, BackOffice en gris oscuro)
- [ ] Métricas: días totales, tasa de absentismo, distribución por tipo
- [ ] Toggle mes / año para cambiar la granularidad
- [ ] Se oculta si no hay asignación de departamentos configurada

**US-015 — Tabla de detalle de ausencias**
*Como usuario de RRHH, quiero consultar el listado completo de ausencias con todos los detalles para revisar registros individuales.*

AC:
- [ ] Tabla paginada (25 filas por defecto, configurable a 50/100)
- [ ] Columnas: Empleado, Tipo (con badge de color), Desde, Hasta, Días, Estado
- [ ] Ordenación ASC/DESC por cualquier columna
- [ ] Buscador de texto libre sobre la tabla
- [ ] Respeta todos los filtros activos del panel de filtros
- [ ] Botón "Exportar CSV" descarga los datos filtrados actuales
- [ ] Click en una fila abre un drawer lateral con el detalle completo del registro

**US-016 — Vista de detalle por empleado**
*Como manager, quiero ver el perfil de ausencias de un empleado concreto para entender su historial y patrones.*

AC:
- [ ] Accesible desde la tabla (click en nombre) o desde el filtro de empleado
- [ ] Muestra: nombre, departamento, total días ausentes este año por categoría
- [ ] Línea de tiempo vertical con todas sus ausencias ordenadas cronológicamente
- [ ] Mini calendario personal con sus ausencias marcadas
- [ ] Comparativa vs media del equipo/departamento

---

### ÉPICA 6 — Internacionalización (i18n)

**US-020 — Cambio de idioma en la UI**
*Como usuario, quiero poder cambiar el idioma de la aplicación entre español e inglés para usar la herramienta en mi idioma preferido.*

AC:
- [ ] Selector de idioma visible en el header (ej. `ES | EN`) con el idioma activo destacado
- [ ] Al cambiar el idioma, toda la UI se actualiza inmediatamente sin recargar la página
- [ ] La preferencia de idioma se persiste en `localStorage` y se recupera en la siguiente sesión
- [ ] Si no hay preferencia guardada, el idioma se detecta automáticamente desde `navigator.language`
- [ ] El fallback por defecto es español (`es-ES`) si el idioma detectado no está soportado

**US-021 — Traducción completa de la interfaz**
*Como usuario anglófono, quiero que todos los textos de la aplicación estén disponibles en inglés para poder usarla sin barreras de idioma.*

AC:
- [ ] Todos los textos de la UI están externalizados en ficheros JSON de traducción (ningún string hardcodeado en componentes)
- [ ] Están traducidos al inglés: labels de filtros, títulos de secciones, headers de tabla, mensajes de error, tooltips, textos de KPIs, botones y acciones
- [ ] Los tipos de ausencia del Excel (en español) se traducen al inglés cuando el idioma activo es `en`: ej. `Baja por enfermedad` → `Sick Leave`
- [ ] Los valores de datos puros (nombres de empleados, fechas) nunca se traducen
- [ ] Los mensajes de error de Graph API / SharePoint se muestran traducidos

**US-022 — Formato de fechas y números según locale**
*Como usuario, quiero que las fechas y números se muestren en el formato propio de mi idioma seleccionado.*

AC:
- [ ] Fechas en formato `DD/MM/YYYY` para `es-ES` y `en-GB`
- [ ] Los nombres de meses en los ejes de gráficos cambian con el idioma: `Enero` / `January`
- [ ] Los separadores de miles y decimales respetan el locale: `1.234,5` (es) / `1,234.5` (en)
- [ ] El primer día de la semana en el calendario es lunes en ambos locales
- [ ] Los tooltips de los gráficos usan el formato de fecha correcto según el idioma activo

---

### ÉPICA 7 — Infraestructura y DevOps

**US-023 — Setup del proyecto React + TypeScript**
*Como desarrollador, quiero tener el scaffolding inicial del proyecto configurado para poder empezar a desarrollar funcionalidades.*

AC:
- [ ] Proyecto creado con Vite + React + TypeScript
- [ ] Tailwind CSS configurado con la paleta de Orange Business
- [ ] ECharts instalado y configurado
- [ ] MSAL.js instalado y configurado con variables de entorno
- [ ] Zustand instalado para gestión de estado
- [ ] i18next y react-i18next instalados y configurados
- [ ] Ficheros de traducción iniciales creados para `es` y `en` con todas las claves necesarias
- [ ] Hook `useTranslation` tipado y disponible para todos los componentes
- [ ] ESLint + Prettier configurados
- [ ] README con instrucciones de setup local

**US-024 — CI/CD con GitHub Actions + Azure Static Web Apps**
*Como desarrollador, quiero que cada push a main despliegue automáticamente la aplicación en Azure Static Web Apps.*

AC:
- [ ] Workflow de GitHub Actions creado (`.github/workflows/azure-static-web-apps.yml`)
- [ ] Push a `main` dispara build automático con `npm run build`
- [ ] El artefacto de build se despliega en Azure Static Web Apps
- [ ] Las variables de entorno están configuradas como secrets en GitHub y en Azure SWA settings
- [ ] Los PRs crean entornos de preview automáticamente
- [ ] El workflow notifica en el PR si el build falla

**US-025 — Configuración de autenticación en Azure Static Web Apps**
*Como DevOps, quiero configurar la autenticación Entra ID en el fichero staticwebapp.config.json para proteger toda la aplicación a nivel de infraestructura.*

AC:
- [ ] `staticwebapp.config.json` creado con configuración de autenticación AAD
- [ ] Todas las rutas (`/*`) requieren rol `authenticated`
- [ ] Usuarios no autenticados son redirigidos automáticamente al login de Microsoft
- [ ] Usuarios autenticados pero sin el grupo correcto reciben error 403
- [ ] El fichero está commiteado en el repositorio

---

## 11. TAREAS TÉCNICAS (Tasks)

```
TASK-001  Registrar App en Entra ID con permisos Graph API (Files.Read.All, Sites.Read.All, User.Read)
TASK-002  Crear Resource Group en Azure
TASK-003  Crear Azure Static Web App y enlazar con repositorio GitHub
TASK-004  Configurar secrets en GitHub (AZURE_STATIC_WEB_APPS_API_TOKEN, VITE_AAD_CLIENT_ID, etc.)
TASK-005  Crear grupo de Entra ID SG-Dashboard-Ausencias y añadir usuarios iniciales
TASK-006  Identificar Site ID y Drive ID de la carpeta SharePoint de Ausencias
TASK-007  Subir fichero employee-departments.json inicial a la carpeta SharePoint
TASK-008  Implementar función parseExcelFile() que convierte fila Excel → AbsenceRecord
TASK-009  Implementar función parseFromField() para manejar el formato "01/01/2026 Morning"
TASK-010  Implementar caché en memoria del dataset (sessionStorage o Zustand persist)
TASK-011  Configurar Google Fonts (Nunito Sans + IBM Plex Sans) en el proyecto
TASK-012  Implementar componente Badge con colores por AbsenceType
TASK-013  Implementar función calcAbsenteeismRate() para el KPI de tasa de absentismo
TASK-014  Añadir manejo de errores global (ErrorBoundary + toast notifications)
TASK-015  Implementar exportación CSV con los filtros activos aplicados
TASK-016  Configurar dominio personalizado en Azure Static Web Apps (si aplica)
TASK-017  Pruebas de carga con dataset de 1000+ registros (múltiples ficheros)
TASK-018  Revisar y documentar permisos mínimos necesarios (principio de menor privilegio)

# i18n
TASK-019  Instalar y configurar i18next + react-i18next + i18next-browser-languagedetector
TASK-020  Crear estructura de ficheros de traducción (src/i18n/locales/es/ y src/i18n/locales/en/)
TASK-021  Poblar fichero absenceTypes.json con los 8 tipos en español e inglés
TASK-022  Crear tipo TypeScript TranslationKeys para autocompletar las claves de traducción con i18next
TASK-023  Implementar componente LanguageSwitcher (ES | EN) e integrarlo en el Header
TASK-024  Configurar date-fns con locale dinámico (es / en-GB) según idioma activo
TASK-025  Configurar formato de números (Intl.NumberFormat) según locale activo
TASK-026  Verificar que los ejes de los gráficos ECharts cambian de idioma correctamente
TASK-027  Audit final de strings hardcodeados — ningún texto de UI fuera de los ficheros JSON
```

---

## 12. DEFINICIÓN DE HECHO (Definition of Done)

Una historia se considera completada cuando:
- [ ] El código está commiteado en la rama `develop` o un `feature/*`
- [ ] El build de GitHub Actions pasa sin errores
- [ ] La funcionalidad es visible y funcional en el entorno de preview de Azure SWA
- [ ] El código ha pasado por revisión (o auto-revisión si equipo de 1)
- [ ] Los tipos TypeScript están correctamente definidos (sin `any` injustificados)
- [ ] Los componentes nuevos siguen la paleta de colores de Orange Business
- [ ] No hay console.log() en el código mergeado a main

---

- [ ] Ningún string de UI hardcodeado en componentes — todo pasa por `useTranslation`

## 13. CONSTRAINTS Y CONSIDERACIONES

- **Datos sensibles**: No almacenar datos de empleados fuera del tenant Microsoft. No usar localStorage para datos de ausencias.
- **Permisos mínimos**: La App Registration solo debe tener los permisos estrictamente necesarios. Revisar con IT antes de solicitar `Files.Read.All` vs permisos más acotados a la carpeta específica.
- **Sin backend propio**: La app es puramente frontend + Graph API. No se despliega ningún servidor ni Azure Function en la fase inicial.
- **Compatibilidad**: Navegadores corporativos — Edge (Chromium), Chrome. No es necesario soporte para IE11.
- **Accesibilidad**: WCAG 2.1 AA básico — contraste suficiente, navegación por teclado en filtros y tabla.
- **Idioma**: La UI soporta **español (es-ES)** e **inglés (en-GB)**. El idioma por defecto se detecta automáticamente desde la configuración del navegador, con posibilidad de cambio manual. Los tipos de ausencia (valores del Excel) se traducen mediante el sistema i18n.
- **Formato fechas**: `DD/MM/YYYY` en `es-ES`, `DD/MM/YYYY` en `en-GB`. Gestionado via `date-fns/locale`.
- **Zona horaria**: Europe/Madrid.

---

## 14. PROMPT INICIAL PARA GITHUB COPILOT

Copiar y pegar en Copilot Chat para arrancar el proyecto:

```
I need to build a React 18 + TypeScript SPA called "Absence Dashboard" for Orange Business (corporate brand color #FF6600).

Tech stack:
- Vite + React 18 + TypeScript
- Tailwind CSS (with Orange Business palette: --ob-orange: #FF6600, --ob-black: #1A1A1A)
- Apache ECharts (echarts-for-react) for charts
- MSAL.js v3 (@azure/msal-browser) for Azure Entra ID SSO authentication
- Zustand for state management
- Microsoft Graph API v1.0 to read Excel files from a SharePoint folder
- Deployment: Azure Static Web Apps

Data model (from Excel files in SharePoint):
- Employee: code (string), username (string), department ('Prod' | 'BackOffice' | 'Unknown')
- AbsenceRecord: employeeCode, employeeUsername, type (enum of 8 Spanish absence types), from (Date), till (Date), requestDate (Date), numberOfDays (number), status (enum: Accepted/Refused/Canceled/Running/etc.), sourceFile (string)

Absence types (Spanish, from Everwin ERP export):
'Vacaciones', 'Vacaciones año anterior', 'Baja por enfermedad', 
'Permiso maternidad/paternidad', 'Permisos especiales/ Enfermedad u operación de un familiar',
'Permisos especiales/ Fallecimiento familiar', 'Permisos especiales/ Matrimonio', 'Permisos especiales/ Mudanza'

Key date parsing challenge: the 'From' and 'Till' fields come as "01/01/2026 Morning" or "05/01/2026 End of the day" - implement a robust parser for this format.

Please create the full project scaffold with:
1. Complete folder structure as defined in the project brief
2. TypeScript types in src/types/index.ts
3. MSAL configuration in src/auth/msalConfig.ts with environment variables
4. Graph API client in src/api/graphClient.ts that lists and reads all .xls/.xlsx files from a SharePoint folder
5. Excel parser in src/api/excelParser.ts that converts raw rows to AbsenceRecord[]
6. Tailwind config with Orange Business palette and Nunito Sans + IBM Plex Sans fonts
7. App shell with header (dark #1A1A1A background, orange logo accent), sidebar navigation, and main content area
8. Zustand stores for absence data and active filters

- **Internacionalización**: i18next + react-i18next con soporte para `es-ES` (default) y `en-GB`. Detección automática desde `navigator.language`. Persistencia en localStorage. Selector de idioma en el header.

Key i18n requirements:
- ALL UI strings must be externalized in JSON files under `src/i18n/locales/{es,en}/`
- Namespaces: `common`, `dashboard`, `filters`, `charts`, `table`, `absenceTypes`, `errors`
- The 8 Spanish absence type values from Excel must be translated in `absenceTypes.json`:
  - 'Vacaciones' → 'Vacation'
  - 'Vacaciones año anterior' → 'Previous Year Vacation'
  - 'Baja por enfermedad' → 'Sick Leave'
  - 'Permiso maternidad/paternidad' → 'Maternity/Paternity Leave'
  - 'Permisos especiales/ Enfermedad u operación de un familiar' → 'Special Leave / Family Illness'
  - 'Permisos especiales/ Fallecimiento familiar' → 'Special Leave / Bereavement'
  - 'Permisos especiales/ Matrimonio' → 'Special Leave / Marriage'
  - 'Permisos especiales/ Mudanza' → 'Special Leave / Moving'
- date-fns locale must switch dynamically with the active language
- Chart axis labels (month names) must update on language change
- Create a typed `useAppTranslation` hook that wraps react-i18next for autocomplete on translation keys
```

---

*Documento generado para el proyecto Absence Dashboard — Orange Business*
*Versión 1.0 — Mayo 2026*
