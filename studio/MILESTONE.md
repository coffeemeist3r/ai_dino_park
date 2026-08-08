# Milestone

> One player-visible headline goal spanning ~5 cycles. Cycles serve this file:
> the smiths pick BACKLOG items that advance the checklist first. The Validator
> marks arcs `[x]` as their items ship and declares the milestone SHIPPED when
> the checklist closes (big chronicle entry). Then the smiths draft the next one
> here — Lore-smith writes the headline + feel arcs, Structure-smith the spine arcs.

## Current milestone

**Milestone 12: A park that branches, and a cast that doesn't blur**
**Status:** ACTIVE (opened cycle 125)

Eleven milestones built a *line*. Every ground in this park has at most one east neighbour, so the
"adjacency graph" (383) has only ever been walked as a list — `zoneChain` derives the drawing order by
following east links from the westmost zone, and 475's `hopDistances` runs a general breadth-first search
over data that has never once branched. M10's finding was that the code generalizes and the assertions
don't; M11 built a whole distance layer on top of a graph with no forks in it. Milestone 12 puts a fork in
it, gives a ground more than one voice on its own calls, and makes what's been built cost something to keep.

The lore half answers a different blur. The cast has accumulated tallies for eleven milestones — yields,
gobbles, stands, tics, crossings — and a dino is still easiest to tell apart by its name. These three arcs
are about a dino being *somebody in particular*: the one with nobody who leans on you instead, the one whose
private ritual leaves a mark another can stumble on, and the manner at the hatch that finally reads as one
character note instead of four counters.

**Lore arcs:**
- [ ] The one with nobody leans on you — a loner with no dino-friends but high keeper-friendship drifts to the glass toward *you* rather than a random edge, so loneliness becomes a bid for the keeper's attention (BACKLOG-370)
- [ ] Traces of your pacing — a dino that arrives where another was lately ticcing files a faint "someone was pacing here", so a private ritual leaves a mark a friend can stumble on (BACKLOG-424)
- [ ] The manner at the hatch — the collection book folds each dino's feeding tallies into one legible table-manner note (generous / greedy / unbowed / timid) instead of three separate counters (BACKLOG-402)

**Structure arcs:**
- [ ] A suite you can trust before you load it further — the parallel-load e2e seam: a dev hold for a zone's ambient spawn/gather/meeting for the length of a driven crossing, a deterministic homesick pick, and a settle helper for the reload race, with the four catalogued specs moved onto it (BACKLOG-456)
- [ ] The chain forks — a fifth ground hanging off the *middle* of the chain, so a zone genuinely has two onward neighbours and every general read (the hop table, nearest-qualifying, the lens row, the demand read, migration destination) is finally exercised against a graph rather than a line (BACKLOG-478)
- [ ] More than one voice on the call — a derived per-zone council (the top few food-bankers, not only the single top banker) as a persistent standing beside `provider`, the seam a vote (031) plugs into later (BACKLOG-479)
- [ ] A landmark that has to be kept up — a standing structure draws a small upkeep from its zone's pile and falls into reversible disrepair when the ground can't pay, so the one economy with no running cost gets one (BACKLOG-480)

---

### Format (use this when drafting)

```markdown
**Milestone N: <player-visible headline>**
**Status:** ACTIVE (opened cycle NNN)

**Lore arcs:**
- [ ] <arc — one sentence of observable behavior> (BACKLOG-NNN, -NNN)
- [ ] <arc> (BACKLOG-NNN)

**Structure arcs:**
- [ ] <arc> (BACKLOG-NNN)
- [ ] <arc> (BACKLOG-NNN)
```

## Shipped milestones

### Milestone 11: A park you have to cross — SHIPPED cycle 124 (opened cycle 122)

