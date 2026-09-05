# Design Brief UX/UI — Primera etapa del ERP GARFEX

> **Estado:** base de descubrimiento con decisiones aprobadas y preguntas abiertas.  
> **Alcance:** Maestro de Recursos y actualización de precios.  
> **Idioma del producto y sus artefactos:** español.  
> Este documento define la experiencia antes de diseñar pantallas finales o implementar la interfaz.

## 1. Visión del producto

Construir un ERP empresarial moderno para administrar obras, compras, cotizaciones, análisis de precios unitarios, recursos maestros y precios comerciales.

El producto debe reducir el tiempo entre recibir información de compra y utilizar precios confiables en cotizaciones. Debe permitir que usuarios expertos procesen grandes volúmenes mediante teclado, paleta de comandos, acciones masivas, mouse y controles táctiles.

La primera etapa se enfoca en:

1. Administrar el Maestro de Recursos.
2. Recibir información de compras desde XML de facturas.
3. Vincular conceptos de compra y precios observados con recursos maestros.
4. Mantener un precio para cotizaciones derivado de una política automática.
5. Proporcionar al administrador una mesa de trabajo para actualizaciones, excepciones y vigencia de precios.

## 2. Alcance de la primera etapa

### Incluido

- Búsqueda, creación, edición, desactivación y reactivación de recursos maestros.
- Clases, familias, tipos, unidades, atributos, opciones y reglas de compatibilidad.
- Formularios dinámicos generados desde metadatos del catálogo.
- Ingesta de XML de facturas de compra como fuente inicial principal.
- Vinculación entre conceptos de compra y recursos maestros.
- Múltiples precios comerciales observados por recurso.
- Política automática para determinar el precio de cotización.
- Historial de precios, trazabilidad de origen y vigencia.
- Procesamiento masivo y resolución de excepciones.
- Bandeja operativa y centro de actividad persistente.
- Operación completa mediante teclado, mouse y controles táctiles.
- Experiencias adaptadas para escritorio, tablet y móvil.

### Fuera de alcance

- Pantallas visuales finales.
- Gestión completa de obras.
- Flujos completos de compras y proveedores.
- Flujos completos de cotización y análisis de precios unitarios.
- Matriz definitiva de roles y permisos.
- Política definitiva de confianza y revisión de agentes de IA.
- Inventario y existencias de proveedores.
- Chat de IA de propósito general.

Estas áreas condicionan la arquitectura futura, pero no deben ampliar prematuramente la primera etapa.

## 3. Tipo de interfaz

Una mesa de trabajo empresarial densa, dinámica y orientada a comandos para trabajo operativo repetitivo.

Características:

- El teclado es el canal principal, pero nunca el único.
- Optimizada para usuarios expertos y frecuentes.
- Tablas como herramienta principal de comparación y trabajo masivo.
- Paneles contextuales que conservan la posición en la lista.
- Formularios dinámicos derivados de metadatos.
- Bandeja operativa en lugar de un panel de indicadores pasivo.
- Paridad funcional adaptativa entre dispositivos.
- Descubrimiento progresivo de comandos avanzados.

No se asume como solución predeterminada una navegación ERP profundamente jerárquica ni un asistente rígido de varios pasos.

## 4. Usuarios principales

### Usuario inicial de validación

**Administrador experto**

La primera experiencia se validará con un administrador que pueda recorrer el flujo completo. Esto permite comprender el modelo operativo antes de dividirlo en experiencias desconectadas por rol.

### Usuarios especializados futuros

- Analista de compras.
- Analista de costos y cotizaciones.
- Especialista del catálogo técnico.
- Operador de clasificación de recursos.
- Revisor o aprobador.
- Supervisor de consulta.
- Responsable de obra.

La estructura del catálogo debe quedar restringida a especialistas, aunque el administrador inicial tenga acceso amplio.

## 5. Objetivos de negocio

- Mantener un catálogo confiable y reutilizable de recursos maestros.
- Vincular conceptos de compra con recursos técnicos.
- Acumular precios de distintas compras, proveedores, fechas, unidades y empaques.
- Producir un precio confiable para cotizaciones mediante una política automática.
- Reducir trabajo manual de clasificación y actualización.
- Prevenir recursos duplicados o técnicamente inconsistentes.
- Preservar trazabilidad histórica de precios y documentos.
- Establecer una base escalable para compras, obras, cotizaciones y precios unitarios.

## 6. Objetivos de UX

