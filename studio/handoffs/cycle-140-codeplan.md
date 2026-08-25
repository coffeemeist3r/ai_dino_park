# Cycle 140 — Code Plan

Both tracks are small in file count and disjoint in files. Lore track first (it is self-contained),
structure track second (it moves the founding state and will have spec fallout).

---

## Lore track — BACKLOG-423 (tic-flavored voice)

### Prior art to reuse (do not re-invent)

- `game/src/world/tic.ts` already owns every string the catch says: `bashfulOpener`, `fondOpener`,
  `teaseOpener`, `resignedOpener`, `caughtOpener` (the register switch), `caughtRegisterMemory`. The aside
  belongs beside them, in the same file, as another pure builder.
- `WorldScene.ticFor(d)` (line ~4092) already returns the `Tic` the dino *actually performs* (an echoed one
  from 407 if it has it, else its signature). The memory filing at line ~6477 uses `this.ticFor(target).label`.
  **Use the same call** — do not reach for `signatureTic` directly.
- `buildMessages` (`game/src/ai/webllmBrain.ts:84`) is the prompt builder, and it already has eight
  optional-context clauses built exactly the same way (`hungry`, `rattled`, `provider`, `seasonal`,
  `policy`, `mealtime`, …): a `const x = ctx.field ? '…' : ''` interpolated into the `system` template.
  Add a ninth in that pattern. Nothing structural changes.
- `NPCContext` (`game/src/ai/brain.ts:19`) is where the field goes, with a doc comment like its siblings.

### Files

1. **`game/src/world/tic.ts`** — add:
   - `export const TIC_ASIDE: Record<TicKind, string>` — the three clauses. Suggested text (Coder may
     reword, must keep them distinct and must keep the asserted substrings):
     - `pace`: `*feet still going a moment after the rest of it stops*`
     - `circle`: `*finishes the turn it was in the middle of before it looks up*`
     - `fuss`: `*sets the thing down, then picks at it once more anyway*`
   - `export function ticAside(kind: TicKind): string` — returns `TIC_ASIDE[kind]`. A function rather than
     raw table access at the call site so the table can gain a shape (per-register, per-dino) later without
     touching `WorldScene`.
   - Header comment: this is the layer that makes 423 reachable **without a model**; the 408/413/420 opener
     strings are frozen and this sits between the opener and the reply.
2. **`game/src/ai/brain.ts`** — add to `NPCContext`:
   ```ts
   /** The ritual this dino was interrupted at (BACKLOG-423), set only on a catch — the model is told what
    *  happened, never asked to author the frame. Absent → today's prompt exactly. */
   interrupted?: { kind: TicKind; label: string };
   ```
   Import `TicKind` as a type from `../world/tic` (type-only import; `tic.ts` is pure, no cycle risk —
   verify it does not import from `ai/brain`).
3. **`game/src/ai/webllmBrain.ts`** — in `buildMessages`, after the `mealtime` const:
   ```ts
   const interrupted = ctx.interrupted
     ? `You were alone doing your own private thing — you ${ctx.interrupted.label} — and got walked in on; you still sound like it. `
     : '';
   ```
   and splice `${interrupted}` into the `system` template string immediately after `${mealtime}`.
   **The absent branch must produce a byte-identical prompt to today's** — that is a test.
4. **`game/src/scenes/WorldScene.ts`** — two edits, both inside `greet` (~6390–6480):
   - Add `interrupted` to the `NPCContext` object literal built for `brain.respond` (~line 6448, beside
     `mealtime`). It must be set only when the dino is the caught one. **Careful:** `const caught =
     this.caughtTic === target.name` is currently computed *after* the `respond` call. Hoist that one line
     above the context literal (it reads only `this.caughtTic` and `target.name`; nothing between them
     mutates either). Do **not** hoist `catches`/`register` — the comment at that site says the count
     advances there and nowhere else, and a cancelled greet nulls `caughtTic` before it.
   - Compose the aside into the line:
     ```ts
     const aside = caught ? ticAside(this.ticFor(target).kind) : null;
     const text = [opener, aside, reply.text].filter(Boolean).join(' ');
     ```
     replacing the current `const text = opener ? \`${opener} ${reply.text}\` : reply.text;`. The `filter`
     form gives the "exactly one space, no doubles" criterion for free and leaves the non-caught path
     (`opener` from the glad trace, or nothing) byte-identical.
   - Import `ticAside` in the existing `../world/tic` import line (168).

