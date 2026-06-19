# Cycle 59 — Code Plan

Two tracks. They share no files — build in either order.

---

## Lore track — BACKLOG-271 (wistful greeting)

### Files to create
- `tests/unit/cycle-059-wistful-greeting.test.ts`

### Files to modify
- `game/src/ai/brain.ts`
  - Add `export const WISTFUL_MAX = 1;` (hearts) near `EFFUSIVE_MIN`, comment-pinned as the neglected-pole cutoff.
  - Add `export function wistfulGreeting(name: string): string` — a wistful, name-bearing line, e.g.
    `` `Oh… you came to see *me*, ${name}? I wasn't sure you still knew I was here.` ``.
  - In `cannedReply`: after the existing `if (ctx.gratitude)` block and **before** the random
    `cannedGreetings` pick, add: `if (ctx.affection !== undefined && ctx.affection <= WISTFUL_MAX) return { text: wistfulGreeting(ctx.name), mood: moodFromTraits(ctx.traits), source: 'canned' };`
- `game/src/ai/webllmBrain.ts`
  - In `buildMessages` (line ~55): when `!ctx.gratitude && ctx.affection !== undefined && ctx.affection <= 1`,
    append a wistful instruction to the system prompt (e.g. `You barely know this keeper — they almost never visit you. Greet them wistfully, hoping to be noticed, a little unsure they remember you.`).
    Must NOT fire when gratitude is set or affection is higher. Keep the existing `rel`/time/mood threading intact.

### Reuse list
- `moodFromTraits` (brain.ts) — reuse for the wistful reply's mood. Do not reinvent.
- `relationshipLabel`/`ctx.affection` (webllmBrain.ts:18,62) — affection is already in context at both greet sites (WorldScene 1682, 2164); no WorldScene change.

### New dependencies
none.

### Test plan
- Unit (`cycle-059-wistful-greeting.test.ts`): `wistfulGreeting` contains the name; `WISTFUL_MAX===1`;
  `cannedReply` wistful at affection 0 and exactly 1, generic at 2, generic when affection undefined;
  gratitude beats wistful at affection 0; `buildMessages` includes the wistful clause for a neglected
  dino and omits it for a befriended one and for a grateful one.
- E2E (`tests/e2e/cycle-059-wistful-greeting.spec.ts`): boot, force a dino to 0 hearts (existing
  friendship hook), greet headless, assert the reply matches the wistful line + names the dino + is not
  a thanks line; no console errors. (Cite existing greet/friendship e2e hooks — reuse `__greet`/
  friendship setters used by cycle-051/058 specs.)

### Risks
- The gratitude branch must stay first so a cleared-name dino at 0 hearts still thanks. Order matters.

---

## Structure track — BACKLOG-143 (connected zone spine)

### Files to create
- `game/src/world/zones.ts` (pure, no Phaser)
- `tests/unit/cycle-059-zones.test.ts`

### Files to modify
- `game/src/world/saveGame.ts` — add `zoneId?: string` to `SaveData` (additive, after `keeperId`);
  in `deserialize`, validate-if-present (string only) and **default to `'bowl'`** in the returned
  object so old saves resolve to the bowl. Mirror the `keeperId` additive pattern exactly.
- `game/src/scenes/WorldScene.ts`
  - Import the zones module. Add `private zoneId: string = BOWL_ID;`.
  - In the keeper move handler, **before** the clamp at lines 2109–2110: compute
    `const edge = crossing(this.player.x, this.player.y, COLS, ROWS, TILE);` then
    `const link = edge ? linkedZone(this.zoneId, edge) : null;` if `link`, set `this.zoneId = link.zoneId`,
    `this.player.setPosition(link.entry.x, link.entry.y)` (or `.x/.y =`), call `this.updatePlaque()` /
    refresh the zone label, and `return`/skip the clamp this frame. Else clamp as today.
  - Add a zone-name line: extend the plaque update (line ~392) or add a small text; simplest is to append
    the zone name to the existing plaque via `plaqueLines` caller — keep both zones on the same grass
    floor this cycle (no repaint needed; grove distinct tiles are BACKLOG-033, now unblocked).
  - `currentSaveData()` (2614): add `zoneId: this.zoneId`.
  - Restore (2667 area): `this.zoneId = save.zoneId ?? BOWL_ID;` and reposition/repaint if needed.
  - Hooks: `(window as any).__zone = () => this.zoneId;` and a dev `(window as any).__setZone = (id) => { this.zoneId = id; this.updatePlaque(); };`

