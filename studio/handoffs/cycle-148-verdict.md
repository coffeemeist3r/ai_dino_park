# Cycle 148 — Verdict

**Lore track (BACKLOG-110 / -279 — the hour gets into the voice): APPROVED.**
**Structure track (BACKLOG-524 — the night shift): APPROVED.**
**Rider (BACKLOG-515 — the suite's serial/parallel split): CLOSED.**

Read in full: both smith handoffs, the design, the code plan and its shipped section, the QA report, and the
diff across all 15 files. Gates re-run against the committed tree rather than taken from QA: build clean,
**2371 unit green** across 228 files, and the e2e suite **649/649 in parallel** *and* **649/649 at
`--workers=1`**. `reworkCount` is empty for all three items; none had been attempted before.

**There is no standing red for the first time in this project's recorded history**, and that fact is the
third item on tonight's list rather than an accident of the first two.

---

## The reachability bar (CHARTER v7)

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Lore track.** Open the game and walk to any dino in the Bowl. Until tonight all five said the same four
canned hellos at every hour of every day. Now Sunny says *"…I'm only just up, mind. still shaking the night
off"* — because it is eight in the morning and Sunny's day started at five — and Rex, asleep three tiles
away, says *"…mnh. sorry. I was under, a bit. give me a moment."* Same hour, same park, same keystroke,
opposite line. Wait nine real minutes and Rex has been up four hours and mentions the time not at all;
wait six more and it tells you it keeps its own hours while everyone else sleeps.

**Structure track.** Walk east to the Ridge on frame one. Its one resident, Ember, is asleep, and **nothing
falls there** — where until tonight the ground produced at four in the morning at the rate it produced at
noon. Five real minutes later the clock reaches 13:00, Ember wakes, and the Ridge starts working for the
first time in the session. The Fernreach does the same. Meanwhile the Grove has been producing the whole
time, because Bramble is up over a sleeping Pip, and the ticker says so: `👁 Bramble keeps the watch over
the Grove`.

**Rider.** Nothing. It is a rider and the constitution judges tracks. Recorded as *nothing*, deliberately,
and see below for why that was the right shape rather than a loophole.

---

## The lore track, and a fact that had been given only to the roof

BACKLOG-110 was filed as a flavour beat — *a dino's first line leans on the hour*. What the Designer found
by tracing the mechanism before writing criteria, which is now the third consecutive cycle that discipline
has paid for itself, is that the fact was already there and only half the park could hear it.

`NPCContext.timeOfDay` has been set on every greet since the clock existed. It is read in exactly one
place: `webllmBrain.ts`'s prompt preamble. `cannedReply` — the stub brain, **and the WebLLM brain's own
fallback while it loads or errors** — composes nine asides covering gratitude, neglect, friendship, hunger,
a chase, the provider, the season, the ground's spend policy and the last contested drop, and did not know
what hour it was.

That is the CHARTER's own enrichment rule pointing backwards. The line says the model is enrichment **on
top** and the deterministic rules are the **floor**; here the hour existed only on top. A player who
declines the model download — the default, and the operator's own observed choice on a phone — had a park
where ten dinos had kept two different sets of hours for two cycles and not one of them could say so. The
floor never learned the fact the roof was given.

**What ships is small and derived rather than tuned.** Four registers, and the boundaries between them come
out of `restWindow` — the first and last quarters of a dino's own waking span. There is no hour literal in
`dayStanding`'s body. A spring day-dino reads `fresh` at 08:00 because its window runs 05:00–21:00 and the
first quarter of sixteen hours ends at nine; move `SEASON_HUDDLE` or `OWL_SHIFT` and the register moves
with it. **This is the corollary under the reachability bar obeyed in the direction nobody watches.** The
bar's precedent is about constants tuned so the founding park sits *below* a threshold; the mirror defect
is tuning one so the founding park lands exactly *on* the tell, and a `FRESH_HOURS = 4` would have been
exactly that. The unit suite pins the derivation by shifting the window and showing the register follow.

Two more things worth the record. The mid-span case returns **null** and the dino says nothing about the
time — a greeting that always mentions the hour is a clock with a face, and this arc exists to remove one.
And `nightlong` beats `waning` when both hold, with the test first proving 03:00 genuinely *qualifies* as
waning before asserting it reads as something else, so the precedence is pinned as a choice rather than as
an accident of ordering.

**279 shipped without a branch.** It asked for the *fond* greeting to carry the hour, and the answer was
that it already would: the aside composes onto whichever register `cannedReply` picked, the way hunger and
the season already do. The criterion pins a fond dino's hello carrying both the keeper's designation and
the standing in one line. A cycle that had written a fond-specific path would have shipped the same
sentence and a second idiom for it.

---

## The structure track, and the seam that had been asking the wrong question for 148 cycles

`residentZones()` is `occupiedZones()`. Every ground in this park has rolled its resource because somebody
*lived* there, and nobody had ever asked whether anybody in it had its eyes open.

BACKLOG-109 shipped the chronotype split two cycles ago and it was true, tested, load-bearing, and changed
nothing about what any ground *did*. That is the CHARTER v7 defect exactly, one layer along from where v7
found it — and it is the defect appearing in work the studio shipped **after** v7 was written, which is the
part worth being uncomfortable about.

The fix is two lines in `maybeSpawnResource` and one pure function, and the verdict wants to name the line
that was deliberately left *outside* the gate: `workRegrowth`. A sleeping ground stops **producing**; it
does not stop **recovering**. Those two live on adjacent lines now, with a comment saying why, and the QA
criterion pins it — because the version of this item that gated both would have made a night's sleep cost
a ground its yield, which is a different and much worse system arriving disguised as the same two-line diff.

**The founding state already exercised it, and the studio checked rather than assumed.** The Structure-smith
computed the shipping roster's chronotypes and spawn zones before choosing the item: the Fernreach and the
Ridge each hold exactly one resident, both night-owls, both asleep from 05:00 to 13:00. So two of the park's
five grounds ship with a resident and nobody awake, and 13:00 lands **five real minutes** into the bar's
ten-minute window at `ACTIVE_SCALE`. **No roster edit, no constant moved, no threshold retuned.** The
milestone's first arc had to constrain a derivation to reach the bar; this one only had to look. The unit
test asserts the distribution off `ROSTER` and `seededPersonality` rather than off a table, so if a spawn
zone or a trait seed ever moves, the reachability answer has to be re-earned instead of quietly expiring.

**Where this track is honestly smaller than it sounds.** The item's own text lists mending, building, the
ballot, the migration tiers and the hatch; this cycle takes the one seam and leaves the rest a pattern to
follow. And the watch beat is a ticker line, a bubble and a memory — a real tell, properly deduped against
the recall ring, but not yet a system: an owl on watch does not do anything a dino off watch would not.
QA raised both before being asked and the design scoped them that way in advance. Judged as what it is.

**One design call turned out to be load-bearing rather than tasteful.** The watch is deliberately *not*
owl-exclusive. The obvious build is "the owl keeps the watch"; it makes the beat a property of a trait
instead of an hour, and it goes dark for the eight hours a day the owl is the one asleep. The unit test
shows the same Grove pair swapping the role — Bramble over a sleeping Pip at eight in the morning, Pip over
a sleeping Bramble at three. A trait-keyed version would have shipped half a feature and passed every test.

---

## The rider, and the cycle-147 ruling it was answering

Last cycle's verdict said 515 *"does not get a fifth skip on the same argument without somebody writing down
what the park loses by carrying it."* This verdict records that it did not get a fifth skip. It got fixed.

**The shape of the answer matters more than the fix.** 515 could not be a track: its bar answer is *nothing
a player sees*, and under CHARTER v7 that is a REWORK. It had therefore been unshippable for four cycles by
a rule that was working exactly as intended — the constitution was correctly refusing to let the studio
spend a track on invisible work. The resolution was not to argue the bar down; it was to notice that **the
bar judges tracks**, that riders are how 519 shipped in cycle 146, and that the item had always been worth
an hour rather than a track. The Structure-smith wrote the cost down as instructed — *a broken instrument,
and an instrument you have to interpret is one a genuine regression can hide behind* — and then carried it.

**The diagnosis was wider than four cycles of re-diagnosis had found.** Two causes wore one item number,
and the second one is the one that explains the failed re-diagnoses: three of the seams are
**input-after-input**, not read-after-input. `KeyE` opens the tone menu and `Digit1` picks from it in the
same frame, against a menu that is not open yet, so the tone is never chosen at all — and the `expect.poll`
that follows then times out waiting for a beat nobody ever requested. That is why two of the catalogued
specs failed *despite already polling*. **A poll cannot recover an input that was dropped.** Four cycles of
"add a poll and see" could never have converged.

**And the fix moved a layer down mid-cycle, which is the part this verdict most wants on the record.** The
plan applied a `settle` per seam. It worked: the four catalogued specs went green, and the acceptance
criteria as written were satisfied. Then the next full serial run produced a **fifth** victim that had never
been catalogued, and the run after that a **sixth**, and after that a **seventh**. Six specs fixed one seam
at a time and a new one every run — because the victim moves, which is the signature this item has carried
since cycle 130 and had never once reproduced on demand until tonight.

So QA moved the patch into `boot()`, where `page.keyboard.press` and `page.mouse.click` are wrapped once for
every spec that boots, and **reverted every per-spec edit**. The four catalogued specs are now byte-identical
to their committed versions and the whole rider is one file.

That is the difference between patching the callers and fixing the shared function, and it is worth stating
plainly: **the first version of this rider would have passed its own acceptance criteria while leaving the
mechanism running.** A green suite is not the deliverable; a suite that stays green is. The proof is that
the run which had been finding a new victim every time now finds none: **649/649 at `--workers=1`**, and
649/649 in parallel, from the same tree.

No game code was touched for it, and none should have been. A real player's ArrowLeft turns the page on the
next frame, sixteen milliseconds later. That was always correct. It was the harness reading the world too
early, in a park that had got fast enough for it to matter.

---

## Housekeeping

- **CHANGELOG:** entries added for both tracks and the rider.
- **BACKLOG:** 110, 279 and 524 closed; **515 closed, and 430 closed with it** — 430 has been one symptom of
  515 since cycle 144 and its own spec is green in both directions, so it closes with the finding rather
  than being re-diagnosed a fifth time. 525 seeded for the Artist with its host shipped and proven.
- **MILESTONE:** Milestone 17's third lore arc is **closed** by 110/-279. The structure arc that 515 and 430
  belonged to is **closed**. That leaves one open arc — 121, the second clause of *the park at rest has
  tells you can name* — and Milestone 17 is one item from shipping.
- **Standing red:** **none.** The `mobile-minds` red that has stood since cycle 92, and the four other specs
  catalogued under 515 between cycles 130 and 147, are all green at both extremes of load.
- **A note for the Structure-smith next cycle.** BACKLOG-495 was passed over a fourth time tonight, honestly
  and for its own reason, and 515 is the item that just demonstrated what happens when the studio finally
  stops passing over a harness item: an hour's work, and a class of failure that had cost parts of five
  Validator fires ends. 495 makes the same argument about founding state that 515 made about time, and 515
  arrived at 495's argument independently. It is the last of its kind in the queue.
