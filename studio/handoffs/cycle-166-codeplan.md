# Cycle 166 — Code Plan

Sequencing note for the Coder: **land the structure track first.** It wraps `WorldScene.create()`'s
body, and the lore track's edits are elsewhere in the same file — doing it the other way round means
re-indenting work that was just written.

---

## Structure track — BACKLOG-553

### Files

| File | Change |
|---|---|
| `game/src/scenes/WorldScene.ts` | `create()` becomes a guard around a new `buildWorld()`; `__bootError` hook; `showBootFailure()` |
| `tests/e2e/helpers.ts` | `boot()` drains `pageerror`, writes the failure line, rethrows |
| `scripts/bootstats.mjs` | `summarize` counts/names failed boots; `formatSummary` prints them |
| `tests/unit/bootstats.test.ts` | new cases for the failure path |
| `tests/e2e/cycle-166-bootfail.spec.ts` | new — the forced-throw spec |

### `WorldScene.ts`

Rename the current `create(): void { … }` body verbatim to `private buildWorld(): void`. **No line
inside it moves** — this is a rename plus a wrapper, and the existing ordering (including
`__ready = true` on its last line) is untouched.

```ts
create(): void {
  (window as any).__bootError = null;
  // BACKLOG-553: a create() that throws partway never reaches `__ready`, so boot() waits out its whole
  // 30,000ms ceiling and the exception goes to a console nobody reads — which is this flake's third and
  // most honest candidate cause, *and* a player-facing silent failure the CHARTER forbids by name.
  try {
    if (bootFailureRequested()) throw new Error('forced boot failure (BACKLOG-553)');
    this.buildWorld();
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    (window as any).__bootError = { message: e.message, stack: e.stack ?? '', phase: 'create' };
    console.error('[boot] WorldScene.create() failed', e);
    this.showBootFailure(e.message);
  }
}
```

`bootFailureRequested()` — a module-local helper reading `?bootfail=1` off `location.search`, wrapped
in its own try/catch (a `location` read must never be the thing that breaks a boot). This is how the
spec forces the throw without a hook, which matters because **the hooks are attached inside the body
that just failed** — a `window.__forceBootFail()` set by `buildWorld()` could not exist on a boot that
never got that far. Dev-only in effect, harmless in production: nobody types it.

`showBootFailure(message: string)` — modelled on `showKeeperInvite` (monospace, `#000000aa` backing,
`setOrigin(0.5)`, depth well above the world), centred, no tween, two lines:

```
The bowl failed to open.
<message>
```

Its whole body sits in a try/catch that falls back to `console.error` only. A notice that throws while
reporting a throw turns one silent failure into two. It attaches no input handler and sets no modal
flag — a failed boot must not also break `Escape`.

`__ready` stays exactly where it is, on `buildWorld()`'s last line, so it keeps meaning "hooks attached".

### `tests/e2e/helpers.ts`

```ts
export async function boot(page: Page): Promise<void> {
  const t0 = Date.now();
  const pageErrors: string[] = [];
  const onError = (e: Error) => pageErrors.push(e.message);
  page.on('pageerror', onError);
  let canvasMs: number | null = null;
  try {
    await page.goto('/');
    await page.locator('canvas').waitFor({ state: 'visible', timeout: BOOT_TIMEOUT });
    canvasMs = Date.now() - t0;
    await page.waitForFunction(…__ready…, undefined, { timeout: BOOT_TIMEOUT });
  } catch (err) {
    recordBootFailure(page, { canvasMs, pageErrors, err });  // never throws
    throw err;                                               // the spec still fails, unchanged
  } finally {
    page.off('pageerror', onError);
  }
  recordBootLine(BOOT_LOG, { …unchanged success entry… });
  …the rest of boot() unchanged…
}
```

New exported `recordBootFailure(page, opts)`, so the fail-open behaviour is **proven by a test rather
than claimed by a comment** — the discipline `recordBootLine` already set. It writes:

```jsonc
{ at, source: 'suite', label: bootLabel(), canvasMs, readyMs: null,
  failedAt: canvasMs === null ? 'canvas' : 'ready',
  pageErrors: [...], bootError: <window.__bootError or null>, error: '<err.message>' }
```

Reading `__bootError` off a hung page can itself hang, so it goes through
`page.evaluate(...).catch(() => null)` **with a short timeout of its own** (2s, a local constant — not
`BOOT_TIMEOUT`; the instrument must not double the cost of the failure it is recording). The whole
function body is one try/catch that swallows everything, for the reason the module already documents:
a boot clock that can fail a spec is a worse instrument than no boot clock, and that now has to hold on
the failure path, where it matters more.

`failedAt` is derived from `canvasMs`, not from inspecting the error — an error message is a string
somebody can change; the clock is a fact.

### `scripts/bootstats.mjs`

