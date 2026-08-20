# Cycle 135 — Code Plan

**Build order: structure track first, then lore track.** Both edit `game/src/scenes/WorldScene.ts` and
nothing else in common. The structure edits sit in the governance block (~lines 620–730, 2120–3000, 3230)
and the lore edits in the solitary-tic block (~lines 340–360, 1200–1250, 3620–3760). They do not overlap,
but sequencing them removes any chance of a clobber.

---

## Structure track — BACKLOG-487

**Item:** BACKLOG-487 [core] The other call goes to the council — the spend priority (463) runs through the
same vote the work priority (473) uses.

### Files to create

None. This is deliberately a generic plus a mirror; a new module would be `governance.ts` with a different
name, which is the failure `standings.ts` (482) exists to prevent.

### Files to modify

| File | Change |
|---|---|
| `game/src/world/governance.ts` | Add `councilMajority<T extends string>(votes, tieBreak)` holding 481's exact arithmetic. Re-express `councilWorkPriority` as a one-line delegation (signature and behaviour unchanged). Add `councilSpendPriority(votes, tieBreak)` as its twin. Add `spendCallMeaning(p: SpendPriority): string` reading `SPEND_CALL`, the exact twin of `workCallMeaning`. |
| `game/src/scenes/WorldScene.ts` | Split `spendPriorityFor` into `spendPriorityFor` (thin) + `decideSpend` (the ladder), mirroring `workPriorityFor`/`decideWork` — but **without** a `calledWork`-style lean, since the bill (485) leans labour, not the pantry. `decideSpend`: council votes `providerPriority(traits)` → `councilSpendPriority(votes, providerVote)` → store + return; else standing provider → store + return; else lingering `spendPriorityByZone[zone]`; else `null`. |
| `game/src/scenes/WorldScene.ts` | `checkCouncilCall` — announce the **spend** call too. Add `private lastSpendCallByZone: Record<string, SpendPriority> = {}` beside `lastWorkCallByZone` (also **not** persisted, same reason). Extract the announce-on-change body into one small private helper called twice (once per call) so the seeding guard is written once, not twice. |
| `game/src/scenes/WorldScene.ts` | `__councilVotes` dev hook — add `spendVotes`, `spendTieBreak`, `spendCall` alongside the existing work fields, so the spec reads the production path for both calls. |
| `game/src/world/governance.test.ts` | New unit cases (see Test plan). Existing `councilWorkPriority` cases stay **byte-identical** and must pass untouched — that is the delegation's proof. |
| `tests/e2e/cycle-135-spend-vote.spec.ts` | New spec (see Test plan). |

**Note on `checkCouncilCall`'s continue-guard.** Its first line is `if (!this.councilFor(z.id).length && !lean) continue;` where `lean = billLean(derelict)`. The lean is a *labour* concept. When the loop is generalized to two calls, the spend half must be gated on `councilFor(z.id).length` **only** — a ground with a derelict landmark and no council has nothing to say about its pantry, and letting the lean open the door for the spend announcement would have the bill announcing a call it does not touch. Restructure as: compute `lean` once; announce work if `council.length || lean`; announce spend if `council.length`.

### Reuse list (mandatory — do not reinvent)

- `councilWorkPriority`'s body in `game/src/world/governance.ts:134` — becomes `councilMajority`. Do not write the counting loop twice.
- `providerPriority(traits)` (`governance.ts:38`) — the seat's spend vote is the *same* agreeableness read the provider always used. Do not introduce a second threshold.
- `workCallMeaning` (`governance.ts`) — `spendCallMeaning` is its literal twin over `SPEND_CALL`. Same shape, same `.find(...)!`.
- `SPEND_CALL` / `GOVERNANCE_CALLS` (`governance.ts`) — the meaning strings already exist; the ticker must read them, never a fresh literal.
- `this.councilFor(zone)` / `this.providerFor(zone)` / `this.dinoByName(n)?.traits` (`WorldScene.ts`) — the exact three reads `decideWork` uses. `decideSpend` uses the same three.
- `decideWork` (`WorldScene.ts:657`) — copy its **shape** literally (council → provider → lingering → null), including where it writes to the per-zone store, so the two ladders can be read side by side and diffed by eye.
- `checkCouncilCall`'s seeding guard (`WorldScene.ts:704`) — reuse verbatim, extracted to a helper. **Do not** attempt BACKLOG-489's shared gate seam here; that item is queued and this cycle is not it.
- `tests/e2e/cycle-129-council-vote.spec.ts` — its `seatThree()` helper (lay egg → `__forceHatch` → `__creditBank` 6/4/2) is exactly the staging this spec needs. Lift the pattern; `__setTrait(n, 'agreeableness', v)` replaces `'energy'`.

