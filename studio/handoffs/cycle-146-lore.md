# Cycle 146 — Lore Handoff

**Theme: the park keeps hours, and not everybody keeps the same ones.**

Milestone 16 ended by making the park's *stock* into things you can walk to. The thing it did not
touch is *time*: BACKLOG-493 gave the park a 24-minute in-game day back in cycle 137, which means a
whole day and a whole night now fit inside a session — and almost nothing in the park behaves
differently at either end of it. Five dinos wake, five dinos sleep, all five on the same schedule,
because the schedule is the clock's and not theirs. That is a sameness bug by the CHARTER's own
Living-minds line, and it is sitting on top of the single largest reachable surface the studio has
built and never spent.

So Milestone 17 is **A day in the park**: the day stops being a tint and a number in the corner and
becomes something with a shape — who is up when, what gets done between dawn and dusk, and what it
costs to fetch what the day needs.

## Milestone duty

Milestone 16 shipped at cycle 145 and the file was left with no ACTIVE milestone. **Milestone 17
drafted** in `studio/MILESTONE.md` — headline plus the three Lore arcs below. The Structure-smith
adds the Structure arcs in the next fire.

## The cap rule

- **Social/emergent queue: 214 open ≥ cap 12.** No new social items seeded. This cycle is themed and
  drained from the queue, as it has been for every cycle since 135.
- **Art queue: 1 open (518, held) < cap 3.** One `[art]` item seeded — and seeded *with a host*, per
  the cycle-145 amendment. Its host is this cycle's own lore pick, which ships before the Artist fires.

## Added to BACKLOG

- BACKLOG-520 [art] **Asleep in the wrong hours** — the two-frame behaviour glyph for 109's split.

## Suggested next-up: BACKLOG-109 — diurnal vs. nocturnal temperament

Queued at cycle 28, never picked, and the reason it was never picked was honest: with a 24-hour
in-game day it was a feature you could not stay awake for. `ACTIVE_SCALE = 60` retired that
objection eight cycles ago and nobody went back for the item it unblocked.

The pick, in one line: **a dino's energy/curiosity seeds whether it is a day-dino or a night-owl, and
the two halves of the cast keep different hours.** Night-owls are up and wandering while the rest
huddle; day-dinos doze through it. The read the player gets is the one the Living-minds line asks
for — *who is up when* is a personality tell you can see from across the field, with no lens, no
book, and no model.

**On reachability, and this is the part the Designer must not soften.** A fresh save opens at day 1,
08:00. At 60× that is twelve real minutes to nightfall, which is *outside* the ten-minute window the
CHARTER v7 bar is measured in. An item that only reads after dark is an item tuned to be dormant, and
the corollary says that is a defect and not a subtlety. **The split must therefore read at both ends
of the day**: at 08:00 the night-owls are the ones still down while the day-dinos are already up and
moving — same system, opposite sign, visible on frame one. Build the morning half first; the night
half is the same table read backwards.

Two things it deliberately is not: not a wander-pull rewrite (the existing wander/huddle weights get
biased by an awake/asleep state, they do not get replaced), and not an LLM beat — the temperament is
seeded deterministically off traits the cast already carries, so it is identical under `stub`.

**Idea Box:** empty (no open entries).

**Noted for the Structure-smith:** three of the four open Structure Track items — 515 (the runner's
serial/parallel split), 519 (the day nobody exports), and the clock question inside 493 — are all
*about time*, which is Milestone 17's own subject. If the milestone's Structure arcs want a spine,
"the park's day is one number, owned in one place, and the suite can wait for it" is sitting right
there. 509 (the tithe) is the other, and it is the one with a player watching an errand at the end
of it.
