# Cycle 144 — Code Plan

Build order for the Coder: **structure track first** (logic), **lore track second** (wording).
The two tracks share `pioneer.ts` and `frontier.ts`; the structure track changes what those
functions *do*, the lore track changes what their strings *say*. Doing it the other way round
means rewording lines the structure track then rewrites.

---

## Structure track — BACKLOG-512

**Item:** BACKLOG-512 [core] The frontier read calls lived-in ground unlived-in.

### Files to create

- `game/src/world/cycle-144-founders.test.ts` — the founding-pioneer invariant, the two-clause
  `isUnsettled`, the hollowed read, and the save back-fill.
- `tests/e2e/cycle-144-founders.spec.ts` — the fresh-save read and the emptying walk.

### Files to modify

| File | Change |
|---|---|
| `game/src/world/founding.ts` | Add `foundingPioneers(): Pioneers` — walks `foundingResidents()` (which already walks `zoneChain()` + `ROSTER`) and takes the **first** name listed on each ground; grounds with no residents get no entry. Import `Pioneers` from `./pioneer`. |
| `game/src/world/frontier.ts` | `isUnsettled(heads, pioneer)` — drop the `isOrigin` param. Rewrite the module doc and the function doc: the exclusion is now the founding record, not an id. Add `HOLLOWED_BADGE` and `hollowedLine(zoneName, founder)` beside `UNSETTLED_BADGE`, plus `isHollowed(heads, pioneer)` so the lens's three-way branch is decided here rather than at the call site. |
| `game/src/scenes/WorldScene.ts` | (a) `isZoneUnsettled` drops the `zoneId === BOWL_ID` third argument and its comment. (b) New `private seedFoundingPioneers()` that folds `foundingPioneers()` through `recordPioneer` and **posts nothing** — called from `seedFounding()` (new game) and from the load path immediately after `this.pioneers = save.pioneers ?? {}`. (c) New `private isZoneHollowed(zoneId)` mirroring `isZoneUnsettled`, and `hollowedZones()` mirroring `unsettledZones()`. (d) Pass the hollowed map into `zoneMapModel`. (e) Lens text: three-way branch on `e.unsettled` / `e.hollowed` / else. (f) The one-off hollowed ticker line, fired from the same cadence that calls `bumpPeak` — guarded by a `private hollowedPosted = new Set<string>()` that is **cleared for a ground when it regains a head**, so re-emptying can announce again but a ground sitting empty across ticks announces once. (g) Dev hook `__hollowed` beside `__unsettled` (line 1689) so the e2e spec can read it. |
| `game/src/ui/lenses.ts` | `ZoneMapEntry` gains `hollowed: boolean`; `zoneMapModel` gains a 14th optional param `hollowed: Record<string, boolean> = {}` in the same absent-to-false shape as `unsettled` (line 147 is the pattern to copy). |
| `tests/e2e/cycle-143-saltpan.spec.ts` | The Hollow case flips: walking the Saltpan's founder back out must leave the Hollow reading **settled**. Update the assertion and the comment, naming BACKLOG-512 as the reason. |
| Existing unit tests calling `isUnsettled(h, p, true)` | Drop the third argument. Grep `isUnsettled(` across `game/src` and `tests/` before compiling. |

### Reuse list (mandatory — do not reinvent)

- `recordPioneer` (`world/pioneer.ts`) — first-write-wins; the back-fill's only safety. **Never assign into `this.pioneers` directly.**
- `foundingResidents()` / `zoneChain()` (`world/founding.ts`, `world/zones.ts`) — the derivation walks these, never a list of ids. `groundsWithoutResidents` is the shape to copy.
- `pioneerOf` (`world/pioneer.ts`) — the read.
- `bumpPeak` / `isDeclining` (`world/decline.ts`) — the hollowed read sits **beside** decline, not inside it; do not touch `ZONE_FLOOR` or `DECLINING_MIGRATE_DAMP`.
- `unsettledNeighbor` (`world/frontier.ts`) — unchanged. It takes an `unsettled` predicate, and fixing `isZoneUnsettled` fixes the destination pick with zero edits there. **Confirm this in a test rather than editing the function.**
- `zoneMapModel`'s absent-to-false convention (`ui/lenses.ts:147`).
- `seedFounding()` (`WorldScene`) — the existing new-game founding seam; the pioneer seed hangs off it, not off a new boot hook.

