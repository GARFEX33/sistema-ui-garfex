/** Presentation-only evidence for the approved page04.png composition. */
export const operationsInboxFixtures = {
  presentationSentinel: '__GARFEX_PRESENTATION_FIXTURE_ONLY__',
  eyebrow: 'BANDEJA OPERATIVA',
  title: '¿Qué trabajo necesitás resolver ahora?',
  view: 'Vista: Mis pendientes',
  pendingCount: '23',
  listHeading: 'TRABAJO PENDIENTE · 23',
  // prettier-ignore
  indicators: [{ label: '18 sin clasificar', value: '' }, { label: '7 atributos faltantes', value: '' }, { label: '4 unidades incompatibles', value: '' }, { label: '6 duplicados candidatos', value: '' }],
  filters: ['⌕ Buscar /', 'Estado ▼', 'Tipo ▼', 'Prioridad ▼', 'Responsable ▼'],
  // prettier-ignore
  actions: ['5 seleccionados', 'Clasificar', 'Asignar', 'Marcar revisado', 'Más…'],
  // prettier-ignore
  rows: [['Recurso', 'Cable THW-LS 2.5 mm²', 'Unidad incompatible', 'Importación', '12 min'], ['Recurso', 'Perfil galvanizado 40x40', 'Sin clasificar', 'Carga manual', '18 min'], ['Atributo', 'Tornillo M8 x 40', '7 atributos faltantes', 'Catálogo', '24 min'], ['Unidad', 'Placa OSB 18 mm', 'Unidad incompatible', 'Importación', '31 min'], ['Duplicado', 'Codo PVC 90° Ø110', 'Duplicado candidato', 'Proveedor', '42 min'], ['Catálogo', 'Familia Conductores', 'Regla pendiente', 'Administración', '1 h'], ['Permiso', 'Rol Compras · Laura', 'Revisión requerida', 'Actividad', '2 h'], ['Recurso', 'Arena fina lavada', 'Sin clasificar', 'Carga manual', '3 h']].map(([type, subject, status, origin, age]) => ({ id: subject, type, subject, status, origin, age })),
  contextPanel: {
    heading: 'Cable THW-LS 2.5 mm²',
    // prettier-ignore
    details: ['Unidad incompatible', 'Qué requiere atención', 'La unidad “m” no coincide con la regla de la familia. Revisá la equivalencia antes de publicar.', 'Clasificación', 'Conductores / Cables', 'Unidad actual', 'm', 'Origen', 'Importación · ERP legado', 'Sugerencia', 'metro lineal (ml)', 'Aplicar sugerencia', 'Comparar candidatos', 'Ver actividad y auditoría →', 'Última modificación: Laura · hace 12 min', 'Regla CAT-004 · revisión pendiente'],
  },
  // prettier-ignore
  shortcuts: ['↑ ↓ navegar', 'Espacio seleccionar', 'Enter abrir', '/ buscar', 'Ctrl/Cmd+K comandos', '? atajos'],
} as const