- Permitir que usuarios expertos completen operaciones frecuentes sin abandonar el teclado.
- Procesar cientos de registros mediante flujos orientados a lotes.
- Dirigir la atención hacia excepciones en lugar de revisar cada resultado válido.
- Conservar contexto al desplazarse entre listas y registros.
- Hacer inspeccionables y trazables las decisiones automáticas.
- Prevenir errores costosos sin confirmar cada acción menor.
- Hacer descubribles las funciones avanzadas desde la paleta de comandos.
- Mantener todas las capacidades en escritorio, tablet y móvil mediante flujos adaptados.
- Explicar por qué cambian los campos, reglas, precios o advertencias.

## 7. Principios de experiencia

### Velocidad con control

Las acciones rápidas deben ser reversibles o mostrar claramente su impacto.

### Trabajar desde las excepciones

Los registros rutinarios válidos requieren intervención mínima. La atención se concentra en datos faltantes, unidades incompatibles, duplicados, variaciones atípicas o procesos fallidos.

### Reconocimiento antes que memoria

Comandos, filtros, estados y atajos deben permanecer visibles o ser fáciles de descubrir.

### Preservación de contexto

Abrir o editar un registro no debe descartar filtros, selección, desplazamiento, configuración de tabla ni contexto del lote.

### Separación técnica y comercial

Un recurso maestro describe **qué es un elemento**. Las compras y ofertas describen **cómo, cuándo y a qué precio se adquirió**.

### Una sola autoridad del modelo

La interfaz anticipa errores, pero las reglas del catálogo y la validación del servidor son la autoridad final.

### Poder progresivo

Las acciones básicas permanecen visibles. Los usuarios avanzados descubren gradualmente atajos, alias, vistas guardadas y acciones masivas.

### Adaptar, no comprimir

Móvil conserva las capacidades sin intentar reducir literalmente la composición de escritorio.

### Automatización explicable

La IA debe mostrar estado, fuente, resultado y acciones correctivas. No debe presentarse como autoridad inexplicable.

## 8. Modelo de dominio relevante para UX

```text
Clase
└── Familia
    └── Tipo
        └── Recurso maestro
            ├── Valores de atributos dinámicos
            ├── Precios comerciales observados
            └── Precio vigente para cotización
```

Consecuencias para la experiencia:

- La clasificación determina atributos y unidades disponibles.
- Los formularios cambian según el tipo y sus reglas.
- Las opciones controladas reducen valores inconsistentes.
- La identidad técnica permite detectar duplicados.
- Los recursos se desactivan en lugar de eliminarse.
- Los conflictos de revisión deben impedir sobrescrituras silenciosas.
- Los precios conservan proveedor, fecha, unidad, empaque, historial y documento de origen.

## 9. Flujos principales

### 9.1 Inicio operativo

1. El usuario entra en la bandeja operativa.
2. Revisa actualizaciones, excepciones, precios desactualizados e indicadores compactos.
3. Abre un pendiente o busca mediante la paleta de comandos.
4. Completa la tarea sin perder el contexto de la bandeja.

### 9.2 Procesamiento de XML de compra

1. Se recibe un XML de factura de compra.
2. El proceso aparece en el centro de actividad.
3. Los conceptos se interpretan y relacionan con recursos maestros.
4. Se muestran relaciones existentes, clasificaciones faltantes, conflictos de unidad y duplicados.
5. El administrador resuelve las excepciones necesarias.
6. Los precios observados se vinculan con sus recursos maestros.
7. La política automática recalcula el precio de cotización.
8. El resultado conserva trazabilidad hacia el documento original.

La política exacta de confianza de IA y revisión humana continúa pendiente.

### 9.3 Creación de un recurso maestro

1. Partir de una clase, familia y tipo conocidos o sugeridos.
2. Cargar los atributos definidos para el tipo.
3. Completar valores controlados y condicionales.
4. Validar unidades, datos obligatorios y compatibilidad.
5. Comprobar la identidad determinista para detectar duplicados.
6. Crear el recurso como activo cuando sea válido.
7. Regresar al contexto operativo anterior.

No se adopta por defecto un asistente rígido. Para usuarios expertos puede ser más eficiente un formulario continuo, agrupado y con validación inmediata.

### 9.4 Revisión y actualización de precios

1. Seleccionar un recurso maestro.
2. Comparar proveedor, fecha, unidad, empaque, documento e historial.
3. Inspeccionar el precio producido por la política automática.
4. Detectar variaciones, antigüedad o problemas de normalización.
5. Aplicar correcciones o acciones permitidas.
6. Preservar motivo y origen de los cambios relevantes.

