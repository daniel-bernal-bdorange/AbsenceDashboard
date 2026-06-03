# Plan de Despliegue: Absence Dashboard en SharePoint (SPFx)

> **Nota (jun 2026):** la migración Vite → SPFx (Fases 0–1) ya está completada en el código.
> El proyecto usa **Heft** (no Yeoman/Gulp). Para arrancar en local ver `README.md → Run locally`.
> Este documento queda como referencia histórica y para las fases 2 (empaquetado) y 3 (verificación).

## Enfoque

Web Part de SharePoint Framework desplegado directamente en SharePoint Online.  
**Sin Azure AD, sin Graph API, sin servicios externos.**

Los archivos `.xlsx` se leen desde una biblioteca del mismo site via `SPHttpClient` usando la sesión de SharePoint.  
Site privado con acceso restringido a 2 personas — la seguridad la hereda el web part.

---

## Archivos a reescribir (4 existentes + crear 2 nuevos)

| Archivo actual | Se convierte en | Cambio |
|----------------|-----------------|--------|
| `main.tsx` | `AbsenceDashboardWebPart.ts` | `createRoot()` → `this.domElement` + `render()` |
| `useFolderPicker.ts` | `useSharePointData.ts` | `showDirectoryPicker()` → `SPHttpClient` (carga automática) |
| `departmentMapper.ts` | `departmentMapper.ts` | `FileSystemFileHandle` → `SPHttpClient` |
| `App.tsx` | `App.tsx` | Quitar condición del FolderPicker, carga automática |

## Archivos a eliminar (7)

- `vite.config.ts`
- `index.html`
- `src/main.tsx`
- `src/vite-env.d.ts` (solo la referencia a Vite)
- `src/config/env.ts`
- `src/fileSystem/useFolderPicker.ts`
- `src/components/FolderPicker.tsx`

## Archivos 100% compatibles (45 — sin cambios)

- Todos los gráficos (echarts-for-react)
- Todos los filtros
- Todas las tablas
- Todos los KPI
- Todos los componentes comunes (ErrorBoundary, LoadingSpinner, etc.)
- Layout (AppShell, Header, Sidebar)
- Store (Zustand)
- i18n (i18next + react-i18next)
- Utilidades (dateUtils, exportCSV, colorMap, etc.)
- Tipos (`types/index.ts`)
- Parser Excel (`api/excelParser.ts`) — solo cambia el origen del ArrayBuffer

---

## Fases

### Fase 0: Preparar entorno SPFx

```powershell
npm install -g @microsoft/generator-sharepoint yo gulp
yo @microsoft/sharepoint
#   Nombre: absence-dashboard
#   Tipo: WebPart
#   Framework: React
#   Entorno: SharePoint Online

gulp trust-dev-cert
```

### Fase 1: Refactorizar código

1. **Copiar** `components/`, `hooks/`, `i18n/`, `store/`, `types/`, `utils/`, `api/` a `src/webparts/absenceDashboard/`
2. **Convertir imports** de `@/...` a rutas relativas
3. **Crear `AbsenceDashboardWebPart.ts`**: `onInit()` inicia i18n, `render()` monta `<App />`
4. **Crear `useSharePointData.ts`**: al montar, usa `SPHttpClient` para:
   - `GET /_api/web/GetFolderByServerRelativeUrl('/sites/.../Biblioteca')` → lista archivos
   - `GET /_api/web/GetFileByServerRelativeUrl('/sites/.../Biblioteca/archivo.xlsx')/$value` → ArrayBuffer
   - ArrayBuffer → `excelParser.ts` (sin cambios) → store
5. **Reescribir `departmentMapper.ts`**: misma lógica, con `SPHttpClient`
6. **Simplificar `App.tsx`**: quitar `if (records.length === 0) return <FolderPicker />`
7. **Configurar PropertyPane**: `Library`, `FolderPath`, `RosterFile`, `Title`
8. **Eliminar** archivos legacy

### Fase 1b: Build de Tailwind

```json
{
  "scripts": {
    "build:css": "npx tailwindcss -i ./src/index.css -o ./lib/webparts/absenceDashboard/absenceDashboard.css"
  }
}
```

Ejecutar `npm run build:css` antes de `gulp bundle --ship`.

### Fase 2: Empaquetar y desplegar

```powershell
npm run build:css
gulp bundle --ship
gulp package-solution --ship
# → sharepoint/solution/absence-dashboard.sppkg
```

**Despliegue:**
1. Admin SharePoint sube el `.sppkg` al App Catalog
2. Confía el paquete (Trust it)
3. Tú agregas el web part a la página: Editar → Web Parts → "Ausencia Dashboard"
4. Configuras: Biblioteca "Ausencias", Carpeta "Exportaciones/2026"

### Fase 3: Verificar

- Al cargar la página, el web part descarga los `.xlsx` automáticamente y muestra el dashboard
- Gráficos, filtros, tablas y KPIs funcionan igual que en local
- Solo usuarios con acceso al site ven los datos
- Usuarios sin permiso ven error de SharePoint

---

## Resumen de permisos necesarios

| Acción | ¿Quién? |
|--------|---------|
| Subir `.sppkg` al App Catalog | Admin SharePoint |
| Agregar web part a página | Site Owner (tú) |
| Configurar propiedades del web part | Site Owner (tú) |
| Ver el dashboard | Usuarios con acceso al site (vosotros 2) |

---

## Dependencias

SPFx:
```
npm install @microsoft/sp-core-library @microsoft/sp-webpart-base
npm install @microsoft/sp-property-pane @microsoft/sp-http
```

Eliminar:
```
npm uninstall vite @vitejs/plugin-react
```