### New dependencies

`none`.

### Test plan

**Unit — `game/src/world/governance.test.ts`**
- `councilMajority`: `['a','a','b']` → `'a'`; `['a','a','a']` → `'a'`; `['a','b']` with tieBreak `'b'` → `'b'`; `['a','b']` with tieBreak `null` → `'a'` (i.e. `votes[0]`); `[]` → `null`.
- `councilSpendPriority(['feed','feed','bank'], null)` → `'feed'`; `(['feed','bank'], 'bank')` → `'bank'`; `(['feed','bank'], null)` → `'feed'`; `([], 'feed')` → `null`.
- `councilWorkPriority` — the existing cases, unchanged, as the delegation's regression proof.
- `spendCallMeaning('feed')` / `('bank')` equal the `meaning` fields in `SPEND_CALL` read directly from the table (assert against `SPEND_CALL.options.find(...)!.meaning`, not against a copied literal — a copied literal is the drift this table exists to stop).

**E2E — `tests/e2e/cycle-135-spend-vote.spec.ts`**
1. *"a fresh park's pantry is still the provider's"* — boot, seat nobody, assert `__councils()` is all empty and `__spendPriority(zone)` matches what a pre-487 park answers (`null` on a fresh save, since no provider has settled either). Step once; the ticker contains no `council calls it` for the pantry. Zero console errors. **The compatibility control.**
2. *"the majority carries the pantry, over its own top banker"* — `seatThree()`, then `__setTrait(seats[0], 'agreeableness', 0.9)` (provider + top banker wants to feed) and `0.1` for the other two. Assert `__councilVotes(zone).spendVotes` is `['feed','bank','bank']`, `spendTieBreak` is `'feed'`, `spendCall` is `'bank'`, and `__spendPriority(zone)` reads `'bank'` — the provider outvoted on the older, more player-visible call.
3. *"the hooks follow the vote, not the provider"* — same staging; assert the bank reserve is live (via the existing spend-hook read the 463/471 specs use — `__discontent`/the food-store read; the Coder picks whichever existing hook proves `feedReserve` applied, and adds none).
4. *"a flipped pantry call is announced once, in the legend's own words"* — unanimous `feed` council, `__stepWorld()`; first record is silent. Flip two seats to `bank`; step; ticker contains `council calls it: banks toward plenty` exactly once; step again with nothing changed and the count stays 1.
5. *"the labour call is untouched"* — in the same spec, assert `__workPriority(zone)` and the work ticker line still behave as cycle-129's spec asserts, so the generic did not disturb 481.

### Risks

- **`WorldScene.ts:2992`'s `this.spendPriorityFor(z.id)!`.** Reached only under a live provider; the council branch of `decideSpend` returns non-null whenever the council is non-empty, and the provider branch returns non-null whenever a provider stands. The assertion is still sound. **Confirm by reading the call site, do not assume.**
- **`discontent.ts` imports `feedReserve` directly** (`world/discontent.ts:15`) but is handed a `SpendPriority` by the caller — it never derives one. Unaffected, but it is the one place outside `WorldScene` that reads this enum; check it compiles unchanged.
- **The spend store now holds a council's call, not a provider's.** `spendPriorityByZone` is persisted and the values are the same two strings, so no save migration — but the *meaning* of a stored value widens. `saveGame.ts:429` validates only `'feed'|'bank'`, which stays correct. **No save change; verify by loading an old save fixture.**
- **`checkCouncilCall`'s lean guard** — see the note above. Getting this wrong makes the bill (485) announce a pantry call, which would be a regression on a shipped milestone arc.
- **Default park is bit-identical**, so a green suite proves less than usual here. The E2E must deliberately grow a ground to six residents to reach the interesting branch at all.

