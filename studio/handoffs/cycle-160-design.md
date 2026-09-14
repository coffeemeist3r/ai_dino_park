# Cycle 160 — Design

Two tracks. Lore: the collection book starts keeping a menu you have to earn. Structure: the phone
keeper gets the hatch selector, via a long-press on the button that already drops the food.

---

## Lore track — BACKLOG-069

**Item:** BACKLOG-069 [pokemon] Menu in the book — the collection book reveals each dino's favorite
food, but only after you've fed it that food once. A "fill in the menu" sub-goal.

**Why this cycle.** Milestone 20 is "what you feed them is a decision", and arc 1 (070, last cycle)
gave the choice a cost — a prickly dino leaves the wrong dish on the ground. A cost with no *record* is
still a guessing game: right now the only way to learn that Thornback wants fish is to be looking at
Thornback during the single frame its 😋 is on screen. This arc turns the hatch from a button into a
sub-goal, and it is the one the milestone's remaining two arcs both lean on — palate drift (068) is
invisible unless something is naming palates, and the witness (126) envies a favorite nobody can see.

**What ships.**

Open the collection book (cycle the lens to `book`) on a **fresh save** and every dino carries a new
line, right under its heart bar:

```
  🍽 menu: ·······  (favorite unknown)
```

Seven dots, one per food in `FOODS`, in `FOODS` order. Feed the park — press `H`, let somebody eat —
and the dot for the food that went down that dino's throat is replaced by that food's emoji, **for that
dino only**. Feed Rex greens and Rex's menu reads `·🌿·····`; everybody else still reads seven dots.

The moment the food a dino eats *is* its favorite, the line changes shape:

```
  🍽 menu: 🍖🌿·····  loves 🌿 leafy greens
```

The favorite's name is the prize. It appears **only** once that dino has actually eaten that food, and
once it appears it never goes away — the menu is a lifetime record, persisted in the save, not a
memory-ring read that expires.

Three sources count as "you have fed it that food", and all three go through one recording call:

1. **The hatch** (`eatFood`) — the keeper's drop, which is the whole point.
2. **A ground feeding its own** (`feedFromStores`) — a carrier spending the zone's bank on a starving
   resident. The keeper did not choose it, but it is food this park put in that dino, in front of the
   player, and the book records facts rather than credit.
3. **LUMEN-3's field scan** — see the decision below.

**The scan decision, recorded because the Lore-smith asked for it to be.** `scanLines` prints
`loves 🌿 leafy greens` unconditionally, and has since BACKLOG-157. That stays exactly as it is — it is
the one ability in this game that reads a mind, and a Scholar who has to guess like everybody else is a
worse keeper roster, not a fairer one. **But the scan now counts:** scanning a dino records its
favorite as discovered, so what LUMEN-3 reads, the book keeps. A player on LUMEN-3 fills the menu by
scanning; a player on AETHER-1 or VANTA-9 fills it by feeding. Same book, two routes, and the roster
means something at the collection layer for the first time.

**A refusal does not count.** 070's refused dish is food the dino looked at and walked away from; it
teaches the keeper nothing about what it *likes*. The menu records swallowing, not offering.

**Acceptance criteria.**

- [ ] `menuLine(tasted, favorite)` is a pure function in a new `game/src/world/menu.ts`, Node-testable, importing no Phaser.
- [ ] On a fresh save, `__bookText()` contains `🍽 menu:` exactly once per dino, and every menu line reads seven `·` and the literal `(favorite unknown)`.
- [ ] After a dino eats with the loaded feed set to `greens`, that dino's menu line contains `🌿` and another dino's still reads seven `·`.
- [ ] A dino that has eaten its own favorite shows `loves <emoji> <label>` on its menu line; a dino that has eaten only non-favorites does not (it still reads `(favorite unknown)`), even though it has emoji in its menu.
- [ ] The tasted record survives a save/reload round-trip: eat, reload the page, and the same dots/emoji and the same `loves` clause come back.
- [ ] A save written before this cycle (no `tasted` key) loads without error and produces the fresh-save menu line — additive only.
- [ ] Scanning a dino as LUMEN-3 adds that dino's favorite food to its tasted record (the `loves` clause appears in the book afterwards); `scanLines`' own output is byte-identical to before.
- [ ] A refusal (070) records nothing: the refusing dino's menu line is unchanged.
- [ ] The `feedFromStores` recording site is covered by a unit test on the recording function.
- [ ] Full unit + e2e suites green; `npm run build` clean.

