// Generated chronological OpenPencil replay; failures are recorded and replay continues.
const FILE_PATH = "/workspace/recovery/openpencil-2026-08-30/reconstruction/seed-replay.op";
const __calls=[];
let __sourceLabel='chunk';
function __preserve(value) { if (Array.isArray(value)) return value.map(__preserve); if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,__preserve(v)])); return value; }
async function __call(label, tool, args) { if (arguments.length===2) { args=tool; tool=label; } args=__preserve(args||{}); if (args && typeof args === 'object' && Object.prototype.hasOwnProperty.call(args,'filePath')) args.filePath=FILE_PATH; const effective=__sourceLabel+' '+label; const r=await tools.call(tool,args); __calls.push({label:effective,tool,ok:r.ok,error:r.ok?undefined:r.error}); emit({checkpoint:effective,ok:r.ok,error:r.ok?undefined:r.error}); return r; }
async function __describe(path) { return tools.describe({path}); }

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:209 seq 11
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:209 seq 11";
await (async()=>{
const results=[];
for (const [path,args] of [
  ['openpencil_delete_node',{filePath:'design.op',node_id:'n10'}],
  ['openpencil_rename_page',{filePath:'design.op',pageId:'0',name:'01 Brand Reference'}],
  ['openpencil_add_page',{filePath:'design.op',name:'02 UI Tokens'}],
  ['openpencil_add_page',{filePath:'design.op',name:'03 UX Foundation'}]
]) {
  const r=await __call(path,args); results.push({path,r}); if(!r.ok) break;
}
emit(results);
})();

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:211 seq 12
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:211 seq 12";
await __call("mutation", "openpencil_rename_page", {"filePath": "design.op", "index": "0", "name": "01 Brand Reference"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:213 seq 13
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:213 seq 13";
await __call("mutation", "openpencil_rename_page", {"index": "0", "name": "01 Brand Reference"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:215 seq 14
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:215 seq 14";
await __call("mutation", "openpencil_add_page", {"name": "02 UI Tokens"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:217 seq 15
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:217 seq 15";
await __call("mutation", "openpencil_add_page", {"name": "03 UX Foundation"});

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:221 seq 17
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:221 seq 17";
await (async()=>{
const ops=[['openpencil_delete_page',{index:'0'}],['openpencil_add_page',{name:'01 Brand Reference'}],['openpencil_reorder_page',{from:'2',to:'0'}]];const out=[];for(const [p,a] of ops){const r=await __call(p,a);out.push({p,r});if(!r.ok)break;}emit(out);
})();

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:225 seq 19
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:225 seq 19";
await (async()=>{
const vars=[
['brand.red','color','#7C0000'],['brand.red.hover','color','#680000'],['brand.red.active','color','#540000'],['brand.yellow','color','#F2D031'],['brand.gray','color','#D9D6D3'],['brand.black','color','#000000'],['brand.white','color','#FFFFFF'],
['light.background','color','#F7F6F3'],['light.surface','color','#FFFFFF'],['light.text','color','#1F1F1D'],['light.text.secondary','color','#5F5D58'],['light.border','color','#D9D6CF'],['light.focus','color','#8A6800'],
['dark.background','color','#161616'],['dark.surface','color','#1D1D1B'],['dark.text','color','#ECEAE5'],['dark.text.secondary','color','#C3C0B8'],['dark.border','color','#383733'],['dark.primary','color','#B33A3A'],['dark.focus','color','#E4B84A'],
['semantic.success.light','color','#2F6B4F'],['semantic.success.dark','color','#6FCF97'],['semantic.warning.light','color','#8A6800'],['semantic.warning.dark','color','#E4B84A'],['semantic.error.light','color','#B4232F'],['semantic.error.dark','color','#FF8A94'],['semantic.info.light','color','#356A8A'],['semantic.info.dark','color','#76B6D6'],
['type.heading','string','Nexa'],['type.body','string','RNS Sanz'],['type.decorative','string','Monola Script'],['radius.ui','number','8'],['space.base','number','8']
];
const out=[];
for(const [name,kind,default_value] of vars){const r=await __call('openpencil_create_variable',{name,kind,default_value});out.push({name,ok:r.ok,error:r.ok?undefined:r.error?.message});}
emit({created:out.filter(x=>x.ok).length,failed:out.filter(x=>!x.ok)});
})();

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:227 seq 20
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:227 seq 20";
await (async()=>{
const html=`<div style="width:1440px;min-height:980px;background:#F7F6F3;padding:56px;box-sizing:border-box;font-family:'RNS Sanz',Inter,Arial,sans-serif;color:#1F1F1D">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px">
    <div><div style="font-family:Nexa,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;color:#7C0000">GARFEX DESIGN SYSTEM</div><h1 style="font-family:Nexa,Arial,sans-serif;font-size:40px;line-height:1.1;margin:8px 0">Brand reference</h1><p style="font-size:16px;color:#5F5D58;margin:0">Approved identity assets and digital usage constraints</p></div>
    <div style="font-size:13px;color:#5F5D58">Foundation · v1</div>
  </div>
  <div style="display:flex;gap:24px;margin-bottom:24px">
    <div style="width:420px;height:190px;background:#FFFFFF;border:1px solid #D9D6CF;border-radius:12px;padding:20px;box-sizing:border-box"><b>Full logo · Color positive</b><div style="font-size:13px;color:#5F5D58;margin-top:4px">Use on light neutral surfaces</div></div>
    <div style="width:420px;height:190px;background:#7C0000;border:1px solid #680000;border-radius:12px;padding:20px;box-sizing:border-box;color:#FFFFFF"><b>Full logo · White negative</b><div style="font-size:13px;color:#ECEAE5;margin-top:4px">Use on dark or corporate-red surfaces</div></div>
    <div style="width:420px;height:190px;background:#FFFFFF;border:1px solid #D9D6CF;border-radius:12px;padding:20px;box-sizing:border-box"><b>Full logo · Black positive</b><div style="font-size:13px;color:#5F5D58;margin-top:4px">Use for restrained monochrome contexts</div></div>
  </div>
  <div style="display:flex;gap:24px;margin-bottom:24px">
    <div style="width:420px;height:190px;background:#FFFFFF;border:1px solid #D9D6CF;border-radius:12px;padding:20px;box-sizing:border-box"><b>Isotype · Color positive</b><div style="font-size:13px;color:#5F5D58;margin-top:4px">Compact product and navigation contexts</div></div>
    <div style="width:420px;height:190px;background:#161616;border:1px solid #383733;border-radius:12px;padding:20px;box-sizing:border-box;color:#FFFFFF"><b>Isotype · White negative</b><div style="font-size:13px;color:#C3C0B8;margin-top:4px">High-contrast dark contexts</div></div>
    <div style="width:420px;height:190px;background:#FFFFFF;border:1px solid #D9D6CF;border-radius:12px;padding:20px;box-sizing:border-box"><b>Isotype · Black positive</b><div style="font-size:13px;color:#5F5D58;margin-top:4px">Single-color applications</div></div>
  </div>
  <div style="display:flex;gap:24px">
    <div style="width:864px;background:#FFFFFF;border:1px solid #D9D6CF;border-radius:12px;padding:24px;box-sizing:border-box"><h2 style="font-family:Nexa,Arial,sans-serif;font-size:20px;margin:0 0 12px">Usage rules</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;font-size:14px"><div>✓ Preserve aspect ratio and internal proportions</div><div>✓ Keep at least 1x clear space</div><div>✓ Select positive/negative by contrast</div><div>✓ Full lockup for formal contexts</div><div>✕ No shadows, glow, rotation or distortion</div><div>✕ No arbitrary recoloring or low contrast</div></div></div>
    <div style="width:420px;background:#FFF8DB;border:1px solid #E4B84A;border-radius:12px;padding:24px;box-sizing:border-box"><h2 style="font-family:Nexa,Arial,sans-serif;font-size:20px;margin:0 0 8px;color:#2B2500">Brand validation pending</h2><p style="font-size:14px;line-height:1.5;margin:0;color:#2B2500">Positive red SVG artwork contains #8B0000. The canonical manual and UI token define #7C0000. Preserve supplied artwork until the brand owner confirms normalization.</p></div>
  </div>
</div>`;
const out=[];
out.push(await __call('openpencil_set_active_page',{index:'0'}));
out.push(await __call('openpencil_import_html',{html,x:'0',y:'0',pageId:'n6'}));
const logos=[
['docs/garfex-color-positivo.svg','105','205',280],['docs/garfex-blanco-negativo.svg','545','205',280],['docs/garfex-negro-positivo.svg','985','205',280],
['docs/garfex-g-color-positivo.svg','185','425',125],['docs/garfex-g-blanco-negativo.svg','625','425',125],['docs/garfex-g-negro-positivo.svg','1065','425',125]
];
for(const [svgPath,x,y,maxDim] of logos) out.push(await __call('openpencil_import_svg',{svgPath,x,y,maxDim,pageId:'n6'}));
emit(out.map((r,i)=>({i,ok:r.ok,error:r.ok?undefined:r.error?.message})));
})();

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:229 seq 21
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:229 seq 21";
await (async()=>{
const base='/home/garfex/PROGRAMACION/sistema-ui-garfex/docs/'; const logos=[['garfex-color-positivo.svg','105','205',280],['garfex-blanco-negativo.svg','545','205',280],['garfex-negro-positivo.svg','985','205',280],['garfex-g-color-positivo.svg','185','425',125],['garfex-g-blanco-negativo.svg','625','425',125],['garfex-g-negro-positivo.svg','1065','425',125]]; const out=[]; for(const [f,x,y,maxDim] of logos) out.push(await __call('openpencil_import_svg',{svgPath:base+f,x,y,maxDim,pageId:'n6'})); emit(out.map((r,i)=>({i,ok:r.ok,error:r.ok?undefined:r.error?.message})));
})();

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:235 seq 22
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:235 seq 22";
await (async()=>{
function iso(main){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="309.5 354.5 71.2 71.2"><path d="m 0,0 -9,-10.35 c -1.62,1.43 -3.87,2.57 -6.57,2.57 -1.27,0 -2.47,-0.18 -3.58,-0.54 l 4.57,13.19 0.22,0.64 C -8.82,5.28 -3.91,3.37 0,0" fill="${main}" transform="matrix(1.3333333,0,0,-1.3333333,367.0664,363.90173)"/><path d="m 0,0 -2.29,-13.03 c -3.86,4.41 -6.15,10.29 -6.15,16.91 0,6.21 1.97,11.69 5.39,15.94 L -6.88,2.46 -7.42,0.05 -4.94,0.03 Z" fill="${main}" transform="matrix(1.3333333,0,0,-1.3333333,322.8932,395.38147)"/><path d="m 0,0 -5.19,-14.99 c -3.24,-2.03 -5.27,-5.74 -5.27,-10.26 0,-2.99 0.89,-5.64 2.44,-7.67 l -7.39,-12.54 c -0.63,0.47 -1.24,0.98 -1.82,1.53 l 2.95,16.78 -7.31,0.05 4.55,20.62 C -12.67,-2.55 -6.78,-0.19 0,0" fill="${main}" transform="matrix(1.3333333,0,0,-1.3333333,345.1068,356.54173)"/><path d="m 0,0 v -2.5 c 0,-17.09 -9.61,-27.71 -25.07,-27.71 -5.18,0 -9.89,1.42 -13.81,3.91 l 0.08,0.14 7.09,12.02 c 1.96,-1.74 4.56,-2.75 7.5,-2.75 3.83,0 6.11,1.78 7.45,3.64 h -7.46 V 0 Z" fill="${main}" transform="matrix(1.3333333,0,0,-1.3333333,378.58653,383.62173)"/><path d="m 0,0 h 6.51 l -7.59,-12.88 -7.39,-12.54 -2.98,-5.06 1.16,6.59 2.95,16.78 -7.31,0.05 4.55,20.62 c 4.37,3.93 10.26,6.29 17.04,6.48 L 1.75,5.05 Z" fill="#F2D031" transform="matrix(1.3333333,0,0,-1.3333333,335.85347,383.26173)"/><path d="M 0,0 -4.125,-19 H 3.063 L -1,-39.313 5.127,-17.687 h -7.19 L 2.152,1.5 C 2.152,1.5 0.875,0.937 0,0" fill="#FFFFFF" transform="matrix(1.3333333,0,0,-1.3333333,323.87693,365.52147)"/></svg>`}
const specs=[[iso('#8B0000'),'185','425'],[iso('#FFFFFF'),'625','425'],[iso('#000000'),'1065','425']];const out=[];for(const [svg,x,y] of specs)out.push(await __call('openpencil_import_svg',{svg,x,y,pageId:'n6'}));emit(out.map(r=>({ok:r.ok,error:r.ok?undefined:r.error?.message})));
})();

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:242 seq 24
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:242 seq 24";
await (async()=>{
const html=`<div style="width:1440px;min-height:980px;background:#F7F6F3;padding:56px;box-sizing:border-box;font-family:'RNS Sanz',Inter,Arial,sans-serif;color:#1F1F1D">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px"><div><div style="font-family:Nexa,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:2px;color:#7C0000">SISTEMA DE DISEÑO GARFEX</div><h1 style="font-family:Nexa,Arial,sans-serif;font-size:40px;line-height:1.1;margin:8px 0">Referencia de marca</h1><p style="font-size:16px;color:#5F5D58;margin:0">Activos aprobados y reglas de aplicación digital</p></div><div style="font-size:13px;color:#5F5D58">Fundamentos · v1</div></div>
  <div style="display:flex;gap:24px;margin-bottom:24px"><div style="width:420px;height:190px;background:#FFFFFF;border:1px solid #D9D6CF;border-radius:12px;padding:20px;box-sizing:border-box"><b>Logotipo completo · Color positivo</b><div style="font-size:13px;color:#5F5D58;margin-top:4px">Usar sobre superficies claras y neutras</div></div><div style="width:420px;height:190px;background:#7C0000;border:1px solid #680000;border-radius:12px;padding:20px;box-sizing:border-box;color:#FFFFFF"><b>Logotipo completo · Blanco negativo</b><div style="font-size:13px;color:#ECEAE5;margin-top:4px">Usar sobre superficies oscuras o rojo corporativo</div></div><div style="width:420px;height:190px;background:#FFFFFF;border:1px solid #D9D6CF;border-radius:12px;padding:20px;box-sizing:border-box"><b>Logotipo completo · Negro positivo</b><div style="font-size:13px;color:#5F5D58;margin-top:4px">Usar en contextos monocromáticos controlados</div></div></div>
  <div style="display:flex;gap:24px;margin-bottom:24px"><div style="width:420px;height:190px;background:#FFFFFF;border:1px solid #D9D6CF;border-radius:12px;padding:20px;box-sizing:border-box"><b>Isotipo · Color positivo</b><div style="font-size:13px;color:#5F5D58;margin-top:4px">Navegación y contextos compactos del producto</div></div><div style="width:420px;height:190px;background:#161616;border:1px solid #383733;border-radius:12px;padding:20px;box-sizing:border-box;color:#FFFFFF"><b>Isotipo · Blanco negativo</b><div style="font-size:13px;color:#C3C0B8;margin-top:4px">Contextos oscuros de alto contraste</div></div><div style="width:420px;height:190px;background:#FFFFFF;border:1px solid #D9D6CF;border-radius:12px;padding:20px;box-sizing:border-box"><b>Isotipo · Negro positivo</b><div style="font-size:13px;color:#5F5D58;margin-top:4px">Aplicaciones de una tinta</div></div></div>
  <div style="display:flex;gap:24px"><div style="width:864px;background:#FFFFFF;border:1px solid #D9D6CF;border-radius:12px;padding:24px;box-sizing:border-box"><h2 style="font-family:Nexa,Arial,sans-serif;font-size:20px;margin:0 0 12px">Reglas de uso</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 24px;font-size:14px"><div>✓ Preservar proporciones y relación de aspecto</div><div>✓ Mantener un área libre mínima de 1x</div><div>✓ Elegir variante positiva o negativa por contraste</div><div>✓ Usar el logotipo completo en contextos formales</div><div>✕ Sin sombras, resplandores, rotación o distorsión</div><div>✕ Sin recoloración arbitraria ni bajo contraste</div></div></div><div style="width:420px;background:#FFF8DB;border:1px solid #E4B84A;border-radius:12px;padding:24px;box-sizing:border-box"><h2 style="font-family:Nexa,Arial,sans-serif;font-size:20px;margin:0 0 8px;color:#2B2500">Validación de marca pendiente</h2><p style="font-size:14px;line-height:1.5;margin:0;color:#2B2500">Los SVG rojos positivos contienen #8B0000. El manual canónico y el token de interfaz definen #7C0000. Se conservan los archivos suministrados hasta recibir confirmación del responsable de marca.</p></div></div>
</div>`;
const d=await __call('openpencil_delete_node',{node_id:'n8'});const i=await __call('openpencil_import_html',{html,x:'0',y:'0',pageId:'n6'});emit({deleted:d.ok,imported:i.ok,error:i.ok?undefined:i.error});
})();

// source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:248 seq 26
__sourceLabel="source 2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl:248 seq 26";
await __call("mutation", "openpencil_delete_node", {"nodeId": "n8", "pageId": "n6"});

emit({checkpoint:'chunk-complete',calls:__calls.length});
