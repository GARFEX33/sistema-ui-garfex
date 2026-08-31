# Prepropuesta — Decisión pendiente sobre datos visibles

## Estado

Resuelto. Decisión confirmada: `storybook_only`.

## Evidencia

- `page04.png` aprueba únicamente una Bandeja operativa poblada en workstation 1440×980.
- El alcance aprobado prohíbe inventar métricas, registros o contratos de backend.
- No existe todavía un backend integrado ni un diseño aprobado de estado vacío, loading o error.

## Decisión requerida

Definir dónde se permite usar el contenido poblado de la captura aprobada durante el primer cambio.

### `storybook_only`

Reproducir la composición poblada mediante fixtures aislados en Storybook y pruebas visuales. La aplicación runtime implementa shell, ruta y entrada de Bandeja, pero no presenta registros ficticios ni inventa un estado vacío.

Consecuencia: máxima honestidad de producto; la pantalla runtime quedará deliberadamente incompleta hasta contar con backend o un estado vacío aprobado.

### `demo_runtime`

Mostrar en runtime los mismos datos de demostración de la captura, aislados detrás de un proveedor local explícito y sin presentarlos como backend real.

Consecuencia: mayor fidelidad visual inmediata; existe riesgo de que una demo se confunda con comportamiento productivo y luego haya que retirar el proveedor.

### `design_empty_state`

Detener la implementación visual de Bandeja y volver primero a OpenPencil para aprobar un estado vacío real.

Consecuencia: evita datos ficticios y permite una runtime completa, pero amplía el trabajo de diseño antes del código.

## Decisión confirmada

La composición poblada y sus fixtures se implementarán únicamente en Storybook y pruebas visuales. La aplicación runtime implementará el shell, la ruta y la entrada de Bandeja sin presentar registros ficticios ni inventar un estado vacío. La pantalla runtime permanecerá deliberadamente incompleta hasta contar con backend o un estado vacío aprobado en OpenPencil.

## Alcance preservado

La decisión no habilita backend, métricas inventadas, responsive, tablet, móvil, estados adicionales ni funcionalidades futuras.
