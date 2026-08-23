# Cycle 138 — Structure Handoff

**Intent:** Close the last open structure arc of Milestone 15. **BACKLOG-489** is the
generalization of cycle 133's finding: a freshness gate keyed only by *where* something
happened cannot tell a first record apart from a first record *from a new cause*, so the
day a second cause is added to an existing gate, that cause is silently swallowed — and
swallowed most reliably for the population the second cause exists to cover. 485 hit this
and patched one branch by hand (`!seeding || lean === call`). This cycle the patch becomes
a seam.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-489** — one shared gate that distinguishes *seeding* from
*suppressing*, keyed by cause and not only by place.

## Scope correction the Designer must honour (read before planning)

489's text says "four freshness gates in this park now carry an implicit '…as decided by
whatever was here first'". I read all four. **The count is wrong, and the item must be
built against what is actually there, not against its own summary:**

- `lastWorkCallByZone` (481) — **is** a seed-silently gate. In scope.
- `lastSpendCallByZone` (487) — **is** a seed-silently gate, same shape, no 485 patch on
  it at all. In scope.
- The once-a-day discontent (471, `soundsDiscontent`) — `lastDay !== day` with `lastDay`
  null on a ground that has never sounded, so it **already fires on its first record**.
  Not a defect. Out of scope beyond a regression test.
- The gratitude fade (251, `whoClearedMyName`) — a ring-position *window*, not a
  first-record gate; nothing to port. Out of scope.
- One-visit-per-sorrow (226) — **does not exist**. `sympathyVisit` in `world/cold.ts`
  carries a `ponytail:` comment saying so out loud ("fires on every later meeting…the
  once-per-sorrow freshness gate is BACKLOG-226"). It cannot be ported onto a seam it has
  never been on. Out of scope; 226 stays queued.
- The rumor freshness (222/233) — no such gate in the source. Out of scope.

So: **two call sites, one pattern, one seam** — and the honest version of 489 is smaller
and sharper than its own description. Say so in the verdict; a backlog item that miscounts
its own blast radius is worth recording.

## The reachability answer (CHARTER v7 — this is the part that makes it shippable)

A pure refactor of two gates is bit-identical and would be a REWORK. It isn't one, because
keying the gate by **(ground, cause)** rather than by ground alone changes what a fresh
park says out loud:

> Today, a ground whose council has already called `gather` and *then* loses a landmark
> announces **nothing** — `lastWorkCallByZone[zone] !== call` is false, so the bill's line
> never fires even though a different authority just decided the same thing for a different
> reason. 485's own beat is unreachable in exactly the case it was written for.

With the gate keyed by cause, the bill is a distinct cause and speaks. **488 ships a
derelict landmark in the Grove on a fresh save**, so this is reachable inside a
ten-minute watch on a brand-new park, not a state that needs six residents or a day
boundary. That sentence is the verdict's reachability answer; the Coder must make it true
and QA must prove it from a fresh save.

**Collision check vs the lore track:** 421 works in `world/tic.ts` + the tic block of
`WorldScene`; 489 works in a new gate module + `checkCouncilCall` + `world/discontent.ts`.
Both touch `WorldScene`, in different regions. Clean.
