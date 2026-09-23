# Cycle 166 — QA

**Build:** `npm run build` clean (no TS errors).
**Unit:** `npx vitest run` — **280 files, 2996 passed, 3 skipped, 0 failed.**
**E2E:** `npx playwright test` after `npx --yes kill-port 5173` — **811 passed, 1 skipped, 1 failed**, the
failure green when re-run isolated and a different spec each run. Treated as the known parallel-load
flake per routine 0, **and for the first time this cycle it is more than that** — see *The flake, named*.
**Boundary:** `@mlc-ai/web-llm` imported only in `game/src/ai/webllm.worker.ts` and
`game/src/ai/webllmBrain.ts`. Verified by grep over `game/src`.
**Save:** additive only — two new optional fields (`toldOfSwitch`), no migration, old saves load.

---

## Lore track — BACKLOG-162

25 criteria. **23 pass, 2 changed by a deliberate and documented inversion** (below).

| # | Criterion | |
|---|---|---|
| 1 | `missesWatcher` true on fit alone at `hearts = 0` | ✅ |
| 2 | `missesWatcher` true at `hearts >= MISS_HEARTS` regardless of fit | ✅ |
| 3 | `missesWatcher` false when neither door opens | ✅ |
| 4 | A founding dino clears `MISS_MARGIN` — recomputed from `ROSTER`, not pinned | ✅ all eight |
| 5 | `missAside` non-empty and distinct for every `KEEPERS` id, all three shades | ✅ |
| 6 | No two plain lines equal; each names something concrete about that watcher | ✅ |
| 7 | Empty/undefined/unknown id returns `''` | ✅ |
| 8 | `cannedReply` byte-identical with `missed` unset | ✅ pinned both registers |
| 9 | **Both set → the miss, and not the first look** | ⚠️ **inverted — see below** |
| 10 | e2e: `switches === 1`, `previousId === 'aether'` after a switch | ✅ |
| 11 | e2e: the ticker carries the change | ✅ names both watchers |
| 12 | e2e: every dino's memory carries the filed line | ✅ all of them |
| 13 | **e2e: a miss clause on day 1 at zero friendship** — the reachability proof | ✅ **on the second hello** |
| 14 | e2e: the clause does not repeat | ✅ |
| 15 | e2e: a re-pick files nothing and says nothing | ✅ |
| 16 | A pre-166 save loads, no throw, no miss clause | ✅ |

### The one divergence from the design, and it is the cycle's finding

The design specified: *when a dino would say both its first-look aside and its miss aside, the **miss
wins**.* The Coder implemented that, and the full e2e suite refuted it in the same fire — two specs in
`cycle-163-first-impression` went red:

> `changing watchers re-arms the park — the same dino looks you over again`
> `the choice is audible on the very first hello — observer 1 and observer 4 differ`

Both assert that after a switch a dino says what it makes of the **new** watcher **and does not mention
the old one**. That is BACKLOG-160's own arc, checked in Milestone 21 three cycles ago. The design's
precedence rule did not merely add a beat; it silenced a shipped one.

**The order was reversed in the Coder fire rather than the older spec edited.** The reasoning recorded
at the site: a new beat does not get to silence a checked one, and the reversed order is the better read
anyway. `metWatcher` re-arms for every dino on a switch, so the first look always lands on the hello
right after the switch and the miss lands on the one after that — *who are you?*, then *and where did the
humming one go?* Two hellos, both still on day one with nothing earned, and the park does not try to say
two things about watchers in one sentence.

So criterion 9 now reads the other way and is pinned that way in
`tests/unit/cycle-166-miss-compose.test.ts`, and criterion 13's reachability is satisfied on the second
hello rather than the first. **The Validator should rule on this explicitly** — it is a design/code
divergence, not a silent drift, and QA's read is that the code is right and the design was wrong.

The suppressed miss is **not spent**: `toldOfSwitch` is only written when the clause actually fires
(`!firstLook` guards it in `pickTone`), and an e2e pins that the debt is still owed after the first
hello and paid on the next.

### Reachability (CHARTER v7) — the ten-minute question

*In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

Boot. Press `K`, `1` — you are Aki, the default. Press `K`, `2` — you are Vix. The moment you do:

- the ticker says `👁️ Aki steps back and Vix takes the glass — 4 of them look up`;
- every dino in the park has filed *the watcher changed — Aki left, Vix stands there now*;
- and Sunny, on the second hello, says *…oh — but where's the humming one? it used to stand just there
  and hum. I do hope it comes back.*

