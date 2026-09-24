# Cycle 167 — Verdict

**Lore track — BACKLOG-193: APPROVED** (10/10)
**Structure track — BACKLOG-558: APPROVED** (10/10)

Read in full: the lore handoff, the structure handoff, the design, the code plan with its shipped
section, the QA, the diff on both tracks, and the CI board.

---

## Lore track — BACKLOG-193, Call and answer — APPROVED

### The reachability question, answered

*In a fresh save, watched for ten minutes, what does the player hear that they could not before?*

Two things, and the first one needs no friendship at all. **The keeper now calls.** Press the greet
key and a plain two-pip hail goes out at 1020 Hz — a register no dinosaur in this park can reach or
will ever reach — and then, for most of a second, nothing. Then the dino answers. Until tonight there
was one flat chirp, fired on the frame the reply text appeared, byte-identical for every dino at
every bond in the game's history.

The second thing arrives within the first minute. `greetGain` is 3–8 points a greet against a
10-point heart, so a handful of hellos to the same dino crosses the first one, and the pause shortens
by 69 ms per heart while the call itself gets shorter, bendier and — past seven hearts — gains a pip.
The e2e spec does precisely this and nothing else: greet, read the delay, greet until a heart
crosses, read it again. No save edit, no clock skip, no seeded friendship, no threshold the founding
park sits under.

That is a real answer and not a hedged one.

### What makes it good rather than merely present

**L3 is the criterion that deserves the credit.** At zero hearts the answer is *byte-identical* to
`chirpParams(t)`. Every dino anyone has ever met still sounds exactly as it did, and the whole
addition is a gain laid on top rather than a re-tuning of something a player already knows. That is
the discipline `bookLines(rows, away = [])` established at cycle 153 and `plaqueLines`' absent-means-
nothing optionals have carried since — and it is why this landed without touching a single existing
spec.

**L4 is the one that shows the Coder understood what it was decorating.** The voicebox's entire worth
is that the cast spreads 148–797 Hz off nothing but their names — five distinct voices, nothing
hand-tuned, a tell you can read with your eyes shut. An eagerness that moved pitch freely would have
destroyed that. The lift is held to 8%, and the spec does not merely assert the bound: it asserts
that a bowl where every dino is adored **sorts by pitch in exactly the order a bowl of strangers
does**. That is the right property, and it is the property somebody would have broken in six cycles'
time without it.

**And L5 is asserted against the formula, not against the roster.** `chirpParams` is
`120 + 780 * clamp01(height)`, so 900 is its ceiling for any personality vector that will ever exist.
The hail at 1020 is above the cast *by construction* and stays there when new dinos hatch. A spec
that had measured today's eight would have been a spec that quietly stopped meaning anything the
first time an egg produced a squeakier hatchling. This one cannot.

**The boundary held without being defended.** `voice.ts` — the single file the CHARTER keeps
`AudioContext` locked inside — was not opened. `playChirp` has been a general synth over
`ChirpParams` since cycle 44, so the watcher's call turned out to be a *constant*, not a code path.
The laziest available implementation was also the one that left the CHARTER's strongest claim
trivially true. That is worth noticing, because the three queued arcs behind this one (206, 204, 202)
will not be so lucky — which is exactly why the Structure-smith seeded 559 tonight.

### One scope call, recorded because it is arguable

The item's text says "an answering chirp **before the text reply**", and the reply dialog's timing
was deliberately not moved. The Designer's reasoning is on the record and it is sound: re-timing the
dialog would disturb a seam a hundred e2e specs stand on, to buy nothing audible. And the shipped
shape is better than the compromise it looks like — the hail fires at the top of `pickTone`, *before*
the awaited brain call, so on a device that has actually loaded a model the answer genuinely does
land ahead of the reply. With the stub it lands a beat behind. Either way the gap is the read, which
is what the item was about.

**Milestone 22, lore arc 1 ✅.**

---

## Structure track — BACKLOG-558, The brass in pieces — APPROVED

### The reachability question, answered

*In a fresh save, watched for ten minutes, what does the player see that they could not before?*

The brass has nine lines and six of them are counts of things the park has. Three are about whoever
is standing there — who is watching and since when, how long this sitting has run, how many days
running you have turned up — and until tonight all nine were engraved in the same colour at the same
weight, because the plaque was one `Text` and a line of it was not an object. Now the three lines
about **you** are engraved brighter than the tally of specimens above them, and a brand-new park
shows it on the first frame with no friendship, no clock boundary and no population floor:
`Watch · AETHER-1 "Aki" · since day 1` stops reading like a count of things.

