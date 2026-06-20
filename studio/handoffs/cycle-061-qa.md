# Cycle 61 — QA

**Build:** ✅ `npm --prefix game run build` clean (type-check passes).
**Unit tests:** ✅ 576 passed (56 files) — +20 over cycle 60 (cycle-061-keeper-name 10, cycle-061-save-version 10).
**E2E tests:** ✅ 190 passed. One failure — `cycle-005-roster.spec.ts` (boot timeout, canvas not visible) — is the
catalogued cold-Vite/Phaser boot flake on a spec **untouched by this diff**; re-run isolated it passed 4/4. New
cycle-061 spec + both in-fire fixups (cycle-060 fond, cycle-036 sky) green in the full run. Treat as flake, not regression.

## Lore track — BACKLOG-276: The keeper has a name

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `designationOf` strips the nickname for all three keepers | PASS | unit "strips the nickname off every keeper" → AETHER-1 / VANTA-9 / LUMEN-3 |
| 2 | `fondGreeting(name, keeperName)` contains the keeper name | PASS | unit "with a keeper designation, the line names the observer" |
| 3 | `fondGreeting(name)` (no keeper) == legacy line byte-for-byte | PASS | unit asserts exact cycle-272 string + contains dino name, not AETHER-1 |
| 4 | `cannedReply` ≥8 + keeperName contains the designation | PASS | unit "≥8 hearts + keeperName → the reply names the observer" |
| 5 | Ordering gratitude → wistful → fond → generic unchanged | PASS | unit gratitude-beats / wistful-at-1 / mid-band-5 generic |
| 6 | `buildMessages` fond clause names keeper when set, byte-identical when unset | PASS | unit two buildMessages cases (`call them AETHER-1` present / absent) |
| 7 | E2E: ≥8-heart dino greeted as AETHER-1 names AETHER-1 | PASS | `cycle-061-keeper-name.spec.ts` + cycle-060 fixup both green |
| 8 | No save change this track; wistful + gratitude untouched | PASS | no `saveGame.ts` edit on lore track; cycle-271/247 specs green |

**Bugs found:** none.
**Recommendation:** APPROVE.

## Structure track — BACKLOG-040: Save format versioning + migration hook

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `SAVE_VERSION === 2`; serialize emits version 2 | PASS | unit "is now version 2" / "serialize emits the current version" |
| 2 | A valid v1 JSON deserializes → returns version 2 (migration ran) | PASS | unit "a literal v1 save deserializes and comes back v2" |
| 3 | A valid v2 JSON round-trips intact | PASS | unit "round-trips a current v2 save" + saveGame.test round-trip |
| 4 | A v99 (unknown/newer) JSON → null | PASS | unit "rejects a newer (v99) save" |
| 5 | Missing / non-numeric version → null | PASS | unit "rejects a missing/non-numeric version" |
| 6 | `migrate` is pure (no input mutation) and chains | PASS | unit "lifts a v1 object to v2 without mutating its input" |
| 7 | A v1 save with only a subset of additive fields still loads → v2 | PASS | unit "an old v1 save with only a subset … still loads" |
| 8 | Build + full suite green; existing version-literal tests updated | PASS | saveGame.test green untouched (v0 still → null); cycle-036 fixed 1→2 |

**Bugs found:** none. The existing `saveGame.test.ts` "version mismatch" case (`version: 0`) stays green — 0 is below
the migration floor, so it's still rejected; all other save tests use the `SAVE_VERSION` constant and bumped to v2
automatically.
**Recommendation:** APPROVE.

**State → validator-pending.**
