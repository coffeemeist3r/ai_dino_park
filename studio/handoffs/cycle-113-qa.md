# Cycle 113 — QA

**Build:** ✅ (`npm --prefix game run build` clean)
**Unit tests:** ✅ 1343/1343 (`npm run test:unit`) — includes the 14 new (7 season-voice, 7 lean-season)
**E2E tests:** ✅ 388/389 — the one red per full run is the catalogued parallel-load boot-timeout flake
(a *different* spec each run: run 1 flaked controls-help + cycle-002-daynight, run 2 flaked
cycle-085-third-zone; **all pass isolated** — none touched by this cycle's diff). The three new
`cycle-113-lean-season` specs passed in both full runs and isolated.

## Lore track — BACKLOG-173: Season in the voice

| Criterion | Status | Evidence |
|---|---|---|
| `NPCContext.season` added; greet ctx sets it | PASS | `brain.ts` field; WorldScene `pickTone` passes `season: this.currentSeason()` |
| Winter greeting carries a grumble; spring a savour | PASS | `cycle-113-season-voice.test.ts` seasonAside + cannedReply |
| Summer/fall carry no aside (byte-identical) | PASS | `seasonAside('summer'/'fall')` → ''; `cannedReply` summer == none |
| Temperament-shaded (prickly/warm/even distinct) | PASS | distinct-set assert for winter and spring |
| Composes with other asides within cap | PASS | hungry+winter compose test, length ≤ 360 |
| WebLLM `buildMessages` season clause (winter/spring) | PASS | buildMessages clause test; summer/fall == no-season |
| No-season back-compat | PASS | `seasonAside('winter')` == even line; buildMessages summer == undefined |

**Bugs found:** none. **Recommendation: APPROVE.**

## Structure track — BACKLOG-461: The lean season

| Criterion | Status | Evidence |
|---|---|---|
| `seasonGrip` pure shapes (winter/summer/fall/spring) | PASS | `lean-season.test.ts` |
| `spoilFood(pile,cap,margin?)` optional margin, default byte-identical | PASS | default-margin test unchanged; widened/narrowed cases |
| `foodCapFor` winter = base−1, summer/fall = base+1, spring = base | PASS | `cycle-113-lean-season.spec.ts` via `__foodCap` + `__setClock` |
| Winter hoard spoils to a deeper floor than spring | PASS | e2e: grove 6→5→4→3→2 (winter floor 2 < spring floor 4) |
| Summer: a pile below base cap never spoils | PASS | e2e: bowl 6 untouched in summer |
| Harvest banking clamps at the seasonal cap | PASS | banking routed through `foodCapFor` (verified via `__foodCap`/`__bankFood`) |
| Season-turn banner shows the economic line | PASS | `seasonGripLine` logged on turn; `seasonGripLine` unit-asserted |
| Existing spoilage/foodstore/granary tests green | PASS | full unit suite 1343/1343 |

**Bugs found:** none. During test authoring the winter *floor* differs between the pure unit path
(base cap 6 → floor 3) and the live path (seasonal cap 5 → floor 2) because the cap delta only applies
live — expected and documented, both internally consistent. **Recommendation: APPROVE.**