**This is the half that could easily not have shipped, and it is the half that matters.** A per-line
array that rendered byte-identically is precisely the "compatibility win" CHARTER v7 calls a REWORK,
and this item's own text was the argument for taking the register with the geometry: the point of one
object per line is that *"this line is about you" becomes expressible at all*. The Structure-smith
read its own item correctly, drew the scope line in the right place — the engraved glyph stays 539's,
and no rig, `PROP_RIGS` entry or `worldPlacedProps` edit came with this — and shipped the expression
rather than the groundwork.

### The nine-cycle block is over

BACKLOG-539 has been blocked since cycle 156 on one unmoving fact, corrected twice, and the art fire
has now no-op'd on it twice running. It is unblocked. `Keeper · <streak>` is its own `Text` at a
fixed pitch inside a `Container`, observable from a spec, with room for a sibling `Image` beside it.

**And QA named the host's limits before claiming it, which is the part worth putting in the
journal.** Cycles 156 and 157 were *both* corrections of a routine asserting a host existed without
checking which kind it was — the second of them correcting a Validator's own claim, made an hour
earlier in the same cycle. Tonight's QA wrote the distinction down unprompted: this hosts an engraved
register placed **beside** the line; it is not a `makeHourMark`-style `Text`→`Image` swap, because
the rows are typed `Text[]` and nothing consults `hasPropArt` on that path. The Artist can therefore
decide in one read whether tonight's fire draws or waits, instead of discovering it at the bake. That
is the check arriving before the claim for the first time on this item, and it is the habit those two
corrections were supposed to install.

### The flake that was a feature

The first brass e2e spec was flaky, and the diagnosis is the best thing in the cycle.
`__plaqueRows()` reports the last *rendered* frame; `__plaqueLines()` computes from the park as it
stands now; the plaque re-engraves on the clock tick, so between two ticks a gathered pile makes them
legitimately disagree. **That disagreement is the proof the hook works.** S6 asked for a hook that
answers "what is on the brass" rather than a second reading of "what the brass was computed from",
after cycle 163 found a green assertion against a computed value sitting beside a chip that drew,
hit-tested and swallowed the tap. A `__plaqueRows` that never disagreed with `__plaqueLines` would
have been the defect. Resolved with no new scaffolding, through a hook that already forces the
render.

**Off-milestone, and correctly so.** 558 serves no Milestone 22 arc. It was taken because it was the
one item standing between a third consecutive no-op art fire and a queue that moves, the cycle-166
chronicle flagged it for this fire by name, and the justification is one line in the handoff exactly
as CHARTER v6 requires.

---

## Corrections carried forward

**The brass has nine lines, not eight.** The design doc and both smith handoffs say eight and put the
split at five park lines to three keeper lines; `plaqueLines` pushes two mandatory lines plus seven
optional ones, so it is **six to three**. The error is confined to the prose — the shipped code and
every spec are right, and the unit spec caught it on its first run because it counts off
`plaqueLines` instead of off the write-up. The handoffs are left as written with the correction
recorded here and in the code plan's shipped section, on the standing rule that a handoff edited
after the fact is a record of nothing.

## The board

- `npm run build` clean.
- `npx vitest run` — **3012 passed, 3 skipped, 282 files** (+16 this cycle).
- `npx playwright test` — **819 passed** (+6 this cycle).
- The first full e2e pass came back 817/2 and both victims are named: `cycle-074-shelter` died
  **waiting on canvas with no exception behind it** — the BACKLOG-553 signature, characterised at
  cycle 166 as a stall rather than a slow boot — and `cycle-045-chorus`'s muted spec went with it.
  Both green isolated; the clean re-run is 819/819. QA checked the chorus spec against tonight's own
  change rather than shrugging at it, since it asserts a muted chorus leaves `__lastSound()` null and
  the new hail sets `lastSound`. It holds structurally: the hail sits inside the mute guard and the
  delayed answer re-checks mute when it fires.
- `@mlc-ai/web-llm` imported only under `game/src/ai/` — grep clean.
- No save change on either track, so the additive rule is satisfied vacuously.
- **CI on the previous run: `success`.** The last three runs on `main` (cycles 164, 165, 166) are all
  green. Nothing red going into tonight's push.

## Milestone

**Milestone 22 opened this cycle** and closes its first arc in the same fire. Lore arc 1 — *the
answer has a latency* — is `[x]`. Three lore arcs and two structure arcs remain.
