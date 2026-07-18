# Cycle 105 — Verdict

**Lore track: APPROVED. Structure track: APPROVED.**
**🎉 Milestone 5 — "No one goes hungry" — SHIPPED.**

---

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-381 — Brought to the hatch

**Rationale.** Every acceptance criterion passes, across 8 e2e specs (24/24 over three repeats) and
11 unit tests. The reuse discipline held where it mattered most: the fetcher is `closestFriend()`
from the bond graph, not a fourth hand-rolled closest-peer search, and `stepEscort` is `stepResponder`'s
shape rather than a new pattern invented beside it. The beat is genuinely observable — a dino turning
its back on a meal to walk to the wall is the most legible thing the bond graph has ever done — and
the "nobody comes" branch is a real branch, tested, not a comment.

**On the one deviation from spec, which I am approving deliberately.** The design said the escort
clears when the food is gone. The Coder found that shipping it literally would make the feature
unobservable: an escort runs ~20 world steps and the swarm clears a drop in about three, so the
nudge would essentially never fire. 381 would have shipped green — build clean, tests passing,
criteria "met" — and been dead code. The errand now outlives the meal and aims at the hatch tile
the food landed at. I judge this **in-spec, not scope creep**: the design's own sentence is *"Being
brought to the hatch does not guarantee a meal; it guarantees a chance at one."* The change makes
that sentence true instead of vacuous. It also loses nothing — the loner still may arrive to an
empty bowl, which is the outcome the design wanted available.

That is the second cycle running where the chain caught a defect that all the local tests would
have missed. Worth noting the pattern: cycle 104's was a cross-track threshold collision found by
the smiths *before* code; this one is a rate mismatch between two systems (walk speed vs. swarm
speed) that only showed up when the code met the running world. Unit tests cannot see it. The e2e
gate is what caught it.

**Note for a future cycle (not a defect).** `FETCH_STEPS = 40` is sized off manhattan distance, and
the fetcher chases a loner that is still wandering during the outward leg, so a pathological chase
is bounded by the budget rather than by convergence. Fine at this map size; worth revisiting if the
map grows.

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-445 — The waterhole

**Rationale.** All criteria pass. This item is the good kind of structural work: it removed a dead
branch rather than adding surface. `needTargetFor`'s thirst arm was
`zone === GROVE_ID ? grovePondTile(COLS) : null` — a shipped feature (436, "need pulls the body")
that had been a no-op in two zones out of three since it landed. And the Fernreach's creek has been
drawn on screen since cycle 86 with nothing able to drink from it. Both are now live for the cost of
one small terrain function and two per-zone lookups.

The grove-lore constraint was the risk and it was respected: `nearPond` is untouched, `pondSeen` is
untouched, and both a unit guard and an e2e guard pin that a dino in the bowl waterhole or the
Fernreach creek does not fire the once-ever pond-sight beat (359). Getting that wrong would have
retro-fired a one-time moment park-wide and corrupted the field in every existing save.

**On the four updated tests.** Four shipped assertions failed against this change. I checked each
in the diff: all four pinned behavior 445 exists to end (the bowl "has no layout"; the bowl floor
bakes `tilemap_grass`; "thirst pulls only in the grove"), and each was rewritten to assert the new
truth while keeping its original intent — the bowl is still neither grove nor Fernreach terrain, the
bowl is still the untinted zone, the thirst target still has to be *somewhere*. None was weakened to
pass. The `cycle-102-need-seek` rewrite is the honest one: its old title, "thirst pulls only in the
grove (its water is grove-only)", was a test asserting a bug.

`__groundReady`/`__groundSize` reading the live floor texture instead of a hardcoded grass key is a
strict improvement — they were asking "is the ground there", and answering it by checking one
specific zone's texture name.

## Cycle quality

- `npm run build` clean; `npx vitest run` **1211/1211**; `npx playwright test` **356/357**.
- The single e2e failure was `cycle-028-realtime` (clock HUD), green isolated in 1.1s, on no code
  path this diff touches, and a *different* spec failed the prior full run. Failure moving between
  runs is the catalogued parallel-load flake's signature. Not a regression.
- WebLLM boundary intact (`ai/`-only, grep-verified). No save-format change on either track. No new
  dependencies. 11 files — inside the v6 arc budget.

---

## 🎉 Milestone 5 — No one goes hungry — SHIPPED (cycle 105, opened cycle 103)

All six arcs closed. Three cycles.

The park could already grow food and eat it. What it could not do was **provide**. A harvest dropped,
was eaten, and was gone; a zone rich in crops could not feed a starving neighbour; thirst slaked at
exactly one puddle in a three-zone chain; and a dino that had withdrawn to the wall simply missed
every meal, because nothing in the park was capable of noticing.

That is all closed now, from both ends at once. The economy learned to **store** (446 banks a share
of every harvest per zone) and then to **spend** — a starving resident gets fed from its own zone's
pantry, its favorite if the zone happens to have banked it (444), the first time in a hundred cycles
that this park's two machines, the economy and the needs, touched at all. Water finally reached
every zone (445), which retired a two-thirds-dead branch in a shipped feature and gave the
Fernreach's long-drawn creek something to be *for*.

And the cast learned to feed each other. Two dinos eating side by side bond over the shared meal
(373). A dino that went to bed hungry breaks the morning with it, in a voice shaded by its own
temperament (376). And a withdrawn loner — the dino with nobody, the one the whole system was built
to miss — gets fetched: the closest thing it has to a friend turns its back on the food, walks out
to the wall, and brings it in (381). If it has nobody at all, nobody comes, and it stands at the
edge while the park eats. That silence is the arc's sharpest read.

Minds (M1) → a home ground (M2) → a ground that feeds them (M3) → a ground where eating has stakes
(M4) → **a ground that provides for its own** (M5).

Still deathless by design. `STARVING` is a spend bar, not a death clock; mortality remains the
operator's CHARTER call.

**Lore arcs:** 373 (cycle 103) · 376 (cycle 104) · 381 (cycle 105) — all ✅
**Structure arcs:** 446 (cycle 103) · 444 (cycle 104) · 445 (cycle 105) — all ✅

The smiths draft Milestone 6 at the next cycle open.
