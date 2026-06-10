# Cycle 41 — Design

## Item
BACKLOG-170 [emergent] Seasonal palates — each season nudges which food the bowl craves, so the
same dino begs differently in March and December. Builds on 061 (food favorites) / 159 (seasons).

## Why this cycle
The cycle-40 calendar (159) is, so far, scenery: it recolours the sky and fires a one-off banner,
but the cast behaves identically in every season. The cheapest, most *emergent* way to make the
year matter is to let it reach into the loop the player already drives daily — feeding. A small
per-season craving nudge on the favorite-food verdict means the same dino can rush meat in winter
and berries in summer, while a dino with a strong one-food fit stays loyal all year. Empirically
(name-seeded roster, bias 0.4): **Rex, Mossback, and Sunny each sway — and each differently —
while Twitch (the herbivore) and Glade (the carnivore) never budge.** "Who follows the season and
who doesn't" becomes a free new read on personality, with zero new save state and the cycle-061
math reused wholesale.

## What ships
- A **seasonal craving**: each season favours one food — **spring → leafy greens 🌿, summer →
  sweet berries 🍓, fall → silver fish 🐟, winter → hunk of meat 🍖** (a clean 1:1 over the four
  existing foods). In that season the craved food gets a small additive bonus when the game decides
  a dino's favorite food.
- The bonus is **small (0.4)** so it only flips a dino whose top-two foods are near-tied. A dino
  with a clear favorite keeps it all year; an ambivalent dino sways with the season. This is the
  whole point — distinctness is preserved, the emergence shows up only where the dino is genuinely
  on the fence.
- The seasonal favorite is what the **bowl actually acts on right now**: the feeding rush/range
  (a dino crosses the bowl and lower-energy-rouses for *this season's* favorite), the 😋 "favorite"
  delight + memory on eating it, and LUMEN-3's Field Scan readout all read the **live season** off
  the clock. Drop meat in winter and the dino that only craves meat in winter comes running and
  eats it as its favorite; drop the same meat in summer and it's plain feed to that same dino.
- Dev hooks expose it for testing: `__favoriteFood(name)` returns the live-season favorite (it
  already exists — its result now follows the clock), `__favoriteFood(name, season)` overrides the
  season, and `__seasonCraving(season)` returns that season's craved food id.

## Acceptance criteria
- [ ] `seasonCraving` maps the four seasons 1:1 to foods: spring→greens, summer→berries, fall→fish, winter→meat (unit).
- [ ] `favoriteFood(traits)` with **no season argument** returns exactly the cycle-061 result for every roster dino — backward compatible (unit; existing foods/scan tests stay green).
- [ ] A near-tied dino's favorite **changes across seasons**: with the live roster seeds, Rex's favorite in winter (meat) differs from his favorite in summer (berries) (unit + e2e via `__favoriteFood`).
- [ ] A strong-fit dino **never sways**: Twitch's favorite is leafy greens in all four seasons (unit + e2e).
- [ ] The seasonal bonus can only ever *promote the craved food* — it never changes the relative order of the non-craved foods, and a craved food that was already winning stays winning (unit).
- [ ] In-world the bowl acts on the live season: with the clock set to a winter day, dropping meat into Rex's lane makes him rush it and eat it as a **favorite** (😋 / "favorite" memory); the cycle-027 favorites e2e still passes unchanged because the drop and the eat read the same season (e2e).
- [ ] LUMEN-3's Field Scan favorite-food line reflects the **live-season** craving, not a fixed year-round favorite (unit on `scanLines(subject, season)` + the existing season-less scan test still green).
- [ ] `npm run build` clean; full vitest green; full playwright green.

## Out of scope
- The four-season **art** lift and **weather** (BACKLOG-028) — unchanged, still deferred.
- Seasonal **gift** cravings (BACKLOG-176) — this cycle is the *food* loop only; the gift mirror is its own item.
- Any change to **what foods exist**, their appeal weights, or the gift table — we only add a season-conditional bonus on top of the existing scores.
- Acquired-taste / palate drift (BACKLOG-068), taste-talk (066) — untouched.
- No new save state. The season is derived from the persisted clock day (159); a dino's favorite is re-derived, never stored.

## Constraints
- **Additive & backward-compatible:** `favoriteFood`, `foodReaction`, and `scanLines` all take the
  season as an **optional** parameter; omitting it must reproduce the exact pre-cycle-41 behavior so
  every existing unit/e2e stays green. No save-format change, no `SAVE_VERSION` bump.
- **Pure logic stays in `world/foods.ts`** (and the craving table there); WorldScene/scan only
  *pass the live season in*. No Phaser in foods.ts. NPCBrain boundary untouched (no AI in play).
- The feeding rush (WorldScene line ~1035), the eat reaction (~429), the `__favoriteFood` hook
  (~390), and the scan readout must all read the **same** live season so the in-world favorite is
  self-consistent (this is what keeps the cycle-027 e2e green).
- Don't touch the day/night or season-tint rendering, the turn beat, or the clock — read the season,
  don't change it.
