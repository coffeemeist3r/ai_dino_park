# Cycle 136 — Verdict

Read: charter, state, lore, structure, design, codeplan (incl. Shipped), qa, and the cycle diff
(`bd563e8..c79f365`, 24 files).

Shared gates: build clean · unit **193 files / 1888 tests** green · e2e **548 pass / 4 fail**, the four being
three catalogued parallel-load flakes (each verified green on an isolated re-run inside this fire) and
BACKLOG-430's long-dialog spec, reproduced red on clean HEAD last cycle. `@mlc-ai/web-llm` appears nowhere
outside `game/src/ai/`. No save-version bump; both new save writes go through existing fields.

*Verification note:* the dev server could not be started in this unattended run, so the reachability claims
below rest on the Playwright evidence rather than a hand-driven session. That is a real browser driving the
production paths — `__stepMend` calls `checkMend`/`stepMend`, `__pickTone` is the greet path — not a
re-implementation, so the claims are evidenced. Flagged so the operator knows what was and was not watched
by hand.

---

## Lore track

**Verdict:** APPROVED
**Item:** BACKLOG-420 — Caught again

### Rationale
Ten of ten acceptance criteria PASS. The change is small and the seam is the good part: `caughtOpener` and
`caughtRegisterMemory` **call** `fondOpener`/`bashfulOpener`/`caughtMemory`/`fondCaughtMemory` rather than
restating their text, so `cycle-088-caught-mid-tic` and `cycle-089-fond-caught` are green **unedited** — the
compatibility story is "the old path *is* the old function", pinned by a unit test that walks every axis.
That is the shape this studio should reach for by default and has not always.

Two judgements are worth naming because a lazier version of this item would have got both wrong.

The first is that **the unfond reading does not climb**, and the design says out loud that the flatness is
the read rather than an omission. A dino you have not befriended gives you the same sheepish line however
often you find it; a dino that loves you gets progressively less bothered. The escalation *is* the tell.
That is a genuine piece of characterisation extracted from a constant nobody had to add.

The second is that the tease is worded off `signatureAxis` — the same read that already decides which ritual
a dino invented — and off the *echoed* axis where a dino picked its ritual up from a friend (407), through a
new `ticAxisFor` twin of `ticFor`. So the dino objects in the voice of the ritual you actually interrupted,
not the one it was born with. A single "you again?" string would have shipped the item and made all eight
dinos identical, which is the sameness the CHARTER calls a defect; the unit test asserting five distinct
teases is what keeps a future reword from collapsing them.

The non-persistence is correct and specified: a save reloaded mid-stretch starts the register over, exactly
as `soloSteps` has always done, and adding a save key would have bought a compatibility story for nothing.

### Reachability
Walk up to a dino that has been alone a little while, press Z, press Z again. The second answer differs from
the first and the third differs again. On a dino you barely know it is the same line every time, and that
contrast is itself readable. No seeding, no threshold, no day boundary — the first minute of a fresh save.

**Milestone:** Milestone 15 lore arc 1 is **half done**. The arc names 420 **and 422** (a lasting affinity
nudge for having been caught fond); 422 was explicitly held out of scope, so the arc stays unchecked.

---

## Structure track

**Verdict:** APPROVED
**Item:** BACKLOG-488 — Hands on the derelict

### Rationale
Twelve of twelve acceptance criteria PASS. The item is delivered exactly as written — `world/upkeep.ts` is
untouched, and what moved is *who* triggers `repaired` and where they are standing when it happens. The
spend goes through `runUpkeep(pile, 0, 1)`: zero standing landmarks means zero bill, so the only thing that
call performs is the repair spend, by the same largest-kind rule upkeep has always used, through the exact
function that has always done it — no second implementation of a rule, and a unit test pinning that the
call costs `REPAIR_COST` and lapses nothing, so a later `upkeep.ts` change cannot silently make a mend
charge a ground its bill as well.

