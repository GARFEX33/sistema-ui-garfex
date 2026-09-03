# Delta para Fundamentos Frontend

## MODIFIED Requirements

### Requirement: Límites feature-first del Scope Rule

El sistema MUST mantener una organización feature-first con Bandeja y Catálogo como límites de producto separados, y MUST limitar lo compartido al arranque, routing, shell, tokens y primitivas realmente transversales. Las responsabilidades de Catálogo, incluido su acceso mínimo a datos, MUST permanecer dentro de su feature mientras no exista un segundo consumidor real. La integración de Catálogo con Keyboard First MUST reutilizar el arbitraje, la elegibilidad, la navegación espacial y el ciclo de foco transversales definidos por la especificación canónica `keyboard-interaction` y por la sección 11 del brief, y MUST NOT copiar ni redefinir esos contratos mediante handlers, órdenes roving o atajos locales incompatibles. El sistema MUST NOT crear wrappers genéricos, adaptadores preventivos, facades ni abstracciones compartidas sin un segundo consumidor aprobado.

(Previously: Bandeja era el primer y único límite de producto contemplado, sin una feature de Catálogo ni acceso a datos autorizado.)

#### Scenario: Cada responsabilidad permanece en su feature

- GIVEN una responsabilidad usada únicamente por Bandeja o únicamente por Catálogo
- WHEN se inspecciona su pertenencia arquitectónica
- THEN permanece dentro del límite de su feature
- AND no existe un wrapper transversal creado para anticipar consumidores futuros
- AND sólo el shell, routing, tokens o primitivas con responsabilidad transversal demostrada permanecen compartidos

#### Scenario: Catálogo consume Keyboard First sin redefinirlo

- GIVEN que Catálogo incorpora controles, composites u overlays aprobados
- WHEN se inspecciona su integración de teclado y foco
- THEN reutiliza la precedencia, elegibilidad, geometría física y restauración de foco del contrato canónico
- AND cualquier estado activo o roving local permanece subordinado a ese contrato
- AND la feature no instala un orden de tabulación, una navegación por flechas, una trampa de foco ni un atajo alternativo que compita con Keyboard First

### Requirement: Ausencia de infraestructura y dominio especulativos

El sistema MUST NOT introducir backend propio, persistencia frontend, sincronización inventada, permisos inferidos, métricas, reglas de dominio no confirmadas, stores globales, repositorios, casos de uso, gateways, facades ni una capa de estado de consultas. Como única excepción de acceso backend en este cambio, la feature de Catálogo MAY integrar directamente las operaciones públicas verificadas de `catalogoAdmin/jerarquia` necesarias para navegación, lectura y creación de Clase, Familia y Tipo. El backend externo MUST conservar la autoridad sobre datos, relaciones, validación efectiva y persistencia.

(Previously: El frontend no podía introducir ningún cliente backend ni contrato de endpoint porque el primer slice carecía de una integración autorizada.)

#### Scenario: El frontend integra Catálogo sin asumir autoridad de datos

- GIVEN el grafo runtime con Bandeja y la feature de Catálogo
- WHEN se inspeccionan sus dependencias y efectos externos
- THEN el acceso backend de Catálogo se limita a la superficie pública verificada `catalogoAdmin/jerarquia`
- AND no existe lectura ni escritura de persistencia frontend de producto
- AND no existe una capa que simule autoridad, reglas o estado de dominio
- AND Bandeja no adquiere una integración backend por efecto de esta excepción
