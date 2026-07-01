# Cycle 87 — QA

**Build:** ✅ `npm run build` clean (type-check passes).
**Unit tests:** ✅ 917 passed (+15 this cycle: 9 tic + 6 barter) — shared, one codebase.
**E2E tests:** ✅ 276/277 in the full parallel run. The lone failure is `cycle-081-directed-carry`, the
catalogued cold-boot/parallel-load flake (it boot-times-out cold, passes green isolated/warm — verified twice
this fire; it does not touch this diff). The three cycle-087 specs pass in the full run and isolated.

## Lore track — BACKLOG-405 Solitary tic

| Criterion | Status | Evidence |
|---|---|---|
| `signatureTic` deterministic, one of pace/fuss/circle, can differ between dinos | PASS | `cycle-087-tic.test.ts` "signatureTic" (3 asserts + stability + not-equal) |
| Undisturbed dino past `TIC_AFTER_STEPS` → `__tic().invented` true; false before | PASS | `cycle-087-solitary-tic.spec.ts` (target invents within the step loop); `inventsTic` boundary unit test |
| Exactly one tic memory filed; re-entering doesn't append a second | PASS | `performTic` guards on `ticInvented` (adds once); e2e asserts the memory present; unit covers `ticMemory` shape |
| A dino with company in range never invents; its solo counter resets | PASS | e2e: the two grove exiles kept 1 tile apart never invent (`invented === false`); `resetTic` on `!aloneNow` |
| A dino with a pressing need never invents while it presses | PASS | `undisturbed` truth table (need → false); e2e keeps the target sated so solitude, not hunger, drives it |
| `ticStep` keeps pace/circle within 1 tile of anchor, holds fuss, clamps in-bounds | PASS | `cycle-087-tic.test.ts` "ticStep" (4 asserts incl. corner clamp) |

**Bugs found:** none. The tic sits strictly below `moping` and above `socializing`; a lonely (loner) dino
still mopes to the edge first and forms its ritual on a calm step — desired, and the mope tell stays first.

**Recommendation:** APPROVE.

## Structure track — BACKLOG-358 Edge-meet barter

| Criterion | Status | Evidence |
|---|---|---|
| `barterSwap` gives each side the other's shortfall kind (directedCarry both ways), or null | PASS | `cycle-087-barter.test.ts` "each side gives what the other needs" |
| Applying a barter is conserved (one pile −1, the other +1 per moving direction) | PASS | `barter.test.ts` conservation asserts; e2e branch/stone totals unchanged (=2 each) |
| Never banks past `STOCKPILE_CAP` (full dest → that direction blocked) | PASS | `barter.test.ts` cap guard (full-branch dest → `aGives` null) |
| `nearLinkEdge` returns the neighbour at a linking edge, null in interior; two-link zone reports either | PASS | `barter.test.ts` "nearLinkEdge" (bowl↔grove + grove's two edges) |
| Two dinos at the shared edge with tradeable piles barter within a scan; piles change + event logged | PASS | `cycle-087-edge-barter.spec.ts` ambient (`__maybeBarter` ×2 → bowl+stone, grove+branch) + `__edgeBarter` |
| A nothing-to-trade meet is a no-op (no phantom log/change) | PASS | `barter.test.ts` empty `barterSwap` → `{null,null}`; e2e `__edgeBarter` on empty piles → `traded === false` |

**Bugs found (fixed in-fire):** the first implementation's ambient scan mistook an *arriving crosser*
(parked one frame at the grove entry tile) for a meet and barter'd back the resource it had just carried,
breaking `cycle-077-carry`'s conservation. The Coder gated the scan to dinos *lingering* at the literal edge
column (`band=0`, `EDGE_DWELL=2`); `cycle-077-carry` + `cycle-081-directed-carry` now pass. No bond change
(economic beat only); conserved and cap-safe on the same transfer path carry uses.

**Recommendation:** APPROVE.
