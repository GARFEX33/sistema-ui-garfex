#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(new URL('.', import.meta.url).pathname);
const target = '/workspace/recovery/openpencil-2026-08-30/reconstruction/full-replay.op';
const endpoint = process.env.OPENPENCIL_MCP_ENDPOINT || 'http://127.0.0.1:3100/mcp';
const execute = process.argv.includes('--execute');
const arg = (flag, fallback) => { const i=process.argv.indexOf(flag); return i < 0 ? fallback : Number(process.argv[i+1]); };
const from = arg('--from-seq', 1), to = arg('--to-seq', Number.MAX_SAFE_INTEGER);
const events = (await readFile(path.join(root, 'integrated-events.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)
  .filter(e => e.seq >= from && e.seq <= to);
let rpcId=1;
function forceFilePath(value) {
  if (Array.isArray(value)) return value.map(forceFilePath);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, k === 'filePath' ? target : forceFilePath(v)]));
}
async function rpc(method, params, notification=false) {
  const body={jsonrpc:'2.0', ...(notification?{}:{id:rpcId++}), method, ...(params?{params}:{})};
  const r=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream','mcp-session-id':'openpencil'},body:JSON.stringify(body)});
  const text=await r.text(); if(!r.ok) throw new Error(`MCP HTTP ${r.status}: ${text}`);
  if(notification||!text) return {};
  const j=JSON.parse(text); if(j.error) throw new Error(JSON.stringify(j.error)); return j.result;
}
async function call(name,args={}) {
  const raw=name.replace(/^openpencil_/,'');
  const result=await rpc('tools/call',{name:raw,arguments:forceFilePath(args)});
  if(result?.isError) { const error=new Error(JSON.stringify(result)); error.result=result; throw error; }
  return result;
}
function toolError(result) {
  const message = (result.content ?? []).map(block => block.text ?? '').join('\n') || 'tool returned isError';
  return { code:'tool_error', message };
}
async function scriptCall(name,args={}) {
  try {
    return {ok:true,data:await call(name,args)};
  } catch (error) {
    const result = error?.result;
    return result?.isError
      ? {ok:false,error:toolError(result),data:result}
      : {ok:false,error:{code:'rpc_error',message:String(error)}};
  }
}
async function describe({path:toolPath}) {
  const listed = await rpc('tools/list',{});
  const rawName = toolPath.replace(/^openpencil_/,'');
  const tool = (listed.tools ?? []).find(entry => entry.name === rawName);
  return tool ? {path:toolPath,...tool} : {path:toolPath,error:{code:'not_found',message:'Tool not found'}};
}
function tools() {
  const api = { call:scriptCall, describe };
  return new Proxy(api, {get(target,key,receiver) {
    if (key in target) return Reflect.get(target,key,receiver);
    if (typeof key !== 'string') return Reflect.get(target,key,receiver);
    return (args={}) => scriptCall(key,args);
  }});
}
const emitted = [];
function emit(value) {
  emitted.push(value);
  console.log(JSON.stringify(value));
}
function rewriteShell(command) {
  const low=command.toLowerCase();
  if(/\b(git|docker|podman|containerd)\b/.test(low) || /127\.0\.0\.1:\s*(?!3100\b)\d+/.test(low) || /(?:openpencil|mcp).*(?:--port|-p)\s*(?!3100\b)\d+/.test(low)) throw new Error('rejected dangerous shell command');
  // Replace both bare and absolute historical save targets, never the replay target.
  return command.replace(/(?:[A-Za-z0-9_./~-]+\/)?design\.op\b/g, target);
}
function runShell(command) {
  return new Promise(resolve => { const p=spawn('/bin/bash',['-lc',rewriteShell(command)],{stdio:['ignore','pipe','pipe']}); let stdout='',stderr=''; p.stdout.on('data',d=>stdout+=d); p.stderr.on('data',d=>stderr+=d); p.on('close',(code,signal)=>resolve({code,signal,stdout,stderr})); });
}
async function runEvent(e) {
  if(e.kind==='mcp') return {kind:e.kind,result:await call(e.tool,e.args)};
  if(e.kind==='script') {
    const t=tools();
    const code=e.code.replace(/tools\.openpencil_([A-Za-z_$][\w$]*)\s*\(/g, "tools.$1(");
    return {kind:e.kind,result:await (new Function('tools','emit',`return (async()=>{${code}\n})()`))(t,emit)};
  }
  if(e.kind==='file') {
    const p=e.path;
    if(e.operation==='write') await writeFile(p,e.content,'utf8');
    else { const old=await readFile(p,'utf8'); if(!old.includes(e.oldText)) throw new Error(`edit oldText not found: ${p}`); await writeFile(p,old.replace(e.oldText,e.newText),'utf8'); }
    return {kind:e.kind,path:p,operation:e.operation};
  }
  if(e.kind==='shell') return {kind:e.kind,result:await runShell(e.command)};
  throw new Error(`unknown event kind ${e.kind}`);
}
if(!execute) { console.log(JSON.stringify({dryRun:true,events:events.length,sourceRange:[from,to],target})); process.exit(0); }
await rpc('notifications/initialized',undefined,true).catch(()=>{});
await mkdir(path.join(root,'integrated','checkpoints'),{recursive:true});
const results=[];
for(const e of events) {
  let record={seq:e.seq,source_session:e.source_session,source_line:e.source_line,timestamp:e.timestamp,kind:e.kind};
  try { record.ok=true; record.observed=await runEvent(e); }
  catch(error) { record.ok=false; record.error=String(error); }
  results.push(record); console.log(JSON.stringify(record));
  await writeFile(path.join(root,'integrated','checkpoints',`seq-${e.seq}-${e.source_session}-${e.source_line}.json`),JSON.stringify(record,null,2)+'\n');
}
await writeFile(path.join(root,'integrated','run-results.jsonl'),results.map(JSON.stringify).join('\n')+'\n');
