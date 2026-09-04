# Recovery replay record

- Evidence input: `../evidence/sessions/*.jsonl` (19 preserved JSONL files).
- Parse command: `python3 recover.py`.
- Result: 199 OpenPencil calls/scripts, 0 malformed JSONL lines, globally sorted by recorded timestamp.
- Replay target: parent transcript event line 1566 (`pageCount: 18`, `activePageIndex: 3`, exact IDs/names/order).
- Live replay: blocked on 2026-08-30. The OpenPencil MCP proxy returned `MCP not initialized` for status, connect, and tool search. No current OpenPencil state was opened or changed; no mutation or save was attempted. Attempt record: `attempts/live-replay-2026-08-30.json`.
- Placeholder safety: the pre-existing root artifact was preserved at `attempts/placeholder.op`; `design-recovered.op` was not replaced.
- Reconstruction command: `python3 build_recovered.py`.
- Output: repository-root `design-recovered.op`.

## Divergences

The preserved final page list and design markdown are exact, but complete live node trees were not preserved for all pages. The reconstruction therefore retains the complete preserved `n1504` seed tree and creates explicit editable recovery frames for the other pages. This avoids inventing unlogged geometry and keeps the document structurally editable. The divergence is recorded in `checkpoint.json`.
