# Cycle 131 — Design

Both tracks close **Milestone 13**. The lore track takes its last unchecked arc (404), the structure track
takes its last unchecked arc (482). If both approve, the Validator declares the milestone SHIPPED and the
smiths draft Milestone 14 next cycle.

---

## Lore track — BACKLOG-404

**Item:** BACKLOG-404 [social] Mealtime mood in the voice.

**Why this cycle.** The park has kept a contested-drop ledger since cycle 84 (375 yield, 387 gobble, 390
stand, 394 slink-off) and a temperament-shaded greeting register since 368. In 131 cycles the two have never
touched. Everything built on that ledger so far reads it as *history*: `manner.ts` (402) folds a whole career
into one book note, `pecking.ts` (401/389/403) reads it per opponent and spends it on the next contest. None
of them reads it as a **feeling**. 404 is the recency read — not "what kind of eater is this dino" but "how
did its **last** meal go, and is it still carrying it." That is the register the milestone headline promised
and the one the player gets without opening a book: greet a dino a beat after the hatch and it tells you,
unprompted, how it did.

It is deliberately last of the three lore arcs. 129 gave the ledger feet and 130 gave it grace; a dino now has
more ways to end up at a drop than it did two cycles ago, so there is more for a voice to be about.

**What ships.**

A dino's most recent contested-drop memory tints its next greeting, as a temperament-shaded aside appended to
whatever register the greeting already produced — exactly the `hungryAside` / `rattledAside` / `seasonAside` /
`policyAside` shape, which is now the park's five-times-proven way of layering a fact into a line.

Four outcomes, each with three temperament bands (prickly / even / warm), twelve deterministic lines:

| outcome | memory it reads | the feeling |
|---|---|---|
| `gobbled` | 387 "you shouldered past X and snatched the food first" | smug |
| `yielded` | 375 "you stepped back and let X eat first" | wistful |
| `stood` | 390 "you stood your ground and kept your food from X" | proud |
| `slunk` | 394 "X wouldn't budge — you slunk off" | sore |

The aside **names the other dino**, because the ledger always has: the whole point of 401 was that a drop is
a history between two dinos, and a line that said "I got the last one" without saying who from would throw
that away.

The crossing of outcome × temperament is where the distinctness is, and it is not a uniform grid — a prickly
dino that stood its ground is *flinty* about it while a warm one that stood its ground is almost apologetic
for having had to; a warm dino that gobbled is sheepish where a prickly one gloats. Same fact, four different
people.

**Recency, not career.** Only the **most recent** contested beat on the 6-slot ring speaks, and only while it
is still on the ring. That is the whole gate — no timestamp, no new state, no freshness field. The ring rolls
at six memories and the mood goes quiet on its own, which is the 251 wart (a gratitude line that never shut
up) avoided by construction rather than by a second mechanism.

**LLM colour is enrichment only.** The deterministic aside is the floor and is identical under `stub` and
under a loaded model; the WebLLM path gets the same fact in its prompt context so a model can phrase it, per
CHARTER Living-minds. `NPCContext` gains one optional field; the boundary is untouched.

**Acceptance criteria**

