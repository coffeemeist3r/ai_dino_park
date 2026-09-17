# Cycle 163 — Design

Milestone 21, cycle 1 of ~5. Both tracks are keeper-shaped by design: the structure track widens the
roster's only category, the lore track makes the choice audible. **The Coder builds the structure track
first** — see Constraints on both sections.

---

## Structure track — BACKLOG-212

**Item:** BACKLOG-212 [core] Non-robot keeper archetype — the roster gains a watcher that is not a
time-traveling robot.

### Why this cycle

Milestone 21's spine. Every keeper item queued behind this one (156's persona, 157's abilities, 160's
voice, 162's switch beat) has been designed against a roster of three machines, and the three appeals in
`keepers.ts` are all **positive weights** — Aki wants warm and social, Vix wants bold and energetic, Lux
wants curious and bold. A dino that is solitary, cautious and calm has no watcher in the game that likes
it. That is not a flavour gap, it is a hole in the one mechanic the roster actually has.

### The finding that sets this item's real scope

**A fourth keeper cannot currently be chosen.** The picker body is data-driven over `KEEPERS` and renders
as many rows as exist, and `pickKeeperIndex` already range-guards — but **both input surfaces are
hard-coded to three**:

- `WorldScene.ts:1209-1211` binds `KeyCodes.ONE`, `TWO`, `THREE` and nothing else.
- `input/touch.ts:114` — `menuChips` builds `['◀', '1', '2', '3', '✕']`.

So a fourth roster entry would render in the overlay, be described to the player, and be **unreachable on
keyboard and on touch alike**. Shipping the roster row alone would be a feature listed on screen that no
player can select — CHARTER v7's defect in its purest form, caught at design time rather than at verdict.
Both surfaces are in scope for this item. They are what make it an arc rather than a one-line append.

### What ships

**1. The fourth watcher — `keepers.ts`, appended at index 3.**

- `id`: `kestrel`
- `name`: `Kestrel of the Ninth Quiet "Kes"`
- `era`: `a hundred million years downstream`
- `backstory`: a descendant, not a machine and not a visitor — it came back up its own line to see what
  its ancestors were like before anyone was watching, and it keeps to the edges the way the quiet ones do.
- `ability.label`: `Quiet Company`
- `ability.desc`: `Solitary, cautious dinos let you near.`
- `ability.appeal`: `{ sociability: -1, curiosity: -0.4 }`

The negative weights are the point and they need **no change to `keeperFit`**: the function is
`sum of weight * (trait*2 - 1)`, so a solitary dino (`sociability` 0) scores `-1 * -1 = +1` and a cautious
one adds `+0.4`, clearing the `0.8` bar for the full `keeperBonus` of 2. Kes is the first observer whose
favourites are the dinos the three machines all pass over, and `keeperBonus` still only ever helps, so the
"a perk, not a punishment" rule is untouched.

The name parses correctly through the existing helpers with no edit: `designationOf` splits on the quote
and yields `Kestrel of the Ninth Quiet`, `nicknameOf` yields `Kes`, so the 276/278 address escalation works
for it exactly as for the robots — a formal true-name below ten hearts, the short-name above.

**Two consequences that come free and should be verified, not built.** `inspector()` in `firstContact.ts`
scores the cast by `keeperFit`, so picking Kes sends the park's **loneliest** dino to the glass rather than
its friendliest — the first-contact beat inverts. And `canScan` is `keeper.id === 'lumen'`, so Kes
correctly cannot scan and refuses through the existing path.

**2. The fourth is selectable — keyboard.** Bind `KeyCodes.FOUR` to `onNumberKey(4)` beside the existing
three. `onNumberKey` routes by open overlay already; `pickTone` indexes `['warm','tease','honest'][n-1]`
and must stay safe for `n = 4` (it resolves `undefined` today — make that an explicit no-op rather than a
hazard).

