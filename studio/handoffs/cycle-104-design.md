# Cycle 104 — Design

Milestone 5 ("No one goes hungry"), arcs 2 of 3 on each track. Both tracks read the same drive —
`needs[name].hunger` — at two deliberately different bars. Read the **Constraints** of both sections
before starting either.

---

## Lore track — BACKLOG-376 — Woke hungry

**Item:** BACKLOG-376 [emergent] Woke hungry — a dino already over the hunger threshold at the in-game
dawn boundary plays a visible wake-hungry beat instead of a plain one.

**Why this cycle.** Hunger has existed since cycle 80 (371) and has never had a *moment*. It's a 🍖 that
fades in when a float crosses 0.6 — no event, nothing to catch, nothing to come back for. Meanwhile the
bowl already has exactly one boundary the whole cast observes together: dawn, where the chorus (192) fires
once per in-game day and every dino greets the morning in its own voice. Right now that morning is
uniform — everyone chirps, whatever kind of night they had. 376 breaks the uniformity with the need the
milestone is about: the dinos that went to bed hungry wake *differently*, and because the hunger rate is
energy-scaled (`needs.ts` `scaled()`: 0.6×..1.4×), *which* dinos those are is a read on temperament, not a
dice roll. That's the CHARTER "Living minds" bar — same event, visibly different dinos.

**What ships.**

At the dawn boundary (hour 7, riding the same once-per-day live listener as the chorus), every dino whose
**hunger ≥ `NEED_THRESHOLD` (0.6)** plays a wake-hungry beat, on top of its ordinary chorus chirp:

- A visible 🍖 stir over the dino (`flashFeed(d, '🍖')`).
- A ticker line per hungry dino, **shaded by temperament** — a prickly (low-agreeableness) dino wakes
  irritable, a warm one plaintive, a bold/high-energy one impatient. E.g.
  `🍖 Thornback woke hungry — and in no mood about it` vs `🍖 Sunny woke hungry — and looked to the hatch`.
- A "woke hungry" memory per dino, so the need colours that dino's next greeting through the memory
  channel that already feeds dialogue context.
- Dinos under the bar get nothing new — their dawn is exactly today's dawn.

The beat fires at most once per in-game day (it inherits the chorus's `lastDawnDay` guard) and is
live-only (a restore/away `clock.set` fires no `onHour`, same as the chorus).

**Acceptance criteria.**

- [ ] A live clock crossing into hour 7 with a dino at hunger ≥ 0.6 flashes 🍖 over that dino and files a
      "woke hungry" memory for it (`__memory(name)` contains it).
- [ ] The same crossing emits exactly one `🍖 <name> woke hungry…` ticker line per hungry dino (`__events()`).
- [ ] A dino at hunger 0.5 (under the bar) at the same dawn gets **no** wake-hungry line and no memory.
- [ ] The ticker line is temperament-shaded: two dinos with different agreeableness that both wake hungry
      produce **different** line text (unit-pinned on the pure fn; e2e asserts the beat, not the wording).
- [ ] The beat fires **once per in-game day**: a second live crossing of hour 7 the same day adds no lines;
      the next day re-arms.
- [ ] A restore-style `__setClock` to hour 7 fires **no** wake-hungry beat (live-only, mirrors the chorus).
- [ ] **No regression to the dawn chorus (192):** `__dawnCount` still increments on a live dawn, the 🌅 line
      still logs, and `__lastChorus` order is unchanged.
- [ ] `__wokeHungry()` returns the names that woke hungry at the last dawn (dev hook for the e2e).
- [ ] Unit: the threshold boundary (0.599 no / 0.6 yes), a dino absent from `needs` → no beat, and the line
      fn is deterministic per traits and differs across temperaments.

**Out of scope.**

- BACKLOG-108's dawn stretch (the ⤴ wake beat for *non*-hungry dinos). 108 never shipped, so 376's
  "instead of a plain stretch" reads as **instead of a plain chorus chirp** — do not build 108 to make
  376's wording literal. The hungry dino still chirps; it just also stirs 🍖.
- Any LLM-authored wake line. The shaded line is deterministic procedural, full stop (no `ai/` import).
- Making the beat *do* anything (pull the body, feed the dino). 436 already leans a hungry dino at the
  hatch; 444 (this cycle's structure track) owns feeding it. 376 is a read, not an actuator.

**Constraints.**

- `world/needs.ts` is touched by **both** tracks this cycle. 376 **consumes** `NEED_THRESHOLD` and must not
  redefine it or move it; the structure track adds `STARVING` beside it. Land the structure constant first
  (see below), then this.
- Use hunger **directly** (`n.hunger >= NEED_THRESHOLD`), *not* `pressingNeed()` — `pressingNeed` returns
  `'thirst'` on a tie or when thirst is higher, so a hungry-and-thirstier dino would silently lose its beat.
- Don't touch `checkDawnChorus`'s order/count/logging; hang the new call at its tail so the once-per-day
  guard is inherited rather than duplicated.
- No bubbles (`showBubble`) for this beat — the whole cast can wake hungry at once and a stack of
  simultaneous bubbles would fight the dialog UI. The ticker + the 🍖 flash are the channel.

---

## Structure track — BACKLOG-444 — A carrier feeds the hungry

**Item:** BACKLOG-444 [core] A carrier feeds the hungry — a zone's banked food (446) is spent to resolve a
starving resident's hunger when no keeper drop comes.

**Why this cycle.** 446 shipped the pantry last cycle and welded the door shut: `foodPileByZone` banks a
share of every harvest, reads as `🍓 2` on the lens, and can never be spent by anything. This is the item
it was built for — and the first time this park's two halves touch. For 104 cycles the economy (gather →
bank → carry → build) and the dinos' needs (hunger, thirst, the hunt) have run as separate machines that
share a screen. 444 wires one to the other: what a zone *stored* is what feeds the dino that *needs*. It's
also what makes 447 (ferry food between zones) and 448 (provider role) mean anything — ferrying to a zone
that can't spend, or a standing for filling a pantry nobody eats from, are both busywork.

**What ships.**

A new **starving** bar above the pressing bar, and a last-resort spend on the needs tick:

- `needs.ts` gains `STARVING = 0.9` and `isStarving(need)`. `NEED_THRESHOLD` (0.6) is untouched.
- On each `checkNeeds()` tick, a dino is fed from its **home zone's** food store when **all** hold:
  1. its hunger ≥ `STARVING` (0.9), **and**
  2. **no keeper drop is in play** (`this.food === null`) — the store is the last resort, not the
     competition, and a dino mid-rush to a real piece of food is never intercepted, **and**
  3. its home zone (`zoneOf(this.dinoZones, name, BOWL_ID)`) has something banked.
- The spend picks **the dino's favorite food if that id is banked**, else the most-stocked id (FOODS order
  breaks a tie — deterministic, same discipline as `pickCarry`). Being fed your favorite from your own
  zone's stores is the distinctness hook, and it's free: `favoriteFood(d.traits, season)` already exists.
