# Cycle 75 — Code Plan

Both tracks are thin glue over pure helpers, no save change, no new deps. Shared file: `WorldScene.ts` (disjoint regions — see Risks).

---

## Lore track — BACKLOG-342: Tell of the grove

**Item:** A dino freshly back from the grove leads its next gossip with grove news.

**Files to create:**
- `game/src/world/groveword.ts` — pure, mirrors the `spreadColdWord` shape in `cold.ts`:
  - `export const GROVE_NEWS_TOKEN = 'pond over in the grove';`
  - `export function groveNewsMemory(): string` → `'🌿 saw the pond over in the grove'` (shareable — no `RUMOR_MARK`, contains the token).
  - `export function groveWordLine(speaker: string): string` → `` `${speaker} ${RUMOR_MARK} you should see the pond over in the grove` `` (carries `RUMOR_MARK` → 1 hop, like `coldWordLine`).
  - `export function spreadGroveWord(store, speaker, listener): { store, rumor }` — `speaker===listener` → null; if `recall(store,speaker).some(e => isShareable(e) && e.includes(GROVE_NEWS_TOKEN))` plant `groveWordLine(speaker)` on listener and return it, else `{ store, rumor: null }`. Imports `remember, recall, MemoryStore` from `../ai/memory` and `RUMOR_MARK, isShareable` from `../social/gossip` (exactly as cold.ts does).

**Files to modify:**
- `game/src/scenes/WorldScene.ts`:
  - import `{ spreadGroveWord, groveNewsMemory }` from `../world/groveword`.
  - `crossDino` (~L2808): after the existing `logEvent`/339 block, when `dest === BOWL_ID`, `this.memory = remember(this.memory, d.name, groveNewsMemory())` (a return crossing files grove news). Place it before `void this.saveGame()` so it persists with the crossing.
  - gossip cascade (~L2044–2052): add a `grove` rung between `cold` and `gossip`:
    `const grove = cold.rumor ? cold : spreadGroveWord(this.memory, a.name, b.name);`
    `const gossip = grove.rumor ? grove : spreadGossip(this.memory, a.name, b.name);`
    and an else-if log between the cold and gossip lines:
    `else if (grove.rumor) this.logEvent(\`🌿 ${b.name} heard about the grove from ${a.name}\`);`
  - dev hook (near `__coldWord` ~L1635): `(window as any).__groveWord = (s: string) => groveWordLine(s);` and reuse existing `__memory`/`__recall` for assertions (a `__recall` is not present — `__memory` returns the whole store; the e2e reads `__memory()[name]`).

**Reuse list:**
- `game/src/social/gossip.ts` — `RUMOR_MARK`, `isShareable` (token discipline; do NOT reinvent the rumor mark).
- `game/src/ai/memory.ts` — `remember`, `recall`, `MemoryStore`.
- `game/src/world/cold.ts` — the `spreadColdWord` function is the exact template; copy its shape.
- The existing cascade + `__memory` hook in WorldScene.

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/groveword.test.ts`: `spreadGroveWord` plants on a speaker with grove news; returns null without it; null on self; the news memory is shareable + contains the token; the spread line carries `RUMOR_MARK` (won't re-spread); precedence sanity (a memory with both cold token and grove token — assert `spreadColdWord` still fires, documenting the cascade order the scene relies on).
- E2E `tests/e2e/cycle-075-grove-word.spec.ts`: drive a dino grove→bowl via `__migrate`/`__startMigration`+steps; assert `__memory()[name]` contains the grove-news memory; force a meeting (`__spreadGroveWord` or the existing meet hook) and assert the listener's memory gains the rumor.

---

## Structure track — BACKLOG-316: Zone indicator

**Item:** Plaque line with active zone + per-zone population.

**Files to create:** none.

**Files to modify:**
- `game/src/world/zones.ts`:
  - `export function zonePopulations(map: Record<string,string>, names: string[], fallback: string): Record<string, number>` — seed every `ZONES` id to 0, then for each name `++acc[zoneOf(map,name,fallback)]`. Returns counts keyed by zone id (covers every ZONES id, plus the fallback).
- `game/src/ui/plaque.ts`:
  - extend `PlaqueStats` with `zoneTally?: string` (additive).
  - `plaqueLines`: after the optional stores push, `if (s.zoneTally) lines.push(\`Zones · ${s.zoneTally}\`);`.
  - `export function zoneTallyLine(pops: Record<string,number>, activeZoneId: string): string` — map `ZONES` to `` `${z.id===activeZoneId ? '▸' : ''}${z.name} ${pops[z.id] ?? 0}` `` joined by `' · '`. (Import `ZONES` from `../world/zones` — plaque.ts stays Phaser-free; zones.ts is pure, so no cycle risk.)
- `game/src/scenes/WorldScene.ts`:
  - import `zonePopulations` (already imports from zones.ts) and `zoneTallyLine` from `../ui/plaque`.
  - a private helper `private zoneTally(): string { return zoneTallyLine(zonePopulations(this.dinoZones, this.dinos.map(d => d.name), BOWL_ID), this.zoneId); }`.
  - `refreshPlaque` (~L517) and `__plaque` (~L488): add `zoneTally: this.zoneTally()` to the stats object (both sites, kept in sync). `__plaque` already returns an object literal — add the field there too so e2e can read it.

**Reuse list:**
- `game/src/world/zones.ts` — `ZONES`, `zoneOf`, `BOWL_ID`; `zonePopulations` is the per-zone twin of the existing `occupiedZones` (which dedups; this one counts) — put it beside it.
- `game/src/ui/plaque.ts` `plaqueLines` — extend, don't replace (the stores line is the precedent for an optional appended line).

**New dependencies:** none.

**Test plan:**
- Unit `tests/unit/plaque.test.ts` (extend): `zonePopulations` counts by home zone, unmapped → fallback, all ZONES ids present; `zoneTallyLine` marks the active zone with `▸` and only it; `plaqueLines` appends the `Zones · …` line when `zoneTally` set and omits it when absent (backward-compat, like the stores line).
- E2E `tests/e2e/cycle-075-zone-indicator.spec.ts`: boot, assert `__plaque().zoneTally` starts `▸Pocket Cretaceous`; `__setZone('grove')`, assert the `▸` moved to `The Grove`; `__migrate(name,'grove')` + refresh, assert grove count rose / bowl fell.

---

## Risks
- **Shared file `WorldScene.ts`:** the two tracks touch different regions — 342 edits `crossDino` (~L2808), the gossip cascade (~L2044), and a hook (~L1635); 316 edits the plaque block (~L488/L514) and adds a `zoneTally` helper. No overlap. **Order:** do 316 first (plaque, self-contained), then 342 (cascade + crossDino), to keep diffs reviewable — but either is safe.
- **`plaque.ts` importing `zones.ts`:** zones.ts is pure (no Phaser, no plaque import) so no import cycle. Verified: zones.ts imports nothing from ui/.
- **Cascade precedence:** the grove rung must sit *after* cold (a warmed/cold dino still leads with that) and *before* generic gossip. Mind the else-if log order matches the `?:` order (the existing comment at L2040 documents this contract).
- **`▸` glyph in the plaque font:** it's a common Unicode arrow; if it renders as tofu, fall back to `» `/`* ` — QA eyeballs the screenshot. (Low risk; emoji already render in this plaque.)

## Estimated touch count
~6 files: `groveword.ts` (new), `zones.ts`, `plaque.ts`, `WorldScene.ts`, `tests/unit/groveword.test.ts` (new), `tests/unit/plaque.test.ts` (extend), + 2 e2e specs. Core production code is 4 files; within one fire.
