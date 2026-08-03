# Cycle 120 — QA

**Gates:** `npm run build` clean · `npx vitest run` **1481/1481** (+33 over cycle 119's 1448) ·
`npx playwright test` **419/419** (+7 over 412), full parallel run · `@mlc-ai/web-llm` imported only under
`game/src/ai/` (grep clean) · save additive on both tracks, no version bump · working tree clean at commit.

One catalogued flake seen on the coder's first full e2e run: `cycle-076-news-pull` (BACKLOG-456 — the
homesick pick's `Math.random()` under parallel load). 1/1 green isolated and green on both clean full runs
since. Not a regression; already queued as 456.

---

## Lore track — BACKLOG-364 (the one who knew first) — 13/13 PASS

- [x] `seenZones` records a dino's home zone at spawn, and adds the destination on both arrival seams —
      `taught.test.ts` (`markSeen`/`hasSeen`); e2e `cycle-120-knew-first` tests 1–2 cover spawn seeding and
      the instant seam, and the visible-crossing seam shares the same `markSeen` line in `crossDino`.
- [x] Speaker's memory gains a pride entry naming listener + ground; listener's gains a rumor-marked entry
      naming speaker + ground — `taught.test.ts` "the telling"; e2e test 3 asserts the ticker line.
- [x] The listener's entry carries `RUMOR_MARK` and is not re-shareable — `isShareable(taughtWordLine())`
      is false.
- [x] The pride memory carries no `GROVE_NEWS_TOKEN` / `PLENTY_TOKEN` / `RUMOR_MARK`, so no cascade rung
      can claim it.
- [x] Nothing fires when the listener has already seen everything the speaker has — e2e test 4
      (`__teach('Sunny','Twitch')` → false with both bowl-only).
- [x] Nothing fires between a dino and itself — unit + e2e test 4.
- [x] A second meeting of the same pair with nothing new teaches nothing — e2e test 3 (second `__teach`
      returns false; exactly one ticker line).
- [x] Both dinos gain a small bond; one ticker line names teacher, learner and ground. `TAUGHT_BOND = 2`,
      unit-pinned as strictly below `POND_BOND` (3).
- [x] The book shows the teaching line only for dinos that have taught — `taughtCount` returns null on a
      ring with no pride memories; e2e asserts `showed 1 other the way to The Hollow` in `__bookText`.
- [x] The eight-rung gossip cascade is byte-identical — `teachBeat` is called after `pondSwapBeat`, outside
      the chain; cycle-076/078 and every rung's own spec pass unchanged.
- [x] Save additive: `seenZones` absent → `{}`, then re-seeded from live home zones; no version bump.
      Parser rejects a non-array value (the one line where it differs from the `pioneers` block).
- [x] Dev hooks `__seenZones` / `__teach` exercised by the e2e.
- [x] Deterministic: the ground taught is the first in `zoneChain()` order, not travel order and not a
      coin flip — unit test pins that a speaker who saw the Hollow before the grove still teaches the grove.

**Verdict: PASS.**

---

## Structure track — BACKLOG-474 (the unsettled ground) — 11/11 PASS, 2 findings

- [x] `isUnsettled` true only for 0 residents ∧ no pioneer; false for an inhabited ground and for an
      emptied-but-founded one (that is 460's declining case) — `frontier.test.ts`.
- [x] **Plus a third condition the code found:** false for the emptied *origin* ground. See finding 2.
- [x] With an unsettled neighbour available, the destination is that ground over a richer inhabited one —
      e2e test 2 (`__scarcityDest('Twitch')` from the Fernreach → `hollow` with the grove settled).
- [x] With no unsettled neighbour the destination is byte-identical to the old `richestNeighbor` result —
      cycle-109 and cycle-111 pass on their original assertions once their scenarios close the frontier.
- [x] First arrival in a never-founded ground gets memory + bubble + ticker; the second gets none — e2e
      test 3 (exactly one `settles The Hollow`).
- [x] The settling beat fires on both arrival seams — one `settleZone` gated by `foundZone`'s return,
      called from `crossDino` and `relocate`, so they cannot drift.
- [x] The lens marks an unsettled ground and stops once it has a resident — `cycle-120-unsettled.test.ts`
      + e2e (`__zoneMap` flag before/after).
- [x] Pins in place: prosperity 0 → `quiet`; `isDeclining(0,0)` false; `isDeclining(1,1)` false; every
      `ZONES` id seeded at 0. The e2e also asserts no "gone quiet" line lands on the founding — 464 stays
      silent, as designed.
- [x] The founder is recorded as pioneer by 343 with no new pioneer code — e2e test 3 asserts both the 🚩
      and 🌱 lines from one arrival.
- [x] The out-of-scope half ("first to bank becomes its first provider") needed no code and is now pinned
      by test rather than asserted in prose — `deriveRole` at `PROVIDER_BANKS` reads `provider` for a
      founder alone on a new ground.
- [x] Save additive, no version bump — the pioneer map that backs `isUnsettled` was already persisted.
- [x] `__unsettled()` dev hook.

**Verdict: PASS.**

### Findings (behaviour changes, argued not patched)

1. **The park has always been one inhabited ground and three empty ones.** Written as the item specified,
   `__unsettled()` on a fresh save returns `['grove','fernreach','hollow']`, not `['hollow']`. That is the
   truth — the whole cast spawns in the bowl and nothing before this arc could express it — so the spec
   asserts the truth rather than the assumption. The visible consequence: the chain now fills west→east as
   the herd walks it, which is precisely the behaviour Milestone 10 exists to produce.
2. **The origin ground had to be named explicitly.** 343 records a pioneer at *arrival* and nothing records
   one at spawn, so the bowl has no pioneer and never will. With the cast relocated out of it — as the
   cycle-109/111 specs deliberately arrange — the bowl read as a ground nobody had ever lived on and the
   frontier tier sent migrants *back into it*. `isUnsettled` now takes an explicit `isOrigin`, documented
   as the mirror of 343's construction. An emptied origin is a hollowed ground (460), like any other.
3. **Four shipped e2e assertions amended** (cycle-109 ×1, cycle-111 ×3). Each tests the *appeal* pick,
   which the frontier tier now outranks while the far grounds are unfounded. Each gained a
   `closeFrontier()` helper that walks one dino through the Fernreach and the Hollow before the scenario,
   founding them without moving anyone's final position or changing any zone's appeal. Coverage unchanged;
   this is the same class of amendment cycle 119 made to nine files, and for the same reason — the tests
   encoded an assumption the park had outgrown.

---

## Recommendation

**Both tracks: APPROVED.** Milestone 10's structure spine closes (arc 2 of 2) and its lore arc 2 lands.
