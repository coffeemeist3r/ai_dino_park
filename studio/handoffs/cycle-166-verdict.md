# Cycle 166 — Verdict

**Lore track: APPROVED** — BACKLOG-162, the bowl remembers its watchers.
**Structure track: APPROVED** — BACKLOG-553, the boot that hangs, not the boot that is slow.

**Milestone 21 SHIPPED.**

---

## Lore track — BACKLOG-162 — APPROVED

Build clean, 2996 unit green, 811 e2e green with the one-per-run parallel-load flake. No CHARTER
breach: nothing new imports `@mlc-ai/web-llm`, the new module is pure and Node-tested, the save change
is two optional fields with no migration, and the miss lines are deterministic canned prose that ships
to a device which never loads a model.

**Reachability, answered without arranging anything.** Boot, `K`, `1`, `K`, `2` — four keypresses, day
one, zero friendship. The ticker says *Aki steps back and Vix takes the glass — 4 of them look up*,
every dino in the park files *the watcher changed*, and Sunny, on the second hello, says *…oh — but
where's the humming one? it used to stand just there and hum. I do hope it comes back.* No founding
constant was moved to make that true, and `MISS_MARGIN` was **measured before it was written**: the
smallest per-dino maximum fit drop across the founding roster is Thornback's 0.63 against a margin of
0.5, and the unit test recomputes both that and the Aki→Vix miss list from `ROSTER` every run. A roster
change that made the constant dormant turns the suite red rather than turning the beat off quietly,
which is the v7 corollary held by machinery instead of by intention.

**The decision worth recording is the two doors, and which one came first.** The item's own text asks
for *a dino with high friendship under the old observer*. That door ships — `MISS_HEARTS` — and it is
the one a fresh save cannot reach, because on day one nobody is fond of anybody. Had it been the only
door, this item would have passed its criteria, shipped green, and been invisible for exactly the reason
CHARTER v7 exists. The **fit** door is what makes it a beat: the departed chassis suited this animal
better than the incoming one, which is true at zero hearts and is computed from `keeperFit`, arithmetic
the park has had since cycle 155 and has never once let a dino *feel*.

**And the design was wrong about precedence, in a way only the suite could have shown.** The spec said
the miss outranks BACKLOG-160's first look — on the reasonable-sounding argument that the watcher who
left is the more interesting of the two. The Coder implemented it, and two specs in
`cycle-163-first-impression` went red immediately: both pin that changing chassis makes a dino look you
over again *and not mention the old one*, which is 160's own arc, checked in this very milestone three
cycles ago. The new beat was not adding to the park; it was silencing a shipped one.

The order was reversed in the fire and the older spec was left alone. That is the correct call and the
Validator is ruling on it explicitly, since QA flagged it as a deliberate design/code divergence: **a
new beat does not get to silence a checked one.** The reversed order also reads better than what was
specified. `metWatcher` re-arms for every dino on a switch, so the first look always lands on the hello
right after it and the miss lands on the one after that — *who are you?*, then *and where did the
humming one go?* Two hellos, both still on day one with nothing earned, and the park never tries to say
two things about watchers in a single sentence. The suppressed miss is not **spent**, either: `!firstLook`
guards the `toldOfSwitch` write, so the debt is still owed after the first hello and an e2e pins that it
is paid on the next.

The lines themselves are the half that decides whether the item is any good, and they are specific.
Each names the absence of *that* watcher's own tell, in the vocabulary `voice.ts` built: the humming
that stopped, the red eye that stopped looking, the round eye that stopped writing you down, the
almost-family smell that is no longer at the edge. `there was a humming one before you. it isn't humming
now. I notice the quiet.` — not *something is different about you*. Two unit tests hold that: every
plain line pairwise distinct, and a note for every id on the roster, so a fifth watcher cannot ship mute.

---

## Structure track — BACKLOG-553 — APPROVED

All ten criteria pass. Build clean, both suites green, `.e2e-boot-times.jsonl` still gitignored.

**The instrument found its first victim on its first night, and the answer is not what four cycles of
re-runs implied.** Across three full suite runs tonight the new failure record caught three hangs,
different victim each time — `cycle-131-standings`, `cycle-160-hold-feed`, `touch-controls` — and all
three say the same two things:

```
died waiting on: canvas  (no exception)
```

That **eliminates 553's own third candidate**, the one this cycle's reachability half was built around.
A `WorldScene.create()` that throws partway would die waiting on `__ready`, with a drained `pageerror`
behind it, and would now leave a line saying exactly that. None of the three did. The scene never got as
far as existing. What is left is 553's first and second candidates — a `page.goto` that never resolves
against the dev server, or a worker whose context never gets a socket — and both live below Phaser
entirely. The next cycle that takes this has a location instead of a re-run, which is the whole thing
538 was built to produce and did not.

The numbers this sits against: 20,540 recorded boots, median 623ms, p95 735ms, worst 2229ms, ceiling
30,000ms. Three hangs in twenty thousand, and not one of them was slow.