- Effects: the pile loses exactly one unit of that id; the dino's hunger → 0 (`satisfy`); a food-emoji
  flash over the dino; a ticker line naming the zone and the dino
  (`🍓 the Fernreach's stores fed Thornback`); a memory (`the grove's stores saw you through — you woke
  starving and the stores fed you`) so it can surface in a later greeting.
- The lens's existing `🍓 N` read (446) shows the decrement with no new draw code.

No new save field: `foodPileByZone` is already persisted and additive. A pre-446 save loads `{}` and
simply never spends.

**Acceptance criteria.**

- [ ] A dino at hunger ≥ 0.9, home zone pile `{berries: 2}`, no food in play → one `__checkNeeds()` leaves
      its hunger at 0 and the zone pile at `{berries: 1}`.
- [ ] **The band survives (the milestone's whole point):** a dino at hunger 0.7 — pressing, over 376's bar,
      under 0.9 — with a stocked zone pile is **not** fed; its hunger keeps climbing and its 🍖 stays.
- [ ] A dino at hunger ≥ 0.9 whose home zone pile is empty is **not** fed (hunger keeps climbing, no line).
- [ ] With a keeper drop in play (`__dropFood()`), a starving dino is **not** fed from the store; once the
      drop is eaten/gone, the next tick feeds it.
- [ ] The spend prefers the dino's favorite: a pile holding both the dino's favorite id and a
      more-stocked non-favorite spends the **favorite** (unit-pinned).
- [ ] A ticker line naming the zone and the dino appears exactly once per spend (`__events()`), and the fed
      dino's memory contains the stores line.
- [ ] The spend takes from the dino's **home** zone, not the viewed zone: a dino resident in the grove is
      fed from the grove's pile while the keeper stands in the bowl.
- [ ] An old save with no `foodPileByZone` loads clean and never spends (no crash, no line).
- [ ] Unit: `takeFood` (floors at 0, never mutates, absent id → unchanged), `pickFoodToSpend` (favorite
      preferred when banked / most-stocked fallback / FOODS-order tiebreak / empty pile → null),
      `isStarving` boundary (0.899 no / 0.9 yes / undefined → no).

**Out of scope.**

- Ferrying banked food *between* zones — that's 447, next in the queue. 444 spends a zone's own store on
  its own resident only.
- A *carrier dino* physically walking the food over. The item title says "carrier" in the sense of the
  429 carry/flow **system**, not a courier animation. The spend is the zone's store resolving a resident's
  need in place; a walked delivery is a follow-up nobody has queued yet, and inventing it here blows the
  arc.
- Mortality. Deathless stands (CHARTER-level, routed to the operator). `STARVING` is a *spend* bar, not a
  death clock — nothing happens to an unfed starving dino except that it stays starving.
- Spending the store on thirst (445 owns water) or on the player.

**Constraints.**

- **Cross-track file overlap: `world/needs.ts`.** This track adds `STARVING`/`isStarving`; the lore track
  reads `NEED_THRESHOLD`. **Do this track's `needs.ts` edit first**, then 376's, so neither clobbers the
  other. No other shared file: 444 hooks `checkNeeds()`, 376 hooks the tail of `checkDawnChorus()`.
- **The two bars must not converge.** 0.9 > 0.6 is load-bearing: the 0.6–0.9 band is where 376's beat,
  436's need-pull and the 🍖 tell all live. A spend at the pressing bar would silently delete the lore
  track's arc. If the Coder finds itself tempted to reuse `pressingNeed()` here, that's the bug.
- Reuse, don't reinvent: `takeResource`/`pickCarry` in `resource.ts` are the shape to mirror in
  `foodstore.ts` (it's already that file's stated design — "structural twin of Stockpile"). Reuse
  `satisfy` (needs), `favoriteFood` (foods), `flashFeed`/`logEvent`/`remember` (WorldScene). No new module.
- Additive save only. `foodPileByZone` already exists — do not version-bump.
