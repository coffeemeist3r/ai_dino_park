# Cycle 9 — Design

## Item
BACKLOG-015 [social] Gift system — give an item to an NPC, affinity changes based on personality fit.

## Why this cycle
Greeting is a flat +3 to everyone. Gifting makes personality *matter*: the player learns each dino's taste and brings the right thing. It reuses the friendship store (016), traits (010), and save (009) — pure reaction math, no model.

## What ships
The player holds one of a small set of items and can cycle the held item with **[** / **]** (or number keys). Pressing **G** near a dino gives it the held item: the dino reacts (loved / liked / neutral / disliked) based on how the item's appeal fits its personality, the friendship affinity changes accordingly (loved +12, liked +6, neutral +1, disliked −4, clamped), the reaction shows in the dialog box ("Rex loved the shiny shell! ♥"), and it persists via the existing save. A small HUD shows the currently held item.

Items & the temperament each flatters: Shiny Shell (curious), Wildflower (social/warm), Smooth Rock (calm), Sparring Stick (bold/energetic), Mossy Snack (agreeable).

Dev hooks: `window.__heldItem()` → current item id; `window.__cycleItem()` → advances held item, returns new id; `window.__giveGift(name)` → gives held item to the named dino, returns `{ verdict, hearts }`.

## Acceptance criteria
- [ ] `giftReaction(item, traits)` returns a verdict in {loved, liked, neutral, disliked} and a numeric `delta` whose sign matches (loved/liked > 0, neutral small ≥0, disliked < 0) (unit).
- [ ] A curious-dominant personality `loved` the Shiny Shell; a calm (low-energy) personality `loved` the Smooth Rock; cross-pairings are not "loved" (unit).
- [ ] `giftReaction` with no traits → a defined neutral-ish verdict, no throw (unit).
- [ ] There are ≥4 gift items, all with distinct ids (unit).
- [ ] Giving a loved gift raises the dino's affinity more than a disliked gift lowers it is *not* required — but a loved gift strictly increases points and a disliked gift strictly decreases them (clamped to [0,100]) (unit, via the friendship `bumpPoints`).
- [ ] `__giveGift('Rex')` returns a verdict string and changes Rex's stored affinity; the change persists across reload (e2e).
- [ ] `__cycleItem()` changes `__heldItem()` and wraps around the item list (e2e).
- [ ] No regression: greet/hearts/clock/day-night/save/brain suites green (e2e).
- [ ] `npm run build` clean; vitest + playwright green.

## Out of scope
- A full inventory / item pickup from the world (items are an infinite held palette this cycle).
- Item rarity, crafting (BACKLOG-029), or gift cooldowns / once-per-day limits.
- Sprite art for items — text label + emoji only.
- NPC remembering specific past gifts (just the affinity number moves).

## Constraints
- Reaction math lives in a pure `social/gifts.ts` (no Phaser), Node-testable.
- Reuse `bumpPoints` (friendship) for the affinity change and the existing save path for persistence — do not add a second affinity store.
- Reuse `Personality`/traits (010); the held-item state is scene-local (not persisted this cycle).
- No new dependencies. TypeScript strict; `any` only via the documented dev-hook pattern.
- Don't break the Z greet, the C hearts panel, or the day/night overlay depth ordering. The gift HUD is built in `WorldScene` like the clock HUD.
