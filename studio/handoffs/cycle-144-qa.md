# Cycle 144 — QA

**Build:** ✅ `npm run build` clean (tsc -b + vite build).
**Unit:** ✅ `npx vitest run` — **2221 passed**, 3 skipped, 218 files.
**E2E:** ✅ `npx playwright test` — **619 passed, 1 failed**: `mobile-minds` long-dialog paging, the
standing red (BACKLOG-430). No other red.

**Boundary:** ✅ `@mlc-ai/web-llm` grep returns nothing outside `game/src/ai/`.
**Save:** ✅ additive — no field added, no version bump, `saveGame.ts` untouched.

### A second sighting for BACKLOG-430's class, logged rather than chased

`cycle-044-sound` › "a greeted dino answers in its own voice" failed in the Coder's full parallel
run and **passed in this one**. QA reproduced it at `--workers=1` and then reproduced it again at
`--workers=1` on a **stashed, clean HEAD** with this cycle's entire diff removed. So it fails serial
and passes under load — the exact inverse signature the cycle-135 QA recorded for `mobile-minds`,
and on a spec with nothing to do with it. Two specs now wear it. That is a property of the runner,
not of either spec, and it belongs on the Structure Track next to 495 rather than in a per-cycle
diagnosis. Not a regression from this cycle: proved, not asserted.

---

## Structure track — BACKLOG-512

| Criterion | Status | Evidence |
|---|---|---|
| `foundingPioneers()` — one founder per inhabited founding ground, none for an empty one | **PASS** | `cycle-144-founders.test.ts` › "records a founder for every ground the roster wakes on, and none for one it does not" — asserts the biconditional over every entry, not a hand-listed set |
| Walks `zoneChain()`/`ROSTER`, not a list of ids | **PASS** | same file › "covers the whole chain, so a seventh ground inherits this the day it is added"; the implementation reads `foundingResidents()`, which already walks both |
| `isUnsettled` takes two arguments; `isOrigin` gone from signature, call site and doc | **PASS** | signature in `frontier.ts`; `WorldScene.isZoneUnsettled` passes two; the module doc is rewritten to describe the founding record. Verified by grep: no `isUnsettled(` anywhere passes three arguments |
| Fresh save: pioneer for bowl/Grove/Fernreach/Hollow/Ridge, none for the Saltpan | **PASS** | `cycle-144-founders.spec.ts` › "every ground the roster wakes on names a founder, from the first frame" — reads `__standings()` in the browser and checks the exact ground set plus three named founders |
| Fresh save: `isUnsettled` true for the Saltpan, false for the rest, asserted by walking the chain | **PASS** | unit › "exactly one ground reads unsettled on a fresh park, and it is the Saltpan"; e2e › "exactly one ground reads unsettled, and none reads hollowed, at boot" |
| Emptying any founded ground leaves it settled and the Saltpan the only frontier | **PASS** | unit › "emptying any founded ground leaves the Saltpan the only frontier" — loops every founded ground rather than testing one; e2e › "a ground its cast has lived on since frame zero reads hollowed when it empties, not unsettled" |
| The cycle-143 spec's Hollow case flips, with a comment naming this item | **PASS** | `cycle-143-saltpan.spec.ts` now asserts `unsettled === []` and `__hollowed() === ['hollow']`, with a five-line comment on why the assertion inverted |
| `unsettledNeighbor` never returns a founded-but-empty ground | **PASS** | unit › "never aims a migrant at a founded-but-empty neighbour" — and the function itself is **unedited**, which is the finding: fixing the predicate fixed the destination pick |
| Lens: three branches, one test each | **PASS** | unit `isHollowed` cases + the complement test; e2e reads `__zoneMap()` and asserts `unsettled:false / hollowed:true` on the emptied Hollow; `cycle-120-unsettled` covers the unsettled branch and the ordinary-tier branch |
| `hollowedLine` names the founder; posted once per emptying, repeatable after repopulation | **PASS** | e2e › "the hollowed beat sounds once, and again only after the ground repopulates and empties" — two reads of an already-announced ground add nothing; a leave/return/leave adds exactly one |
| Pre-144 save back-fills; a recorded arrival is kept | **PASS** | unit › "fills every founding ground in a pre-144 save that recorded nothing" and "keeps a recorded arrival — first write wins", plus an idempotence case |
| `saveGame.ts` unchanged in shape; round-trip specs green | **PASS** | file untouched; the save specs are in the 2221 |
| e2e covers book standing + single unsettled + the emptying walk | **PASS** | `cycle-144-founders.spec.ts`, six tests |

**Bugs found beyond the acceptance set:** none.

