# Cycle 139 — QA

**Build:** ✅ `npm run build` clean (Vite + PWA, no type errors).
**Unit tests:** ✅ `npx vitest run` — **1997 passed / 2 skipped**, 203 files. (The two skips are the
long-standing outline assertion, skipped by name with its reason recorded.)
**E2E tests:** ✅ **579 passed / 1 failed**. The single failure is `mobile-minds.spec.ts` "long dialogs page
GBA-style", which is **BACKLOG-430** — red on a clean HEAD, off every diff in this cycle, and re-diagnosed
in cycle 135 as a serial-boot timing problem in the keeper picker. Not a regression from this cycle. No
parallel-load victims this run; the three that fell in the Coder's first full run
(`cycle-086-fernreach-terrain`, `cycle-095-homesick`, `cycle-110-plenty`) all passed isolated and passed
again in both later full runs.

**Boundary check:** ✅ `grep -rn "@mlc-ai/web-llm" game/src --include=*.ts` outside `game/src/ai/` returns
nothing.

**Save check:** ✅ additive only. 411 persists nothing at all; 497 writes ordinary `foodBanked` entries on
the `!save` branch. No save version bump; a restored save seeds nothing.

---

## Lore track — BACKLOG-411

| criterion | status | evidence |
|---|---|---|
| mid-ritual stretch ended by a dino in range files a memory naming the ritual and the finder | **PASS** | e2e `cycle-139-glad.spec.ts` "a ritual ended by a body is a moment" — asserts exactly one `glad of the company` memory and that it names the finder |
| exactly one ticker line, naming both dinos | **PASS** | same spec — `ticker().filter(...came over while...)` has length 1 and contains both names |
| the beat floats a glyph over the found dino | **PASS (by inspection + unit pin)** | `breakTic` calls `flashFeed(d, COMPANY_GLYPH)`. The park has no dev hook for the float, so no beat in this codebase asserts one directly; what *is* pinned is the half that can silently break — `cycle-139-glad.test.ts` "the company glyph is disjoint from every tic glyph", so the mark that says *the ritual ended* can never become the mark that says *the ritual is happening*. Filed as a note below rather than a bug. |
| a stretch ended by a pressing need files nothing | **PASS** | e2e "a need is not company" — null trace, no memory, no ticker line; unit `foundByCompany(true, true) === false` |
| a stretch that never reached the ritual files nothing | **PASS** | unit `foundByCompany(false, *) === false` |
| a fresh trace leads the next greeting, in front of the brain's own text | **PASS** | e2e "the next greeting leads with it, exactly once" — the line contains `Glad you came by` and the finder's name |
| the trace is consumed by that one line | **PASS** | same spec — the second `__pickTone` does not carry the opener |
| a trace past the fade window does not lead | **PASS** | e2e "a trace older than the window is not worth leading with" (backdated via `__breakTic(name, agedBy)`); unit `companyTraceIsFresh` at, below and above the boundary |
| the keeper's catch outranks the trace | **PASS** | e2e "the keeper's catch outranks the trace" — the caught opener wins **and** the trace is left unspent, so the catch took the line and not the trace |
| every new decision is a pure exported function with unit coverage | **PASS** | `cycle-139-glad.test.ts`, 10 tests over `foundByCompany`, `companyTraceIsFresh`, the three string builders and the glyph pin |
| held by the ambient pause | **PASS — spec added by QA** | the Coder shipped this branch without a spec. Added "the ambient hold stops the beat, and releasing it lets the beat through", which also pins the harder half: **the stretch still ends while held**, so the teardown really is unconditional |
| an e2e drives the production path through dev hooks | **PASS** | `__breakTic` calls production's `breakTic`; `__companyTrace` is a pure read. No second path exists |
| build clean / suite green / brain boundary | **PASS** | see header |

**Bugs found beyond the acceptance set:** none.

**Notes.**

- `companyNear` is now `nearestCompany(d) !== null`, so the solitude rule and the beat cannot disagree about
  who was standing there. Every pre-existing 405 spec stayed green through that refactor, which is the
  evidence the two really were the same predicate.
- The `!caught` guard on the trace is doubly redundant (a caught dino is mid-stretch, so any trace it holds
  is older than the ritual it is standing in) — the design asked for it and the e2e asserts the redundancy
  from the other side by checking the trace survives the catch.