**Out of scope.** No new UI surface — the menu is a line in the book that already exists. No hint
system, no "3 of 7 discovered" counter on the plaque, no achievement for a complete menu (that is
BACKLOG-022's territory and should stay there). No change to what a dino *does* with food. No change to
`favoriteFood`, `foodReaction`, `FOODS`, or any seasonal craving math — this arc reads the existing
answer, it does not compute a new one.

**Constraints.**
- Save change is **additive**: a new optional `tasted` key mapping dino name to a list of food ids,
  validated for shape only (unknown food ids kept, not rejected — the `satchel` precedent at
  `saveGame.ts:913`).
- `BookRow.menu` is optional, so every existing `BookRow` literal in the tests stays valid.
- One recording function, called from all three sites. Do not let three call sites each write the
  record their own way — that is the failure BACKLOG-483 exists over.
- The seasonal craving shifts which food is *favorite* (`favoriteFood(traits, season)`). Read the
  favorite live at render time, not at record time, so a dino whose favorite moves in winter shows the
  winter answer if the player has eaten it. Record only the **food id that was eaten**.

---

## Structure track — BACKLOG-547

**Item:** BACKLOG-547 [infra] The touch bar has no selectors.

**Why this cycle.** Milestone 20's second structure arc, and the last gap between the phone and the
same park. The Android PWA auto-deploys off `main`. On it the loaded feed is whatever the save happened
to hold, because no gesture anywhere in the touch layer reaches `cycleFeedBy`.

**Scope correction, carried from the Structure handoff.** The item's held-item half is stale: the More
sheet has carried the `item` row since BACKLOG-486 and `onTouchButton` routes it to `cycleItem(1)`.
Exactly one verb is unreachable on touch — the **loaded feed** — and that is what ships.

**What ships.**

On a touch device, **press and hold the 🍖 button** (the feed button in the bottom-right action
cluster) for `LONG_PRESS_MS` (400ms). The loaded feed steps forward one slot — the same step `.` makes
on a keyboard — and the gift HUD's second line updates under the thumb, where `layoutGiftHud` already
puts it on touch. **No food is dropped.** Release before 400ms and you get exactly what you always got:
one drop.

Held past the threshold, the selector fires **once**, on the threshold, not repeatedly — a hold is a
step, not a scroll. Keep holding and nothing further happens; release and nothing further happens.

**How, precisely, because the input layer has a scar here.** Every touch action in this game resolves
on **pointerdown**, from pre-tap state, inside `dispatchTouchTap`, and the comment above `enableTouch`'s
button loop records why: per-object handlers plus the scene handler both fired for one tap, and the
back chip's `prev()` was instantly undone by a body-tap `next()`. That single-dispatch rule is not
negotiable. So:

- `dispatchTouchTap` keeps resolving every tap on pointerdown, unchanged, for every button **except**
  the feed button.
- On pointerdown over the feed button, record the press and schedule a
  `this.time.delayedCall(LONG_PRESS_MS)` that fires `cycleFeedBy(1)` and marks the press consumed. Drop
  nothing yet.
- On pointerup, if the press was consumed, clear it and do nothing. Otherwise cancel the timer and call
  `dropFood()` — the tap, arriving one event later than it used to.
- Any pointerup, pointerupoutside, or a dialog opening cancels a pending press. A press that never gets
  its up (the finger slides off) still fires the selector on the timer and then clears; it never drops.

No per-object handler is added. The press lives in one scene field, and one place decides which verb
fired.

**Why not a sheet row, which is the obvious answer.** There is no room for one. `sheetRows` lays out row
*i* at `y = 64 + i * 36`; the tenth sits at 388 and its own comment says the base was chosen so the
tenth clears the action cluster at ~404. An eleventh lands at 424, on top of the button that opened the
sheet. That ceiling is now queued as BACKLOG-552 and must not be forced tonight.

**Discoverability.** A hidden gesture is a gesture nobody finds, so the hold gets a line in
`controlsHelp.ts` alongside the keyboard's `,`/`.`. One line, no new geometry.

**Acceptance criteria.**

- [ ] `LONG_PRESS_MS` and a pure `isLongPress` predicate live in `game/src/input/touch.ts`, with a unit test; no Phaser import.
- [ ] With touch enabled, a press on the feed button released **after** 400ms steps the loaded feed forward one slot and drops **no** food.
- [ ] With touch enabled, a press released **within** 400ms drops food exactly as before and leaves the loaded feed unchanged.
- [ ] Holding for 1200ms steps the feed exactly **once**, not three times.
- [ ] The gift HUD's second line reflects the new loaded feed after the hold.
- [ ] The other action buttons and every sheet row still fire on pointerdown, unchanged — the existing touch e2e specs pass untouched.
- [ ] A press on the feed button that ends outside the button does not drop food.
- [ ] With touch **disabled** (desktop), nothing about `dropFood` or the `H` key changes.
- [ ] Full unit + e2e suites green; `npm run build` clean.

**Out of scope.** No sheet redesign (552). No swipe gesture. No backward step on touch — one direction
wraps, which is the whole list in seven holds and is what the gift row already does. No long-press on
any other button. No haptics.

**Constraints.**
- **Single dispatch.** Do not add a per-object `pointerdown`/`pointerup` handler to the button. The
  press state is one scene field; `dispatchTouchTap` stays the one resolver.
- Touch-only. The desktop path (`H`, `,`, `.`) must be untouched, and a disabled touch layer must
  behave exactly as it does today.
- `disableTouch()` must clear any pending press and its timer, or a rotate-to-desktop mid-hold leaks a
  `delayedCall` into a scene with no buttons.
- Dev hooks for the e2e: a press/release pair so a spec can time a hold without synthesising raw
  pointer events against Phaser's input manager.

---

## File overlap between the tracks

Clean. The lore track is `game/src/world/menu.ts` (new), `game/src/ui/lenses.ts`, `game/src/keeper/scan.ts`,
`game/src/world/saveGame.ts`, and the `bookRows()` / `eatFood` / `feedFromStores` region of
`WorldScene.ts`. The structure track is `game/src/input/touch.ts`, `game/src/ui/controlsHelp.ts`, and the
touch block of `WorldScene.ts`. Both edit `WorldScene.ts` and nothing else in common, in two regions
thousands of lines apart. Neither touches `foods.ts`.