Milestone 10 grew the chain to four grounds and found that the code generalized while the assertions didn't.
It left a sharper finding in its own closing item: **every cross-zone read in this park was one hop deep.**
The ferry carried to *a* neighbour, the demand read pointed at *a* neighbour, migration walked to the richest
*neighbour* — and the two pulls M10 built last, word of plenty (458) and a ground you miss (362), silently
*dropped* whatever a dino wanted when it wasn't next door. At three grounds "neighbour" and "the park" were
the same set, so nothing was wrong. At four they weren't, and the far end of the chain was a place no desire
could reach.

Milestone 11 gave the chain **distance**, and then spent four cycles discovering what distance makes possible.
475 derived a hop table off the adjacency graph — no second table to fall out of sync — and turned a pull
toward a far ground into a *step toward it*, one ground per roll, so crossing the park became the existing
per-roll decision applied again. Its finding was not in either pure module: both were correct, and the defect
sat downstream, where the ticker and the memory ring read the *next hop* and would have had a dino announce
it missed the Grove while it was walking to the Hollow. Splitting every pull into a **target** (what it wants,
which every word reads) and a **dest** (where it steps, which every move reads) is the shape the rest of the
milestone inherited.

Then the consequences arrived in order, each item standing on the one shipped the night before. A dino comes
back **still full of the ground it left** (347), keyed on whichever ground that was rather than on the grove,
with the keepsake glance deliberately floated a roll *after* arrival because four beats already contend at the
crossing instant. **What a life of crossings adds up to** became legible (361) — and needed two dimensions,
because on a crossing count alone a dino pacing between two adjacent grounds outranks one that walked the
whole chain; reach was only measurable at all because 475 shipped the hop table first. A ground learned it
could be **too full** (476), the first brake in a set of five accelerative systems and the first thing in the
park's life to protect the ground being *filled* rather than the one being emptied — calibrated so the park
boots *at* capacity and the whole system is inert on a fresh save, with the suite standing perfectly still as
the evidence. And on the last night, **two dinos went somewhere together** (360): the first crossing in the
project's life to move two bodies, off a shared-place bond the park had been quietly recording since cycle 76
and had never once read.

The structure track closed by cleaning up after itself. 477 folded the two governance calls off the end of an
accreting prosperity line into one table-driven row with a legend the `[?]` panel generates from the same
data — the third call, when it comes, is a row and not a redesign. Its finding is the milestone in miniature:
the obvious placeholder character was already being drawn in the same box by an earlier feature, visible only
because a spec bothered to assert that a fresh park shows *nothing*.

Minds (M1) → home ground (M2) → feeds them (M3) → stakes (M4) → provides for its own (M5) → no zone stands
alone (M6) → plenty and want have weight (M7) → a year you feel (M8) → a ground that decides (M9) → a chain
that can grow (M10) → **a park with distance in it, that a dino can cross on purpose and not cross alone**
(M11). Deathless by design; mortality stays an operator call.

**Lore arcs:**
- [x] Still full of the place it left — a dino freshly back from another ground carries it a while: a wistful keepsake bubble aimed the way it came and a memory that colours its next greeting, keyed on *whichever* ground it came from (BACKLOG-347 — cycle 122)
- [x] Homebody or wanderer — how far and how often each dino has actually walked the chain becomes a legible standing in the collection book, so the cast splits into those who cross and those who never do (BACKLOG-361 — cycle 123)
- [x] Two who go together — two dinos who bonded over a shared place later cross to it *together*, so shared travel joins shared talk (BACKLOG-360 — cycle 124; **milestone SHIPPED**)

**Structure arcs:**
- [x] Distance on the chain — a derived hop-distance table off the adjacency graph; a pull toward a ground that isn't adjacent becomes a *step toward it* instead of being silently dropped, and the demand read prefers the nearest qualifying ground (BACKLOG-475 — cycle 122)
- [x] What a ground can hold — a derived carrying capacity per zone; crowding past it damps that ground's appeal and lifts its residents' leave-lean, so the chain settles into a distribution instead of a stampede (BACKLOG-476 — cycle 123)
- [x] Both of the ground's calls, on the lens — the spend and work priorities folded into one compact per-zone governance line with a legend, so a third call later is a row and not a redesign (BACKLOG-477 — cycle 124; **structure track closed**)

