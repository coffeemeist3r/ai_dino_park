# Cycle 193 — QA

Board: `npm run build` clean; `npx vitest run` **3430 passed / 3 skipped** (337 files); `npx playwright test`
**936/936** on the first full run (9.0 min), no flakes. `@mlc-ai/web-llm` imports stay under `game/src/ai/`.

## Lore track — BACKLOG-618

- [x] Unit: accept for Mossback/Glade on founding bonds; decline when the courted one's closest is a third dino (Ember→Sunny at 25); null under 24, for a youngster, for an already-paired dino. `courtGift` maps all five keywords and falls back to `a long walk`. (`cycle-193-courtship.test.ts`)
- [x] e2e: `__forceConverse('Mossback','Glade')` forms the pair; one 💕 ticker line naming courter, courted and the courter's own gift; both memories; book `💕 sweet on Glade (since day 1)` and its mirror.
- [x] e2e: a second meeting adds nothing.
- [x] e2e: Ember (25) courts Sunny and is turned down with the 💔 line; no pair; a second try the same day does nothing.
- [x] e2e: Bramble cannot court young Pip before 14:00; at 14:30 Pip is adult and the pair forms.
- [x] No `rand()` in `courtBeat` / `courtship.ts` (read); boundary grep clean.

## Structure track — BACKLOG-620

- [x] Unit: `isPairs` accepts good, rejects a non-string mate / non-number day; `deserialize` round-trips `pairs`, rejects a malformed one, leaves an older save's `pairs` undefined.
- [x] e2e: reload restores the pair with its day.
- [x] e2e: placed 8 tiles apart, the pair closes to ≤ 3 tiles within 20 steps and holds ≤ 3 for 20 more.
- [x] Unpaired wander unchanged: full e2e suite green, no RNG-luck reds.

## Reachability probe (not committed)

A throwaway spec booted the as-shipped founding and only stepped the world (no hooks into courtship). The first pair
formed at **world step 14**, through the production meeting path: *"💕 Rex courts Sunny with a pretty stone. Sunny says
yes."* So the first courtship lands in the first minute of a fresh park, not only through the debug hook.

10/10 criteria pass.
