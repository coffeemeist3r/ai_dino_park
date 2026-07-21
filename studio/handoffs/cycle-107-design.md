# Cycle 107 — Design

Milestone 6 ("No zone stands alone"), arcs 2 (lore) and 3 (structure). Goods learned to cross an edge last
cycle; this cycle the *traveller* gets a return, and the park learns who keeps its pantry full.

---

## Lore track — BACKLOG-452 (Homecoming from the road)

**Item:** BACKLOG-452 [emergent] Homecoming from the road.

**Why this cycle:** It's the only unblocked Milestone 6 lore arc (453 waits on the provider role this same
cycle ships). And it closes a hole as old as migration: since cycle 73 a crossing has been *visible* and
since 341 a dino can *belong* to a zone — but the two have never met. A migrant that walks out of the ground
it settled in and later walks back gets exactly the same treatment as a stranger arriving for the first
time: tenure reset to zero, no beat, no notice from the residents it left. Travel has had a departure for a
hundred cycles and never a return.

**What ships:**

A dino's **root** — the zone it was last *settled* in (341's `SETTLE_ROLLS` threshold) — is now recorded and
persisted. It updates only when a dino settles somewhere; wandering away never clears it.

When a visible crossing (`crossDino`) lands a dino back in its root zone:

1. **The returner resettles.** Instead of the usual tenure reset to 0, it comes home already settled — it
   belongs here, and 341's settle-resist keeps it put on the next ambient roll. This is the mechanical heart
   of the beat, not just decoration.
2. **It shows the beat.** A 🏡 bubble over the dino, a ticker line (`🏡 Rex came home to The Grove`), and a
   remembered trace (`you came back to The Grove — back where you belong`) that rides the existing memory
   store into its next greeting, like every other trace.
3. **A resident greets it.** One dino still living in that zone (the nearest, deterministic) flashes 👋,
   files `you welcomed Rex back to The Grove`, and the pair's bond warms a notch (a gentle bump, smaller
   than a shared meal). If nobody lives there, the homecoming still fires — it just goes unwitnessed, and
   that silence is a legitimate read.

A dino that has never settled anywhere has no root and fires nothing; a crossing into any zone that isn't
its root fires nothing. First-crossing behavior (339's grove arrival, 342's grove news, 447's food carry) is
untouched and still fires on its own terms.

**Acceptance criteria:**
- [ ] A dino settled in zone A (tenure ≥ `SETTLE_ROLLS`) that migrates to B and later crosses back into A shows a 🏡 bubble and a ticker line naming A.
- [ ] That returner keeps a memory naming A and reading "back where you belong".
- [ ] Immediately after the homecoming crossing the returner reads as **settled** (`__settled(name) === true`), where a non-homecoming crossing leaves it unsettled (tenure 0).
- [ ] A resident of A (any dino homed there, not the returner) flashes 👋, keeps a "welcomed <name> back" memory, and its bond with the returner is strictly higher than before the crossing.
- [ ] A crossing into a zone that is **not** the dino's root fires no 🏡 beat, no welcome, and resets tenure exactly as before.
- [ ] A dino with no recorded root (never settled) fires no homecoming on any crossing.
- [ ] A homecoming into a zone with no other resident still fires the returner's beat and does not throw.
- [ ] Roots survive a save round-trip; a save without the field loads clean (empty roots).

**Out of scope:** the returner's *greeting line* to the keeper (the memory does the work through the existing
channel); homecoming gossip; any change to how migration is chosen (that's 450); grove-specific arrival
beats (339 already owns those).

**Constraints:** The 🏡 block lives in `crossDino`, which the structure track also touches (one `+1` on the
existing 447 carry). Sequence structure first, then this — see the codeplan. Tenure semantics for every
non-homecoming path must stay byte-identical (341/334 specs pin them). Pure logic in `world/belonging.ts`
(it already owns settle/tenure/home), no new module. Save changes additive only.

---

## Structure track — BACKLOG-448 (The provider role)

**Item:** BACKLOG-448 [emergent] Provider role.

**Why this cycle:** The park has grown emergent roles since cycle 20 and made them durable in 032, but every
one reads the *social* graph — meetings, rumors carried, strongest bond. None has ever read the economy, so
the dino that actually keeps a zone fed is anonymous, and lore arc 453 ("the Fernreach eats because of
Sunny") has nothing to name. This is also the missing half of Milestone 6's own machinery: 446 gave a zone a
pantry, 444 a door, 447 a road between pantries — and not one of those knows *whose hands* did it.

**What ships:**

A per-dino **food-bank tally** — how many units of food this dino has put into a zone's store — persisted
additively, with two honest sources:

1. **The courier (447).** A crossing that actually moves a unit credits the carrier. (A no-op crossing
   credits nothing, exactly as it earns no pride.)
2. **The hauler (new).** When the keeper harvests a ripe plot and a share banks into the zone's store (446),
   the *nearest resident of that zone* is credited as the one who put it away: a 🧺 flash over it and a
   ticker line. Deterministic pick (closest by tile, ties by name). If the zone's pile is at cap nothing
   banks, so nobody is credited; if the zone has no resident, the harvest banks unattributed as today.

From that tally a role emerges: `deriveRole` gains **`provider`** (🧺), checked first — an economic standing
outranks the social reads, since keeping a zone fed is the most distinctive thing a dino can be doing. It
settles durably through the existing 032 `settleRole`, so a provider stays a provider when the tally goes
quiet, and it surfaces everywhere roles already do: the roles lens, the collection book, LUMEN-3's scan.

**Acceptance criteria:**
- [ ] `deriveRole` returns `provider` at ≥ `PROVIDER_BANKS` (3) food banks, ahead of gossip / homebody / socialite for the same stats.
- [ ] `ROLE_ICON.provider` exists and the roles lens renders the tag over a provider dino.
- [ ] A crossing that moves a food unit increments the carrier's tally by exactly 1 (`__foodBanked()`); a crossing that moves nothing leaves it unchanged.
- [ ] Harvesting a ripe plot with a resident dino in that zone increments that dino's tally by 1 and posts a 🧺 ticker line naming it.
- [ ] Harvesting into a zone whose pile is already at `FOOD_STOCKPILE_CAP` for that crop credits nobody.
- [ ] After 3 credited banks, `__roles()[name] === 'provider'` and the collection book row for it reads `[provider]`.
- [ ] A settled provider whose tally stops growing keeps the role (durability via `settleRole`).
- [ ] The tally survives a save round-trip; a save without the field loads clean (empty tally, no crash).
- [ ] The four existing roles are unchanged for stats with no food banks (regression: the cycle-060 role specs stay green).

**Out of scope:** the provider's *voice* — gossip and greeting lines naming the provider are lore arc 453,
next cycle. No per-zone "this zone's provider" ranking yet (the role is per dino, park-wide). No new banking
source beyond the two above (dinos foraging food into the pantry is its own arc). No change to the feeding
loop — a dino reaching a food drop still eats it.

**Constraints:** `BehaviorStats.foodBanked` must be **optional** so existing `deriveRole` call sites and unit
tests compile unchanged. Role values persist as plain strings in the save (no roles import in `saveGame.ts`)
— keep it that way. `crossDino` is shared with the lore track: this track's `+1` goes inside the existing
447 carry block, before the lore track's homecoming block. Nothing under `game/src/world` or `game/src/ai`
may import `@mlc-ai/web-llm` (only `game/src/ai/brain*` may, per CHARTER — `roles.ts` stays pure).