### Milestone 10: A fourth ground, and the first feet on it — SHIPPED cycle 121 (opened cycle 119)

For nine milestones this park was three zones long. Every system built since — prosperity (428), harvest (433),
demand (438), the pantry (446), the ferry (447), the provider (448), migration (450), decline (460), governance
(463/467/468) — was written to generalize, and 449 folded the last hand-written per-zone terrain into one
`ZONE_TERRAIN` table with an explicit promise in its own header: *a fourth zone is a row, not three branches*.
Nothing had ever cashed that cheque, and three was too small a number to tell a genuinely general system from a
merely tidy one. Milestone 10 cashed it, and the answer was: **the code generalized, the assertions didn't.**
The Hollow joined the chain as a row of data and met nine cross-zone systems untouched (472) — while nine *test*
files, and later four more, had to be amended because they had hard-coded "the chain is three long". That
asymmetry, visible only because someone finally added the row, is the milestone's real finding.

The rest made the arrival something the cast *lives* rather than a config change. The first dino ever to set
foot on a ground is remembered as its pioneer, forever, one-per-ground (343). A fresh ground opens with nobody
on it and no provider, and fills by migration alone — which needed a **frontier tier** in the destination pick,
not a weight, because an unsettled ground is the poorest place in the park by construction and the appeal read
could never have sent anyone there (474). A dino that has stood somewhere its friend hasn't shows it the way and
**keeps the telling** — the first beat in seventy cycles of news systems to mark the *speaker* rather than the
listener (364). And on the last night, the first migration **pull** the park has ever had: a ground you stood on
and have been away from too long starts calling you back, so a place can be missed and not merely visited (362).

Minds (M1) → home ground (M2) → feeds them (M3) → stakes (M4) → provides for its own (M5) → no zone stands alone
(M6) → plenty and want have weight (M7) → a year you feel (M8) → a ground that decides (M9) → **a chain that can
grow, and a new ground the cast discovers for itself** (M10). Deathless by design; mortality stays an operator call.

**Lore arcs:**
- [x] First across — the first dino ever to set foot in a given zone is remembered as its pioneer, a founding standing surfaced in the collection book (BACKLOG-343 — cycle 119)
- [x] The one who knew first — a dino that has seen a ground and tells a never-been dino about it keeps a small teacher's-pride memory, so being the one who knew first becomes part of who it is (BACKLOG-364 — cycle 120)
- [x] A ground you come to miss — a dino long back from a ground files a faint yearning that re-primes it to return, so a place can be missed and not merely visited (BACKLOG-362 — cycle 121; **milestone SHIPPED**)

**Structure arcs:**
- [x] The fourth ground — a fourth zone joins the chain as a `ZONES` row + terrain descriptor + adjacency link + its own crop and waterhole + its box on the lens, and every generalized system meets it untouched (BACKLOG-472 — cycle 119)
- [x] The unsettled ground — a fresh zone opens with no residents and no provider, filling by migration alone; the first to settle founds it (BACKLOG-474 — cycle 120; **structure track closed**)

### Milestone 9: A ground that speaks for itself — SHIPPED cycle 118 (opened cycle 116)

