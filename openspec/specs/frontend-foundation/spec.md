# Especificación de Fundamentos Frontend

## Purpose

Establecer una base frontend GARFEX completa, verificable y limitada al primer slice, sin convertir dependencias instaladas ni evidencia visual en funcionalidad de producto ficticia.

## Requirements

### Requirement: Baseline obligatorio administrado con pnpm

El sistema MUST usar pnpm como único administrador de paquetes y MUST instalar y configurar React 19, TypeScript, Vite, TanStack Router, TanStack Form, TanStack Table, TanStack Virtual, React Aria Components, Tailwind CSS, Vitest, React Testing Library, Playwright, Storybook, ESLint y Prettier.

#### Scenario: El baseline completo es resoluble

- GIVEN una instalación limpia del workspace
- WHEN se instala el proyecto con pnpm y se inspeccionan el manifiesto, el lockfile y las configuraciones
- THEN todas las tecnologías obligatorias están declaradas y son resolubles
- AND React corresponde a la versión mayor 19
- AND no se requiere otro administrador de paquetes

#### Scenario: La instalación no crea producto ficticio

- GIVEN que TanStack Form, Table y Virtual forman parte del baseline obligatorio
- WHEN se revisan sus usos después del bootstrap
- THEN su presencia puede acreditarse mediante resolución o smoke checks de configuración
- AND no existen formularios, tablas, listas virtualizadas ni datos de demostración creados sólo para exhibir esas dependencias

### Requirement: Comandos operativos del baseline

El sistema MUST exponer mediante pnpm comandos verificables para desarrollo, build, pruebas Vitest/RTL, Playwright, Storybook, lint, comprobación de formato y typecheck.

#### Scenario: Los comandos del baseline están disponibles

- GIVEN que la instalación con pnpm terminó correctamente
- WHEN se consultan y ejecutan los comandos declarados
- THEN `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm exec vitest`, `pnpm exec playwright test`, `pnpm storybook`, `pnpm lint`, `pnpm format:check` y `pnpm typecheck` están disponibles para su propósito declarado
- AND los procesos interactivos informan un arranque correcto
- AND los procesos finitos terminan con un código de salida veraz

### Requirement: Tema claro y activos oficiales GARFEX

La interfaz MUST limitarse al tema claro aprobado y MUST usar los tokens `background #F7F6F3`, `surface #FFFFFF`, `surface-subtle #F1F0EC`, `text-primary #1F1F1D`, `text-secondary #5F5D58`, `text-muted #6D6A64`, `border #D9D6CF`, `border-strong #B8B4AB`, `primary #7C0000`, `primary-hover #680000`, `primary-active #540000`, `primary-subtle #F7EAEA`, `accent #F2D031`, `on-accent #2B2500` y `focus #8A6800` cuando corresponda a los roles visibles del slice. El sistema MUST NOT añadir un tema oscuro ni variantes cromáticas no aprobadas en este cambio.

#### Scenario: La superficie workstation usa el tema aprobado

- GIVEN la entrada runtime o la historia workstation
- WHEN se inspeccionan los roles visuales presentes
- THEN cada rol usa el token claro correspondiente
- AND el rojo y el amarillo funcionan como acentos controlados
- AND el amarillo no se usa como texto pequeño sobre fondo claro

El sistema MUST usar únicamente los SVG oficiales suministrados cuando presente un logotipo gráfico GARFEX y MUST conservar su proporción, colores internos, área libre y contraste sin deformación, giro, sombras, efectos ni recoloreado.

#### Scenario: El shell presenta identidad oficial sin alterar el activo

- GIVEN que el shell presenta un logotipo gráfico GARFEX
- WHEN se compara el recurso mostrado con los SVG oficiales
- THEN se usa una variante oficial adecuada al fondo
- AND el archivo no fue modificado para normalizar la discrepancia de rojo existente en los SVG positivos
- AND la identidad tiene un nombre accesible reconocible como `GARFEX`

### Requirement: Fallback tipográfico temporal divulgado

Mientras Nexa y RNS Sanz no estén instaladas y verificadas, el sistema MUST usar un fallback temporal documentado basado en Inter y Arial y MUST NOT declarar cumplimiento tipográfico completo de marca.

