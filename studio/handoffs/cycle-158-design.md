# Cycle 158 — Design

Two tracks. Milestone 19 has one unchecked arc per track and both are here, so this cycle can close
the milestone if both land.

---

## Lore track — BACKLOG-067: Keeper-loaded hatch

### Item

BACKLOG-067 `[social]` — choose which food to drop (cycle the loaded feed, shown in HUD) instead of
a random handful; the mirror of the `[`/`]` gift selector, for the hatch.

### Why this cycle

`dropFood` has picked its food with `FOODS[Math.floor(rand() * FOODS.length)]` since cycle 59, and
the whole social engine downstream of it reads one question — *was this its favorite?* The rush or
the amble (`reactionToFood`), the escort that walks a withdrawn loner in (381), the pecking order at
the landing (389), the bond a meal is worth (`FEED_GAIN_FAV`), the 😋, the comfort meal, the granary's
spend priority. Seven systems keyed off a coin flip the player has never been allowed to call.

Last night's 066 shipped the other half of this loop: a dino now *tells you* what it thought of its
dinner, and names the food when the food was its favorite. The park has been able to teach the player
five palates for exactly one cycle, and there is currently nothing the player can do with what they
learn. This is the item that makes 066 worth having and vice-versa — the knowledge and the means,
one cycle apart. It is also Milestone 19's last unchecked lore arc.

### What ships

A **loaded feed**, exactly the shape the held gift already has.

- Press `.` (or `,`) to cycle what is loaded in the hatch. The bottom-left HUD gains a second line:
  `Feed: 🍖 hunk of meat`.
- The list is the seven `FOODS` plus one slot at the front, **`random handful`**, which is the
  current behavior and the default on a fresh save. So the founding park is unchanged in what it
  drops, and *changed in that it says what it is about to drop* — the HUD line is there at boot,
  reading `Feed: random handful`, which is how the player finds out the choice exists.
- Press `H`. The loaded food is what comes out of the hatch — the same fall, the same landing roll,
  the same escort, the same everything downstream. Only the `kind` changes.
- The choice **persists**: it is in the save, so the hatch is still loaded with what you left in it.
- `[?]` help panel gains a row: `, .` → `switch loaded feed`.

The intended play, and the reason this is a lore item rather than a UI one: talk to a dino, hear it
name its favorite, load that food, drop it, and watch *that* dino be the one that rushes. The player
aims a meal at an individual. Every dino in the park is still eating the same thing as everyone else
until the keeper decides otherwise.

### Acceptance criteria

- [ ] On a fresh save the HUD reads `Feed: random handful` and `H` still drops a randomly chosen food (no behavior change to the founding park's drop).
- [ ] Pressing `.` advances the loaded feed one step through the list; pressing `,` steps back; both wrap.
- [ ] The HUD's feed line shows the loaded food's emoji and label, and updates within one frame of the keypress.
- [ ] With a specific food loaded, `H` drops **that** food — asserted on the food actually in play, not on the HUD text.
- [ ] With `random handful` loaded, the dropped food is still drawn from `FOODS` (the as-shipped path stays live).
- [ ] The loaded feed survives a save/reload round-trip.
- [ ] A save written before this cycle (no loaded-feed field) loads clean and starts on `random handful`.
- [ ] The `[?]` panel lists the `, .` binding, and every help line still fits the panel's 40-character budget.
- [ ] The held-gift selector (`[`/`]`, `Holding:`) is untouched: same keys, same line, same unit test.
- [ ] Loading a dino's favorite and dropping it makes that dino rush — the end-to-end play, asserted through `reactionToFood`'s existing read.

### Out of scope

- **The supply.** The hatch still conjures food from nothing; that is BACKLOG-546, seeded tonight
  precisely because this item makes the hole worth closing. Do not spend from the granary.
- **Touch.** The action bar cannot cycle either selector; that is BACKLOG-547, also seeded tonight.
  Desktop keys only this cycle.
- Per-dino "drop this for Rex" targeting, a feed queue, or dropping more than one piece at a time.
- Any change to `foodLanding`, `HATCH_SCATTER`, the escort, or the pecking order.

### Constraints

- `FOODS` order and content must not change — `favoriteFood`, the seasonal craving, the crop foods
  and the cycle-119 roster-by-season test all read it.
- `dropFood`'s explicit `foodId` argument (used by the plot harvest at `WorldScene.ts:2074` and by
  `__dropFood`) **wins over the loaded feed.** A harvested crop drops itself; the hatch selector is
  for the hatch.
- Save changes additive only; an absent field means `random handful`.
- The gift HUD is one text object — grow it to two lines rather than adding a second object, and
  leave `holdingLine` byte-identical.