### Estimated touch count

`~5 files` (governance.ts, governance.test.ts, WorldScene.ts, one new e2e spec, BACKLOG/MILESTONE bookkeeping).

---

## Lore track — BACKLOG-416

**Item:** BACKLOG-416 [emergent] Not the only one — two solitary dinos ticcing in sight of each other file a
wordless kinship.

### Files to create

- `tests/e2e/cycle-135-not-the-only-one.spec.ts`

### Files to modify

| File | Change |
|---|---|
| `game/src/world/tic.ts` | Add `kinshipMemory(other: string): string` and `kinshipLine(a: string, b: string): string`, in a short block beside 407's echo section with a comment stating the asymmetry (407 needs a bond, 416 deliberately does not). **No new distance constant** — the band is `watchingTic`. |
| `game/src/scenes/WorldScene.ts` | Add `private kinFiled = new Set<string>()` beside `ticCaughtFiled` (~line 350). Add `private kinTic(performer: Dino): string[]` beside `watchTic` (~line 3710). Call it from `performTic`'s invention branch, right after the existing `watchTic` call. Clear `kinFiled.delete(name)` in `resetTic` (~line 3634). Add a `__kinTic(name)` dev hook beside `__watchTic` (~line 1249). |
| `game/src/world/tic.test.ts` | New unit cases (see Test plan). |

### `kinTic` — exact shape

```
private kinTic(performer: Dino): string[] {
  const out: string[] = [];
  if (this.ambientHeld) return out;                      // same gate watchTic uses
  const zone = zoneOf(this.dinoZones, performer.name, BOWL_ID);
  const at = this.tileOf(performer);
  for (const o of this.dinos) {
    if (o.name === performer.name) continue;
    if (zoneOf(this.dinoZones, o.name, BOWL_ID) !== zone) continue;
    if (!this.ticInvented.has(o.name)) continue;          // the other must ALSO be mid-ritual — the whole item
    if (!watchingTic(this.chebyTiles(this.tileOf(o), at))) continue;  // 407's band, reused, no new number
    for (const [self, other] of [[performer, o], [o, performer]] as const) {
      if (this.kinFiled.has(self.name)) continue;         // once per solitary stretch, per dino
      this.kinFiled.add(self.name);
      this.memory = remember(this.memory, self.name, kinshipMemory(other.name));
    }
    this.logEvent(kinshipLine(performer.name, o.name));
    out.push(o.name);
  }
  return out;
}
```

Note the inner loop files for **both** dinos, each guarded by its own `kinFiled` entry, so the second of two
loners to fall into its ritual is the one that triggers the pairing — and the first one, already ticcing, is
credited too. That is the design's "the honest moment" clause.

### Reuse list (mandatory — do not reinvent)

- `watchingTic(dist)` (`world/tic.ts`) — **the** band predicate. Introducing a second distance constant for 416 is the defect; the item's own text names this band.
- `this.chebyTiles(...)`, `zoneOf(this.dinoZones, ...)`, `this.tileOf(...)` — the three reads `watchTic` opens with. Copy that preamble.
- `this.ticInvented` (`WorldScene.ts:~345`) — already tracks "is mid-ritual this stretch". Nothing new is needed to know the other dino is ticcing.
- `remember(this.memory, name, text)` — the one memory write every beat in this file goes through.
- `this.logEvent(...)` — the ticker.
- `this.ticCaughtFiled` (`WorldScene.ts`) — the per-stretch-flag pattern, including its `resetTic` clear. `kinFiled` is its exact twin; do not invent a different lifecycle.
- `__watchTic` dev hook — `__kinTic` is its twin (drive the production method, never a spec-side re-derivation).
- `tests/e2e/cycle-133-shared-tic.spec.ts` — its `stage(page, gap, bond)` helper places a pair at a chosen gap and parks everyone else at (1,1)+. Lift it; drop the `bond` argument's relevance (416 ignores bonds, and one of the specs asserts exactly that).