### 9.5 Gobierno del catálogo

Los especialistas administran clases, familias, tipos, unidades, atributos, opciones, reglas condicionales y compatibilidades.

Estos cambios afectan numerosos recursos y normalmente requieren espacios de trabajo completos, no edición rápida en línea.

### 9.6 Acción masiva

1. Seleccionar registros desde una tabla o conjunto filtrado.
2. Elegir una acción válida para el contexto.
3. Definir la transformación.
4. Previsualizar registros afectados, advertencias y exclusiones.
5. Confirmar la operación.
6. Continuar trabajando mientras el proceso corre en segundo plano.
7. Revisar resultados completos, parciales y fallidos.

## 10. Sistema de navegación

La navegación combina tres caminos:

- **Navegación persistente:** acceso reconocible a áreas principales.
- **Paleta unificada:** acceso rápido a módulos, registros, vistas y acciones.
- **Relaciones contextuales:** navegación entre recurso, precios, documentos, clasificación, dependencias y revisiones.

El sistema conserva última ubicación, filtros, selección, columnas, densidad y destinos recientes.

## 11. Filosofía centrada en el teclado

Keyboard First es una regla permanente y transversal de GARFEX: todo flujo real debe poder completarse sin mouse, mientras el mouse continúa siendo una alternativa válida. Las nuevas superficies deben reutilizar este arbitraje, navegación espacial y ciclo de foco compartidos; no deben inventar atajos incompatibles.

### Contrato permanente de interacción

- `Tab` y `Shift+Tab` conservan el recorrido nativo entre zonas mayores. GARFEX no captura `Tab` globalmente ni instala un orden roving para todo el documento.
- Las flechas sin modificar navegan por geometría física vigente del viewport entre controles conectados, visibles, habilitados, operables y pertenecientes al contexto activo. Se priorizan semiplano, proximidad y alineación perpendicular; el desempate es determinista y no depende de idioma, texto, RTL, orden DOM u orden de una lista.
- `Enter` activa únicamente el control enfocado cuando tiene una acción real; en una fila de atributo activa abre Opciones cuando la definición es de tipo `OPCION`, o edición si no lo es. `E` siempre abre la edición contextual, sin importar el tipo. `O` abre Opciones sólo cuando esa definición es de tipo `OPCION`. `Escape` cierra, cancela o vuelve según el contexto activo y restaura el foco al opener válido o a un fallback accesible explícito.
- La edición, los campos de formulario, autocomplete, `contenteditable` y la composición IME suspenden flechas y atajos de una sola tecla. También se respetan el consumo local, `defaultPrevented` y los modificadores no registrados.
- `N` o `n` abre sólo la acción real y visible Nueva Clase en Catálogo cuando está habilitada y no hay un overlay superior. No crea acciones para Bandeja, Familia o Tipo.
- `B` o `b` enfoca el buscador de Recursos maestros cuando esa pantalla está activa y no hay un overlay superior. No crea acciones en ninguna otra superficie.
- `?` abre la ayuda contextual por el carácter semántico producido por el teclado, incluso con los modificadores necesarios para una distribución internacional; no se asume la posición física de `/`.
- `Ctrl/Cmd + K` conserva la Command Palette exacta de cada plataforma, sin Shift, Alt ni el modificador opuesto. `Ctrl+N` permanece reservado al navegador o sistema y GARFEX no lo captura ni cancela.
- La contención de foco sólo existe dentro de un modal o diálogo activo. Al cerrarlo, la contención desaparece y el foco no se pierde en `body`, el fondo inactivo o un nodo desconectado.
- Todo control enfocado muestra un indicador perceptible de foco conforme al objetivo WCAG 2.2 AA. La operación por teclado no elimina las alternativas visibles de mouse o controles táctiles.

### Tabla canónica de atajos

| Atajo | Regla y alcance |
|---|---|
| `Tab` / `Shift+Tab` | Recorrido nativo entre zonas; nunca captura global |
| Flechas | Navegación espacial física entre controles elegibles del contexto activo |
| `Enter` | En una fila de atributo activa, abre Opciones si es `OPCION`, o edición si no; conserva su activación nativa fuera de esa acción real |
| `E` | Siempre edita la definición de la fila de atributo activa |
| `O` | Abre Opciones sólo para la fila activa cuya definición es `OPCION` |
| `Escape` | Cierra o cancela una capa y restaura opener o fallback una sola vez |
| `N` / `n` | Abre la acción contextual real disponible en Catálogo |
| `B` / `b` | Enfoca el buscador de Recursos maestros |
| `?` | Ayuda contextual por `event.key === "?"`, sin asumir layout estadounidense |
| `Ctrl/Cmd + K` | Command Palette con el modificador exacto de la plataforma |
| `Ctrl+N` | Comando reservado; GARFEX lo deja pasar sin cancelarlo |