### New dependencies

none.

### Test plan

**Unit — `game/src/world/cycle-144-founders.test.ts`**

- `foundingPioneers()` has an entry for every ground in `foundingResidents()` with residents and none for a ground without → the Saltpan is absent, the other five present.
- Each founder is a name that `foundingResidents()` lists on that ground (no cross-wiring).
- `isUnsettled` is true for the Saltpan's `(0, undefined)` and false for `(0, 'Bramble')` — the emptied-but-founded case, which is the whole item.
- Walking `zoneChain()` against `foundingPioneers()` + `foundingResidents()`: exactly one ground reads unsettled on a fresh park.
- `isHollowed`: true for `(0, 'Bramble')`, false for `(0, undefined)`, false for `(2, 'Bramble')`.
- `hollowedLine` contains the founder's name and the ground's name.
- Back-fill: an empty map through the fold gains the five founders; a map already holding `{hollow: 'Sunny'}` keeps `Sunny` and gains the other four.
- `unsettledNeighbor` given a founded-but-empty neighbour and an unsettled one returns the unsettled one; given only a founded-but-empty neighbour returns `null`.

**Unit — `game/src/world/frontier.test.ts` (existing)**

- Drop `isOrigin` cases; replace with the founded-record equivalents so the file still pins the "stricter than empty" rule.

**E2E — `tests/e2e/cycle-144-founders.spec.ts`**

1. Fresh save → open the collection book → a Grove resident's block shows a founding standing.
2. Fresh save → `__unsettled()` returns exactly one ground, and it is the Saltpan.
3. Relocate the Hollow's resident out (the existing e2e relocate hook the 143 spec uses) → `__unsettled()` still returns only the Saltpan, `__hollowed()` contains the Hollow, and the ticker carries the hollowed line naming Murk.

### Risks

- **The ticker trap.** `foundZone` posts `pioneerEvent` on every successful `recordPioneer`. The seed must go through `recordPioneer` **without** `foundZone`. Six founding lines in the boot ticker would be a REWORK.
- **`isUnsettled`'s third argument has a default.** `isOrigin = false` means dropping the parameter compiles silently at call sites that omitted it. Grep for every caller, tests included, rather than trusting the type-check.
- **The 143 spec is deliberately asserting the bug.** It must be *updated*, not deleted — the behaviour it pins is the item's evidence and the new assertion is its fix.
- **Load-order.** The back-fill must run after `this.pioneers = save.pioneers ?? {}` (line 7633) or it is overwritten. The new-game seed must run inside `seedFounding()`.
- **`ZONE_FLOOR` means the ambient wander alone cannot empty a founded ground**, so the hollowed read is reachable in-game only via the paths that bypass the floor (crowding exodus, the relocate hook). The dev hook makes it e2e-testable; the *player-visible* claim this cycle rests on the book standings, not on the badge.

### Estimated touch count

~8 files.

---

## Lore track — BACKLOG-499

**Item:** BACKLOG-499 [core] The ground with two articles.

### Files to create

- `game/src/world/cycle-144-articles.test.ts` — the seam, its idempotence, and the repo-wide grep guard.
- `tests/e2e/cycle-144-articles.spec.ts` — no doubled article anywhere in a session's ticker.

### Files to modify

