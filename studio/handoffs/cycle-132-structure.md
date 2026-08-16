# Cycle 132 — Structure-smith

## Queue state

Structure Track holds **4 open** (484, 485, 486, 487) — exactly at cap X=4. **Drain, do not invent.**
Nothing brainstormed this cycle.

## Milestone 14 (spine half)

The lore half opened Milestone 14 on the tic. The spine half is the other unfinished thing Milestone 13
left standing: the council **decides** now (481 handed it the work priority), and it is still derived from
live banked tallies on every single read. Three arcs, in queue order, all already open:

1. **The seat has a term** (484) — the electorate changes on a date. This cycle.
2. **The other call goes to the council** (487) — the spend priority joins the work priority.
3. **The bill reaches the call** (485) — a derelict landmark pushes its own ground's decision.

484 first is not arbitrary: 487 hands a *second* decision to the same seats, and 485 adds a *third* input
to those decisions. Both make the flicker worse. Fix the flicker before adding load to it. And 482 shipped
last cycle specifically to give this item a folded module to put its field in — its own header says so.

## The pick — BACKLOG-484 [core] The seat has a term

> The council (479) is re-derived from live banked tallies on every read, which was harmless while a seat
> was only a badge on the lens. Once the seats **decide** (481), one dino banking one unit can flip a
> ground's work priority between two ticks, with nothing in the world marking that it happened. Give a seat
> a term: re-derive the council on a cadence (the in-game day boundary the discontent gate and spoilage
> already use), hold the seating between, and land a one-off ticker beat when the membership actually turns
> over — so a ground's electorate changes on a date rather than flickering. Persisted like the calls it
> sets, additive; a park whose council never changes reads exactly as it does today.

**The defect, precisely.** `workPriorityFor` (473/481) calls `councilFor(zone)`, which calls
`councilOf(this.standings())`, which calls `zoneCouncil` over a roster whose `foodBanked` figures change on
every harvest bank. The vote is therefore recomputed against a *different electorate* every time a hook asks.
`checkCouncilCall` only announces a **change**, so today the observable symptom is a 🗳️ ticker line that can
fire twice in ten seconds from nobody doing anything but gathering — and, worse, the silent version: the
ground's actual call swaps under a hook mid-tick with no beat at all, because two different callers within
one step can get two different answers.

**The shape.** One choke point exists and it should stay one. Every consumer — the lens 👥, the book seat
line, the vote, the dev hook — already routes through `councilFor` / `zoneCouncils`. Hold a seating there.

- A new pure module: the held seating, the re-derivation, the turnover diff, the ticker wording. Node-tested.
- WorldScene holds `seats` + the day they were seated, re-derives on the **in-game day boundary** via its
  own `clock.onHour` listener — the same live-only discipline `checkSpoilage` (455) and `checkUpkeep` (480)
  use, so a restore or an away-jump never fires a spurious turnover.
- A ground with no seating yet (a fresh save, before the first boundary) seats **live**, so boot is
  bit-identical to today and the first day's play is unchanged. The term begins at the first boundary.
- Persisted additively, two new optional save fields, both guarded the way `pioneers` is.

**What it must not do.** Not a new standing (482 owns the shape; this is a *when*, not a *what*). Not an
election — 487 is where the seats' decisions grow, not here. No new glyph: the turnover beat is a ticker
line, and 🗳️ is already the council's mark. And it must not touch `zoneCouncil`'s comparator — the whole
point of 482 was that the derivation lives in one place, and this item changes only how often it is asked.

## Handoff

- `state.structureItem` = **BACKLOG-484**
- Milestone 14 spine arcs written into `studio/MILESTONE.md`.