Este primer slice integra Bandeja, Catálogo, las acciones contextuales disponibles, edición de atributos, administración de opciones `OPCION`, Command Palette, ayuda contextual y el listado de solo lectura de Recursos maestros (navegación espacial entre filas y buscador con atajo `B`). Familia, Tipo, el alta/edición de Recurso, las acciones que no tengan una capacidad real aprobada, superficies densas o virtualizadas y los flujos responsive, móvil y touch permanecen diferidos hasta que exista una capacidad real aprobada. Esa postergación no reduce la regla permanente: cada integración futura debe reutilizar este contrato y aportar su propia evidencia.

## 12. Paleta de comandos

La paleta es una entrada universal con categorías visibles:

- **Ir a:** módulos, secciones y vistas guardadas.
- **Buscar:** recursos, compras, documentos y organizaciones.
- **Crear:** entidades permitidas.
- **Actuar:** comandos válidos para el contexto actual.
- **Cambiar:** vista, densidad, tema u organización.
- **Ayuda:** atajos y descubrimiento de comandos.

Debe ofrecer búsqueda difusa, recientes, favoritos, permisos, ranking contextual, pistas de atajos y acceso táctil. Ninguna acción irreversible se ejecuta solamente por resaltarla.

## 13. Tablas, paneles y formularios

### Tablas

Herramienta principal para comparar, filtrar, ordenar, seleccionar lotes, revisar precios y resolver excepciones.

Deben permitir densidad ajustable, columnas configurables, vistas guardadas, selección persistente, navegación por foco y resúmenes de acciones masivas.

### Modelo mixto de edición

| Contenedor                 | Uso correcto                                      |
| -------------------------- | ------------------------------------------------- |
| Edición en línea           | Valores simples, reversibles y fáciles de validar |
| Panel lateral persistente  | Consulta y edición contextual sin perder la tabla |
| Panel superpuesto temporal | Tareas secundarias breves                         |
| Ventana modal              | Confirmaciones o decisiones muy acotadas          |
| Pantalla completa          | Configuración compleja y relaciones extensas      |

Los formularios largos no deben colocarse en ventanas modales o paneles superpuestos estrechos.

### Formularios dinámicos

Deben explicar campos obligatorios, opcionales, condicionales, prohibidos y no aplicables; distinguir valores controlados de texto libre; mostrar estado de guardado y anticipar duplicados.

### Guardado

- Autoguardar borradores, preferencias y estado personal no crítico.
- Guardar explícitamente cambios operativos o estructurales.
- Previsualizar el impacto de operaciones masivas.
- Ofrecer deshacer para acciones reversibles.

## 14. Panel de indicadores y bandeja operativa

La entrada principal es una bandeja operativa, no solamente un panel ejecutivo de indicadores.

Prioriza:

- Importaciones XML y actualizaciones recientes.
- Recursos pendientes de vinculación o corrección.
- Excepciones de datos y compatibilidad.
- Duplicados.
- Recursos sin precio.
- Precios antiguos o con variaciones relevantes.
- Procesos fallidos o incompletos.
- Indicadores compactos de compras, cotizaciones, obras y actividad.

Las gráficas deben responder preguntas operativas y conducir a trabajo filtrado.

## 15. Comportamiento adaptativo

### Escritorio

Tabla densa con panel persistente, acciones masivas, teclado completo, relaciones visibles y densidad configurable.

### Tablet

Capacidad equivalente a escritorio, soporte de teclado externo, objetivos táctiles y paneles que coexisten cuando hay espacio.

### Móvil

Paridad funcional mediante flujos secuenciales, listas estructuradas, vistas enfocadas de columnas y modos explícitos de selección masiva. La paleta permanece accesible mediante un control visible.

Paridad funcional no significa repetir la misma composición visual.

## 16. Accesibilidad

Objetivo base: **WCAG 2.2 AA**.

- Operación completa por teclado.
- Orden lógico y foco claramente visible.
- Tablas y formularios semánticos.
- Mensajes de validación accesibles.
- Contraste suficiente.
- Estados que no dependan solamente del color.
- Objetivos táctiles mínimos de 44 × 44 px.
- Soporte de movimiento reducido.
- Anuncios accesibles para procesos asíncronos.
- Comportamiento predecible de `Esc`.
- Prevención de conflictos de atajos.