| File | Change |
|---|---|
| `game/src/world/zones.ts` | Add `theZone(name: string): string` beside `zoneById`. One rule: strip a leading `The ` / `the ` if present, then return `the ` + the rest. Doc comment states the decision (names keep their articles; sentences go through here) and names 499. |
| `game/src/world/governance.ts` | `billCallLine` — `the ${zoneName}` → `${theZone(zoneName)}`. |
| `game/src/world/term.ts` | Both council-turnover lines (95, 96). |
| `game/src/world/foodstore.ts` | `storesFedLine`, `storesFedMemory`, `carriedMemory`, both harvest lines. **Delete the comment at line 91** — the seam replaces it. |
| `game/src/world/discontent.ts` | Line 52 grumble. |
| `game/src/world/handover.ts` | Line 53 handover beat. |
| `game/src/world/pioneer.ts` | `pioneerLine`, `pioneerEvent`. |
| `game/src/world/frontier.ts` | `settleMemory`, `settleEvent`, and the new `hollowedLine` from the structure track. |
| `game/src/ai/brain.ts` | `providerAside` — all three trait branches. **Delete the comment at line 214.** |
| `game/src/ai/webllmBrain.ts` | The provider-context string (line 132). |
| `game/src/scenes/WorldScene.ts` | Council-call lines 871 and 887; barter memories 4928/4929; barter event 4930 (**two** names in one sentence — the second is mid-phrase after an en-dash and takes the bare display name, not a second article: `the Grove–Hollow edge`, so the second call strips the article without prepending. Add a tiny local for that or a second export; do not hand-roll a `slice`). |
| Existing unit tests asserting these strings | Update the expected text. Expect a wide but shallow diff across `foodstore`, `governance`, `term`, `handover`, `discontent`, `pioneer`, `frontier` and `brain` specs. |

### The en-dash case (the one wrinkle)

`🔄 A and B bartered at the Grove–Hollow edge` needs `the` once and the bare names twice.
`theZone` is wrong for the second half. Export a second one-liner from `zones.ts`:

```ts
export function bareZone(name: string): string;  // 'The Grove' -> 'Grove'
```

and define `theZone(n) = 'the ' + bareZone(n)`. One rule, two exports, no duplicated stripping —
which is also what makes the idempotence criterion trivially true.

### Reuse list (mandatory)

- `zoneById(id).name` (`world/zones.ts`) — the only source of a display name. No call site may hardcode a name.
- The existing line-builder modules — every affected string already lives in a named builder except the three `WorldScene` lines; **do not extract those into new modules this cycle**, just route them through the seam.
- `capitalize` (`ai/persona.ts`) — check before writing any casing helper. It is not needed here (nothing is capitalised, only lowered) but the Coder must confirm rather than add a sibling.

### New dependencies

none.

### Test plan

**Unit — `game/src/world/cycle-144-articles.test.ts`**

- `theZone` over all six `ZONES` names: no result contains `the The` or `the the`, every result starts with a lowercase `the `, and `Pocket Cretaceous` yields `the Pocket Cretaceous`.
- `bareZone` over all six: no result starts with `The `.
- Idempotence: `theZone(theZone(n)) === theZone(n)` and `bareZone(bareZone(n)) === bareZone(n)`.
- **The grep guard:** read every `.ts` under `game/src` (excluding `*.test.ts`) and fail on a template that prepends a bare article directly to an interpolated zone name. Match the interpolation forms actually in the tree (`zoneName`, `z.name`, `zoneById(...).name`) rather than any `the ${`, which would false-positive on food and crop labels. The failure message must name the offending file and line and point at `theZone`.

**Unit — per-builder (existing spec files)**

- For each of `billCallLine`, both `term` lines, `storesFedLine`, `storesFedMemory`, `carriedMemory`, the grumble, the handover beat, `pioneerLine`, `pioneerEvent`, `settleMemory`, `settleEvent` and `providerAside`: one assertion with an article-carrying ground and one with `Pocket Cretaceous`.

**E2E — `tests/e2e/cycle-144-articles.spec.ts`**

- Boot a fresh save, drive the world far enough to post a council call and an upkeep bill (reuse the governance e2e helpers the 492/481 specs already use), then assert the full ticker text contains no `the The` and no `The Grove's stores`-style capitalised mid-sentence article.

### Risks

- **`settleMemory`'s token rule.** `frontier.ts` documents that this memory must carry no other system's token. Lowercasing an article does not add one, but the Coder must re-read that comment before editing and keep it.
- **Memory strings are re-parsed elsewhere.** BACKLOG-483 is the standing item about exactly this. Before editing `storesFedMemory`, `carriedMemory`, `settleMemory` or the barter memories, grep for modules matching against their text (`pecking.ts` and `manner.ts` are the known parsers; `PLENTY_TOKEN` matching at `WorldScene:6232` is a live example of a substring read) and update the matcher in the same commit.
- **Diff width.** This touches ~12 source files and a similar number of spec files. It is shallow — one call per site — but a missed spec assertion reads as a real failure. Run the unit suite after each module rather than at the end.
- **Cross-track:** `pioneer.ts` and `frontier.ts` are edited by both tracks. Structure first.