Milestone 8 closed the seasons and, on its last night, cracked a door the CHARTER's
resources→crafting→building→**governance** arc had been circling since Milestone 5: with BACKLOG-463 a
zone's provider set a **spend priority** (feed-the-hungry-first vs. bank-toward-a-granary) — the park's
first governance beat. But it shipped *invisible*: a policy read by two hooks, set silently, that no dino
ever mentioned and the player could never see. Milestone 9 makes that governance **legible, transferable,
and lived**. The player learns to *see* each ground's policy on the zone-map lens (468). The say **changes
hands** as a visible beat — when one dino out-banks the incumbent provider (448) the incoming one re-sets
the table from its own temperament and the handover is logged, so *who holds the say, and the moment it
turns over,* stops being silent (467). And the cast **lives** the policy: a hungry dino voices how its
ground has chosen to feed it — grateful to be fed first, or grumbling it goes short while the walls rise
(469) — the word of *how the ground decides* travels the bowl the way word of *who* keeps it fed already
does (470), and a ground that banks its mouths short long enough surfaces a quiet discontent to the keeper
(471). Minds (M1) → home ground (M2) → feeds them (M3) → stakes (M4) → provides for its own (M5) → no zone
stands alone (M6) → plenty and want have weight (M7) → a year you feel (M8) → **a ground that decides how
it spends, and speaks for itself** (M9). Not a vote — 031 stays deferred; one policy, made public. Deathless
by design; mortality stays an operator call.

**Lore arcs:**
- [x] Fed first, or left short — a hungry dino voices its ground's spend policy: a feed-first ground's mouth is grateful it's fed before the walls go up, a bank-first ground's mouth grumbles it goes short while the granary rises, temperament-shaded, silent when content (BACKLOG-469 — cycle 116)
- [x] Word of how the ground decides — the spend policy travels the gossip/greeting spine the way word of the provider (453) does ("the Grove feeds its own first"), so *how* a ground has chosen to spend is something the bowl passes around (BACKLOG-470 — cycle 117)
- [x] The grumble reaches the keeper — a bank-first ground that has left its mouths short long enough surfaces a faint discontent ticker to the keeper ("the Grove's going hungry while the granary fills"), governance discontent made a care signal (BACKLOG-471 — cycle 118; **milestone SHIPPED**)

**Structure arcs:**
- [x] The say changes hands — when a zone's provider role passes to a new dino (448), the incoming provider re-sets the spend priority (463) from its own temperament and the handover lands a one-off logged governance beat (BACKLOG-467 — cycle 116)
- [x] The provider's read on the lens — surface each zone's spend priority on the zone-map lens beside the prosperity tier (🍽️ feeds-first / 🏦 banks-toward-plenty) so the player can see how each ground has chosen to spend (BACKLOG-468 — cycle 117; **structure track closed**)

### Milestone 8: The seasons bite — SHIPPED cycle 115 (opened cycle 113)

For 159 cycles the turning year was only a colour wash and a winter huddle-pull: the pantry filled and
spoiled at the same rate in every season, and no dino ever said a word about the weather. Milestone 7 gave
the economy consequence; Milestone 8 gives the **calendar** consequence over that economy — and gives the
cast the year in its own mouth. The lean season learns to tighten how much a ground can hold and to quicken
spoilage while the plenty seasons ease both (461), so *when* it is finally shapes how much you can bank. A
hoard banked and left through a long absence catches up on the same decay instead of surviving untouched,
surfaced in the "while you were away" digest (462). And the cast lives the year out loud: a dino grumbles
through winter and savours spring in its own voice (173), the cold pulls the herd tighter while summer lets
it spread (178), and a dino that toughed out the cold gets its spring-thaw relief when the year turns kind
again (215). Minds (M1) → home ground (M2) → feeds them (M3) → stakes (M4) → provides for its own (M5) →
no longer stands alone (M6) → plenty and want have weight (M7) → **a year whose seasons you feel in the
stores and hear in the voices** (M8). Deathless by design; mortality stays an operator call.

**Lore arcs:**
- [x] Season in the voice — a dino lets the current season colour its greeting (grumbles through winter, savours spring), temperament-shaded, with a deterministic fallback line per season (BACKLOG-173 — cycle 113)
- [x] Migrating warmth — winter raises the cluster-drift bias (the den fills earlier) while summer lowers it (they spread out and laze), so the bowl's social density breathes with the year (BACKLOG-178 — cycle 114)
- [x] Spring thaw relief — when the year turns *out* of winter, a dino that toughed out cold nights gets a one-off "made it through the winter" lift + a relieved 🌱 line (BACKLOG-215 — cycle 115)

