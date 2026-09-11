# Cycle 157 — QA

**Gates (run on the coder commit, `e5d0a70`):**

| gate | result |
|---|---|
| `npm run build` | clean, 9.24s, no type errors |
| `npx vitest run` | **2683 passed, 3 skipped — 253 files** |
| `npx --yes kill-port 5173` → `npx playwright test` | **713 passed / 713 — full run, 6.2m** |
| `@mlc-ai/web-llm` outside `game/src/ai/` | none |
| `cycle-145-reachability.test.ts` | 8/8 green — `unplacedRigs()` still empty |
| save format | unchanged; no new persisted key |
| working tree | clean at commit |

Unit count moved 2650 → 2683 (+33: 14 expiry, 3 sulk, 16 taste). E2e moved 706 → 713 (+7: 4 funk, 3 taste).

---

## Lore track — BACKLOG-066

| # | criterion | verdict |
|---|---|---|
| 1 | `ateFavoriteMemory('silver fish')` contains the food and the word `favorite`; `ateMemory()` names no food | **PASS** — `cycle-157-taste.test.ts`, asserted against four food labels |
| 2 | `eatFood` files through the builders, no inline meal literal left | **PASS** — verified by reading the method; the ternary is now `r.favorite ? ateFavoriteMemory(kind!.label) : ateMemory()` |
| 3 | `lastTaste([])` returns null | **PASS** |
| 4 | `lastTaste([ateFavoriteMemory('silver fish')])` → `{ label: 'silver fish', loved: true }` | **PASS** |
| 5 | `lastTaste([ateMemory()])` → `loved === false` | **PASS** (label `''`) |
| 6 | most-recent wins on a two-meal ring; null once rolled off | **PASS** — both halves asserted |
| 7 | six distinct asides, label present on the loved half, all lead with a space | **PASS** — `new Set(all).size === 6`; plus a traits-absent fallback assertion the design did not ask for |
| 8 | `tasted` set appends; `tasted` absent is byte-identical | **PASS** — pinned on the wistful register, see note 1 |
| 9 | `buildMessages` carries the clause when set, omits when absent | **PASS** |
| 10 | e2e: feed a dino its favorite, greet it, the label is in the line | **PASS** — `cycle-157-taste.spec.ts:22` |
| 11 | e2e: a dino that has not eaten names no food | **PASS** — `cycle-157-taste.spec.ts:62`, plus a third spec the design did not ask for (ate-something-else says `hatch` but never `favorite`) |

**11 of 11 pass.**

**Note 1 — a criterion tested at a different address than written.** Criterion 8 says *byte-identical to the
same context without the field*. Written literally against the default register that is not a testable
claim: `cannedReply`'s generic greeting is drawn with `rand()`, so two calls differ whether or not `tasted`
exists. The assertion is pinned on the wistful register (affection 0), which is deterministic. This is the
criterion's actual intent — that the aside composes and changes nothing else — tested at the only address
where it can be. Recording it rather than letting a green tick imply a claim that was never checked.

---

## Structure track — BACKLOG-544

| # | criterion | verdict |
|---|---|---|
| 1 | `enterFunk` records kind + step | **PASS** |
| 2 | `clearFunk` removes one name, leaves others; absent name is a no-op | **PASS** — no-op asserted by identity (`toBe`), which is stronger than the criterion asked |
| 3 | neither mutates its input | **PASS** — deep-snapshot comparison |
| 4 | `FUNK_WINDOW.sulk === SULK_FADES_AFTER_STEPS` (40); `shoulder === 20`; `shoulder < sulk` | **PASS** |
| 5 | `FUNK_WINDOW.shoulder * 3 < 600` | **PASS** — asserted over *every* kind, not just shoulder |
| 6 | `expiredFunks` fires at exactly the window, not one before; `[]` on empty | **PASS** |
| 7 | returns both when two come due in one step | **PASS** — and in a fixed order (sorted), asserted |
| 8 | the two standoff endings name the dino; unattended has no `keeper`, attended does | **PASS** — plus an assertion they differ from the jealous sulk's pair |
| 9 | the cycle-123 specs stay green **unmodified** | **PASS** — `sulk.test.ts`'s existing blocks untouched (the file was appended to, not edited); `cycle-156-sulk-shakeoff.spec.ts` 4/4 green, unmodified |
| 10 | e2e: a contested drop leaves the loser in a `shoulder` funk within a step | **PASS** — `cycle-157-funk.spec.ts:42`, age 0, and the *winner* asserted absent |
| 11 | e2e: gone by 20 steps with no keeper action; unattended memory filed | **PASS** — with the 19-step negative half, so the clock is proved a clock |
| 12 | e2e: a greet inside the window clears it early; attended memory filed | **PASS** — and driving past the window afterwards files nothing |
| 13 | e2e: the idle glyph reads 😒 while the funk holds; reachability register green | **PARTIAL — see note 2** |

**12 of 13 pass, 1 partial.**

**Note 2 — criterion 13, honestly.** The reachability half is **PASS**: `cycle-145-reachability.test.ts` is
8/8 and no `PROP_RIGS` key was added, so nothing was drawn without a host. The *glyph* half was **not
asserted end-to-end**, and the Coder's handoff says so rather than hiding it: asserting it would have meant
adding a `__moodGlyph` hook that reads back a `setText` — a hook that re-implements the thing it tests,
which is the inversion of the cycle-128 discipline this studio holds elsewhere. What is covered instead:
`inFunk` is unit-tested; `moodFidget(traits, 'sulk')` returning 😒 has had its own spec since cycle 070; and
the e2e asserts the funk record the glyph branch reads from. The uncovered gap is one line —
`inFunk(this.funks, d.name) ? 'sulk' : undefined` — and it was read by eye and is correct.

QA's position: this is a **reasonable and disclosed** coverage gap, not a failing criterion, and the
Validator should judge it as such. It is worth saying plainly that the studio has now twice in three cycles
chosen not to write an assertion that would require a hook to fabricate the evidence, and both times said
so out loud. That is the right habit.

---

## The reachability question (CHARTER v7)

*In a fresh save, watched for ten minutes, what does the player see that they could not see before?*

**Lore track:** feed any dino and then talk to it, and it tells you what it thought of the meal — by name
if it loved it. Before tonight the only channel for a palate was one frame of 😋. Verified end-to-end by
`cycle-157-taste.spec.ts`, driving the **canned** path, which is what ships to a device with no model.
Minute one is enough: the hatch is reachable from spawn and the greet is one key.

**Structure track:** drop food with two dinos near it and one of them loses. That dino now wears a 😒 for
sixty seconds and then either you put it right or you watch it get over it. Before tonight it got one
frame of 😤 and was thereafter indistinguishable from a dino that had eaten. Verified by
`cycle-157-funk.spec.ts` through `__forceContest`, the **production** resolution.

Neither track is bit-identical. Neither is gated on a day boundary, a population threshold, or a season.

---

## Flake log

One. On the first run (two spec files, default workers), two `cycle-157-funk` specs timed out at `boot`'s
`__ready` wait while two others in the same file passed. Re-run isolated at `--workers=1`: 4/4 green in
4.7s. Re-run inside the full 713-spec suite: green. This is BACKLOG-538's cold-Vite parallel-load flake,
**fourth consecutive instance**, and it remains a boot-timing failure rather than a regression — the same
signature every time (the `__ready` wait, never an assertion). It is now the longest-running known defect
the suite carries, and the Validator may want to say so.
