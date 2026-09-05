// Generated chronological OpenPencil replay; failures are recorded and replay continues.
const FILE_PATH = "/workspace/recovery/openpencil-2026-08-30/reconstruction/seed-replay.op";
const __calls=[];
let __sourceLabel='chunk';
function __preserve(value) { if (Array.isArray(value)) return value.map(__preserve); if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,__preserve(v)])); return value; }
async function __call(label, tool, args) { if (arguments.length===2) { args=tool; tool=label; } args=__preserve(args||{}); if (args && typeof args === 'object' && Object.prototype.hasOwnProperty.call(args,'filePath')) args.filePath=FILE_PATH; const effective=__sourceLabel+' '+label; const r=await tools.call(tool,args); __calls.push({label:effective,tool,ok:r.ok,error:r.ok?undefined:r.error}); emit({checkpoint:effective,ok:r.ok,error:r.ok?undefined:r.error}); return r; }
async function __describe(path) { return tools.describe({path}); }

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:916 seq 145
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:916 seq 145";
await __call("mutation", "openpencil_update_node", {"nodeId": "n1381", "data": {"content": "FLUJO PRINCIPAL · carriles conceptuales"}, "pageId": "n1321"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:923 seq 146
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:923 seq 146";
await __call("mutation", "openpencil_set_active_page", {"index": "3"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:967 seq 147
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:967 seq 147";
await __call("mutation", "openpencil_update_node", {"nodeId": "n1645", "data": {"content": "La unidad “m” no coincide con la regla de la familia.\nRevisá la equivalencia antes de publicar.", "fontSize": 13, "lineHeight": 1.35}, "pageId": "n1317"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1036 seq 152
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1036 seq 152";
await __call("mutation", "openpencil_set_active_page", {"index": "5"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1040 seq 154
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1040 seq 154";
await __call("mutation", "openpencil_replace_node", {"nodeId": "n1689", "kind": "frame", "name": "Intención estructurada · Dirección conceptual", "x": "0", "y": "0", "width": "1440", "height": "1100", "fill_hex": "#F7F6F3", "dropChildren": "true", "pageId": "n1687"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1046 seq 156
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1046 seq 156";
await (async()=>{
const out=[]; for (const [index,label] of [[3,'A'],[4,'B'],[5,'C']]) { await __call('openpencil_set_active_page', {index:String(index)}); const r=await __call('openpencil_batch_get', {depth:0}); out.push({label,nodes:r.nodes}); } emit(out);
})();

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1048 seq 157
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1048 seq 157";
await __call("mutation", "openpencil_set_active_page", {"index": "3"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1052 seq 159
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1052 seq 159";
await __call("mutation", "openpencil_set_active_page", {"index": "4"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1064 seq 161
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1064 seq 161";
await __call("mutation", "openpencil_set_active_page", {"index": "5"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1066 seq 162
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1066 seq 162";
await __call("mutation", "openpencil_replace_node", {"nodeId": "n1737", "kind": "frame", "name": "Intención estructurada · Dirección conceptual", "x": "0", "y": "0", "width": "1440", "height": "1100", "fill_hex": "#F7F6F3", "dropChildren": "true", "pageId": "n1687"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1072 seq 165
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1072 seq 165";
await __call("mutation", "openpencil_set_active_page", {"index": "5"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1106 seq 168
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1106 seq 168";
await __call("mutation", "openpencil_update_node", {"nodeId": "n1819", "y": "158", "pageId": "n1683"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1106 seq 169
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1106 seq 169";
await __call("mutation", "openpencil_update_node", {"nodeId": "n1856", "y": "1036", "pageId": "n1683"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1106 seq 170
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1106 seq 170";
await __call("mutation", "openpencil_update_node", {"nodeId": "n1927", "y": "1036", "pageId": "n1685"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1106 seq 171
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1106 seq 171";
await __call("mutation", "openpencil_update_node", {"nodeId": "n2002", "y": "1036", "pageId": "n1687"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1119 seq 175
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1119 seq 175";
await __call("mutation", "openpencil_set_active_page", {"index": "3"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1175 seq 176
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1175 seq 176";
await __call("mutation", "openpencil_update_node", {"nodeId": "n2117", "data": {"content": "1          Material                 Lista controlada         Sí                 Selector         PVC              Sí\n\n2          Tipo conduit          Lista controlada         Sí                 Selector         Pesado         Sí\n\n3          Diámetro              Lista controlada         Sí                 Selector         1 pulgada    Sí\n\n4          Cédula                  Lista controlada         No               Selector         40                No\n\n5          Longitud comercial      Número + unidad      No               Selector         3 m              No"}, "pageId": "n2081"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1175 seq 177
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1175 seq 177";
await __call("mutation", "openpencil_update_node", {"nodeId": "n2118", "data": {"content": "+ Agregar atributo"}, "pageId": "n2081"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1214 seq 182
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1214 seq 182";
await __call("mutation", "openpencil_set_active_page", {"index": "6"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1278 seq 183
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1278 seq 183";
await (async()=>{
const pages = ['n2265','n2330','n2400','n2472','n2577'];
for (const pageId of pages) {
  const r = await __call('openpencil_delete_page', {pageId});
  if (!r.ok) throw new Error(`No se pudo eliminar ${pageId}: ${r.error?.message}`);
}
const list = await __call('openpencil_list_pages', {});
emit(list.data);
})();

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1327 seq 185
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1327 seq 185";
await __call("mutation", "openpencil_set_active_page", {"index": "6"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1351 seq 186
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1351 seq 186";
await (async()=>{
const pages=await __call('openpencil_list_pages', {}); const parsed=JSON.parse(pages.data.content?.[0]?.text||'{}'); const idx=parsed.pages.findIndex(p=>p.id==='n1317'); const s=await __call('openpencil_set_active_page', {index:String(idx)}); if(!s.ok) throw new Error(s.error?.message); const g=await __call('openpencil_batch_get', {depth:0}); emit({idx,pages:parsed.pages,root:g.data});
})();

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1412 seq 189
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1412 seq 189";
await __call("mutation", "openpencil_set_design_md", {"markdown": "# Sistema de diseño GARFEX\n\n## Estado\n\nFundamentos de marca y experiencia para la primera etapa del ERP. No contiene pantallas finales.\n\n## Fuente de verdad\n\n- `01 Referencia de marca`: variantes, contraste, área libre y restricciones.\n- `02 Tokens de interfaz`: color, temas, tipografía, semántica y accesibilidad.\n- `03 Fundamentos UX`: teclado, densidad, tabla + panel, responsive y feedback.\n\n## Marca\n\n- Rojo canónico de interfaz: `#7C0000`.\n- Amarillo de acento: `#F2D031`.\n- Los SVG rojos positivos contienen `#8B0000`; conservarlos sin alteración hasta validación del responsable de marca.\n- Nexa para títulos; RNS Sanz para interfaz y texto; Monola Script solo en usos decorativos.\n- Fallback temporal: Inter/Arial cuando las fuentes corporativas no estén disponibles.\n- Preservar proporciones, contraste y área libre mínima de `1x`.\n- Prohibidos: sombras, resplandores, rotación, distorsión y recoloración arbitraria.\n\n## Experiencia\n\n- Interfaz empresarial keyboard-first, compatible con mouse y touch.\n- Bandeja operativa centrada en excepciones.\n- Tabla persistente con panel contextual en desktop.\n- Densidad compacta, cómoda y touch.\n- Paridad funcional con composiciones adaptadas en tablet y móvil.\n- Guardado híbrido y riesgo graduado.\n- Procesos largos en centro de actividad persistente.\n- Accesibilidad objetivo: WCAG 2.2 AA.\n\n## Gramática universal de foco\n\n- El foco representa la posición del usuario y siempre debe ser visible.\n- Convención visual: contorno amarillo GARFEX más indicador rojo; no reutilizarla para advertencias, selección, hover, activo o edición.\n- Transición de movimiento: 100 ms, directa, sin rebote, brillo ni efectos decorativos.\n- `↑ ↓`: mover dentro de la región actual.\n- `← →`: recorrer columnas, niveles o regiones espacialmente relacionadas.\n- `Enter`: abrir, entrar o aceptar.\n- `Esc`: cerrar o volver y restaurar exactamente el foco previo.\n- `Tab` y `Shift + Tab`: cambiar entre regiones principales; nunca recorrer cada fila, opción o atributo.\n- Escribir dentro de un selector filtra opciones controladas; nunca crea un valor libre.\n- `Ctrl/Cmd + K`: saltar a una sección, registro o acción distante.\n- `Ctrl/Cmd + Enter`: confirmar o guardar explícitamente.\n- Al cerrar una capa se conservan el elemento enfocado, el scroll, la selección y los filtros.\n- Mouse, touch y teclado ejecutan las mismas acciones; ninguna función esencial es exclusiva de un método de entrada.\n\n## Idioma\n\nTodo el contenido visible y la documentación UX/UI se redactan en español."});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1445 seq 193
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1445 seq 193";
await __call("mutation", "openpencil_set_active_page", {"index": "6"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1539 seq 197
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1539 seq 197";
await __call("mutation", "openpencil_set_active_page", {"index": "6"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1565 seq 198
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:1565 seq 198";
await (async()=>{
const rename = {
  n1683: 'ARCHIVO · 04A Concepto · Campo de operación',
  n1685: 'ARCHIVO · 04B Concepto · Flujo continuo',
  n1687: 'ARCHIVO · 04C Concepto · Intención estructurada',
  n1317: 'ARCHIVO · 80 Exploración previa · Bandeja workstation',
  n1319: 'ARCHIVO · 81 Referencia previa · Bases maestras',
  n1504: 'ARCHIVO · 82 Exploración previa · Recursos',
  n1321: 'ARCHIVO · 90 Futuro · XML y precios',
};
for (const [pageId, name] of Object.entries(rename)) {
  const r = await __call('openpencil_rename_page', { pageId, name });
  if (!r.ok) throw new Error(`No se pudo renombrar ${pageId}: ${r.error?.message}`);
}
const desired = [
  'n380','n465','n564',
  'n2032','n2284','n2337','n2081','n2136','n2191','n2390','n2477',
  'n1683','n1685','n1687','n1317','n1319','n1504','n1321'
];
for (let target = 0; target < desired.length; target++) {
  const r = await __call('openpencil_list_pages', {});
  if (!r.ok) throw new Error(r.error?.message);
  const state = JSON.parse(r.data.content?.[0]?.text || '{}');
  const current = state.pages.findIndex(page => page.id === desired[target]);
  if (current !== target) {
    const moved = await __call('openpencil_reorder_page', { pageId: desired[target], index: String(target) });
    if (!moved.ok) throw new Error(`No se pudo mover ${desired[target]}: ${moved.error?.message}`);
  }
}
const active = await __call('openpencil_set_active_page', { index: '3' });
if (!active.ok) throw new Error(active.error?.message);
const final = await __call('openpencil_list_pages', {});
emit(final.data);
})();

emit({checkpoint:'chunk-complete',calls:__calls.length});
