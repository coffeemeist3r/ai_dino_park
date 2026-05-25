# Weekly Cron Re-Arm

`CronCreate` jobs auto-expire after 7 days. To keep the studio running, the watcher (or a re-arm cron itself) re-creates the seven jobs each week.

## How to re-arm (manual)

Open Claude Code in `C:\Projects\ai_dino_park` and say:

> `/loop re-arm dino routines`

Or paste the schedule below into a fresh message and ask Claude to call `CronCreate` for each one.

## The schedule (Pacific Time, off-minute jitter)

| Day | Time  | Routine        | Prompt file                        |
|-----|-------|----------------|------------------------------------|
| Mon | 07:07 | Lore-smith     | `studio/routines/1-lore-smith.md`  |
| Mon | 10:13 | Designer       | `studio/routines/2-designer.md`    |
| Mon | 14:23 | Code-planner   | `studio/routines/3-code-planner.md`|
| Mon | 18:37 | Coder          | `studio/routines/4-coder.md`       |
| Tue | 09:11 | QA             | `studio/routines/5-qa.md`          |
| Tue | 13:47 | Validator      | `studio/routines/6-validator.md`   |
| Wed | 08:19 | Artist         | `studio/routines/7-artist.md`      |

Cron expressions:

```
7 7  * * 1     # Mon 07:07 — Lore-smith
13 10 * * 1    # Mon 10:13 — Designer
23 14 * * 1    # Mon 14:23 — Code-planner
37 18 * * 1    # Mon 18:37 — Coder
11 9  * * 2    # Tue 09:11 — QA
47 13 * * 2    # Tue 13:47 — Validator
19 8  * * 3    # Wed 08:19 — Artist
```

## Each routine's prompt (paste verbatim into CronCreate `prompt`)

The cron just fires a prompt that tells Claude to read the matching routine prompt file and execute it.

```
You are firing routine LORE-SMITH for the AI Dino Park project at C:\Projects\ai_dino_park. Read C:\Projects\ai_dino_park\studio\routines\1-lore-smith.md and execute it exactly. Commit your work when done. Do NOT chain into the next routine — only do your assigned step.
```

(Same pattern for the other six, substituting the routine name and prompt file path.)

## Why off-minute times

A million people schedule "every hour at :00" — fleet-wide load spikes. The off-minute jitter (`:07`, `:13`, `:23`, `:37`, `:11`, `:47`, `:19`) spreads requests.

## When something goes wrong

- **Routine didn't fire** — Claude session was busy at the cron tick. Cron will retry next interval, OR you fire it manually by pasting the prompt.
- **Routine produced garbage** — Validator should reject (REWORK / ABANDON). If Validator is the broken one, edit `6-validator.md` and amend CHARTER.
- **Cron jobs disappeared after 7 days** — re-run `/loop re-arm dino routines`.

## Bootstrap fire (first time only)

First fire happens manually right after bootstrap, on whatever day is convenient — call CronCreate for all seven jobs, and additionally fire Lore-smith once now as a smoke test.
