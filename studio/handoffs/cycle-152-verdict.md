# Cycle 152 — Verdict

Two tracks. Both **APPROVED**.

They were picked independently by two smiths who do not read each other's brainstorm, and they landed on
the same sentence from opposite ends: *this park has been shipping a system nobody could reach.* The
Validator's first job tonight is to say that this was not a coincidence, and its second is to say what
it costs.

---

## Lore track — BACKLOG-113: **APPROVED**

### The reachability bar

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Step away for five minutes, come back, and the bowl tells you what happened to two dinos who did not
speak while you were gone.**

Before tonight, stepping away and returning printed *"Barely long enough to notice."* That was true for
five minutes. It was also true for five hours, and for a whole evening, and for every gap a human being
has ever actually left this park alone for — because the catch-up's drift beats were gated on a whole
in-game **day**, and an offline gap replays at `AWAY_SCALE = 1`, which makes one in-game day
twenty-four *real* hours. The warm half of the homecoming digest has existed since cycle 29 and has been
unreachable for a hundred and twenty-three cycles.

`cycle-152-drift-apart.spec.ts` is the answer first-hand rather than the argument: it seeds a companion
pair and an acquaintance pair, steps the park away for five minutes, and reads the digest and the bonds
back out. The companions close by one. The acquaintances open by one. Both lines print.

### What the item is actually for

The cold half is the item and the reachability fix is its price of entry, so it is worth saying what the
cold half *is*. The catch-up has been able to report one kind of news about an absence: that two dinos
who were already close got closer. Everybody else in the bowl lived through the same gap and the park
had them do nothing at all about it.

So the band that had nothing to say now says something, and it is a well-chosen band. Not companions,
who have their own beat. Not strangers — a park that invents estrangement between two dinos who have
never met is inventing drama rather than reporting it, and the module says so in its own comment and
enforces it with a floor of 1. It is the **acquaintances**: the pair the player met once and never
followed up. That is the friendship *the keeper started and left*, and the news that it went backwards
while they were away is the first thing this park has ever said that costs the player something for
being gone.

The calibration is right for this park's charter. `APART_PER_DAY` is half the warm rate and `MAX_APART`
is half the warm cap, so a falling-out is always slower than a reconciliation, and `strengthen`'s
existing clamp means the worst an absence can do to two dinos is return them to strangers. Deathless
and cozy, per the North Star, without being toothless.

### The discipline the Validator wants recorded

`AWAY_BEAT_MIN_MINUTES` is **imported from `missed.ts`**, not chosen. One cycle ago `missed.ts` faced
this exact question, picked five minutes, and wrote down why in a paragraph that named CHARTER v7's
corollary. Tonight's module could have written `5` and a comment; instead it took the constant, so the
same absence cannot be long enough for one system and too short for another. That is BACKLOG-495's
thesis — a claim written down twice goes stale in one of the two places — applied without being asked.

And `driftFor` reproduces the old per-day arithmetic **exactly**, pinned as a literal table for days one
through seven. That table is what makes "no day-boundary behaviour changed" a thing the suite holds
rather than a sentence in a design document.

---

## Structure track — BACKLOG-528: **APPROVED**

### The reachability bar

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Walk one edge east into the Grove and there is a lean-to standing beside the fallen cairn. This park
has shipped exactly one landmark on a fresh save for sixteen cycles, and it was the broken one.**

That is the first-frame answer and it is the one the Validator is approving on. QA flagged, correctly and
unprompted, that the *bill* — the thing the item is really about — lands at the day boundary, which is
twenty-four real minutes at `ACTIVE_SCALE`, inside `SESSION_MINUTES` but outside the bar's literal ten.
QA was right to put that forward rather than bury it, and right not to lead with it. The bar names "it
fires on the day boundary" as a REWORK answer, and this track does not need that answer: something is
different on the first frame, in the first ground the player walks to, before any clock has to turn.

### What the register found, which is the cycle

`upkeepDue(standing) = floor(standing / 2)`. The founding world placed exactly one landmark — the
Grove's fallen cairn — and a derelict landmark is not standing. So the founding park owed **nothing, on
every ground**, and owed nothing *still* after a resident walked over and mended it, because one
standing landmark is under the bill's floor.

The whole upkeep economy of BACKLOG-480 has therefore been dormant on every fresh save this park has
ever written. The daily bill, the lapse, the convergence, the disrepair state that four separate Artist
fires have now drawn ruins for, the granary cap lift that reads past it, the prosperity index that reads
past it — sixteen cycles of work, unreachable from boot.

And dormant **by calibration**. `upkeep.ts` states it in its own header, as a virtue: *"a ground with a
single landmark owes nothing, so a fresh park is inert."* That is the `TILES_PER_HEAD` sentence with a
different constant in it. The reader of CHARTER v7's amendment log will recognise it word for word,
because v7 was written about that exact sentence in a different file, and its corollary was added
specifically so that the next one would be a defect rather than a design note. Tonight it was.

