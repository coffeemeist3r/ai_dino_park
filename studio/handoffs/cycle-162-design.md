# Cycle 162 — Design

Two tracks. `state.soloCycle` is false.

---

## Lore track — BACKLOG-126: Eavesdropping envy

### The beat

The keeper drops food. A dino eats it, and it is **the good dinner** — either the food it was born
loving (`r.favorite`, 025/069) or a food the keeper has *made* it love (`cameRound`, 068). Another dino
is standing close enough to see it happen, and that dino has almost no friendship with the keeper.

It files the slight: `the keeper likes <eater> more`. It wears a 🥺 for a beat and the ticker says what
it saw. And the **next time the keeper walks over and says hello**, it does not say the ordinary thing —
it says hello and then mentions the other dino.

That last sentence is the item. The backlog text (cycle 31) is explicit: *"files a faint memory that can
wistfully colour its next line."* The memory is not the payoff; the **next line** is.

### Scope decisions

**1. The favorite half, not the homecoming half.** The backlog text offers "a homecoming/favorite beat".
The homecoming half is already built and has a seam on top of it: BACKLOG-120's near-tied runner-up has
sulked at exactly that moment since cycle 31, 123 gave it an unattended exit, 125 a make-up greet, 544 a
second door in. A second slight hanging off `playHomecoming` would be a second idiom for one job. Build
the favorite half, which is un-built, which is what the Milestone 20 headline names, and which reads a
record (`palate` / `foodReaction`) the 120 seam cannot see.

**2. "The good dinner" is `favorite || cameRound`.** Not just the favorite. The cycle-161 Validator's
closing note is the design here: 068 shipped first so that 126's watcher has *two* things to be envious
of — what a dino was born loving, and what the keeper made it love. One `||` at the feeding site buys the
second one, and it makes the envy read off the milestone's whole stack rather than off its oldest layer.

**3. Envy is not a funk.** It wears no mark in the mark family, blocks nothing, clears nothing, and
competes with no other state. A dino can be envious while sulking. This matters because the funk seam
(`funks`, 123/544) is a one-at-a-time slot and putting envy in it would silently evict a sulk.

**4. It expires.** `sulk.ts` records the rule this park works by: a permanent negative state is a defect
(CHARTER). The *memory* is permanent — it is a memory, it goes in the book like every other. The
**pending wistful line** ages out on the ambient step counter. The window is deliberately longer than the
sulk's two minutes (a slight you only overheard is quieter than one aimed at you, and it must survive the
keeper wandering off), and deliberately shorter than a sitting, so a player watching a fresh save for ten
minutes sees it arrive and sees it lapse.

### Module — `game/src/world/envy.ts` (pure, Node-testable)

```
ENVY_POINTS_CEILING = 20      // 2 hearts. "only fires when its own friendship is low" (the item's words).
ENVY_WATCH_TILES    = 5       // close enough to see the hatch from where it stands.
ENVY_FADES_AFTER_STEPS = 100  // 5 min at WANDER_STEP_MS — inside a sitting, not permanent.
ENVY_GLYPH = '🥺'             // free: a grep of game/src finds no prior use.

interface Watcher { name: string; points: number; tiles: number }

enviousWitness(watchers, eaterPoints): string | null
envyMemory(eater): string           // `the keeper likes ${eater} more` — the item's literal phrase
envySawMemory(eater, label): string // `you watched the keeper give ${eater} the ${label}`
envyEventLine(watcher, eater, label): string
wistfulGreetLine(name, eater): string
envyHasFaded(stepsSince): boolean
```

`enviousWitness` filters to `tiles <= ENVY_WATCH_TILES && points <= ENVY_POINTS_CEILING && points <
eaterPoints`, then takes **fewest points**, tie-broken by **nearest**, then by **name** — the same
lexicographic last resort `topBy` uses, because there is one tie-break in this codebase and not two.
`points < eaterPoints` is not decoration: it is the sentence "the keeper likes them more" expressed as
arithmetic, and it is what stops a park favourite from being jealous of a stranger.

### Scene wiring — `WorldScene.ts`

- New field `envyPending: Record<string, { eater: string; at: number }>`, persisted **additively**
  (`envy?`), no `SAVE_VERSION` bump.
- In `eatFood`, on the tail (after `logEvent`, before the save): if `r.favorite || cameRound`, build the
  watcher rows from `this.dinos` — same zone as the eater, excluding the eater — with `tiles` from the
  Phaser distance divided by `TILE`, and `points` from `this.friendship`. On a witness: file both
  memories, `flashFeed(witness, ENVY_GLYPH)`, `logEvent(envyEventLine(...))`, set `envyPending`.
- In **both** `recordGreet` and `recordTone`: if the greeted dino has a live `envyPending` entry, show
  `wistfulGreetLine` over it and delete the entry. It does **not** change the points — envy colours what
  the dino says, it does not tax the keeper for saying hello. The repair/warm/lonely bubbles already in
  those paths win over it (a dino being actively mended has a louder thing to say), so it is checked last.
- `expireEnvy()` beside `expireMissedTraces()` in the same ambient tail.
- Dev hook `__envy()` returns the pending map, so an e2e reads the state the production path wrote.

