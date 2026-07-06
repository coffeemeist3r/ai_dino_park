# Cycle 93 — Code Plan

Build order: **structure (417) first, then lore (341)** on top — both touch `WorldScene.ts` +
`saveGame.ts`, one session so no conflict, but sequencing keeps each commit's diff clean.

---

## Structure track — BACKLOG-417 (frond thatch)

### Files
- `game/src/world/resource.ts` (edit): `Structure` union += `'thatch'`; add `THATCH_RECIPE =
  { frond: 4 }`, `THATCH_GLYPH = '🥻'`; `STRUCTURE_BY_BIAS.frond = 'thatch'`; `structureRecipe`
  returns `THATCH_RECIPE` for a thatch zone; add `buildStructureFor(pile, zone)` generic.
- `game/src/scenes/WorldScene.ts` (edit): import `THATCH_GLYPH`, `buildStructureFor`; add
  `thatches`/`thatchSprites` fields; three-way build dispatch; `drawThatch`/`placeThatch`;
  `applyZoneVisibility` thatch toggle; save/restore; `__thatches`/`__thatchIsArt` hooks.
- `game/src/world/saveGame.ts` (edit): `SaveData.thatches?`; validate+default in `deserialize`;
  emit in `serialize` (via the object spread already covering optional fields — confirm it's
  in the returned literal).
- `game/src/world/resource.test.ts` (edit/add): thatch selection + recipe + `buildStructureFor`.
- `game/src/scenes/*.e2e` (Playwright, add spec `cycle-093-thatch.spec.ts`): in-world thatch.

### Reuse (no new prims)
- `bakePropArt(this, 'thatch')` — the stashed 427 rig is already registered under key `'thatch'`.
- `pileFor`, `stockpileByZone`, `zoneStructure`, `zoneOf`, `tileOf`, `flashFeed`, `remember`,
  `logEvent`, `refreshPlaque`, `applyZoneVisibility` — all exist; thatch mirrors shelter exactly.
- `craft`/`buildShelter` stay exported (their unit tests); the scene routes through the new generic.

### `buildStructureFor` (resource.ts)
```ts
export function buildStructureFor(pile: Stockpile, zone?: string): Stockpile | null {
  const recipe = structureRecipe(zone);
  const kinds = Object.keys(recipe) as ResourceKind[];
  if (!kinds.every((k) => (pile[k] ?? 0) >= (recipe[k] ?? 0))) return null;
  const next: Stockpile = { ...pile };
  for (const k of kinds) next[k] = (next[k] ?? 0) - (recipe[k] ?? 0);
  return next;
}
```

### WorldScene build dispatch (replaces the shelter/cairn `if` at ~L1237)
```ts
const built = buildStructureFor(this.pileFor(zone), zone);
if (built) {
  this.stockpileByZone[zone] = built;
  const kind = zoneStructure(zone);
  if (kind === 'thatch') this.placeThatch(this.tileOf(taker), taker);
  else if (kind === 'shelter') this.placeShelter(this.tileOf(taker), taker);
  else this.placeCairn(this.tileOf(taker), taker);
  this.refreshPlaque();
}
```
`drawThatch`/`placeThatch` = copy of `drawShelter`/`placeShelter` with `'thatch'`/`THATCH_GLYPH`/
`thatchSprites`/`thatches` and a "wove a frond thatch" memory + `🥻 <name> wove a frond thatch` log.

---

## Lore track — BACKLOG-341 (settling)

### Files
- `game/src/world/belonging.ts` (new): the pure tenure/settle/damp helpers (see design).
- `game/src/world/belonging.test.ts` (new): unit coverage of every helper.
- `game/src/scenes/WorldScene.ts` (edit): `tenure` field; `bumpTenures()` in `maybeMigrate`;
  `resetTenure` in `crossDino`; settled-resist gate in `maybeMigrate`; `bookRows().home`;
  `__tenure`/`__settled`/`__settleTick` hooks.
- `game/src/ui/lenses.ts` (edit): `BookRow.home?`; `bookLines` emits it.
- `game/src/world/saveGame.ts` (edit): `SaveData.tenure?`; validate+default; emit.
- e2e spec `cycle-093-settle.spec.ts`: tenure accrual → settled → book line → reset on cross.

### Reuse
- `zoneOf(this.dinoZones, name, BOWL_ID)`, `zoneById(id).name` for the display name in `settledLine`.
- `this.dinos`, `this.migrating` (exclude mid-crossing dinos from a tenure bump / they reset on
  arrival anyway), `cooldownReady`/`MIGRATE_*` already gate `maybeMigrate`.