### Tests

- **`tests/unit/cycle-140-tic-voice.test.ts`** (new):
  - `ticAside` returns a non-empty string for each of `pace` / `circle` / `fuss`; the three are pairwise
    distinct (`new Set([...]).size === 3`).
  - Substring pins: pace mentions `feet`, circle mentions `turn`, fuss mentions `picks at it`.
  - **Frozen openers:** `bashfulOpener()` and `fondOpener()` equal their exact literal text (copy the
    current strings into the spec). This is the regression guard the design asks for.
  - Composition: a small pure helper is *not* worth extracting for this — assert the join semantics
    directly with `[opener, aside, reply].filter(Boolean).join(' ')` producing no double spaces, and rely
    on the e2e for the wired path.
- **`tests/unit/cycle-140-tic-prompt.test.ts`** (new, or fold into the above):
  - `buildMessages(ctxWithout, obs)` deep-equals `buildMessages(ctxWithoutInterrupted, obs)` — i.e. build
    the same context twice, once with `interrupted: undefined`, and assert the system content matches a
    context that never had the key. (The real assertion: adding the field changes nothing when unset.)
  - With `interrupted` set, the system message contains the dino's ritual label.
- **`tests/e2e/cycle-140-tic-voice.spec.ts`** (new): drive a dino into a tic via the existing test hooks
  (look for `__forceTic` / `__ticOf` / `__caughtTic`-style hooks near `WorldScene:1382`; if none exists,
  reuse whatever the cycle-138/139 tic specs use — do **not** invent a new forcing hook if one is there),
  greet it, and assert the dialog text contains both the register opener and the aside for its kind, with
  no model loaded.

### Risks

- The only real risk is the hoist of `const caught`. Read the surrounding block carefully; the ordering
  comments there (the 420 count, the 422 warmth grant reading `fond` before the bump) are load-bearing and
  were written after a bug. Change nothing but the position of that one `const`.

---

## Structure track — BACKLOG-500 (the grounds nobody lives on)

### Facts already established (do not re-derive)

- Grid is `COLS = 20`, `ROWS = 15` (`WorldScene.ts:279`).
- `hollowTileAt`: `water` at `x∈[7,11], y∈[10,11]`; `fern` at `y∈[1,2]`; everything else `grass`.
  → **`(5, 8)` is grass.**
- `ridgeTileAt`: `water` at `x∈[2,4], y∈[11,12]`; `path` at `x ∈ {9, 10}` (midX = 10) full height;
  everything else `grass`. → **`(14, 6)` is grass.**
- `zoneCapacity` is derived from grass count / `TILES_PER_HEAD = 60`. One resident on each is nowhere near
  any ceiling.
- `diet.test.ts` pins the carnivore set to exactly the `compsognathus` rows — neither new entry may be one.

### Files

1. **`game/src/entities/roster.ts`** — append exactly two entries after Thornback:
   ```ts
   { name: 'Murk', species: 'parasaurolophus', personality: 'quiet, damp-loving, speaks in short sentences', color: 0x4c6b78, tileX: 5, tileY: 8, zone: 'hollow' },
   { name: 'Ember', species: 'brontosaurus', personality: 'sun-drunk, slow-talking, climbs for the view', color: 0xc4713f, tileX: 14, tileY: 6, zone: 'ridge' },
   ```
   Both species already exist (Glade / Sunny), so the colour-keyed rigs bake new textures with no art work,
   exactly as the CHARTER v7 comment above the Grove entries explains. Extend that comment to cover these
   two and the reason the roster grew rather than rebalanced.
