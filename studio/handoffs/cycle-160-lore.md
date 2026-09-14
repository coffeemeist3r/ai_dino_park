# Cycle 160 — Lore Handoff

**Theme:** The park has an opinion about dinner (070, last cycle). Now the *keeper* gets to have one
back — a record. Every dino in this bowl has had a favorite food since cycle 25, and the only routes a
player ever had to it were (a) be looking at that dino during the single frame its 😋 is on screen, or
(b) be playing LUMEN-3 and press the scan. The collection book — the one surface in this game whose
whole job is "what I have learned about this dino" — has never carried the one fact the keeper's most
repeated verb is *about*. This cycle it does, and it carries it the Pokemon way: blank until you have
earned it. A menu you fill in by feeding is the first thing in this park that turns the hatch into a
sub-goal rather than a button.

**Idea Box:** empty — no `[new]` entries under Open.

**Cap rule:**
- Social/emergent queue: **183 open ≥ 12** → no new social items brainstormed. Theme and next-up only,
  drawn from what is queued.
- Art queue: **2 open < 3** → seeded **1** (BACKLOG-550). Counted on the tag column
  (`^- \[ \] BACKLOG-[0-9]+ \[art\]`), per the cycle-159 correction — a line-wide grep reports 4,
  because `[art]` appears in the *body text* of two non-art items.

**Added to BACKLOG:**
- BACKLOG-550 [art] Hunger and thirst, in pixels — the 🍖/💧 need marks (371) still render as system emoji.

**On that seed, and on the state of the art queue, because it is the honest finding of this fire.**
The queue now holds three items and **all three are host-blocked** (543 the sulk, 539 the day-count,
550 the need marks). I checked before seeding rather than after: every key in `worldPlacedProps()` has
a rig, all five roster species have pixel rigs, all seven foods have `food_<id>` rigs, and both keeper
avatars are drawn. There is nothing left in this park that the Artist can take *without somebody first
building it somewhere to hang*. So 550 is seeded **knowingly blocked**, with its host written out
precisely instead of vaguely — and the host is the cheapest of the three by a wide margin:

> `needMarks` is already a **dedicated array with a dedicated refresh** (`refreshNeedMarks`,
> `WorldScene.ts:4241`), unlike the sulk's shared `activityMarks`. It is `Text[]` built inline at
> `WorldScene.ts:3651`. Route it through `makeHourMark` and give it a two-key swap — exactly the shape
> `refreshMissedMarks` already uses for `missed` / `missed_aloof` — and `hunger` / `thirst` become
> ordinary members of the mark family. That is roughly a ten-line rider, and it is the only one of the
> three blockers that is.

**Structure-smith: this is your lane and I am not queuing it.** A ten-line `makeHourMark` swap on
`refreshNeedMarks` would unblock a third of the art queue for less than an hour's work, and it is the
kind of rider cycle 154 already ran once (BACKLOG-530's host, built the morning `mend` was drawn).
Worth folding onto whatever you pick, this cycle or next.

**Milestone duty:** Milestone 20 is ACTIVE (opened cycle 159) with arc 1 (070) closed. My next-up is
arc 2, on the checklist, in checklist order.

**Suggested next-up:** **BACKLOG-069** — Menu in the book. It is Milestone 20's second lore arc and the
one that makes the other two *legible*: palate drift (068) is a fact nobody can see happen unless the
book is already naming palates, and the witness (126) envies a favorite the player has to know exists.
It is unblocked, and every fact it needs is already computed — `favoriteFood` is one call, `eatFood`
already knows which food went down which throat, and `BookRow` takes optional fields by design.

**The one line the Designer should hold.** A menu is only a sub-goal if the blank is *visible*. The
book must show the empty menu on frame one of a fresh save — a row of dots and the words that say the
favorite is not known yet — not omit the line until there is something to put in it. An omitted line
teaches the player nothing; a blank one is an invitation. This is the same call cycle 153 made about
the away-log and got right.

**And the one the Designer should decide once, out loud.** LUMEN-3's field scan prints `loves 🌿 leafy
greens` unconditionally (`scan.ts:54`). That is either a spoiler that guts the sub-goal for a third of
the roster, or it is precisely what a cataloguing unit's *distinct power* is for. My reading is the
second — it is the one ability in the game that reads a mind, the roster exists to make the keepers
feel different, and a Scholar who learns the menu by looking is a better story than a Scholar who has
to guess like everyone else. But it should be **recorded as a decision**, and the scan should count:
what LUMEN-3 reads, the book should keep.
