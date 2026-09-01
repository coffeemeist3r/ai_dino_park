# Cycle 147 — Lore Handoff

**Theme:** The park at rest. Milestone 17's second lore arc — *the park at rest has tells you can name* —
is the one where sleep stops being an absence. Cycle 146 gave five dinos two different sets of hours and
the read is already there on frame one: Rex is down at eight in the morning while its four neighbours are
up. What Rex *is* while it is down is nothing. It lies there. This cycle gives being asleep a personality.

**Queue counts.** Social/emergent queue at ~212 open against a cap of 12 — **no new social items seeded**;
this cycle is themed and picked from what is queued. Art queue at **1** (518, held for the third fire
running on an unpicked driver) against a cap of 3 — **one art item seeded**, and per the cycle-145
amendment it is filed with its host named and already shipping rather than left for a later cycle to find
one.

**Added to BACKLOG:**
- BACKLOG-522 [art] The sleeping pose — the five species rigs get a down frame, so a resting dino reads as
  *itself lying down* rather than as its walk cycle stopped mid-stride. Host exists and ships today:
  `isResting` (109) already puts a dino down out in the open at 08:00 on a fresh save, and `refreshSleepMarks`
  already hangs `doze` over it. `SPECIES_ART`'s `PoseFn` is the seam — a second pose per species beside
  `triceratopsPose` etc., selected by the same `walkFrames` path, so no new plumbing and the fallback stays
  the existing standing frame for any species without one.

**Suggested next-up:** **BACKLOG-307 — the sleep murmur, tied to who the dino is.**

Why this one and why now. The murmur exists (BACKLOG-181, cycle 73) and it is memory-shaped: the most
recent thing that happened to a dino comes back as a drowsy fragment. Two things about it are wrong in a
way this cycle can fix, and both were made *worse* by 109 rather than by anything 181 got wrong:

1. **A dino with no memories dozes `💭 …zzz…`, and so does every other dino with no memories.** That is
   the frame-one state of every sleeper in a fresh save — five identical dreams, which is precisely the
   sameness the CHARTER calls a defect rather than a state to accept. 307 asks for the trait tell, and the
   trait tell is exactly what a memoryless sleeper has to offer.
2. **`maybeMurmur` gates on `isHuddling`, and 109 introduced a second, wider way to be asleep.** Huddling
   is a *den* state — it needs the huddle window and standing near the den. Resting is the *sleep* state,
   per-dino, and an owl asleep at eight in the morning out in the open is neither in the window nor near
   the den. So the one dino the park ships asleep on frame one is the one dino that cannot murmur. The
   milestone arc says *a sleeping dino is still recognisably itself*; today the sleeping dino is silent.

That makes this a beat with a fresh-save read, not a night feature: the arc's other half (121, the keeper-
shaped routine) has no ten-minute answer at all and stays queued behind this one.

**Idea Box:** empty (no open entries).
