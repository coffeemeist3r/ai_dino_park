# Cycle 59 — QA

Shared (one codebase, one run):
- **Build:** ✅ clean (`npm run build`, type-check passes, 9.16s)
- **Unit tests:** ✅ 537 passed (`npm run test:unit`, 52 files)
- **E2E tests:** ✅ 187 passed (`npx playwright test`, one fresh full run after `kill-port 5173`, no flake)

---

## Lore track — BACKLOG-271 (wistful greeting)

| Criterion | Status | Evidence |
|---|---|---|
| `wistfulGreeting(name)` pure, wistful, names the dino | PASS | cycle-059-wistful-greeting.test.ts |
| `WISTFUL_MAX` exported, === 1 | PASS | unit |
| `cannedReply` wistful at affection ≤ 1, **inclusive** (exactly 1 → wistful) | PASS | unit (affection 0 + exactly 1) |
| `cannedReply` generic at affection > 1 (unchanged) | PASS | unit (affection 2) |
| `cannedReply` generic when affection undefined (back-compat) | PASS | unit + brain.test.ts still green |
| gratitude beats wistful at 0 hearts | PASS | unit + e2e cycle-055/058 thanks specs still green |
| `buildMessages` wistful clause for neglected only (not befriended/grateful) | PASS | unit; cycle-012 prompt spec still green |
| E2E: a 0-heart dino greets wistfully, names itself, not a thanks line | PASS | cycle-059-wistful-greeting.spec.ts (test 174) |
| build + full suites green | PASS | above |

**Bugs found:** none. Regression watch — the wistful line is now the default for any ≤1-heart dino, but
no existing greet spec broke (they set gratitude, or assert source/prompt/side-effects, not generic text).

**Recommendation:** `APPROVE`

---

## Structure track — BACKLOG-143 (connected zone spine)

| Criterion | Status | Evidence |
|---|---|---|
| `crossing` returns `'east'` past the east edge, `null` inside; `'west'` mirror | PASS | cycle-059-zones.test.ts (signature is `(px,cols,tile)` — unused py/rows dropped per tsconfig; intent met) |
| `linkedZone` bowl→grove entry west / grove→bowl entry east, y preserved | PASS | unit |
| `linkedZone` null for an unlinked edge | PASS | unit (bowl west, grove east) |
| `setZone`/`zoneOf` round-trip + fallback | PASS | unit |
| save round-trips `zoneId`; absent → `'bowl'` (old saves valid) | PASS | unit (zones + saveGame fixture) |
| E2E: boot bowl → walk east → grove (repositioned west) → walk back → bowl | PASS | cycle-059-connected-zone.spec.ts test 172 (real key-driven cross, 10.6s) |
| plaque shows the zone name; bowl unchanged when `zoneId==='bowl'` | PASS | test 173 (Pocket Cretaceous → The Grove); all bowl specs (glass/feeding/movement) green |
| build + full suites green | PASS | above |

**Bugs found:** none. Grove starts empty by design (per-dino population is BACKLOG-274, filed). The
crossing check is a strict no-op off the linked edge — every existing bowl spec stayed green.

**Recommendation:** `APPROVE`
