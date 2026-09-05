#!/usr/bin/env python3
"""Extract the mutation history from every preserved session, in wall-clock order."""
from __future__ import annotations
import argparse, hashlib, json, re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

TARGET = "/workspace/recovery/openpencil-2026-08-30/reconstruction/full-replay.op"
MUTATION = re.compile(r"(?:create|add|insert|update|move|reorder|rename|delete|remove|set_|duplicate|import|write|apply|replace|batch_design|transaction|run)", re.I)
READ_ONLY = re.compile(r"(?:get_document_info|list_pages|read_nodes|get_node|get_node_children|batch_get|lint_document|layout_lint|get_screenshot|export(?:_|$)|save_document|open_document|status|search|describe|connect|ToolSearch|tool_search)$", re.I)
OPENPENCIL = re.compile(r"(?:openpencil|tools/call|batch_design|create_node|insert_node|update_node|delete_node|rename_page|set_active_page|set_design_md|replace_node|duplicate|move_node|remove_node|import_(?:html|svg)|save_document)", re.I)
SHELL_MUTATION = re.compile(r"(?:batch_design|create_node|add_node|insert_node|update_node|delete_node|add_page|create_page|delete_page|rename_page|reorder_page|set_active_page|set_design_md|replace_node|duplicate|move_node|remove_node|import_(?:html|svg)|save_document|\b(?:op|openpencil)\s+(?:insert|rename|set_active_page|update|delete|save))", re.I)


def stamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def tool_mutates(name: str) -> bool:
    short = name.rsplit("/", 1)[-1].removeprefix("openpencil_")
    return short in {"set_active_page", "set_selection_set", "set_design_md"} or (bool(MUTATION.search(short)) and not READ_ONLY.search(short))


def script_mutates(code: str) -> bool:
    return bool(OPENPENCIL.search(code) and re.search(r"(?:tools\.|tools/call|openpencil_|batch_design|create_node|insert_node|update_node|delete_node|rename_page|set_active_page|set_design_md|replace_node|duplicate|move_node|remove_node|import_)", code, re.I))


def relevant_shell(command: str) -> bool:
    low = command.lower()
    # Never replay repository, VCS, container, server lifecycle, or alternate-server commands.
    if re.search(r"\b(?:git|docker|podman|containerd)\b", low):
        return False
    if re.search(r"(?:127\.0\.0\.1|localhost)\s*:\s*(?!3100\b)\d+", low):
        return False
    # Direct local MCP/./op calls are mutation evidence, including commands which also inspect.
    if SHELL_MUTATION.search(low) and re.search(r"(?:127\.0\.0\.1:3100|localhost:3100|\./op\s|openpencil)", low):
        return True
    # Preserve scripts and assets that later OpenPencil calls consume, plus execution
    # of previously-written temporary scripts even when their filename lacks a tool name.
    if re.search(r"/tmp/", low) and re.search(r"(?:cat\s+>+|tee\s+|(?:node|python3?|bash|sh)\s+/tmp/|node\s+(?:-\s*)?<<|python.*<<|resvg|rsvg|convert|inkscape|base64|npm|package)", low):
        return True
    # Package setup is retained only when it is explicitly an asset/rasterization dependency.
    return bool(re.search(r"(?:npm|pnpm|yarn|bun)", low) and re.search(r"(?:/tmp|resvg|svg|raster|png)", low))


def text_result(msg: dict) -> dict:
    return {"isError": bool(msg.get("isError")), "stdout": "".join(x.get("text", "") for x in msg.get("content", []) if isinstance(x, dict) and x.get("type") == "text")}


