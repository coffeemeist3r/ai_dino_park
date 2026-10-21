# Cycle 193 — Design

Milestone 33 (*Sweet on each other*), lore arc 1 + structure arc 1. Both tracks touch one new pure module
(`game/src/social/courtship.ts`), `WorldScene.ts` and `saveGame.ts`. Build the lore track's module first; the
structure track's leash reads it.

## Lore track — BACKLOG-618

**Item:** BACKLOG-618 — the first courtship (reshapes BACKLOG-027, romance + pair-bonding).

**Why this cycle:** Romance is the last unbuilt word of the Stardew line in the North Star, and the founding bond graph
already holds three mutual closest-friend pairs above 24. It costs no founding change to reach. It is also a strong
distinctness beat: what a dino courts *with* comes out of its own persona.

**What ships:**
- In an ordinary meeting (beside the gossip cascade, like `teachBeat` / `faithWordBeat`, not a rung in it), check the
  pair. Courtship needs: both grown (`stageNow` is `adult`), neither already paired, bond ≥ `COURT_BOND` (24), and the
  courter's closest friend (`closestFriend` over every live dino) is the other one.
- The **courter** is the bolder of the two (higher `bravery`; ties go to the lexicographically smaller name), as long
  as the other is its closest friend. If not, try the other way round.
- **Accept** when the courted one's closest friend is the courter too. The pair forms: ticker
  `💕 Mossback courts Glade with a fern. Glade says yes.`, a bubble on each (the courter shows its gift line, the
  courted shows `💕`), a memory each (`I courted Glade with a fern, and Glade said yes` /
  `Mossback courted me with a fern, and I said yes`), and the bond grows by `PAIR_BOND` (6).
- **Decline** when the courted one's closest friend is somebody else: ticker
  `💔 Ember courts Sunny with a warm spot in the sun. Sunny turns Ember down gently.`, memory on the courter, and
  that courter does not try again the same in-game day (`courtedDay` map, scene-local, not saved).
- The gift comes from the courter's persona, first match wins: fern/frond → `a fern`; rock/stone → `a pretty stone`;
  music/hum/song/sing → `a song`; sun → `a warm spot in the sun`; damp/water/pond/rain → `a cool drink at the pond`;
  fallback → `a long walk`.
- Book row gains a `mate` line, rendered under the faith line: `💕 sweet on Glade (since day 1)`.
- A paired dino shows `💕` as its idle glyph on one idle beat in five, on a beat that never coincides with the faith
  glyph's beat or the kept-quirk beat (offset 4; `faithBeat` is step % 5 === 2, `keptBeat` step % 4 === 0, so mood or
  other higher-priority glyphs still win in order).
- Deterministic: no `rand()` draw anywhere in the beat.
- Debug hook `__court(a, b)` runs the beat directly (like `__hearWord`) and returns `__pairs()`.

**Acceptance criteria:**
- [ ] Pure `courtship.ts` unit tests: `courtship()` returns accept for Mossback/Glade on the founding bonds, decline when the courted one's closest friend is a third dino, null under bond 24, null when either is young, null when either is already paired; `courtGift` maps each persona keyword to its gift and falls back to `a long walk`.
- [ ] e2e, as-shipped founding: `__forceConverse('Mossback','Glade')` forms the pair; the ticker carries `💕 <courter> courts <courted> with <gift>. <courted> says yes.`; both memories hold the courtship line; `__bookRows` shows `💕 sweet on Glade (since day 1)` for Mossback and the mirror for Glade.
- [ ] e2e: a second meeting between the pair adds no second ticker line and changes nothing.
- [ ] e2e: with Ember↔Sunny raised to 25 (`__setBond`) Ember courts Sunny and is turned down (`💔` ticker), no pair forms, and a second `__court('Ember','Sunny')` the same day does nothing.
- [ ] e2e: Pip (young until 14:00) cannot be courted by Bramble before the molt; after `__setClock(1,14,30)` and the molt, it can.
- [ ] No `rand()` call in the beat (code review), and `@mlc-ai/web-llm` stays under `game/src/ai/`.

**Out of scope:** jealousy / the jilted friend (next arc), break-ups, the LLM authoring the courtship line, the pair
in the egg rule, a courtship art rig.

**Constraints:** additive only. Beside the cascade, so no shipped meeting beat gets rarer. Read `closestFriend` from
`bonds.ts` (do not copy it). The book lens gets one optional field.

## Structure track — BACKLOG-620

**Item:** BACKLOG-620 — a pair keeps company.

**Why this cycle:** Without it, a pair is a line in the book. With it, the player sees two dinos staying near each other
for the rest of the session while the others mill about.

**What ships:**
- `pairs` is scene state: `Record<string, { mate: string; day: number }>`, both directions written when a pair forms.
- Saved as `pairs` (additive; absent → `{}`), validated in `saveGame.ts` (`isPairs`: every value has a string `mate`
  and a finite `day`; else the save is corrupt, matching faith's rule). Restored on load.
- On the idle wander branch, after the wander draw and after the youngster's guardian leash: an adult with a mate on
  the same ground (and the mate not migrating) is leashed with `tetherStep(cur, mateTile, next, COLS, ROWS)`.
  A youngster never has a mate (618 refuses them), so the guardian leash and the mate leash never both apply.
- Debug hook `__pairs()` returns a clone.

**Acceptance criteria:**
- [ ] Unit: `isPairs` accepts a well-formed map and rejects a non-string mate / a non-number day; a save carrying a malformed `pairs` fails validation; a save without `pairs` loads with `{}`.
- [ ] e2e: after the pair forms, `__saveNow` + reload restores `__pairs()` with both directions and the formed day.
- [ ] e2e: with the pair formed and Glade placed 8 tiles from Mossback on the bowl, stepping the world (`__stepWorld`) brings them within 3 tiles (Chebyshev) within 20 steps, and they stay within 3 tiles for the next 20 steps, as long as neither enters a higher-priority branch (sleep, service, festival). The spec pins the clock at a daytime hour with no festival or service due.
- [ ] Unpaired dinos' wander is unchanged: the full existing e2e suite stays green (no RNG stream shift).

**Out of scope:** sleeping side by side, the pair's egg, a pair crossing grounds together.

**Constraints:** additive save. The leash runs after `rand()` so the stream does not move. Keep `tetherStep` and
`TETHER_TILES` unchanged.
