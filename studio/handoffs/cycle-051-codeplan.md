# Cycle 51 — Code Plan

**Item** — BACKLOG-223 [emergent] Word of the warmth — the keeper-warmth (184) lets the good news slip on the gossip spine, a bright 1-hop rumor mirroring the cold word (185).

## Reuse list (MUST use, do not reinvent)

- `game/src/social/gossip.ts` — `RUMOR_MARK` (the 1-hop marker), `isShareable(event)` (first-hand-vs-rumor test). The warm word reuses both verbatim, exactly as `coldWordLine`/`spreadColdWord` do.
- `game/src/ai/memory.ts` — `recall`, `remember`, `MemoryStore`. Already imported in `cold.ts`.
- `game/src/world/cold.ts` — `warmMemory()` (the existing first-hand memory the warm word reads), and the **cold-word trio** (`COLD_NEWS_TOKEN` / `coldWordLine` / `spreadColdWord`) as the exact template to mirror.
- The converse seam in `WorldScene.ts` (≈ lines 1400–1407) already does cold→generic two-tier fallback; we insert a warm tier above it. The `__rememberCold` hook (≈ line 1158) is the template for `__rememberWarm`.

No new gossip machinery, no new dependency — this is the cold-word feature with `warm` swapped for `cold` and a precedence flip.

## Files to create

- `tests/e2e/cycle-051-warm-word.spec.ts` — e2e mirroring `cycle-049-cold-word.spec.ts`:
  - Plant a warm memory on Rex (`__rememberWarm('Rex')`), converse Rex→Mossback via `__spreadWarmWord`, assert the rumor is non-null + contains 'Rex', and `__memory().Mossback` contains `__warmWord('Rex')`. Second hop Mossback→Sunny returns null (1 hop).
  - Warm-over-cold precedence at the converse seam: plant BOTH `__rememberCold('Rex')` and `__rememberWarm('Rex')`, run a forced conversation Rex→Mossback (the `__forceConverse`/`__converse` hook used by cycle-049/050 e2e — confirm the exact hook name in WorldScene while wiring), and assert Mossback's memory gained the **warm** word, not the cold word, and the log shows the 😊 line.

## Files to modify

- `game/src/world/cold.ts` — add a warm-word trio directly under the cold-word block (mirrors lines 69–99):
  - `export const WARM_NEWS_TOKEN = 'the keeper warmed';` — a stable substring of `warmMemory()` (`'the keeper warmed me after a cold night'`). Pinned by unit test; note it is **not** a substring of `coldMemory()` or `neglectMemory()`.
  - `export function warmWordLine(speaker: string): string` — `` `${speaker} ${RUMOR_MARK} the keeper came for them, warmed them right out of the cold` ``. Carries `RUMOR_MARK` ⇒ 1 hop; distinct from `warmMemory()` and `coldWordLine()`.
  - `export function spreadWarmWord(store, speaker, listener): { store, rumor }` — exact structural copy of `spreadColdWord`: `speaker===listener` ⇒ null; require a `recall` entry that `isShareable(e) && e.includes(WARM_NEWS_TOKEN)`; plant `warmWordLine(speaker)` via `remember`, else null.