- [ ] `lastHatchOutcome(memories)` returns the outcome of the **latest** matching memory in the list (memories are appended oldest-first), or `null` when none match.
- [ ] `lastHatchOutcome([])` is `null`, and a fresh park's greetings are byte-identical to the pre-404 build.
- [ ] All four beats are recognised: a gobble, a yield, a stand and a slink-off each produce their own outcome, matched off the **same** regexes `manner.ts` already owns (no fourth private copy of the strings).
- [ ] `lastHatchOutcome` reads the 385 repay memory as **not** a contested outcome (it is generosity after the fact, not a drop that was contested) — it is `manner`'s `generous` tally only.
- [ ] `mealtimeAside(outcome, other, traits)` returns a non-empty string leading with a space, naming `other`, for all 4 × 3 combinations; all twelve strings are distinct.
- [ ] `mealtimeAside` with `traits` undefined returns the even-band line (the back-compat default every other aside keeps).
- [ ] The aside composes: a dino that is hungry **and** just gobbled gets both asides in one reply, and the reply is still capped in length.
- [ ] `cannedReply` emits the aside only when `ctx.mealtime` is set; every existing brain unit test passes unchanged.
- [ ] WorldScene passes `mealtime` on greet from the greeted dino's live recall ring, and passes nothing when the ring holds no contested beat.
- [ ] The mercy pair (403's `mercyMemory` / `sparedMemory`) is **not** read as an outcome — see Out of scope.
- [ ] e2e: seed a dino's ring with a gobble memory via the dev hook, greet it, and the dialog text contains that dino's name and the smug line.
- [ ] e2e: greet a dino on a fresh park; the dialog contains none of the twelve mealtime strings.

**Out of scope**

- The mercy pair (403). `mercyMemory` / `sparedMemory` are deliberately *not* outcomes here. 403's own header states a gift is not a defeat and leaves both dispositions untouched; giving it a voice is a fifth register with its own emotional logic (magnanimity, and being on the receiving end of it), 403 already lands a ticker line for it, and folding it in unbalances a table the item specified as four. Note it in the verdict for the smiths as an obvious follow-up seed.
- No book line. 402 already owns the book's hatch read; 404 is the voice, and duplicating the fact in the book is how 401/402 nearly collided.
- No new save field, no freshness timestamp, no per-outcome tallies. The ring is the gate.
- No change to any feeding decision. This is a read of the ledger, never a write to it.

**Constraints**

- The outcome reader lives in `world/manner.ts`, reusing its existing `SNATCHED` / `YIELDED` / `STOOD` / `SLUNK` constants. It must **not** add a third private copy of the four strings — 404 is the third consumer, and BACKLOG-483's finding is precisely that each new copy is a silent-failure surface. (483 itself, the write-side builders, stays open.)
- `@mlc-ai/web-llm` stays out of everything touched here.
- File overlap with the structure track: **none in code**. 404 touches `world/manner.ts`, `ai/brain.ts`, and the greet call site in `scenes/WorldScene.ts`; 482 touches `world/standings.ts` (new), `ai/roles.ts`, `world/pioneer.ts`, `ui/lenses.ts`, and the *book-row* section of `WorldScene.ts`. Both edit `WorldScene.ts` in different methods — sequence 404 first, then 482.

---

## Structure track — BACKLOG-482

**Item:** BACKLOG-482 [infra] One place the standings are derived.

**Why this cycle.** Three per-zone standings now exist and no two were built the same way. `pioneer` (343)
is a persisted `Record<zoneId, name>` in `world/pioneer.ts` with its own book-line builder. `provider` (448 /
453) is derived in `ai/roles.ts` from a candidate roster and surfaced through the *role* system. The council
(479) is derived in `ai/roles.ts` too, but through a different function with a different eligibility bar, and
the collection book renders its line from an **inline IIFE inside `bookRows()`** — a book line that exists in
no module and no test of its own. Three standings, three shapes, three code paths, and a fourth (484's
termed seat) and a fifth (487's second call) queued directly behind them.

`ZONE_TERRAIN` (449) already taught this park the lesson and wrote the promise into its own header: *a fourth
zone is a row, not three branches.* 482 is that promise applied to roles. It is picked now rather than later
because both queued follow-ups are cheaper written once against a folded module than twice against a sprawl.

**What ships.**

A new pure module `game/src/world/standings.ts` with **one shape**:

```ts
export type StandingKind = 'pioneer' | 'provider' | 'council';
export interface Standing { zone: string; kind: StandingKind; holders: readonly string[]; }
```

`holders` is an array for all three kinds — the council's plurality is the general case and pioneer/provider
are the one-element instances of it, rather than two shapes with a union type between them. One derivation,
`zoneStandings(candidates, pioneers)`, returns every standing on every ground in one pass, built from the
existing `ProviderCandidate` roster `WorldScene.zoneCandidates()` already assembles. One book-line builder,
`standingLine(standing, dinoName, zoneName)`, owns the wording for all three kinds — including the council
line lifted verbatim out of the `bookRows()` IIFE, which gets a home and a unit test for the first time.

`WorldScene` derives standings **once per read** and every consumer goes through it: `providerFor` (which the
handover beat, the greeting aside and the spend policy all call), the map lens's council column, and the book.
`BookRow.pioneer` and `BookRow.council` collapse into one ordered `standings?: string[]`.

**No behavior change is intended, and that is the acceptance test.** The same dino holds the same standing
before and after, every rendered string is byte-identical, and a suite that does not move is the evidence —
the discipline 476 and 477 both closed on.

**On `since`.** The item's sketched shape carried a `since` field; it is **deliberately not built**. The
council is re-derived from live banked tallies on every read, so a `since` computed today would be "now" on
every read — a field that reads like a date and means nothing. Giving a seat a real date is exactly
**BACKLOG-484** ("the seat has a term"), which is queued directly behind this. The shape stays honest and 484
adds the field when there is something true to put in it.

**Acceptance criteria**

- [ ] `game/src/world/standings.ts` is pure TypeScript (no Phaser import) and Node-testable.
- [ ] `zoneStandings` on an empty roster with no pioneers returns `[]`.
- [ ] For each zone, `zoneStandings` emits a `pioneer` standing iff that ground has a recorded pioneer, a `provider` standing iff `zoneProvider` names one, and a `council` standing iff `zoneCouncil` seats anyone.
- [ ] The provider named by `zoneStandings` is identical to `zoneProvider`'s answer for the same input, and the council holders are identical (in the same order) to `zoneCouncil`'s — proven by a unit test that runs both.
- [ ] `standingsOf(all, name)` returns every standing that dino holds, across all grounds.
- [ ] `standingLine` renders the council line byte-identical to the string `bookRows()` produced before this cycle (`👥 one of the Grove's 2 voices`, singular `voice` at 1) and the pioneer line via the existing `pioneerLine`.
- [ ] `WorldScene.providerFor` returns the same name as before for the same world state; the 467 handover beat and the 453 provider aside are unchanged.
- [ ] The map lens still shows `👥N` on a ground that seats a council, and nothing on one that doesn't.
- [ ] The collection book still shows the seat line and the pioneer line, in the same order, for the same dinos.
- [ ] `window.__councils()` still returns the same `Record<zoneId, string[]>` (specs depend on it); a new `window.__standings()` exposes the folded read.
- [ ] Save format unchanged — no new persisted field, `pioneers` untouched. An old save loads and reads identically.
- [ ] Full unit + e2e suite green with **no assertion amended** for a behavior change. (An assertion may move to a new import path; none may change what it expects.)

**Out of scope**

- `since` / seat terms (BACKLOG-484).
- The `Role` system itself (`deriveRole` / `settleRole` / the 🧺 role icon). A dino's park-wide *role* is a different fact from a ground's *standing*; folding them is a second refactor and would move behavior.
- Persisting standings. All three stay derived, as they are today.
- The spend/work priorities. They are ground *calls*, not standings; 487 is where they go next.

**Constraints**

- Purely mechanical. If a rendered string or a decision would change, the fold is wrong — stop and re-derive.
- `zoneCouncil` / `zoneProvider` / `councilSeats` stay exported from `ai/roles.ts` (the vote 481 and existing specs import them); `standings.ts` composes them rather than re-implementing the comparators. Duplicating the sort is the exact failure this item exists to prevent.
- Additive save only.
- Sequence after the lore track's `WorldScene` edit (different methods, but one file).
