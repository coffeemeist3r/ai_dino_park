# Cycle 122 — QA

**Verdict input:** both tracks PASS. 27/27 acceptance criteria met (13 lore + 14 structure).

## Gates

| Gate | Result |
|---|---|
| `npm run build` | clean |
| `npx vitest run` | **1541/1541** (+41 from cycle 121's 1500) |
| `npx playwright test` | **446/446** on a fresh full run (+15) |
| `@mlc-ai/web-llm` boundary | imported only by `game/src/ai/webllm.worker.ts` and `game/src/ai/webllmBrain.ts` |
| Save | additive (`cameFrom`), `SAVE_VERSION` unchanged, absent → `{}`, malformed rejected |
| Tree | clean at each stage commit |

**One flake, catalogued not excused.** The first full run came back 445 passed / 1 failed:
`cycle-121-work-priority.spec.ts › the work policy persists across a reload` read `null` after
`page.reload()`. Re-run isolated: 5/5 green. Fresh full run afterwards: 446/446 green, including that spec.
This is the BACKLOG-456 parallel-load shape (a reload spec racing the IndexedDB write under load) and it is
**off both diffs** — cycle 122 touches neither `workPriorityByZone` nor the governance save path except by
adding an unrelated field beside it, and the unit round-trip for the work policy passes. Noted, not a
regression. Worth flagging to the Structure-smith: this is a *fourth* noun on 456's list, and the first one
that is a reload rather than a pinned-pile assertion.

## Lore track — BACKLOG-347

| # | Criterion | Result |
|---|---|---|
| 1 | distinct glyph per ground, `🌿` fallback | PASS — `struck.test.ts`, all four distinct, `atlantis` → `🌿` |
| 2 | struck at tenure 0..1, not at ≥ `STRUCK_ROLLS` | PASS — unit + e2e (`the place wears off`) |
| 3 | never struck without a `cameFrom` | PASS — unit + e2e (`full of nowhere`) |
| 4 | memory carries `STRUCK_MARK`, no `PLENTY_TOKEN`, no grove-news phrase | PASS — pinned for all four zone names |
| 5 | `struckLine` is the glyph, `struckEvent` names dino + ground | PASS (criterion as revised at code-plan time) |
| 6 | a crossing files the memory naming the ground left | PASS — e2e, out of two different grounds |
| 7 | the instant path records `cameFrom` too | PASS — e2e drives `__migrate` throughout |
| 8 | the glance floats on the roll after arrival | PASS — e2e, glyph asserted per source ground (`🌾` bowl, `🍂` Fernreach) |
| 9 | null past the window | PASS |
| 10 | a homecoming is not struck | PASS — e2e walks a rooted dino home through `crossDino` |
| 11 | book reads `just back from <Zone>`, drops after | PASS — `__bookRows` + `__bookText`, both ends |
| 12 | `cameFrom` survives reload; older save loads clean | PASS — e2e reload + unit round-trip + malformed rejection |
| 13 | one ticker line per crossing, not per float | PASS — two rolls, exactly one `glancing back` line |

## Structure track — BACKLOG-475

| # | Criterion | Result |
|---|---|---|
| 1 | `hopDistances` measures the chain, both directions | PASS |
| 2 | `hopsBetween` symmetric, null on unknown | PASS — asserted over every pair in `ZONES` |
| 3 | `hopToward` steps closer; null on same/unknown | PASS |
| 4 | `hopToward(a, neighbour) === neighbour` | PASS — asserted over **every** link in `ZONE_LINKS`, which is the back-compat proof for every pre-475 caller |
| 5 | deterministic, no `Math.random()` | PASS — repeated-call assert + no `Math.` in the module |
| 6 | `nearestQualifying`: hops, then input order, null when none | PASS |
| 7 | two-hop hearsay now moves a body | PASS — e2e: `__plentyTarget` fernreach / `__plentyDest` grove, then grove → fernreach |
| 8 | two-hop longing steps toward it | PASS — e2e walks the full bowl→grove→fernreach→hollow chain one roll at a time |
| 9 | adjacent-target picks unchanged | PASS — both pulls pinned; **all** cycle-110 and cycle-121 specs green untouched |
| 10 | demand read prefers the nearer grower | PASS — unit (grove 1 harvest beats Hollow 4) + e2e via `__zoneMap` |
| 11 | equal hops → greater harvest still wins | PASS |
| 12 | still null until somebody has grown a surplus | PASS |
| 13 | every migration destination is still a neighbour of home | PASS — e2e asserts it from three different standing grounds while a far longing is live |
| 14 | build clean, boundary intact, no save change on this track | PASS |

## Notes for the Validator

- The Coder's in-fire finding is the interesting one and I re-verified it rather than taking the note: with
  `seedYearning` reading `yearnDestOf`, a dino that misses the Hollow from the bowl files
  `💭 haven't seen The Grove in a while`. The e2e `the ticker names the ground it wants, not the one it
  steps into` is the pin against it returning, and it asserts the negative (`not /misses The Grove/`) as
  well as the positive.
- Criterion 5 was **revised at code-plan time, not dropped** — the planner argued the memory-parse book line
  would strand the dossier line on forever (the 251 wart) and swapped it for a live read. Reviewed: correct,
  and criterion 11's "drops after" is only testable because of it.
- Three dev hooks were added for observability (`__homeZone`, `__scarcityMigrate`, `__setHarvests`). The
  first two drive production code paths; `__setHarvests` seeds a tally the demand read is a pure function
  of. None of them changes production behaviour.
