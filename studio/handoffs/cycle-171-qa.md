# Cycle 171 — QA

## Structure track — BACKLOG-565 (+567)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| S1 | Fresh boot `__bonds()` = `FOUNDING_BONDS` | PASS | `cycle-171-bond-range` › founding friendships |
| S2 | `__loners()` is exactly `['Twitch']` | PASS | same spec; unit `leaves exactly Twitch friendless` |
| S3 | Restored save is not re-seeded | PASS | `cycle-171-bond-range` › restored save |
| S4 | `meetGain` 4 / 2 / 0; 200 meets < 100; 40 > 10 | PASS | `cycle-171-closest.test.ts` |
| S5 | 80 steps: a Bowl pair < 90 | PASS | `cycle-171-bond-range` › eighty world steps (also max < 100) |
| S6 | Bonds lens draws on frame one | PASS | `__bondLines() > 0` |
| S7 | Book `bond:` is an integer | PASS | regex over `__bookText()` after 5 steps |
| S8 | Build / unit / full e2e | PASS | see Board |

## Lore track — BACKLOG-134

| # | Criterion | Result | Evidence |
|---|---|---|---|
| L1 | Rex `close to Sunny`, Twitch `no friend yet` | PASS | `cycle-171-closest-friend` › frame one |
| L2 | Every other page names its founding closest | PASS | same spec, 8 dinos |
| L3 | Mossback–Rex to 40 logs the 💞 line, page names Rex | PASS | › overtaken |
| L4 | Mossback–Rex 26 vs Glade 24: nothing changes | PASS | › overtaken (first half) |
| L5 | No 💞 on boot | PASS | › frame one |
| L6 | Unit: tiers, hysteresis, floor, departed friend | PASS | `cycle-171-closest.test.ts` (11) |

## Found during QA — fixed in-cycle

**Bonds knitted across grounds.** A 300-step unhooked measurement of the 💞 ticker produced nine
shifts in the first 13 steps, starting with *Murk has grown closer to Bramble than to Glade* — Murk
lives in the Hollow, Bramble in the Grove. The ambient meeting loop compared tile coordinates with no
zone check, and every ground shares one tile grid, so dinos who had never seen each other "met" when
their coordinates coincided. This is the "including pairs that live on different grounds" line in
cycle 170's 567 measurement, and it is the root of much of the saturation that item describes. Fixed
at the loop (same-ground guard). Re-measured: six 💞 shifts across 200 steps (ten real minutes), each
between two dinos on the same ground.

The guard shifted the RNG stream once more and `cycle-042`'s spring case — like its winter case
earlier — asserted huddle on exactly step 45; both now assert *both at the den on one step within 45*
via one helper.

## Board

- `npm run build`: clean.
- `npx vitest run`: 292 files, 3119 passed, 3 skipped.
- `npx playwright test`: **843 passed, 1 skipped** on a fresh full run after the last fix. Earlier runs this cycle each lost one
  different spec (`cycle-128-pecking`, `cycle-085-stand-up`) that passed isolated 3/3 and 2/2 — the
  known parallel-load flake class, not regressions.
- `@mlc-ai/web-llm` imported only under `game/src/ai/`: confirmed by grep.
