# Cycle 79 — QA

Build clean (`tsc -b && vite build`). **813 unit green** (+17). **e2e 247/248** — the single failure
was `mobile-minds.spec.ts:79` (long-dialog GBA paging), the documented rotating parallel-load flake:
green isolated (`mobile-minds:79 --workers=1` → 1 passed, 2.3s), the failure set rotates between full
runs (saw cycle-038-scan, cycle-069, cycle-077-carry, mobile-minds across runs, each green isolated),
and it is **untouched by this diff** — the change lives in `arrival`/`plot`/`resource`-adjacent code
and the keeper-zone plot glue, nothing in the dialog/paging path. web-llm boundary grep clean;
`arrival.ts`/`plot.ts` import no Phaser/AI (pure).

## Lore track — BACKLOG-359 (first sight of the pond)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Grove dino within radius of pond water files 💧 memory + bubble | **PASS** | unit `nearPond`/`firstPondSight`; e2e `cycle-079-pondsight:18` (`__seePond('Rex')` → pondSeen + "first saw the pond" memory) |
| 2 | Once per dino ever — no duplicate | **PASS** | unit (`pondSeen` dedupe); e2e `:18` (second `__seePond` → count stays 1) |
| 3 | Distinct from 339 — grove dino away from pond does not fire | **PASS** | unit (`firstPondSight` false at {1,13}); e2e `:34` (pond memory present, "first time across" absent, groveVisited unchanged) |
| 4 | Bowl dino never fires (zone gate) | **PASS** | unit `cycle-079-pondsight` (BOWL_ID → false even on a water-coord tile) |
| 5 | `pondSeen` round-trips; absent → [] | **PASS** | unit `saveGame` ("round-trips a pondSeen list, defaults absent, rejects non-string") |
| 6 | No SAVE_VERSION bump; 339 path untouched & green | **PASS** | `SAVE_VERSION` still 2 (cycle-061 spec); `cycle-074-arrival` green; `groveword.ts`/`groveVisited` untouched |

## Structure track — BACKLOG-349 (grove plot)

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Grove has its own distinct plot tile on grove grass | **PASS** | unit `cycle-079-grove-plot` (`GROVE_PLOT_TILE` ≠ `PLOT_TILE`, `groveTileAt` = grass, off the edges) |
| 2 | Grove plant → grow → harvest on the realtime-day clock | **PASS** | e2e `cycle-079-grove-plot:17` (`__plantPlot('grove')` seed → +2 days ripe → harvest drops 🍓, harvested=1) |
| 3 | Each plot draws/works only in its own zone | **PASS** | e2e `cycle-069-zone-objects:37` (`plotByZone.bowl` true / `.grove` false in bowl; flips in grove) |
| 4 | Bowl plot behaviourally byte-identical | **PASS** | `cycle-066-plot` (no-arg `__plantPlot`/`__harvestPlot` default to active=bowl) green; cycle-317 plot-art path green |
| 5 | `grovePlot` round-trips additively, independent of `plot`; old saves → grove-empty | **PASS** | unit `saveGame` ("round-trips a grove plot independently", "older save lacking grovePlot → null", "malformed grovePlot → null") |
| 6 | No SAVE_VERSION bump; build clean; boundary intact | **PASS** | `SAVE_VERSION` 2; build green; web-llm grep clean |

Both tracks → **APPROVE**. phase → validator-pending.
