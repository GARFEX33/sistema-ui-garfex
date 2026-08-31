/** Presentation-only evidence for the approved page04.png composition. */
export const operationsInboxFixtures = {
  presentationSentinel: '__GARFEX_PRESENTATION_FIXTURE_ONLY__',
  eyebrow: 'BANDEJA OPERATIVA',
  title: 'Pendientes de operación',
  indicators: [
    { label: 'Pendientes', value: '23' },
    { label: 'Alta prioridad', value: '08' },
    { label: 'En seguimiento', value: '11' },
  ],
  filters: ['Todos', 'Alta prioridad', 'Más antiguos'],
  actions: ['Seleccionar todo', 'Asignar', 'Más acciones'],
  rows: [
    {
      id: 'presentation-01',
      type: 'Solicitud',
      subject: 'Validar información operativa',
      origin: 'Operaciones',
      age: 'Hace 12 min',
    },
    {
      id: 'presentation-02',
      type: 'Revisión',
      subject: 'Confirmar datos pendientes',
      origin: 'Administración',
      age: 'Hace 34 min',
    },
    {
      id: 'presentation-03',
      type: 'Incidencia',
      subject: 'Revisar contexto de la solicitud',
      origin: 'Operaciones',
      age: 'Hace 1 h',
    },
  ],
  contextPanel: {
    heading: 'Contexto de la operación',
    detail: 'Selecciona un elemento para revisar su contexto.',
  },
  shortcuts: ['↑↓ Navegar', 'Enter Abrir', '⌘K Comandos'],
} as const