## 17. Estados y retroalimentación

La experiencia contempla carga, vacío, sin resultados, errores de validación, cambios condicionales, duplicados, unidades incompatibles, precios antiguos, conflictos de revisión, pérdida de conexión, procesos en segundo plano, éxito parcial, permiso denegado y origen documental ausente.

Los procesos largos viven en un centro de actividad con progreso, conteos, resultado, errores y reintentos.

### Riesgo graduado

- Deshacer para cambios reversibles.
- Confirmación explícita para operaciones difíciles de revertir.
- Vista previa de impacto para lotes y cambios de catálogo.
- Resúmenes útiles en lugar de mensajes genéricos de éxito.

## 18. Identidad visual GARFEX

### Activos oficiales

El proyecto dispone de seis variantes SVG:

- Logotipo completo color positivo.
- Logotipo completo blanco negativo.
- Logotipo completo negro positivo.
- Isotipo `G` color positivo.
- Isotipo `G` blanco negativo.
- Isotipo `G` negro positivo.

El logotipo completo se usa en contextos corporativos y formales. El isotipo se reserva para navegación compacta, favicon, accesos y superficies con espacio reducido.

### Colores canónicos

| Token                   | Valor     | Uso                                |
| ----------------------- | --------- | ---------------------------------- |
| Rojo corporativo        | `#7C0000` | Marca y acción primaria controlada |
| Rojo al pasar el cursor | `#680000` | Estado interactivo bajo el cursor  |
| Rojo activo             | `#540000` | Estado presionado                  |
| Amarillo                | `#F2D031` | Rayo y acento limitado             |
| Gris de apoyo           | `#D9D6D3` | Apoyo de identidad                 |
| Negro                   | `#000000` | Variante monocromática             |
| Blanco                  | `#FFFFFF` | Variante negativa y superficies    |

El rojo y amarillo deben funcionar como acentos, no como grandes superficies dominantes. El amarillo no se usa como texto pequeño sobre fondo claro.

### Fundamentos claro y oscuro

| Rol              | Claro     | Oscuro    |
| ---------------- | --------- | --------- |
| Fondo            | `#F7F6F3` | `#161616` |
| Superficie       | `#FFFFFF` | `#1D1D1B` |
| Texto principal  | `#1F1F1D` | `#ECEAE5` |
| Texto secundario | `#5F5D58` | `#C3C0B8` |
| Borde            | `#D9D6CF` | `#383733` |
| Primario         | `#7C0000` | `#B33A3A` |
| Foco             | `#8A6800` | `#E4B84A` |

El tema oscuro utiliza gris profundo, no negro puro.

### Colores semánticos

Los estados no reutilizan automáticamente el rojo de marca:

| Estado      | Claro     | Oscuro    |
| ----------- | --------- | --------- |
| Éxito       | `#2F6B4F` | `#6FCF97` |
| Advertencia | `#8A6800` | `#E4B84A` |
| Error       | `#B4232F` | `#FF8A94` |
| Información | `#356A8A` | `#76B6D6` |

### Tipografía

- **Nexa:** encabezados y títulos.
- **RNS Sanz:** interfaz, etiquetas, campos, tablas y texto extendido.
- **Monola Script:** uso decorativo muy limitado; nunca para trabajo operativo.
- **Fuentes alternativas temporales:** Inter y Arial cuando las fuentes corporativas no estén disponibles.

No debe declararse cumplimiento tipográfico de marca hasta que las fuentes corporativas estén instaladas y verificadas.

### Reglas del logo

- Mantener relación de aspecto y proporciones internas.
- Conservar un área libre mínima de `1x`.
- Elegir variante positiva o negativa por contraste.
- No agregar sombras, resplandores ni efectos.
- No rotar, comprimir, estirar ni inclinar.
- No recolorear arbitrariamente.
- No colocarlo sobre fondos con contraste insuficiente.

### Discrepancia pendiente

Los SVG rojos positivos contienen `#8B0000`, mientras que el manual canónico y los tokens digitales definen `#7C0000`. Los SVG originales deben conservarse sin modificación hasta que el responsable de marca confirme cuál valor debe normalizarse.

## 19. Personalidad visual

**Técnica, sobria, precisa y contemporánea.**

