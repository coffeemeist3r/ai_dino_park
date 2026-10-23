# Cycle 194 — Design

Milestone 33 (*Sweet on each other*), lore arc 2 + structure arc 2. Both tracks extend `game/src/social/courtship.ts`
and its scene glue in `WorldScene.ts`. The structure track also widens `breeding.ts` (`shouldLay`) and `isPairs`.

## Lore track — BACKLOG-621

**Item:** BACKLOG-621 — the jilted friend.

**Why this cycle:** the milestone's next lore arc, and the half of romance a park of distinct minds is most itself in:
the same news lands on two dinos and they take it two ways.

**What ships:**
- At the moment a pair forms (the accept branch of `courtBeat`), every live dino X that is not in the new pair and is
  not itself paired, whose `closestFriend` over every live dino at floor `JILT_FLOOR` (10) is one of the two, is
  **jilted**: its `friend` is the one it loved, its `rival` is that one's new mate.
- Its temper decides the rest. `agreeableness ≥ 0.5` → **glad**; else **jealous**. No dice.
- **Glad:** bubble `🥲 Good for you, Sunny.`; memory `Sunny paired off with Rex. I'm glad for them`; ticker
  `🥲 Ember is glad for Sunny and Rex`.
- **Jealous:** a `jilted` funk (😒 idle glyph; runs the sulk's window, then shakes off with
  `✨ Murk got over the pairing on its own`); its grudge on the rival is raised to `RIVAL_BAR` (the book's rival line
  then names it); bubble `😒 Mossback took Glade.`; memory `Glade paired off with Mossback. Mossback took my friend`;
  ticker `😒 Murk watches Glade pair off with Mossback, and sulks`.
- A decline (💔) jilts nobody.

**Acceptance criteria:**
1. Unit: `jilted` returns Ember (glad, friend Sunny, rival Rex) for a Rex+Sunny pair on founding bonds; Thornback
   (glad) and Murk (jealous, rival Mossback) for Mossback+Glade; skips paired dinos, the pair itself, and dinos whose
   closest friend sits below 10.
2. e2e: `__court('Rex','Sunny')` on the as-shipped founding writes the glad ticker line for Ember and its memory.
3. e2e: `__court('Mossback','Glade')` makes Murk jealous: ticker line, memory, Murk in a funk, and Murk's book rival
   line names Mossback; Thornback's glad line is on the ticker.
4. No `rand()` in the new code.

## Structure track — BACKLOG-622

**Item:** BACKLOG-622 — a pair keeps a nest.

**What ships:**
- When a pair forms, it gets a nest: `{ zone, tileX, tileY }` = the courted dino's ground and tile at that moment, stored
  as an optional `nest` on **both** mates' `pairs` entries (additive; `isPairs` accepts entries with no nest and
  rejects a malformed one).
- The nest is drawn on its ground: the `nest` prop rig if one exists (`hasPropArt`), `🪺` text otherwise, depth under
  the dinos, shown only while the player is on that ground (the same zone visibility every landmark uses).
- **Sleeping at the nest:** on the wander step, a **resting** paired dino whose nest is on the ground it stands on
  walks to its berth and lies there instead of going to the den or holding its tile. Berths are side by side: the
  alphabetically first mate's berth is the nest tile, the other's is the tile to its right (left at the east edge). It
  shows the huddle glyph (💤) while there or on its way. Resting branches draw no `rand()`.
- **The pair's egg:** on a clear night, when both mates are resting and standing on their berths, and the pair has no
  egg waiting and the park is under `MAX_POPULATION`, the pair lays its egg **at the nest tile**. No bond bar for a
  pair: `shouldLay` gains a `paired` flag that stands in for `bond >= EGG_BOND_THRESHOLD`.
- Reload restores the nests and draws them.

**Acceptance criteria:**
5. Unit: `isPairs` accepts a nest-less entry and a good nest, rejects a nest with a non-number tile; `shouldLay`
   lays for `paired` at bond 0 and still refuses an unpaired pair below 60; `berthOf` gives side-by-side tiles.
6. e2e: after `__court('Mossback','Glade')`, both entries carry the same nest on the bowl and `__nests()` reports one
   drawn nest.
7. e2e: at a resting hour (e.g. 23:00), both mates walk to their two berths within 20 steps.
8. e2e: on that night, at their berths, the pair lays an egg at the nest tile with bond well under 60.
9. e2e: the nest survives a reload.
10. Reachability: a fresh park, only stepped, forms Rex+Sunny with a nest, and Rex (an owl, resting until 13:00) is
    at its berth within the first minutes (QA probe, not committed).
