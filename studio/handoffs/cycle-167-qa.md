# Cycle 167 — QA

**Board.** `npm run build` clean. `npx vitest run` — **3012 passed, 3 skipped, 282 files**.
`npx --yes kill-port 5173` then `npx playwright test` — **819 passed** on the verification run.

**One flaky first run, named rather than swallowed.** The first full e2e pass came back 817 passed /
2 failed: `cycle-045-chorus` ("muted: the order still computes but nothing plays") and
`cycle-074-shelter` ("the grove raises a lean-to and never a cairn"). Both died in `boot()` —
**074 waiting on `locator('canvas')` to become visible, with no exception behind it**, which is the
BACKLOG-553 signature exactly as cycle 166 characterised it (a stall, not a slow boot; three hangs
caught, all three waiting on canvas with nothing thrown). Both passed isolated at `--workers=1`, and
a clean full re-run came back 819/819. Recorded as the known parallel-load flake, not a regression —
and recorded *specifically*, because "a lone spec re-run green" is the note the routine asks for and
a named victim is the thing 553 shipped an instrument to get.

The chorus spec is worth one extra line, because it is the one spec on the board that touches this
cycle's lore track. It asserts that a **muted** dawn chorus leaves `__lastSound()` null. That is the
assertion the new hail could plausibly have broken, so it was checked against on purpose rather than
waved through: it is green isolated and green on the clean full run, and the reason is structural —
`hailAndAnswer` sets `lastSound` only inside `if (!soundMuted())`, and the delayed answer re-checks
mute when it fires.

---

## Lore track — BACKLOG-193

| # | Criterion | Verdict |
|---|---|---|
| L1 | `answerDelayMs` runs 780 → 90, monotone non-increasing, clamps out of range | **PASS** (unit, 3 assertions incl. "it genuinely moves") |
| L2 | A fond answer is shorter, no less bendy, no fewer pips; the extra pip arrives exactly at the threshold | **PASS** (unit, over the whole name-seeded cast) |
| L3 | `answerParams(t, 0)` is byte-identical to `chirpParams(t)` | **PASS** (unit, every dino) |
| L4 | Pitch drift under 10% at every heart, and the cast's pitch ordering at 10 hearts equals its ordering at 0 | **PASS** (unit) |
| L5 | The hail is above anything `chirpParams` can produce, is not `THUNK`, and is plain | **PASS** (unit — asserted against the formula's 900 Hz ceiling, not against today's roster) |
| L6 | Greeting records `__lastAnswer()` with name, hearts and delay | **PASS** (e2e) |
| L7 | `__lastSound()` is the hail immediately, the dino's own call after the gap | **PASS** (e2e, polled) |
| L8 | **Reachability** — greet, read the delay, greet until a heart crosses, delay is strictly smaller | **PASS** (e2e, no save edit / no clock skip / no seeded friendship) |
| L9 | Muted: playback silent, beat still recorded | **PASS** (e2e) |
| L10 | The reply dialog still appears on the same frame | **PASS** — inferred from the board, not from a new assertion: every existing greet, tone, dialog-paging and touch spec is green **unedited**, including `touch-controls` "Talk opens the tone menu and a chip picks the tone" and `mobile-minds` "long dialogs page GBA-style". That is a stronger claim than one new timing assertion would be. |

**10/10 pass.**

### The ten-minute question (CHARTER v7)

*In a fresh save, watched for ten minutes, what does the player hear that they could not before?*

On the **first** greet, before any friendship exists: a sound the game did not contain yesterday. The
keeper calls — a plain two-pip hail at 1020 Hz, above the whole cast — and the dino answers roughly
three-quarters of a second later. Until tonight there was one flat chirp, on the frame of the reply,
identical for every dino at every bond.

Within the **first minute**: `greetGain` is 3–8 points a greet against a 10-point heart, so a handful
of hellos to the same dino crosses the first one and the pause measurably shortens. The e2e spec does
exactly this and nothing else — it is the reachability criterion rather than a proxy for it.

Gated on nothing: no clock boundary, no population floor, no threshold the founding park sits under.

---

## Structure track — BACKLOG-558