`summarize(samples)` gains, beside the existing fields (which do not change — the existing tests pin
them): `failed` (count of entries with `ms === null`), and `failures` (array of
`{ label, failedAt, hadException }`, where `hadException` is `pageErrors.length > 0 || bootError != null`).
`summarize([])` still returns `null`.

`formatSummary` appends, only when `failed > 0`, a block naming each failure and whether an exception
was behind it. Zero failures prints nothing new — every existing assertion on the summary keeps holding.

`parseLog` is untouched.

### Tests

**`tests/unit/bootstats.test.ts`** (extend):
- `summarize` counts a null-`ms` entry as `failed`, and still excludes it from `count`.
- `failures` names the spec label and its `failedAt`.
- `hadException` is true with a `pageErrors` entry, false without — the two hangs are different lines.
- `formatSummary` with zero failures is unchanged; with one, it names it.
- `recordBootFailure` does not throw against an unwritable path (extends the existing fail-open proof)
  and does not throw when handed a page object whose `evaluate` rejects.

**`tests/e2e/cycle-166-bootfail.spec.ts`** (new, does **not** call `boot()` — it is testing the thing
`boot()` waits on):
- `page.goto('/?bootfail=1')`, then poll for `__bootError`: non-null, `message` contains `BACKLOG-553`.
- `__ready` is not `true`.
- The failure notice is on the page and carries the message.
- A control case: plain `page.goto('/')` and `__bootError` is `null` once `__ready` is true.

---

## Lore track — BACKLOG-162

### Files

| File | Change |
|---|---|
| `game/src/keeper/succession.ts` | new — `missesWatcher`, `missAside`, `switchMemory`, constants |
| `game/src/keeper/succession.test.ts` | new — unit, including the non-dormant-constant proof |
| `game/src/ai/brain.ts` | `GreetContext.missed`; compose `missAside` after `firstLook`, with precedence |
| `game/src/world/saveGame.ts` | `toldOfSwitch?: Record<string, string>` (additive, optional) |
| `game/src/scenes/WorldScene.ts` | `toldOfSwitch` field, save/load, `pickTone` wiring, `pickKeeperIndex` filing, dev hook |
| `tests/e2e/cycle-166-succession.spec.ts` | new |

### `game/src/keeper/succession.ts`

```ts
export const MISS_MARGIN = 0.5;
export const MISS_HEARTS = 5;

export function missesWatcher(prev: Keeper, next: Keeper, traits?: Personality, hearts = 0): boolean;
export function missAside(prevId: string | undefined, traits?: Personality): string;
export function switchMemory(prev: Keeper, next: Keeper): string;
export function watchersWithMisses(): string[];
export const MISS_ASIDE_MAX: number;
```

- `missesWatcher` — `hearts >= MISS_HEARTS || keeperFit(prev, traits) - keeperFit(next, traits) >= MISS_MARGIN`.
  `keeperFit` returns 0 for absent traits, so a traitless dino falls through to the hearts door only.
- `MISS_MARGIN = 0.5` **is measured, not chosen.** Computed over the founding roster's name-seeded
  traits against all twelve ordered watcher pairs, the smallest per-dino maximum fit drop is
  **Thornback's 0.63** (`aether -> vanta`); every one of the eight founding dinos clears 0.5 on at
  least one ordered pair. The reachable case the e2e pins is the obvious player action — boot, `K`,
  pick 1 (Aki, the default), `K`, pick 2 (Vix): **Sunny (1.24), Twitch (1.12), Bramble (1.38) and
  Thornback (0.63) all miss Aki**, at zero friendship on day 1. The unit test recomputes this from
  `ROSTER` rather than hard-coding the numbers, so a roster change that makes the constant dormant
  turns the suite red instead of turning the feature off quietly.
- `MISS_ASIDE_MAX` is derived by `Math.max` over the table exactly as `WATCHER_ASIDE_MAX` is — never
  typed as a literal.
- `MISSES` table, prickly / warm / plain per departed watcher id, each naming that watcher's own
  concrete tell, the same tells `voice.ts` established (the hum, the unblinking red eye, the round
  writing eye, the almost-family smell). The absence of a *specific* thing, never "something changed".
- `switchMemory(prev, next)` — the filed line, in the memory ring's existing terse style.

### `game/src/ai/brain.ts`

`GreetContext` gains `missed?: string`. At the aside site (currently line ~455):

```ts
const miss = missAside(ctx.missed, ctx.traits);
// BACKLOG-162: precedence — the miss wins and the first look waits for the next greet. Two watcher
// clauses in one sentence is a paragraph, not a beat, and `metWatcher` is untouched, so the suppressed
// first look still fires next time.
const firstLook = miss ? '' : watcherAside(ctx.watcher, ctx.traits);
const headroom = firstLook.length + miss.length;
if (miss) reply = { ...reply, text: reply.text + miss };
else if (headroom > 0) reply = { ...reply, text: reply.text + firstLook };
```

