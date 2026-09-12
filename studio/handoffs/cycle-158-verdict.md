# Cycle 158 — Verdict

Both tracks APPROVED. **Milestone 19 closes at 6 of 6.**

---

## Lore track — BACKLOG-067 (Keeper-loaded hatch): **APPROVED**

### The ten-minute question

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

Look at the bottom-left corner. There is a second line under `Holding:` that was not there before, and
it says `Feed: random handful`. Press `.` until it says `Feed: 🐟 silver fish`. Press `H`. A fish comes
out of the hatch.

That is the whole answer and it needs no qualifiers, no fixture, no six residents and no day boundary.
But the reason it matters is one layer down. **`dropFood` has rolled `FOODS[Math.floor(rand() * FOODS.length)]`
since cycle 59**, and seven systems read one question off that roll: the rush or the amble
(`reactionToFood`), the escort that walks a withdrawn loner in from the wall (381), the pecking order at
the landing (389), the bond a meal is worth (`FEED_GAIN_FAV`), the 😋, the comfort meal (374), and the
granary's spend priority. For a hundred cycles the most consequential variable in the park's social
engine was a coin the player was not allowed to call.

They can call it now. Walk up to a dino, press Z, and — since last night — it will tell you what it
thought of its dinner and name the food if the food was its favorite. Then load that food and drop it,
and watch that dino be the one that comes. **The knowledge shipped on the eleventh and the means shipped
on the twelfth**, and neither cycle planned the other; 066 was the last taste item in a section seeded at
cycle 27 and 067 was the milestone arc that happened to be next. The loop closed because both halves
were queued and the milestone pulled them one after the other, which is the milestone layer doing the
job CHARTER v6 seeded it to do.

### What earns the approval beyond the criteria

**The `random handful` slot is the right kind of default.** It would have been easy to make the founding
park start loaded with meat, and it would have been wrong — the park's drop is unchanged, so every
feeding spec in the suite still means what it meant, and the founding state keeps the variety a new
keeper should see. What changed for that keeper is not the drop, it is that **the HUD tells them the
choice exists** from second zero. CHARTER v7's corollary says a founding constant must not be tuned to
sit below its own system's floor; this one is not tuned below anything. It is the system's own first
rung, and it is labelled.

**`feedChoices()` derives from `FOODS`.** Three crop foods have been added to that roster since cycle 61
— roots (432), mushrooms (472), seeds (478) — and a hand-copied selector list would have silently missed
all three within twenty cycles. The unit test asserts the derivation against `FOODS.map(f => f.id)`
rather than against a literal, so the next crop joins the hatch selector for free and the assertion
proves it rather than restating it. This is the BACKLOG-483 habit, showing up unprompted for the second
cycle running.

**The explicit `foodId` argument was left outranking the selector, and it was tested.** `WorldScene.ts:2074`
drops a harvested crop by id, and a selector that overrode it would have made every harvest drop the
keeper's loaded feed instead of the crop the plot grew — a regression that no existing spec covers,
because no existing spec had a reason to. The Code-planner named the precedence, the Coder implemented
it as a three-branch helper with the branches in the order the plan gave, and QA wrote the spec that
pins it. The bug was found by planning rather than by failing.

**The predicted bug was where it was predicted.** The code plan wrote, in advance, that the save restore
might not repaint the HUD and that this was "the one ordering bug this track can ship". It did not
repaint. The Coder found it at the line the plan pointed at and closed it. A plan that predicts its own
defect and is read carefully enough to catch it is worth more than a plan that is right.

### The gap, judged

QA discloses that **the two-line HUD string is never read back off the canvas.** There is no hook that
returns the gift HUD's text, QA looked for one before saying so, and neither QA nor the Coder invented
one. `feedLine` is unit-asserted, `holdingLine` is unchanged and still carries its cycle-22 assertion,
the composition between them is a single `join`, and the behavior the line describes — which food
actually comes out — is asserted end-to-end on `__food().foodId`.

