# Cycle 5 — QA

BACKLOG-017 (spawn 5 NPCs) vs the cycle-005 acceptance criteria.

- **Build:** ✅ exit 0 (pre-existing chunk-size warning only)
- **Unit tests:** ✅ 30/30 (2 brain + 6 clock + 6 dayNight + 6 saveGame + 6 personality + 4 roster)
- **E2E tests:** ✅ 16/16 (default config)

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | Roster has 5 entries, 5 distinct names + species | ✅ PASS | unit `has 5 entries with distinct names and species` |
| 2 | 5 distinct, in-bounds spawn tiles, none == (3,3) | ✅ PASS | unit `spawns on distinct, in-bounds tiles that avoid the player start` |
| 3 | The 5 names yield pairwise-distinct personalities | ✅ PASS | unit `gives every dino a personality distinct from the others` |
| 4 | Rex is in the roster (anchor) | ✅ PASS | unit `keeps Rex as the anchor at index 0` |
| 5 | `__dinoCount()` === 5 on boot | ✅ PASS | e2e `five dinos spawn` |
| 6 | `__dinoNames()` → 5 unique names | ✅ PASS | e2e `all five dinos have unique names` |
| 7 | Greeting nearest dino still opens dialog flow | ✅ PASS | e2e `greeting a nearby dino still runs the dialog flow` |
| 8 | Save/day-night/personality/clock unchanged; `__dinoTraits` still Rex | ✅ PASS | e2e `Rex is still the anchor dino[0] with seeded traits` + cycle-2/3/4 suites green |
| 9 | Build clean; unit + e2e green | ✅ PASS | header |

## Bugs found
None. `roster.ts` is pure data, Node-tested for the invariants that matter (count, uniqueness, bounds, anchor, distinct personalities). The spawn is a straight loop reusing the `Dino` class and name-seeded traits — no personality re-implementation, no NPCBrain change. Rex stays `dinos[0]`, so cycle-3 save and cycle-4 traits hooks are unaffected (verified). Per-dino `color` is a rectangle fill for distinction, not sprite art (Artist 033–036 untouched). No new dependencies.

## Recommendation
**APPROVE.**
