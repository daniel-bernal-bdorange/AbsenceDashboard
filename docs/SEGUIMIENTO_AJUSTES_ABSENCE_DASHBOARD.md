# Seguimiento de ajustes - Absence Dashboard

Fecha de inicio: 2026-06-12

## Objetivo
Registrar el avance de los cambios pendientes para poder continuar entre conversaciones sin perder contexto.

## Orden de implementación

| Estado | Cambio | Nota |
|---|---|---|
| Pendiente | Integrar tope máximo de 26 días de vacaciones | Límite independiente de trienios |
| Pendiente | Hacer que los filtros afecten a la tabla de empleados | La tabla debe respetar los filtros activos |
| Pendiente | Exportar a Excel en lugar de CSV | Mantener nombre de archivo y descarga directa |
| Pendiente | Eliminar duplicados en la tabla de vacaciones | Revisar clave de deduplicación y agregación |
| Pendiente | Incluir regularizaciones en el cálculo | Considerar el impacto de `expenditureQuantity` |
| Pendiente | Añadir filtro de estado | Debe aplicar a todas las tablas afectadas |

## Criterios de validación

1. La tabla de empleados refleja los filtros activos.
2. La tabla de vacaciones no duplica registros.
3. Las regularizaciones alteran el saldo esperado.
4. El cupo máximo de vacaciones queda capado en 26 días.
5. Existe un filtro de estado funcional.
6. La exportación genera un archivo `.xlsx`.

## Decisiones confirmadas

- `expenditureQuantity` negativo significa días extra consumidos y debe reducir el saldo.

## Notas de seguimiento

- Si se detecta una discrepancia entre tablas, priorizar la fuente de datos común y no solo el renderizado.
- Si aparecen cambios colaterales, dejar constancia aquí antes de cerrar la tarea.