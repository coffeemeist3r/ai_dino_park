# Cycle 117 — QA

**Suite:** `npm run build` clean · `npx vitest run` **1404/1404** (+15) · `npx --yes kill-port 5173` +
`npx playwright test` **399/399** (+2) — full parallel run, **no flake this pass** (the catalogued cold-boot
and mobile-minds long-dialog specs both passed, second cycle running clean).

**Boundary:** `grep` for `@mlc-ai/web-llm` outside `game/src/ai/` returns nothing. Neither track goes near
`ai/`.

**Save:** `world/saveGame.ts` is not in the diff. The design made "no save-envelope change" an explicit
assertion this cycle and it holds — both tracks are pure reads over state 463/448 already persist.

---

## Lore track — BACKLOG-470 · Word of how the ground decides — **5/5 PASS**

| # | Criterion | Result |
|---|---|---|
| 1 | Wording differs by priority, carries `RUMOR_MARK`, no article doubled before the zone name | **PASS** — `cycle-117-policy-word.test.ts` asserts both stances (`feeds its own first` / `banks against the winter`), `isShareable === false` on both, and no `the The` for `The Grove`/`The Fernreach` |
| 2 | Writes into the **listener's** memory and returns the line | **PASS** — `recall(after, 'Mossback')` contains it; the test also pins that the *speaker's* store does not |
| 3 | Silent on `priority: null`/`undefined` and on `speaker === listener`, store identity unchanged | **PASS** — both gates asserted with `toBe(store)` identity, `null`/`undefined` both covered |
| 4 | The planted word is a rumor, not first-hand — 1 hop | **PASS** — `isShareable(rumor) === false`, the same gate every other word on the spine rides; 470 adds no new re-spread rule |
| 5 | Lands in-game on the meet cascade at the specified precedence, ticker rung included | **PASS (with a scope note)** — `cycle-117-policy-word.spec.ts` proves the integration seam end to end through the shipped hook: silent on a policy-less bowl, and once a provider is crowned it returns a `told me:` line naming `Pocket Cretaceous` and matching the live `__spendPriority`. Precedence itself is read from the code, not driven: the rung sits between `pword` and `plenty` in the `?:` chain and the ticker else-if ladder is in the same order, which is the invariant the block's own comment demands |

**Extra coverage the Coder added, and QA endorses:** a test pinning that a provider *may* speak of its own
ground — the deliberate divergence from 453's setter-exclusion rule. Without it the next cycle to touch this
file would copy 453's rung across by reflex and silently narrow the beat.

---

## Structure track — BACKLOG-468 · The provider's read on the lens — **5/5 PASS**

| # | Criterion | Result |
|---|---|---|
| 1 | `spendGlyph`: feed → 🍽️, bank → 🏦, null/undefined → `''` | **PASS** — `cycle-117-spend-lens.test.ts` |
| 2 | `zoneMapModel` attaches `spend` per zone; a zone absent from `spends` reads `null` | **PASS** — bowl `feed`, grove `bank`, fernreach (absent) `null` |
| 3 | Back-compat across the pre-468 call shapes | **PASS** — 3-arg and 8-arg both compile and yield `spend === null` everywhere; a second guard added inside `game/src/ui/lenses.test.ts` where the other column tests live, so the regression fires next to its neighbours |
| 4 | Glyph rides the **existing** tier line; no glyph and no extra line when there's no policy | **PASS (read, not pixel-asserted)** — the draw site appends `${e.spend ? ' ' + spendGlyph(e.spend) : ''}` to the existing `txt` template; `boxH` and every other line are untouched in the diff, and a policy-less zone produces a byte-identical label to pre-468 |
| 5 | Lens reads live: `__zoneMap()` matches `__spendPriority` per zone | **PASS** — `cycle-117-spend-lens.spec.ts`: every box `null` in a young park, then the bowl's entry equals `__spendPriority('bowl')` once a provider is crowned |

---

## Notes for the Validator

- **The one seam not directly asserted:** the *drawn* Phaser label string. `mapLabels` are Phaser `Text`
  objects with no dev hook exposing their content, so criterion 4 is verified by diff-reading the one-line
  template append plus the model assertion behind it — the same way 454's 🏛️ and 460's ⬇ were verified when
  they took the same route. A browser-pane screenshot was attempted and abandoned: the pane wasn't
  compositing frames in this environment, so `WorldScene.create()` never reached `__ready`. Adding a
  `__mapLabels()` hook purely to pin a template append reads as more surface than the risk warrants; noting
  it rather than silently claiming pixel coverage.
- Both tracks are net-additive reads. Nothing in the diff can change behaviour for a park that has never
  crowned a provider: `spendGlyph(null) === ''`, `spreadPolicyWord(..., null, ...)` returns the store
  untouched, and the cascade rung only evaluates when every earlier rung came up empty.
- Approving both closes **Milestone 9's structure track** (468 was its second and last structure arc) and
  leaves lore 471 as the single remaining arc of the milestone.

**Both tracks recommend APPROVE.**