**Structure arcs:**
- [x] The lean season — one pure park-wide seasonal food modifier the harvest-banking and spoilage hooks read: the lean season tightens banking and quickens spoilage, plenty eases both (BACKLOG-461 — cycle 113)
- [x] Spoilage while you're away — fold spoilage into the away catch-up so a hoard left through a long absence bleeds toward its floor the way a watched one does, surfaced in the digest (BACKLOG-462 — cycle 114)

### Milestone 7: The economy has weight — SHIPPED cycle 112 (opened cycle 109)

Milestone 6 gave the three-zone chain *reach* — food and mouths crossing the edges — but the economy it
built had no *friction*: banked food was immortal (a glut froze forever and two full zones deadlocked the
ferry), a zone's structures raised a prosperity number and nothing else (building and the pantry never
touched), and a mouth that left a poor ground for a rich one did it silently, off a bias that re-levelled
every roll so no exodus ever gathered. Milestone 7 gave plenty and want *consequence and voice*. The
economy learned to **cost**: a hoard sitting at or near its zone's cap now bleeds a unit per in-game day
down to a self-limiting floor (455), so plenty you don't move stops being free and the flows can't
stagnate. It learned to **grow**: a zone that has raised enough landmarks puts up a granary, and a
standing granary lifts that zone's food cap (454) — the first time in the project's life the build arc
(146→417) and the food economy (446→447) touched. And migration stopped being a silent coin-flip: a dino
that left a dry ground for a richer one keeps and *speaks* the reason it went (457), plenty travels by
gossip before a body follows it (458), the ground a migrant arrives at answers back with a wry welcome
(459) — and the ground it *left* now reads its own hollowing (460): a zone below its population peak shows
a ⬇, its remaining residents lean harder to leave so the exodus gains momentum, capped by a floor that
lets a zone thin to one but never vanish. The dino that floor keeps behind feels the quiet and says so
(464). Minds (M1) → a home ground (M2) → a ground that feeds them (M3) → stakes in the eating (M4) → a
ground that provides for its own (M5) → a ground that no longer stands alone (M6) → **a ground whose
plenty and want have weight you can feel** (M7). Deathless by design; mortality stays an operator call.

**Lore arcs:**
- [x] Left for greener ground — a dino whose migration carried it toward a richer neighbour keeps a "the pantry ran dry, so I went where the food is" memory naming the ground it left, shows a departure beat, and greets a beat later with it (BACKLOG-457 — cycle 109)
- [x] Word of plenty — a dino that hears a neighbour zone is thriving is primed to migrate there, so plenty travels by gossip before a body follows (BACKLOG-458 — cycle 110)
- [x] Come for the plenty — a scarcity migrant arriving in a richer zone is met with a wry welcome and a small bond (BACKLOG-459 — cycle 111)
- [x] Last one standing — the dino the 460 floor keeps behind in a hollowed zone sounds a wistful "gone quiet around here" beat + a memory of the emptiness (BACKLOG-464 — cycle 112, the close-out companion to 460)

**Structure arcs:**
- [x] The granary — a zone that has raised enough landmarks puts up a granary, and a standing granary lifts that zone's food cap, so building finally feeds the food economy (BACKLOG-454 — cycle 110)
- [x] A pantry that spoils — banked food at/near cap slowly decays across in-game days, so a hoard costs something and the flows stay live (BACKLOG-455 — cycle 111)
- [x] The draining zone — a zone hollowed by scarcity migration reads as declining (⬇) and its remaining residents lean harder to leave, giving an exodus momentum, floored so a zone thins but never vanishes (BACKLOG-460 — cycle 112)

### Milestone 6: No zone stands alone — SHIPPED cycle 109 (opened cycle 106)

