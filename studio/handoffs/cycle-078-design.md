# Cycle 78 — Design

Two independent tracks. Per CHARTER v5 the Validator judges each separately.

---

## Lore track — BACKLOG-355 Drew them across

**One-liner:** A non-visited bowl dino *directly told* about the pond by a been-there dino feels a
**stronger** pull toward the grove than one that only *overheard* the news secondhand. The migration
pick prefers the directly-told.

**Why now:** 342 made grove news travel; 345 made that news pull a non-visited dino across; 346 made
two travelers common ground. Today the pull is binary — `groveCurious` is a single boolean, any
non-visited bowl dino holding the grove token is equally likely to be picked. 355 grades the pull by
*how you heard*, so the bowl dino a returning explorer told **to its face** is the one curiosity drags
across next, ahead of one that merely caught the rumor going around. Distinctness through provenance.

### The two tiers — graded by *how fresh* the telling is (recency, not a new channel)

**Planning correction (found while grounding in the tests):** the obvious "add a faint secondhand
relay" approach is **rejected** — `groveword.test.ts` (cycle 75) pins grove news to **exactly 1 hop**
(`RUMOR_MARK`), and 345 builds on that. Adding a 2nd-hop hearsay line would break that contract and
change grove-news propagation. So 355 keeps `groveword.ts` **untouched** and grades the pull off
something already present: **how recently the dino was told.**

Memory is a 6-entry ring (`ai/memory.ts`, `recall` returns oldest→newest). A non-visited bowl dino's
*only* carrier of the grove token is the `groveWordLine` a returning explorer planted on it — i.e. a
direct telling. The pull grades by where that telling now sits in the ring:

- **Strong (just told to your face), pull = 2:** the grove token appears among the dino's most-recent
  `GROVE_TELL_RECENT = 3` memories — the telling is fresh and foremost.
- **Weak (gone to ambient background), pull = 1:** the dino still carries the grove token, but only in
  the *older* part of its ring (≥3 newer memories have since pushed it back) — the news has faded from
  a fresh telling into mere background awareness.
- **None, pull = 0:** visited the grove already, or lives in the grove, or the telling has aged out of
  the ring entirely (it forgot) / never carried the token.

This is genuinely emergent and self-clearing: a dino told about the pond is keen *right then*, the
keenness fades as life piles up newer memories, and eventually it forgets — so "drew them across"
means the freshly-told get dragged over before that keenness cools.

### The migration pick

`pickMigrant` (WorldScene) currently prefers the `groveCurious` pool over a uniform random. It now
grades by strength: among non-crossing candidates, prefer the **told (pull 2)** pool; if none, the
**curious (pull ≥ 1)** pool (preserves 345); if none, the old uniform random over all candidates.

### Acceptance criteria

1. **Strong tier:** a non-visited bowl dino whose grove telling (`groveWordLine`) sits among its
   most-recent `GROVE_TELL_RECENT (=3)` memories has `grovePull === 2`.
2. **Weak tier:** a non-visited bowl dino that carries the grove token only in the *older* part of its
   ring (≥3 newer memories after it) has `grovePull === 1`.
3. **No pull:** a dino that has visited the grove (`name ∈ groveVisited`), or whose home zone is the
   grove, or that holds no grove token at all, has `grovePull === 0` regardless of memory.
   `groveCurious` (the 345 predicate) is preserved as `grovePull(...) > 0`, so every existing 345
   expectation (including a single-entry `[groveWordLine('Rex')]` → curious) holds unchanged.
4. **Pick order:** given a freshly-told dino (pull 2), an ambient-only dino (pull 1), and a no-news
   dino as candidates, `pickMigrant` always returns the freshly-told one; with no pull-2 dino it
   returns a pull-1 dino over the no-news one; with neither it falls back to the old uniform random.
5. **groveword.ts untouched:** grove news stays exactly 1 hop — the cycle-75 `groveword.test.ts`
   ("a heard grove rumor is not re-shared") stays green; no hearsay line, no 2nd-hop relay added.
6. No save change (the pull is derived from existing memory + `groveVisited`, nothing persisted new);
   `@mlc-ai/web-llm` not imported by `curiosity.ts`; build + full suite green.

**E2e:** drive the deterministic `__maybeMigrate` pick hook with a freshly-told dino and an
ambient-only dino present; assert the freshly-told dino is the one chosen to cross.

---

## Structure track — BACKLOG-348 Zone resource bias

**One-liner:** Each zone leans its resource roll toward its own character — the grove drops 🪵
branches, the bowl turns up 🪨 stones — instead of both rolling a uniform 50/50. A *lean*, not a lock.

**Why now:** carry-between-zones (329) and per-zone piles (328) exist, but both zones gather the same
uniform mix (314), so there's nothing for carry to balance and nothing for the two stockpiles to
differ on. Biasing the spawn is the precondition that makes the trade route — and 356/357/358 — mean
something.

### Design

`pickKind` gains an optional zone argument and a per-zone bias:

```
ZONE_BIAS: Record<string, ResourceKind> = { [BOWL_ID]: 'stone', [GROVE_ID]: 'branch' }
BIAS_WEIGHT = 0.75   // chance the favored kind rolls in its biased zone (vs 0.5 uniform)

pickKind(rand = Math.random, zone?): ResourceKind
  favored = zone ? ZONE_BIAS[zone] : undefined
  if !favored: return rand() < 0.5 ? 'branch' : 'stone'        // unchanged uniform path
  return rand() < BIAS_WEIGHT ? favored : otherKind(favored)   // a lean, not a lock
```

`maybeSpawnResource` already iterates the occupied zones and calls `pickKind()` per zone — it now
passes the spawning `zone`. `BOWL_ID`/`GROVE_ID` import from `world/zones.ts` (no cycle: zones.ts does
not import resource.ts). An unknown/unbiased zone keeps the uniform 50/50, so any caller that omits the
arg (existing 146/314 specs) is byte-identical.

### Acceptance criteria

1. **Grove leans branch:** `pickKind(rand, GROVE_ID)` returns `branch` when `rand() < 0.75` and
   `stone` when `rand() ≥ 0.75` — i.e. ~75% branch.
2. **Bowl leans stone:** `pickKind(rand, BOWL_ID)` returns `stone` when `rand() < 0.75` and `branch`
   when `rand() ≥ 0.75` — symmetric.
3. **Off-kind still appears:** with `rand` forced ≥ BIAS_WEIGHT, the biased zone yields the *other*
   kind — a lean, not a single-resource lock.
4. **Back-compat:** `pickKind()` and `pickKind(rand)` with no zone (or an unknown zone id) stay 50/50;
   existing resource specs (146/314/328/329) remain green with no change.
5. **Wired:** `maybeSpawnResource` passes the spawning zone to `pickKind`, so over many rolls the grove
   accumulates more branches and the bowl more stones (observable via the `__spawnResource` /
   `__resource` hooks driven per zone, or a seeded-rand distribution check).
6. No save change (the kind is a property of the transient spawn, already round-tripped per zone);
   `@mlc-ai/web-llm` not imported by `resource.ts`; build + full suite green.

**E2e:** force a spawn in the grove and one in the bowl under a seeded/low `rand` and assert the grove
spawns a branch and the bowl a stone (the biased kind), confirming the wiring end-to-end.

---

**Track independence:** 355 touches `world/groveword.ts`, `world/curiosity.ts`, and `WorldScene.pickMigrant`;
348 touches `world/resource.ts` and `WorldScene.maybeSpawnResource`. Disjoint modules and disjoint
WorldScene methods — no merge hazard between the tracks.