### Estimated touch count

~12 source files + ~10 spec files, all one-line changes. Within the arc-sized bar; no split.

---

## Shipped

Build order held: structure logic first, article wording second.

**Structure track (BACKLOG-512) — shipped as planned, with one design call made at the keyboard.**
`foundingPioneers()` walks `foundingResidents()` and takes the first roster name on each ground;
`isUnsettled` lost its third clause; `isHollowed` is its exact complement within "no heads", so an
empty ground always says *which kind* of empty it is rather than falling through to a prosperity
tier it has no business rendering. `seedFoundingPioneers()` folds the map through `recordPioneer`
and posts nothing — called from `seedFounding()` on a new game and from the load path right after
`this.pioneers = save.pioneers ?? {}`, so an old save is repaired without a field, a version bump,
or five founding announcements in its boot ticker. `unsettledNeighbor` was not touched and is
covered by a test that proves the destination pick was fixed by fixing the predicate.

**Lore track (BACKLOG-499) — shipped, one site wider than specced.** `bareZone` / `theZone` in
`zones.ts`; every builder the plan named routes through it. **`providerWordLine`
(`providerword.ts`) was added to the list** — the design enumerated the bare-name family from a
grep of the two files carrying warning comments, and this third one was doing the same dodge with
no comment to find it by. Routing it was one line, and leaving one member of the family
hand-rolled would have been exactly the shape the item exists to end.

The barter line took the `bareZone` half as planned: `the Grove–Hollow edge`, one article, two
grounds. The grep guard is in `cycle-144-articles.test.ts` and matches the interpolation forms the
tree actually uses rather than any `the ${`, with a test proving the guard would catch a
re-introduction and would not fire on `the ${labelOf(food)}`.

**Sentence-initial stayed out of scope, and the e2e proved it was the right call.** `patchedLine`
opens with the ground — "🛠️ The Grove patched up its 🗿" — where the capital is simply correct. The
spec was rewritten to assert the honest claim instead: no capital article ever appears *after a
word*, which is the failure the dodging templates used to produce.

### What the suite said

- `npm run build`: clean.
- `npx vitest run`: **2219 passed**, 3 skipped, 217 files.
- `npx playwright test`: **618 passed, 2 failed** — both pre-existing, neither in this diff:
  - `mobile-minds` long-dialog paging — the standing red (BACKLOG-430).
  - `cycle-044-sound` "a greeted dino answers in its own voice" — **verified against a stashed,
    clean HEAD at `--workers=1` and it fails there too**, with this cycle's diff removed entirely.
    Same signature as 430's re-diagnosis (fails serial, green under load); logged for the Structure
    Track rather than chased here.
- `@mlc-ai/web-llm` grep: imported only under `game/src/ai/`.

### Specs this cycle had to repair, and why each one is the item's evidence

Seven e2e specs and six unit files asserted the pre-144 world. None was loosened; each was
re-pointed at what is now true, with a comment naming the item.

- `cycle-138-billcall.spec.ts` asserted the doubled article **verbatim** — `"🗳️ the The Grove's
  council calls it"` — inside a spec about something else entirely. That line is 499's best
  evidence: the bug was not merely shipped, it was pinned.
- `cycle-119-fourth-ground` and `cycle-120-unsettled` both had to move their *founding* subject to
  the Saltpan, because emptying a ground no longer un-founds it. `cycle-120`'s first assertion has
  now flipped three times across three items and the comment records all three.
- `cycle-131-standings` asked whether a fresh park prints *any* standing; it now asks about the
  seat, which was always its subject — the pioneer rows are a real founding fact and deleting them
  through a fixture would have been the dishonest repair.
- `cycle-143-saltpan`'s Hollow case flipped from "starts reading unsettled" to "still reads
  settled", exactly as the design required. The spec was written last night to pin the defect out
  loud rather than assert around it, and it paid for itself in one cycle.
