# Feature: Vacaciones + Regularizaciones + Entitlement
Fecha inicio: 2026-06-08 | Estado: PLANIFICACIÓN

## Nuevos archivos de datos
- `datos ausencias/export_everwin_vacaciones_extract_06_2026.xlsx` — hoja `SX`, extracción vacaciones
- `datos ausencias/Regul_extract_06_2026.xlsx` — hoja `SX`, regularizaciones a posteriori
- `datos ausencias/listado empleados_FOCUS.xlsx` — hoja `SX`, roster con `Arrival date`

## Estructura de carpetas SharePoint (nueva)
```
Data/
├── Ausencias/          ← export_everwin*.xls(x)
├── Regularizaciones/   ← Regul_*.xlsx
└── Roster/             ← OBD Spain_employee list_2026.xlsx + listado empleados_FOCUS.xlsx
```

## Diferencias de formato a normalizar
- Archivo vacaciones nuevo: columnas en orden distinto (Employee primero, Code al final), hoja `SX`
- Status: `Cancelled` → `Canceled`, `In progress` → `Running`  
- Till: usa `Evening` además de `End of the day`
- Parser actual busca hoja `Export ASA` → añadir fallback `SX`

## Tipo RegulRecord (nuevo)
Campos relevantes de `Regul_extract_06_2026.xlsx`:
- `Date`, `Row type` (tipo ausencia), `Employee`, `Title`, `Expenditure quantity` (+/-), `Date to regularise`, `Validation status`
- Solo procesar rows donde `Row type` ∈ tipos de ausencia conocidos (ignorar `Prestation Services`, `Innovation`, etc.)

## Lógica entitlement vacaciones
- Base: 23 días/año
- Extra: +1 por cada trienio completo (calculado a 01/01/Y)
- `entitlement(Y) = 23 + floor(yearsComplete(arrivalDate, 01-01-Y) / 3)`

### Año actual Y (2026)
- Consumido = días `Vacaciones` con status `Accepted`, year(from) = Y
- Restante_Y = entitlement(Y) − consumido_Y

### Año anterior Y-1 (2025)
- Consumido_base = días `Vacaciones` aceptados en Y-1
- Consumido_arrastre = días `Vacaciones año anterior` aceptados en Y (disfrutados antes 31/01/Y)
- Restante_prevYear = entitlement(Y-1) − consumido_base − consumido_arrastre
- ⚠ Alert si `Restante_prevYear > 0` y hoy > 31/01/Y → días caducados

---

## Slices de implementación

### [x] Planificación y análisis de datos
- Inspeccionados los tres archivos nuevos con Python
- Confirmada estructura y diferencias de formato
- Confirmada lógica de entitlement con el usuario

### [x] Slice 1 — Parser normalización `api/excelParser.ts`
- Fallback hoja: `Export ASA` → `SX`
- `Evening` alias de `End of the day` en `parseBoundaryDate`
- Normalizar status: `Cancelled→Canceled`, `In progress→Running`
- Las columnas ya se leen por nombre (sheet_to_json), soporta orden diferente

### [x] Slice 2 — Tipos `types/index.ts`
- Nuevo `RegulRecord` interface
- Nuevo `FocusRosterRow` interface para listado_FOCUS (con `Arrival date`)
- Nuevo `VacationStats` interface

### [x] Slice 3 — Parser regularización `api/excelParser.ts`
- `parseRegulFile(workbook, sourceFile): RegulRecord[]`
- Filtrar solo row types de ausencias conocidos

### [x] Slice 4 — Parser FOCUS roster
- Nuevo `loadFocusRoster(...)`: devuelve `Map<code, Date>` (arrivalDate)
- Ubicación: `fileSystem/departmentMapper.ts` o archivo nuevo

### [x] Slice 5 — Util entitlement `utils/vacationEntitlement.ts` (nuevo)
- `computeEntitlement(arrivalDate: Date, refYear: number): number`
- `computeVacationStats(records, entitlements, year): Map<code, VacationStats>`
- `VacationStats`: `{ entitlementY, usedY, remainingY, entitlementPrev, usedPrev, usedCarryover, remainingPrev, expiredPrev }`

### [x] Slice 6 — Dedup `utils/deduplicateRecords.ts` (nuevo)
- Clave: `${code}|${type}|${from.toISOString().slice(0,10)}|${till.toISOString().slice(0,10)}`
- Al fusionar múltiples exports, el registro más reciente (requestDate mayor) gana

### [x] Slice 7 — Config `config/env.ts`
- Tres rutas: `ausenciasLibraryUrl`, `regulLibraryUrl`, `rosterLibraryUrl`
- Backward compat: `libraryUrl` sigue funcionando como `ausenciasLibraryUrl`

### [x] Slice 8 — Loader `fileSystem/useSharePointData.ts`
- Escanear `Ausencias/` → parsear + dedup → `records`
- Escanear `Regularizaciones/` → `regulRecords`
- Cargar FOCUS roster desde `Roster/` → arrivalDates
- Cargar OBD roster desde `Roster/` → departmentMap (ya existente)
- Calcular `vacationStats` tras cargar todo

### [x] Slice 9 — Store `store/useAppStore.ts`
- Añadir `regulRecords: RegulRecord[]`
- Añadir `vacationStats: Record<string, VacationStats>` (serializable)
- `setRegulRecords()`, `setVacationStats()`

### [x] Slice 10 — UI tabla empleados
- Columnas: Empleado | Dept | Vacac. 2026 (usadas/total) | Vacac. 2025 restantes | Estado 2025
- Badge ⚠ si días prevYear caducados (restante > 0 y hoy > 31/01/Y)
- Badge ✓ si todo consumido o plazo vigente

### [x] Slice 11 — Validación + cierre
- `npm run build` + `npm run lint`
- Commit archivos relacionados
- Cerrar historia en ADO con comentario técnico en español

---

## Archivos a tocar
| Archivo | Cambio |
|---|---|
| `api/excelParser.ts` | Normalización + parser regul |
| `types/index.ts` | RegulRecord, FocusRosterRow, VacationStats |
| `utils/vacationEntitlement.ts` | NUEVO |
| `utils/deduplicateRecords.ts` | NUEVO |
| `fileSystem/departmentMapper.ts` | Ampliar con FOCUS roster |
| `fileSystem/useSharePointData.ts` | Carpetas separadas + regul + entitlement |
| `config/env.ts` | Tres rutas de librería |
| `store/useAppStore.ts` | regulRecords + vacationStats |
| `components/tables/` | Tabla empleados con métricas vacaciones |