**Two things QA checked that the criteria did not ask for, because they were the design's named traps:**

1. **The ticker trap.** `cycle-144-founders.spec.ts` › "seeding the founders posts nothing" asserts
   the boot log contains no `first ever to set foot` line at all. Five founding announcements at
   boot would have been a worse lie than the one this item fixes, and it is now a spec rather than
   a discipline.
2. **The silent-default trap.** `isOrigin` had a default, so dropping the parameter could have
   compiled at every caller that omitted it. Grepped: three test files called it with three
   arguments and the type-check caught all three. No caller was left passing a stale flag.

**Recommendation: APPROVE.**

---

## Lore track — BACKLOG-499

| Criterion | Status | Evidence |
|---|---|---|
| `theZone` exported from `zones.ts`, tested over all six names | **PASS** | `cycle-144-articles.test.ts` › "never doubles an article, for any shipping ground" / "always supplies exactly one lowercase article" — both loop `ZONES`, so a seventh ground is covered on the day it is added |
| Idempotent | **PASS** | › "is idempotent both ways" — for `theZone` and `bareZone`, over every name |
| No source file prepends a bare article to an interpolated ground | **PASS** | › "finds no hand-rolled article anywhere under game/src" — walks the tree, and its sibling test proves the regex catches all three interpolation forms and does **not** fire on `the ${labelOf(food)}` |
| The eight doubled-article sites route through the seam | **PASS** | `governance.billCallLine`, both `term` lines, both `WorldScene` council calls, both barter memories, and the barter event line, which fixes **both** grounds it names |
| The bare-name family routes through the same seam; the two warning comments deleted | **PASS** | `foodstore` (5 builders, comment gone), `discontent`, `handover`, `pioneer` (2), `frontier` (3), `brain.providerAside` (all three branches, comment gone), `webllmBrain` context — **plus `providerword.providerWordLine`**, which the Coder added and QA confirms belongs (it was doing the same dodge with no comment to find it by) |
| Standalone display untouched, pinned by a test | **PASS** | unit › "leaves the display names themselves untouched"; e2e › "a heading is still a name — the zone lens keeps the capital" reads `__zoneMap()` and finds `The Grove` and `The Saltpan` |
| Every changed builder asserted on an article-carrying ground **and** on `Pocket Cretaceous` | **PASS** | the 16-row table in `cycle-144-articles.test.ts` drives both branches per builder. **QA extended this**: `pioneerLine`/`pioneerEvent` take an id rather than a name so they could not join the table, and they are two of the first lines a fresh save shows now that 512 puts a founding standing in the book — added as their own case, both branches |
| e2e: no doubled article anywhere in a session's ticker | **PASS** | `cycle-144-articles.spec.ts` › "the park never doubles an article, over a whole session of talking" — drives six upkeep days and a day boundary, then greps the whole log |

**Bugs found beyond the acceptance set:** none. One **spec correction**, described below.

### The one criterion QA changed rather than passed

The design's e2e criterion asked the spec to assert that a governance beat *reads* `the <Ground>`.
It does — but the first run surfaced `🛠️ The Grove patched up its 🗿`, where the ground opens the
sentence and the capital is simply correct English. The design had put sentence-initial explicitly
out of scope, so the assertion, not the code, was wrong. QA replaced it with the claim the item
actually makes: **no capital article ever appears after a word** (`/[a-z] The (Grove|…)/`), which
is precisely the failure the dodging templates used to produce ("sets The Grove's table now") and
leaves the legitimate sentence-opening capital alone. Narrower than the original and true, rather
than broader and false.

### What the repair pass found, and why it is the item's own evidence

Seven e2e specs and six unit files asserted the pre-499 wording. None was loosened; each was
re-pointed with a comment. The one worth the Validator's attention:

**`cycle-138-billcall.spec.ts` asserted the bug verbatim** —
`expect(after).toEqual(["🗳️ the The Grove's council calls it: fills its stores first"])` — inside a
spec about the upkeep gate. The doubled article was not merely shipped for seven cycles; it was
**pinned, in a green suite, by a test that was looking at something else.** QA notes this as the
sharpest reachability lesson of the cycle: a suite can be entirely green over a line no human would
have accepted if they had read it.

**Recommendation: APPROVE.**

---

## Score

**21/21 criteria PASS** — 13 structure, 8 lore. No FAIL, no N/A. Two of the lore criteria were
touched by QA rather than merely scored: one **narrowed** (the e2e assertion, which was broader than
the item's claim and therefore false on a legitimate sentence-opening capital) and one **extended**
(the id-keyed pioneer builders, which the design's table could not reach).
