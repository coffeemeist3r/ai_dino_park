# Cycle 37 — Design

## Item
**BACKLOG-155** [core] Selectable keeper — character-select spine + persisted choice + one ability that touches play.

## Why this cycle
For thirty-six cycles the keeper has been a faceless square the whole cast warms to at one flat
rate. The operator's loudest standing signal (a live-session arc, deferred here by cycle 36's art
no-op) is to give the player an *identity they choose*: one of a small roster of time-traveling
robot observers, each with its own history and a distinct ability. This cycle ships the **spine** —
a real cast, a pick that persists, and one ability that genuinely touches play — so 156 (persona),
157 (more abilities), and 158 (avatars) have something to build on. It's consultative (answering the
operator) but still emergence-flavoured: the shipped ability is a personality **fit**, so *which*
observer you are quietly changes *which dinos* warm to you fastest — the same choice reads
differently against each distinct mind.

## What ships
- A pure roster of **3 time-traveling robot observers** (`keeper/keepers.ts`), each with a
  designation + nickname, an era they travelled from, a one-line backstory, and an **ability** with a
  label, a description, and a personality-`appeal` (which axes it resonates with — mirrors the shape
  of `social/tones.ts`).
- The chosen observer applies a small **affinity bonus** on every player→dino affinity gain (greet,
  tone-pick, gift): dinos whose temperament *fits* the chosen observer warm to you a little faster
  (0..+2 extra points); dinos that don't fit gain the normal amount (the bonus never punishes).
- A **keeper picker overlay**, opened with the **`K`** key, styled like the existing tone menu: it
  lists `[1] AETHER-1 "Aki" — Empath Protocol …` etc.; pressing `1`/`2`/`3` selects that observer,
  closes the overlay, persists the choice, and shows a one-line confirmation.
- The choice is **persisted** in the save as an additive `keeperId` field; it survives reload.
  Older saves (no `keeperId`) and brand-new games default to the **first** observer (AETHER-1) — no
  crash, no forced modal.
- On a **brand-new game** (no save found), a **non-blocking** fading prompt invites the player to
  press `K` to choose their observer. It does NOT open a modal dialog and does NOT capture input, so
  every existing interaction (and every existing e2e spec) boots exactly as before.
- The controls hint gains `· K observer`.
- Dev hooks for QA: `__keeper()` (current id), `__keepers()` (roster: id+name+ability label),
  `__pickKeeper(id)`, `__keeperPickerOpen()`, `__keeperBonus(name)` (the current observer's bonus
  for that dino).

## Acceptance criteria
- [ ] `keeper/keepers.ts` exports a roster of exactly 3 observers, each with a unique `id`, a `name`, an `era`, a `backstory`, and an `ability` `{label, desc, appeal}`; pure (no Phaser import).
- [ ] `keeperById(id)` returns the matching observer, and returns the first observer for an unknown/undefined id (never throws).
- [ ] `keeperBonus(keeper, traits)` returns an integer in `[0, 2]`; a dino whose traits strongly fit the observer's `appeal` gets `> 0`, and the bonus is `0` for missing traits.
- [ ] At least one observer in the roster yields a `> 0` bonus for a strongly-fitting personality and `0` for a strongly-clashing one, so the choice is observable per-dino.
- [ ] On boot with no save, `__keeper()` returns the default observer id (AETHER-1's id).
- [ ] Pressing `K` (or `__pickKeeper(id)`) sets `__keeperPickerOpen()` appropriately and changes `__keeper()` to the chosen id.
- [ ] After choosing a non-default observer and reloading the page, `__keeper()` still returns the chosen id (persisted).
- [ ] The exported save (`__exportSave()`) includes `keeperId` equal to the current choice.
- [ ] Greeting a dino whose traits fit the *current* observer raises its friendship by `greetGain + keeperBonus` (i.e. strictly more than base `greetGain` for a fitting dino); switching to an observer the dino does not fit yields only the base gain for that same dino. (Observable via `__friendshipPoints` before/after, with `__keeperBonus(name)` explaining the delta.)
- [ ] An old save JSON with **no** `keeperId` deserializes successfully (additive) and the game defaults to the first observer.
- [ ] `npm run build` clean; `npx vitest run` green (new `keepers.test.ts`); `npx playwright test` green (new `cycle-037-keeper.spec.ts`).
- [ ] `@mlc-ai/web-llm` is still imported only under `game/src/ai/` (grep clean); no new runtime dependency.

## Out of scope
- LLM-authored keeper backstories / personas → **BACKLOG-156** (this cycle's backstories are short static strings).
- The other distinct abilities (stat-scan, bond-graph sight, sky-nudge) → **BACKLOG-157**. This cycle wires exactly one ability *kind* (the affinity-fit), uniform across the roster, so every observer is complete.
- Keeper avatar art / vector rigs → **BACKLOG-158** (the keeper stays the existing flat square this cycle).
- A modal character-select *screen* on boot, a new Phaser scene, or any change to the boot→World flow. The pick is an in-world overlay (`K`) plus a non-blocking first-time invite, specifically so the boot path and all existing e2e stay untouched.
- Re-selecting from a menu mid-confirmation, keeper-vs-keeper balance tuning, or any save-version bump.

## Constraints
- **Additive save only.** Add `keeperId?: string` to `SaveData`; `deserialize` must accept its absence (default to the first observer's id) and reject only on a malformed (non-string) value. Do **not** bump `SAVE_VERSION`.
- **Do not break the tone menu.** The `1`/`2`/`3` keys must still pick tones when the tone menu is open and only pick a keeper when the keeper picker is open. The two overlays must be mutually exclusive in practice (open one at a time).
- **Boot must stay clean.** No modal dialog, no `dialogOpen`/`toneMenuOpen` set, and no input captured at boot — every existing spec must pass unchanged. The first-time invite is a fading, non-interactive text only.
- Logic (roster, `keeperById`, `keeperBonus`) lives in the pure module; `WorldScene` glue stays thin (state field, overlay, key handler, the bonus applied at the three existing affinity-gain seams: `recordGreet`, `recordTone`, gift handler).
- `K` is currently unbound — verify before binding. The repair seam (BACKLOG-125) keeps its outsized fixed bump; the keeper bonus applies to the **normal** (non-repair) gain path only.
- NPCBrain boundary untouched; `keepers.ts` imports nothing from `ai/` except the `Personality` type.