- One spec-hygiene fix the Coder made mid-flight is worth recording: the first draft of the glad spec let
  `gatherToBowl` pile the whole cast on one ground and then asserted *which* dino was named. That was
  asserting `nearestCompany`'s tie-break, not the beat. The rest of the cast is now parked in the far
  corner so the spec means what it says.

**Recommendation: APPROVE.**

---

## Structure track — BACKLOG-497

| criterion | status | evidence |
|---|---|---|
| `GOVERNANCE_OBSERVABLE_AT` exists beside the founding constants, derived not restated, with its reasoning | **PASS** | `game/src/world/founding.ts` — `residents: COUNCIL_PER_HEADS * 2`, `banked: COUNCIL_MIN_BANKS`, both imported from `ai/roles`; the doc comment carries the why |
| `foundingCandidates()` — one entry per roster dino, its ground, its tally (absent → 0) | **PASS** | unit "has one entry per roster dino, carrying its spawn ground" + "reads an unbanked dino as zero rather than dropping it" |
| `foundingCouncils()` covers every ground in `zoneChain()`, via `zoneCouncil` | **PASS** | unit "covers every ground in the chain — an empty seating is a claim, not an absence"; the function body is one `zoneCouncil` call per ground and no arithmetic |
| at least one ground seats a council | **PASS** | unit "seats at least one council on a fresh save" |
| **at least one ground seats two or more voices** | **PASS** | unit "seats at least one council that can disagree" — the reachability pin |
| no founding seat holds `PROVIDER_BANKS` | **PASS** | unit "seats a council, not a provider in a council badge" |
| the two-seat ground's seats cast different pantry ballots | **PASS** | unit "and its seats actually want different things" — `votedSpend` over their unshaded name-seeded traits gives a set of size 2 |
| `councilSeats(GOVERNANCE_OBSERVABLE_AT.residents, …) >= 2` | **PASS** | unit "states a population that actually seats two voices" |
| the scene picks the new tallies up with **no new call site** | **PASS** | `git diff` on `WorldScene.ts` for this track is empty. The two existing `FOUNDING_BANKED` loops (the `!save` seed and `__clearFounding`) carry it |
| save-compatible, no version bump | **PASS** | see header |
| full suite green, build clean | **PASS** | see header |

**Bugs found beyond the acceptance set:** none, but see the fallout below — it is the largest thing this
cycle turned up and it is not a bug.

**The fallout, itemised.** Seven e2e specs across five files went red on one root cause: the bowl now
carries a spend policy from the first frame, so `__spendPriority('bowl')` is no longer `null` on a young
park and `granaryDeferredForFeeding` defers a feed-first ground's granary. Every one of them was asserting
the defect.

| spec | what it asserted | fix |
|---|---|---|
| `cycle-115-governance` "no spend policy until a provider emerges" | the bowl decides nothing at boot | asks for `emptyGrounds()` by name |
| `cycle-117-policy-word` "a ground with no policy says nothing" | same | same |
| `cycle-118-discontent` "a park with no provider never grumbles" | same | same |
| `cycle-110-granary` ×2 | the bowl raises a granary the instant the pile allows | same — a feed-first ground defers, which is 463 working |
| `cycle-128-upkeep` ×2 (via `buildUp`) | same | same |

`cycle-128-upkeep` "a fresh park owes nothing — but it is no longer inert beneath the system" is the one
spec in that file whose subject genuinely **is** the founding state, and it deliberately does **not** call
the helper; it carries a comment saying so. No new pin was weakened to keep an old assertion green, and
`emptyGrounds` is the helper 495's groundwork already put there for exactly this.

**QA addition.** The unit suite pins the founding seating as *data*; nothing asserted the running game boots
into it. Added `tests/e2e/cycle-139-quorum.spec.ts`: the bowl seats ≥2 voices and carries a non-null policy
on a fresh boot, the Grove keeps the single seat 492 gave it (so this **added** a ground rather than moving
one), and a control asserting the pre-governance fixture is still reachable by name.

**Note for the Validator (and for BACKLOG-500).** `foundingCouncils()` now says out loud that the Hollow
and the Sunward Ridge seat `[]` — because nobody lives on them. That is BACKLOG-500's evidence, produced as
a by-product of this item, and it is deliberately not fixed here.

**Recommendation: APPROVE.**

---

## Score

**24 / 24 criteria pass** (13 lore, 11 structure). Two of them are passing on specs QA added rather than
specs the Coder shipped, both noted above. Both tracks: **APPROVE**.
