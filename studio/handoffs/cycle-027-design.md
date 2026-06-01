# Cycle 27 — Design — BACKLOG-061 Food favorites

## Item
BACKLOG-061 [emergent] Food favorites — each dino prefers a food (from personality, like gifts); grabbing its favorite at the hatch = extra-happy (bigger bump, 😋) and remembered. Builds on 059.

## Why this cycle
The feeding hatch (cycle 25, BACKLOG-059) lets the keeper drop food and watch the cast swarm, but every drop is an anonymous 🍖 and every eat is the same flat reaction. This cycle gives the feed a *type* and each dino a *favorite* — derived from temperament with the exact gift-fit math we already ship (`giftScore`) — so the swarm gains a second emergent dimension: not just **who** reaches the food, but **whether the winner loves it**. It's the queued spine of the 066–070 taste cluster (taste talk, keeper-loaded hatch, acquired taste, the book menu, picky/gobble) and a pure-fishbowl beat: the keeper supplies the input (a food falls), the bowl reveals a preference it always had.

## What ships
- The hatch now dispenses **typed food** — one of a small set (🍖 meat, 🌿 greens, 🐟 fish, 🍓 berries). Pressing **H** drops a random one (the keeper-chosen variant is BACKLOG-067, out of scope); the falling sprite and the Park News line show *which* food fell.
- Each dino has a **favorite food**, derived deterministically from its personality (the highest gift-fit food). Favorites vary across the cast — e.g. Rex & Glade favor meat, Mossback & Sunny berries, Twitch greens.
- When a dino eats:
  - **its favorite** → a bigger friendship bump, a 😋 flash, and a memory it loved that food (so it can gossip about it later);
  - **any other food** → the normal feed bump and a calmer 🙂 flash.
- A dino will **rush its favorite food harder**: it'll cross more of the bowl for it (extended range) and rouse even when fairly calm (lower energy bar) — so over repeated drops the keeper *sees* tastes by who comes running for what. Non-favorite rushing is unchanged from cycle 25.
- Only one food in play at a time (unchanged); the drop and the eat still post to Park News (V lens), now naming the food and flagging a favorite.

## Acceptance criteria
- [ ] `favoriteFood(traits)` returns a single deterministic food per personality, and at least three distinct foods appear as favorites across the five starting dinos (Rex/Mossback/Sunny/Twitch/Glade).
- [ ] `foodReaction(food, traits)` returns `{ favorite: true, gain: FEED_GAIN_FAV, emoji: '😋' }` when `food` is that dino's favorite and `{ favorite: false, gain: FEED_GAIN, emoji: '🙂' }` otherwise, with `FEED_GAIN_FAV > FEED_GAIN`.
- [ ] `reactionToFood(energy, dist, isFavorite=true)` rushes a dino that the same call with `isFavorite=false` would ignore — both for a farther dino (between `FEED_RANGE` and `FEED_RANGE_FAV`) and for a calmer dino (energy between the favorite bar and the normal `EAGER` bar). With `isFavorite` omitted/false, behavior is byte-identical to cycle 25 (existing feeding tests stay green).
- [ ] Dropping a dino's favorite food in its lane (`__dropFood(col, foodId)`), then stepping the world (`__stepWorld`), feeds *some* dino and records a "favorite" memory for the eater; the eater's friendship gain is `FEED_GAIN_FAV`.
- [ ] Dropping a non-favorite food and letting it be eaten records a plain feed (no "favorite" memory) and a `FEED_GAIN` bump; both favorite and plain memories still contain the substring "snapped up the food" (so cycle-25's e2e stays green).
- [ ] The drop log line still contains "food dropped" and the eat log line still contains "snapped up the food" (cycle-25 e2e regression guard), while also naming the food / flagging a favorite.
- [ ] `__favoriteFood(name)` exposes a dino's favorite for tests; `__dropFood(col?, foodId?)` accepts an optional food id (random when omitted).
- [ ] No new framework; `@mlc-ai/web-llm` still imported only under `game/src/ai/`; save format unchanged (food stays ephemeral); `npm run build`, `npx vitest run`, and `npx playwright test` all green.

## Out of scope
- Keeper *choosing* the dropped food (BACKLOG-067), taste talk in dialogue/gossip (066), acquired-taste drift (068), the book menu (069), picky/gobble refusal (070).
- Persisting favorites or food state in the save — favorites are re-derived from the name like personality; in-flight food stays ephemeral (no save change).
- Per-food art — 🍖/🌿/🐟/🍓 are emoji placeholders, consistent with 🥚/💤 and the cycle-25 🍖.
- Multiple simultaneous foods, hunger meters, food spoilage.

## Constraints
- Keep all decision logic pure and Node-tested. New module `game/src/world/foods.ts` (the food table + `favoriteFood` + `foodReaction`); the favorite-aware rush extends `world/feeding.ts`'s `reactionToFood` via an **optional** `isFavorite` param so every existing call and test is unchanged.
- **Reuse, do not reinvent:** `giftScore` (social/gifts.ts) for food fit; `stepToward`/`feedStep` for the rush; `bumpPoints` (friendship.ts), `remember` (memory.ts), and `logEvent` for the eat. The `FEED_GAIN_FAV`/`FEED_RANGE_FAV` constants live in feeding.ts; foods.ts imports them (one-directional: foods.ts → feeding.ts, no cycle).
- WorldScene only does Phaser glue (random food pick on H, the typed falling sprite, the favorite-aware rush branch, the eat reaction, the hooks). No redesign of the cycle-25 swarm spine.
- Do not change existing key bindings; H stays the feed key. No new keys this cycle.
- Memory and log strings must preserve the cycle-25 substrings ("snapped up the food", "food dropped") so the existing feeding e2e does not regress.