| # | Criterion | Verdict |
|---|---|---|
| S1 | `plaqueLines` unchanged in signature and output | **PASS** — `tests/unit/plaque.test.ts` and every plaque-reading e2e spec are green **unedited** |
| S2 | `plaqueLineKind` splits the brass correctly | **PASS**, with a correction (below) |
| S3 | One `Text` per line inside a container, not one multi-line `Text` | **PASS** (e2e) |
| S4 | Rows read top-to-bottom exactly as `plaqueLines` writes them; nothing stale when the count shrinks | **PASS** (e2e, both halves — the second by crossing to the grove and re-reading) |
| S5 | Keeper lines render a different colour on a fresh save's first frame | **PASS** (e2e: stat colours are exactly `{#f4d58d}`, keeper colours are one value and not that) |
| S6 | `__plaqueRows()` reports what is drawn | **PASS** — and see the note below, it earned its keep within the hour |
| S7 | The plaque still fades with the HUD in ambient mode | **PASS** — `idle`/ambient specs green unedited; `hudElements` is typed structurally as `{ setAlpha }` and a `Container` satisfies it |
| S8 | Same anchor, panel behind, sized to the widest line | **PASS** — panel colour/alpha/padding reproduce the old `Text` background exactly; the container sits at the identical coordinate with `setOrigin(0.5, 1)` on the panel |
| S9 | Every existing plaque spec green **without edits** | **PASS** — `cycle-024-plaque`, `-154-streak`, `-154-upkeep-line`, `-156-sitting`, `-159-satchel`, `-164-watch`, `-059-connected-zone`, `-063/-076/-082-stockpile`, `-075-zone-indicator`, `-085/-088-third-zone`, `controls-help`. Not one line changed. |
| S10 | 539 is unblocked in fact | **PASS — host named below** |

**10/10 pass.**

### S2 — the correction

**The design doc says the brass carries eight lines. It carries nine.** `plaqueLines` pushes two
mandatory lines plus seven optional ones (Stores, Satchel, Zones, Upkeep, Watch, Sitting, Keeper), so
the split is **six park lines to three keeper lines**, not five to three. The unit spec caught it on
its first run, and it caught it because it counts off `plaqueLines` rather than off the prose — which
is the same discipline S6 asks for one layer up. The three keeper lines are unchanged and correct;
only the arithmetic in the write-up was wrong.

### S6 — the hook earned its keep immediately

The first version of the brass e2e spec was **flaky**, and for the right reason. The plaque
re-engraves on the world clock's tick, so `__plaqueRows()` reports the last rendered frame while
`__plaqueLines()` computes from the park as it stands *now* — and between two ticks a pile gets
gathered and the two legitimately disagree. That disagreement is proof the hook is reading the
**display objects** and not quietly recomputing the answer, which is exactly what S6 was written to
guarantee after cycle 163. Resolved with no new scaffolding, by forcing a render through `__setZone`
at the zone the keeper is already standing in (it has called `refreshPlaque` since BACKLOG-143).

### S10 — the host, named for the Artist

**BACKLOG-539 is unblocked.** The plaque's `Keeper · <streak>` line is now its own
`Phaser.GameObjects.Text`, reachable at `WorldScene.plaqueRows[i]` where
`plaqueLineKind(plaqueRows[i].text) === 'keeper'` and the text starts `Keeper · `, and observable
from a spec through `__plaqueRows()`. It is laid out at a fixed `PLAQUE_PITCH` inside
`this.plaque` (a `Container`), so an `Image` can be added as a sibling child at that row's `y`
without disturbing any other line.

**And the honest caveat, in the shape the last two corrections took.** This is the host for an
engraved *register beside the line*. It is **not** a `makeHourMark`-style `Text`→`Image` swap: the
rows are typed `Phaser.GameObjects.Text[]` and nothing consults `hasPropArt` on that path. If 539's
engraving is drawn as a **glyph placed next to the streak row**, it lands tonight. If it is drawn as
a **replacement for the row's text**, it needs one more rider. The cycle-156 and cycle-157
corrections were both made because a routine asserted a host existed without checking which kind it
was; this is that check, made before the claim rather than after it.

---

## Charter checks

- `@mlc-ai/web-llm` imported only under `game/src/ai/` — verified by grep, zero hits elsewhere.
- Additive save changes only — **neither track persists anything**. No save field added, no version bump.
- `main` is green and the tree is clean.
- **The browser preview could not be opened** (this session is unattended and dev servers cannot be
  started from one), so every visual claim above rests on the Playwright board, which drives the real
  scene and reads the real display objects' colours rather than a screenshot.
