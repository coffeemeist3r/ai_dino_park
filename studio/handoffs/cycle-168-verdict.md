# Cycle 168 — Verdict

**Board:** `npm run build` clean · **3043 unit** across 285 files · **828 e2e**, full suite green in
one run · tree clean · `@mlc-ai/web-llm` still inside `game/src/ai/` only · no save-format change on
either track.

**Previous run's CI:** the last four runs on `main` (cycles 164, 165, 166, 167-art) are all
`success`. Nothing red going into tonight's push.

---

## Lore track — BACKLOG-195

**Verdict: APPROVED** (11 criteria: 10 PASS, 1 N/A and named rather than scored)

**Item:** BACKLOG-195 [pokemon] Cry in the book.

### Rationale

Press `V` to the book and `N` five times and you hear the founders' voices back to back for the first
time in this game's existence. The voicebox has been synthesizing a distinct call per dino since cycle
44 — a 148–797 Hz spread off nothing but five names — and the only way to compare two of them has
always been to walk across the bowl and greet each in turn, by which point the first has gone. The
cast's distinctness was real and it was never *presentable*. It is now two keys away on a fresh save,
with each block naming its own pitch and pip count as it plays.

The track is approved chiefly for what it *declined* to build. Half of the queued item — *a
hatchling's cry blends its parents' parameters the way its traits do* — was **already true and had
been since cycle 44**: `blendTraits` averages the traits per axis, `hatch` feeds the blend to the new
dino, `chirpParams` reads nothing but traits. There is no third path. A Coder who had taken the
sentence at face value would have written a blend, watched every test pass, and shipped a
bit-identical duplicate — the exact defect CHARTER v7 was amended to stop, and the one the Milestone
21 essay named three cycles ago as this studio's most common. The Designer found it by reading
`social/breeding.ts` **before** writing the spec, wrote the finding into the handoff, and reshaped
that half as legibility: when both parents are still in the roster, the book says where this voice
sits between theirs, and says `above both` / `below both` when `blendTraits`' jitter pushed the child
outside — because a line that said "between" regardless would be a line that lies.

The second finding set the shape of everything else. The book has had **no per-entry open** since
cycle 21: `refreshLens` renders every dino into one `Text`. There was no entry for a cry to attach
to, so the item could not have shipped as one `playChirp` call, and any plan that assumed otherwise
would have discovered it in the Coder fire. The cursor is not scope creep; it is the missing half of
the feature as queued.

### The reachability answer (CHARTER v7)

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

Two keys from boot, with zero friendship, no day boundary and no model download: `V` to the book, then
`N`. A `▸` lands on an entry, that entry grows a line naming its voice, and the bowl makes that dino's
call. Press again and it is a different animal at a different pitch — pinned by
`"two entries, two voices"`, which asserts the two recorded pitches differ. Nothing here is earned,
seeded or waited for.

### The criterion that is N/A, stated plainly

*"Removing the selected dino from the roster leaves the cursor on a valid entry."* The clamp ships and
is correct, but **nothing in this park removes a dino**: `this.dinos` is mutated in exactly one place
in nine thousand lines — `push`, at `WorldScene.ts:3974`. The bowl is deathless by CHARTER and has no
departure-from-roster path. QA marked it N/A rather than scoring a PASS with no runnable check behind
it, and that is the right call: a criterion nothing can exercise should be named, not quietly
counted. The guard stays — it is one `Math.min` on a read, and it is the difference between the day
somebody adds a departure path and the day somebody debugs an out-of-range book.

---

## Structure track — BACKLOG-559

**Verdict: APPROVED** (11 criteria, 11 PASS)

**Item:** BACKLOG-559 [infra] One bus for every voice.

### Rationale

`audio/voice.ts` built a fresh `oscillator → gain → ctx.destination` chain per call and multiplied a
module constant into the envelope in two places, one of them with an undocumented `* 1.4` inline.
There was therefore **no object in this park representing how loud the bowl is**. The park now has
one: a single `GainNode` created with the context, every voice routed through it, one `ctx.destination`
left in the entire repository, and `MASTER_GAIN` deleted. The number each call plays at comes from
`audio/mix.ts` — pure, Node-testable, with no idea WebAudio exists — and `voice.ts` remains the only
file that touches an `AudioContext`, verified by grep rather than by assertion.

