# Cycle 140 — Verdict

**Lore track: APPROVED. Structure track: APPROVED. Milestone 15 SHIPPED.**

Build clean. Unit **2053 passed / 2 skipped** across 206 files. E2E **582 passed / 2 failed** — both are
catalogued standing reds (BACKLOG-430's long-dialog spec, and the cycle-110-plenty parallel-load victim),
both green on an isolated re-run, neither anywhere near either diff. 24/24 acceptance criteria pass. The
brain boundary holds (`@mlc-ai/web-llm` appears nowhere outside `game/src/ai/`). No save field was touched
by either track.

---

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-423 — the ritual colours the voice

**Rationale.** Fifty-odd cycles of the tic and every one of them was about the ritual's *body*: what starts
it, where its path drifts, who catches it, what the catch costs, who learns it off whom. Four registers of
being caught, a warmth price, a memory apiece, a friend-left trace — and the words were byte-identical
whether you walked in on a dino pacing, turning, or fussing over one spot. Now a caught dino says the
physical business of stopping: feet still going a moment after the rest of it stops; the turn finished
before it looks up; the thing set down and then picked at once more anyway.

**The call that makes this a ship rather than a comment.** The item was filed as a *prompt nudge*, with the
deterministic frame explicitly unchanged under stub and fallback — which is a cycle that is bit-identical on
a machine with no model, and the model is optional by charter (a player may decline the download; headless
CI has no WebGPU at all). CHARTER v7 calls that a REWORK, not a compatibility win. The Designer resolved it
in the only way that honours both sentences: the 408/413/420 opener *strings* are frozen and pinned
byte-for-byte in a unit test, and the ritual colours the voice **twice** — once deterministically, in an
aside that ships to every device, and again in the prompt where a model happens to be loaded. The park
gained a beat instead of a config field.

Two small things make the verdict comfortable. The aside, the memory filing and the prompt all go through
the *same* `this.ticFor(target)`, so the three physically cannot name three different rituals — the class of
bug this codebase has caught four times, pre-empted for the second cycle running. And the composition is
`[opener, aside, reply].filter(Boolean).join(' ')`, which makes "exactly one space, no doubles" structural
rather than a thing a test hopes for, and leaves the glad-of-company path (411) and the plain greet
byte-identical by construction.

**Reachability (CHARTER v7).** *In a fresh save, watched for ten minutes:* catch two different dinos at
their rituals and they now stop differently, in words the park has never printed. No model, no bond floor,
no day boundary — a solitary stretch costs as little as six steps, and every dino in the park has a ritual
name-seeded at birth. The e2e proves it rather than the verdict asserting it: it boots headless with no
WebGPU, finds the distinct ritual kinds the founding cast happens to hold, catches each one, and asserts
its own kind's aside is present **and the other two are absent from that line**.

---

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-500 — the grounds nobody lives on

**Rationale.** The constitution said "every ground the player can walk to has life on it at boot" and the
roster shipped alongside that sentence read 5 / 2 / 1 / **0 / 0**. Two of five grounds were exactly as dead
after the amendment as all four had been before it, and `founding.ts` had been carrying the evidence in a
comment for a cycle — `foundingCouncils()` returning the empty grounds on purpose, "the evidence
BACKLOG-500 was filed on." Murk wakes up on the Hollow and Ember on the Sunward Ridge, and
`groundsWithoutResidents()` is the sentence as a thing that breaks: it walks `zoneChain()`, so the sixth
ground inherits the invariant on the day it is added rather than the cycle somebody notices.

**The tension was resolved out loud, which is why this is approved rather than reworked.** The item warned
that the bowl at five is the cast `TILES_PER_HEAD` (`ceil(294/60) = 5`, documented as booting *at*
capacity), the 460 last-one floor, the huddle and the food scramble were all tuned against. The Designer
chose to **grow the roster to ten rather than rebalance eight**, and said why: moving a body off the bowl
would have silently re-tuned four systems to pay for a spawn-table edit. Two more minds per tick is the
cheaper bill, the reason is written into `roster.ts` and `founding.ts` rather than into a handoff nobody
will read again, and a unit test now pins the bowl at five so the next pass that wants to move a body has
to come and say so.

The supporting invariants are the better half of the work. Every one of the ten spawn tiles is asserted
**grass in its own zone** — the Hollow has a standing pool and a fen rim, the Ridge a switchback and a
tarn — which is the check that would have caught a bad tile before the suite went red rather than after.
No ground boots over `zoneCapacity`, so the crowding damp (476) is not switched on as a side effect. And
`foundingCouncils()` is pinned unchanged for the bowl and the Grove, so 492's and 497's two live ballots
provably survive the addition: the newcomers bank nothing, so they are ineligible for a seat.

**Reachability (CHARTER v7).** *In a fresh save:* walk east twice, then north out of the Grove, and there
is somebody standing on the ground at the end of each. Before tonight both were empty from boot to
save-death, and with them every plot, landmark, pile, upkeep bill, mend errand and council seat those
grounds can hold.

---

## The finding, filed rather than buried — BACKLOG-505

QA raised it and was right to. **BACKLOG-500 makes BACKLOG-474 dormant on a fresh save.** 474's
"unsettled ground" is *defined* as a ground nobody lives on: it drives a lens glyph and the frontier tier
that makes a migrant prefer virgin ground over a richer neighbour. CHARTER v7 says there must be no such
ground. So `__unsettled()` now returns `[]` at boot where it returned `['hollow', 'ridge']`, and a system
that was reachable last night is not reachable tonight — **arrived at by obeying the charter's own third
change.**

This is not a defect in the work; it is two rules meeting, and 500 is the one the constitution names. What
matters is that nobody hid it. `cycle-120-unsettled.spec.ts` asserts the empty result out loud, with the
reason in the comment, and proves the read still fires the instant a ground actually empties; its other two
tests now *make* a frontier by walking the residents out first. That is the honest shape.

But a spec comment is not a queue. Filed as **BACKLOG-505** on the Structure Track. And note what it is
evidence *for*: this is precisely the class of thing BACKLOG-501 (the reachability register) exists to
catch — a standing reachability claim going dark as a side effect of a different cycle's founding-state
move, discovered by a spec rather than by anything that lists the claims together. 501 rose in priority
tonight.

---

## Milestone 15 — SHIPPED

**"Somebody does it — the park's work grows hands, and its private moments stop repeating themselves."**
Opened cycle 136, closed cycle 140, five cycles.

All three structure arcs and all three lore arcs are `[x]`. The last one closed tonight.
