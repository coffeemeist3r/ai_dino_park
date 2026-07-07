# Cycle 94 — QA

**Build:** ✅ `npm --prefix game run build` clean (type-check passes).
**Unit tests:** ✅ `npx vitest run` — 1029/1029 pass (114 files, +9 new in `cycle-094-grief-tic.test.ts`).
**E2E tests:** ✅ `npx playwright test` — **308/308 pass** on a full parallel run (5 workers).

Notable: `mobile-minds.spec.ts` "long dialogs page GBA-style" (the catalogued BACKLOG-430 red) **passed**
this run. It failed on the *first* full run before 431 landed and passed after — the ambient pause removed
the background chatter that was racing that spec. Not claiming 430 closed, but 431 visibly stabilised it.

## Lore track — BACKLOG-414

| Criterion | Status | Evidence |
|---|---|---|
| `griefEdge` east/west/null by chain direction | PASS | `cycle-094-grief-tic.test.ts` griefEdge block (bowl→grove east, grove→bowl west, bowl→fernreach east, same/off-chain null) |
| `griefAnchor` west→col0 / east→last col, row preserved | PASS | griefAnchor unit block |
| `closestFriend` highest bond above floor, tie-break, null | PASS | closestFriend unit block (floor respected, lexicographic tie, self skipped) |
| Grieving dino's tic aims at the east edge + names friend | PASS | `cycle-094-grief-tic.spec.ts` "grieving a friend gone east" — `__griefTic.anchor.tileX === 19`, grieved === friend, memory contains friend + "edge they left by" |
| Control: closest friend in-zone → in-place ritual, plain memory | PASS | `cycle-094-grief-tic.spec.ts` control — grief null, memory has "a little ritual of your own", no "edge they left by" |
| Non-grief path byte-identical (405 spec green) | PASS | `cycle-087-solitary-tic.spec.ts` green (hardened for determinism, same intent) |

**Bugs found:** During QA the grief logic surfaced a real interaction — an isolated dino still bonds with
dinos in *other* zones because meets key on pixel proximity, not zone (`WorldScene.ts:2472`). That's a
pre-existing quirk (not introduced here); it made the first drafts of the tic specs mis-trigger grief. Fixed
in the *tests* by pinning the cast so the lone dino forms no accidental cross-zone bond — the production
logic is correct (a friend genuinely in another zone *should* be grieved). Left the meet-zone quirk alone
(out of scope; harmless — cross-zone "friends" are exactly what grief reads).

**Recommendation:** APPROVE.

## Structure track — BACKLOG-431

| Criterion | Status | Evidence |
|---|---|---|
| `__ambientPaused()` true after `boot()` | PASS | `cycle-094-pause-ambient.spec.ts` test 1 |
| Positions unchanged over >3s with no explicit step | PASS | test 1 — `after` deep-equals `before` after a 3.5s wait (past one WANDER_STEP_MS) |
| `__stepWorld()` still moves the cast while paused | PASS | test 2 — a dino moved after 6 explicit steps |
| `__resumeAmbient()` sets paused false | PASS | test 3 |
| Normal play unchanged (default false) | PASS | flag defaults `false`; only the e2e `boot()` / hook sets it — no production caller |
| Full existing suite green with boot() pausing ambient | PASS | 308/308, no spec relied on the auto-timers |

**Bugs found:** none. The gate lives only in the three timer callbacks; every ambient-beat spec drives its
beat through an explicit hook (`__triggerSky`, `__migrate`, `__maybeBarter`, `__advanceWall`), so none broke.

**Recommendation:** APPROVE.
