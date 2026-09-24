# Cycle 167 — Lore Handoff

**Theme:** The park gets a voice you can read. Milestone 21 spent four cycles teaching the bowl
*which* watcher is standing there; Milestone 22 turns the answer outward and makes it audible. The
voicebox has existed since cycle 44 and every dino in the cast has a distinct call derived from its
own traits — and the park uses it for exactly two things: a flat chirp when you greet, and a yelp
when something startles. Nothing about *how* a dino answers you has ever depended on whether it
likes you. This cycle changes that, and the milestone behind it says the rest.

**Milestone duty:** No milestone was ACTIVE (21 shipped at cycle 166). **Milestone 22 drafted** in
`studio/MILESTONE.md` — headline + four lore arcs below; the Structure-smith adds the spine arcs.

**Cap rule:**
- Social/emergent queue: **~186 open against a cap of 12** → no new social items seeded. Themed the
  cycle and suggested a next-up from what is already queued, per the routine.
- Art queue: **1 open (539), below the cap of 3** → the routine says seed 1–2. **Declined this
  cycle, with the reason recorded.** 539 has been host-blocked for nine cycles and two corrections,
  and tonight's structure track is the item that unblocks it. Seeding a second `[art]` item before
  the Artist has actually drawn on the host we are shipping tonight is precisely how this queue
  accumulated blocked seeds in the first place — three of them, each "unblocked" by a routine that
  had not checked. If the Artist draws 539 tonight, the queue empties honestly and the next
  Lore-smith seeds against a queue whose depth means something.

**Idea Box:** empty (no open entries).

**Added to BACKLOG:** none (both queues declined on their own cap rules, above).

**Suggested next-up:** **BACKLOG-193 — Call and answer.** Greeting a dino gets an answering chirp
whose latency and eagerness scale with hearts, so you can *hear* how much a dino likes you before
you read it. It is the first arc of Milestone 22, it needs no clock boundary and no population
floor — you can reach it in a fresh save by walking up to a dino and pressing a key — and it is the
smallest thing that makes the voicebox mean something. The chirp is currently the same flat call at
zero hearts and at ten; that flatness is the defect.

**Note for the Structure-smith (structural, not mine to queue):** `audio/voice.ts` builds a fresh
`oscillator → gain → destination` chain per call, so there is no single point where a call's loudness
is decided. Three queued items need one — 206 (distance attenuation), 204 (the keeper hears trouble)
and 202 (the friend answers across the bowl) all want "this call, but quieter / ducked / from over
there", and today each would have to reach into the synth. That is a spine, not a beat.
