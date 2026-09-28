# Cycle 171 — Design

Two tracks. They share one file seam (`WorldScene.ts`: the meet bump and the `!save` branch for
structure; `bookRows` + the forceStep tail for lore) and one data seam (the bond graph). **Build
structure first** — the lore line is only true on the graph structure ships.

## Structure track — BACKLOG-565 (+567)

**Item.** The founding park has no friends (565) + the bond graph fills up (567): the bond range.

**Why this cycle.** Every social system in the park reads one number, and that number is wrong at
both ends of a sitting: all zeros at boot (loner/comfort/huddle/grief floors of 8 all unmet, every
dino a loner, the bonds lens empty), all 100s four minutes later (closest friend decided by name
order). Milestone 23's lore arcs put "who is close to whom" on screen; they need a graph that starts
somewhere true and keeps meaning something.

**What ships.**
- `FOUNDING_BONDS` in `world/founding.ts`: a pure table of pairs, applied only when no save loads,
  via the existing `bonds` field (no version bump; a restored save seeds nothing). Pairs:
  Rex–Sunny 30, Bramble–Pip 26, Mossback–Glade 24, Sunny–Ember 18, Mossback–Thornback 16,
  Sunny–Glade 14, Rex–Mossback 12, Glade–Murk 12. **Twitch has none**, on purpose.
- `meetGain(bond)` in `social/bonds.ts`: `BOND_PER_MEET × (1 − bond / 100)`. The ambient meeting in
  `WorldScene` uses it instead of the flat 4. One-off beats (comfort, gratitude, wonder, …) stay flat.
  Bonds become non-integer; every place the player sees a bond *number* rounds it (`topBond`).
- A `strangers` named founding fixture in `tests/e2e/helpers.ts` (+ a `__clearBonds` hook) for specs
  whose subject assumes the zero graph.

**Acceptance criteria.**
- [ ] S1 On a fresh boot `__bonds()` equals `FOUNDING_BONDS` (every listed pair at its value).
- [ ] S2 On a fresh boot `__loners()` is exactly `['Twitch']`; every other dino has a bond ≥ 8.
- [ ] S3 A restored save does not re-seed: after zeroing a pair, saving and reloading, the pair stays 0.
- [ ] S4 Unit: `meetGain(0) === 4`, `meetGain(50) === 2`, `meetGain(100) === 0`; 200 consecutive
      meetings from 0 leave a pair < 100, and a pair after 40 meetings is strictly above one after 10.
- [ ] S5 Stepped e2e: after 80 `__stepWorld` steps on a fresh save, at least one Bowl pair is below
      90 (measured cycle 170: most pairs were at 100 by step 80).
- [ ] S6 The bonds lens draws at least one line on frame one of a fresh save.
- [ ] S7 The book's `bond:` number is an integer.
- [ ] S8 Build clean, unit green, full e2e green (specs that assumed a zero graph opt into `strangers`
      with the fixture's `why`, not by bulk edit).

**Out of scope.** Bond decay over time (the graph still approaches 100 over a very long sitting; it
no longer reaches it and ordering survives). Re-tuning the four floors. Away/offline catch-up growth.

**Constraints.** Additive save only. Founding bonds live beside the other founding state, not in the
roster. `meetGain` is pure and Node-tested.

## Lore track — BACKLOG-134

**Item.** Closest-friend line in the book — and the ticker when a closest friend changes.

**Why this cycle.** It is Milestone 23's headline, reachable on frame one once 565 lands: open the
book and every dino names who it is closest to, in a register that says *how* close — and the one
dino with nobody says so. Over ten minutes the graph moves and the park tells you: *Mossback has grown
closer to Rex than to Glade.* Distinctness you can read without touching anything.

**What ships.**
- Pure `social/closest.ts`: `bestFriend(name, current, bonds, others)` — the closest peer over the
  loner floor (8), with hysteresis: a challenger replaces the current friend only when its bond beats
  the current one's by `SHIFT_MARGIN` (5). `friendLine(friend, bond)` → `🤝 friendly with X` (< 25),
  `🤝 close to X` (25–59), `🤝 thick as thieves with X` (≥ 60), or `🤝 no friend yet` (null).
  `shiftLine(name, from, to)` → `💞 <name> has grown closer to <to> than to <from>`.
- Scene: a `bestFriendOf` map, derived at boot silently (no ticker lines for the founding state),
  refreshed each world step; a change from one friend to another logs the ticker line. Not persisted
  (derived from the saved bonds).
- Book: the `friendLine` under the hearts line on every page.

**Acceptance criteria.**
- [ ] L1 Fresh boot, open the book: Rex's page shows `close to Sunny`, Twitch's shows `no friend yet`.
- [ ] L2 Every dino except Twitch shows a friend line naming the peer `FOUNDING_BONDS` makes closest.
- [ ] L3 Raising Mossback–Rex to 40 (hook) and stepping once logs `💞 Mossback has grown closer to Rex
      than to Glade` in the ticker, and Mossback's page now names Rex.
- [ ] L4 Hysteresis: raising Mossback–Rex to 26 (Glade at 24) changes nothing — no ticker line, page
      still names Glade.
- [ ] L5 No `💞` line on boot.
- [ ] L6 Unit: tiers, hysteresis, null-floor, departed-friend (current not in `others`) cases.

**Out of scope.** Persisting friend history; a mark over the pair (568 art is queued behind a host);
the keeper's inner circle (127).

**Constraints.** Reuse `closestFriend` / `LONER_FLOOR` — no second copy of the closeness rule.