### Acceptance criteria — lore track

1. `enviousWitness` returns the lowest-friendship eligible watcher; ties go to the nearest, then to the
   alphabetically first.
2. A watcher whose own points are **above** `ENVY_POINTS_CEILING` is never chosen.
3. A watcher whose own points are **>= the eater's** is never chosen, even if below the ceiling.
4. A watcher further than `ENVY_WATCH_TILES` is never chosen.
5. No eligible watcher yields `null`, and the feeding tail does nothing at all.
6. Eating a **favorite** fires the beat; eating a **warmed** food (068) fires it too.
7. Eating an ordinary non-favorite, non-warmed food fires **nothing** — no glyph, no ticker, no pending.
8. The witness files the `the keeper likes <eater> more` memory, readable in the book.
9. The keeper's next greet on the witness floats `wistfulGreetLine` naming the eater, and clears the
   pending entry; a **second** greet is ordinary.
10. Greeting with a **tone** (142) takes the same wistful line — one beat, both doors.
11. The greet's friendship gain is **unchanged** by a pending envy (pin the number).
12. The repair (125), warm (184) and loner (135) bubbles still win over the wistful line.
13. A pending entry older than `ENVY_FADES_AFTER_STEPS` is gone, and that dino's next greet is ordinary.
14. `envy` round-trips through the save; an old save with no `envy` key loads clean.
15. **Reachability:** in a fresh save the founding bowl holds five dinos at 0 friendship. The keeper drops
    the satchel's greens near two of them; the one that eats it gains points, the other is below the
    ceiling and below the eater — so the first favorite meal of a fresh park, with no refill, no day
    boundary and no population floor, produces a 🥺, a ticker line and a changed greeting. Prove it e2e
    end to end.

---

## Structure track — BACKLOG-551: Two marks that are not in the mark family

### The defect

Every floating mark this park hangs over a dino is built by `makeHourMark` (`WorldScene.ts:4016`), which
swaps a `Text` glyph for a baked `Image` the moment `hasPropArt(key)` answers true: `doze`, `rouse`,
`vigil`, `missed`, `missed_aloof`, `mend`, `glance`. Two are not. The need tells (371) — 🍖 and 💧 — are
`this.add.text(0, 0, '', …)` at line 3717, painted by `setText(NEED_GLYPH[need])` at 4313. There is no rig
lookup on that path, so **no rig can ever be shown there**, which is why BACKLOG-550 was seeded blocked
and why the Artist has no-op'd twice.

### The fix (it is not a new pattern)

`refreshMissedMarks` already swaps **two rigs onto one sprite** (`missed` / `missed_aloof`), chosen by a
per-dino condition. That is exactly the shape wanted: one mark per dino, two keys, chosen by
`pressingNeed`.

- `needs.ts` gains `NEED_ART_KEY: Record<NeedKind, string> = { hunger: 'need_hunger', thirst: 'need_thirst' }`
  beside `NEED_GLYPH`, so the key and the glyph are declared in one place and cannot drift.
- `needMarks` widens from `Text[]` to `Array<Text | Image>`.
- Built via `makeHourMark(NEED_ART_KEY.hunger, NEED_GLYPH.hunger)`.
- Two lazily-baked textures cached on the scene, exactly as `missedTex` / `missedAloofTex` are.
- `refreshNeedMarks` sets the texture for the pressing need when its rig exists; **falls back to
  `setText` when it does not**, so the build is green today with neither rig drawn and stays green if
  only one of the two is ever drawn.
- `worldPlacedProps()` gains both keys, with the comment the family's other five carry.

### Acceptance criteria — structure track

16. With **no** rig present, the need mark is still a `Text`, still shows 🍖/💧 by `pressingNeed`, and is
    still in-view gated and positioned at `y - TILE * 1.7` — byte-for-byte the 371 behaviour.
17. With a rig present, the mark is an `Image` carrying that need's texture.
18. Switching pressing need switches the texture (the `missed` / `missed_aloof` swap, proven).
19. With **one** rig present and the other absent, the drawn need draws and the undrawn need still reads
    its glyph — no blank mark, no crash.
20. `need_hunger` and `need_thirst` are both in `worldPlacedProps()`, and the cycle-145 reachability walk
    stays green (a key in the register with no rig is allowed; a rig with no register entry is not).
21. The `__marks` dev hook still reports the `need` family for a dino that has one.
22. No founding constant is edited — this is mark construction, and 533's entry condition must not trip.

### Reachability — structure track

The honest answer, stated as CHARTER v7 requires. **Tonight, by itself, this changes nothing a player
sees**: with no rig drawn the mark is the same `Text` showing the same glyph. That is a REWORK by the
bar's own wording — *unless the rig ships in the same cycle*, which is the bar's own remedy ("Ship the
feature *and* whatever founding-state change makes it reachable, in the same cycle").

So it does. **The Artist fires at the end of this session onto this host** and draws BACKLOG-550. The
structure track's reachability answer is the Artist's output, and the Validator must check that it landed
before approving this track. If the Artist cannot draw it, this track is not APPROVED on the grounds that
the host is nice — it takes the REWORK.
