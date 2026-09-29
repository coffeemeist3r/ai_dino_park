# Cycle 172 — QA

## Board
- `npm run build`: clean.
- `npx vitest run`: **3128 passed**, 3 skipped, 294 files.
- `npx playwright test` (847 specs): run 1 **846/847** — `cycle-155-departure` (blur → visibility) red,
  **5/5 isolated**. Run 2 (fresh) **846/847** — `cycle-122-struck` (canvas `waitFor` 30 s timeout) red,
  **24/24 isolated** (`--repeat-each=3`). A different spec each run, both boot/wait timeouts under
  parallel load, neither touching bonds, friendship or the book: the known parallel-load flake class,
  noted, not a regression. No full run was 847/847 tonight; named here rather than rounded up.
- Boundary: no `@mlc-ai/web-llm` import outside `game/src/ai/`.
- CI on `main`: last three runs `success`.

## Lore track — BACKLOG-127
| # | Criterion | Result |
|---|---|---|
| L1 | ≤3, points desc, no zero / off-roster | PASS (unit) |
| L2 | #1 = homecoming pick over four maps incl. ties | PASS (unit) |
| L3 | empty / ranked / joined wording | PASS (unit) |
| L4 | book byte-identical without circle; line 2 with | PASS (unit) |
| L5 | fresh save: `nobody yet` → greet Rex → #1, ticker line, crown pop | PASS (e2e) |
| L6 | restored save does not re-announce | PASS (e2e) |
| L7 | `circle` in `worldPlacedProps` | PASS (unit) |

## Structure track — BACKLOG-570
| # | Criterion | Result |
|---|---|---|
| S1 | cools toward rest, never crosses; ≤ rest untouched | PASS (unit) |
| S2 | always-together pair settles 85–95 | PASS (unit) |
| S3 | apart 200 steps from 30 → 15–20 | PASS (unit) |
| S4 | never crosses the floor at 10× rate | PASS (unit) |
| S5 | cross-ground pair cools, ≥ 8; held ambient does not drift | PASS (e2e) |
| S6 | suites green | PASS (flake noted above) |

## Reachability measurement (fresh save, 200 world steps ≈ ten real minutes, unhooked)
Founding bonds `8…30` became `10…86`: Glade|Sunny 14 → 86, Mossback|Rex 12 → 63, while Rex|Sunny
30 → 18 and Bramble|Pip 26 → 16 (they did not keep each other's company). Max **86** — before drift the
same measurement's always-together pairs sat at ~99.6. Four `💞 … has grown closer to …` ticker lines,
every one a real overtaking. Cycle 171's lines were the graph filling up; tonight's are it re-sorting.

14 criteria, 14 pass.
