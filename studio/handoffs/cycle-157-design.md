# Cycle 157 — Design

Two tracks, both on Milestone 19, both about something resolving *inside* a sitting.

---

## Lore track — BACKLOG-066

**Item:** BACKLOG-066 [emergent] Taste talk — a dino that just ate its favorite can let it slip in
dialogue; learn a palate by chatting, not only by the 😋.

### Why this cycle

Every dino in this park has had an opinion about food since cycle 25. `favoriteFood(traits, season)` is a
deterministic read off personality, seasonally nudged, and it drives the rush range, the bond gain, the
solace beat, the granary's spend priority and the keeper's scan panel. What it has never driven is a
sentence. The player's only route to "Thornback loves fish" is to be looking at Thornback in the single
frame a 😋 is on screen — and if they blink, the park's entire palate system is invisible to them until
the next drop.

`ai/brain.ts` already has the exact shape this wants: nine composable asides, each a fact the dino lets
slip, each split three ways by temperament, each with a matching prompt clause on the LLM path. The tenth
is the meal. And it is a Milestone 19 arc for the honest reason — a meal eaten at minute two is a thing
the dino is still talking about at minute four, and stops talking about by minute six. That is a middle.

### What ships

1. **Two exported memory builders in `world/foods.ts`** — `ateFavoriteMemory(label)` and `ateMemory()` —
   replacing the two template literals currently written inline in `WorldScene.eatFood`. This is
   BACKLOG-483's rule applied at the moment the read is created, not a hundred cycles later.
2. **A reader, `lastTaste(memories)`**, in `world/foods.ts`: given a dino's recall ring, return
   `{ label, loved } | null` for the most recent meal still on it. The 6-slot ring **is** the freshness
   gate, exactly as `lastHatchOutcome` uses it for BACKLOG-404 — no new state, no new field, no save change.
   A dino stops mentioning its dinner when its dinner rolls off its memory.
3. **`tasteAside(label, loved, traits)` in `ai/brain.ts`** — the tenth aside, in the established three-way
   temperament split, six lines total. A prickly dino that got its favorite will not admit it is pleased; a
   warm one will not stop. A prickly dino that got something else complains; a warm one is gracious about it.
   Composed onto the reply last of all, like every aside before it.
4. **`NPCContext.tasted?: { label: string; loved: boolean }`**, set from `lastTaste` in the live greet path
   and in `greetContextFor` (so the `__greetPrompt` / `__cannedLine` dev hooks see the same dino the player
   does), plus a matching clause in `webllmBrain.buildMessages` so the model is told the fact and answers in
   the colour of it — never asked to author the frame.

**What the player does:** drop food into the hatch. Watch a dino eat it. Walk over and press Z. The dino's
greeting ends with what it thought of the meal, named by food and coloured by who it is. Feed the same food
to two different dinos and the two lines do not match.

### Acceptance criteria

- [ ] `ateFavoriteMemory('silver fish')` contains `silver fish` and the word `favorite`; `ateMemory()` does not name a food
- [ ] `WorldScene.eatFood` files its two meal memories through those builders, with no remaining inline meal template literal in the method
- [ ] `lastTaste([])` returns `null`
- [ ] `lastTaste([ateFavoriteMemory('silver fish')])` returns `{ label: 'silver fish', loved: true }`
- [ ] `lastTaste([ateMemory()])` returns a result with `loved === false`
- [ ] `lastTaste` returns the **most recent** meal when the ring holds two, and `null` once a meal has been pushed off the ring by six later memories
- [ ] `tasteAside` returns six distinct strings across {loved, not-loved} × {prickly, even, warm}; every loved/unloved line naming a food contains the food label; every one begins with a space
- [ ] `cannedReply` with `tasted` set appends the aside; `cannedReply` with `tasted` absent returns text byte-identical to the same context without the field
- [ ] `buildMessages` includes a taste clause naming the label when `tasted` is set, and omits it when absent
- [ ] e2e: with the food selector on a known dino's favorite, drop it, let that dino eat, greet it, and the dialog text contains that food's label
- [ ] e2e: greet a dino that has not eaten and the dialog text contains no food label

