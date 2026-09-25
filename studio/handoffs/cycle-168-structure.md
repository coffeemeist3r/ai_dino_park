# Cycle 168 — Structure Handoff

**Intent:** Take the milestone's first structure arc while it is still the thing the lore track is
about to need. `audio/voice.ts` builds a fresh `oscillator → gain → ctx.destination` chain for every
single call and multiplies a module constant in at the envelope, so **there is no object in this park
that represents how loud the bowl is**, and no seam where a call's loudness can be decided by anything
but the call itself. Three queued arcs want exactly that seam (206 distance, 204 a cry that carries,
202 a reply from across the bowl) and today each would have to reach into the pip loop and scale the
envelope — three copies of the same arithmetic inside the one file the CHARTER keeps WebAudio locked
in. Ship the bus.

**Added to Structure Track:** BACKLOG-562, BACKLOG-563 — the queue stood at **3**, below X=4, so this
fire brainstorms before it picks. Both came out of reading the four `playChirp` call sites rather than
out of a wishlist, and both are the same shape as tonight's pick: a thing the park does in four places
that it has no single place to do.

- **562 — the voice has no clock.** The park's only deferred call is 193's answer, a bespoke
  `this.time.delayedCall` in `WorldScene` with its two guards written inline. Milestone arcs **200**
  (near-unison) and **198** (a beat late) are *entirely* about when a call happens, and taken as
  written each adds another copy. 200's interleave cannot be expressed by `delayedCall` at all —
  `playChirp` computes per-pip start times where nothing can reach them.
- **563 — three last-sound fields, three different rules.** `lastSound` is written only when unmuted;
  `lastAnswer` and `lastDistress` are written unconditionally and say why. Both rules are right and
  which one applies is decided per call site, so a spec can pass on a silent park — v7's defect class,
  one layer down.

**Chosen this cycle:** **BACKLOG-559** — one bus for every voice. It is the top *milestone* item in
the queue; 552 and 557 sit above it in the ordering and are both deliberately passed tonight, 552
because the More-sheet ceiling is not a Milestone-22 item and 557 because its own seed text calls it
"the `mope`/`sulk` shape and nothing more" — neither is urgent and both keep.

**On the file collision with the lore track — taken deliberately, not overlooked.** The routine says
to avoid a structure item whose files obviously collide with the Lore-smith's pick, and BACKLOG-195
(cry in the book) lands in `audio/` too. This is the one case where the rule reads backwards: 195's
cry is played from a menu, with **no world position at all**, which makes it the bus's cheapest and
most honest second consumer and an early test of whether `gainFor` can express "no distance" without
a special case. The Coder builds the bus first and 195's call site rides it in the same fire. If the
two-track fire turns out to contend, the seam to split at is `audio/mix.ts`: it is pure and has no
dependency on the book.

**Not a solo cycle.** `cycle - lastSoloCycle` is 168 − 151 = 17, so one would be legal, and it is not
warranted: 559 is a one-file bus plus one pure module, splittable and small. The declaration is for
debt the queue has proved it cannot drain, and this queue is draining.

**The reachability half is not optional.** 559's own seed text says so and it is right: a bus nothing
modulates is groundwork, and CHARTER v7 calls groundwork a REWORK. It ships with one live consumer in
the same fire — the bowl's glass rap and a dino's call stop sharing one flat level, which is audible
on the first knock of a fresh save.