def main() -> None:
    ap = argparse.ArgumentParser()
    base = Path(__file__).parent
    evidence = base.parent / "evidence" / "sessions"
    ap.add_argument("--sessions", type=Path, default=evidence)
    ap.add_argument("--parent-source", type=Path, default=evidence / "2026-08-30T03-38-19-877Z_01a050bf-2765-74cd-9434-ffb0fa22a54b.jsonl")
    ap.add_argument("--parent-line", type=int, default=1565)
    ap.add_argument("--output", type=Path, default=base / "integrated-events.jsonl")
    ap.add_argument("--manifest", type=Path, default=base / "integrated-manifest.json")
    args = ap.parse_args()

    parent_rows = args.parent_source.read_text(encoding="utf8").splitlines()
    cutoff = stamp(json.loads(parent_rows[args.parent_line - 1])["timestamp"])
    session_files = sorted(p for p in args.sessions.glob("*.jsonl") if not p.name.endswith(".snapshot"))
    events: list[dict] = []
    for source in session_files:
        rows = source.read_text(encoding="utf8").splitlines()
        session_id = source.stem
        calls: dict[str, tuple[int, dict, str]] = {}
        results: dict[str, dict] = {}
        for line_no, raw in enumerate(rows, 1):
            root = json.loads(raw)
            ts = stamp(root["timestamp"])
            if ts > cutoff or (source.resolve() == args.parent_source.resolve() and line_no > args.parent_line):
                continue
            msg = root.get("message", {})
            for item in msg.get("content", []) if isinstance(msg, dict) else []:
                if isinstance(item, dict) and item.get("type") == "toolCall":
                    calls[item.get("id", f"{line_no}:call")]=(line_no, item, root["timestamp"])
                elif isinstance(item, dict) and item.get("type") == "toolResult":
                    results[item.get("toolCallId")] = text_result(item)
        for call_id, (line_no, item, timestamp) in calls.items():
            name = item.get("name", "")
            a = item.get("arguments") or {}
            event = None
            if name in ("mcp__openpencil", "mcp__openpencil_") or name.startswith("mcp__openpencil"):
                tool = a.get("tool", name)
                if tool_mutates(tool):
                    event = {"kind":"mcp", "tool":tool.removeprefix("openpencil_"), "args":a.get("args", {}), "historical":results.get(call_id, {}), "call_id":call_id}
            elif name == "mcpScript" and script_mutates(a.get("code", "")):
                event = {"kind":"script", "code":a.get("code", ""), "historical":results.get(call_id, {}), "call_id":call_id}
            elif name in ("write", "edit") and isinstance(a.get("path"), str) and a["path"].startswith("/tmp/"):
                event = {"kind":"file", "operation":name, "path":a["path"], "historical":results.get(call_id, {}), "call_id":call_id}
                if name == "write": event["content"] = a.get("content", "")
                else: event.update(oldText=a.get("oldText", ""), newText=a.get("newText", ""))
            elif name == "bash" and relevant_shell(a.get("command", "")):
                event = {"kind":"shell", "command":a.get("command", ""), "historical":results.get(call_id, {}), "call_id":call_id}
            if event:
                event.update(source_session=session_id, source_line=line_no, timestamp=timestamp, source_name=name)
                events.append(event)

    events.sort(key=lambda e: (stamp(e["timestamp"]), e["source_session"], e["source_line"], e["source_name"]))
    for seq, event in enumerate(events, 1):
        event["seq"] = seq
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(json.dumps(e, ensure_ascii=False, separators=(",", ":")) for e in events) + "\n", encoding="utf8")
    digest = hashlib.sha256(args.output.read_bytes()).hexdigest()
    counts = Counter(e["kind"] for e in events)
    by_source = defaultdict(Counter)
    for e in events: by_source[e["source_session"]][e["kind"]] += 1
    contributors = sorted(s for s, kinds in by_source.items() if any(k in kinds for k in ("mcp", "script", "shell")))
    counts_by_session = {p.stem: dict(by_source.get(p.stem, Counter())) for p in session_files}
    subagents = [s for s in contributors if s != args.parent_source.stem]
    def session_text(session: str) -> str:
        return "\n".join(json.dumps(e, ensure_ascii=False) for e in events if e["source_session"] == session)
    foundation = [s for s in contributors if all(marker in session_text(s) for marker in ("n1317", "n1319", "n1321"))]
    concept = [s for s in contributors if re.search(r"n1683|n1685|n1687|04A|04B|04C", session_text(s), re.I)]
    later = [s for s in contributors if re.search(r"n2033|n2082|n2137|n2192|config|focus", session_text(s), re.I)]
    validation = {"parent_subagent_run_line": 792, "foundation_worker_sessions": foundation, "concept_worker_sessions": concept, "later_config_focus_worker_sessions": later,
                  "foundation_worker_present": bool(foundation), "concept_worker_present": bool(concept), "later_config_focus_worker_present": bool(later)}
    if not foundation or not concept or not later:
        raise SystemExit("validation failed: required worker mutation evidence is missing: " + json.dumps(validation))
    manifest = {"source":"all preserved session JSONLs", "parent_source":args.parent_source.name, "parent_cutoff":{"line":args.parent_line,"timestamp":parent_rows[args.parent_line-1] and json.loads(parent_rows[args.parent_line-1])["timestamp"]}, "session_count":len(session_files), "event_count":len(events), "counts":dict(counts), "counts_by_source_session":counts_by_session, "events_sha256":digest, "target":TARGET, "subagent_sessions_contributing_mutations":subagents, "validation":validation, "safety":{"default":"dry-run","execute_flag":"--execute","mcp_filePath_forced":True,"shell_design_op_policy":"rewrite direct design.op save targets only","excluded":["repository application changes","repository design.op overwrite/copy","git","docker/container/server lifecycle","unrelated diagnostics/exports"]}}
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(json.dumps({"events":len(events),"counts":dict(counts),"sessions":len(session_files),"sha256":digest,"validation":validation}))

if __name__ == "__main__": main()