2. **`game/src/world/founding.ts`** — add:
   ```ts
   export function foundingResidents(): Record<string, string[]> {
     const out: Record<string, string[]> = {};
     for (const id of zoneChain()) out[id] = [];
     for (const r of ROSTER) (out[r.zone ?? BOWL_ID] ??= []).push(r.name);
     return out;
   }
   export function groundsWithoutResidents(): string[] {
     return Object.entries(foundingResidents()).filter(([, names]) => names.length === 0).map(([id]) => id);
   }
   ```
   Both already have their imports in the file (`zoneChain`, `BOWL_ID`, `ROSTER`). Add a doc block above
   them recording the CHARTER v7 sentence, the 5/2/1/0/0 state it was violated by, and the grow-not-
   rebalance decision naming the bowl-at-five tuning (`TILES_PER_HEAD` booting at capacity, the 460 last-one
   floor, the huddle, the food scramble).
3. **`game/src/scenes/WorldScene.ts`** — only if no suitable e2e hook exists. Check `__homeZone` (line 1616)
   first: it answers "which zone is X in" per name, which is enough for the e2e to walk `ROSTER` names.
   **Prefer using `__homeZone` and add nothing.** If a per-zone read is genuinely needed, add
   `__zoneResidents = () => zonePopulations(...)`-style hook beside line 1170, which already computes it.

### Tests

- **`tests/unit/cycle-140-residency.test.ts`** (new):
  - `groundsWithoutResidents()` is `[]`. Written against `zoneChain()`, never a literal list of five ids.
  - `Object.keys(foundingResidents())` equals `zoneChain()` (present-and-empty ≠ absent).
  - Every `ROSTER` entry spawns on grass: `zoneTileAt(r.zone ?? BOWL_ID, r.tileX, r.tileY, 20, 15) === 'grass'`
    for all ten. (This is the invariant that would have caught a bad tile before the specs went red.)
  - No ground over capacity at boot: for each id, `foundingResidents()[id].length <= zoneCapacity(id, 20, 15)`.
  - `foundingCouncils()` is unchanged for the bowl and the Grove — pin the exact seat arrays (Sunny/Glade
    on the bowl, Pip on the Grove per the `FOUNDING_BANKED` doc), so the two additions provably do not
    disturb 492/497.
- **`tests/e2e/cycle-140-residency.spec.ts`** (new): on a fresh boot, read `__homeZone` for every roster
  name and assert the set of zones covered includes all five ids.
- **Fallout sweep (do this before running the suite, not after):**
  ```bash
  grep -rn "Thornback\|\.length === 8\|toHaveLength(8)\|dinos.length" tests game/src --include=*.test.ts --include=*.spec.ts
  ```
  Any spec asserting a cast size of 8, enumerating roster names, or asserting `proceduralPersona`
  uniqueness (`tests/unit/cycle-091-persona.test.ts`) is **updated to ten, never deleted**. List every spec
  touched in the "shipped" note below.

### Risks

- The likeliest breakage is a spec that counts the cast or iterates zones expecting two empties (the
  cycle-139 e2e that asserted the Hollow/Ridge empty, if one exists — `grep` for `emptyGrounds`, which
  cycle 136 introduced as a helper). If `emptyGrounds` is used as a *fixture* to force emptiness, leave it;
  if it is used as an *assertion about the founding state*, that assertion is now wrong and must flip.
- Name collisions: check `Murk` and `Ember` appear nowhere else (`grep -rn "Murk\|Ember" game tests`).
  Name-seeded traits mean a rename changes personality, so pick once.

---

## Order of work

1. Lore track (tic.ts → brain.ts → webllmBrain.ts → WorldScene greet block) + its unit tests. Build + unit.
2. Structure track (roster.ts → founding.ts) + its unit tests. **Then** the fallout sweep. Build + unit.
3. `npx --yes kill-port 5173` then the full e2e.

No file is touched by both tracks.
