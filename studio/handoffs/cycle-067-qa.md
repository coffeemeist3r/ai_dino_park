# Cycle 67 — QA

**Build:** ✅ clean (`npm --prefix game run build`).
**Unit tests:** ✅ 663/663 (`npm run test:unit`) — +7 over the cycle-66 baseline of 656 (2 lenses, 5 grove-terrain).
**E2E tests:** ✅ 215/215 (`npx playwright test`) in one fresh run, no flake — +3 over 212 (dossier ×2, grove-terrain ×1).

## Lore track — BACKLOG-303: Signature quirk in the dossier

| Criterion | Status | Evidence |
|---|---|---|
| Book shows each dino's signature quirk label (`fidget(traits).label`) | PASS | `cycle-067-dossier` — every `__bookRows()` row has a truthy `quirk`; rendered `__bookText()` contains `· <quirk>` |
| Book quirk matches that dino's live idle quirk (`__fidget(name).label`) | PASS | dossier spec asserts `row.quirk === __fidget(name).label` for every row |
| Quirk line distinct from role/hearts/lineage/rumor lines | PASS | `lenses.test.ts` — separate `  · <label>` line; unit `omits quirk line` proves it's not the heart-bar `·` |
| ≥3 distinct quirk labels across the founders | PASS | dossier spec: `new Set(rows.map quirk).size >= 3` |
| No model / no save — identical after reload | PASS | dossier spec `quirk line is deterministic across a reload`; `lenses.ts` stays Phaser/model-free |

**Bugs found:** none.
**Recommendation:** APPROVE.

## Structure track — BACKLOG-294: Grove terrain

| Criterion | Status | Evidence |
|---|---|---|
| `groveTileAt(x,y,cols,rows)` returns `'grass'\|'path'\|'water'` | PASS | `cycle-067-grove-terrain.test.ts` — pond=water, mid band=path, corners=grass, only valid kinds |
| Layout has ≥1 path tile and ≥1 water tile, rest grass | PASS | unit: counts each kind > 0 |
| Crossing into grove → visibly distinct render (tint) | PASS | `cycle-067-grove-terrain` e2e — grove `__floorInfo().tinted === true`, key `terrain_grove` |
| Bowl floor render byte-identical to before | PASS | bowl `__floorInfo().tinted === false`, key `grass`; cycle-48 grass spec green; cycle-59 zone specs green |
| Dev hook reports active floor (zone+key+tinted) | PASS | `__floorInfo` exercised by the e2e |

**Bugs found:** none. (Known/deferred per the codeplan: bowl props draw over the grove floor — BACKLOG-308, not this item's scope.)
**Recommendation:** APPROVE.

## Notes
- Path/water **pixel rigs** are not in this track (they're 033, the Artist's). Until they exist, those grove sub-region tiles bake as grass under the tint — the floor is always whole and the tint alone makes the grove distinct. The grove-terrain e2e asserts the swap + tint, not pixel colours, so it stays green when the Artist adds the rigs this same cycle.
- No NPCBrain/boundary changes; `art/` imports no web-llm.