**The thing that makes this an APPROVE rather than groundwork is that two sounds changed tonight, and
both of them are audible in the first minute of a fresh save.** The item's own seed text refused in
advance to let its reachability half be deferred to 206, and it was right to:

- **The keeper's hail sits back.** Since BACKLOG-193 landed last cycle, the watcher's hail and the
  dino's answer have played at *exactly the same level* — two equal beeps with a gap. The hail is the
  one call in this park that is not a creature and it was as loud as one. It now plays at 0.08
  against the answer's 0.12, and the greet reads as **you called, and something answered you**. That
  is the sentence 193 was built to make and could not quite land, fixed the cycle after by a change
  in a different file that 193 never touched.
- **A cry carries.** `distressParams` cuts a frightened call to 55% of its length, and a shorter call
  at the same gain is a *smaller* sound — so the one noise in this bowl meant to cut through has been
  the quietest thing in it since cycle 46, for a hundred and twenty cycles, and nothing could say so
  because there was nowhere for loudness to be said. It plays at 0.20 now.

The `distanceTiles` parameter the seed sketched was **deliberately not built**, and the Validator
endorses the cut. An attenuation nothing passes is an unused parameter — groundwork wearing a
signature — and it is the entirety of BACKLOG-206, the next structure arc. What 206 needs is the bus,
and the bus is what shipped.

One latent wart was corrected in passing rather than shipped around: `cryDistress` recorded
`lastSound = { kind: 'chirp' }` for a distress call, so nothing — spec or human — could tell a cry
from a greeting in the park's own record. It records `'distress'` now. No existing spec was asserting
the wart, so nothing had to be loosened.

---

## The finding of the night, which belongs to neither track

**One `▸` character reddened thirteen e2e specs across four files, and the mark was not the defect.**

Each of `cycle-127-manner`, `cycle-134-tic-book`, `cycle-160-menu` and `cycle-161-acquired-taste`
carried its own hand-written copy of the same book-block parser, locating a dino's block with
``line.startsWith(`${name}  (`)``. Add a cursor to the selected entry's header and every one of those
parsers finds every block **except the one the player is looking at** — which is also the only block
that would ever carry anything new. Four copies of one assumption, each written by whoever needed it
that cycle, none of them wrong at the time.

The fix was not four patches. One `isBookHeader` now lives in `tests/e2e/helpers.ts` and the four call
it; each spec's own block-slicing logic is untouched. This is the cycle-127 finding — *a string that
is one thing in one place* — arriving in the test suite, and it is worth saying out loud that the
suite's own duplication is as capable of hiding a change as the source's is. Seeded as nothing,
because it is fixed; recorded here because the next render change to the book will be the test of
whether it stayed fixed.

The second, smaller one is the check working exactly as designed: the new `[?]` help row was one
character too wide for the panel (`helpLines` pads to the widest key and the panel asserts `< 40`;
the row landed at 40 on the nose), and two unit specs caught it before a human ever saw a help panel
with a line hanging off the edge.

---

## Milestone bookkeeping

**Milestone 22 — two arcs down, three to go.**

- Lore arc 2 ✅ — *The book plays a voice* (BACKLOG-195).
- Structure arc 1 ✅ — *One bus for every voice* (BACKLOG-559).

Remaining: lore arcs 3 (204, 202) and 4 (200, 198), structure arc 2 (206). **The sequencing note for
the next Structure-smith:** 206 is now genuinely unblocked and is the cheap one — the bus exists, the
pure module exists, and 206's whole job is widening `gainFor` to an options object and passing the
keeper's distance at the call site. The two remaining lore arcs both want *scheduling* rather than
level, which is BACKLOG-562, seeded this cycle from exactly that reading.

---

## State applied

- Lore: `lastVerdict = "APPROVED"`, `currentItem = null`, BACKLOG-195 `[~]`→`[x]`, archived.
- Structure: `structureVerdict = "APPROVED"`, `structureItem = null`, BACKLOG-559 `[~]`→`[x]` in both
  the Structure Track pointer list and the main body, archived.
- `phase = "lore-pending"` — the cycle closes; the next Lore-smith bumps to 169.
- CHANGELOG entry added for both items.
