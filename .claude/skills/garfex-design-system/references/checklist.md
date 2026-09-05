# Checklist obligatoria previa a cualquier implementación de UI

Responder cada ítem antes de escribir el primer componente/estilo nuevo. Si alguna respuesta es "no lo sé", investigar (leer `docs/design-system.md`, buscar en `src/shared/ui/` y en las features existentes) antes de continuar.

- [ ] ¿Existe ya este componente?
- [ ] ¿Existe un patrón de página equivalente?
- [ ] ¿Estoy duplicando componentes?
- [ ] ¿Estoy duplicando clases Tailwind?
- [ ] ¿Estoy creando CSS innecesario?
- [ ] ¿Estoy usando arbitrary values sin necesidad?
- [ ] ¿Estoy usando tokens semánticos?
- [ ] ¿Debe permanecer en la feature?
- [ ] ¿Debe promoverse a shared?
- [ ] ¿Funciona en Light?
- [ ] ¿Funciona en Dark?
- [ ] ¿Tiene hover?
- [ ] ¿Tiene active?
- [ ] ¿Tiene focus visible?
- [ ] ¿Tiene disabled?
- [ ] ¿Tiene loading si aplica?
- [ ] ¿Es responsive?
- [ ] ¿Mantiene consistencia con pantallas equivalentes?
- [ ] ¿Estoy introduciendo una variante visual nueva sin una razón UX real?

Para el estado actual (qué modos y tokens existen hoy) ver `docs/design-system.md` antes de responder los ítems de Light/Dark — nunca inventar una implementación Dark para pasar el checklist si la doc dice que todavía no existe.