Four keypresses from boot, day one, zero friendship, no model download. The four who look up are Sunny,
Twitch, Bramble and Thornback, and they are picked by the fit door — which is the whole reason the item
is reachable. The item's own wording (a dino *with high friendship* under the old observer) ships as the
second door and is the one a fresh save cannot reach; had it been the only door, nothing above would be
visible in ten minutes.

`MISS_MARGIN` was set by measuring before it was written: smallest per-dino maximum fit drop across the
founding roster is Thornback's 0.63, against a margin of 0.5. The v7 corollary is satisfied by
construction and the unit test recomputes it from `ROSTER` each run.

---

## Structure track — BACKLOG-553

10 criteria, **10 pass.**

| # | Criterion | |
|---|---|---|
| 1 | Build clean, both suites green | ✅ |
| 2 | Forced throw shows an on-screen notice carrying the message | ✅ `?bootfail=1` |
| 3 | On that failure `__ready` is not true and `__bootError` has a `message` | ✅ |
| 4 | On a normal boot `__bootError` is null and `__ready` is true | ✅ |
| 5 | Failure entry carries `readyMs: null`, a label, and a `failedAt` | ✅ observed live |
| 6 | The failure write never throws on an unwritable path | ✅ |
| 7 | `boot()` rethrows after writing — a failure is not swallowed into a pass | ✅ |
| 8 | `bootstats` counts and names failed boots; zero prints cleanly | ✅ |
| 9 | A failure with a drained `pageerror` is distinct from one without | ✅ |
| 10 | `.e2e-boot-times.jsonl` stays gitignored, nothing committed | ✅ |

### The flake, named — four cycles late, on the instrument's first night

This is the result worth the Validator's attention. Across **three full suite runs tonight**, the new
failure record caught **three hangs**, and all three say the same thing:

```
failed      3  (never came up — these are the hangs)
  ✗ cycle-131-standings.spec.ts › banking seats a council…      died waiting on: canvas  (no exception)
  ✗ cycle-160-hold-feed.spec.ts › a hold on the feed button…    died waiting on: canvas  (no exception)
  ✗ touch-controls.spec.ts › a dialog is modal on touch…        died waiting on: canvas  (no exception)
```

Different victim every run — which is the signature this studio has been re-running since cycle 156 —
but **the same two facts every time: it died waiting for the canvas, and there was no exception.**

That **eliminates 553's own third candidate**, the one the reachability half was built around: a
`WorldScene.create()` that throws partway would fail waiting on `__ready`, with an exception drained
behind it, and would now leave a line saying exactly that. None of the three did. The scene never got as
far as existing. The remaining candidates are 553's first and second — a `page.goto` that never resolves
against a dev server, or a worker whose context never gets a socket — and both live below Phaser
entirely. That is a materially different search than the one four cycles of re-runs implied.

Note the numbers this sits against: 20,540 recorded boots, median 623ms, p95 735ms, worst 2229ms, against
a 30,000ms ceiling. Three of twenty-odd thousand hung, and none of them was slow. It is a stall, and now
it is a stall with a location.

### Two defects QA found in this cycle's own work

**1. The instrument caught its author.** The first `--report` after the harness change named ten hangs
that had never happened. The fail-open unit tests were calling `recordBootFailure` against the **real**
boot log and forging entries into it. `recordBootFailure` now takes its path the way `recordBootLine`
always has, the tests point at an unwritable path, and the ten forged lines were removed from the log.
An instrument a test can write to is not an instrument.

**2. A poll that passed for the wrong reason.** `cycle-166-bootfail` polled
`expect.poll(…__bootError).not.toBeNull()`. Before `create()` runs, `__bootError` is **`undefined`**, and
`undefined` is not null — so the poll returned instantly on a page that had not started, and the read
after it threw `Cannot read properties of undefined`. It passed every isolated run and failed twice in a
row under the full suite's load, which is the exact false-green shape BACKLOG-515 catalogued. Now polled
on the message, with `BOOT_TIMEOUT` rather than an invented 10s budget.

Both were caught by running the full suite rather than the new specs, which is the only reason this note
exists rather than a fourth diagnosis next cycle.

---

## Verdict recommendation

**Both tracks APPROVED**, with the Validator asked to rule explicitly on the lore track's inverted
precedence — the code disagrees with the design on purpose, and the disagreement is written down at the
site, in the tests, and here.
