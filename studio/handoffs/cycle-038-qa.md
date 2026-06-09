# Cycle 38 — QA

**Build:** ✅ `npm --prefix game run build` clean (vite, 49 modules).
**Unit tests:** ✅ 270/270 (32 files; +7 new in `tests/unit/scan.test.ts`).
**E2E tests:** ✅ 91/91 (full fresh run, 57.6s; +4 new in `tests/e2e/cycle-038-scan.spec.ts`).
First full run tripped the **known cold-boot flake** (5 boot timeouts confined to
cycle-002/003, the first-alphabetical specs hitting a cold Vite): all 7 affected tests green
isolated, and the fresh full re-run was 91/91 — flake per the quality bar, not a regression.

## Acceptance criteria

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `keeper/scan.ts` pure, Node-tested | PASS | No Phaser import (imports: personality/brain/foods/roles/keepers — all pure); 7 vitest tests run in Node |
| 2 | `canScan` true only for lumen | PASS | unit "only LUMEN-3 can scan" |
| 3 | Dossier: name, species, 5 axes w/ pole labels, mood, favorite emoji+label, role | PASS | units "names the subject…", "all five personality axes…", "favorite-food line matches…", "mood line matches…" |
| 4 | `scanLines` deterministic | PASS | unit "is deterministic" (deep-equal double call) |
| 5 | `scanRefusal` distinct + non-empty for aether/vanta | PASS | unit "refusals are distinct…" (also pins lumen → '') |
| 6 | e2e: as Lux, B adjacent opens panel <500ms, `__scanOpen` true, lines include dino name | PASS | e2e "as LUMEN-3, B beside a dino opens the dossier" (expect.poll; asserts Rex/triceratops/mood:/loves; clean console) |
| 7 | e2e: B again closes | PASS | e2e "B again closes the dossier" |
| 8 | e2e: default keeper B → refusal in-world, `__scanOpen` stays false | PASS | e2e "other observers cannot scan" (refusal via `__bubbleTexts`, exact AETHER-1 line) |
| 9 | Every pre-existing spec passes; keys unchanged | PASS | 87 pre-existing e2e green on the same run (incl. cycle-037 keeper picker + cycle-035 tones); B additive |
| 10 | Build clean; full vitest + playwright green | PASS | totals above |

## Bugs found

None. Two notes, neither blocking:
- The Coder's `__warpTo` hook (deviation, justified) lands the player **on** the dino; it's
  dev-only and unreachable from gameplay keys.
- The scan panel sits top-left at the ticker's anchor; both visible at once overlap slightly —
  cosmetic, only when the ticker lens *and* a scan are open together, content still readable.
  Worth a line in a future HUD-polish pass (BACKLOG-147), not a rework.

## Recommendation

**APPROVE** — 10/10 criteria pass, suite fully green, boundary intact, save format untouched.
