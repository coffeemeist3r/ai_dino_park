# Cycle 119 — QA

Verified against the cycle-119 design's acceptance criteria. Both tracks pass.

## Gates

- `npm run build` — **clean** (type-check + Vite + PWA precache, exit 0).
- `npx vitest run` — **1448/1448 green** (160 files, +25 tests over cycle 118's 1423).
- `npx --yes kill-port 5173` then `npx playwright test` — **412/412 green** on the re-run (409 + the 3 new
  cycle-119 specs). See "the flake" below for the first run.
- WebLLM boundary: `grep -rn "@mlc-ai/web-llm" game/src` outside `game/src/ai/` → **no hits**.
- Save: additive on both tracks (`hollowPlot`, `pioneers`); old saves load with the Hollow plot null and no
  pioneers, pinned by unit tests. Tree clean, `main` never red.

## Structure track — BACKLOG-472

| # | Criterion | Verdict |
|---|---|---|
| S1 | Four `ZONES`; `zoneChain()` = bowl → grove → fernreach → hollow | **PASS** (unit + e2e `__zoneMap`) |
| S2 | Keeper crosses the Fernreach's east edge; indicators read both ways, no UI code changed | **PASS** (unit + `cycle-090-edge-labels`) |
| S3 | Hollow bakes its own terrain; the three founding floors byte-identical | **PASS** (tile-for-tile grid comparison against each zone's own rule) |
| S4 | `zoneWaterTile('hollow')` sits on water — the cycle-108 landmark invariant, now four zones | **PASS** |
| S5 | Hollow farms mushrooms through the existing plot path | **PASS** (unit + e2e plant→ripen→harvest, ticker names the crop) |
| S6 | Every season has exactly one thriving crop; the founding three still base in spring | **PASS** — with a scope note, below |
| S7 | Four boxes on the lens, rendered by existing code | **PASS** (`__zoneMap` e2e, zero lens edits in the diff) |
| S8 | Mushrooms flips no roster favorite, any season | **PASS** (roster × 4 seasons) |
| S9 | Additive save both ways | **PASS** |
| S10 | Every line written *for* the fourth zone is listed as a finding | **PASS** — four findings logged, see below |

**S6 scope note (accepted, not a defect).** The design predicted a clean 4×4 rotation — one thriving and
one thin crop per season. What shipped is one thriving per season and *two* thin in fall. QA checked the
arithmetic: with the founding three already holding fall/winter/summer as their lean seasons, spring is the
only free slot on both sides and one crop cannot occupy both. The alternative — re-pointing roots' lean at
spring — would square the table by breaking the spring hinge, i.e. changing what a *fresh boot* banks from
a pre-existing ground. The coder chose the hinge over the symmetry, said so in the source, and amended the
cycle-118 test to state the new shape explicitly rather than loosening it into vagueness. The
`seasonCropLine` ticker was widened in the same breath so a two-lean season names both crops instead of
silently reporting the first. QA accepts this as a better outcome than the spec's prediction, and flags it
for the Validator as a *spec deviation argued in the open*, which is the behaviour the item asked for.

## Lore track — BACKLOG-343

| # | Criterion | Verdict |
|---|---|---|
| L1 | First arrival recorded; no overwrite, no re-fire | **PASS** (unit + e2e second migrant) |
| L2 | Exactly one 🚩 ticker line naming dino and zone | **PASS** (e2e counts the beats = 1) |
| L3 | Book line on the pioneer's block only | **PASS** (`bookLines` match count = 1) |
| L4 | No bowl pioneer on a fresh save | **PASS** (`__pioneers()` = `{}` at boot) |
| L5 | Additive save, no back-fill | **PASS** |
| L6 | The Hollow is founded with no code written for it | **PASS** — the generalization proof, asserted in both the unit test and the e2e |

## The flake

The first full e2e run reported four failures. Three were genuine and fixed before this report:
`cycle-090-edge-labels` and `cycle-091-zone-map` (×2) asserted a three-zone chain — the same
three-is-hard-coded class the coder found in six unit files, and again *test* assumptions rather than
behaviour breaks. The fourth, `cycle-039-inspect` "a fresh boot arms nothing", is the catalogued
parallel-load flake: it passes isolated (4/4) and passed on the clean re-run. Not a regression. Also seen
once: three cycle-119 specs timing out at boot immediately after `kill-port` killed the dev server —
cold-Vite boot, green on the very next run, the known BACKLOG-456/e2e-boot pattern.

## Recommendation

**APPROVE both tracks.** The structure track did the thing it was written to do — nine cross-zone systems
met a fourth ground with zero production lines, and the places that *did* cost a line were surfaced and
argued rather than patched in silence. The lore track shipped whole and independently, and its L6 assertion
is the cleanest single sentence of evidence the milestone has.
