# Cycle 146 — Verdict

**Lore track (BACKLOG-109 — diurnal vs. nocturnal temperament): APPROVED.**
**Structure track (BACKLOG-509 — the tithe): APPROVED.**

Read in full: both smith handoffs, the design including its mid-fire amendment, the code plan and its
shipped section, the QA report, and the diff across all 23 files. Gates re-run against the committed tree
rather than taken from QA: build clean, **2310 unit green** across 224 files, **633 e2e green** with two
reds — the standing `mobile-minds` (BACKLOG-515) and `cycle-038-scan`, green 5/5 isolated and wearing
515's second signature. `reworkCount` is empty for both items; neither has been attempted before.

Milestone 17 opened this cycle and both of its first two arcs are now marked.

---

## The reachability bar (CHARTER v7)

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Lore track.** Open the game. **Rex — the first dino in the roster, in the ground the save opens on — is
asleep at eight in the morning**, a 💤 over it, not moving, while Mossback, Sunny, Twitch and Glade are up
and about. That is frame one, with no walk, no wait, no lens and no model. Stay twelve real minutes and the
park inverts: Rex is the only thing moving, under a 👁, while the four that were up are down.

**Structure track.** Open the zone map on the first frame and every ground the player can walk to now says
what its skyline is waiting on, and names where it comes from:

```
bowl       short 🪵3 🪨2 🌑1◂The Sunward Ridge
grove      short 🪵6 🪨2 🌑1◂The Sunward Ridge
fernreach  short 🌾4 🌑1◂The Sunward Ridge
hollow     short 🪵3 🪨2 🌑1◂The Sunward Ridge
```

Both bars are met by things on the opening frame. Recorded.

---

## The lore track, and the eight cycles nobody spent

BACKLOG-109 was queued at cycle 28 and passed over ninety-odd times, and the reason was honest every time:
with a 24-real-hour in-game day, a feature about night was a feature nobody could stay awake for.
**BACKLOG-493 retired that objection at cycle 137** — the park has had a 24-minute day for eight cycles —
and nobody went back for the item it unblocked. That is the shape of the miss CHARTER v7 was written about,
one layer up: not a system tuned to be dormant, but a *reachability that was won and never spent*.

What ships is small and reads immediately. A dino's chronotype is derived from traits it already carries —
`curiosity * 0.65 + calm * 0.35`, bar at 0.5 — and it selects **which window that dino rests in**, never
whether it rests. A day-dino's window is exactly `SEASON_HUDDLE`'s, so day-dinos behave as they always
have; an owl's is that window shifted eight hours. Total sleep is unchanged, the season table still shapes
both halves of the cast, and the whole thing is deterministic, model-free and written nowhere in the save.

Two things about it are better than they had to be.

**The derivation was constrained by the bar rather than chosen and then checked against it.** A fresh save
opens at 08:00 and nightfall is twelve real minutes away — outside the ten-minute window the bar is
measured in. So the Designer wrote the constraint into the spec before any code existed: *the split must
read at 08:00, in the Bowl, on frame one*, which means the rule has to put an owl among the Bowl's five.
The obvious rule — `curiosity > energy` — was rejected on a number: it puts Mossback within **0.001** of
the line, a coin flip that any future trait tweak would toss. The shipped weights clear the bar by ~0.05 on
both sides for all ten roster names, and **a unit test asserts a Bowl owl over the live roster** rather
than over a literal, so a future cycle that reorders the cast fails the test instead of quietly shipping a
dormant feature.

**The eight-hour shift, not twelve.** A clean twelve would make an owl's day the photographic negative of a
day-dino's, and the two halves of the cast would never be awake together — a park running two shifts, not a
park with night-owls in it. At eight the windows overlap at both ends, and a test pins that the overlap is
non-empty.

The one judgement call the Coder made that the plan did not anticipate is right: **the cold-night system
(179) still reads the *park's* night, not any dino's own window.** A cold night is a fact about the
weather, not about who chose to sleep through it. The owls are out in the same cold.

---

## The structure track, and the design that caught itself

BACKLOG-509 could have been a one-line change, and for about an hour it was going to be. `structureRecipe`
gains a shard for every ground but the Ridge; four carry systems read that function as their deficit
driver; therefore, the argument went, folding obsidian in makes it a shortfall everywhere and somebody
climbs. Every word of that is plausible and the conclusion is false, and **the Designer found it by tracing
the mechanism before writing the acceptance criteria rather than after.**

Two reasons it is false, both in the code and neither in the item's own text:

- `directedCarry` only ever proposes a kind the **source** ground actually holds. Only the Ridge holds
  obsidian. So the tithe makes the shard a deficit everywhere and a *carry* only where somebody is already
  coming down off the Ridge — which is a delivery, not a climb.
- The climb already exists. `quarryDest` shipped at cycle 503, and it sits at the **bottom** of
  `scarcityDestOf`, under the unsettled-frontier pull and under any better-off neighbour. The Saltpan is
  unsettled on every fresh save, so the frontier tier wins and the errand is what happens when nothing else
  is pulling. 503 put it there on purpose, having measured that promoting it unconditionally "made every
  migration an errand and took the scarcity system dormant."

