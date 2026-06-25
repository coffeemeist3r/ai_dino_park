# Cycle 78 — Code Plan

Two disjoint tracks. TDD: write/extend the unit specs first, then the source, then the e2e.

---

## Lore track — BACKLOG-355 (tiered grove pull by recency)

**Files:**
- `game/src/world/curiosity.ts` — add `grovePull`, reimplement `groveCurious` on top of it.
- `game/src/scenes/WorldScene.ts` — `pickMigrant` grades by pull; swap the `groveCurious` import for
  `grovePull` (keep nothing else). Add one dev hook `__remember(name, event)` for the e2e.
- `tests/unit/curiosity.test.ts` — extend with the 3-tier grading + preserve the 345 cases.
- `tests/e2e/cycle-078-grove-pull.spec.ts` — new.

**`curiosity.ts`:**
```ts
export const GROVE_TELL_RECENT = 3; // a grove telling within the last N memories is a *fresh* (strong) pull

// 0 = no pull, 1 = ambient (the token has aged toward the back of the ring), 2 = freshly told.
export function grovePull(events, visited, name, homeZone): 0 | 1 | 2 {
  if (homeZone !== BOWL_ID || visited.includes(name)) return 0;
  if (!events.some((e) => e.includes(GROVE_NEWS_TOKEN))) return 0;
  const recent = events.slice(-GROVE_TELL_RECENT);
  return recent.some((e) => e.includes(GROVE_NEWS_TOKEN)) ? 2 : 1;
}

// 345 predicate preserved exactly: curious iff there's *any* grove pull.
export function groveCurious(events, visited, name, homeZone): boolean {
  return grovePull(events, visited, name, homeZone) > 0;
}
```
`GROVE_NEWS_TOKEN` already imported from `./groveword`; no new import. `groveword.ts` is **not touched**.

**`pickMigrant` (WorldScene):**
```ts
private pickMigrant(): Dino | null {
  const candidates = this.dinos.filter((d) => !this.migrating.has(d.name));
  const pull = (d: Dino) =>
    grovePull(recall(this.memory, d.name), this.groveVisited, d.name, zoneOf(this.dinoZones, d.name, BOWL_ID));
  const told = candidates.filter((d) => pull(d) === 2);
  const curious = candidates.filter((d) => pull(d) >= 1);
  const pool = told.length ? told : curious.length ? curious : candidates;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}
```
Behaviour vs 345: when nobody is freshly told, `curious` is exactly the old `groveCurious` pool → 345
unchanged. The only new behaviour is preferring pull-2 over pull-1.

**Dev hook (for the e2e to age a telling):** `(window as any).__remember = (name, event) => { this.memory = remember(this.memory, name, event); };`
(`remember` is already imported.)

**Unit tests (extend curiosity.test.ts):** the 4 existing 345 cases stay (now exercising `groveCurious`
via `grovePull`). Add: fresh telling → pull 2; telling pushed back by 3 filler memories → pull 1;
telling aged out of the ring → pull 0; visited / grove-home → 0; `GROVE_TELL_RECENT` boundary.

**E2e (`cycle-078-grove-pull.spec.ts`):** boot; `crossOnce(Rex)` ×2 so Rex is first-hand+visited;
`__spreadGroveWord('Rex','Mossback')` then `__remember('Mossback', 'you ate a fern')` ×3 → Mossback
ambient (pull 1); `__spreadGroveWord('Rex','Sunny')` → Sunny freshly told (pull 2); assert
`__maybeMigrate()` returns `'Sunny'` and Sunny is the one `__migrating`. (Reuse the news-pull spec's
`crossOnce`/`step` helpers.)

---

## Structure track — BACKLOG-348 (zone resource bias)

**Files:**
- `game/src/world/resource.ts` — `pickKind` gains a zone arg + `ZONE_BIAS`/`BIAS_WEIGHT`.
- `game/src/scenes/WorldScene.ts` — `maybeSpawnResource` passes the zone; add dev hook `__biasKind`.
- `tests/unit/cycle-062-resource.test.ts` — extend with the bias cases (or a small new block).
- `tests/e2e/cycle-078-zone-bias.spec.ts` — new.

**`resource.ts`:**
```ts
import { BOWL_ID, GROVE_ID } from './zones'; // no cycle: zones.ts imports only ./movement

// Zone resource bias (BACKLOG-348): each zone leans toward its character — grove trees → branch,
// bowl ground → stone. A lean, not a lock: the off-kind still rolls past BIAS_WEIGHT.
export const ZONE_BIAS: Record<string, ResourceKind> = { [BOWL_ID]: 'stone', [GROVE_ID]: 'branch' };
export const BIAS_WEIGHT = 0.75;

export function pickKind(rand: () => number = Math.random, zone?: string): ResourceKind {
  const favored = zone ? ZONE_BIAS[zone] : undefined;
  if (!favored) return rand() < 0.5 ? 'branch' : 'stone';      // unchanged uniform path
  const other: ResourceKind = favored === 'branch' ? 'stone' : 'branch';
  return rand() < BIAS_WEIGHT ? favored : other;              // a lean, not a lock
}
```

**`maybeSpawnResource`:** change `const kind = pickKind();` → `const kind = pickKind(Math.random, zone);`
(the loop variable `zone` is the spawning zone). Nothing else moves.

**Dev hook:** `(window as any).__biasKind = (zone, r) => pickKind(() => r, zone);`

**Unit tests:** `pickKind(() => 0.1, GROVE_ID) === 'branch'`; `pickKind(() => 0.9, GROVE_ID) === 'stone'`
(off-kind appears); `pickKind(() => 0.1, BOWL_ID) === 'stone'`; `pickKind(() => 0.9, BOWL_ID) === 'branch'`;
`pickKind(() => 0.1)` and `pickKind(() => 0.9)` with no zone stay branch/stone (uniform, back-compat);
unknown zone id → uniform. Verify `BIAS_WEIGHT` is the 0.5↔favored boundary.

**E2e (`cycle-078-zone-bias.spec.ts`):** boot; assert `__biasKind(GROVE_ID, 0.1) === 'branch'`,
`__biasKind(GROVE_ID, 0.9) === 'stone'`, `__biasKind(BOWL_ID, 0.1) === 'stone'`,
`__biasKind(BOWL_ID, 0.9) === 'branch'` — proves the production bundle wires the per-zone bias.

---

## Reuse / boundary

- 355 reuses `recall`/`remember`/`GROVE_NEWS_TOKEN`/`zoneOf`/`BOWL_ID`; 348 reuses `ZONE` ids + the
  existing `pickKind` callsite. No new modules.
- No save-format change either track (355 derives from memory + `groveVisited`; 348's kind is already
  a transient per-zone spawn property).
- `@mlc-ai/web-llm` stays unimported by `curiosity.ts`/`resource.ts` (grep gate).
- Disjoint WorldScene methods: `pickMigrant` (355) vs `maybeSpawnResource` (348). No collision.

**Risk note (carried from the design):** the tempting 2nd-hop "hearsay relay" for 355 is rejected — it
would break the cycle-75 `groveword.test.ts` 1-hop contract. Recency grading needs no propagation change.