- `game/src/scenes/WorldScene.ts`:
  - Import `WARM_NEWS_TOKEN`-adjacent symbols: add `warmWordLine, spreadWarmWord` to the existing `from '../world/cold'` import (line 55).
  - Converse seam (≈1401–1407) — insert the warm tier above cold, three-tier fallback:
    ```ts
    const warm = spreadWarmWord(this.memory, a.name, b.name);
    const cold = warm.rumor ? warm : spreadColdWord(this.memory, a.name, b.name);
    const gossip = cold.rumor ? cold : spreadGossip(this.memory, a.name, b.name);
    this.memory = gossip.store;
    if (warm.rumor) this.logEvent(`😊 ${b.name} heard the keeper warmed ${a.name}`);
    else if (cold.rumor) this.logEvent(`🥶 ${b.name} heard about ${a.name}'s cold night`);
    else if (gossip.rumor) this.logEvent(`🗣️ ${b.name} heard news about ${a.name}`);
    ```
    (When `warm.rumor` is null this is byte-identical to today — `spreadColdWord` runs exactly as before. When warm fires, `cold`/`gossip` alias `warm` so the store chains through `warm.store` and only the 😊 branch logs.)
  - Dev hooks beside `__spreadColdWord`/`__coldWord`/`__rememberCold` (≈1140–1160):
    ```ts
    (window as any).__spreadWarmWord = (a: string, b: string) => {
      const g = spreadWarmWord(this.memory, a, b);
      this.memory = g.store;
      return g.rumor;
    };
    (window as any).__warmWord = (speaker: string) => warmWordLine(speaker);
    (window as any).__rememberWarm = (name: string) => {
      this.memory = remember(this.memory, name, warmMemory());
    };
    ```
- `tests/unit/cold.test.ts` — add a `describe('word of the warmth (BACKLOG-223)')` block mirroring the cold-word tests:
  - `WARM_NEWS_TOKEN` is a substring of `warmMemory()` and NOT of `coldMemory()` / `neglectMemory()`.
  - `warmWordLine('Rex')` contains `RUMOR_MARK` + 'Rex', distinct from `warmMemory()` and `coldWordLine('Rex')`.
  - `spreadWarmWord` plants on a warm-carrier, returns null for a no-warm-memory speaker, null for `speaker===listener`, and null on the second hop (planted rumor not re-shareable).
  - **Precedence**: a store where the speaker has both `coldMemory()` and `warmMemory()` — assert `spreadWarmWord` fires (returns the warm line). (The seam ordering itself is covered by the e2e.)

## New dependencies

none.

## Test plan

- **Unit (vitest)** — `tests/unit/cold.test.ts`: token membership/exclusion, `warmWordLine` shape + distinctness, `spreadWarmWord` plant/null/self/1-hop, warm-carrier detection with both memories present. ~7 new assertions.
- **E2E (playwright)** — `tests/e2e/cycle-051-warm-word.spec.ts`: (1) warm word spreads one hop via `__spreadWarmWord` + lands in `__memory`; (2) warm-over-cold precedence through a forced conversation + 😊 log line. Pin specs `cycle-049-cold-word` + `cycle-020-gossip` must stay green untouched.

## Risks

- **The `warmMemory()` ⊃ "cold night" overlap is the crux.** `spreadColdWord` matches a warmed dino today (its warm memory contains the cold token). The fix is purely the converse *ordering* (warm checked first); `spreadColdWord` stays byte-unchanged, so the cycle-049 pin (which plants a *pure* cold memory via `__rememberCold`) is unaffected. Do not "fix" `spreadColdWord` to exclude warm memories — that would change its tested contract; the ordering is the right lever.
- Confirm the forced-conversation hook name in WorldScene (cycle-049/050 e2e used it) before writing the precedence e2e; if no direct hook lands a converse cleanly, assert precedence at the unit level on `spreadWarmWord` + a focused seam check instead (the ordering logic is small and unit-pinnable via the two spread fns).
- Keep the 😊 log register distinct from 🥶/🗣️ so QA can read which tier fired.

## Estimated touch count

~4 files (cold.ts, WorldScene.ts, cold.test.ts, new e2e). Under the 6-file ceiling.

---

## Shipped

**Files touched (4, exactly as planned):**
- `game/src/world/cold.ts` — added the warm-word trio under the cold-word block: `WARM_NEWS_TOKEN = 'the keeper warmed'` (a substring of `warmMemory()`, not of `coldMemory()`/`neglectMemory()`), `warmWordLine(speaker)` (carries `RUMOR_MARK` → 1 hop, distinct from `warmMemory()`/`coldWordLine()`), and `spreadWarmWord(store,speaker,listener)` (a structural copy of `spreadColdWord`).
- `game/src/scenes/WorldScene.ts` — import of `spreadWarmWord`/`warmWordLine`; converse seam now three-tier (warm → cold → generic), with the 😊 log register; hooks `__spreadWarmWord`/`__warmWord`/`__rememberWarm` beside the cold ones.
- `tests/unit/cold.test.ts` — `describe('word of the warmth (BACKLOG-223)')`: token membership/exclusion, line shape + distinctness, plant/null/self/1-hop, and the both-memory precedence pin (warm detector fires though the cold word also matches).
- `tests/e2e/cycle-051-warm-word.spec.ts` — new: warm word spreads one hop + lands in `__memory`; warm-over-cold precedence through `__forceConverse` + the 😊 log line.

**Deviations:** none. The converse change stays byte-identical whenever no warm memory is present, so `spreadColdWord`/`spreadGossip` and every existing spec are untouched.

**Build:** ✅ `npm run build` clean (type-check passes). **Unit:** ✅ `npm run test:unit` 462 passed (46 files, +9 warm-word). **Dev smoke:** ✅ HTTP 200. E2E handed to QA.