Milestone 5 taught a zone to store and spend for *its own*; Milestone 6 turned three parallel pantries into
one economy that reaches across the edges. Banked food learned to *travel* — a crossing dino now ferries a
unit from a glutted zone toward a lighter neighbour (447), the demand read (438) finally given a mover, and
the carrier feels the pride of it (451). The map generalized so the three hand-written per-zone terrains
became one `ZONE_TERRAIN` table, a fourth zone now a row and not three code branches (449), with the old
"kept in sync" landmark comments replaced by a CI invariant. The park grew its first *economic* standing —
the dino that banks the most harvest emerges as its zone's `provider` (448) — and then learned to *say* it:
a resident names who keeps its ground fed, in gossip and greeting, temperament-shaded but factually the same
in every voice (453). A migrant walking back into ground it once settled resettles on the spot and is
welcomed home (452). And the last piece, the one that makes the chain feel like a single living economy
rather than three that merely trade: **mouths now move toward plenty** — a scarcity-driven migrant heads for
the richest neighbour and empties the poorest zone first, off the same prosperity index and food store the
milestone spent five cycles building (450). Minds (M1) → a home ground (M2) → a ground that feeds them (M3) →
stakes in the eating (M4) → a ground that provides for its own (M5) → **a ground that no longer stands alone**
(M6). Deathless by design; mortality stays an operator call.

**Lore arcs:**
- [x] The courier's pride — a dino that ferries banked food across a zone edge to a hungrier neighbour keeps a "carried food to <zone>" memory and greets the keeper a beat prouder for it (BACKLOG-451 — cycle 106)
- [x] Homecoming from the road — a dino that migrated away and later returns to its home zone resettles ("back where it belongs") and the residents it left greet its return (BACKLOG-452 — cycle 107)
- [x] Word of the provider — once a provider role emerges (448), a dino names it in gossip/greeting ("the Fernreach eats because of Sunny"); the pantry-keeper's standing surfaces in voice (BACKLOG-453 — cycle 108)

**Structure arcs:**
- [x] Food flows between zones — a crossing dino ferries banked food from a glutted zone toward a lighter neighbour, making the demand read (438) an actual mover (BACKLOG-447 — cycle 106)
- [x] The provider role — the dino that banks the most harvest into its zone's store emerges with a persistent `provider` role tag (BACKLOG-448 — cycle 107)
- [x] One terrain per zone, as data — fold each zone's ground into a per-zone terrain descriptor on the ZONES table; a fourth zone becomes a row, not three branches (BACKLOG-449 — cycle 108)
- [x] Scarcity moves the herd — the migration decision biases by prosperity index + food store, so mouths move toward plenty and want empties the poorest zone first (BACKLOG-450 — cycle 109)

### Milestone 5: No one goes hungry — SHIPPED cycle 105 (opened cycle 103)

The hunt got stakes in Milestone 4; Milestone 5 made the bowl's *plenty* reach the mouths that need it.
A harvest used to drop, be eaten, and be gone — nothing banked, so a zone rich in crops could not feed a
starving neighbour, thirst slaked at exactly one puddle in a three-zone chain, and a dino withdrawn at the
wall simply missed every meal, because nothing in the park was capable of noticing. The gap closed from
both ends. The economy learned to *store* (a share of every harvest banks per zone, 446) and then to
*spend* — a starving resident is fed from its own zone's pantry, its favorite if the zone happens to have
banked it (444), the first time in a hundred cycles that this park's two machines, the economy and the
needs, touched at all. Water reached every zone (445), retiring a two-thirds-dead branch inside a shipped
feature and finally giving the Fernreach's long-drawn creek something to be *for*. And the cast learned to
feed each other: two dinos eating side by side bond over the shared meal (373), a dino that went to bed
hungry breaks the morning with it in a voice shaded by its own temperament (376), and a withdrawn loner —
the dino with nobody, the one the whole system was built to miss — gets fetched, the closest thing it has
to a friend turning its back on the food to walk out and bring it in (381). If it has nobody at all, nobody
comes, and it stands at the edge while the park eats; that silence is the arc's sharpest read. Minds (M1) →
a home ground (M2) → a ground that feeds them (M3) → a ground where eating has stakes (M4) → **a ground
that provides for its own** (M5). Deathless by design; mortality stays an operator call.