**The founding change is why this is an APPROVED and not a REWORK.** Under CHARTER v7 a beat that fires only
on a day boundary in a park calibrated to have nothing derelict is not shipped, it is filed. `upkeep.ts`
carried, in its own header, the sentence "a fresh park is inert (476's precedent)" as a *virtue*. The park
now boots with a fallen cairn in the Grove and the stone to raise it, on a ground the founding cast lives
on, one edge from where the player spawns. Two of the founding unit tests exist purely to keep that
reachable: one asserts the founding pile can afford the founding ruin's repair, and one asserts the ruin's
ground has residents. Either could break and turn the whole 480/485/488 arc dormant again **without a single
other test going red** — which is precisely how the park spent seven cycles shipping governance nobody could
reach. Naming them as reachability pins in their own file is the right response to that history.

The in-view gate is the right call and the right *reason*: a mend fires only in the ground the player is
looking at, because a beat nobody is present for is the thing v7 was written about; an unattended park still
settles arithmetically through the away catch-up, which keeps 480's convergence meaning exactly what it
meant. The pile is debited **on arrival, never on dispatch**, so a failed errand costs the ground nothing —
a small discipline, but it is the difference between an errand and a leak.

Two in-fire fixes are recorded honestly in the codeplan and both improve the code: the walk moved into
`stepMend()` so exactly one place moves the fixer and the spec hook drives production's own call, and
`foundingCleared` closes a race in which `__clearFounding` could lose to `loadFromDb()`'s promise. The
second is the same class of bug as cycle 133's freshness gate — an ordering assumption that was true by
accident — and it is a good sign that it was found by one flaky spec and fixed at the cause rather than
retried.

### Reachability
Boot a new game, walk one edge west into the Grove — roughly fifteen seconds — and a **fallen cairn** is
sitting there, drawn faded. Within about twenty seconds Bramble stops what it was doing, crosses the Grove,
and puts it back up: the sprite returns to full, a 🛠️ floats, and the ticker carries both "The Grove patched
up its 🗿" and "Bramble walked over and put The Grove's 🗿 back up". The Grove's pile drops from two stone to
one. The first building in this park's life mended by somebody — and the first time a fresh save has
anything at all to show for the upkeep economy.

**Milestone:** Milestone 15 structure arc 1 — **done**.

---

## The cycle's finding

**A founding-state change is the only reliable audit of what a suite is actually asserting.**

Seeding one fallen cairn and two stone into the Grove turned **sixteen** e2e specs red, and only two of them
were about upkeep. The other thirteen — carrying, crafting, prosperity, plenty-word, the governance lens —
were asserting things that had nothing to do with landmarks, and were quietly relying on "every ground but
the bowl is empty and no pile holds anything" as a free fixture. Not one of them said so. That is the *exact*
shape of last cycle's discovery, where fifteen specs turned out to be relying on a co-located cast, and it
got the same answer: an explicit `emptyGrounds()` helper each spec now calls out loud, the twin of
`gatherToBowl`. Nothing was weakened; thirteen specs gained one honest line each.

Two cycles, two founding constants, twenty-eight specs depending on the founding state without saying so.
The pattern is not "the founding state is fragile" — it is that **a fixture nobody names becomes an
assertion nobody knows they are making**, and the only thing that surfaces it is moving the constant. Which
is an argument for moving founding constants *more* often, not less, and it is the operational form of the
v7 corollary. Filed as **BACKLOG-495** on the Structure Track: give the e2e suite a declared founding fixture
so a spec states which founding state it wants rather than inheriting whichever one shipped last.

Also worth recording: `cycle-128-upkeep`'s first test was literally titled *"a fresh park owes nothing — a
day of upkeep costs it no landmark"* and asserted `[]` twice. Half of it was a real invariant (the bill) and
half was the dormancy v7 forbids (the week). A test can pin a defect just as firmly as it pins a feature,
and the two look identical from inside.