**Approved with the gap on the record.** This is the **third consecutive cycle** in which this studio has
declined to manufacture evidence for an assertion it wanted and has written down that it declined. Cycle
156 corrected two false host claims by reading them against the code; cycle 157 refused a `__moodGlyph`
hook that would have re-implemented the thing it tested, and then — an hour later, at the Artist fire —
caught its *own* Validator's false "unblocked" claim in the same cycle. The failure mode this park nearly
died of (BACKLOG-119's trigger, unable to fire for a hundred and twenty-five cycles because every reader
inherited the claim instead of checking it) is a failure of exactly this discipline, and the discipline is
now visibly load-bearing three nights running.

The second disclosure — that the e2e asserts the meal is *aimed* and not that the dino *rushes* — I read
as the Designer's wording being a word too strong rather than the code being a line too weak, and QA said
so in those terms. The rush is `reactionToFood`'s, it is unit-tested against distance and energy, and
pinning a wander position to watch it happen is the manufactured evidence the paragraph above is about.

### The one thing to watch

`cycleFeedBy` calls `void this.saveGame()` on every keypress, which `cycleItem` does not. The Coder
flagged it as a decision rather than letting it pass as a habit, and at one IndexedDB write per keypress
it is the same cost as a departure stamp. But it is the first keystroke in this game that writes to the
save, and a keeper who holds `.` down is now holding down a write loop. Not a defect tonight — Phaser's
`on('down')` does not repeat — but the next selector that copies this pattern should copy the flag with
it. Flagged, not actioned.

---

## Structure track — BACKLOG-545 (Once per sitting): **APPROVED**

### The ten-minute question

Open the park. Alt-tab to something else for a moment, come back, alt-tab again, come back. Do that for
ten minutes — which is not a contrived test, it is how anybody actually uses a browser game.

**Before tonight, one of two things happened to you, and which one depended on a detail you could not
see.** If your focus periods happened to run over twenty seconds each, your closest dino said goodbye to
you *every single time* — same dino, same words, four times, six times, as a tic. If they happened to run
under twenty seconds, the dino **never** said goodbye at all, not once, no matter how long you had been
in the park, because the floor restarted from every return. Cycle 155 shipped that beat and for the
fidgety keeper it did not exist.

Tonight both are fixed by the same change, because both were the same confusion. The floor is measured
against the **visit** now — twenty seconds since you opened the park, which is what `departure.ts`'s own
doc comment has said the floor means since it was written — and the beat is spent once per visit. So the
fidgety keeper gets a goodbye they have never had, and the alt-tabbing keeper gets one instead of six.

### What earns the approval beyond the criteria

**The structure track found the additive half before the Designer wrote a line, for the second cycle
running.** BACKLOG-545's own text frames this as suppressing a repeat — "a beat that should happen once a
visit does" — and a track that ships only suppression has a thin answer to the reachability bar and knows
it. The Structure-smith read the code, found that 542's re-stamp had made a second and opposite bug in
the same field, and specced the fix as one change that is additive on one side and subtractive on the
other. Cycle 157 did the same thing with the expiry seam, picking the second caller before the spec
existed. That is CHARTER v7 working the way the operator intended — **as a constraint that shapes the
pick at the start, not a gate that catches bad work at the end** — and it is now the visible habit of
this routine rather than a one-off.

**The spent set is transient, and the item's own text said persist it.** The Designer overruled the seed
and wrote down why: a visit is a page load, a reload is a new visit, and a persisted spent set would make
a restored save silently owe the keeper a goodbye it had already given. The precedent cited is
`companyTrace`'s ("session state, never persisted"), and the distinction drawn against 542's own record
is the right one — that record is *history* and belongs in the save; this is the current visit's scratch.
**The structure track's save format is unchanged**, which is the cleanest possible answer to the additive
rule.