**Lore arcs:**
- [x] Ate together — two dinos that feed side by side within a short window bond over the shared meal, communal feeding made a moment (BACKLOG-373 — cycle 103)
- [x] Woke hungry — a dino already over its hunger threshold at dawn plays a visible wake-hungry beat instead of a plain stretch (BACKLOG-376 — cycle 104)
- [x] Brought to the hatch — a withdrawn loner's closest friend nudges it in from the edge to the food so it doesn't miss the meal (BACKLOG-381 — cycle 105)

**Structure arcs:**
- [x] A zone banks its harvest — a share of each harvest banks into a per-zone food stockpile, capped and read on the lens; the missing spine under both the demand read (438) and a carrier that feeds the hungry (BACKLOG-446 — cycle 103)
- [x] A carrier feeds the hungry — a zone's banked food can be spent to resolve a starving resident's hunger when no keeper drop comes, closing the loop between economy and need-drive (BACKLOG-444 — cycle 104)
- [x] The waterhole — the bowl and Fernreach get their own water source so all three zones slake thirst locally, the water mirror of per-zone crops (BACKLOG-445 — cycle 105)


### Milestone 4: The hunt has weight — SHIPPED cycle 102 (opened cycle 100)

The food web woke in Milestone 3 as a chase that always came up empty; Milestone 4 gave it *consequence*.
A stalk now occasionally feeds the hunter — hunger resolves through hunting, not only the keeper's hatch
(437) — and a dino whose need is pressing finally *seeks* relief, leaning its wander toward the hatch or the
grove pond instead of just wearing the 🍖/💧 (436). The prey got a voice and a memory: one that just
slipped a hunt greets the keeper still shaken, naming its chaser (440), and a herbivore chased twice by the
same carnivore grows wary of *that* dino specifically, startling from it even off an active hunt (442). The
economy learned to *ask* — a zone light on a crop it can't grow points its carry-request at the neighbour
out-growing the rest (438) — and the whole food web now reads in the collection book: a carnivore's catches,
a herbivore's escapes (443). Minds (M1) → a home ground (M2) → a ground that feeds them (M3) → **a ground
where the eating has stakes** (M4). Still deathless by design; mortality stays an operator call.

**Lore arcs:**
- [x] Rattled after the chase — a dino that just slipped a hunt greets the keeper still shaken, naming who chased it (BACKLOG-440 — cycle 100)
- [x] The hunter's reputation — a herbivore chased by the same carnivore repeatedly grows warier of *that* dino specifically (BACKLOG-442 — cycle 101)
- [x] Predator/prey in the book — the collection book reads each dino's food-web standing: a carnivore's catches, a herbivore's escapes (BACKLOG-443 — cycle 102)

**Structure arcs:**
- [x] The hunt feeds — a successful stalk (occasional, deathless) fills the hunter; hunger resolves through hunting (BACKLOG-437 — cycle 100)
- [x] A zone wants what it can't grow — a zone light on a food kind its plot can't grow biases its carry-request toward a neighbour that can (BACKLOG-438 — cycle 101)
- [x] Need pulls the body — a pressing-need dino biases its wander toward the hatch (hunger) or pond (thirst) (BACKLOG-436 — cycle 102)

### Milestone 3: Enough to go around — SHIPPED cycle 99 (opened cycle 97)

The three-zone chain stopped merely *reading* as three places (Milestone 2) and started *providing* like
one economy: banked resources flow toward the zone that needs them instead of piling forever in one (429),
all three zones farm their own crop (432), and each zone's yield reads on its own (433). And the dinos came
to live inside that economy as hungry mouths and providers — hunger surfaces in a dino's own voice (368),
giving way to a hungrier friend became a remembered, repaid kindness (385/386), and the food web finally
woke with its first hunt: a hungry Twitch stalks, a herbivore flees, and the chase comes up empty — deathless
(367). Milestone 1 gave the dinos minds; Milestone 2 gave them a home ground; Milestone 3 made that ground
*feed them*.

