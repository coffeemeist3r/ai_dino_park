# Cycle 124 — QA

**Build:** `npm run build` — clean.
**Unit:** `npx vitest run` from the repo root — **1602 / 1602** passed, 173 files (+18 on cycle 123's 1584).
**E2E:** `npx --yes kill-port 5173` then `npx playwright test`, run **twice**:
- run 1 — **462 / 463**, 1 failed (`cycle-121-work-priority > persists across a reload`).
- run 2 (fresh, confirmation) — **461 / 463**, 2 failed (the same work-priority reload spec, plus
  `cycle-077-carry`).

Isolated re-runs of both: `cycle-121-work-priority` **5/5 passed**, `cycle-077-carry` **1/1 passed**.

**Boundary check:** `grep -rl "@mlc-ai/web-llm" game/src` → `ai/webllm.worker.ts`, `ai/webllmBrain.ts`. Both
under `game/src/ai/`. CHARTER boundary intact.
**Save shape:** unchanged. Neither track adds a persisted field; 360 rides the memory ring + `bonds`, and
477 renders state that was already stored.

---

## The two e2e failures

```
1) cycle-121-work-priority.spec.ts:88 › the work policy persists across a reload
   Expected: "gather"   Received: null        (after page.reload())

2) cycle-077-carry.spec.ts:37 › a crossing dino ferries one banked resource to the zone it enters
   Expected: 1   Received: 0                  (a pinned grove pile total)
```

**Verdict: both are catalogued BACKLOG-456 parallel-load flakes, not regressions.** The evidence:

1. **Both pass isolated.** `cycle-121-work-priority` → 5/5. `cycle-077-carry` → 1/1.
2. **Both are named nouns on BACKLOG-456** — `cycle-077-carry` is the item's *first* noun (a pinned pile
   assert racing ambient gathering across a driven crossing) and the work-priority reload is its *fourth*,
   added last cycle (a reload racing the IndexedDB write under load).
