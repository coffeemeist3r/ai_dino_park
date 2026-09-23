# Cycle 166 — Structure Handoff

**Intent:** Take BACKLOG-553, the top of the Structure Track, and take it as the item the cycle-161
numbers actually described: **a boot that dies at 30,000ms is ~34x its own p95, so it hangs — it is
not slow.** 538 shipped the clock and the clock retired 538's own hypothesis. What 553 asks for next
is not a faster boot; it is an instrument that catches the hang *with a victim attached*, because
today the suite's clock only writes on the **success** path, so the one boot per run that matters is
the only one that leaves no record at all.

**Added to Structure Track:** none — drained from queue (4 open, X = 4). Per the cap rule the queue is
at exactly its target depth, so this fire picks rather than brainstorms.

**Chosen this cycle:** **BACKLOG-553** — the boot that hangs, not the boot that is slow.

## Solo cycle: NOT declared, deliberately, and this is the third cycle it has been eligible

The mechanics all pass. `cycle - lastSoloCycle` is **15** (166 − 151), 553 is **top of the track** as
of last cycle's reorder, and it has been passed over for scope repeatedly with the queue's own text
saying so. The chronicle has recorded it as "the solo-cycle candidate" for three cycles. It is not
being declined for lack of eligibility.

It is being declined on **CHARTER v8 condition 4**, which is the one that decides this. A solo cycle
buys the item a whole Coder fire and *nothing else* — explicitly not an exemption from the
reachability bar. The part of 553 that would actually consume a whole fire is the open-ended hunt
through three candidate stall mechanisms, and hunting is not shipping: it could burn the cycle and
close with a diagnosis rather than a diff. Meanwhile the part that is **bounded, certain, and
unblocks the hunt** — closing the failure-path gap the item names first and by name — fits beside a
lore track without collision, and it is the step 553's own text says to start with: *"Start by making
the harness catch one."*

The cost of declaring one here is also concrete and not hypothetical: it would sit out
**Milestone 21's last unchecked arc** (BACKLOG-162) for a diagnostic that does not need the room.
A solo cycle is the escape hatch for debt the queue has proved it cannot drain. 553's *first* step
drains fine at normal width. If the hunt that follows this instrument turns out to need the whole
cycle — and it may, once there is a captured victim to hunt with — the next declaration will have
evidence, and `lastSoloCycle` will still be 151.

## The reachability half — and it is the same mechanism, not a bolt-on

An instrument is test-only, and "nothing — it is infrastructure" is a REWORK under v7, not an
exemption. So this item ships through the defect it is chasing, in the shape cycle 165 used when
BACKLOG-533 rode the sulk mark's host.

553's third and most honest candidate cause is worth quoting: *"a `WorldScene.create()` that throws
partway and so never reaches the line that sets `__ready` — which would present exactly as this flake
does, since `boot()` waits on that flag and the thrown error goes to a console nobody reads."*

**A console nobody reads is a player-facing defect too.** If `create()` throws halfway, the player is
looking at a blank or half-drawn canvas that never becomes a game, and the park says nothing — which
the CHARTER's quality bar already forbids in as many words: *"No silent failures."* So build one
mechanism and let both halves read it:

- The scene's boot is guarded. A throw is caught, recorded, and **said out loud on screen** — a
  legible notice in the park's own chrome, not a stack trace, telling the player the bowl failed to
  open and what went wrong.
- The same record is exposed as a dev hook, and the harness's `boot()` drains it on a timeout, writes
  its line with `readyMs: null`, the spec's label, which wait failed (canvas vs `__ready`), and the
  error — then rethrows so the spec still fails.

A hang *with* an exception behind it and a hang *without* one are indistinguishable today, and 553
says so. After this they are different lines in the log, and the first of them is also a sentence the
player can read.

*In a fresh save, watched for ten minutes:* a boot that fails now tells you it failed. The Designer
must make that demonstrable without asking a player to corrupt anything — the e2e proves it by forcing
the throw through a hook, and the notice must be the park's own voice, not `alert()`.

**No collision with the lore track.** 162 lives in keeper/ and memory/; this lives in the scene's boot
path, `tests/e2e/helpers.ts`, and `scripts/bootstats.mjs`. The one shared file is `WorldScene.ts`, in
different regions (`create()`'s opening guard vs. the greeting sites) — worth the Coder's attention,
not worth a re-pick.
