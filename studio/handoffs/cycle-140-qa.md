# Cycle 140 — QA

Gates run on the coder's commit (`b8d56df`).

- `npm run build` — **clean** (type-check passes; only the standing >500 kB chunk-size advisory).
- `npx vitest run` — **2053 passed / 2 skipped**, 206 files, 8.3s.
- `npx --yes kill-port 5173` then `npx playwright test` — **582 passed / 2 failed**.
  - `mobile-minds.spec.ts` "long dialogs page GBA-style" — **BACKLOG-430**, the standing red that fails on
    a clean HEAD. Passed on an isolated re-run.
  - `cycle-110-plenty.spec.ts` "hearsay of plenty chooses the migration destination" — the catalogued
    parallel-load victim, named by that spec in the cycle-130 chronicle. Passed on an isolated re-run.
  - Both re-ran green together in one isolated 7-test run. Neither is near either track's diff.
- Brain boundary — `grep -rn "@mlc-ai/web-llm" game/src` outside `game/src/ai/`: **no hits**.
- Save format — no new persisted field on either track; the two new dinos come off `ROSTER` on the `!save`
  branch. Additive by construction.

---

## Lore track — BACKLOG-423

| # | Criterion | Result |
|---|---|---|
| 1 | `ticAside(kind)` exists in `world/tic.ts`, non-empty for all three `TicKind` | **PASS** — `cycle-140-tic-voice.test.ts` "has a non-empty aside for every ritual kind" |
| 2 | The three asides are pairwise distinct | **PASS** — `new Set(KINDS.map(ticAside)).size === 3` |
| 3 | Composed line is `<opener> <aside> <reply>`, one space, no doubles | **PASS** — unit "composes as … with no double spaces"; the `filter(Boolean).join(' ')` form makes it structural |
| 4 | `bashfulOpener` / `fondOpener` / `teaseOpener` / `resignedOpener` / `caughtOpener` byte-identical | **PASS** — the two named in the design are pinned against their literal text; the other three are untouched in the diff and `caughtOpener` delegates to them |
| 5 | A dino not mid-ritual gets no aside | **PASS** — unit "drops cleanly to `<opener> <reply>`" + e2e "a dino that is not mid-ritual gets no aside at all" |
| 6 | Each aside distinguishable by an asserted substring | **PASS** — `feet` / `turn` / `picks at it` |
| 7 | `NPCContext.interrupted` added; prompt gains a clause when set and is identical when absent | **PASS** — unit "changes nothing when the dino was not interrupted" and "tells the model what it walked in on" |
| 8 | `WorldScene` sets `interrupted` only on a catch, via the same `ticFor(target)` | **PASS** — read at `WorldScene.ts` greet block: the field is `caught ? … : undefined` and the aside uses the same call |
| 9 | Stub/canned path produces the full line with no model | **PASS** — `cycle-140-tic-voice.spec.ts` runs headless with no WebGPU and reads the aside out of the dialog |
| 10 | Brain boundary intact | **PASS** |
| 11 | Save format unchanged | **PASS** |
| 12 | Build / unit / e2e | **PASS** (see gates) |

**12 / 12.**

**Reachability check (CHARTER v7).** Verified by the e2e rather than argued: the spec boots a fresh save
with no model, walks the founding cast, finds at least two distinct ritual kinds among them, catches each
one and reads back its own kind's aside — and asserts the other two kinds' asides are absent from that
line. The one thing the design promised and the item as filed would not have delivered is exactly what the
e2e pins: this is visible without a model.

**One note, not a fail.** On a fresh save every catch is register `bashful` (hearts start at 0, and
`fondOfBeingCaught` gates the pleased/teasing/resigned ladder on `FOND_MIN`). So the *first* thing a new
player sees is the bashful opener plus the ritual's aside — which is the reachable beat — and the
escalation ladder from 420 remains a later-session read. That was true before this cycle and is unchanged
by it.

---