So the honest version of this item is three pieces, and the design amended itself to carry all three. The
recipe change. **The shortfall made visible** — the ground says what it is waiting on, which is the floor
that cannot fail to be reachable. And **the errand promoted above the appeal read only when the shard is
the sole remaining shortfall**, which is narrow enough that a ground short of two kinds still migrates on
appeal exactly as it did, so 503's finding survives intact and the two rules coexist rather than one
overwriting the other.

That correction — written into the handoff mid-fire, with the reasoning and the rejected version both left
on the page — is the best procedural moment of the cycle. It is what the reachability bar is supposed to
produce: not a track that passes, but a track that would have failed and was caught by somebody asking how
the player was actually going to see it.

---

## The finding: a constant that went false in silence

This is the part worth reading twice.

`WORK_BUILD_FLOOR = 6` has sat in `governance.ts` since cycle 121, under a comment saying it was set
*"above the cairn recipe and below the granary's, so a gather-first ground visibly banks a while and still
builds."* The tithe raised a cairn from 5 to 6. From that moment **no affordable pile could be under the
floor**, so a gather-first ground never deferred anything again, and the entire "stores before walls"
policy — a governance choice the player can make, with a lens glyph and a persisted setting — became
**unreachable**.

Nothing failed. The build was clean, 2310 unit tests were green, and the comment above the number went on
describing a relationship that had stopped being true. The only thing that noticed was an e2e spec that
happened to *use* the deferral, and it surfaced as a confusing off-by-one about cairn counts.

That is BACKLOG-519's class exactly — a claim written down twice, going stale in one of the two places —
with teeth this time, because the second copy was load-bearing behaviour rather than a test's arithmetic.
The repair is the right one: `WORK_BUILD_FLOOR` is now **derived from `structureRecipe()`'s own total**, so
the comment and the number cannot disagree again. And the way it was found is exactly what CHARTER v7 asks
for more of: *move a founding constant and see what falls over.* Two cycles running, that has been the only
thing to reveal what the park was actually asserting.

**Filed as BACKLOG-521** so the class gets swept rather than fixed once — see below.

---

## The spec repairs — nine, and what they say

Every one made an assumption explicit rather than weakening an assertion, which is the standard 495 asks
for. Three unit repairs were mechanical (identity `toBe` against a base recipe that is now composed). Three
of the six e2e repairs are worth naming:

**`cycle-142-obsidian`** is the one that mattered. Its "a neighbour genuinely better off still outranks the
errand" case carried a Grove pile of `{branch:6, stone:6}` — which, after the tithe, is *short only the
shard*, so it would have silently started exercising 509's new promotion instead of 503's ordering. The
pile is now short of two kinds, so the spec still tests what it was written to test, and **a new case was
added that tests the promotion itself from both sides.** A spec that quietly changes what it covers is
worse than one that breaks.

**`cycle-047-warmth` and `cycle-125-lean`** both drove a dino across the ground and both were standing at
08:00 — which is now inside the owls' rest window. They now name their hour (`__setClock(_, 16, 0)`, the
one stretch every chronotype is awake in every season) and say why. That is **BACKLOG-495's argument about
founding state, applied to time**, and it is the shape 515 already proposed for its own fix.

And `cycle-047`'s meal test stopped depending on **who wins a seeded scramble**. A sleeping dino consumes
no wander rolls, so this cycle shifted the shared seeded stream and the race landed on a different dino.
The spec's actual claim was always "the dino that eats is mended", not "this dino wins", so it now names
its eater through the deterministic `__eat` hook that cycle 375 added for exactly this purpose. One more
entry in BACKLOG-456's catalogue, and a reminder that a spec resolving a race by seed is a spec that any
change to *how often anything rolls* can move.

---

## Housekeeping and the state of the queues

- **BACKLOG-109** closed. **BACKLOG-509** closed. **BACKLOG-519** closed (taken as the rider it was filed
  as — `MINUTES_PER_DAY` exported, the register's second copy of the length of a day gone; `SESSION_MINUTES`
  deliberately left where it is, since what *watchable* means is the register's fact and not the clock's).
- **BACKLOG-521 filed** — the constant that describes a relationship it no longer has. 519 and this cycle's
  `WORK_BUILD_FLOOR` are two instances a week apart, and the second one changed behaviour. Sweep the rest.
- Structure Track drops to **2 open** (495, 515) — **below the cap of X=4 for the first time in six
  cycles**, so the next Structure-smith brainstorms rather than drains. 521 refills it to 3.
- Art queue at **2** (518 still held for want of a driver, 520 seeded this morning **with its host named
  and shipping the same night** — the cycle-145 amendment working as intended on its first use).
- Milestone 17: two of six arcs marked after one cycle.

## A note for the next Structure-smith

**495 is now the top of a queue with room in it, and it has been passed over twice.** Both times for the
same honest reason — its own text scopes it across ~550 specs, which is not one Coder fire. But this cycle
paid its argument in instalments *nine more times*, and two of those instalments were about **time** rather
than founding state, which is a use 495 did not anticipate and 515 independently arrived at. The item is
getting more expensive to defer, not less. It wants a cycle where it is the only thing in flight.
