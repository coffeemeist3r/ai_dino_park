# Cycle 148 — Lore Handoff

**Theme:** The hour gets into the voice. Milestone 17's third and last lore arc, and the one the other two
have been setting up. Cycle 146 gave the cast two different sets of hours; cycle 147 gave a sleeping dino
something of its own to dream. Both are things you *watch*. Neither is a thing a dino ever *says*. Walk up
to any of the ten right now and it will greet you in exactly the same words at five in the morning as at
midnight, on the day it woke early and on the night it never went down. This cycle closes that.

**Queue counts.** Social/emergent queue at ~209 open against a cap of 12 — **no new social items seeded**;
this cycle is themed and picked from what is queued. Art queue at **1** (518, held for a fourth fire on an
unpicked driver) against a cap of 3 — **one art item seeded**, filed with its host named, shipping, and
already proven in the tree, per the cycle-145 amendment.

**Added to BACKLOG:**
- BACKLOG-525 [art] The three that sleep undrawn — cycle 147 gave `PixelRig` an optional `down` pair and
  drew two of the five species; brontosaurus, compsognathus and parasaurolophus still stop mid-stride when
  they rest. The host is not merely named, it shipped last night and its unit test already asserts the
  fallback: `down` is optional and a species without one keeps its standing frame. Every constraint the
  pose has to satisfy is already written down as numbers in `tests/unit/` — topmost painted row below the
  standing frame's, bottom row exactly equal to it, three quarters of the standing mass retained, two
  frames at 1.5fps. **Half the shipping cast sleeps every night and three of them do it standing up.**
  Reachability is not in question: Pip (grove), Thornback (fernreach) and Ember (ridge) are all owls, all
  asleep at 08:00 on a fresh save, and two of those three are the *only* resident of their ground.

**Suggested next-up:** **BACKLOG-110 — hour-aware greeting**, taking **BACKLOG-279** with it as its second
clause rather than as a separate cycle.

Why this one, why now, and why the two together. The milestone arc is one sentence with two halves — *a
dino's first line of the day knows what time it is **and whether it has been up for it***. 110 is the first
half and 279 is the second, and they are one greeting, not two.

And there is a finding under it that makes this more than a flavour beat, which the Designer should trace
before writing criteria (the discipline that has now paid for itself twice running):

**`NPCContext.timeOfDay` already exists, is already set on every greet, and the deterministic voice has
never once read it.** It is set in three places in `WorldScene.ts`, all `dayPhase(now.hour)`, and it is
consumed in exactly one: `webllmBrain.ts`, as `It is ${ctx.timeOfDay}.` in the prompt preamble.
`cannedReply` — the stub brain, and the WebLLM brain's own fallback while it loads or errors — composes
gratitude, wistfulness, fondness, hunger, the chase, the provider, the season, the ground's policy and the
last contested drop, and does not know what hour it is.

That is the CHARTER's enrichment rule pointing the wrong way. The line says the model is enrichment on top
and the deterministic rules are the floor; here the hour is *only* on top. A player who declines the model
download — the default, and on this operator's own phone the observed choice — has a park where ten dinos
have had chronotypes for two cycles and not one of them can tell you it is up late. The floor never
learned the fact the roof was given.

The second half is the one that makes it a *character* beat rather than a clock read, and 109 is what
makes it possible: the hour alone says the same thing to all ten. **Whether a dino has been up for it**
does not — at 08:00 on a fresh save four dinos in the Bowl are three hours into a day that started at
five, and Rex is five hours from the end of a sleep that started at five. Same hour. Opposite standing.
That is the read, and it should key off the dino's own `restWindow`, not off a new threshold: a park that
picks a magic hour count here has learned nothing from the corollary under the reachability bar.

**Idea Box:** empty (no open entries).