Exactly one of the two is ever appended, and `headroom` is 0 when neither is set — so every downstream
`slice(N + headroom)` keeps its current number and a reply with no watcher clause is byte-identical to
today. This is 160's own discipline, reused rather than re-derived; the pinned-string test is the proof.

### `WorldScene.ts`

- `private toldOfSwitch: Record<string, string> = {};` beside `metWatcher` (~671).
- `pickKeeperIndex` (~8430), inside the existing `if (changed)` block, **after** `switchTo` (so
  `previousId` is already filed) and **before** `saveGame()`:
  - `const left = keeperById(this.keeperRecord.previousId);`
  - file `switchMemory(left, keeper)` into every `this.dinos` entry via `remember(...)`;
  - clear `this.toldOfSwitch` — a new switch re-arms the whole park, the way `metWatcher` re-arms the
    first look;
  - count the missers with `missesWatcher(left, keeper, d.traits, heartsFromPoints(...))` and
    `logEvent` one ticker line naming the watcher that left and how many looked up.
  Reusing the existing `changed` flag is what keeps "a re-pick is not a switch" true in one place.
- `pickTone` (~8226), **hoisted above `recordTone`** beside the 160 block, for the reason that block
  documents:
  ```ts
  const prevWatcher = this.keeperRecord.previousId;
  const missing = prevWatcher !== undefined
    && this.toldOfSwitch[target.name] !== this.keeperId
    && missesWatcher(keeperById(prevWatcher), keeperById(this.keeperId), target.traits,
                     heartsFromPoints(this.friendship[target.name] ?? 0));
  if (missing) this.toldOfSwitch = { ...this.toldOfSwitch, [target.name]: this.keeperId };
  ```
  and `missed: missing ? prevWatcher : undefined` in the `greet` context, one line under `watcher`.
  The map is keyed to the **current** keeper id, so the same dino can miss again after a later switch —
  the `firstMeeting` idiom, not a boolean.
- Save (~9185): `toldOfSwitch: this.toldOfSwitch`. Load (~9343): `{ ...(save.toldOfSwitch ?? {}) }`.
  Optional and additive; `saveGame.ts` documents it beside `metWatcher`, in the same plain-typed style.
- Dev hook beside `__metWatcher` (~5275): `__toldOfSwitch = () => ({ ...this.toldOfSwitch })`.

### Tests

**`game/src/keeper/succession.test.ts`**
- Both doors, independently, and neither (the three `missesWatcher` criteria).
- The fit door at `hearts = 0`; the hearts door at a fit delta of 0 and at a *negative* one.
- **The non-dormant proof:** iterate `ROSTER`, derive traits with `seededPersonality(name)`, and assert
  every dino clears `MISS_MARGIN` on at least one ordered watcher pair; separately assert that the
  `aether -> vanta` switch — the one two keypresses from boot — produces a non-empty miss list.
- `missAside` non-empty and distinct for every `KEEPERS` id in all three shades; plain lines pairwise
  distinct; empty/undefined id returns `''`; `MISS_ASIDE_MAX` matches the table.
- `switchMemory` names both watchers.

**`game/src/ai/brain.test.ts`** (extend, or a sibling if the file is large)
- Pinned string: `missed` unset leaves the reply byte-identical.
- `missed` set appends the clause; `watcher` **and** `missed` set yields the miss and not the first look.

**`tests/e2e/cycle-166-succession.spec.ts`**
- Boot, `__openKeeperPicker()` + pick 1, then pick 2: `__keeperRecord()` shows `switches === 1` and
  `previousId === 'aether'`.
- `__ticker()` carries the change line; `__memory()` carries the filed line for every dino.
- Greet Sunny → the reply contains Aki's miss clause; greet again → it does not.
- `__toldOfSwitch()` carries Sunny under the new keeper id.
- Re-pick the worn observer: no new memory line, no new ticker line, `switches` unchanged.
- Reload after the switch (`__flushSave()` first, per 456) → `__toldOfSwitch()` survives.

---

## Reuse list (checked before writing anything new)

- `remember` / `recall` (`ai/memory.ts`) — the ring already exists; no new memory store.
- `keeperFit` (`keeper/keepers.ts`) — the fit arithmetic already exists; `missesWatcher` scores with it
  rather than restating the appeal weights.
- `keeperById`, `heartsFromPoints`, `logEvent`, `seededPersonality` — all existing.
- `voice.ts`'s `Note` shape, `firstMeeting`/`recordMeeting` map idiom, and `WATCHER_ASIDE_MAX`'s derived
  cap — copied as a **pattern**, deliberately not imported: the two tables are different registers and
  a shared table is how one beat silences the other.
- `recordBootLine`'s fail-open discipline — extended, not re-invented.
- `showKeeperInvite`'s chrome register — the failure notice is drawn the same way.

## Blockers

None known at plan time. If the `create()` rename turns out to move a `this` binding (it should not —
it is a method-to-method move), stop and note it here rather than reshuffling the body.
