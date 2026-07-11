# Cycle 98 — Design

Two file-disjoint tracks. Lore = the "Provision remembered" arc (BACKLOG-385 + 386) in the feeding
yield path; Structure = the Fernreach's farm (BACKLOG-432) in the crop data.

---

## Lore track — BACKLOG-385 + BACKLOG-386 (Provision remembered)

**Item:** BACKLOG-385 [emergent] Remembered generosity + BACKLOG-386 [social] Grateful nuzzle — the
two named halves of Milestone 3's lore arc 3. Shipped together: both react to the same event, the 375
generous-feed yield decided in `WorldScene.checkFeeding`.

**Why this cycle:** Since cycle 83 a well-fed dino has stepped back and let a hungrier high-bond friend
eat first (375) — but the gift left no trace. The recipient didn't remember who fed it, never thanked
it, and was no likelier to return the kindness. This closes the loop the milestone names: generosity
becomes *reciprocal* (385) and *acknowledged* (386), a tie between two dinos rather than a one-way tic.

**What ships:**
- **386 (grateful nuzzle):** the instant a yield fires, the fed friend throws a 💛 toward its
  benefactor — a floating 💛 beat + a log line (`💛 <friend> nuzzled <giver> in thanks`), sitting
  beside the giver's existing 🤝. A `__nuzzle` hook reports the last `{from, to}`.
- **385 (remembered generosity):** the fed friend *files* who fed it (a live per-session ledger,
  `owesFood[friend] += giver` — the durable trace is the persisted memory, mirroring how 375 keeps no
  save field). Later, when that friend is itself the well-fed winner deciding a yield, a benefactor it
  owes qualifies at a **relaxed bond bar** (`RECIPROCAL_BOND` < the normal `GENEROUS_BOND`) and a
  smaller hunger gap (`RECIPROCAL_HUNGRIER_BY` < `HUNGRIER_BY`), and is preferred on ties — so the
  friend repays a benefactor it wouldn't cross the bowl for as a mere acquaintance. On a repayment
  the debt is cleared (a one-shot ledger, so kindness keeps cycling) and the repayer files a
  "you repaid <name>'s kindness at the hatch" memory. A `__owesFood` hook exposes the ledger.

**Acceptance criteria:**
- [ ] 386: when a 375 yield fires, `__nuzzle()` returns `{ from: <fed friend>, to: <giver> }` and a
      `💛 ... nuzzled ... in thanks` line is logged.
- [ ] 386: no yield → `__nuzzle()` is null (a plain solo feed throws no 💛).
- [ ] 385: after A yields to B once, `__owesFood()[B]` includes A.
- [ ] 385 reciprocity: with B well-fed and A hungry at a bond **below** `GENEROUS_BOND` but **at/above**
      `RECIPROCAL_BOND`, B yields to A **only because** A is a remembered benefactor — `__yieldFood()`
      returns `{ giver: B, eater: A }`; an identical un-owed pair at the same bond does **not** yield.
- [ ] 385: a repayment clears the debt — after B repays A, `__owesFood()[B]` no longer includes A, and
      B filed a `repaid A's kindness` memory.
- [ ] Default path unchanged: with an empty ledger, `yieldFoodTo` returns exactly what it did at cycle
      83 (the existing cycle-083/084/085 feeding specs stay green).
- [ ] `hungerAside`/gobble/stand-up paths untouched; build + full suite green; no save schema change
      for the lore track; WebLLM stays under `ai/`.

**Out of scope:** the book tally of yields (388, separate item); persisting the owes-ledger across
reload (the memory carries the durable trace, as in 375); any change to who *wins* the initial rush.

**Constraints:** the pure `yieldFoodTo` extension must default to byte-identical behavior when no
ledger is supplied (an optional `owes` set). Don't disturb the gobble (387) / stand-up (390) branches
that share `checkFeeding`.

---

## Structure track — BACKLOG-432 (Fernreach plot + a farmable third crop)

**Item:** BACKLOG-432 [core] Fernreach plot + a farmable third crop.

**Why this cycle:** Milestone 3 structure arc 2, *All three zones farm*. Two of three zones grow a crop
(418); the Fernreach grows nothing and FOODS holds only two plant crops, both taken. Give the Fernreach
a plot and a third farmable food so the three-zone farming divergence reads complete.

**What ships:**
- A third **farmable food** in `FOODS`: `roots` (🥕, "starchy roots"), appeal tuned so it does **not**
  become any current roster dino's favorite in any season (no regression to 418/170/061 verdicts).
- The Fernreach's **crop identity** in `CROP_BY_ZONE`: `{ food: 'roots', ripe: '🍠' }` — the ripe
  marker distinct from the sprout glyph, from the roots food's own 🥕, and from the other zones' 🍓/🥬.
- A **Fernreach plot tile** (`FERNREACH_PLOT_TILE`) on Fernreach grass, clear of the west creek, the
  fern bands, and the edges, wired into `PLOT_TILE_BY_ZONE`.
- **Persistence:** the Fernreach plot round-trips through the save additively (`fernreachPlot`, mirroring
  `grovePlot`; old saves → null). The plot render/plant/ripen/harvest/per-zone-tally machinery is
  already zone-generic, so it lights up for the Fernreach with no `WorldScene` logic change beyond the
  save field + the restore key.

**Acceptance criteria:**
- [ ] `cropOf('fernreach')` returns `{ food: 'roots', ripe: '🍠' }`; `roots` is a real member of `FOODS`.
- [ ] `PLOT_TILE_BY_ZONE['fernreach']` is a Fernreach **grass** tile (`fernreachTileAt` → 'grass'), off
      the edges, off the creek, off the fern bands; distinct from the bowl and grove plots.
- [ ] Adding `roots` does **not** change any roster dino's favorite food in any season — the pinned
      anchors (Rex→meat base / berries summer, Twitch→greens, Glade→meat) hold; favorites still span ≥3.
- [ ] The Fernreach ripe marker (🍠) is distinct from the sprout glyph (🌿), the roots food emoji (🥕),
      and the bowl/grove markers (🍓/🥬).
- [ ] In-game: standing beside the Fernreach plot and pressing P plants; after ripening, P harvests a
      `roots` drop and bumps `harvestedByZone['fernreach']` — driven via the existing `__plantPlot`/
      `__harvestPlot('fernreach')` hooks.
- [ ] A planted Fernreach plot survives save→reload (`fernreachPlot` round-trips; old saves load with
      no Fernreach plot, no crash).
- [ ] Build + full suite green; save remains additive (old saves valid).

**Out of scope:** a Fernreach crop pixel rig (the ripe marker falls back to the 🍠 glyph — an [art]
follow-up, per the cycle-95 stash rule); per-zone harvest *surfacing* as its own read (433); any diet
tagging of `roots` (435).

**Constraints:** the new food must not perturb existing favorite/craving verdicts (see AC). The stale
cycle-095-crops assertion that `cropOf('fernreach')` equals the bowl berry ("no Fernreach plot yet")
must be updated to the new crop. No file overlap with the lore track.

---

state: `currentItem = "BACKLOG-385+386: Provision remembered"`, `structureItem` unchanged, phase →
codeplan-pending.
