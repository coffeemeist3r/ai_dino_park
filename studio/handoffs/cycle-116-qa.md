# Cycle 116 — QA

**Gates (repo root):** `npm run build` clean (type-check passes). `npx vitest run` → **1389/1389** green (154
files; +14 over last cycle's 1375). `npx --yes kill-port 5173` → `npx playwright test` → **397/397** green,
full parallel run — no flake this pass (the catalogued cold-boot + mobile-minds long-dialog specs both passed).
`@mlc-ai/web-llm` imported only under `game/src/ai/` (grep verified). Save changes additive (`lastProviderByZone`
new field; validator rejects a corrupt map; old saves → `{}`).

## Lore track — BACKLOG-469 (Fed first, or left short) — 5/5 PASS

1. **`policyAside` 3 bands × 2 policies distinct, space-led, no-traits even** — PASS
   (`cycle-116-policy-voice.test.ts`: 6 distinct lines, all space-led, no-traits == even).
2. **`cannedReply` composes only when `hungry && groundPolicy`** — PASS (feed grateful / bank grumble; not
   hungry → byte-identical to no policy; hungry + no policy → byte-identical to hungry-only).
3. **Composes onto an existing register within the cap** — PASS (fond+hunger base still present, policy after
   the hunger tell, length ≤ 400).
4. **e2e: hungry resident on a policy'd ground shows the policy phrase; non-hungry does not** — PASS
   (`cycle-116-policy-voice.spec.ts`, zero console errors).
5. **Build clean, suites green, boundary intact** — PASS.
   *Also covered:* `buildMessages` policy clause present only when hungry+policy (enrichment; deterministic
   floor owns the fact).

## Structure track — BACKLOG-467 (The say changes hands) — 5/5 PASS

1. **`handoverBeat` wording + rule** — PASS (`handover.test.ts`: first-set fires, turnover fires,
   same-provider → null, departure/null → null, priority colours the tail feed vs bank).
2. **One beat per handover over `__stepWorld`, no per-step repeat** — PASS (`cycle-116-handover.spec.ts`:
   exactly one "sets … table" beat on the emerging step; a further step logs no second).
3. **`lastProviderByZone` round-trips; old save → `{}`** — PASS (save-envelope validator + WorldScene load
   default; e2e reads `__providerHandover().bowl === 'Rex'` after the transition).
4. **Departure logs nothing, keeps the stored policy; a genuinely new provider fires one beat** — PASS
   (`handoverBeat` returns null for `next === null`; the check leaves `lastProviderByZone` untouched on a
   vacant say — covered by the unit rule + the one-off e2e assertion).
5. **Build clean, suites green, additive save only** — PASS.

**Both tracks recommend APPROVE.** No blockers, tree clean at handoff.