**3. The fourth is selectable — touch.** `menuChips(width, height, numbered: boolean)` becomes
`menuChips(width, height, options: number)` where `0` means "not a numbered menu". The chip row becomes
`['◀', ...1..options, '✕']`. Call sites pass `KEEPERS.length` for the keeper picker, `TONES.length` for
the tone menu, and the minds confirm passes its own count — so the tone menu does **not** grow a dead `[4]`
chip, which a boolean-to-four change would have given it.

Geometry: six chips is `6*48 + 5*10 = 338px`, which centres inside the 375px mobile viewport with an 18px
gutter each side. It fits, but it is the widest this row has ever been — QA measures it rather than
assuming it, and `chipIdAt` must keep resolving every chip it draws.

**4. Persistence.** `keeperId: 'kestrel'` round-trips through `saveGame.ts` with no schema change (the
field is already `string`), and `renderKeeperAvatar` puts Kes on the amber-square fallback until
BACKLOG-554 draws it, exactly as the robot roster shipped at cycle 37.

### Acceptance criteria

- [ ] `KEEPERS.length === 4`; `KEEPERS[3].id === 'kestrel'` and the first three entries are unchanged byte-for-byte.
- [ ] `designationOf(KEEPERS[3]) === 'Kestrel of the Ninth Quiet'` and `nicknameOf(KEEPERS[3]) === 'Kes'`.
- [ ] `keeperAddress(KEEPERS[3], 10)` returns the nickname and `keeperAddress(KEEPERS[3], 9)` the designation — the 276/278 escalation, unmodified.
- [ ] `keeperFit(KEEPERS[3], t)` is **positive** for a solitary+cautious temperament (`sociability` and `curiosity` at 0.1) and **negative** for a social+curious one (both at 0.9).
- [ ] `keeperBonus(KEEPERS[3], t)` returns 2 for that solitary+cautious temperament, and returns 0 (never a negative) for the social+curious one.
- [ ] For at least one temperament, Kes's `keeperBonus` is 2 while all three robots' is 0 — the archetype is a genuinely different read, not a re-skin.
- [ ] `inspector(KEEPERS[3], cast)` selects a **different** dino than `inspector(KEEPERS[0], cast)` for a cast containing both a solitary and a social member.
- [ ] `canScan(KEEPERS[3]) === false`.
- [ ] Opening the picker (`K`) on a fresh save lists **four** rows, the fourth naming Kes, its ability label and its description.
- [ ] Pressing `4` at the open picker selects Kes: the confirm dialog names it and its era, and the scene reports the keeper id `kestrel`.
- [ ] Pressing `4` when the picker is **not** open changes no state and throws nothing (the tone menu ignores it).
- [ ] After choosing Kes, a reload restores `kestrel` — the choice survives the save round-trip.
- [ ] `menuChips(w, h, 4)` returns 6 chips `['◀','1','2','3','4','✕']`; `menuChips(w, h, 3)` returns 5 with no `pick4`; `menuChips(w, h, 0)` returns `['◀','✕']`.
- [ ] At a 375px-wide viewport every chip returned for the keeper picker lies fully within the viewport, and `chipIdAt` resolves each chip's centre to its own id.
- [ ] On touch, with the picker open, tapping the `[4]` chip selects Kes; with the **tone** menu open no `[4]` chip is drawn.
- [ ] Kes renders on the amber-square fallback (`__hasKeeperArt('kestrel')` is false until 554 lands) and the walk still animates.
- [ ] `__hasKeeperArt('vex-0')` is false — the rectangle-fallback control is unchanged and still a genuine no-art id.

### Out of scope

