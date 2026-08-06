# Cycle 123 — Lore Handoff

**Theme:** *Who crosses, and who never does.* Milestone 11 opened by giving the chain **distance** (475) and
by giving a returning dino the place it just left (347). Both are about a single journey. This cycle asks
the question that only becomes askable once journeys accumulate: **over a life, how much of this park has
each dino actually walked?** The park has recorded crossings as facts — `seenZones` knows *where* a dino has
stood, `pioneers` knows who was first, `leftDays` knows *when* it left — but nothing anywhere counts *how
often*, and nothing turns the pile into a read on the animal. Five dinos have lived in this park for a
hundred and twenty cycles and not one of them has a word for whether it is a traveller or a stay-at-home.

**Added to BACKLOG:** none — the cap rule holds. Open unstarted lore-track items number well past 12; this
is a drain cycle, themed pick from the queue, no new seeds.

**Suggested next-up:** **BACKLOG-361 — grove regulars in the book**, taken at its generalized reading, the
same treatment 347 got last cycle and for the same reason. It was written when the grove was the only place
to be a regular *of* ("been to the pond 4×"). At four grounds, a per-destination tally is the small version
of a better fact: the chain now has a **near end and a far end**, so a dino's travel history has two honest
dimensions — how *often* it has crossed, and how *far* from where it started it has ever been. That second
one is only measurable at all because 475 shipped `hopDistances` last night. The item and the milestone arc
agree: *homebody or wanderer*, made legible in the collection book.

Concretely, the standing the Designer should aim at:

- **how often** — a per-dino crossing tally, incremented at both arrival seams (the visible `crossDino` walk
  and the instant relocate), persisted additively in the save.
- **how far** — the greatest hop-distance from the ground it *began* on that it has ever stood upon, read
  off `seenZones` (already persisted) through 475's `hopsBetween`. Derived, not stored: a fifth ground is a
  row, and a re-drawn map re-reads correctly instead of carrying a stale number.
- **one line in the book** naming the standing (homebody / wanderer / the band between), with the two
  numbers behind it, so the read is legible *and* checkable.

Note the deliberate asymmetry with 347: 347 is a *passing* read (it expires with the tenure window). This is
a **lifetime** read — it only ever grows. The book gains its first line about a dino's whole history of
movement rather than its current mood about movement, which is what makes it a standing rather than a beat.

**Idea Box:** empty — no open entries this cycle.

**Note for the Structure-smith:** this pick lives in the two arrival seams (`crossDino`, the instant
relocate), `bookRows`/`BookRow`, and one new pure module reading `seenZones` + `distance.ts`. It touches
**no** migration decision and **no** appeal maths — that whole lane (`zoneAppeal`, `pickMigrant`, the resist
damp) is left clear on purpose, since 476 (what a ground can hold) is the obvious milestone-advancing
structure pick and lives entirely inside it.
