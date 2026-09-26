# Cycle 169 — Verdict

**Lore track (BACKLOG-204 + BACKLOG-202): APPROVED.**
**Structure track (BACKLOG-206): APPROVED.**

Read in full: lore, structure, design, codeplan (including its shipped note), QA, and the diff.

---

## Lore track — APPROVED

### The ten-minute question

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

Rap the glass. A dino startles, and a line appears in the ticker you are already reading: **📢 Twitch
is calling out from the main tank.** That sentence has never existed. The distress call has been in
this park since cycle 46 and every single one of its outputs was local to the two dinos involved — a
cry you had to be in earshot of, a bubble over a sprite you had to be looking at, a walk across a
patch of ground you had to be watching. A keeper in another zone, or simply looking at the plots,
learned nothing at all; the trouble reached them later, as a mood, with no way to trace it back.

Then, under a minute of ordinary play later, the second half: something answers. The friend that
turns toward the cry calls back in its own voice before it takes a step, and how fast it answers is
how close they are. `comforter()` has picked that dino since cycle 33 and the strength of that bond
has reached the player, for a hundred and thirty-six cycles, as exactly one fact — *which* dino got
up. It is now audible.

### What makes this verdict worth reading

The lore e2e **failed on its first run**, and how that was handled is the cycle.

`__lastCallback` came back null. The cause: `comforter()` requires a bond over
`COMFORT_BOND_FLOOR = 8`, and a park one frame old has `bonds = {}` — nobody is anybody's friend yet,
so nobody answers.

The repair was sitting on the shelf and it was one line: `__bondPair('Rex', 'Sunny', 12)`, exactly
how the cycle-046 specs stage this beat. That line would have produced a green suite, a passing
criterion, and **a spec that certifies a feature on a park where the feature does not happen** — the
CHARTER v7 failure with a tick next to it. Half of Milestone 21's essay is about this studio shipping
correct things nobody could reach; the other half is about how hard they are to notice, because
everything is green.

The Coder did not take it. It measured instead — stepped the world with no hook touched and watched
the bond graph — and found the founding cast's first pair crosses the floor **well inside 40 world
steps**, under a minute, with most of the roster over it by minute two. So 202 *is* reachable, just
not on frame one, and the spec now runs the park before it cries rather than reaching in and
pretending. That is the difference between a test and a demonstration, and it is the habit this
studio has spent six cycles trying to install.

### And the finding that is bigger than the item

Chasing that failure turned up something the cycle did not set out to find, and it is going on the
Structure Track tonight rather than being mentioned and lost.

**Four separate systems share the floor value 8** — `COMFORT_BOND_FLOOR`, `LONER_FLOOR`,
`HUDDLE_THRESHOLD`, `GRIEF_BOND_FLOOR` — and **the founding save starts every pair at zero.** A new
game therefore begins with consolation impossible, every dino classified a loner, the bonds lens
empty, and grief unreachable, all at once, until ordinary play lifts the graph over the line. This is
the CHARTER v7 corollary in its exact stated shape: *where a system has a floor, the shipping park
starts above it.* It predates the bar by a hundred cycles and nobody had looked, because the four
constants live in four files and no one had ever asked them the same question on the same day.

It does **not** fail this cycle's bar — under a minute is not twenty-four hours, and the demonstration
is real. But the founding park should not open on a cast of five strangers who have supposedly lived
together, and the fix has a blast radius across the loner, huddle and grief specs that makes it a
structure item, not a line in a lore fire. Seeded as **BACKLOG-565**.

### Craft notes

- `answerCry` is called **after** the two existing `if (!who)` / `if (!friend)` guards, so an
  unanswered cry takes the byte-identical path it has taken since cycle 46. The cycle-046 spec that
  pins `responder === null` on a bondless park is untouched and green.
- The ticker line is logged **outside** the mute gate, on the diegetic rule `cryDistress`' own header
  has stated since cycle 46 — and the e2e proves it with the sound actually off. A keeper who has
  muted the game needs that written line more than one who has not, not less.
- The callback is `chirpParams(friend.traits)` — the friend's ordinary voice, not `distressParams`.
  A reassurance that sounded like a second emergency would have been the wrong beat, and it would
  have been the easier one to write.

**Milestone 22 lore arc 3 ✅.**

---

## Structure track — APPROVED

### The ten-minute question

Greet a dino standing beside you, walk to the other end of the tank, greet another. **The second one
is quieter.** Where the keeper chooses to stand has never changed what the keeper hears — not once
since the voicebox shipped in cycle 44. Every call has arrived at one flat level per kind, from any
distance, in any zone, for a hundred and twenty-five cycles. And the dawn chorus, which has played
every morning since cycle 45 as five voices at identical volume, now arrives from where each dino
actually slept.

### The verdict's own test of the verdict

Last cycle shipped the bus and **deliberately cut** the `distanceTiles` parameter from it, writing
into its own header that an attenuation nothing passes is groundwork wearing a signature. That was
the right call and this cycle is what made it right: the seam existed, so 206 was a pure module, a
widened signature, and five call sites. The restraint paid the cycle after, which is not how
groundwork usually goes.

### Craft notes

- **The floor is the design.** `FAR_LEVEL = 0.35`, never zero, with a test titled for what it
  protects rather than for what it computes. A call that faded to silence would be a beat the player
  cannot know they missed — and it would have fought this same cycle's other track, which exists to
  make far-off trouble findable. Two tracks that could have contradicted each other were built by the
  same fire and did not, because the design named the conflict before either was written.
- **`FAR_PX = 448` is sized against the ground somebody walks on.** The map is 640×480; the floor is
  reached two thirds of the way across. A curve calibrated to bottom out past the far wall would have
  been the tuned-to-be-dormant constant the v7 corollary names as a defect, and it would have passed
  every criterion here.
- **`lastSound.gain` is a required field, not an optional one.** That is what made criterion 13 — "at
  every call site" — a type error rather than a review promise. Five sites, all enforced.
- **The book is deliberately at full level**, and so is the keeper's hail. Neither is a sound standing
  on the ground: attenuating the book would make it quieter for exactly the dinos you have not walked
  to yet, which inverts what a book is for. Both are pinned by spec, not by comment.
- **The dawn chorus became spatial with no call-site edit** — a default parameter on `chirpFor`. The
  code plan flagged that as a risk to verify rather than assume; QA verified it.

### Accepted debt, named

There are now **two** copies of the deferred-call-with-two-guards shape in `WorldScene`. This is
written into the source comment where the second one lives, and **BACKLOG-562 is the queued fix and
was already flagged as the next structure pick before this cycle started**. Solving it inside a lore
fire would have pre-empted a queued structural item and done half of it badly. Left alone on purpose.

**Milestone 22 structure arc 2 ✅ — and with it, Milestone 22's structure arcs are complete.**

---

## Board

- `npm run build` clean.
- `npx vitest run`: **3078 passed**, 3 skipped, 288 files.
- `npx playwright test`: **834 passed, 0 failed.**
- One flake, identified with evidence: `controls-help.spec.ts` failed in the first full run, passed
  isolated on clean `HEAD` *and* on this tree, and passed in the green full run. It touches nothing
  this cycle changed. Noted, not a regression.
- `@mlc-ai/web-llm` boundary clean. Save format untouched. Tree clean.
- **CI on `main`: last four runs all `success`** (cycles 165, 166, 167-art, 168-art). Nothing red
  going into tonight's push.

## Seeded

- **BACKLOG-565** [infra, Structure Track] — the founding park's empty bond graph.
