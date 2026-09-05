#!/usr/bin/env python3
"""Extract historical OpenPencil mutations and build non-destructive MCP replay chunks."""
from __future__ import annotations
import argparse, hashlib, json, re
from pathlib import Path

TARGET = "/workspace/recovery/openpencil-2026-08-30/reconstruction/seed-replay.op"
SOURCE_LIMIT = 1565
MUTATING = re.compile(r"(?:create|add|insert|update|move|reorder|rename|delete|remove|set_|duplicate|import|write|apply|replace|batch_design|transaction|run)", re.I)
CALL = re.compile(r"(?:tools\.call\s*\(\s*['\"]([^'\"]+)['\"]|tools\.([A-Za-z_$][\w$]*))\s*\(")
EXCLUDED = re.compile(r"(?:^|_)(?:get_document_info|list_pages|read_nodes|get_node|batch_get|lint_document|layout_lint|get_screenshot|export(?:_|$)|save_document|open_document|ToolSearch|tool_search)$", re.I)


def walk(obj):
    if isinstance(obj, dict):
        yield obj
        for v in obj.values(): yield from walk(v)
    elif isinstance(obj, list):
        for v in obj: yield from walk(v)


def is_mutation_tool(name: str) -> bool:
    short = name.rsplit("/", 1)[-1]
    if EXCLUDED.search(short): return False
    return bool(MUTATING.search(short) or short in {"openpencil_set_active_page", "set_active_page", "openpencil_set_selection_set", "set_design_md", "openpencil_set_design_md"})


def script_tools(code: str) -> list[str]:
    found = []
    for m in CALL.finditer(code):
        name = m.group(1) or m.group(2)
        if name in {"call", "describe", "search"}: continue
        if is_mutation_tool(name): found.append(name)
    # Dynamic tools.call paths are retained only when the script visibly calls a mutator.
    if "tools.call" in code and re.search(r"openpencil_(?:create|add|insert|update|move|reorder|rename|delete|remove|set_|duplicate|import|write|apply|replace|batch_design)", code, re.I):
        found.append("dynamic tools.call")
    return list(dict.fromkeys(found))


def preserve(value):
    if isinstance(value, dict): return {k: preserve(v) for k, v in value.items()}
    if isinstance(value, list): return [preserve(v) for v in value]
    return value




def ids_for(record) -> list[str]:
    raw = json.dumps(record.get("arguments", {}), ensure_ascii=False)
    return sorted(set(re.findall(r"\bn\d+\b", raw)))


def call_wrapper(label: str, tool: str, args) -> str:
    tool = {"set_active_page":"openpencil_set_active_page", "set_design_md":"openpencil_set_design_md"}.get(tool, tool)
    return f"await __call({json.dumps(label)}, {json.dumps(tool)}, {json.dumps(preserve(args), ensure_ascii=False)});"


def script_wrapper(record) -> str:
    code = record["arguments"].get("code", "")
    # Route every tool invocation through a fail-fast tracer while retaining loops, branches,
    # ordering, and all read calls in a mutation-bearing historical script.
    code = re.sub(r"tools\.openpencil_([A-Za-z_$][\w$]*)\s*\(", lambda m: "__call('openpencil_" + m.group(1) + "', ", code)
    code = code.replace("tools.call(", "__call(")
    code = code.replace("tools.describe(", "__describe(")
    return code


def source_label(record):
    return f"source {record['session']}:{record['line']} seq {record['seq']}"


def load_records(evidence: Path):
    records = []; malformed = []
    for fp in sorted(evidence.glob("*.jsonl")):
        with fp.open(encoding="utf-8") as f:
            for line_no, line in enumerate(f, 1):
                try: root = json.loads(line)
                except json.JSONDecodeError: malformed.append({"file": fp.name, "line": line_no}); continue
                msg = root.get("message", {}) if isinstance(root, dict) else {}
                for item in msg.get("content", []) if isinstance(msg, dict) else []:
                    if not isinstance(item, dict) or item.get("type") != "toolCall": continue
                    name, args = str(item.get("name", "")), item.get("arguments", {})
                    raw = json.dumps(args, ensure_ascii=False)
                    if not ("openpencil" in name.lower() or (name == "mcpScript" and "openpencil" in raw.lower())): continue
                    if line_no > SOURCE_LIMIT: continue
                    tool = args.get("tool", name) if isinstance(args, dict) else name
                    script = args.get("code", "") if name == "mcpScript" and isinstance(args, dict) else ""
                    tools = script_tools(script) if script else ([tool] if is_mutation_tool(tool) else [])
                    records.append({"timestamp": msg.get("timestamp", root.get("timestamp")), "session": fp.name, "line": line_no, "name": name, "arguments": args, "mutation_tools": tools, "mutation": bool(tools)})
    records.sort(key=lambda r: (r.get("timestamp") or 0, r["session"], r["line"]))
    for i, r in enumerate(records, 1): r["seq"] = i
    return records, malformed


