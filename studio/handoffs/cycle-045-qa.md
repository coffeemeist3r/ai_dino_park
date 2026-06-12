# Cycle 45 — QA

**Item:** BACKLOG-192 [emergent] Dawn chorus

**Build:** ✅ clean (`npm --prefix game run build` — tsc + vite, 9.0s).
**Unit tests:** ✅ 375 passed / 41 files (incl. 8 new `tests/unit/chorus.test.ts`).
**E2E tests:** ✅ 137 passed in a single fresh full run (`npx --yes kill-port 5173` then
`npx playwright test`), **no flake this run** (+4 `tests/e2e/cycle-045-chorus.spec.ts`).
Note for the record: the Coder's first cold parallel run of the new spec alone boot-timed-out
on all four (the catalogued cold-boot/optimizeDeps flake) and went green on a warm re-run; the
full-suite run above was clean start to finish.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `chorusOrder(dinos)` orders by descending energy, each with `delayMs ≥ 0` | ✅ PASS | unit "orders the cast by descending energy"; delays are `Math.round(non-negative)` |
| 2 | First `delayMs === 0`; non-decreasing down the order; last (lowest-energy) largest when energies differ | ✅ PASS | unit "first entry starts at 0 and delays never decrease" + "the lowest-energy dino is last and waits the full spread" |
| 3 | Energy ties break alphabetically by name (deterministic/stable) | ✅ PASS | unit "ties in energy break alphabetically by name" (re-shuffled input → identical output) |
| 4 | Founders: highest-energy founder first, lowest-energy founder last (derived from seeds) | ✅ PASS | unit "on the real name-seeded founders the most energetic leads and the calmest closes" (compares to a seed-sorted `ROSTER`) |
| 5 | A live hour-tick crossing into hour 7 fires once: `__lastChorus()` populated, `__dawnCount()` +1 | ✅ PASS | e2e "a live crossing into dawn fires the chorus once…": `__setClock(3,6,59)`→count 0, `__advanceWall(120_000)`→count 1, order non-empty |
| 6 | Same boundary again within the same in-game day does not re-fire; a fresh day fires again | ✅ PASS | e2e "fires at most once per in-game day, and a fresh day re-arms it": count 1 after the +12h same-day step, 2 after rolling into day 6's dawn |
| 7 | Restore-style `__setClock` onto hour 7 (no live tick) does not fire (`__dawnCount()` stays 0) | ✅ PASS | e2e "a restore-style clock set onto the dawn hour is silent": `__setClock(4,7,30)`→count 0, `__lastChorus()` null |
| 8 | Muted: order still computes, plays nothing, zero page errors | ✅ PASS | e2e "muted: the order still computes but nothing plays…": after M + live dawn, `__lastChorus()` populated, `__lastSound()` null after the full ≤1.8s spread, `pageerror` list empty |
| 9 | A 🌅 dawn line appears in the event log when the chorus fires | ✅ PASS | e2e #5 asserts `__events()` contains a `🌅` entry |
| 10 | Build clean; full unit + e2e suite green | ✅ PASS | 375 unit / 137 e2e / build all green (above) |

## Bugs found
None. The fired order cross-checks against the pure `__chorusOrder()` of the current cast, so
the live path provably uses the same math the unit tests pin. No regression in the neighbouring
audio (cycle-044 sound 5/5), season (cycle-040), or clock (cycle-028) specs — all green in the
full run.

## Boundary / charter
- `audio/chorus.ts` is pure (no Phaser, no WebAudio import) — Node-tested.
- `audio/voice.ts` remains the only file touching `AudioContext`; `@mlc-ai/web-llm` untouched
  (still only under `game/src/ai/`).
- No `SAVE_VERSION` bump; the once-per-day guard is transient scene state re-derived from the
  clock. Additive only. Reflection (hour 6), the season turn, and autosave are untouched.

## Recommendation
**APPROVE.** 10/10 acceptance criteria pass; build + full suite green; boundary intact; no
save change; no regressions.
