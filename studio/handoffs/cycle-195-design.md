# Cycle 195 — Design

## Lore track — BACKLOG-624

**Item:** BACKLOG-624 [social] A grudge in the way.

**Why this cycle:** Milestone 34 lore arc 1. On the cycle-194 probe the founding feud paired at 09:54 because courtship
never reads grudges. A pair should be something the park chose, and a refusal is a better first-morning beat than a
silent blind spot.

**What ships:**
- `courtship()` takes the grudge graph. When the two hold a grudge ≥ `RIVAL_BAR` (20), the courter still tries, and
  the courted one refuses: ticker `💔 Mossback courts Twitch with a pretty stone. Twitch hasn't forgiven Mossback.`;
  the courter's bubble is its gift line, the courted one answers `🙄`, and the courter files
  `I courted Twitch with a pretty stone; Twitch hasn't forgiven me`. No pair, no nest, no jilt.
- A grudge above zero but below the bar does not block. If such a pair forms, the yes ticker gains
  ` Old rivals, come round.` and both file the normal memory.
- The courter's `courtedDay` is set on a refusal, exactly like a gentle no, so it is once a day.

**Acceptance criteria:**
- [ ] unit: a grudge ≥ `RIVAL_BAR` between two mutual closest friends yields `accept: false, grudge: true`; below the bar yields `accept: true`.
- [ ] unit: refusal ticker / memory text as above; a sub-bar accepted courtship's ticker ends `Old rivals, come round.`
- [ ] e2e: in the as-shipped founding state, `__court('Mossback','Twitch')` logs the refusal, `__pairs()` has no Mossback/Twitch, Twitch shows no nest.
- [ ] e2e: Rex and Sunny (no grudge) still pair on `__court`.

**Out of scope:** grudges cooling faster because of a courtship; the courter's sulk.

**Constraints:** no dice; `courtship.ts` is shared with the structure track (different functions).

## Structure track — BACKLOG-625

**Item:** BACKLOG-625 [core] The wedding.

**Why this cycle:** Milestone 34's spine. The pair exists, the nest exists; nothing marks the pair in front of the park.

**What ships:**
- New pure `game/src/social/wedding.ts`: `WEDDING_HOUR = 15`, `WEDDING_MIN = 60`, `GUEST_BOND = 10`,
  `WEDDING_ART_KEY = 'wedding'`, `WED_GLYPH = '💍'`; `weddingDue(t, pairs)` → the first unwed pair (by name) formed on or
  before today, when `t.hour === WEDDING_HOUR`; `weddingGuests(a, b, present, bonds, zone)`; ticker / memory / close lines.
- `Pairs` gains optional `wed?: number` (the day). `isPairs` validates it. `mateBookLine` reads `💍 wed to X (day N)`
  once wed.
- WorldScene: checked on the festival cadence (`FESTIVAL_CHECK_MS`), never over a festival, service or sky event.
  Both mates must be awake, settled and on the nest's ground, else it waits (the hour, or tomorrow's). On start:
  `pairs[*].wed = day` for both, ticker `💍 Rex and Sunny are wed at their nest. Ember and Glade came.`
  (or `... with nobody but each other.`), every mate and guest files a memory, the mates bubble 💍,
  a wedding mark (`makeHourMark('wedding','💍')`) stands one tile above the nest.
  Ladder branch (beside the service's): mates walk to their berths, guests ring round the nest at radius 1.
  After `WEDDING_MIN` game minutes: `💍 The guests drift home from Rex and Sunny's nest.`, mark removed.
- Hooks: `__wedding()`, `__holdWedding()`, `__closeWedding()`.

**Acceptance criteria:**
- [ ] unit: `weddingDue` false off the hour, false for a wed pair, true at 15:00 for a pair formed today; `isPairs` accepts `wed` numbers, rejects strings.
- [ ] unit: `weddingGuests` excludes the mates, other grounds, sleepers, migrants and bonds < 10.
- [ ] e2e: as-shipped, pair Rex+Sunny, `__setClock(1,15,0)`, `__holdWedding()` → `__pairs().Rex.wed === 1`, ticker line, guests walk within 1 tile of the nest in ≤ 20 steps, the book reads `wed to Sunny`, the wed day survives a reload.
- [ ] e2e: unattended reach — a fresh as-shipped boot, run the world from 08:00 to 15:30 by steps and the cadence; the ticker carries a `💍` wed line.
- [ ] build clean, vitest + playwright green, web-llm boundary intact, save additive.

**Out of scope:** toasts (next lore arc), a shared den/pantry (next structure arc), weddings off the bowl laying eggs.

**Constraints:** one wedding at a time; the service and festival keep priority.
