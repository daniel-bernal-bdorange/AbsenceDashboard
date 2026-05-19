# COPILOT CONTEXT — Refactor: Azure/SharePoint → Local File System

## Contexto del proyecto

Estamos refactorizando la aplicación **Absence Dashboard** (Orange Business).
El brief original está en `docs/PROJECT_BRIEF_AbsenceDashboard.md`.

El cambio de planteamiento es **arquitectónico**: eliminamos toda la integración con
Azure (MSAL, Graph API, SharePoint) y sustituimos la fuente de datos por una
**carpeta local seleccionada por el usuario** usando la File System Access API del navegador.

---

## Lo que se elimina completamente

### Código a borrar

| Fichero/Carpeta | Motivo |
|---|---|
| `src/auth/AuthProvider.tsx` | Wrapper de MSAL — ya no hay autenticación |
| `src/auth/msalConfig.ts` | Configuración de Entra ID — no aplica |
| `src/auth/useAuth.ts` | Hook de autenticación — no aplica |
| `src/config/env.ts` | Variables de entorno Azure — reescribir desde cero |
| `staticwebapp.config.json` | Config de Azure Static Web Apps — eliminar |
| `.github/workflows/azure-static-web-apps.yml` | CI/CD Azure — eliminar |

### Dependencias a desinstalar

```bash
npm uninstall @azure/msal-browser @azure/msal-react
```

### Variables de entorno

Eliminar de `.env.local` y `.env.example` todas las variables `VITE_AAD_*`,
`VITE_SHAREPOINT_*` y `VITE_DEPT_CONFIG_FILE`.
El nuevo `.env.example` estará vacío o solo contendrá variables de UI (idioma por defecto, etc.).

---

## Lo que se mantiene sin cambios

- Stack base: Vite + React 18 + TypeScript
- Tailwind CSS con paleta Orange Business
- ECharts (`echarts-for-react`)
- i18n completo (`src/i18n/` con locales `es`/`en` y los 7 namespaces)
- Zustand (`src/store/useAppStore.ts`) — solo actualizar el estado que gestiona
- Componentes de layout (`AppShell`, `Header`, `Sidebar`, `LanguageSwitcher`)
- Modelo de datos `AbsenceRecord`, `Employee`, `AbsenceType`, `AbsenceStatus` — idéntico
- Lógica de parseo del Excel (`excelParser.ts`) — la implementaremos igual, cambia solo de dónde se invoca

---

## Nueva arquitectura: fuente de datos local

### Principio

El usuario hace clic en un botón "Seleccionar carpeta". El navegador abre el
diálogo nativo de selección de carpeta (File System Access API). La app lee
todos los `.xls`/`.xlsx` de esa carpeta, los parsea con SheetJS y carga los
datos en el store de Zustand. No hay servidor, no hay autenticación, no hay red.

### Flujo completo

```
[Usuario] → clic "Seleccionar carpeta"
    → window.showDirectoryPicker()
    → FileSystemDirectoryHandle
    → iterar entradas (.xls / .xlsx)
    → FileSystemFileHandle.getFile() → File (Blob)
    → SheetJS: XLSX.read(arrayBuffer) → worksheet
    → parseExcelFile(worksheet) → AbsenceRecord[]
    → consolidar todos los ficheros → AbsenceRecord[]
    → setRecords(records) en Zustand
    → Dashboard renderiza con los datos
```

### Dependencia nueva a instalar

```bash
npm install xlsx
```

SheetJS (`xlsx`) es la única dependencia nueva. Permite leer `.xls` y `.xlsx`
directamente desde un `ArrayBuffer` en el navegador, sin servidor.

---

## Ficheros nuevos a crear

### `src/types/index.ts`
Tipos TypeScript del modelo de datos (sin cambios respecto al brief original):
`AbsenceType`, `AbsenceStatus`, `AbsenceCategory`, `Department`, `Employee`, `AbsenceRecord`.

### `src/api/excelParser.ts`
Función `parseExcelFile(workbook: WorkBook, sourceFile: string): AbsenceRecord[]`.

Puntos clave del parser:
- La hoja se llama `Export ASA`
- Parsear el campo `From` y `Till` con formato `"DD/MM/YYYY Morning"` o `"DD/MM/YYYY End of the day"`
  - `Morning` → hora `00:00`
  - `End of the day` → hora `23:59`
- `Number of days` puede ser float (e.g. `0.5` para medio día)
- Generar un `id` UUID con `crypto.randomUUID()`
- El campo `department` no está en el Excel; se resuelve desde `employee-departments.json`
  si existe en la misma carpeta (ver más abajo)

### `src/fileSystem/useFolderPicker.ts`
Custom hook que encapsula toda la lógica de File System Access API:

