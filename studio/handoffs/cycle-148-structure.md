# Cycle 148 — Structure Handoff

**Intent:** BACKLOG-109 split the cast into day-dinos and night-owls two cycles ago and **no system in the
park knows the owls exist.** A ground rolls its resource because somebody *lives* there — `residentZones()`
is `occupiedZones()`, a membership read with no idea whether anybody in it has its eyes open. So the
Fernreach produces at four in the morning at exactly the rate it produces at noon, and the park's whole
daytime workforce could be face-down in the dirt and the stockpiles would not notice. That is CHARTER v7's
defect one layer along: a distinction that is true, tested, load-bearing and changes nothing you can watch.

**Added to Structure Track:** none — drained from queue (4 open ≥ X=4).

**Chosen this cycle:** **BACKLOG-524 — the night shift.**

---

## The three skips, each with its reason

**495** (the founding fixture) is passed over a fourth time and the reason is the same honest one: its scope
is ~550 specs and that is not one Coder fire. It wants a cycle where it is the only thing in flight, and
this is not that cycle. Recorded, not pretended away.

**523** (the hour a save opens on) is skipped for a reason that is new this cycle and worth writing down,
because it is the opposite of the usual one: **524 is about to spend that constant harder than any item
yet.** Pinning 08:00's derivation while the thing being derived from is changing under it would pin the
wrong claim. 523 is better filed the cycle *after* the park has finished discovering what 08:00 is for.

**515** — and this one gets the treatment the cycle-147 verdict demanded, which was: *no fifth skip on the
same argument without somebody writing down what the park loses by carrying it.*

It is not being skipped. **It is being carried as a rider on this cycle** rather than as the structure
track, and it is carried with the diagnosis done rather than deferred again. Both reproductions were run
this session before this handoff was written, with `npx --yes kill-port 5173` and then
`npx playwright test tests/e2e/mobile-minds.spec.ts --workers=1`:

Run 1 (cold server): **2 failed** — `a phone boots…` timed out in `boot()`'s `__ready` wait at 30s, and
`long dialogs page GBA-style` failed at **line 95**, ArrowLeft → `__dialogPage().page` expected 0, got 1.
Run 2 (warm server, 6.3s total): **1 failed** — line 95 only.

That is the whole item, and it is **two causes wearing one item number**, which is why four cycles of
re-diagnosis kept producing a different victim:

1. **Read-after-input.** `page.keyboard.press()` resolves when CDP has dispatched the DOM event. Phaser's
   `KeyboardPlugin` queues that event and emits the `down` handler from the scene's own update step —
   `WorldScene.ts:1016`, `this.cursors.left.on('down', …)`. The `page.evaluate` on the very next line is a
   second round-trip that can land *before* that frame runs. Fast round-trip (serial, warm server) loses
   the race; slow round-trip (under load) wins it by accident. This is `mobile-minds` line 95,
   `cycle-044-sound`'s `__lastSound()`, `cycle-047-warmth` and `cycle-038-scan` — every spec this item has
   catalogued as *fails serial, passes under load*. It is a harness race, **not a player bug**: a real
   player's ArrowLeft turns the page on the next frame, sixteen milliseconds later, and that is correct.
2. **Cold-boot budget.** The `controls-help` class — *passes serial, fails under load* — is the same 30s
   `__ready` ceiling seen in run 1 above, reached because N fresh browsers hit one cold Vite server at
   once. The inverse direction this item folded in at cycle 145 is not a second mystery; it is the first
   boot paying for the transform cost, which run 2 then shows costs 6.3s warm.

**What the park loses by carrying it**, since that is what was asked for: the full run reads 619/620 or
639/641 rather than all-green, and the studio has now spent parts of four Validator fires deciding whether
tonight's red is tonight's regression. That is the cost — not a broken game, a **broken instrument**, and
an instrument you have to interpret is one a genuine regression can hide behind. It has never been worth a
whole track under the reachability bar and it is not worth one now; it has always been worth an hour, and
this cycle spends the hour.

**Its answer to *what does a player see in a fresh ten-minute save* is still nothing.** That has not
changed and this handoff does not pretend it has. It is a rider, and riders are not judged at the bar —
the track is. That is the honest reading of the constitution and it is how 519 shipped in cycle 146.

---

## What 524 has to be

**One seam, not a rewrite** — the item's own words, and they are right.

`residentZones()` (`WorldScene.ts:2409`) is the shared function every ground's production routes through.
Every other work read in the park hangs off `zonePopulations`, and those are *readouts* — the tally line,
the prosperity signal, the zone lens. Changing those would make the map lie about who lives where. **The
membership reads stay membership reads; the one read that drives work becomes a read of who is up.**

1. **`chronotype.ts` grows the count.** A pure `wakingIn(...)` over the same three inputs the module already
   takes (hour, season, name-seeded traits) plus the zone map. No new state, nothing persisted, nothing in
   the save — a chronotype is re-derived on every load and so is this.
2. **`residentZones()` becomes a waking read.** A ground whose entire cast is down stops rolling.
3. **The watch.** One thing somebody does *because* it is the only one up: the resident that is awake while
   every other resident of its ground is at rest keeps the ground's watch — the `👁` tell that already
   exists in `chronotype.ts` as `ROUSE_GLYPH` with BACKLOG-520 queued to draw its rig, plus a ticker line
   and a memory that rides recall into its next greeting for free.

**Not owl-exclusive, on purpose.** The obvious design is "the owl keeps the watch", and it is wrong: it
makes the beat a property of a trait rather than of an *hour*, and it goes dark for the eight hours a day
an owl is the one asleep. The truer system is the one that reads the ground — whoever is up while their
ground is down. Owls get it at night because that is when it is true of them, and Bramble gets it at eight
in the morning because Pip is an owl and asleep.

## The reachability bar, and why this track can promise its answer in advance

Unusually, it can, because the founding state already exercises the system with **no roster edit and no
constant moved** — which is the corollary under the bar being satisfied by luck the studio should take and
verify rather than re-tune for. Computed from the shipping roster this session:

| ground | residents | chronotypes | awake at 08:00 |
|---|---|---|---|
| bowl | Rex, Mossback, Sunny, Twitch, Glade | 1 owl, 4 day | 4 |
| grove | Bramble, Pip | 1 day, 1 owl | 1 |
| fernreach | Thornback | owl | **0** |
| hollow | Murk | day | 1 |
| ridge | Ember | owl | **0** |

A spring owl rests 05:00–13:00. So on a fresh save **the Fernreach and the Ridge each have a resident and
nobody awake**, and at `ACTIVE_SCALE` 13:00 arrives **five real minutes** into the ten-minute window — well
inside it, unlike every day-boundary beat this milestone was opened to escape.

> Stand on the Ridge at 08:00 and nothing falls: its one resident is asleep, and until tonight the ground
> produced anyway. Five real minutes later Ember wakes and the Ridge starts working for the first time in
> the session. Meanwhile the Grove has been producing the whole time — Bramble is up, keeping the watch
> over a sleeping Pip, with the `👁` over its head.

**File overlap with the lore track: real, and sequenced rather than avoided.** Both tracks read
`chronotype.ts` and both touch the greet path — 110 adds a *read* of the dino's standing in its own window
to `cannedReply`, 524 adds a *count* of who is up in a zone and files a memory the greeting picks up
through the existing recall. Neither writes what the other writes. Build **524's `chronotype.ts` additions
first**, so the lore track's `dayStanding` lands on top of a settled module rather than under one.
