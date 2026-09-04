#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const endpoint = 'http://127.0.0.1:3100/mcp';
const sessionId = 'openpencil';
const root = path.resolve('recovery/openpencil-2026-08-30/reconstruction');
const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? start);
let requestId = 1000;

async function rpc(method, params, notification = false) {
  const body = { jsonrpc: '2.0', ...(notification ? {} : { id: requestId++ }), method, ...(params ? { params } : {}) };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'mcp-session-id': sessionId,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`MCP HTTP ${response.status}: ${text}`);
  if (notification || !text) return {};
  const envelope = JSON.parse(text);
  if (envelope.error) throw new Error(`MCP RPC ${method}: ${JSON.stringify(envelope.error)}`);
  return envelope.result;
}

const tools = {
  async call(name, args = {}) {
    try {
      const rawName = name.replace(/^openpencil_/, '');
      const result = await rpc('tools/call', { name: rawName, arguments: args });
      if (result?.isError) {
        const message = (result.content ?? []).map((block) => block.text ?? '').join('\n') || 'tool returned isError';
        return { ok: false, error: { code: 'tool_error', message }, data: result };
      }
      return { ok: true, data: result };
    } catch (error) {
      return { ok: false, error: { code: 'rpc_error', message: String(error) } };
    }
  },
  async describe({ path: toolPath }) {
    const listed = await rpc('tools/list', {});
    const rawName = toolPath.replace(/^openpencil_/, '');
    const tool = (listed.tools ?? []).find((entry) => entry.name === rawName);
    return tool ? { path: toolPath, ...tool } : { path: toolPath, error: { code: 'not_found', message: 'Tool not found' } };
  },
};

const events = [];
function emit(value) {
  events.push(value);
  const compact = JSON.stringify(value);
  console.log(compact.length > 1200 ? `${compact.slice(0, 1200)}…` : compact);
}

await rpc('notifications/initialized', undefined, true).catch(() => {});
for (let index = start; index <= end; index += 1) {
  const file = path.join(root, 'chunks', `chunk-${String(index).padStart(3, '0')}.js`);
  const code = await readFile(file, 'utf8');
  console.log(`=== ${path.basename(file)} ===`);
  const execute = new Function('tools', 'emit', `return (async () => {\n${code}\n})();`);
  await execute(tools, emit);
  const pages = await tools.call('openpencil_list_pages', {});
  const info = await tools.call('openpencil_get_document_info', {});
  const checkpoint = { chunk: index, pages, info, eventCount: events.length };
  await writeFile(path.join(root, 'attempts', `chunk-${String(index).padStart(3, '0')}-checkpoint.json`), `${JSON.stringify(checkpoint, null, 2)}\n`);
  console.log(JSON.stringify({ chunk: index, pagesOk: pages.ok, infoOk: info.ok }));
}