**Lore arcs:**
- [x] Hunger you can hear — a dino over its hunger threshold lets the need slip in its own greeting/gossip line (BACKLOG-368 — cycle 97)
- [x] The food web wakes — a hungry carnivore stalks the nearest herbivore, which flees; the bowl's first hunt, deathless (BACKLOG-367 + 435 diet split — cycle 99)
- [x] Provision remembered — a dino that yields a meal to a hungrier friend is repaid, gratitude leaving a trace between them (BACKLOG-385, -386 — cycle 98)

**Structure arcs:**
- [x] Resources flow toward need — a zone past its stockpile soft cap biases its carry outflow toward a lighter neighbour (BACKLOG-429 — cycle 97)
- [x] All three zones farm — the Fernreach gets its own plot and a third farmable crop, completing the farming divergence (BACKLOG-432 — cycle 98)
- [x] Each zone's harvest reads on its own — a per-zone harvest tally reads on the map lens beside the prosperity tier (BACKLOG-433 — cycle 99)

### Milestone 2: Places to belong — SHIPPED cycle 96 (opened cycle 93)

The three-zone chain stopped reading as one bowl with two tinted annexes: each zone became its own
*place* — its own crop in the ground (per-zone crops 418), its own built landmark on the skyline (three
skylines 417), a prosperity you can read at a glance (the index 428) — and the dinos started to
**belong** to one. A resident that stays put settles in and resists the ambient wander (341); a settled
dino aims its solitary tic at the edge a departed friend left by (414); a dino whose closest bond lives
a zone away grows homesick and drifts back (340). Milestone 1 gave the dinos minds; Milestone 2 gave
those minds a *home ground*.

**Lore arcs:**
- [x] A dino calls a zone home — settles in, resisting the ambient wander; where it belongs reads in the book (BACKLOG-341 — cycle 93)
- [x] The ache of a departed friend — a settled dino aims its solitary tic at the edge a close friend left by (BACKLOG-414 — cycle 94)
- [x] Homesick for a friend — a dino whose closest bond lives in another zone drifts back toward them (BACKLOG-340 — cycle 95)

**Structure arcs:**
- [x] Three skylines — the Fernreach raises its own woven-frond thatch, so the chain builds three different landmarks (BACKLOG-417 — cycle 93)
- [x] Per-zone crops — each zone's plot grows a crop suited to it, the farming half diverging like gathering already does (BACKLOG-418 — cycle 95)
- [x] A zone you can read — a derived prosperity index folds pile + crops + structures + heads into one tier, shown on the map lens (BACKLOG-428 — cycle 96)

### Milestone 1: Minds of their own — SHIPPED cycle 92 (opened cycle 90)

Come back after a week and the dinos are running their own lives: each one has an authored
persona, wakes up with an intention of its own that *changes across the day*, and the chain of
zones they live across is legible at a glance — all whole with zero download, and now landing on
a save that can grow. The operator's oldest standing nudge (route the brain into *decisions*, not
just speech) became the spine, deterministic floor intact throughout.

**Lore arcs:**
- [x] The brain leans on the wheel — a cached, async per-dino intent nudges what a dino *does* (BACKLOG-393 — cycle 90)
- [x] A self to lean with — per-dino persona authored from lore, generate-once/cache/persist, procedural fallback (BACKLOG-103 — cycle 91)
- [x] The day has a shape — persona-driven daily plan the world tick consults; minds act, not just reply (BACKLOG-012 — cycle 92)

**Structure arcs:**
- [x] The chain is legible — edge indicators name the neighbour zone before you cross (BACKLOG-398 — cycle 90)
- [x] The world at a glance — a zone-map lens: the whole chain, who lives where, from the adjacency table (BACKLOG-425 — cycle 91)
- [x] A save that can grow — versioned save envelope rooted at v0, the persistence spine personas/intents land on (BACKLOG-426 — cycle 92)