- Drawing Kes (BACKLOG-554, the Artist's fire this same session).
- A fifth entry, or any restructuring of the roster type.
- An LLM-authored backstory for Kes (BACKLOG-156).
- A distinct *ability* beyond the affinity fit (BACKLOG-157) — Kes ships with the fit ability, as the robots did.
- The keeper save record (BACKLOG-555).

### Constraints

- **Build this track first.** The lore track edits `keeper/keepers.ts` too and reads the roster it widens.
- Existing keeper unit tests index `KEEPERS[0..2]` — appending must leave every one of them green without edits. If one needs an edit, that is a signal the append was not additive.
- `menuChips`'s signature change touches its call sites in `WorldScene` (two) and its own tests. Widen the type rather than adding a parallel function.
- Additive save only; no schema version bump.
- No Phaser in `keepers.ts` — it stays pure and Node-testable.

---

## Lore track — BACKLOG-160

**Item:** BACKLOG-160 [ai] Dinos address the observer.

### Why this cycle

The milestone's headline beat, and half of it already shipped without the backlog text being updated. The
item asks that a dino "may name you *and* shade its line by which watcher you are". The **naming** landed
as 276/278 — `keeperAddress` escalates designation to nickname at ten hearts and `WorldScene` feeds it into
the greet context at two call sites. The **shading** did not. There is exactly one keeper-aware line in the
park, `fondGreeting` (`ai/brain.ts:178`), it fires only above eight hearts, and it is byte-identical for
every observer. Pick any of the three and the bowl says the same sentence.

### What ships

**A first impression, per watcher, said once per dino.**

`ai/brain.ts` already has a clean idiom for this: a base register (gratitude / wistful / fond / generic)
with composable temperament-shaded asides appended after it (`hungryAside`, `rattledAside`,
`providerAside`, `tasteAside`). The watcher shading is one more aside in exactly that shape — which is why
it composes onto *every* register instead of living inside one, and why it is reachable on the generic
hello a stranger gives you on a fresh save rather than behind eight hearts.

**1. A new pure module `game/src/keeper/voice.ts`.**

- `watcherAside(keeperId: string, traits?: Personality): string` — what this dino makes of *you*, the
  first time it meets you wearing this chassis. Temperament-shaded on the register's own convention
  (`agreeableness < PRICKLY_MAX` grumbles it, `> EFFUSIVE_MIN` gushes, otherwise plain; no traits gives the
  plain line), leading with a space so it appends cleanly.
- One authored note per roster id — **four ids, three temperaments, twelve lines** — each about what the
  dino can actually *see*. Aki's chest glow and stub arms; Vix's single red slit; Lux's great round lens
  and the fact that it is plainly writing you down; Kes's feathers and the fact that it smells almost like
  family. An unknown id returns the empty string (back-compat: no watcher, no aside).
- `firstMeeting(met, dino, keeperId)` and `recordMeeting(met, dino, keeperId)` — pure helpers over a
  `dino name -> keeper id last met under` map.

**2. `ai/brain.ts`.** `NPCContext` gains `watcher?: string` (the keeper **id**, set only when this is the
dino's first hello under that observer). `cannedReply` appends `watcherAside(ctx.watcher, ctx.traits)`
**immediately after the base register and before the hunger tell** — a first impression is the most
immediate thing a dino has to say, where the provider aside is explicitly the least.

**3. `ai/webllmBrain.ts`.** The same fact enters the prompt so LLM colour follows the deterministic line
rather than contradicting it. Stays inside `ai/`; the boundary does not move.

**4. `WorldScene`.** A `metWatcher: Record<string, string>` map. On a greet, set `ctx.watcher` only when
`firstMeeting(...)` is true, then record it. Dev hook `__metWatcher()`.

**5. `saveGame.ts`.** `metWatcher?: Record<string, string>` — additive, absent in old saves, which load to
an empty map and therefore give every dino its first impression again on the next hello. That is the
correct behaviour for an old save, not a migration problem.

**The consequence worth keeping, and it is free.** The map is keyed by *which* watcher, not by "has met".
So **changing your observer re-arms every dino's first impression** — switch from Lux to Kes and the whole
park remarks on the new body, one dino at a time, as you go round saying hello. That falls out of the key
choice rather than being built, it is the strongest single argument for shipping 212 in the same cycle,
and it is groundwork the 162 switch beat will read later without this cycle claiming 162's scope.

### Acceptance criteria

- [ ] `watcherAside` returns a non-empty string beginning with a space for all **four** roster ids at all three temperaments.
- [ ] All twelve lines are distinct from one another; in particular no two observers share a line at the same temperament.
- [ ] `watcherAside('vex-0', t)` returns the empty string — an unknown id adds nothing.
- [ ] `watcherAside('aether', undefined)` equals `watcherAside('aether', evenTemperedTraits)` — the no-traits path is the plain line.
- [ ] `cannedReply` with `watcher` set appends the aside to the **generic** stranger greeting (affection mid-range) and to the **fond** greeting (affection >= 8) and to the **wistful** one (affection <= 1) — the aside composes with every register.
- [ ] `cannedReply` without `watcher` returns text byte-identical to today's for the same context — every existing brain test stays green unedited.
- [ ] With `watcher` **and** `hungry` set, both asides appear and the watcher's comes first.
- [ ] No composed reply is truncated mid-word relative to today: each aside step's length cap is raised by the watcher aside's maximum length, so an existing line that fit before still fits.
- [ ] `firstMeeting({}, 'Rex', 'aether')` is true; after `recordMeeting` it is false for `aether` and **true** for `kestrel`.
- [ ] E2E, fresh save, no model: walk to a dino and greet it — the reply contains the chosen observer's aside.
- [ ] E2E: greet the **same** dino a second time — the aside is absent, asserted as a **count** over `__bubbleTexts` rather than an absence check (the cycle-162 harness note: the first bubble is still on screen and an absence check passes for the wrong reason).
- [ ] E2E: greet a dino, then press `K` and choose a different observer, then greet that same dino again — the aside returns and is the **new** observer's, not the old one's.
- [ ] E2E: the aside a fresh save produces under observer 1 differs from the one it produces under observer 4 — the choice is audible on the first hello, with zero friendship earned.
- [ ] `metWatcher` round-trips through save/load; a save written without it loads and re-arms every dino.
- [ ] `grep` confirms `@mlc-ai/web-llm` is imported only under `game/src/ai/`.

### Out of scope

- LLM-**authored** keeper persona and its cache (BACKLOG-156).
- The switch-noticed memory and the wistful line for a departed watcher (BACKLOG-162) — this cycle only
  leaves the map that makes them cheap.
- New keeper abilities (BACKLOG-157).
- Rewriting `fondGreeting`, `wistfulGreeting` or the canned greeting pool.
- Any change to `keeperAddress` or `NICKNAME_MIN`.

### Constraints

- **File overlap with the structure track: `keeper/keepers.ts`.** One session, one Coder — sequence it,
  do not parallelise. 212's roster entry must exist before `voice.ts` authors Kes's note, or the fourth
  set of lines is written against an id that is not there.
- `@mlc-ai/web-llm` stays imported only under `game/src/ai/`. `keeper/voice.ts` is pure and Node-testable.
- The deterministic path is the floor: headless CI has no WebGPU and players decline the download. The
  aside must appear with the brain in `stub`/`fallback`.
- Additive save only.
- Watch the aside length caps in `cannedReply` — they are a chain of `.slice(240)` / `.slice(280)` /
  `.slice(320)`. Inserting a step means every later cap moves by the same amount or an existing line
  silently starts truncating, which no current test would catch.

---

## Reachability — both tracks, stated before the build

**Structure:** *Boot a fresh save and press `K`. There are four watchers where there have always been
three, and the fourth is not a machine. Press `4` — on the keyboard or on the chip — and you are it, and
the dino that crosses the bowl to look you over is the loneliest one in the park instead of the
friendliest.* No population floor, no day boundary, no founding constant moved.

**Lore:** *Say hello to any dino on that same fresh save, with no friendship earned at all, and it tells
you what it makes of you — and what it says depends on which watcher you picked. Say hello again and it
has moved on. Change watchers and the whole park notices you all over again.*
