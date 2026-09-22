# Cycle 165 — Lore Handoff

**Theme:** Give the watcher an inside. Milestone 21 has said from its first line that the park cannot
tell which observer is standing there; cycle 163 made the *first hello* differ and cycle 164 gave the
save somewhere to keep what it learns. What is still missing is the thing every dinosaur in the bowl
has had since BACKLOG-103 and the keeper has never had: a **self**. `Keeper.backstory` is one authored
line, it has existed since cycle 155, and — checked tonight — **it is rendered nowhere in the game.**
Four watchers with four written pasts, and a player has never read one of them.

**Added to BACKLOG:** none.

- **Social/emergent queue: 190 open ≫ cap 12** → no new social items. Drain, don't invent.
- **Art queue: 2 open (543, 539) < cap 3** → seeding is *permitted*, and declined, with the reason:
  the art queue's problem has not been depth for four cycles, it has been **hosts**. Both open entries
  are host-blocked on the same shape — a mark that is a bare `Text` rather than a `makeHourMark` — and
  a third blocked entry would make the queue look healthier while the Artist still no-ops. Tonight's
  structure track builds one of those two hosts. Unblocking beats seeding.

**Suggested next-up:** **BACKLOG-156** — per-keeper persona authored from lore.

It is one of the two unchecked lore arcs on Milestone 21, and it is the one the last two cycles were
clearing ground for. It has a slot to cache into (`KeeperRecord.persona`, shipped empty by 555 and
shape-matched to `SaveData.personas` so it needs no second migration), and `switchTo` has already
decided — and tested — that a persona does **not** survive a switch. So the two hardest questions 156
would otherwise have had to answer were answered for it last night, by a routine that was not building
it. The remaining arc, BACKLOG-162 (the switch noticed and missed), reads the same record and is the
better pick once a persona exists to be missed.

**Reachability, named up front so the Designer inherits it rather than discovers it:** the keeper's
authored self must be *read* by a player, not cached for a later item. `Keeper.backstory` going
unrendered for ten cycles is precisely the failure CHARTER v7 exists to stop, and shipping a second,
richer string into the same silence would repeat it exactly.

**Idea Box:** empty (no open entries).