### `zones.ts` shape
```ts
export const BOWL_ID = 'bowl', GROVE_ID = 'grove';
export interface Zone { id: string; name: string; }
export const ZONES: Zone[] = [{id:BOWL_ID,name:'Pocket Cretaceous'},{id:GROVE_ID,name:'The Grove'}];
export function zoneById(id: string): Zone { return ZONES.find(z=>z.id===id) ?? ZONES[0]; }
export type Edge = 'east' | 'west';
// past the grid on x → which edge (this spine: only east/west links exist)
export function crossing(px:number,py:number,cols:number,rows:number,tile:number): Edge | null { ... }
// neighbour + entry pixel on the far side (enter at opposite edge, same y)
export function linkedZone(zoneId:string, edge:Edge): { zoneId:string; entry:{x:number;y:number} } | null { ... }
export function setZone(m:Record<string,string>, id:string, zoneId:string): void { m[id]=zoneId; }
export function zoneOf(m:Record<string,string>, id:string, fallback:string): string { return m[id] ?? fallback; }
```
Note: `crossing` needs the keeper x/y and grid; `linkedZone` entry uses tile/cols to land the keeper one
tile in from the opposite edge at the same y. The bowl links **east→grove**; the grove links **west→bowl**;
all other edges return null (keeper clamps normally). Keep `linkedZone` pure — pass `py`/entry y through
from the caller (WorldScene supplies the keeper's current y so vertical position is preserved).

### Reuse list
- `COLS`/`ROWS`/`TILE` (WorldScene:93–95) — pass into `crossing`/`linkedZone`; don't redefine.
- The `keeperId`/`scale` additive-save pattern (saveGame.ts) — copy it for `zoneId`.
- `updatePlaque` (WorldScene:392) + `plaqueLines` (ui/plaque) — extend for the zone name; don't add a parallel HUD.

### New dependencies
none.

### Test plan
- Unit (`cycle-059-zones.test.ts`): `crossing` returns `'east'` past the east grid edge, `null` inside;
  `linkedZone('bowl','east')` → grove with entry near west (x small), `('grove','west')` → bowl with
  entry near east (x large), y preserved; `linkedZone('bowl','west')` → null; `setZone`/`zoneOf`
  round-trip + fallback; `zoneById` fallback.
- Unit (extend save test or add to zones test): `serialize`→`deserialize` round-trips `zoneId:'grove'`;
  a payload without `zoneId` deserializes with `zoneId:'bowl'`.
- E2E (`tests/e2e/cycle-059-connected-zone.spec.ts`): boot → `__zone()==='bowl'`; drive the keeper off
  the east edge (move keys / set position then step) → `__zone()` flips to `'grove'` and keeper x is on
  the west side; reverse → back to `'bowl'`. No console errors. Existing bowl specs (movement, glass,
  feeding) must stay green (crossing is a no-op unless you walk off the linked edge).

### Risks
- The crossing check must run **before** the clamp and must be a strict no-op when the keeper isn't past
  the linked edge, or it could perturb normal movement (regression risk to every bowl spec). Gate tightly.
- Don't let `__setZone` repaint-thrash; it only sets id + plaque.

### Estimated touch count
Lore: ~3 files. Structure: ~4 files. Combined ~7, but cleanly split per track (each ≤4) — within bounds.

---

## Follow-up filed
- **BACKLOG-274** [core] Populate the grove — migrate/assign dinos per zone and filter cross-zone
  rendering + interaction, building on 143's occupancy API (`setZone`/`zoneOf`) and the walkable second
  zone. Added to the Structure Track queue for a later structure-track cycle.