**The ordering is the item, and it was tested on the right side.** Spending the key must happen *after*
`partingGlance` returns non-null, or a park with no friendship burns its one goodbye on a blur that
showed nothing — and the keeper who alt-tabs before befriending anybody is then silenced for the rest of
the visit. The Code-plan called this "the whole item" in advance. QA did not take the green on trust: it
traced which spec would fail under the wrong ordering (`a silent goodbye does not spend the visit`, and
*not* the companion cycle-155 spec, which would stay green either way), confirmed that spec exists and
fires on the correct side, and wrote the reasoning into the report. That is a gate that knows what path
it walks, which is precisely the lesson cycle 156 paid for.

**`cycle-155-glance.spec.ts` is 7/7 unmodified and `cycle-156-sitting.spec.ts` is 5/5 unmodified.** The
strongest single line in tonight's QA report is about the first of those, and it is the one QA pushed on
rather than accepted: `the second sitting has to earn its own goodbye` used to pass because the sitting
was three seconds old and now passes because the key is spent. **Same green, different reason.** Cycle
156's finding was that a green board can prove nothing; tonight the board was interrogated about *why* it
was green before the verdict was written. The studio is applying its own lesson two cycles after learning
it.

### No bugs, and one honest note

`__ageSession` now winds two clocks, so no existing spec needed editing — but a future spec that wants to
age only the sitting has no hook for it and must fire a real `focus`, as the new fidgety-keeper spec
does. QA observed that this is arguably the more honest mechanism anyway, since firing a focus event is
what a player actually does. Agreed, and recorded so the next cycle does not add the hook reflexively.

---

## The Structure-smith's question, ruled

The Structure-smith declined to take BACKLOG-538 tonight despite its top-of-queue promotion by *my own
predecessor one cycle ago*, and routed the reason here rather than working around it. The reasoning:
538's own text makes its first deliverable a **reproduction**, a reproduction ships nothing a player can
see, and CHARTER v7 makes "nothing — it is groundwork for a later item" a REWORK in plain text. So taking
538 means either shipping a track written to be REWORK'd, or quietly reading the bar down for infra —
and a routine that reads the constitution down is a routine amending it.

**The Structure-smith was right to refuse, right to name it, and right not to decide it.** The ruling:

**1. The gap is real and I am not closing it.** The reachability bar was written against seven cycles of
invisible *governance* — features with players, shipped where no player could reach them. It was not
written against test infrastructure, and its plain text does not distinguish the two. I can read
CHARTER v7 to cover infra or to exempt it and the document supports both readings, which means the
document does not answer the question. **A Validator choosing between two supportable readings of the
constitution is a routine amending the constitution**, which is exactly what v8's own amendment note
says the routines could not do for themselves. The cycle-150 Validator routed the solo-cycle question to
the operator on this reasoning and the operator ruled; this is the same shape.

**2. Routed to the operator as a v9 amendment request.** The question, stated as narrowly as I can make
it: *does the reachability bar apply to an `[infra]` item whose value is to the studio rather than to the
player, and if so, what does such an item have to show?* The three answers I can see, with what each
costs:

- **It applies unchanged.** Every infra item must ship a player-visible rider, as 544 did with the
  standoff funk. Honest, and it is what 544 proved is often possible. But it makes a reproduction
  harness — which by construction has no rider — permanently un-takeable, and 538 is not the last of
  those.
- **It is replaced for `[infra]` by a studio-facing bar.** Something like: *what can the studio do after
  this cycle that it could not do before, demonstrated, not asserted?* A reproduction harness answers
  that cleanly ("the flake reproduces on demand, here it is failing"). The risk is obvious and should be
  said out loud: this is the exemption that lets invisible work back in, and the park nearly died of
  invisible work.
- **A quota.** Infra is exempt for at most one track in N cycles, named in the handoff. Bounds the
  damage, adds a number to maintain.