Debe comunicar confiabilidad, control operativo, jerarquía, velocidad y precisión de ingeniería. Se evita la decoración excesiva, gradientes innecesarios, tarjetas sobredimensionadas y señales de IA que dominen los datos de negocio.

## 20. Referencias conceptuales

- **Linear:** velocidad, foco, densidad y consistencia.
- **Raycast:** descubrimiento y ejecución de comandos.
- **Superhuman:** aprendizaje progresivo del teclado.
- **VS Code:** arquitectura de comandos y acciones contextuales.
- **ERP modernos:** estructuras empresariales, trazabilidad e informes.

Se toman principios, no composiciones visuales.

## 21. Riesgos principales

1. Comprimir la interfaz de escritorio en móvil en lugar de adaptar los flujos.
2. Saturar la paleta de comandos.
3. Incorporar demasiados atajos antes de tiempo.
4. Hacer impredecibles los formularios dinámicos.
5. Mezclar recursos técnicos con productos o precios comerciales.
6. Confirmar todas las acciones y reducir velocidad.
7. Aplicar lotes sin previsualizar impacto.
8. Sacrificar accesibilidad por densidad.
9. Tratar la IA como autoridad sin procedencia visible.
10. Expandir la primera etapa al ERP completo.
11. Mostrar métricas sin conexión con acciones.
12. Ocultar diferencias entre unidad, empaque, impuesto y origen.
13. Usar la identidad de marca como sustituto de jerarquía UX.

## 22. Decisiones pendientes

- Política automática exacta para determinar precios.
- Confianza, revisión y excepciones de IA.
- Flujo detallado XML → recurso → precio.
- Matriz futura de roles y permisos.
- Versionado y publicación de cambios del catálogo.
- Mapa avanzado de atajos.
- Límites de personalización y vistas guardadas.
- Monedas, impuestos, localización y conversiones.
- Volumen máximo y objetivos de rendimiento.
- Indicadores iniciales de la bandeja.
- Requisitos de auditoría.
- Expectativas sin conexión o con conectividad inestable.
- Alcance futuro del chat.
- Confirmación del rojo de los SVG (`#8B0000` frente a `#7C0000`).
- Disponibilidad y licencias de Nexa y RNS Sanz.

## 23. Criterios de validación UX

Antes de avanzar a alta fidelidad debe demostrarse que:

- Un experto encuentra cualquier recurso sin navegar menús profundos.
- Las acciones centrales funcionan con teclado, mouse y controles táctiles.
- Un lote grande no exige abrir cada registro.
- Las excepciones se entienden y pueden resolverse.
- Cada precio puede rastrearse hasta su fuente.
- Los formularios dinámicos son comprensibles.
- Los lotes muestran impacto antes de ejecutarse.
- La experiencia de escritorio conserva contexto al abrir y editar.
- Móvil mantiene capacidades mediante flujos adaptados.
- La accesibilidad es una restricción estructural.
- La identidad GARFEX conserva contraste, proporciones y jerarquía.

## 24. Flujo de diseño previo a la implementación en OpenPencil

OpenPencil es el espacio oficial de diseño. La interfaz debe diseñarse, validarse y aprobarse allí antes de implementar producción.

Orden de trabajo:

1. Definir arquitectura de información y flujos.
2. Crear exploraciones de baja fidelidad en OpenPencil.
3. Validar navegación, teclado, tablas, paneles, formularios y adaptación entre dispositivos.
4. Refinar componentes y alta fidelidad.
5. Documentar estados, accesibilidad y reglas.
6. Obtener aprobación explícita.
7. Implementar en código.
8. Comparar la implementación con el diseño aprobado.

Los tableros actuales son:

- `01 Referencia de marca`.
- `02 Tokens de interfaz`.
- `03 Fundamentos UX`.

Estos tableros establecen fundamentos, no pantallas finales.

## 25. Próxima fase UX/UI recomendada

1. Mapear entidades y relaciones de navegación.
2. Definir la jerarquía de la bandeja operativa.
3. Modelar el recorrido XML → actualización de precio, incluyendo excepciones.
4. Definir la relación tabla → detalle del recurso.
5. Especificar reglas de formularios dinámicos.
6. Establecer la primera taxonomía de comandos.
7. Crear flujos para escritorio, tablet y móvil en OpenPencil.
8. Probarlos con ejemplos reales de recursos y facturas.

Solamente después de validar estos flujos se debe diseñar composición detallada, componentes y pantallas de alta fidelidad. La implementación comienza únicamente tras aprobación explícita del diseño.