```typescript
// Interfaz esperada del hook
interface UseFolderPickerReturn {
  pickFolder: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  folderName: string | null;
}
```

Comportamiento:
- Llama a `window.showDirectoryPicker({ mode: 'read' })`
- Itera las entradas del directorio filtrando por `.xls` y `.xlsx`
- También busca `employee-departments.json` en la misma carpeta para el mapeo de departamentos
- Por cada Excel: `handle.getFile()` → `arrayBuffer()` → `XLSX.read()` → `parseExcelFile()`
- Al terminar llama a `useAppStore.getState().setRecords(allRecords)`
- Gestiona los estados `isLoading` y `error`

### `src/fileSystem/departmentMapper.ts`
Función `loadDepartmentMap(dirHandle: FileSystemDirectoryHandle): Promise<Map<string, Department>>`.

- Intenta leer `employee-departments.json` de la carpeta
- Si no existe, devuelve un `Map` vacío (todos los empleados quedarán como `'Unknown'`)
- Formato del JSON: `{ "mappings": [{ "username": "cperez", "department": "Prod" }] }`

### `src/components/FolderPicker.tsx`
Componente de pantalla de bienvenida que se muestra cuando no hay datos cargados:

- Botón principal "Seleccionar carpeta de ausencias"
- Icono de carpeta, texto explicativo breve
- Estado de carga con spinner mientras se procesan los ficheros
- Mensaje de error si algo falla (carpeta vacía, formato incorrecto, etc.)
- Usa el hook `useFolderPicker`
- Estilo coherente con la paleta Orange Business

---

## Cambios en ficheros existentes

### `src/store/useAppStore.ts`
Añadir al store:
- `records: AbsenceRecord[]` — dataset consolidado
- `setRecords(records: AbsenceRecord[])` — acción para cargar datos
- `folderName: string | null` — nombre de la carpeta cargada (para mostrar en header)
- `clearRecords()` — para permitir cargar otra carpeta

### `src/App.tsx`
Lógica condicional:
- Si `records.length === 0` → renderizar `<FolderPicker />`
- Si `records.length > 0` → renderizar `<AppShell />` con el dashboard

### `src/components/layout/Header.tsx`
- Eliminar cualquier referencia a autenticación (nombre de usuario, logout de MSAL)
- Añadir: nombre de la carpeta cargada (desde el store) + botón "Cambiar carpeta" (llama a `clearRecords()`)

### `vite.config.ts`
Añadir configuración para que el build funcione abriéndolo directamente desde `file://`:

```typescript
export default defineConfig({
  base: './',                          // rutas relativas en el build
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,       // deshabilitar code splitting
      },
    },
  },
  // resto de config existente...
})
```

---

## Requisito de entorno de ejecución

La aplicación final (`dist/index.html`) debe funcionar abriéndola con **doble clic**
en Chrome o Edge (Chromium), sin levantar ningún servidor local.

La File System Access API (`showDirectoryPicker`) está disponible en:
- Chrome 86+ ✅
- Edge 86+ ✅
- Firefox ❌ (no soportado — no es un requisito)
- Safari ❌ (no es un requisito)

No añadir ningún fallback para Firefox/Safari. Si el navegador no soporta la API,
mostrar un mensaje claro indicando que se requiere Chrome o Edge.

---

## Comprobación de soporte del navegador

En `useFolderPicker.ts`, antes de llamar a `showDirectoryPicker`:

```typescript
if (!('showDirectoryPicker' in window)) {
  throw new Error('Este navegador no soporta la selección de carpetas. Usa Chrome o Edge.')
}
```

---

## Lo que NO cambia en la lógica de negocio

- El modelo de datos (`AbsenceRecord`) es idéntico al brief
- Los tipos de ausencia, estados y categorías son los mismos
- El mapeo de departamentos sigue usando `employee-departments.json`, ahora leído
  de la carpeta local en lugar de SharePoint
- Los filtros, KPIs, gráficos y tabla del dashboard funcionan igual
- El sistema i18n no cambia

---

## Resumen de cambios por área

| Área | Antes | Después |
|---|---|---|
| Autenticación | MSAL + Entra ID | Sin autenticación |
| Fuente de datos | Graph API → SharePoint | File System Access API → carpeta local |
| Lectura de Excel | Graph API download + SheetJS | SheetJS directo desde File blob |
| Despliegue | Azure Static Web Apps | `dist/index.html` abierto directamente en el navegador |
| Dependencias | `@azure/msal-browser`, `@azure/msal-react` | `xlsx` (SheetJS) |
| Config de entorno | 6 variables VITE_AAD_* / VITE_SHAREPOINT_* | Sin variables de entorno |

---

*Documento de contexto para GitHub Copilot — Absence Dashboard Refactor*
*Versión 1.0 — Mayo 2026*