I lean to the second **with the demonstration requirement made hard** — an infra track that cannot show
its new capability running is a REWORK exactly as a lore track that cannot show its beat — but this is
the operator's call and I am not making it.

**3. Until it is ruled, 538 stays top of the Structure Track and stays un-takeable.** That is an
uncomfortable state and it should be, because it is the argument for ruling. It logged its **fifth
consecutive instance** tonight, across two full e2e runs with two different victims, both green when
re-run alone. Five cycles, five re-runs, and — the part that actually worries me — a suite whose readers
are now trained to see a red board and reach for the re-run before reaching for the diff. **That is the
habit that makes a real regression invisible**, and it is being reinforced nightly while the item that
would fix it cannot legally be taken.

**4. BACKLOG-533's rewritten entry condition stands, and it is the right kind of fix.** Its deadline came
due tonight, the Structure-smith rewrote rather than took, and the rewrite is not a dodge: the evidence
clause is demoted to a tie-break between the three options, and the gate becomes a **date** — cycle 165,
or the first structure item that edits a founding constant. The reason the old condition failed is worth
recording because it will recur: *the evidence it waited on was not being generated by anything in the
queue*. A condition no queued work can satisfy is not a condition. Note that 533 is itself an `[infra]`
item and will hit the same wall 538 is standing at when cycle 165 arrives — which gives the amendment
request above a deadline of its own.

---

## Milestone 19 — SHIPPED

**Milestone 19: *Something changes while you sit there — the park's clock runs inside your visit, not
only between them.*** Opened cycle 156, closed cycle 158. Six arcs, three cycles.

| arc | item | cycle |
|---|---|---|
| A funk ends while you watch — on its own short clock, or early because the keeper was kind | BACKLOG-123 | 156 |
| What a dino just ate reaches its mouth — a palate you learn by talking | BACKLOG-066 | 157 |
| The keeper chooses what goes in the hatch instead of throwing a random handful | BACKLOG-067 | **158** |
| The session is a measured unit — the park holds how long you stayed | BACKLOG-542 | 156 |
| States end by a named rule instead of four bespoke ones — the expiry seam | BACKLOG-544 | 157 |
| A greeting happens once a sitting instead of every time its gap condition is true | BACKLOG-545 | **158** |

**What the milestone actually bought, stated as a player would feel it.** Before cycle 156, a ten-minute
sitting in this park had no inside. Everything the park knew how to say was about the *gap* — how long
you had been gone, what you had missed, how many days in a row you had turned up. A mood entered at
minute two was still worn at minute ten unless you personally reached in and ended it. Nothing resolved
on its own, the visit was not a thing the park could count, and a greeting fired whenever its gap
condition happened to be true rather than when you arrived.

Now: **a funk you cause at the hatch ends sixty seconds later whether or not you come** (544), or sooner
because you did (123). **The brass tells you how long you have been standing there**, ticking (542).
**Your goodbye happens once, when you leave, and it happens to you even if you never sit still** (545).
**A dino tells you what it made of its dinner** (066) and **you decide what its dinner is** (067). A
sitting has a beginning, a middle and an end, and things finish inside it.

Three cycles, six arcs, no REWORK, no ABANDON. Milestone 20 is the smiths' to draft at the next cycle
open — the Lore-smith writes the headline and the feel arcs, the Structure-smith adds the spine.

---

## Verdict summary

| track | item | verdict |
|---|---|---|
| Lore | BACKLOG-067 — Keeper-loaded hatch | **APPROVED** |
| Structure | BACKLOG-545 — Once per sitting | **APPROVED** |

Gates: build clean; **2700 unit across 255 files** (+17); **728 e2e** (+14), green under the flake
protocol — two full runs, two different single victims, each green isolated, BACKLOG-538's fifth
consecutive instance; web-llm boundary grepped clean; save change additive and backward-compatible
(`loadedFood?`, absent → the random handful). **Milestone 19: SHIPPED.**
