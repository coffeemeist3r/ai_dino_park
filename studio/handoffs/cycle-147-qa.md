# Cycle 147 — QA

Gates re-run against the committed tree, not taken from the Coder's report.

- `npm run build` — **clean**.
- `npx vitest run` — **2341 passed, 3 skipped, 227 files**.
- `npx --yes kill-port 5173 && npx playwright test` — **637 passed, 2 failed**.
- `grep -rn '@mlc-ai/web-llm' game/src --include=*.ts | grep -v '^game/src/ai/'` — **no hits**. Boundary intact.
- Working tree clean; nothing outside `game/src/`, `tests/` and `studio/` touched.

## The two e2e reds

1. **`mobile-minds.spec.ts` — "long dialogs page GBA-style"**, at line 90 `__dialogPage()`. The standing red
   filed under **BACKLOG-515**, unchanged, off every diff in this cycle.
2. **`cycle-047-warmth.spec.ts` — "the tone path mends too"**. Re-run isolated: **5/5 green** in 5.1s.
   Nothing in this cycle's diff is near the warmth/tone path. This is **515's signature and its fourth
   catalogued spec** (after `mobile-minds`, `cycle-038-scan`, and both `controls-help` cases) — a spec lost
   under load and green on its own. Noted, not a regression.

---

## Lore track — BACKLOG-307

| # | Criterion | Verdict |
|---|---|---|
| 1 | `dreamWord(traits)` pure, exported from `world/murmur.ts`, deterministic, no Phaser/web-llm | **PASS** — `murmur.ts:39`; only imports are `./tic` and the `Personality` type |
| 2 | Signature axis **reused**, not re-copied | **PASS** — `import { signatureAxis } from './tic'`. Verified there is no third copy of the furthest-from-0.5 loop in the diff |
| 3 | Ten distinct words, one per pole, high at/above 0.5 | **PASS** — asserted three ways (count, `Set` size, `/^[a-z]+$/`) and at both 0.49/0.51 for all five axes |
| 4 | `murmurLine`'s memory branch byte-identical; null+traits dreams; null+no-traits still `zzz` | **PASS** — the byte-identity is asserted directly (`murmurLine(m, p) === murmurLine(m)`), not assumed. All five pre-existing `cycle-073-murmur` unit assertions pass untouched |
| 5 | The gate is *asleep*, not *huddling*; an awake dino never murmurs | **PASS** — `asleep()` at `WorldScene.ts`, used by `pickMurmurer` **and** `__forceMurmur`. The awake-dino-silent assertion still runs, at a corrected hour (see below) |
| 6 | **On a fresh save at the opening hour, `__forceMurmur` on the shipped sleeper is non-null** | **PASS** — `cycle-147-dream.spec.ts` boots and never calls `__setClock`. The spec asserts in the same breath that the sleeper is **not** in `__huddlers()`, which is the proof the old gate returned `null` here: `pickMurmurer`/`__forceMurmur` admitted only huddlers, and at the opening hour there are none |
| 7 | ≥3 distinct dream words across the founding cast | **PASS** — computed from the name seeds: **8 distinct words across the 10 roster names**, 4 across the Bowl's five (Rex `nobody`, Mossback `company`, Sunny `hiding`, Twitch `quiet`, Glade `nobody`). Asserted in unit *and* e2e |
| 8 | `BookRow.dream?` optional; rendered after `hours`; omitted when absent | **PASS** — position asserted as `hours + 1`, absence asserted separately. Every pre-existing `BookRow` literal in the suite still type-checks |
| 9 | Live `bookRows()` sets `dream` for every dino | **PASS** — `dreamBookLine(d.traits)`, unconditional |
| 10 | Unit coverage: determinism, both poles, distinctness, both `murmurLine` branches, book line | **PASS** — 9 cases in `cycle-147-dream.test.ts`, 2 in `lenses.test.ts` |
| 11 | One e2e for the frame-one read | **PASS** — 3 cases (the sleeper dreams; the cast does not share one dream; the book carries it) |

**Constraints checked.** No save format touched — the dream is derived from name-seeded traits and written
nowhere. `MURMUR_CHANCE` unchanged at 0.2, and its comment now records that leaving it alone was deliberate.
No `cycle-073-murmur` assertion weakened.

