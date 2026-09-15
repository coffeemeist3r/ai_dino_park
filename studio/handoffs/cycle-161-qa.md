# Cycle 161 — QA

**Build:** ✅ `npm --prefix game run build` clean.
**Unit tests:** ✅ `npx vitest run` — **2806 passed**, 3 skipped, 265 files (2768 at cycle 160; +38).
**E2E tests:** ✅ `npx playwright test` — **763 passed**, 1 skipped, **0 failed**, on **two consecutive
full runs** (8.2m and 8.4m). No flake, no re-run, no isolated retry. The cycle-160 verdict named one
(`cycle-042-art-pixel-sunny`); it did not reappear in either run tonight.

**Boundary:** ✅ `grep -rl '@mlc-ai/web-llm' game/src | grep -v '^game/src/ai/'` is empty.
**Tree:** ✅ clean after both runs — `.e2e-boot-times.jsonl` is gitignored and does not appear in
`git status`.

---

## Lore track — BACKLOG-068 (acquired taste)

| Criterion | Status | Evidence |
|---|---|---|
| Warming record is a pure Node-testable module; no Phaser import | **PASS** | `game/src/world/palate.ts` imports only `./foods`. `palate.test.ts`, 9 tests, runs under the `node` vitest environment. |
| Two meals is not warm; the third is | **PASS** | `palate.test.ts` "two meals of the same food is not warm; the third is". E2E specs 1 and 2 assert the same thing through the real feed path. |
| Three different foods, once each, warms nothing | **PASS** | `palate.test.ts` "three different foods, once each, warms the dino to nothing". |
| The crossing meal flashes 😌 and writes exactly one log line naming dino + food | **PASS** | E2E "three of the same wrong dinner and the dino comes round" — `toHaveLength(1)` on the warmed lines, plus `toContain('Rex')` and the food's label. Spec 2 asserts zero such lines at two meals. The 😌 rides `foodReaction.emoji`, pinned in `cycle-161-taste.test.ts`. |
| `foodReaction`: warmed → 7/😌, favorite → 9/😋, neither → 5/🙂 | **PASS** | `cycle-161-taste.test.ts`, three cases plus a whole-roster × whole-FOODS sweep proving unchanged behavior for every caller that omits the new argument. |
| A prickly, sated dino refuses an unwarmed non-favorite and not a warmed one | **PASS** | `cycle-161-taste.test.ts` sweeps the entire prickly × well-fed grid both ways. E2E spec 4 drives it end to end on Mossback: the first dish is left lying there (`__food` not null, `__refused` not null), the same dish after warming is eaten (`__food` null). |
| A refused dish increments nothing | **PASS** | E2E spec 4 — after the refusal the palate is still empty; the count only reaches 3 across the three meals that were actually eaten. |
| **LUMEN-3's scan increments nothing** | **PASS** | E2E "the scan is a read, not a dinner" — three scans, `__tasted` fills (069 unchanged), `__palate` is `{}`. |
| Book line carries `warmed to <emoji> <label>`, and omits it otherwise | **PASS** | E2E specs 1 (contains) and 2 (does not contain); `cycle-161-taste.test.ts` at the `menuLine` level. |
| A food both warmed and favorite reads `loves`, never `warmed to` | **PASS** | `palate.test.ts` "omits whatever is currently the favorite"; `foodReaction`'s `favorite && warmed` case in `cycle-161-taste.test.ts`. |
| Round-trips a save; a pre-161 save opens with nobody warm | **PASS** | `tests/unit/cycle-161-palate-save.test.ts`, 6 tests (round-trip, absent key, unknown roster kept, fractional floored, bad counts rejected, bad shapes rejected). E2E spec 5 proves it through a real save + re-boot. |
| E2E on a fresh `as-shipped` save | **PASS** | All five specs in `cycle-161-acquired-taste.spec.ts` call `foundingState(page, 'as-shipped')`. |

**Reachability check (CHARTER v7), ten minutes on a fresh save:** the founding satchel ships
`greens: 4` and `WARM_AT` is 3. A keeper who presses `H` three times into the same mouth — with the
stock the game hands them at boot, no refill, no day boundary, no population floor — sees a 😌, a
ticker line, a heavier friendship bump, and a new clause in the book. Nothing about this waits.

**Bugs found:** none in production code. Two spec-authoring traps were hit and are written up in the
codeplan's Shipped section — `__setTrait('agreeableness', 0)` moves the favorite (because `favoriteFood`
is `giftScore` over live traits), and the event log rolls, so a three-feed sequence pushes an earlier
refusal line off it. Both are facts about the harness, not defects; both now carry comments in the spec.

