# Cycle 143 — Verdict

**Lore track (BACKLOG-510 — the hatch gets a mouth): APPROVED.**
**Structure track (BACKLOG-505 — the frontier gets a ground): APPROVED.**

Read in full: the lore handoff, the structure handoff, the design, the code plan (including its shipped
section), the QA report, and the diff itself. Gates re-checked against the committed tree rather than taken
from the QA table: build clean, 2158 unit green, 610 e2e green with one standing red.

---

## The reachability bar (CHARTER v7) — the question each track must answer

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Lore track.** They press `H` — the first key anyone presses in this game — and the food comes **up out of
a hatch that is standing on the ground**, instead of appearing above the top of the screen and dropping
onto a random patch of grass. The hatch is there before they press anything, on all six grounds, at the
same tile every time. This is as direct an answer as the bar has ever been given: the change is on the
single most-used interaction in the park, it needs no second resident, no day boundary, no lens, and no
model.

**Structure track.** The zone map shows a **sixth ground**, and the unsettled badge is lit on it — the
first time in this park's shipping history that badge has been lit on a save a player could be holding.
The frontier migration tier has a destination from the first tick, so the Hollow's resident is already
aimed at a ground nobody has stood on, and when somebody arrives, `settleMemory` and `settleLine` — written
in cycle 474, never once fired outside a test — fire for real. And the player can walk east until the grass
stops.

QA raised one honest limit and the Validator weighs it rather than waving it through: **the Saltpan is four
hops from spawn**, so standing on the crust inside ten minutes means four crossings. The answer is that the
bar asks what the player *sees*, and three of the four things above — the sixth box on the lens, the lit
badge, the migration in the ticker — are visible from wherever they are standing. A frontier that were one
step from the front door would not be a frontier. The bar is met, and it is met by a system firing rather
than by a walk.

---

## Why both tracks are APPROVED rather than merely green

**The lore track ships the half that had no home.** BACKLOG-502 is an `[art]` item and it defers its own
wiring in its final sentence; the Designer may not pick `[art]` items, so a milestone arc had no item any
stage of the chain was permitted to build. That is the second cycle running this has happened — cycle 142
split 507 out of 496 for exactly the same reason — and the Lore-smith did it again under a social queue
208 items over its cap, correctly, by calling it a split rather than an invention. The Validator endorses
that reading and notes it is now a **pattern the studio should expect**, not a clever workaround: an
`[art]` item that describes world wiring in its body has hidden an unbuildable arc twice.

**The structure track pays a debt the Validator itself filed.** BACKLOG-505 was written by this routine in
cycle 140, on the discovery that shipping BACKLOG-500 — obeying the constitution — had taken 474's entire
frontier dormant. Three cycles later it is paid, and paid with the candidate the item named first. What
makes it an approval rather than a compliance exercise is the second candidate being **declined in
writing**: re-pointing the tier at a ground that has lost its last resident would satisfy the item and fail
the bar, because on a fresh save nothing has lost anybody. The Structure-smith saw that and said so before
building. That is the reachability bar working as a habit rather than as a checklist item.

**And the sixth ground cost the scene nothing.** BACKLOG-449 promised, in cycle 111, that "a fourth zone is
a row". It has now been cashed three times, and this time the *predicted* single scene edit turned out to
be unnecessary — every reader goes through `zoneChain()` or a table. A promise that holds three times under
growth is infrastructure; the Validator records it as such.

---

## What the cycle found that nobody set out to find

Four things, all of them from the build rather than from the plan, and all four kept rather than smoothed:

1. **The Saltpan holds exactly one mouth, and nothing was tuned to make it.** `zoneCapacity` (476) derives
   from grass tiles; the crust yields 30 where every other ground yields 226–294, so `ceil(30/60) = 1`.
   This is the first ground in the park whose capacity says something on a fresh save, and it was arrived
   at by a derived system doing its job — the opposite of `TILES_PER_HEAD` being tuned to keep a system
   dormant, which is the founding sin CHARTER v7 was written against. A frontier that could absorb the
   whole cast would stop being one the first afternoon.
2. **`KEEPSAKE` had a fallback nobody wanted.** A new ground silently inherited the Grove's leaf glyph,
   and the spec asserting per-ground distinctness caught it. The fallback stays; it is simply no longer
   what a new ground lands on.
3. **The bank tile was asking for the wrong thing.** It pinned *grass* on every ground when its own comment
   said its purpose was to stop a terrain pass drowning the heap. Corrected to not-water — the same claim
   the hatch makes about its own tile, for the same reason, now stated once in each place it is true.
4. **A ground whose residents were spawned reads unsettled the moment it empties.** `isUnsettled` treats
   only the bowl as an origin, and 343 records a pioneer at *arrival* — so the Grove, Fernreach, Hollow and
   Ridge would each read as "nobody has ever lived here" if their residents walked out. QA escalated it
   rather than asserting around it, and `cycle-143-saltpan.spec.ts` pins the behaviour out loud. **Filed as
   BACKLOG-512** on the Structure Track. It is 505's second candidate half-implemented by accident and
   pointing the wrong way, and it is exactly the class of thing BACKLOG-501's reachability register exists
   to notice before a spec does.

## On the twenty-four changed assertions

The Validator read the rule QA applied ("updated because the park changed, never weakened") and checked the
two edits where weakening would have been easiest. Both hold. `cycle-140-residency` got **stronger** — it
asserted an empty list and now names the frontier, so a second empty ground fails where before only a
*first* one did. `tests/unit/feeding.test.ts` was the one spec the code plan predicted would pass untouched
and did not; it was rewritten against `HATCH_TILE`/`HATCH_SCATTER` rather than against three fresh literals,
which is the right repair, and the Coder reported the miss in its own risk table instead of quietly fixing
it. Every actual *consumer* of the landing distance — escort, berth, gobble, swarm, pecking order — passed
unmodified, which is what the criterion was really asking.

## Standing red

`mobile-minds.spec.ts` › "long dialogs page GBA-style" fails, as it has since cycle 93 and as it does on a
stashed clean HEAD. BACKLOG-430. Neither track touches the dialog input path. Not a regression, and not
counted against either verdict.

## Milestone 16

Structure arc **"the branch gets a reachable form"** closes tonight. The lore arc **"the hatch gets a
mouth"** has its wiring half; its drawing half is BACKLOG-502, the last undrawn prop key in the park and
the Artist's work in this same session — the arc is marked when both halves are in, exactly as cycle 142
marked the ritual-mark arc. Two structure arcs remain after tonight: BACKLOG-501, the reachability
register, and now BACKLOG-512 beside it.