### New dependencies

`none`.

### Test plan

**Unit — `game/src/world/tic.test.ts`**
- `kinshipMemory('Mossback')` contains `'Mossback'`; does not contain `'friend'`.
- `kinshipLine('Rex','Sunny')` contains both names.
- Band re-assertion in the 416 describe block: `watchingTic(3) === false`, `watchingTic(4) === true`, `watchingTic(8) === true`, `watchingTic(9) === false` — pinned here as well as in 407's block, because 416 now depends on it too and a future widening must break both.

**E2E — `tests/e2e/cycle-135-not-the-only-one.spec.ts`**
1. *"two loners in sight of each other are each less alone for it"* — `stage(page, 5, 0)` (gap 5, **zero bond**), `__inventTic` both, `__kinTic(a)`; assert both memory rings contain the other's name and the kinship phrase, and the ticker names both.
2. *"a bond is neither required nor moved"* — read `__bonds`/the pairwise bond before and after; assert unchanged. The zero-bond staging in test 1 already proves "not required"; this proves "not moved".
3. *"company is not kinship"* — `stage(page, 2, 0)`: assert neither dino invents a ritual under a natural run (`__tic(n).invented === false` after stepping), and that a forced `__kinTic` pass files nothing, since distance 2 fails `watchingTic`.
4. *"out of sight is out of mind"* — `stage(page, 10, 0)`, both forced into their tics, `__kinTic(a)` files nothing for either.
5. *"filed once per stretch"* — after test 1's staging, call `__kinTic(a)` three more times and assert each ring still holds exactly one copy (count occurrences in the joined ring).
6. *"the ritual is not interrupted"* — assert both dinos' `__tic(n).invented` is still `true` and `__ticEcho` is still `null` for both after the pass (416 must not touch 407's state).
7. Zero console errors in every test (the standing house rule).

### Risks

- **`performTic`'s invention branch already calls `watchTic`.** Order matters only in that `kinTic` must not consume the state `watchTic` reads; it writes only `kinFiled` and the memory ring, so either order is safe. Call it **after** `watchTic` so 407's tally is unaffected by any future change here.
- **`resetTic` is the only clear.** If `kinFiled` is not cleared there, a dino files the note once per *save*, not once per stretch, and test 5 would still pass while the feature quietly dies after its first firing. Verify the clear by re-running the beat after a `resetTic`.
- **Memory-ring pressure.** The ring is 6 slots (the `pecking.ts` note in BACKLOG-483). One more per-stretch note is another eviction pressure on the four hatch strings `pecking.ts`/`manner.ts` parse. It is once per stretch and stretches are long (20 solitary force-steps), so this is a note for the Validator, not a blocker — but if a `pecking`/`manner` spec goes red, this is the first place to look.
- **`ambientHeld`** — if the gate is forgotten, a held ambient sim files kinship notes and the ambient-hold specs may or may not catch it. Copy `watchTic`'s first line.

### Estimated touch count

`~4 files` (tic.ts, tic.test.ts, WorldScene.ts, one new e2e spec).

---

## Cross-track collision check

`game/src/scenes/WorldScene.ts` is touched by both. Regions:

| Track | Regions |
|---|---|
| Structure | field block ~625–635 (`lastSpendCallByZone`), `spendPriorityFor`/`decideSpend` ~639–648, `checkCouncilCall` ~704–725, `__councilVotes` ~3224 |
| Lore | field block ~350 (`kinFiled`), `__kinTic` hook ~1249, `resetTic` ~3634, `kinTic` + `performTic` ~3700–3760 |

No shared line. **Order: structure, commit-ready, then lore.** Both tracks add a private field to the same
class but in different blocks (~275 lines apart), which is the only place a careless patch could collide.

**Total estimated touch count: ~9 files.** Well inside CHARTER v6's ~15.
