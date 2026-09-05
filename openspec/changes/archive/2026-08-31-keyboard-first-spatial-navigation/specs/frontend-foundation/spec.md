# Delta para Fundamentos Frontend

## ADDED Requirements

### Requirement: Contrato permanente y documentación canónica Keyboard First

GARFEX MUST conservar Keyboard First como regla permanente y transversal: todo flujo real MUST poder completarse sin mouse y el mouse MUST continuar como alternativa. Las nuevas superficies MUST reutilizar el arbitraje y la navegación espacial compartidos en lugar de crear atajos locales incompatibles. La sección 11, `Filosofía centrada en el teclado`, de `docs/erp-first-stage-design-brief.md` MUST ser la única documentación canónica del contrato y MUST mantenerse actualizada sin crear una guía duplicada.

El contrato canónico MUST establecer que `Tab` y `Shift+Tab` conservan el recorrido nativo entre zonas; las flechas sin modificar navegan por geometría física entre controles elegibles; `Enter` activa sólo acciones reales; `Escape` actúa contextualmente y restaura foco; la edición y el IME suspenden flechas espaciales y atajos de una sola tecla; `N` ejecuta sólo la acción Nueva real del contexto; `?` abre ayuda contextual por carácter semántico; `Ctrl/Cmd+K` conserva Command Palette; `Ctrl+N` no es capturado; y la contención de foco sólo MAY existir dentro de modales o diálogos.

#### Scenario: Contrato disponible en su autoridad única

- GIVEN una persona que consulta la política de interacción de GARFEX
- WHEN revisa la sección 11 del brief canónico
- THEN encuentra la regla permanente y el contrato completo de teclado
- AND el texto distingue la primera integración de las superficies futuras todavía diferidas
- AND no existe un segundo documento que compita como guía canónica de teclado

#### Scenario: Nueva integración compatible con la arquitectura

- GIVEN una nueva superficie con un flujo real aprobado
- WHEN se revisa su operación por teclado
- THEN el flujo completo puede ejecutarse sin exigir mouse
- AND reutiliza la precedencia, elegibilidad, geometría y ciclo de foco del contrato compartido
- AND no introduce captura global de `Tab`, `Ctrl+N`, una trampa global de foco ni un atajo local incompatible

## MODIFIED Requirements

### Requirement: Tema claro y activos oficiales GARFEX

La interfaz MUST limitarse al tema claro aprobado y MUST usar los tokens `background #F7F6F3`, `surface #FFFFFF`, `surface-subtle #F1F0EC`, `text-primary #1F1F1D`, `text-secondary #5F5D58`, `text-muted #6D6A64`, `border #D9D6CF`, `border-strong #B8B4AB`, `primary #7C0000`, `primary-hover #680000`, `primary-active #540000`, `primary-subtle #F7EAEA`, `accent #F2D031`, `on-accent #2B2500` y `focus #8A6800` cuando corresponda a los roles visibles del slice. El texto `GARFEX` situado en la esquina superior izquierda MUST mostrarse en `#7C0000`. Ese cambio de color MUST ser la única diferencia visual intencional en reposo de este cambio; el sistema MUST NOT alterar composición, espaciado, layout, tipografía, responsive ni estilos ajenos, y MUST preservar intacto el checkpoint visual parcial congelado de Catálogo.

(Previously: El tema ya declaraba `#7C0000` como token primario, pero no exigía ese color para el texto GARFEX superior izquierdo ni fijaba esta modificación como la única diferencia visual autorizada.)

#### Scenario: La superficie workstation usa el tema aprobado

- GIVEN la entrada runtime o la historia workstation
- WHEN se inspeccionan los roles visuales presentes
- THEN cada rol usa el token claro correspondiente
- AND el rojo y el amarillo funcionan como acentos controlados
- AND el amarillo no se usa como texto pequeño sobre fondo claro

#### Scenario: Única diferencia visual autorizada

- GIVEN la composición aprobada anterior y la superficie resultante de este cambio en estado de reposo
- WHEN se comparan visualmente
- THEN el texto superior izquierdo `GARFEX` usa exactamente `#7C0000`
- AND no existe otra diferencia de color, espaciado, layout, tipografía, responsive o composición
- AND los estados de foco exigidos son perceptibles sin rediseñar la composición en reposo
- AND el checkpoint visual parcial congelado de Catálogo no fue modificado, completado, normalizado ni revertido

El sistema MUST usar únicamente los SVG oficiales suministrados cuando presente un logotipo gráfico GARFEX y MUST conservar su proporción, colores internos, área libre y contraste sin deformación, giro, sombras, efectos ni recoloreado.

#### Scenario: El shell presenta identidad oficial sin alterar el activo

- GIVEN que el shell presenta un logotipo gráfico GARFEX
- WHEN se compara el recurso mostrado con los SVG oficiales
- THEN se usa una variante oficial adecuada al fondo
- AND el archivo no fue modificado para normalizar la discrepancia de rojo existente en los SVG positivos
- AND la identidad tiene un nombre accesible reconocible como `GARFEX`
