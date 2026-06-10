# Cycle 39 — Design

**Item** — BACKLOG-161 [emergent] First-contact inspection — the bowl reacts to who you chose.

**Why this cycle**
The lore-smith's next-up, taken as suggested. Two cycles of keeper identity (the pick, the scan)
have pointed entirely inward; no dino has ever behaved differently because of *which* watcher
stands at the glass. This is the smallest item that closes the loop: pick an observer, and seconds
later the dino whose temperament most resonates with it walks over for a long look. It reuses fit
math that already ships (`keeperFit`) and the approach-and-beat movement grammar the bowl already
speaks (comfort crossings, sky gathers), and it directly sets up 165 (gossip about the watcher) and
167 (the unimpressed).

**What ships**
- A pure, Node-testable `keeper/firstContact.ts`:
  - `inspector(keeper, cast): string | null` — given the keeper and the live cast
    (`{name, traits}[]`), the dino with the **highest positive `keeperFit`**, alphabetical
    tie-break (the `comforter`/`topBy` convention). **No positive fit → null** — if nobody
    resonates with this observer, nobody comes, which is its own kind of telling.
  - `INSPECT_TTL` — how many world steps the inspector keeps trying before losing interest (12).
  - `inspectLine(name): string` — the floating beat, contains the dino's name + 👀
    (e.g. `` `${name}: *comes close, looks the new watcher up and down* 👀` ``).
  - `inspectMemory(keeperName): string` — the memory the inspector files
    (e.g. `` `went to the glass for a long look at ${keeperName}` ``).
- WorldScene glue only:
  - When a keeper pick **actually changes** `keeperId` (picker or `__pickKeeper`; re-picking the
    current observer does nothing, boot restore does nothing), compute `inspector(...)` and arm a
    transient `{name, ttl}`.
  - In `forceStep`'s per-dino loop, the armed inspector overrides its ordinary move with
    `stepToward(player tile)` (below the sky-event whole-cast override, which already returns
    early; above hunger/wander for that one dino). On arriving within 1 tile of the player:
    `inspectLine` bubble + `inspectMemory` filed + a `lastInspection = {name, keeperId}` record,
    then disarm. TTL decrements each step; at 0 it disarms silently (the player can outrun
    curiosity).
  - Dev hooks: `__inspection()` (armed `{name, ttl}` or null), `__lastInspection()`
    (`{name, keeperId}` or null), `__keeperFit(name)` (current keeper's raw fit for a dino, so
    tests can compute the expected inspector without duplicating the roster).
- The memory rides the existing persisted memory store (additive); the armed state and
  `lastInspection` are transient — **no save-format change**.

**Acceptance criteria**
- [ ] `keeper/firstContact.ts` is pure (no Phaser import) and unit-tested in Node.
- [ ] `inspector` returns the highest-positive-fit dino; ties break alphabetically.
- [ ] `inspector` returns null when no cast member has positive fit, and null for an empty cast.
- [ ] `inspectLine(name)` contains the name and 👀; `inspectMemory(keeperName)` contains the
      keeper name; both deterministic.
- [ ] e2e: on a fresh boot `__inspection()` and `__lastInspection()` are both null (no beat from
      boot/restore).
- [ ] e2e: `__pickKeeper` to a *different* observer arms `__inspection()` with the dino whose
      `__keeperFit` is the cast's maximum (and positive); repeated `__stepWorld()` calls walk it
      to the player until `__lastInspection()` reports `{name, keeperId}`.
- [ ] e2e: after arrival, the 👀 line is in `__bubbleTexts()` and the inspector's `__memory`
      includes the inspect memory.
- [ ] e2e: re-picking the **same** observer arms nothing (`__inspection()` stays null).
- [ ] No save-format change; every pre-existing spec passes; build + full vitest + playwright
      green.

**Out of scope**
- The unimpressed worst-fit beat (167), watcher gossip (165), scan reactions (164).
- Any LLM involvement; any movement-system change beyond the one per-dino override.
- Per-keeper inspection flavour text beyond the keeper's name in the memory (156's persona work).
- Glass-front staging (the inspector walks to the *player*, not to a fixed glass tile — the
  keeper IS the glass presence; a fixed-tile procession can come with 121's keeper-shaped routine).

**Constraints**
- `keeper/firstContact.ts` imports only `Keeper`/`keeperFit` and the `Personality` type; no
  Phaser, no web-llm (boundary: web-llm only under `ai/`).
- Do not modify `keepers.ts` data, the sky-event override, the comfort/homecoming seams, or the
  feeding pull — the inspector override applies to exactly one dino while armed.
- `pickKeeperIndex` keeps its existing contract (persist + confirm dialog); the inspection arm is
  a side effect of a *changed* id only.
- No new keys. No save-format change. NPCBrain boundary intact.
