# Cycle 174 — QA

- **Build:** ✅ `npm run build` clean.
- **Unit tests:** ✅ 3166 passed / 3 skipped (299 files).
- **E2E tests:** ✅ with one real find fixed and one known flake.
  - Run 1: 859 passed / **1 failed** — `cycle-159-refusal` › *somebody less fussy comes along and eats the very same piece*.
    Deterministic (4/4 isolated). **Ours:** the spec puts Twitch on the food tile right beside Mossback, and Mossback|Twitch
    is now the founding feud — the standoff shoves one of them two tiles away before the piece is eaten. The spec is
    about refusal, not the feud, so it now makes the pair civil first (`__setGrudge('Mossback','Twitch',0)`), the
    `strangers` discipline applied to one pair. 21/21 on repeat after.
  - Run 2 (fresh, with the fix): 859 passed / 1 failed — `cycle-148-hour-in-voice` (greeting copy by hour). Passed in
    run 1, 12/12 isolated, touches neither feud dino nor anything changed tonight → the known parallel-load flake, noted.
  - Boundary: `@mlc-ai/web-llm` imported only under `game/src/ai/` (grep clean).

## Structure track — BACKLOG-574

| criterion | status | evidence |
|---|---|---|
| Fresh save grudges = Mossback\|Twitch 40 only | PASS | `cycle-174-grudges` › a fresh park opens with one feud |
| Book names the feud on both pages; Rex has none | PASS | same spec, `__bookText` page slices |
| Contested drop adds `GRUDGE_PER_CONTEST` | PASS | `cycle-174-grudges` › a contested drop feeds the grudge (`__forceContest`, production path) |
| Drift toward 0, slower than bonds | PASS | `cycle-174-grudges.test.ts` › grudges cool (200 steps: under 40, over the bar) |
| Save round-trip / absent / malformed | PASS | unit `grudges in the save`; absent stays absent (deviation noted in codeplan), scene reads `?? {}` |
| `strangers` empties grudges | PASS | `cycle-174-grudges` › strangers have no feuds either |
| Founding pair = roster names, same spawn zone | PASS | unit `founding feud` |

**Bugs found:** none in the track. **Recommendation: APPROVE.**

## Lore track — BACKLOG-024

| criterion | status | evidence |
|---|---|---|
| `squareOff` bolder holds, tie by name | PASS | unit `squareOff` |
| `backOffTile` 2 away, clamps | PASS | unit `backOffTile` |
| Founding rivals square off on their own within 10 min | PASS | `cycle-174-standoff` › on their own (3 tiles apart, ordinary `__stepWorld`, ≤200 steps) |
| Yielder ≥ 2 tiles away after | PASS | `cycle-174-standoff` › the yielder backs off |
| Both memory rings carry it | PASS | same spec |
| Cooldown blocks a second standoff | PASS | unit `standoffDue` |
| Under-bar pair never squares off | PASS | `cycle-174-standoff` › Rex/Sunny adjacent, stepped, no 💢 |
| `STANDOFF_ART_KEY` placed by the world | PASS | unit, `worldPlacedProps` |

**Bugs found:** the cycle-159 interaction above — a behaviour change the old spec could not have known about, not a
defect in the feature (a rival stepping onto food beside its rival is exactly when a standoff should fire). Fixed in
the spec. **Recommendation: APPROVE.**