---

## Structure track — BACKLOG-545: Once per sitting

### Item

BACKLOG-545 `[core]` — the session record as a gate (`firstThisSession(key)`), with the single
loudest offender converted.

### Why this cycle

542 shipped the sitting as a record and its own text named the consumer it declined to build:
*anything that should not fire twice in one sitting*. The offender is the parting glance (119), and
it is worth taking now because 542 is what made it visible — and, in the same stroke, made it worse.

`partingGlance` is called from `applyDeparture` on every `leaving` transition, measured against
`sessionStartedAt`, which 542 re-stamps on **every return**. Two live consequences in an ordinary
ten-minute sitting, pulling opposite ways:

1. Alt-tab four times with twenty seconds between and your closest dino says goodbye four times, in
   the same words. A greeting that repeats is a tic.
2. Alt-tab *often* — never holding focus for twenty unbroken seconds — and you are **never** said
   goodbye to at all, because the floor restarts from each return. For that keeper the beat cycle
   155 shipped does not exist.

Both are the same confusion: the park measures a **focus period** where it means a **visit**. One
predicate and one unit fix both, and the second one is additive — a keeper who could not reach this
beat starts reaching it.

### What ships

- A pure predicate pair in `world/session.ts`, beside the record they gate: `firstThisSession(spent, key)`
  and `spendKey(spent, key)`. No Phaser, no clock.
- The scene learns the **visit** as a unit distinct from the sitting: `visitStartedAt`, stamped once
  at boot and never re-stamped, and `spentThisVisit`, the keys already used.
- The parting glance is converted:
  - it is measured against the **visit**, not the focus period, so the twenty-second floor means
    *twenty seconds since you opened the park* and a fidgety keeper earns a goodbye;
  - it is gated on `firstThisSession('glance')` and spends that key when it fires, so it happens
    **once a visit** however many times the keeper alt-tabs.
- `__spentThisVisit()` dev hook; `__ageSession` winds **both** clocks, because a sitting whose start
  predates its own visit is incoherent and every existing spec that calls it means "wind time back".

**The spent set is transient, not persisted, and the item's own text guessed otherwise.** A visit is
a page load; a reload is a new visit and must clear it. Persisting it would make a reloaded save
silently owe the keeper a goodbye it had already given. This follows the `companyTrace` precedent
("session state, never persisted") rather than 542's record, which is persisted because it is
*history*. **Save format is unchanged on this track.**

### Acceptance criteria

- [ ] `firstThisSession([], 'glance')` is true; after `spendKey`, false. Spending twice is idempotent (no duplicate key).
- [ ] A keeper who sits twenty seconds and alt-tabs gets the goodbye glance (the cycle-155 behavior, unchanged).
- [ ] A **second** blur in the same visit produces no glance, however long the keeper sat in between.
- [ ] A keeper whose every focus period is under the floor, but whose visit is past it, **does** get the goodbye on the first blur — the beat that was unreachable before.
- [ ] A blur before the visit is twenty seconds old still produces nothing.
- [ ] `__spentThisVisit()` is empty at boot and contains `glance` after the goodbye fires.
- [ ] A reload starts a fresh visit: the spent set is empty and the goodbye is available again.
- [ ] `cycle-155-glance.spec.ts` passes **unmodified**, including *the second sitting has to earn its own goodbye* — the new gate must reach the same answer that spec already pins, by a different route.
- [ ] `cycle-156-sitting.spec.ts` passes unmodified: sittings still open, close, file and reach the save exactly as before.
- [ ] The save round-trips with no new field.

### Out of scope

- Converting the other named offenders (the homecoming wave, the digest modal). The item says one,
  and the second caller is what proves a seam — that is next cycle's argument, not tonight's.
- Any change to `SESSION_MIN_MS`, `departureStage`, `shouldStamp`, or what `closeSitting` files.
- Persisting the spent set.

### Constraints

- `SESSION_MIN_MS` is imported from `departure.ts`, never restated (the 483 discipline).
- The glance's existing exclusions — asleep, off-screen, no friendship — are the scene's and stay
  exactly where they are.
- `closeSitting` must **not** clear the spent set. It fires on every `leaving`, which is precisely
  the thing the gate exists to survive.

### Cross-track file overlap (Coder: sequence these)

`game/src/scenes/WorldScene.ts` and `game/src/ui/controlsHelp.ts` are touched by both tracks, in
different regions. Build the **structure track first** (it is smaller and touches `setupGovernor` /
`onDeparture`), then the lore track (`setupGifts` / `dropFood` / `HELP_ROWS`). Only the lore track
touches `world/saveGame.ts`; do not let the structure track add a save field.