- `bookRows()` already composes optional per-dino fields (quirk/intent/plans) — `home` slots in beside.

### `maybeMigrate` shape (after edits)
```ts
private maybeMigrate(): void {
  this.bumpTenures();                                   // 341: tenure accrues on the migrate cadence
  if (!cooldownReady(Date.now(), this.lastMigrationMs, MIGRATE_COOLDOWN_MS)) return;
  if (Math.random() >= MIGRATE_CHANCE) return;
  const d = this.pickMigrant();
  if (!d) return;
  if (isSettled(tenureOf(this.tenure, d.name)) && resistsMigration(true)) return; // 341: settled stays
  … existing dest pick + startMigration …
}
private bumpTenures(): void {
  for (const d of this.dinos) if (!this.migrating.has(d.name)) this.tenure = bumpTenure(this.tenure, d.name);
}
```
`bumpTenures` is also the body of the `__settleTick()` hook (call it directly).

## Save (both tracks) — `saveGame.ts`
Two additive fields, each mirroring an existing validated one:
- `thatches?` ← mirror `shelters?` (array of `{tileX,tileY,zone?}`).
- `tenure?` ← mirror `dinoZones?` (object, string→number; coerce non-number → skip/0).
No `SAVE_VERSION` bump (both additive; envelope 426 loads older saves through the chain).

## Test plan
- Unit: `belonging.test.ts` (7 helper assertions), `resource.test.ts` (+thatch selection, recipe,
  `buildStructureFor` incl. cairn parity), `saveGame.test.ts` (+thatches/tenure round-trip + absent-loads-clean).
- e2e: `cycle-093-thatch.spec.ts` (Fernreach thatch, three-landmark chain, `__thatchIsArt`),
  `cycle-093-settle.spec.ts` (tenure→settled→book line→reset on migrate).
- Full gate: `npm run build`; `npx vitest run`; `npx --yes kill-port 5173 && npx playwright test`.
- Boundary: `@mlc-ai/web-llm` untouched (nothing in this cycle imports it).

## Blocker
(none identified — the thatch rig is confirmed stashed and registered; all reuse targets exist.)

## SHIPPED (coder)
Both tracks built exactly as planned.
- **417 (thatch):** `resource.ts` — `Structure += 'thatch'`, `THATCH_RECIPE {frond:4}`, `THATCH_GLYPH 🥻`,
  `STRUCTURE_BY_BIAS.frond='thatch'`, `structureRecipe` thatch arm, new generic `buildStructureFor`.
  `WorldScene.ts` — `thatches`/`thatchSprites`, three-way build dispatch via `buildStructureFor`,
  `drawThatch`/`placeThatch`, zone-visibility toggle, save/restore, `__thatches`/`__thatchIsArt` hooks
  (dropped now-unused `craft`/`buildShelter` imports; `canCraft`/`canBuildShelter` kept for their hooks).
  `saveGame.ts` — additive `thatches?` mirroring `shelters?`.
- **341 (settling):** new pure `world/belonging.ts` (tenure/settle/damp/line). `WorldScene.ts` — `tenure`
  field, `bumpTenures()` in `maybeMigrate`, settled-resist gate, `resetTenure` in `crossDino` + `relocate`,
  `bookRows().home`, `__settleTick`/`__tenure`/`__settled` hooks, save/restore. `lenses.ts` — `BookRow.home?`
  + render. `saveGame.ts` — additive `tenure?` mirroring `dinoZones?`.
- **Build:** `npm run build` clean. **Unit:** `npx vitest run` → 1020 pass (+15 net; 2 pre-existing
  contract tests updated to the 417 thatch behaviour — cycle-088, cycle-061/saveGame samples gained the
  additive fields). **e2e:** the two new specs (`cycle-093-thatch`, `cycle-093-settle`) → 4/4 green.
- **Boundary:** `@mlc-ai/web-llm` still only under `game/src/ai/` (grep clean). Additive save only, no
  `SAVE_VERSION` bump.
- **Known pre-existing failure (off-diff, NOT this cycle):** `mobile-minds.spec.ts` "long dialogs page
  GBA-style" fails even on a clean `git stash` of HEAD and in isolation — a keeper-picker/dialog ArrowLeft
  paging issue untouched by either track. `cycle-028-realtime` is the usual parallel flake (passes isolated).