def build_chunks(records, outdir: Path):
    outdir.mkdir(parents=True, exist_ok=True)
    chunks=[]; current=[]; size=0; chunk_no=0
    def flush():
        nonlocal current, size, chunk_no
        if not current: return
        chunk_no += 1
        body = ["// Generated chronological OpenPencil replay; failures are recorded and replay continues.", f"const FILE_PATH = {json.dumps(TARGET)};", "const __calls=[];", "let __sourceLabel='chunk';", "function __preserve(value) { if (Array.isArray(value)) return value.map(__preserve); if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,__preserve(v)])); return value; }", "async function __call(label, tool, args) { if (arguments.length===2) { args=tool; tool=label; } args=__preserve(args||{}); if (args && typeof args === 'object' && Object.prototype.hasOwnProperty.call(args,'filePath')) args.filePath=FILE_PATH; const effective=__sourceLabel+' '+label; const r=await tools.call(tool,args); __calls.push({label:effective,tool,ok:r.ok,error:r.ok?undefined:r.error}); emit({checkpoint:effective,ok:r.ok,error:r.ok?undefined:r.error}); return r; }", "async function __describe(path) { return tools.describe({path}); }", ""]
        for r in current:
            label=source_label(r)
            if r["name"] == "mcpScript": body += [f"// {label}", f"__sourceLabel={json.dumps(label)};", "await (async()=>{", script_wrapper(r), "})();", ""]
            else:
                tool=r["arguments"].get("tool", r["name"]); args=r["arguments"].get("args", {})
                body += [f"// {label}", f"__sourceLabel={json.dumps(label)};", call_wrapper("mutation", tool, args), ""]
        body += ["emit({checkpoint:'chunk-complete',calls:__calls.length});"]
        text="\n".join(body)+"\n"
        path=outdir/f"chunk-{chunk_no:03d}.js"; path.write_text(text,encoding="utf-8")
        digest=hashlib.sha256(text.encode()).hexdigest()
        chunks.append({"file":path.name,"source_ranges":[{"session":r["session"],"line":r["line"],"seq":r["seq"]} for r in current],"mutation_tools":sorted(set(t for r in current for t in r["mutation_tools"])),"expected_ids":sorted(set(i for r in current for i in ids_for(r))),"sha256":digest,"bytes":len(text.encode())})
        current=[]; size=0
    for r in records:
        if not r["mutation"]: continue
        probe=json.dumps(r,ensure_ascii=False)
        # Keep one very large import/script isolated; ordinary chunks stay below 20 KiB.
        if current and size+len(probe)>18000: flush()
        current.append(r); size += len(probe)
        if len(probe)>18000: flush()
    flush(); return chunks


def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--evidence',type=Path,default=Path(__file__).parents[1]/'evidence'/'sessions'); ap.add_argument('--output',type=Path,default=Path(__file__).with_name('mutation-stream.jsonl')); ap.add_argument('--summary',type=Path,default=Path(__file__).with_name('parse-summary.json')); ap.add_argument('--chunks',type=Path,default=Path(__file__).with_name('chunks')); ap.add_argument('--manifest',type=Path,default=Path(__file__).with_name('chunk-manifest.json')); args=ap.parse_args()
    records, malformed=load_records(args.evidence)
    args.output.write_text("\n".join(json.dumps(r,ensure_ascii=False,sort_keys=True) for r in records)+"\n",encoding="utf-8")
    mutations=[r for r in records if r["mutation"]]
    manifest_chunks=build_chunks(records,args.chunks)
    args.manifest.write_text(json.dumps({"target":TARGET,"source_line_limit":SOURCE_LIMIT,"records":len(records),"mutations":len(mutations),"chunks":manifest_chunks},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    args.summary.write_text(json.dumps({"files":len(list(args.evidence.glob('*.jsonl'))),"records":len(records),"mutations":len(mutations),"malformed_lines":malformed,"chunks":len(manifest_chunks),"source_line_limit":SOURCE_LIMIT},indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"records":len(records),"mutations":len(mutations),"chunks":len(manifest_chunks),"malformed":len(malformed)}))

if __name__ == '__main__': main()
