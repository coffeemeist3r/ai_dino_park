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

### The two tiers

Today there is exactly one way a non-visited dino gets grove news: `spreadGroveWord` plants
`groveWordLine(speaker)` (`"<speaker> 💬 you should see the pond over in the grove"`) when it meets a
dino carrying *first-hand* grove news. That is the **direct telling** — the strong tier. 355 adds the
weak tier: **ambient hearsay**, a fainter secondhand mention that a dino who was only *told* (not
been there) passes one further hop to a listener who hasn't heard at all.

- **Strong (told to your face), pull = 2:** the dino holds a direct-telling memory — a `groveWordLine`,
  identified by the substring **`you should see the pond`** (the been-there urging). Only
  `spreadGroveWord` from a first-hand speaker plants this.
- **Weak (ambient hearsay), pull = 1:** the dino holds the grove token (`pond over in the grove`) but
  **not** the direct-telling substring — i.e. a `groveHearsayLine` (`"<speaker> 💬 heard there's a
  pond over in the grove"`), the fainter relay.
- **None, pull = 0:** visited the grove already, or lives in the grove, or carries no grove token.

### The weak relay (how ambient hearsay comes to exist)

`spreadGroveWord(store, speaker, listener)` gains a second branch, *below* its existing first-hand
branch (which is unchanged):

1. **First-hand speaker** (holds a *shareable* memory with the grove token, i.e. its own
   `groveNewsMemory`): plant `groveWordLine(speaker)` on the listener and return it. **Unchanged — 342
   behaviour is preserved exactly.**
2. **Was-told speaker** (holds the direct-telling substring `you should see the pond`, but is *not*
   first-hand) **and** the listener carries **no** grove token yet: plant the fainter
   `groveHearsayLine(speaker)` and return it. This is the one-further-hop ambient relay.
3. Otherwise return `{ store, rumor: null }` (fall through to generic gossip, as today).

Terminal by construction: a `groveHearsayLine` holder is neither first-hand (it's a rumor) nor a
direct-telling holder (the hearsay line lacks the `you should see` substring), so it can never relay
again — ambient hearsay dies after its single extra hop, exactly like every other 1-hop rumor in the
bowl. The `listener carries no grove token` guard prevents re-planting churn.

### The migration pick

`pickMigrant` (WorldScene) currently prefers the `groveCurious` pool over a uniform random. It now
grades by strength: among non-crossing candidates, prefer the **told (pull 2)** pool; if none, the
**curious (pull ≥ 1)** pool (preserves 345); if none, the old uniform random over all candidates.

### Acceptance criteria

1. **Strong tier:** a non-visited bowl dino holding a `groveWordLine` (direct telling) has
   `grovePull === 2`.
2. **Weak tier:** a non-visited bowl dino holding only a `groveHearsayLine` (and no direct telling)
   has `grovePull === 1`.
3. **No pull:** a dino that has visited the grove (`name ∈ groveVisited`), or whose home zone is the
   grove, or that holds no grove token, has `grovePull === 0` regardless of memory. `groveCurious`
   (the 345 predicate) is preserved as `grovePull(...) > 0`, so every existing 345 expectation holds.
4. **Pick order:** given a directly-told dino, an ambient-only dino, and a no-news dino as candidates,
   `pickMigrant` always returns the directly-told one; with no told dino it returns an ambient one
   over the no-news one; with neither it falls back to the old uniform random.
5. **Weak relay:** `spreadGroveWord` from a was-told (not first-hand) speaker plants a
   `groveHearsayLine` on a never-heard listener (returns that rumor); a `groveHearsayLine` holder
   relays **nothing** further (terminal); a listener that already holds any grove token is not
   re-planted (returns null).
6. **First-hand path unchanged:** `spreadGroveWord` from a first-hand speaker still plants exactly
   `groveWordLine(speaker)` (342 specs green). The hearsay line contains `GROVE_NEWS_TOKEN` (so it
   reads as grove-curious) and `RUMOR_MARK` (heard-not-witnessed) but **not** the direct-telling
   substring. No save change; `@mlc-ai/web-llm` not imported by `groveword.ts`/`curiosity.ts`.

**E2e:** drive the deterministic `__maybeMigrate` pick hook with a directly-told dino and an
ambient-only dino present; assert the directly-told dino is the one chosen to cross.

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
