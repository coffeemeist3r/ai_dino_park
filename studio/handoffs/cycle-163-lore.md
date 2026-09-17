# Cycle 163 — Lore Handoff

**Theme:** Milestone 20 asked what the keeper *does*. Milestone 21 asks who the keeper *is* — and the
honest finding that opens it is that the park cannot tell. The roster has been selectable since cycle 37;
`keeperAddress` (276/278) lets a fond dino say your designation; and there is exactly **one** keeper-aware
line in the whole game — `fondGreeting` in `ai/brain.ts:178` — which fires only above ten hearts and is
byte-identical for Aki, Vix and Lux. Four keeper items deep, picking an observer changes the affinity
arithmetic and nothing a player can hear. This cycle starts making the choice audible.

**Milestone 21 drafted:** *"The park can tell which watcher is standing there — and says something
different because of it."* Four lore arcs (160 / 156 / 157 / 162); the Structure-smith adds the spine arcs
in its fire.

## Cap rule

- **Social/emergent queue: ~195 open, far above the cap of 12.** No new social items seeded. Theme the
  cycle and suggest a next-up from what is already queued, exactly as the routine requires.
- **Art queue: 2 open (543, 539), below the cap of 3.** One seeded.

**Added to BACKLOG:**
- BACKLOG-554 [art] The fourth watcher, in pixels — a 16x20 keeper rig for the non-robot archetype
  BACKLOG-212 adds, through the live `renderKeeperAvatar` host the 158 pipeline has carried since cycle
  047-art.

**Why this art seed and not another mark.** The two art items already queued (543 the sulk, 539 the
day-count) are both host-blocked, and both have been blocked for six cycles for the same reason: the thing
they want to hang on is a `Text` that never goes through `makeHourMark`. Seeding a third of those would
have been seeding a third no-op. 554 is the opposite case — its host is `renderKeeperAvatar`, it is 116
cycles old, it already swaps a baked sprite in on a `K`-pick or a save restore, and it has done so three
times. The only thing it lacks is a fourth id, and the structure track is about to hand it one **in this
same session**. The two conditions are written into the item: it ships only after 212's roster entry
exists, and the rectangle-fallback control gets re-pointed before the bake rather than assumed, which is
the check cycles 045/046/047 each had to make.

**Suggested next-up (lore track): BACKLOG-160 — Dinos address the observer.**

Two notes for the Designer, both from reading the code rather than the backlog text.

**First, half of 160 is already shipped and the remaining half is the interesting half.** The item says a
dino "may name you *and* shade its line by which watcher you are". The naming landed as 276/278 —
`keeperAddress` escalates designation → nickname at `NICKNAME_MIN = 10` hearts and `WorldScene` already
feeds it into the greet context at two call sites. What is unbuilt is the shading, and the shape it should
take is a **deterministic per-observer line register**, pure and Node-testable, that the canned path reads
and the WebLLM path takes as colour — the same split `tones.ts` uses. The LLM must not be required for it:
headless CI has no WebGPU and players decline the download.

**Second, the reachability trap is the one 126 fell into last cycle, and it is visible now rather than at
implementation.** `fondGreeting` is gated at ten hearts. A shading that lives only inside `fondGreeting`
is unreachable on a fresh save by construction — every founding dino is a stranger — and CHARTER v7 calls
that a REWORK, not a compatibility win. **The first hello a player ever gets must already differ by
observer.** Escalate *warmth* with friendship if you like; do not gate *identity* behind it.

**On the collision with the structure track, deliberately accepted.** The Structure-smith fires next and
the milestone's spine arc is BACKLOG-212, which also edits `keeper/keepers.ts`. In the old split-session
model that overlap was a hazard worth dodging; in the consolidated daily cycle there is one Coder writing
both tracks sequentially in one session, so it is a coordination note, not a merge risk. It is also the
better ordering: **build 212 first, then 160 reads the widened roster.** A per-observer voice register
written against three robots learns one axis; written the same night a non-robot joins the roster, it has
to answer what a watcher that is *not a machine* sounds like — which is the whole point of 212 and the
reason a shading register built after it will not need rewriting. Cycle 162's verdict made exactly this
argument about 068 before 126, and it was worth real code.

**Idea Box:** empty (no open entries).
