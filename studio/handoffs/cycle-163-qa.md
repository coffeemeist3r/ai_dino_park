# Cycle 163 — QA

**Gate: build clean · 2866 unit (+16) · 782 e2e (+12) · 0 failed.** One e2e failed once mid-cycle
(`cycle-105-brought-to-hatch › one escort at a time`), passed isolated, and a fresh full run came back
green — the known parallel-load flake, noted and not a regression. It is untouched by either track.

`grep -rn "@mlc-ai/web-llm" game/src | grep -v "^game/src/ai/"` returns nothing — the boundary holds.
`keeper/voice.ts` is pure (two numeric constants from `ai/brain.ts`, no Phaser, no inference).

Save changes are additive: `metWatcher` is **optional**, so a save without it round-trips to itself exactly
and an old save loads to an empty map — which correctly re-arms every dino's first impression rather than
failing.

---

## Structure track — BACKLOG-212: 17 criteria, 17 PASS

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `KEEPERS.length === 4`, `[3].id === 'kestrel'`, first three unchanged | PASS | `cycle-163-kestrel.test.ts` — "appends without disturbing the three that were there" |
| 2 | `designationOf` / `nicknameOf` parse the new name | PASS | same file — "parses through the existing address helpers with no special case" |
| 3 | 276/278 address escalation unmodified | PASS | same test, both sides of `NICKNAME_MIN` |
| 4 | `keeperFit` positive for solitary+cautious, negative for social+curious | PASS | "inverts keeperFit without keeperFit changing" |
| 5 | `keeperBonus` is 2 for the fit, 0 (never negative) for the misfit | PASS | "still only ever helps" |
| 6 | Kes likes a temperament no robot likes | PASS | "likes a dino no robot likes" — loops all three robots |
| 7 | `inspector` picks a different dino for Kes than for Aki | PASS | "inverts who crosses the bowl" |
| 8 | `canScan(KEEPERS[3]) === false` | PASS | "carries no scanner" |
| 9 | The picker lists four rows, the fourth naming Kes + Quiet Company | PASS | `cycle-163-fourth-watcher.spec.ts` — **see amendment 1** |
| 10 | `4` at the open picker selects Kes; confirm names it and its era | PASS | "pressing 4 at the open picker selects it" |
| 11 | `4` with no picker open changes nothing and throws nothing | PASS | dedicated spec, `pageerror` drained and empty |
| 12 | The choice survives a reload | PASS | same spec, post-`reload()` |
| 13 | `menuChips` at 4 / 3 / 0 | PASS | `cycle-163-kestrel.test.ts` — "draws one numbered chip per option" |
| 14 | 375px geometry, and `chipIdAt` resolves each chip | PASS | geometry in unit; resolution in `touch-controls.spec.ts` — **see amendment 2** |
| 15 | Tapping `[4]` selects Kes on touch; no `[4]` for the tone menu | PASS | `touch-controls.spec.ts` — **this is where the cycle's real defect was found** |
| 16 | Kes renders on the amber square, walk still animates | PASS | `__hasKeeperArt('kestrel') === false`; `cycle-047-art-lux` sweep confirms the anim key is `null` for Kes and unchanged for the three robots |
| 17 | `__hasKeeperArt('vex-0') === false` — the control is untouched | PASS | asserted in the new spec *and* still in `cycle-045-art-keeper` |

### The finding worth the whole track

Criterion 15 was the only one that could not be satisfied by any proxy, and it is the one that caught a
real bug. The first draft of the touch check asserted through a new `__numberedOptions()` hook — which
reported **4** for the picker and **3** for the tone menu, exactly as designed, and was green. Then the
criterion was met properly, with an actual `page.mouse.click` on the `[4]` chip, and it failed: the chip
drew, hit-tested, resolved to `pick4` — and dispatched nothing.

`dispatchTouchTap` carried `case 'pick1' / 'pick2' / 'pick3'` and no default. That was the **third**
hard-coded three in the picker's path, after the key bindings and `menuChips`, and by far the quietest:
the first two would have made the fourth row obviously inert, while this one produced a chip that looked
alive and swallowed the tap. It is now derived from the id, like the other two.

**The lesson is the one CHARTER v7 is about, one layer down.** A hook that reports the right number is not
the same as a button that works, and the difference was invisible until the test drove the real door.

## Criteria amended in flight — 2, both argued

**Amendment 1 (criterion 9).** The criterion said the picker "lists four rows". It does — but the dialog
**pages**, and `__dialogPage().text` is the visible page only, so the first assertion tested row 1 alone
and failed on a message that plainly contained the right text. `DialogBox.allText()` was added and the
spec reads the whole message. Two notes for the record: the picker has paged since cycle 37 (three rows
already overflowed), so this is not new, and Phaser's word-wrap inserts a break mid-phrase, so the reader
normalizes whitespace. Nothing about the feature moved; the criterion named a reader that could not see it.

**Amendment 2 (criterion 14).** The criterion asked that `chipIdAt` resolve each chip's centre to its own
id. There was no way to ask it from a spec, so `__chipAt(x, y)` was added rather than the criterion being
scored on the pure function alone. It is now used to prove the negative half — that `[4]` resolves to
`null` while the tone menu is open.

---