## Structure track — BACKLOG-500

| # | Criterion | Result |
|---|---|---|
| 1 | Exactly two new `ROSTER` entries, one `hollow` one `ridge`, unique names, existing species, neither compsognathus, distinct colours | **PASS** — Murk (parasaurolophus, `0x4c6b78`) and Ember (brontosaurus, `0xc4713f`); `roster.test.ts` "never a species+colour pair" covers the colour claim; `diet.test.ts` shows both herbivore |
| 2 | The five bowl entries unchanged | **PASS** — diff touches only the appended rows and the comment above them |
| 3 | `foundingResidents()` exported, keyed by every ground in `zoneChain()` | **PASS** — `cycle-140-residency.test.ts` "reports every ground in the chain" |
| 4 | `groundsWithoutResidents()` exported and derived | **PASS** |
| 5 | Unit test asserts `groundsWithoutResidents()` is `[]`, reading `zoneChain()` not a literal list | **PASS** — the invariant test, plus "is derived from zoneChain, so a sixth ground inherits it" |
| 6 | Every roster spawn tile is grass in its own zone, all ten | **PASS** — "spawns every dino on grass in its own zone" |
| 7 | No ground over `zoneCapacity` at boot | **PASS** — "does not boot any ground over its capacity" |
| 8 | `foundingCouncils()` unchanged for the bowl and the Grove | **PASS** — pinned to `['Glade','Sunny']` and `['Pip']`; the Hollow and the Ridge still seat nobody, because the new residents bank nothing |
| 9 | E2E asserts every zone id has a resident after boot | **PASS** — `cycle-140-residency.spec.ts`, ten dinos, all five grounds occupied, bowl still five |
| 10 | `founding.ts` header note records why the roster grew rather than rebalanced | **PASS** — the note is on `groundsWithoutResidents` and again above the new roster rows, naming `TILES_PER_HEAD`, the 460 floor, the huddle and the food scramble |
| 11 | Save format additive; an existing save loads without error and without duplicate spawns | **PASS** — no save field touched; the whole change is on the `!save` branch. The full e2e suite includes the save/reload specs and they are green |
| 12 | Build / unit / e2e | **PASS** (see gates) |

**12 / 12.**

**Reachability check (CHARTER v7).** Walk east from spawn twice and then north out of the Grove: there is
somebody standing on the ground at the end of each. Before this cycle both were empty from boot to
save-death.

---

## Finding for the Validator (raised, not waved through)

The coder's spec fallout surfaced something bigger than a spec edit. **BACKLOG-500 makes BACKLOG-474
dormant on a fresh save.** 474's "unsettled ground" read — its lens glyph, and the frontier tier that
makes a migrant prefer a ground nobody has lived on — is *defined* as grounds with no residents, and
CHARTER v7 says there must be none. `__unsettled()` now returns `[]` at boot where it returned
`['hollow', 'ridge']`.

The cycle did not hide this: `cycle-120-unsettled.spec.ts` now asserts the empty result out loud with the
reason, and proves the read still fires the moment a ground actually empties. Two of its three tests now
*make* a frontier by walking the residents out first.

QA's read: this is not a defect in the work — it is two charter-level rules meeting, and 500 is the one the
constitution names. But it is precisely the class of thing BACKLOG-501 (the reachability register) exists
to catch, and it should be queued rather than left in a spec comment. Recommend the Validator file it.

Three other spec files moved, all of them honestly:
- `roster.test.ts` / `cycle-005-roster.spec.ts` — 8 → 10.
- `diet.test.ts` — two herbivores added to the roster map; the carnivore *rule* needed nothing.
- `cycle-062-resource.spec.ts` — a real consequence: with five inhabited grounds the ambient roll can drop
  a new resource in the same step as a pickup, so "nothing is lying around afterwards" was never the claim
  the test wanted. It now asserts the branch at that tile is gone and the tally rose.

No spec was deleted this cycle.
