# Cycle 148 — QA

**Gates, run against the committed tree, all three, in both load conditions:**

| gate | result |
|---|---|
| `npm run build` | clean |
| `npx vitest run` | **2371 passed**, 3 skipped, 228 files |
| `npx playwright test` (parallel) | **649 / 649 passed** (5.4m) |
| `npx playwright test --workers=1` | **649 / 649 passed** (7.9m) |

**No standing red, at either extreme of load.** That is the first time in this project's recorded history,
and it is BACKLOG-515's actual deliverable rather than a side-effect of tonight's features.

`@mlc-ai/web-llm` boundary: `grep -rn '@mlc-ai/web-llm' game/src --include=*.ts` outside `game/src/ai/`
returns nothing. Save format: **no new persisted field on either track** — both reads are derived from the
clock and name-seeded traits on every frame, exactly as the chronotype they come from is.

---

## Lore track — BACKLOG-110 / -279: 13 / 13 criteria pass

| # | criterion | result |
|---|---|---|
| 1 | `roused` inside the rest window, both chronotypes | **pass** — plus a season sweep over `restWindow(day, s).start` |
| 2 | 08:00 spring: day-dino `fresh`, owl `roused`, asserted through `restWindow` | **pass** — the test reads `SEASON_HUDDLE.spring.end`, not the literal 8 |
| 3 | quarter boundaries derived, not fixed | **pass** — the owl's `fresh` sits at `(wake + OWL_SHIFT) % 24` and the day-dino is *not* fresh there |
| 4 | `null` mid-span (day-dino 13:00) | **pass** |
| 5 | `nightlong` beats `waning` | **pass** — the test first proves 03:00 *qualifies* as waning, then asserts it reads `nightlong` anyway |
| 6 | twelve distinct `hourAside` lines | **pass** — `new Set(lines).size === 12`, all leading ` …` |
| 7 | **byte-identical with no `standing`** | **pass** — see the note below |
| 8 | composes onto generic / wistful / fond / grateful | **pass** |
| 9 | BACKLOG-279: fond hello carries designation + hour in one line | **pass** |
| 10 | e2e frame one, no clock touched: `fresh` tell on a waking Bowl dino | **pass** |
| 11 | e2e frame one: `roused` tell on the sleeping owl, differing from 10 | **pass** |
| 12 | e2e: `nightlong` at 23:00, differing from mid-day | **pass** — mid-day is also asserted *silent*, which is criterion 4 read from the game |
| 13 | WebLLM preamble carries the standing | **pass** — unit (`buildMessages`) and e2e (`__greetPrompt`) |

**On criterion 7, and QA raising it on itself.** The byte-identity pin as first written compared the
*generic* canned greeting to itself. The generic register picks one of four hellos on `rand()`, so it can
never equal itself twice — it passed in file isolation on a favourable RNG state and failed in the full
suite. **The claim was right and the test was wrong**, and it was repaired by asserting over the three
deterministic registers (wistful, fond, grateful) rather than by loosening what was being claimed. Worth
recording because the opposite repair — softening a byte-identity assertion to a `toContain` — is the one
that would have quietly retired the strongest criterion on this track.

---

## Structure track — BACKLOG-524: 10 / 10 criteria pass

| # | criterion | result |
|---|---|---|
| 1 | `wakingIn` counts only the awake; zero, not absent, for a sleeping ground | **pass** — `'ridge' in at8` asserted explicitly |
| 2 | shipping roster at 08:00, derived: bowl 4 / grove 1 / hollow 1 / **fernreach 0 / ridge 0** | **pass** — built from `ROSTER` + `seededPersonality`, so a spawn-zone or trait change breaks it |
| 3 | same at 13:00: fernreach 1, ridge 1 | **pass** — plus `every(n > 0)` |
| 4 | `keepsWatch` — lone waker yes; two awake, none awake, solo resident: no | **pass** |
| 5 | a fully-asleep ground does not spawn where it did before | **pass** — 200 forced rolls, both grounds still empty |
| 6 | **regrowth still runs for a sleeping ground** | **pass** — the `workRegrowth` line sits outside the gate; verified by reading the diff and by criterion 5's grounds recovering into criterion 3's spawns |
| 7 | e2e frame one, no clock touched | **pass** |
| 8 | e2e at 13:00, inside the ten-minute window | **pass** — the same 200 rolls now land |
| 9 | Grove watch line + memory, sounding once | **pass** — second `__checkWatch()` returns `[]`, the dedup |
| 10 | old save loads identically; no new persisted field | **pass** — the save specs are green and neither track adds a field |

**Two things QA raises before the Validator does.**

**The watch beat is smaller than the seam it ships beside.** The gather change is the item; the watch is a
ticker line, a bubble and a memory. It is a real tell and it is deduped properly, but it is not a *system* —
an owl on watch does not yet do anything a dino off watch would not. The design said so and scoped it that
way deliberately; recorded here so it is judged as what it is.

**One outcome came out better than the criteria asked.** Criterion 4's "not owl-exclusive" clause was
written as a design preference and turned out to be load-bearing: the unit test shows the *same* Grove pair
swapping the role at 03:00 — Bramble watches over Pip at eight in the morning, Pip watches over Bramble at
three. A trait-keyed design would have gone dark for eight hours a day and nobody would have noticed.

---

## Rider — BACKLOG-515: pass, and the fix moved layer mid-cycle

Acceptance was "the four catalogued specs pass at `--workers=1` and the full parallel run is green."
**Both hold, and the second half of that sentence turned out to be the weaker claim.**

The plan applied `settle` per seam. That fixed the four catalogued specs — and then each fresh serial run
produced a **new** victim that had never been catalogued: `cycle-044`'s M-mute seam, then `cycle-038`'s
talk-path test, then `cycle-132-soothing-tic`. Six specs fixed one seam at a time, a seventh on the next
run. **The victim moves because the race belongs to the runner, not to any spec** — which is precisely what
this item has said since cycle 130, arrived at again from the other direction.

So the fix was moved to the root: `boot()` now patches `page.keyboard.press` and `page.mouse.click` on that
Page once, so every input waits two frames for Phaser's update step to have run. **Every per-spec `settle`
call was then reverted** — the four catalogued specs are byte-identical to their committed versions, and the
whole rider is one file. That is the difference between patching the callers and fixing the shared
function, and QA notes it because the first version of this rider would have passed its own acceptance
criteria while leaving the mechanism in place.

**The class was also wider than the item's own description.** Three seams were input-*after*-input, not
read-after-input: `KeyE` opening the tone menu and `Digit1` picking from it in the same frame, so the pick
landed against a menu that was not open and the tone was never chosen at all. The `expect.poll` that
followed then timed out on a beat that had never been requested — which is why two of the catalogued specs
failed **despite already polling**. A poll cannot recover an input that was dropped, and that is the
sentence that explains four cycles of failed re-diagnosis.

**What it is not.** Not a game fix. A real player's ArrowLeft turns the page on the next frame, sixteen
milliseconds later, and that is correct behaviour. No game code was touched for it.

---

## Regressions found: none

The 649-spec suite is green in both directions. `cycle-147-down-pose`, `cycle-147-dream` and
`cycle-146-hours` — the three specs nearest this diff, since both tracks read the module they pinned — all
pass unchanged.