## Lore track — BACKLOG-160: 15 criteria, 15 PASS

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Non-empty, space-led aside for all four ids at three temperaments | PASS | `cycle-163-watcher-voice.test.ts` — iterates `KEEPERS`, not literals |
| 2 | All twelve lines distinct | PASS | `Set` size equals line count |
| 3 | Unknown id returns `''` | PASS | `vex-0` and `undefined` both |
| 4 | No-traits path is the plain line | PASS | direct equality |
| 5 | Composes onto generic, fond and wistful registers | PASS | `cycle-163-watcher-compose.test.ts`, one test each, plus gratitude |
| 6 | Byte-identical without `watcher` | PASS | **see below** |
| 7 | Watcher aside precedes the hunger tell | PASS | `indexOf` comparison |
| 8 | Nothing truncated relative to today | PASS | "cuts nothing when every aside fires at once" |
| 9 | `firstMeeting` / `recordMeeting`, including re-arm and non-mutation | PASS | three tests |
| 10 | Fresh save, no model: the reply carries the observer's aside | PASS | `cycle-163-first-impression.spec.ts` |
| 11 | Second hello has moved on, asserted as a **count** | PASS | filtered `__bubbleTexts`, `<= 1` |
| 12 | Switching observers re-arms and gives the *new* line | PASS | asserts the new tell present and the old absent |
| 13 | Observer 1 and observer 4 differ on the first hello | PASS | both in unit (`aki !== kes`) and e2e |
| 14 | `metWatcher` round-trips; an old save re-arms | PASS | e2e reload; save optionality proved by 2866 green units |
| 15 | WebLLM boundary | PASS | grep, above |

### Criterion 6 was the one that mattered, and it needed the code to change

The cap chain in `cannedReply` is eight `.slice()` steps (240 / 280 / 320 / 400 / 400 / 460 / 540 / 620).
Inserting a step without moving them would have truncated long replies — and **no existing test would have
gone red**, because a shorter reply is still a valid reply. The caps now read `N + headroom`, where
`headroom` is the watcher aside's own length and is **0 whenever no watcher is set**, so the existing chain
keeps its exact numbers and criterion 6 is met by construction rather than by luck.

Writing that test first also caught two things about the criterion itself. The mid-range register draws a
**random** line from the canned pool, so byte-identity can only be asserted on the deterministic registers
(0 and 9) — a hazard nothing in the spec anticipated. And a bogus `standing` value printed the literal
string `undefined` into a reply, which is a latent robustness note worth someone's attention but is not
reachable from the scene, which only ever passes `dayStanding()`'s output or nothing.

### Three specs went red as real consequences, and each was narrowed rather than deleted

- `cycle-037-keeper` pinned `toHaveLength(3)`. The roster is meant to grow; it now pins the roster's
  **shape** (every entry fully described, the default present) instead of a number that must be edited to
  add a keeper.
- `cycle-047-art-lux` asserted "no survivor on the square". That claim is now **false by design** — Kes
  ships undrawn exactly as the robots did at cycle 37. The sweep still pins all three robots and pins the
  undrawn set as exactly `['kestrel']`, so a *second* undrawn watcher would redden it. Both this spec and
  the matching unit test carry an explicit note: **BACKLOG-554 restores the whole-roster equality.**
- `cycle-131-mealtime` read `__dialogPage().text`. Longer greets pushed its line to page 2. It reads the
  whole message now. The reply did not change; the reader did.

The same care was taken with `tests/unit/keeperArt.test.ts`, which looped `KEEPERS` asserting every id had
a rig. Narrowing it to the three robots would have been a silent weakening, so a second test was added
asserting the undrawn set is exactly `['kestrel']` — named, so it reddens the day another watcher joins
mute.

---

## Two defects fixed in passing, both real

- **`openToneMenu` never closed an open keeper picker.** `openKeeperPicker` has closed an open tone menu
  since cycle 37; the reverse was never written, so both flags could be set at once. Not reachable from
  the live UI today (the picker is a dialog, and `E` on a dino does nothing while a dialog is up), but it
  is the kind of asymmetry that becomes reachable by accident, and `numberedOptions()` would have handed
  the tone menu the picker's chip count.
- **`DialogBox` had no way to read a whole message.** Every spec asserting on dialog text was reading the
  visible page and calling it the message. `allText()` exists now.

---

## Reachability — answered from the shipped build, not the design

**Structure.** Boot a fresh save, press `K`. There are four watchers where there have been three since
cycle 37, and the fourth is not a machine — its own era, its own reason for being here, and the roster's
first ability that favours the dinos the three robots all pass over. Press `4`, or tap the `[4]` chip on a
phone, and you are it. The dino that crosses the bowl to size you up is then the loneliest one in the park
instead of the friendliest, because `inspector` scores by `keeperFit` and the weights are negative. All of
that is behind one keypress from a cold boot.

**Lore.** Say hello to any dino on that same fresh save, with zero friendship earned, and it tells you what
it makes of you — that you hum, or that your red eye does not blink, or that you are writing it down, or
that you smell almost like family. Say hello again and it has moved on. Change your chassis and the whole
park looks you over again, one dino at a time.

Neither answer needs a refill, a day boundary, a population floor, or a founding constant moved. **Both
were unreachable before tonight**, and the lore half was unreachable *by construction* until the design
moved it out of `fondGreeting`'s eight-heart gate.