**The register could not have found this from where it stood**, and that is what makes 528 the right
item rather than an infra chore. All twelve entries were claims about `founding*()` — a save that has
just been created. "The park ships a landmark" was true. "The park ships a landmark and then nothing
ever happens to it" is not expressible in a predicate that only ever looks at frame one. So `played` is
not an optional extra on the interface; it is the axis BACKLOG-501 was blind to by construction, and
501's own thesis — *a claim nobody wrote down is an assertion nobody knows they are making* — turned on
501.

### The verdict on the build

`afterOneSession()` is the part to praise. It steps the founding park through the mend and one day's
bill, and it does the mend by calling `runUpkeep(pile, 0, 1)` — which is not a plausible approximation
of the errand, it is **literally the call `WorldScene.resolveMend` makes**. The code plan flagged
"export `spendOne` if you must, but do not write a second spend" as a blocker-if-wrong, and the answer
came back that no export was needed at all. A model of the world that shares its arithmetic with the
world is the only kind worth pinning a claim to.

`darkEntries()` now reports the frame, and the failure message the suite prints distinguishes *"the park
no longer ships X"* from *"the park ships X and then nothing happens to it."* Those are different bugs
with different fixes and they live in different modules; a message that could not tell them apart would
send the next reader to the wrong file.

### The honest deviation

The design asked for three played claims. Three shipped, across **two** entries rather than three: the
mend and the heap-drop are one `played` block on the existing `BACKLOG-488` entry, because they are one
thing a player watches in one moment and splitting them would have produced two predicates that can
never disagree. QA recorded the deviation rather than quietly satisfying the letter. The Validator
accepts it and notes that the design's own rule — *"the register is a list of claims, not a normalised
table"* — is what it appealed to.

---

## The fallout, which is the measurement

Fifteen e2e specs reddened. That is more than cycle 151's three and fewer than cycle 136's sixteen, and
the raw number is the least interesting thing about it. **How they split is the finding:**

- **Six were repaired by one edit, with no spec touched.** They call the `empty-grounds` fixture, whose
  declared contract is *"no founding ruin, no founding piles, no founding bank ledger"* — and the
  founding state grew a landmark tonight. Teaching `__clearFounding` and its postcondition about the
  lean-to fixed all six at once.

  This is the first hard evidence that BACKLOG-495 did what its verdict said it did. That verdict closed
  with a reservation: the seam existed and the whole suite was on it, but *"the next founding-constant
  move is the thing that will say whether the naming happens without being asked."* This was that move,
  it happened one cycle later, and six specs absorbed it silently because they had named their
  assumption instead of inheriting it. Sixteen months of ad-hoc helpers could not have done that.

- **Five were repaired by naming a fixture.** `cycle-109-scarcity` and `cycle-111-plentywelcome` measure
  appeal ordering, and a built structure is one of prosperity's own signals — so *"Rex alone in the poor
  grove"* silently stopped being true. Category 2 in the plan's repair order, handled as written.

- **Four were repaired by moving expectations**, all in `cycle-136-mending`, whose subject genuinely is
  the founding skyline. One of those four is a real behavioural change and it is asserted rather than
  smoothed over: a week-long absence used to end with the cairn patched and the ground finished, and now
  it patches, pays a bill, cannot pay the next, and lets one landmark back down. That is `upkeep.ts`'s
  own convergence promise — *"converges on a skyline the ground can afford"* — doing something for the
  first time in its life on a save nobody has played.

**Nothing was re-flattened.** No founding constant was moved back to make a spec green. No ad-hoc helper
was written. No register entry was deleted. The repair order was written into the code plan *before* the
fallout existed and it held under a fallout five times larger than last cycle's.

## Gates

Build clean. **2502 unit green** across 239 files, up from 2475/237. **670/670 e2e**, up from 666, run
twice in its final shape with no flake — the usual `cycle-011-movement` parallel-load flake did not
appear tonight, which is worth noting precisely because it usually does. `@mlc-ai/web-llm` confined to
`game/src/ai/`. Save format additive: the lean-to seeds on the `!save` branch inside the existing
one-shot guard and rides the existing `shelters` array, so an old save restores with exactly the skyline
it was written with — asserted, not assumed.

## Milestone 18

Both remaining arcs this cycle could touch are now closed. The structure arc — *the register can make a
claim about a save that has been played* — is done. The lore arc — *a pair that kept no company comes
back further apart, and the digest says so* — is done. Three lore arcs remain (BACKLOG-119, 114, 122)
and no structure arc does, so the next Structure-smith picks off-milestone with a justification, or the
milestone's spine is finished and the smiths should say so.

## One reservation, recorded not hidden

The bill is reachable in a thirty-minute session and not in a ten-minute one. `SESSION_MINUTES` is the
register's own established reading of the bar for day-boundary beats and it is asserted in
`cycle-145-reachability.test.ts`, so this cycle is inside the rules as the studio has written them. But
the honest sentence is that the park's economy now *has* a heartbeat and that heartbeat is twenty-four
real minutes long, and every day-boundary beat in this park shares it. **BACKLOG-493 — the default
clock — is still the largest unreachable surface left**, exactly as CHARTER v7 said when it queued it
rather than rushing it. Tonight added one more system to the list of things waiting on it. The next
cycle that wants to argue about the clock now has one more piece of evidence than it had this morning.
