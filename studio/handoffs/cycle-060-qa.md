# Cycle 60 — QA

Shared:
- **Build:** ✅ clean
- **Unit tests:** ✅ 556 passed (54 files)
- **E2E tests:** ✅ 190 passed (one fresh full run; cycle-060 also green under `--repeat-each=2`)

---

## Lore track — BACKLOG-272 (fond greeting)

| Criterion | Status | Evidence |
|---|---|---|
| `fondGreeting(name)` pure, warm, names the dino | PASS | cycle-060-fond-greeting.test.ts |
| `FOND_MIN` exported, === 8 | PASS | unit |
| `cannedReply` fond at affection ≥ 8 inclusive | PASS | unit (8 + 10) |
| ordering gratitude → wistful(≤1) → fond(≥8) → generic(2–7) | PASS | unit (1→wistful, 5→generic, 8→fond, gratitude wins) |
| no affection → generic (back-compat) | PASS | unit; brain/greeting specs green |
| `buildMessages` fond clause ≥8 only, never with wistful, not when grateful | PASS | unit |
| E2E: a ≥8-heart dino greets fondly, names itself, not wistful/thanks | PASS | cycle-060-fond-greeting.spec.ts (Twitch to cap) |
| build + full suites green | PASS | above |

**Bugs found:** during test-writing, a Warm tone on prickly Rex docked a heart below FOND_MIN — caught,
fixed by driving the warm founder (Twitch) whose Warm-tone fit holds affection at the cap. No product bug.

**Recommendation:** `APPROVE`

---

## Structure track — BACKLOG-032 (roles persist)

| Criterion | Status | Evidence |
|---|---|---|
| `settleRole(undefined/'wanderer', x)` → x | PASS | cycle-060-roles-persist.test.ts |
| held non-wanderer + derived 'wanderer' → keeps it (never reverts) | PASS | unit (socialite/gossip) |
| held non-wanderer + different non-wanderer → changes | PASS | unit |
| `settleRole('wanderer','wanderer')` → wanderer | PASS | unit |
| save round-trips `roles`; absent → `{}` (old saves valid) | PASS | unit (roles + saveGame fixture) |
| E2E: an emerged role is settled + persisted | PASS | cycle-060-roles-persist.spec.ts (Rex→homebody via bond 60 → `__roles`/`__roleStore`/`__exportSave`) |
| lens/book still render a role for every dino (no regression) | PASS | roles-lens / book specs green |
| build + full suites green | PASS | above |

**Bugs found:** none. Non-reversion is unit-covered (settleRole); the e2e proves the persistence wiring,
since `__bondPair` can only raise bonds (documented deviation). Role-driven behavior is out of scope (104).

**Recommendation:** `APPROVE`
