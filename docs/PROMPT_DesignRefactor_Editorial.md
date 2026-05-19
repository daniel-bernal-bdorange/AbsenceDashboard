# Design Refactor — Editorial / Executive Report Style

## Objetivo
Modernizar la UI del Absence Dashboard eliminando los contenedores con bordes
redondeados y sombras. El nuevo estilo es editorial: fondo blanco dominante,
datos grandes y prominentes, jerarquía basada en tipografía y espacio, no en cajas.

Stack: React + Tailwind CSS. No instalar dependencias nuevas.

---

## Reglas generales

**Eliminar por completo:**
- `rounded-xl`, `rounded-2xl`, `rounded-lg` en contenedores de secciones y gráficos
- `shadow`, `shadow-md`, `shadow-lg` en tarjetas de contenido
- `border border-gray-200` como delimitador visual de secciones
- Fondos grises (`bg-gray-50`, `bg-gray-100`) usados para separar secciones

**Sustituir por:**
- Separación visual mediante `gap` y `padding` generoso
- Divisores `<hr>` o `border-t border-gray-100` cuando se necesite separar grupos
- Fondo `bg-white` uniforme en todo el contenido

---

## KPI Cards

**Antes:** caja con borde redondeado, sombra, label arriba, número abajo en tamaño medio.

**Después:**
```
[Label en gris muted, 11–12px, uppercase, letter-spacing]
[Número en negro, 40–48px, font-bold o font-semibold]
[Delta/variación en gris, 13px]
```

```tsx
// Patrón a usar en todos los KPI
<div className="flex flex-col gap-1 py-6 border-t border-gray-200">
  <span className="text-xs uppercase tracking-widest text-gray-400">{label}</span>
  <span className="text-5xl font-bold text-gray-900 tabular-nums">{value}</span>
  {delta && <span className="text-sm text-gray-400">{delta}</span>}
</div>
```

La cuadrícula de KPIs usa `border-t` como separador, no cajas individuales:
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200">
  {/* cada KPI ocupa una celda, el borde derecho actúa como separador */}
</div>
```

---

## Secciones de gráficos

**Antes:** `<div className="bg-white rounded-xl shadow p-6">` envolviendo cada gráfico.

**Después:** sección con título tipográfico, sin caja.

```tsx
<section className="py-8">
  <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">{title}</h2>
  {/* gráfico directamente, sin contenedor adicional */}
  <OverviewChart />
</section>
```

Separar secciones con `<hr className="border-gray-100" />` o simplemente con `gap-12` en el layout padre.

---

## Layout principal

```tsx
<main className="max-w-screen-xl mx-auto px-8 py-10 space-y-12">
  <KpiGrid />
  <hr className="border-gray-100" />
  <AbsencesByTypeSection />
  <hr className="border-gray-100" />
  <TrendSection />
  <hr className="border-gray-100" />
  <AbsenceTable />
</main>
```

Sin `bg-gray-50` en el `<main>`. Fondo blanco, espacio entre secciones.

---

## Tipografía de cabeceras de sección

Unificar todas las cabeceras de sección con este patrón:

```tsx
// Título de sección — NO usar h2 con font-xl bold
<p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-4">
  Ausencias por tipo
</p>
```

Los títulos grandes (`text-xl`, `text-2xl`) solo se usan para el título principal
de la página, no para cada sección del dashboard.

---

## Header de la app

Quitar sombra del header. Borde inferior sutil:

```tsx
<header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-8 py-4">
```

---

## Color de acento

Mantener el naranja Orange Business (`#FF7900`) **solo** para:
- El indicador activo en la sidebar
- El borde superior del KPI principal (uno solo, el más importante)
- Botones de acción primaria

No usarlo como fondo de tarjetas ni como color de sección.

---

## Tabla de ausencias

- Sin `rounded` en la tabla
- Header de tabla: `text-xs uppercase tracking-wider text-gray-400 border-b border-gray-200`
- Filas: `border-b border-gray-50 hover:bg-gray-50/50`
- Sin `shadow` ni contenedor con borde en la tabla

---

## Checklist de revisión

Antes de terminar, verificar que no quedan:
- [ ] `rounded-xl` / `rounded-2xl` en secciones o gráficos
- [ ] `shadow-md` / `shadow-lg` en contenido (solo permitido en dropdowns/modals)
- [ ] `bg-gray-100` como fondo de sección
- [ ] Títulos de sección con `text-xl font-bold`

---

*Prompt de refactorización de diseño — Absence Dashboard*
*Estilo: Editorial / Executive Report*