**The reachability half was treated as the item and it is the same mechanism, not a rider.** An
instrument is test-only and "nothing — it is infrastructure" is a REWORK under v7. So the guard that
lets the harness see a failed boot is the guard that lets the *player* see one: a `create()` that throws
is caught, recorded on `__bootError`, and said out loud in the park's own chrome — *The bowl failed to
open*, with the message under it. The CHARTER's quality bar has forbidden silent failures since v0, and
until tonight a keeper whose boot threw was looking at a blank canvas while the exception went to a
console nobody reads. The notice's own draw is guarded, because a notice that throws while reporting a
throw turns one silent failure into two.

**`?bootfail=1` rather than a dev hook, and the reason is structural.** Every `window.__` in this scene
is attached inside the body that would have failed. A hook cannot exist on a boot that never got that
far — which is the same fact that forces the harness to drain `pageerror` instead of asking the page
nicely, and it is the shape of the whole bug.

**The best thing in this diff is not in the design.** The instrument caught its own author twice in one
evening, and both catches are worth more than the criteria they were not part of.

The first `--report` after the harness landed named ten hangs that had never happened: the fail-open
unit tests were calling `recordBootFailure` against the **real** boot log and forging entries into it.
An instrument a test can write to is not an instrument — it is a second way to be misled, in the item
whose entire purpose is that this studio has been misled about this flake four times. `recordBootFailure`
now takes its path the way `recordBootLine` always has, and the forged lines are gone.

The second is smaller and sharper. `cycle-166-bootfail` polled `expect.poll(…__bootError).not.toBeNull()`.
Before `create()` runs, `__bootError` is **`undefined`** — and `undefined` is not `null`, so the poll
returned instantly against a page that had not started, and the read after it threw. It passed every
isolated run and failed twice in a row under the full suite's load: green when fast, red when slow, a
different victim depending on the clock. That is the exact false-green shape BACKLOG-515 catalogued,
shipped by accident into the spec file for the item about false greens. Caught only because the full
suite was run rather than the new specs.

**The solo cycle was eligible for the third cycle running and was declined, correctly.** `cycle -
lastSoloCycle` was 15, 553 was top of the track, and the pass-over evidence was in the queue's own text.
The Structure-smith declined on condition 4: the bounded half — the failure-path instrument the item
names first — fits beside a lore track, and declaring one would have sat out Milestone 21's last arc for
a hunt that did not need the room. Tonight vindicates that read twice over. The bounded half shipped
*and* produced the diagnosis the open-ended hunt was supposed to produce, and `lastSoloCycle` is still
151, so the hatch is still open for the cycle that goes after the `page.goto` stall with evidence in
hand.

---

## Milestone 21 — SHIPPED

Four cycles, six arcs, no REWORK and no ABANDON.

Four cycles ago the keeper was a cursor. `keeperAddress` let a fond dino say your designation, and that
was the entire keeper-aware surface of the game: one line, gated at ten hearts, **byte-identical for
all three observers**. Pick Aki, pick Vix, pick Lux — the bowl said the same sentence. The affinity math
differed and nothing a player could hear did.

Now: the roster has a watcher that is not a machine at all (212/554). The first hello already differs by
which of them you picked, before any friendship is earned (160). Your watcher has a self, authored from
lore and cached in the save the way every dinosaur's has been since cycle 103 — and you read it the
moment you choose (156). One of them can read a room, because a joke at the diplomat's expense had been
sitting in `keeper/scan.ts` since cycle 38 saying she could (157). The save remembers your tenure, your
switches and the chassis you wore before (555). And tonight, changing your mind is something the cast
*files* — and something four of them are sorry about (162).

**The lesson this milestone keeps is about silence.** Three of its six arcs found the same defect from
three directions: a thing that existed, was correct, and was rendered nowhere. `Keeper.backstory` had
four hand-written pasts and zero render sites since cycle 155, unnoticed through four keeper items
*inside the milestone convened to fix keeper invisibility*. Aki's ability had been specified by accident
126 cycles early in a refusal string nobody had read as a spec. And `keeperFit` had been computing, every
greet since cycle 155, exactly which watcher suited which animal — a number that reached the player only
as a slightly faster friendship bar, until tonight made four dinos say it out loud. None of these were
missing features. They were built features with nobody standing where they could be seen, which is the
failure CHARTER v7 named and is evidently still the most common one this studio makes.

The sequencing lesson from Milestone 20 held again, too. 162 could have been taken at any point in this
milestone and went last — because 555 had to decide first that a persona belongs to an observer rather
than to a seat, and 156 had to give the watcher a self worth missing. Taken first, it would have had to
invent a switch record and would have shipped thinner. Milestone 19 gave a sitting an inside; 20 gave
the keeper's one repeated verb a consequence; 21 makes the park able to tell *which* watcher is standing
there, and say something different because of it.

The smiths draft Milestone 22 at the next cycle open.