**The one spec repair, examined rather than accepted.** `cycle-073-murmur` asserted an awake Rex cannot
murmur *at noon*. Rex is an owl; a spring owl's rest window is 05–13. **Noon was inside Rex's rest window
before this cycle too** — the spec was passing because the old gate could not see that Rex was asleep, not
because Rex was awake. So the assertion was true for the wrong reason since cycle 146, and this diff is what
surfaced it. Repaired to 15:00, where both chronotypes are genuinely up, with the reasoning in the spec.
That is a spec made honest, not a spec loosened: the *claim* it tests — an awake dino stays silent — is
unchanged and now actually tests it.

### The reachability bar

> *In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

Open the game and do nothing. **Rex is asleep at eight in the morning and now says something** — `💭 …nobody…`,
off the axis Rex is furthest from neutral on, where before this cycle it was silent and could not have
murmured at any point in the session (it is not huddling, and huddling was the only way in). Press the book on frame one and every dino carries a `💭 dreams of …` line, and
they are not the same line. Both reads are at the default hour, with no memory, no model and no waiting.

---

## Structure track — BACKLOG-521

| # | Criterion | Verdict |
|---|---|---|
| 1 | `relations.ts` with `RELATION_REGISTER` + `brokenRelations()`, pure | **PASS** — no Phaser import; the walk runs in Node |
| 2 | Every `holds()` reads both ends through the owning module; no copied values | **PASS** — read entry by entry. Two literals present, both the relation's *own* knob (`TRACE_STRETCH = 2`, `OWL_MARGIN = 0.05`), each with a comment saying so, exactly as the criterion allows |
| 3 | ≥8 relations, including the six the design named | **PASS — 13 registered**, all six named ones present |
| 4 | Restated values removed from relation comments | **PASS** — the `(6)` in `bank.ts` and the `(8)` in `fetch.ts` are gone; `traces.ts` no longer states the product; `governance.ts` points at the register |
| 5 | `foodstore.ts`'s "mirrors `STOCKPILE_CAP`" resolved, numbers unmoved | **PASS** — resolved as a **false value claim** (food 6, resources 8, deliberately, because food spoils). Restated as a claim about the *pattern*; no relation registered for it; neither constant moved |
| 6 | **Any broken relation repaired in this commit** | **PASS — one found, one repaired.** See below |
| 7 | `brokenRelations()` empty on the shipping tree, walk names id + claim on failure | **PASS** — and the register has an anti-shrink guard, so it cannot be made green by deletion |
| 8 | Module note carries 501's two rules | **PASS** |
| 9 | Full suite green; no constant's value changed except a named repair | **PASS** — exactly one value moved, named below and in the code plan |

### The finding

`WORK_BUILD_FLOOR` = `structureRecipe()` total + 1. The tithe (BACKLOG-509) put that total at 6, so the
floor is **7**. `STOCKPILE_SOFT_CAP` was **6**, and `overSoftCap` is a strict `>`. A gather-first ground
therefore could not reach the total its own policy demands before building without already being glutted —
so under carry pressure it sheds the surplus to a lighter neighbour and drops back below the floor.
*"Stores before walls"* stopped ending in a wall.

The sharp part is the provenance. **Cycle 146 caused this while fixing the same class of defect.** Deriving
`WORK_BUILD_FLOOR` from the recipe was the correct repair for one stale relation and it silently broke a
second one, in another module, in the same line — which is the strongest possible argument for the register
this item ships, and it was not found by reading comments but by writing the predicate.

Repaired: `STOCKPILE_SOFT_CAP = 7`, left a literal with the derivation stated in its comment and the
relation pinned in the register (the design's second sanctioned outcome, chosen over deriving it because
`structureRecipe` is defined below the constant in the same module and a derived initializer would sit in
its own TDZ). Full unit suite was green before the repair and after it, so nothing else in the park had
been tuned against the old 6.

### The reachability bar

**Not met by the register — met by the repair, which is what the design said it had to be.** A gather-first
ground can now bank to its build floor and put the landmark up, instead of reaching 7, reading as glutted,
and shedding back to 6 the next time a resident crosses to a lighter neighbour. The player-side read is the
work-policy lens on a `gather` ground: it defers, banks, and then *builds*, which is the behaviour the lens
glyph and the persisted setting have been describing since cycle 121 and have not delivered since cycle 146.

Two honest caveats, recorded rather than smoothed over:

- **It is one unit of slack, not a new system.** The observable difference is a landmark that goes up on a
  gather-first ground where it previously stalled — real, and smaller than the lore track's read.
- **The register itself is unreachable by construction**, and the design said so in advance. It is
  infrastructure whose value is the next time a constant moves, and it earned that value on its first walk
  rather than on a promise. The Validator should weigh the repair, not the file.

## Recommendation

**Lore track: APPROVED.** **Structure track: APPROVED.**