### Out of scope

- **Gossip.** The item says "dialogue/gossip"; this cycle ships dialogue. A dino telling *another dino* what
  it ate is a second beat with its own spread rules, and `social/gossip.ts` already has an idiom for it that
  deserves its own cycle rather than a rider.
- **The book.** Revealing a palate in the collection book after you have heard it is BACKLOG-069's item
  (*menu in the book*), not this one. 066 gives you the way to learn it; 069 gives you the place to record it.
- **BACKLOG-068 / -070** (acquired taste, picky vs. gobble). Untouched.

### Constraints

- The aside composes **last**, after `hourAside`, and raises only the final `slice()` cap. Every earlier cap
  stays exactly where it is, so a context without `tasted` is byte-identical to today.
- `@mlc-ai/web-llm` stays imported only under `game/src/ai/`.
- No save-format change at all — the ring already persists.
- `lastTaste` must match against the exported builders, never against a hand-written copy of the string.

---

## Structure track — BACKLOG-544

**Item:** BACKLOG-544 [core] The state that ends — a shared expiry seam for dino moods.

### Why this cycle

BACKLOG-123 shipped last night and gave the jealous sulk the ending it had lacked for 125 cycles. In doing
so it supplied the one thing 544 was deliberately queued behind: a real instance. There are now four
transient dino states in this park — `pendingRepair` (the jealous sulk, 40 steps), `stungAt` (the hatch
sting, 24 steps), `coldPending` (the cold funk, no clock at all — it thaws at dusk, which at the shipping
1x clock is twenty-four real hours away) and `liftedUntil` (the mood lift, in milliseconds) — and each one
invents its own answer to *has this ended, and by whose doing*.

### What ships

**1. `world/expiry.ts` — pure, Node-testable, no Phaser, no clock.**

```
export type FunkKind = 'sulk' | 'shoulder';
export interface Funk { kind: FunkKind; since: number }
export type Funks = Readonly<Record<string, Funk>>;
export const FUNK_WINDOW: Readonly<Record<FunkKind, number>>;
export function enterFunk(f: Funks, name: string, kind: FunkKind, atStep: number): Funks;
export function clearFunk(f: Funks, name: string): Funks;
export function funkOf(f: Funks, name: string): Funk | undefined;
export function inFunk(f: Funks, name: string): boolean;
export function expiredFunks(f: Funks, atStep: number): { name: string; kind: FunkKind }[];
```

Immutable record in, immutable record out — the idiom `memory.ts` and `bonds.ts` already use. The window
table takes `sulk`'s length from `SULK_FADES_AFTER_STEPS`, so BACKLOG-123's number stays defined where 123
reasoned about it and the seam does not quietly fork it.

**2. The jealous sulk moves onto the seam.** `pendingRepair` + `pendingRepairAt` are deleted as fields;
every read becomes a `funkOf` of kind `sulk` and every write becomes `enterFunk` / `clearFunk`. `checkSulk`
becomes a loop over `expiredFunks`. Behavior for the jealous sulk is unchanged, by construction — same
window, same two exits, same strings, same `__pendingRepair` and `__sulkAge` hooks.

**3. The reachable half — the standoff loser gets a funk.** In `resolveContest`, the dino that comes away
with nothing (the slinker in the stand branch, the ceder in the gobble branch — the same dino `sting()`
is already called on) also **enters a `shoulder` funk**, window 20 steps / 60 seconds. While it holds:

- its idle glyph shades to 😒 through the **existing** `moodFidget` `sulk` mood path — the same route the
  jealous sulk already takes, so no new rig, no new `PROP_RIGS` key, no new mark object;
- it ends on its own at 20 steps with a float and a memory that does not credit the keeper;
- it ends **early** if the keeper feeds it or greets it, with a float and a memory that does, plus the same
  `liftMood` flourish the jealous sulk's repair earns.

