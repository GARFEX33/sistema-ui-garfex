# Delta para Fundamentos Frontend

## ADDED Requirements

### Requirement: React Query limitado a estado remoto autorizado

El sistema MUST permitir React Query únicamente para estado remoto/de servidor en pilotos aprobados y feature-locales. Su cache MUST ser efímera, en memoria de la sesión y sin autoridad sobre datos, permisos, validación efectiva ni persistencia. El sistema MUST NOT usar React Query para borradores, formularios, overlays, selección, foco, teclado, ruta o estado URL, ni ampliar esta autorización a Catálogo, jerarquía de Recursos, autenticación, usuarios o mutaciones no aprobadas.

#### Scenario: Un piloto usa únicamente datos remotos autorizados

- GIVEN un piloto feature-local aprobado para una lectura remota
- WHEN se inspecciona el estado que administra React Query
- THEN sólo contiene la lectura remota autorizada y sus estados asíncronos
- AND los datos continúan bajo la autoridad del backend externo
- AND el estado local, URL y teclado conservan sus propietarios existentes

### Requirement: Límite del provider de consultas

El sistema MUST montar un único `QueryClientProvider` transversal mediante `AppProviders`, con un `QueryClient` estable durante cada montaje del provider. El provider MUST conservar la composición existente de Router y MUST NOT importar Convex, APIs de dominio ni features. El sistema MUST NOT crear un singleton de módulo, devtools, persistencia, broadcast, soporte offline, SSR, hydration, integración Router-query ni defaults globales de retry o refetch.

#### Scenario: La infraestructura transversal permanece mínima

- GIVEN el árbol runtime de la aplicación
- WHEN se monta `AppProviders`
- THEN los consumidores autorizados reciben un cliente de consultas estable durante ese montaje
- AND Router continúa disponible en su composición existente
- AND el provider no introduce acceso al backend ni una política global de consultas

## MODIFIED Requirements

### Requirement: Ausencia de infraestructura y dominio especulativos

El sistema MUST NOT introducir backend propio, API propia, persistencia, sincronización, permisos, métricas, reglas de dominio, stores globales, repositorios, casos de uso, gateways, facades ni abstracciones compartidas sin consumidores reales. Catálogo MAY conservar su acceso feature-local ya aprobado a la superficie pública verificada `catalogoAdmin/jerarquia`, sin transferir al frontend autoridad de datos. El sistema MAY usar React Query exclusivamente como cache feature-local de estado remoto/de servidor en pilotos aprobados, bajo el provider mínimo autorizado, sin convertir la cache en autoridad de dominio. Esta excepción MUST NOT autorizar Zustand, Redux, context global de datos de dominio, persistencia de cache, clientes Convex transversales, wrappers Query genéricos ni uso de Query fuera de los pilotos aprobados. El backend externo MUST conservar la autoridad de datos, permisos, validación efectiva y persistencia.

(Previously: La restricción prohibía de forma absoluta toda capa de estado de consultas junto con la infraestructura y dominio especulativos.)

#### Scenario: La excepción Query no se convierte en infraestructura global

- GIVEN un runtime que contiene un piloto Query aprobado
- WHEN se inspeccionan sus dependencias, cache y límites de estado
- THEN no existe backend o API propios, persistencia frontend de producto ni store global
- AND Catálogo conserva sólo su acceso feature-local ya aprobado y no obtiene una excepción Query
- AND no existe un cliente Convex transversal, wrapper Query compartido, repositorio, gateway ni facade
- AND React Query no administra reglas de dominio, datos autoritativos ni estado local de interfaz
