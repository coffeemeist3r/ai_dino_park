# Cycle 186 — QA

Board: `npm run build` clean · `npx vitest run` **3343 passed** (323 files, 3 skipped) · `npx playwright test`
**908/908** on the first full run · web-llm imported only under `game/src/ai/` (grep clean) · no save change.

## Lore track — BACKLOG-133

| # | Criterion | Result |
|---|---|---|
| L1 | `coaxOrder` by leader bond then name; [] for null/prickly leader | PASS (unit) |
| L2 | `coaxAnswer` comes iff agreeableness ≥ 0.35; refusal names foe; register lines | PASS (unit) |
| L3 | Fresh save: Sunny reaches both; Mossback refuses, Twitch comes in; Sunny–Twitch +10; ticker | PASS (e2e) |
| L4 | Twitch inside the circle after the fetch; in a ring pair at the close | PASS (e2e) — see finding 1 |
| L5 | Tales: Twitch `fetchedBy: Sunny`, Mossback `refused`; Sunny's greet names Twitch coming in; memories | PASS (e2e) |
| L6 | Founding feud untouched | PASS (e2e) |

**Finding 1 (noted, not blocking).** Twitch's ring partner is Sunny: by the time the strangers-first pass reaches
Twitch's pairs, every other neighbour is taken. That is the 180 rule working as written. The visible beat is the
fetch itself: Sunny|Twitch goes 0 → 10, over the friend floor, and 🌱 pops over both — Twitch's first friend in the
park is the dino that walked out to get it.

## Structure track — BACKLOG-600

| # | Criterion | Result |
|---|---|---|
| S1 | `keeperInRing` ≤ 3 true, 4 false | PASS (unit) |
| S2 | Opener appends present/absent by register; unchanged when `keeper` undefined | PASS (unit) |
| S3 | Keeper placed at the pond: counted once; Sunny's welcome once in ticker; +3 friendship each; memory each | PASS (e2e) |
| S4 | Keeper away: every tale `keeper: false`, greet *"You missed it — come next season?"*; present → *"You were there too!"* | PASS (e2e) |

**Finding 2 (reachability, positive).** The keeper spawns at tile (3,3), inside the festival's outer ring. A fresh save
left idle is therefore *counted* — Sunny turns to the keeper on the first festival step, and every greet after noon
ends *"You were there too!"*. A player who has wandered off hears *"You missed it."* Both halves reachable without any
setup. Older festival specs (183/184/185) unaffected: 13/13 festival specs green alongside.

**Recommendation:** APPROVED / APPROVED.
