# OpenPencil recovery fidelity

## Final artifact

- Official recovered file: `design-recovered.op`
- Pages: 18
- Active page index: 3
- SHA-256: `4f53c09ddff2cee9ff23297164e08ef79391a6701b3940c1900cc157f7eeee8f`
- Structural verification: passed
- Pixel-level verification: not performed
- Original `design.op`: preserved byte-for-byte (`520c74c91a335a8d8d8a0953c1293c9ce47ce903f20a60b8130a3dc834a99a44`)

## Recovery method

The document was reconstructed from the preserved Pi/OpenPencil session JSONLs, temporary builder scripts recorded in those sessions, the preserved `n1504` tree, and the final authoritative page metadata at parent transcript line 1566. Historical page names, order, active index, design guidance, and meaningful editable content were restored. OpenPencil generated new IDs for 15 pages, so semantic structure is authoritative while historical node identity is not.

## Page-by-page fidelity

| # | Historical ID | Recovered ID | Page | Live nodes | Fidelity |
|---:|---|---|---|---:|---|
| 0 | `n380` | `n380` | 01 Referencia de marca | 288 | Historical replay; meaningful imported brand board and assets. |
| 1 | `n465` | `n465` | 02 Tokens de interfaz | 208 | Historical replay; meaningful token boards. |
| 2 | `n564` | `n564` | 03 Fundamentos UX | 126 | Historical replay; meaningful UX foundation board. |
| 3 | `n2032` | `n1509` | 05A Configuración · Taller del catálogo | 52 | Rebuilt from the recorded approved builder; 1440×980. |
| 4 | `n2284` | `n1761` | 05A Estado de foco · Clase | 52 | Semantically duplicated from 05A and rebuilt from the recorded focus builder; 1440×980. |
| 5 | `n2337` | `n1814` | 05A Estado de foco · Tipo | 52 | Semantically duplicated from 05A and rebuilt from the recorded focus builder; 1440×980. |
| 6 | `n2081` | `n1558` | 05B Tipo Tubería · Atributos | 59 | Rebuilt from the recorded approved builder; 1440×980. |
| 7 | `n2136` | `n1613` | 05C Tipo Tubería · Presentación | 59 | Rebuilt from the recorded approved builder; 1440×980. |
| 8 | `n2191` | `n1668` | 06 Crear recurso · Tubería | 78 | Rebuilt from the recorded approved builder; 1440×980. |
| 9 | `n2390` | `n1867` | 06 Estado de foco · Selector Material | 86 | Semantically duplicated from 06 and rebuilt from the recorded selector builder; 1440×980. |
| 10 | `n2477` | `n1954` | 07 Estado global · Paleta de comandos | 68 | Semantically duplicated from 05A and rebuilt from the recorded palette builder; 1440×980. |
| 11 | `n1683` | `n1433` | ARCHIVO · 04A Concepto · Campo de operación | 73 | Full recorded concept board restored; 72 direct design children. |
| 12 | `n1685` | `n1435` | ARCHIVO · 04B Concepto · Flujo continuo | 70 | Full recorded concept board restored; 69 direct design children. |
| 13 | `n1687` | `n1437` | ARCHIVO · 04C Concepto · Intención estructurada | 120 | Full recorded concept board restored; 76 direct design children plus preserved page-level nodes. |
| 14 | `n1317` | `n1425` | ARCHIVO · 80 Exploración previa · Bandeja workstation | 31 | Recorded low-fidelity architecture board restored; 1440×980. |
| 15 | `n1319` | `n1427` | ARCHIVO · 81 Referencia previa · Bases maestras | 25 | Recorded low-fidelity architecture board restored; 1440×980. |
| 16 | `n1504` | `n1431` | ARCHIVO · 82 Exploración previa · Recursos | 93 | Preserved complete source tree restored: 92/92 semantic direct-child matches. Five stroke payloads were normalized; one red stroke weight changed from 1.5 to 1. |
| 17 | `n1321` | `n1429` | ARCHIVO · 90 Futuro · XML y precios | 28 | Recorded low-fidelity architecture board restored; 1440×980. |

## Known divergences

1. Fifteen page IDs and their generated node IDs differ from the historical live document.
2. Pixel fidelity was not validated with fresh visual exports.
3. The archived Resources page preserves all 92 source children semantically; five stroke payloads required schema normalization, including one 1.5 → 1 stroke-weight change.
4. Some early foundation pages retain multiple imported page-level roots from the historical editing process. Their content is substantive and editable, but their internal root organization is not normalized.

No page is empty or a generic placeholder.
