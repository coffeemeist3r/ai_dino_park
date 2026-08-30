# Cycle 145 — QA

Gates run against the committed tree, not against the Coder's word for it.

## Gates

| gate | result |
|---|---|
| `npm run build` | **clean** (type-check passes; the usual >500 kB chunk warning, unchanged) |
| `npx vitest run` | **2267 passed, 3 skipped**, 221 files (was 2242 / 218 at the close of cycle 144) |
| `npx playwright test` (full, parallel) | **624 passed, 3 failed** — see below |
| `@mlc-ai/web-llm` boundary | **held** — no import outside `game/src/ai/` |
| save shape | **unchanged** — neither track adds a field, and neither reads one that did not exist |

### The three e2e reds

- `mobile-minds.spec.ts` — *long dialogs page GBA-style*. The **standing** red, filed as BACKLOG-430 and
  re-pointed at BACKLOG-515 last cycle. Fails at `--workers=1` on a stashed clean HEAD; nothing in this
  cycle is near the dialog path.
- `controls-help.spec.ts` × 2 — **not a regression.** Both failed at `boot()`'s `__ready` wait in the full
  parallel run and **both pass in an isolated re-run** (3/3 green in 4.0s). This is the catalogued
  parallel-load flake the daily-cycle routine names by name, and it is also the *other* face of BACKLOG-515:
  515 catalogues two specs that fail serial and pass under load, and this is the older pattern — pass serial,
  fail under load — on a third spec. Worth adding to 515 rather than filing a fourth item, and the Validator
  should say so.

Nothing in this cycle touches the help panel, the dialog pager, or `boot()`.

### Targeted confirmation run

The two new specs plus the two they could plausibly have broken, run together:
`cycle-145-founding-kind`, `cycle-145-stake`, `cycle-144-founders`, `cycle-143-saltpan` — **16 passed**.

---

## Lore track — BACKLOG-516

| # | criterion | result |
|---|---|---|
| 1 | `pioneerLine` takes a kind; `born` and `crossed` wordings | **PASS** — `cycle-119-pioneer`, `cycle-145-founding-kind` |
| 2 | both wordings route through `theZone`; the article grep stays green | **PASS** — `cycle-144-articles` (25 tests) green, including two new assertions for the `born` sentence |
| 3 | `foundingKind` lives beside `foundingPioneers()` and is the only derivation | **PASS** — one definition, one call site (`standings.ts`), one more in the register |
| 4 | `zoneStandings` carries the kind; no consumer re-derives it | **PASS** — `via` on the standing; `WorldScene` unchanged for this track |
| 5 | fresh save: five founding lines, none containing `first across` | **PASS** — e2e `the book says every founder has been there since the first morning` |
| 6 | a crossing into the Saltpan reads `first across`, ticker beat unchanged | **PASS** — e2e third case; `pioneerEvent` is byte-identical and its assertions are untouched |
| 7 | no new save field; a pre-145 save reinterprets with no migration | **PASS** — derived read; `saveGame.ts` untouched. Verified by the unit case where a pre-512 save recorded a real arrival and correctly reads `crossed` |
| 8 | build clean, unit + e2e green | **PASS** (with the three flakes above) |

**QA recommendation: APPROVE.**

One observation for the Validator rather than a fault: criterion 6's "the only line of its kind in the park"
assertion is the one that makes this item more than a reword. Before tonight every founding line in the game
said the same thing; after tonight the crossing sentence is *scarce*, and the only way to see one is to make
one happen.

---

## Structure track — BACKLOG-501

| # | criterion | result |
|---|---|---|
| 1 | exports `REACHABILITY_REGISTER`, an entry type, `darkEntries()` | **PASS** |
| 2 | every entry has non-empty `id`/`system`/`fact`; ids unique | **PASS** — pinned by two tests |
| 3 | every `holds()` goes through the production function that owns the fact | **PASS** on inspection — `groundsWithoutResidents`, `pileTotal`+`REPAIR_COST`, `foundingCouncils`, `ACTIVE_SCALE`, `quarryGround`/`quarryKind`, `isUnsettled`, `foundingPioneers`, `foundingKind`, `PROP_RIGS`. No entry restates a constant's literal value. **One caveat below.** |
| 4 | covers the eight claims in the design's table | **PASS** — nine entries; the ninth is the addition the design asked for |
| 5 | one test walks the register and fails naming `id` + `fact` | **PASS** |
| 6 | the test is *proven to fail* | **PASS** — recorded in the codeplan with the actual failure text, produced before the repair rather than after it |
| 7 | anything dark is fixed in this cycle | **PASS** — entry 9 was dark; `stake.ts` + `syncStakes()` shipped in the same commit |
| 8 | build clean, unit + e2e green, no Phaser import | **PASS** — `reachability.ts` imports only pure `world/` modules and `art/propArt` |

**Caveat on criterion 3, logged not failed.** `MINUTES_PER_DAY` is a private constant in `clock.ts`, so
`reachability.ts` keeps its own `24 * 60`. That is a second copy of a number, which is the exact hazard the
file's own header warns about — mitigated only by it being the definition of a day rather than a tuning knob.
The honest fix is a one-line export from `clock.ts`; it is out of scope tonight and worth a filed item.

**QA recommendation: APPROVE.**

The thing worth saying plainly: this track's value is not the module, it is that **the first walk found
something**. Two rigs had been drawn, tested, committed and celebrated in a chronicle entry, and nothing in
the park could show either of them — and no test in the suite was capable of noticing, because every art test
asks whether a rig is *well drawn* and none asked whether it is *reachable*. That gap existed for one night
here; the stash rule has been open since cycle 91 with no deadline attached, so the same gap could have been
years wide on a slower queue.