3. **This exact pair failed on the cycle-123 run**, off a completely different diff — the cycle-123
   chronicle names both by name: "*The first full run lost `cycle-077-carry` and `cycle-121-work-priority >
   persists across a reload`.*" Two cycles running, two unrelated diffs, the same two specs.
4. **Both are off tonight's diffs.** 477 touches only the lens draw and the `[?]` panel — it cannot reach
   either spec. 360 touches the crossing departure seam, which `cycle-077-carry` does drive, so it deserves
   the closer look: that spec runs under `__pauseAmbient`, so no ambient meeting fires, so `pondSwapBeat`
   never runs, so neither dino carries a pond-swap memory, so `tryTogether` returns `null` on both
   crossings. And the spec passes isolated against this very build.

Stated plainly rather than rounded up: **neither full run was all-green.** Two runs, two flakes, both
catalogued, both isolated-green, both previously observed on a different diff. Recommend the Validator treat
the suite as green-with-noted-flakes — and note that BACKLOG-456 has now surfaced in **three consecutive
cycles**, which is a standing red the next Structure-smith should weigh against the milestone rule when it
picks.

**No pinned spec was amended this cycle.** The migration set (`cycle-076-news-pull`, `cycle-077-carry`,
`cycle-078-*`, `cycle-097-carry-pressure`, `cycle-123-capacity`) and the lens set (`cycle-117-spend-lens`,
`cycle-121-work-priority`) all ran on their committed assertions. That is the containment rule both code
plans wrote down in advance, and it held on both tracks.

---

## Lore track — BACKLOG-360 (pond pilgrimage)

| # | Criterion | Result |
|---|---|---|
| 1 | a pure module returns the candidate whose `pondSwapMemory` the leader carries, else null | **PASS** — `pondCompanion`; unit `together.test.ts` |
| 2 | deterministic with two eligible companions; no `Math.random` | **PASS** — 20 identical calls, first-in-candidate-order; the module's only `Math.random` mention is the comment explaining its absence |
| 3 | null when the destination is not the shared ground | **PASS** — unit (bowl, fernreach) + e2e "the companion rides the destination" |
| 4 | null when the companion is already migrating, or on another ground | **PASS** — the candidate list filters both; unit covers the empty/absent-candidate cases |
| 5 | null for a leader carrying no pond-swap memory | **PASS** — unit + e2e "inert on a park nobody has walked" |
| 6 | after a pull, `__migrating()` contains both names | **PASS** — e2e |
| 7 | each dino's memories contain a together-memory naming the other and the ground | **PASS** — e2e asserts both directions |
| 8 | the bond is strictly greater after than before | **PASS** — e2e, via `__bond` |
| 9 | the ticker names both dinos and the ground | **PASS** — e2e |
| 10 | on a fresh park, driving the seam for every dino fires no pull | **PASS** — e2e loops the whole cast |
| 11 | build clean, suites green, no pinned migration spec amended | **PASS** (with the two catalogued flakes above) |

**13 / 13 criteria pass** (11 rows, two of them multi-part).

Observations worth recording:

- The seam placement was right for the reason the plan gave. `__together` drives `tryTogether` directly and
  the two production callers (`tryHomesick`, `scarcityMigrate`) call the same method, so there is no
  test-only path anywhere in this feature.
- The **inertness control** did its job twice. It caught nothing on the lore track (the beat is genuinely
  dormant on a fresh park, as designed), and its structure-track twin caught the `·` glyph collision.
- Worth flagging for the Validator as a *deliberate* limit rather than a gap: the pull fires only when a
  crossing is already bound for the grove. A pair can therefore go a long time without ever travelling
  together — which is the arc's own reading (they go back *when they were going anyway*), but it does mean
  the beat is rare in ordinary play. It is not rare in the sense of unreachable: `__together` drives it, and
  the pond-swap precondition is a shipped, reachable state.

## Structure track — BACKLOG-477 (both of the ground's calls, on the lens)

| # | Criterion | Result |
|---|---|---|
| 1 | `GOVERNANCE_CALLS` ordered; line + legend derived from it; a third entry changes neither body | **PASS** — unit asserts an extra value is ignored and the legend length tracks the option count |
| 2 | `feed` + `build` → both glyphs, pantry before labour | **PASS** — unit asserts the index order |
| 3 | a partly-decided ground renders two positions (glyph + placeholder) | **PASS** — unit, both ways round |
| 4 | no calls set → empty string | **PASS** — unit (`null`, `undefined`, `[]`) |
| 5 | `spendGlyph`/`workGlyph` behaviour unchanged, existing tests unamended | **PASS** — their tests were not touched; a new case pins the descriptors against both functions |
| 6 | the legend names all four glyphs plus the placeholder, with meanings | **PASS** — unit iterates the table |
| 7 | the `[?]` panel contains the legend at runtime and still all controls rows | **PASS** — e2e via `__helpText`; unit asserts controls block + blank + legend exactly |
| 8 | the drawn box carries the row, and the prosperity line no longer ends with the glyphs | **PASS** — e2e via `__zoneMapText`, asserting *both* halves |
| 9 | a fresh park's boxes carry no governance row | **PASS** — e2e |
| 10 | `__zoneMap()` still returns `spend`/`work`; cycle-117 and cycle-121 lens specs unamended | **PASS** — both specs ran on committed assertions |
| 11 | build clean, suites green | **PASS** (with the two catalogued flakes above) |

**14 / 14 criteria pass** (11 rows, several multi-part).

Observations worth recording:

- The `·` collision is the finding of this track. `UNSETTLED_BADGE` (474) is `'· unsettled ·'` and draws in
  the same box, so the obvious placeholder character was already taken — by a read the player would be
  looking at *simultaneously*, on three of four grounds in a fresh park. Changed to `▫`. The only reason
  this surfaced before it shipped is that the spec asserts a fresh park contains **none** of the row's
  glyphs, which is the sort of negative assertion that usually feels redundant.
- The item asked to prevent an accretion, and the check on whether it worked is not a test but a diff: the
  prosperity line went from five reads to three, and the two that moved are now behind one function and one
  legend. Adding 479's call later is a literal new entry in `GOVERNANCE_CALLS`.
- The unsettled ground suppresses the governance row entirely, consistent with 474's existing rule that an
  unsettled box replaces its read rather than annotating it. Not in the acceptance criteria; noted as a
  judgement call the Coder made and the Validator should confirm.

---

## Recommendation

- **Lore track (BACKLOG-360): APPROVE.**
- **Structure track (BACKLOG-477): APPROVE.**

Both are Milestone 11's last arcs.