**Recommendation: APPROVE.**

---

## Structure track — BACKLOG-538 (the boot-flake instrument)

| Criterion | Status | Evidence |
|---|---|---|
| `npm run flake:boot` prints a per-boot table plus a summary with max and headroom | **PASS** | Run twice tonight. Output below. |
| Server starts cold and is torn down on exit, including on failure | **PASS** | `startColdServer` kills the port first and never warms; teardown is a `finally` per round plus a `finally` around the whole run plus a `SIGINT` handler, and it shells `kill-port` as well as `child.kill()` because on Windows the vite grandchild outlives its parent. Port 5173 was free after every run. |
| `--rounds` / `--parallel` / `--ceiling` configurable, defaults finish in minutes | **PASS** | `parseArgs` unit-tested. 2×4 took ~40s; 2×8 took ~50s; default 3×6 is comparable. |
| Non-zero exit on breach, zero otherwise | **PASS** | `harness()` returns 1/0 into `process.exit`. No breach occurred, so the zero path is demonstrated; the one path is the same two lines and is covered by the `breached` filter. |
| `boot()` appends timestamp, spec title, canvas ms, ready ms, source | **PASS** | 1560 lines accumulated over two suite runs, every one carrying `source:"suite"` and a full `titlePath`. |
| The boot clock fails open, **proven by a test** | **PASS** | `tests/unit/bootstats.test.ts` — "returns rather than throws when the log path cannot be written", pointing `recordBootLine` at a path through an existing file. |
| `.e2e-boot-times.jsonl` gitignored; tree clean | **PASS** | `git status --porcelain` empty after both full runs. |
| `--report` prints count / median / p95 / max / worst spec / headroom | **PASS** | Output below. |
| Summary arithmetic is a pure module, unit-tested (empty, single, known percentile) | **PASS** | `scripts/bootstats.mjs` + 13 tests, including nearest-rank pinned at p50 and p95 over `[1..10]`, and the "worst is the max, not the last sample" case. |
| Existing suite unchanged in behavior | **PASS** | 763/763 twice, no spec edited except the new one. |
| **Demonstrated in-cycle** | **PASS** | Below. |

### The demonstration, and the finding

**Over two full suite runs — 1560 boots:**

```
boots 1560 · min 330ms · median 643ms · p95 735ms · max 881ms
ceiling 30000ms · headroom 29119ms (97.1% of the ceiling still unused)
worst: cycle-160-hold-feed.spec.ts › the HUD under the thumb says what is loaded now
```

**Under the harness's deliberately hostile cold-parallel load** — a cold dev server with no warm-up,
N browsers hitting it simultaneously, the condition `globalSetup.ts` exists to remove:

| load | min | median | p95 | max | headroom |
|---|---|---|---|---|---|
| 2 rounds × 4 | 1147ms | 1150ms | 1197ms | 1197ms | 96.0% |
| 2 rounds × 8 | 1961ms | 2109ms | 2229ms | 2229ms | 92.6% |

**BACKLOG-538's leading hypothesis is measurably wrong.** The item proposed that BACKLOG-515 "bought
*headroom* rather than a floor and the suite has grown back into the seam" — that boots had crept up
toward 30s. They have not. The slowest boot in an entire 763-spec run is **881ms**, about **3%** of the
budget. Doubling the simultaneous cold load roughly doubles the boot (1197ms → 2229ms), so on this
box the ceiling would want somewhere near **a hundred-way** cold parallelism to be reached at all —
and the suite runs at two.

So a boot that dies at 30,000ms is not a slow boot. It is **~34× its own p95**: something stalls
outright. That is a different bug from the budget creep four cycles have been hunting, and it says the
next cycle should be looking for a hang — a `goto` that never resolves, a worker that never gets a
socket, a scene that throws before its last line — not for a bigger number.

**What it did not do:** catch a victim. Both full runs came up green, so the instrument has produced a
**bound**, not a reproduction. The harness says so in its own output, in those words. That is the
honest state and the verdict should carry it as such.

**Bugs found:** none. One cosmetic wart: Node prints a `DEP0190` deprecation notice for `spawn` with
`shell: true`, which is how `npm` is invoked on Windows. It is noise on stderr, it does not affect the
run, and removing it means a platform branch — not worth it tonight.

**Recommendation: APPROVE.**
