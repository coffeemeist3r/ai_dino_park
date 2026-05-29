# Cycle 3 — QA

Verifying BACKLOG-009 (save/load via IndexedDB) against the cycle-003 acceptance criteria.

- **Build:** ✅ exit 0 (only the pre-existing Phaser chunk-size warning)
- **Unit tests:** ✅ 20/20 (2 brain + 6 clock + 6 dayNight + 6 saveGame)
- **E2E tests:** ✅ 10/10 on default `playwright.config.ts` (3 smoke + 2 day/night + 5 save)

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `serialize` → `deserialize` round-trips `{version,time,player}` | ✅ PASS | unit `round-trips serialize → deserialize exactly` |
| 2 | `deserialize` returns null (no throw) for malformed / non-object / bad version | ✅ PASS | unit `malformed JSON`, `non-object`, `version mismatch`, `player missing`, `non-numeric field` (5 cases) |
| 3 | Fresh boot (no save) → Day 1 08:00, default player, no console error | ✅ PASS | e2e `fresh boot with no save starts at Day 1 08:00` (asserts day/hour + empty error list) |
| 4 | `__advanceMinutes(65)` (crosses 09:00 → auto-save) then reload → hour 9 | ✅ PASS | e2e `auto-save on the hour survives reload` (waitForFunction hour===9 after reload) |
| 5 | Move player, `__saveNow()`, reload → position within 1px | ✅ PASS | e2e `player position survives reload` |
| 6 | `__exportSave()` parses to object w/ numeric version, time obj, player obj | ✅ PASS | e2e `export returns a well-formed JSON string` |
| 7 | Restore into a night hour updates HUD + tint (alpha ≥ 0.45) | ✅ PASS | e2e `restore into a night hour re-tints the overlay`; HUD shares the same restore path (`fmtClock` set in `setupSave`) |
| 8 | No regression: Z dialog, clock ticking, day/night overlay | ✅ PASS | smoke suite (boot, arrow key, clock tick) + cycle-002 day/night suite all green; restore reuses `applyTint`, dialog code untouched in diff |
| 9 | Build clean; unit + e2e green | ✅ PASS | see header |

## Bugs found
None. The split is clean: pure logic (`saveGame.ts`) unit-tested, IndexedDB I/O (`saveStore.ts`) exercised by a real round-trip in the browser. Clock reused via the new one-line `set()`; tint/HUD restore reuse the extracted `applyTint`/`fmtClock` helpers rather than duplicating. Auto-save failures log to console (no silent failure). NPCBrain boundary untouched; no new dependencies.

Note for the Validator: the manual **E**-key JSON download is verified only through `__exportSave()` (the serialized string), not the actual browser file download — headless download assertion was deliberately out of scope per the design. The serialization is fully covered; the anchor-click download is thin glue.

## Recommendation
**APPROVE.**