#### Scenario: Las fuentes corporativas siguen no disponibles

- GIVEN que Nexa y RNS Sanz no cuentan con disponibilidad y licencia verificadas
- WHEN se revisan los estilos y la documentación de la superficie
- THEN se aplica el fallback temporal documentado
- AND la limitación queda divulgada para revisión
- AND ninguna pantalla o informe afirma que la tipografía corporativa está completa

### Requirement: Límites feature-first del Scope Rule

El sistema MUST mantener una organización feature-first con Bandeja como primer límite de producto y MUST limitar lo compartido al arranque, routing, tokens y primitivas realmente transversales. El sistema MUST NOT crear wrappers genéricos, adaptadores preventivos, facades ni abstracciones compartidas sin un segundo consumidor aprobado.

#### Scenario: Una responsabilidad de Bandeja permanece en su feature

- GIVEN una responsabilidad usada únicamente por Bandeja
- WHEN se inspecciona su pertenencia arquitectónica
- THEN permanece dentro del límite de Bandeja
- AND no existe un wrapper transversal creado para anticipar consumidores futuros

### Requirement: Catálogo feature-local

Catálogo MAY consumir la superficie pública Convex `catalogoAdmin/jerarquia` desde su feature para las lecturas y altas contextuales de Clase, Familia y Tipo. No otorga al frontend autoridad de datos y no habilita Recursos, actualización, borrado, activación, desactivación ni lifecycle.

### Requirement: Uso proporcional del stack instalado

El sistema MUST usar TanStack Router para la ruta real de Bandeja y MUST usar React Aria Components para los composites u overlays accesibles que sí tengan responsabilidad observable en el slice. TanStack Form, TanStack Table y TanStack Virtual MUST permanecer sin consumidores de producto o demostración mientras no exista un formulario, tabla funcional o volumen aprobado que los requiera.

#### Scenario: Un motor instalado no fuerza una capacidad

- GIVEN que TanStack Form, Table y Virtual están instalados y configurados
- WHEN se inspeccionan los imports de producto, proveedores y stories
- THEN no existen consumidores, wrappers ni ejemplos funcionales creados sólo para justificar su instalación
- AND una comprobación de resolución aislada no se presenta como comportamiento de producto

### Requirement: Ausencia de infraestructura y dominio especulativos

El sistema MUST NOT introducir backend, API, persistencia, sincronización, permisos, métricas, reglas de dominio, stores globales, repositorios, casos de uso, gateways, facades ni una capa de estado de consultas.

#### Scenario: El frontend permanece sin autoridad de datos

- GIVEN el grafo del runtime del primer slice
- WHEN se inspeccionan sus dependencias y efectos externos
- THEN no existe cliente de backend ni contrato de endpoint
- AND no existe lectura o escritura de persistencia de producto
- AND no existe una capa que simule autoridad, reglas o estado de dominio

### Requirement: Verificación estricta y reporte veraz

Una vez disponible el arnés de pruebas, cada comportamiento de producto MUST desarrollarse con evidencia RED-GREEN-REFACTOR y MUST superar las comprobaciones enfocadas de Vitest/RTL, Playwright y Storybook que le correspondan, además de build, lint, formato y typecheck. Toda comprobación MUST reportarse como aprobada, fallida o no disponible según su resultado real.

#### Scenario: El baseline y el slice superan la puerta de calidad

- GIVEN una instalación completa y un entorno con las dependencias de ejecución necesarias
- WHEN se ejecuta la verificación del cambio
- THEN las pruebas enfocadas, el recorrido Playwright workstation, la historia aprobada, build, lint, comprobación de formato y typecheck finalizan correctamente
- AND el reporte identifica los comandos realmente ejecutados

#### Scenario: Una comprobación falla o no está disponible

- GIVEN una comprobación que termina con error o no puede ejecutarse por una limitación del entorno
- WHEN se redacta el reporte de verificación
- THEN la comprobación MUST NOT declararse aprobada
- AND el reporte indica su estado real, la causa conocida y el impacto sobre la confianza de entrega