Four new strings, all in `world/sulk.ts` beside `shookItOffMemory` — the standoff sulk is a sulk, and a
second module for the same feeling would be a second idiom for the same job.

**4. A dev hook** `__funks()` returning `{ name, kind, age }[]` so the e2e can watch a funk run and end.

### Fresh ten-minute answer

Minute one: drop food into the hatch with two dinos near it. One wins, one comes away with nothing — and
that dino now wears a 😒 over its head for the next minute instead of being indistinguishable from a dino
that ate. Either you walk over and put it right (it brightens, and the book says you did) or you watch it
get over it (it brightens, and the book says you did not). Today that dino gets one frame of 😤 and nothing.

### Acceptance criteria

- [ ] `enterFunk({}, 'Thornback', 'shoulder', 10)` then `funkOf` of that name returns kind `shoulder`, since 10
- [ ] `clearFunk` removes exactly that name and leaves the others untouched; clearing an absent name is a no-op
- [ ] `enterFunk` and `clearFunk` do not mutate their input record
- [ ] `FUNK_WINDOW.sulk === SULK_FADES_AFTER_STEPS` (40) and `FUNK_WINDOW.shoulder === 20`; `shoulder < sulk` (a scrap is a lighter thing than a slight)
- [ ] `FUNK_WINDOW.shoulder * 3 < 10 * 60` — it resolves inside the ten minutes CHARTER v7 measures over
- [ ] `expiredFunks` returns a funk at exactly its window and not one step before, and returns `[]` on an empty record
- [ ] `expiredFunks` returns **both** when two funks of different kinds are due in the same step
- [ ] The two standoff endings name the dino; the unattended one does not contain `keeper` and the attended one does — the BACKLOG-123 register assertion, applied to its sibling
- [ ] Unit: the jealous sulk still ages out at exactly 40 steps and still takes the repair ending on a meal (the existing cycle-123 specs stay green **unmodified**)
- [ ] e2e: a contested drop leaves the loser in a `shoulder` funk — `__funks()` reports it within one step of the contest
- [ ] e2e: that funk is gone by 20 steps without any keeper action, and the loser's memory gains the unattended line
- [ ] e2e: greeting the loser inside the window clears the funk early and the memory gains the attended line
- [ ] e2e: the loser's idle mood glyph reads 😒 while the funk holds (via the existing mood path, with `unplacedRigs()` still empty — `cycle-145-reachability.test.ts` stays green)

### Out of scope

- **The cold funk and the mood lift do not move onto the seam this cycle.** 544's own text says the second
  and third callers move "only when a cycle has a reason to touch them", and a mass migration of four call
  sites is how a seam gets a shape nobody wanted. Two callers is what makes it a rule rather than a special
  case; the other two follow when something needs them to.
- **No `sulk` rig.** The 😒 stays the existing text glyph. Tonight ships BACKLOG-543's *host*; the Artist
  draws the rig at cycle 158. Shipping a rig without a host is what the cycle-145 amendment forbids.
- **No bond or affinity change** on the standoff funk. 395 owns the social ripple of a contested drop; this
  is a mood, not a ledger entry.

### Constraints

- **File overlap with the lore track: `WorldScene.ts` only**, and in different methods — the lore track
  touches `eatFood` and the greet-context literals, the structure track touches `resolveContest`,
  `checkSulk`, `eatFood`'s repair branch and `moodFidget`. **Both tracks touch `eatFood`.** Coder: do the
  structure track's `eatFood` edit (the `pendingRepair` to `funks` conversion) **first**, then the lore
  track's builder swap on top of it, so the two do not fight over the same method.
- The existing `__pendingRepair` and `__sulkAge` dev hooks must keep working unchanged — thirty-odd e2e
  assertions read them.
- Additive save changes only. The funk record is transient in-session state, like `pendingRepair` was, and
  is **not** persisted — a funk does not survive a reload, which is correct: it is a thing that happens
  while you are watching.
- `expiry.ts` stays pure. No Phaser import, no `Date.now()`, no clock. The caller owns the step counter.
