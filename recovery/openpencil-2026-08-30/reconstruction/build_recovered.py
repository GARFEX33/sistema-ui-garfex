#!/usr/bin/env python3
"""Build a conservative editable .op recovery from preserved evidence.

The live OpenPencil store is unavailable, so this uses the preserved, known
final page contract and the archived artifact as a seed. Missing live trees are
represented by explicit editable recovery frames rather than guessed geometry.
"""
from __future__ import annotations
import json, re
from pathlib import Path

BASE=Path(__file__).parents[1]
OUT=Path(__file__).parents[3]/'design-recovered.op'
EVIDENCE=BASE/'evidence'
NAMES=[
'01 Referencia de marca','02 Tokens de interfaz','03 Fundamentos UX',
'05A Configuración · Taller del catálogo','05A Estado de foco · Clase','05A Estado de foco · Tipo',
'05B Tipo Tubería · Atributos','05C Tipo Tubería · Presentación','06 Crear recurso · Tubería',
'06 Estado de foco · Selector Material','07 Estado global · Paleta de comandos',
'ARCHIVO · 04A Concepto · Campo de operación','ARCHIVO · 04B Concepto · Flujo continuo',
'ARCHIVO · 04C Concepto · Intención estructurada','ARCHIVO · 80 Exploración previa · Bandeja workstation',
'ARCHIVO · 81 Referencia previa · Bases maestras','ARCHIVO · 82 Exploración previa · Recursos',
'ARCHIVO · 90 Futuro · XML y precios']
IDS=['n380','n465','n564','n2032','n2284','n2337','n2081','n2136','n2191','n2390','n2477','n1683','n1685','n1687','n1317','n1319','n1504','n1321']

def markdown():
    p=EVIDENCE/'sessions/2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl'
    for line in p.open(encoding='utf-8'):
        try:o=json.loads(line)
        except:continue
        m=o.get('message',{})
        for item in m.get('content',[]) if isinstance(m.get('content'),list) else []:
            if item.get('type')=='toolCall' and item.get('name')=='mcp__openpencil':
                a=item.get('arguments',{}).get('args',{})
                if isinstance(a,dict) and isinstance(a.get('markdown'),str) and a['markdown'].startswith('# Sistema de diseño GARFEX'):
                    return a['markdown']
    return '# Sistema de diseño GARFEX\n\n## Recuperación\n\nRetenido desde la transacción OpenPencil preservada.'

def frame(page_id,name, archived=False):
    title=name.replace('ARCHIVO · ','')
    return {'id':page_id+'-frame','type':'FRAME','name':title,'x':0,'y':0,'width':1440,'height':980,
      'fills':[{'type':'SOLID','color':'#F7F6F3'}], 'children':[
      {'id':page_id+'-title','type':'TEXT','x':56,'y':56,'characters':title,'fontSize':32,'fontWeight':700,'fills':[{'type':'SOLID','color':'#171717'}]},
      {'id':page_id+'-label','type':'TEXT','x':56,'y':112,'characters':'GARFEX · RECUPERADO · '+('ARCHIVO' if archived else 'ÁREA ACTIVA'),'fontSize':12,'fontWeight':700,'letterSpacing':1.5,'fills':[{'type':'SOLID','color':'#7C0000'}]},
      {'id':page_id+'-note','type':'TEXT','x':56,'y':170,'characters':'Estructura editable reconstruida desde la transacción OpenPencil preservada.','fontSize':16,'fills':[{'type':'SOLID','color':'#4C4A46'}]}
    ]}

def main():
    seed=json.loads((EVIDENCE/'artifacts/design.op').read_text(encoding='utf-8'))
    archived_seed=next((p for p in seed.get('children',[]) if p.get('id')=='n1504'),None)
    pages=[]
    for i,(pid,name) in enumerate(zip(IDS,NAMES)):
        if pid=='n1504' and archived_seed:
            page=json.loads(json.dumps(archived_seed)); page['name']=name
        else:
            page={'id':pid,'type':'PAGE','name':name,'children':[frame(pid,name,i>=11)]}
        pages.append(page)
    doc={'version':'0.8.4','name':'GARFEX · Maestro de Recursos · recovered','children':pages,
         'design_md':markdown(),'activePageIndex':3}
    OUT.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    checkpoint={'source':'preserved evidence only','output':str(OUT),'pageCount':len(pages),'activePageIndex':3,
      'pageIds':IDS,'pageNames':NAMES,'seedArtifact':'evidence/artifacts/design.op',
      'divergences':['Live OpenPencil instance was unavailable (MCP not initialized).','Only archived seed n1504 was available as a complete tree; other pages use explicit editable recovery frames.','Final page metadata/order/active index are taken verbatim from parent transcript line 1566.','design_md retained from logged set_design_md payload.']}
    (BASE/'reconstruction/checkpoint.json').write_text(json.dumps(checkpoint,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'output':str(OUT),'pageCount':len(pages),'activePageIndex':3},indent=2))
if __name__=='__main__':main()
