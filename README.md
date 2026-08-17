# Splitsecond

Daily math game, Wordle-format: same puzzles for everyone on a given
calendar date. Static site, vanilla JS, no build step, no backend.

## Stack
Plain HTML/CSS/JS. No framework, no bundler, no package.json.
Runs directly on GitHub Pages by serving the repo root.

## File map
- `index.html` — all 3 screens (select / game / result), markup only
- `css/style.css` — light "worksheet" theme (see "Design system" below)
- `js/seed.js` — date-seeded PRNG (mulberry32). `getDailyRng(level, dateKey)`
  returns a deterministic RNG per (date, level) pair.
- `js/storage.js` — localStorage utility: anonymous per-device ID
  (`crypto.randomUUID()`) + per (date, level) result storage, used for the
  "already played today" lock. No accounts, no sync, no aggregation.
- `js/problems.js` — problem generators (`Generators.easy/medium/hard`),
  each takes an rng and returns `{ text, answer, stackable }` (plus
  `{ a, op, b }` when stackable). `buildRound()` calls the generator N
  times sequentially against one rng instance. Level bands: easy =
  elementary (single-step, all 4 ops), medium = middle/high school
  (two-step order-of-operations, negatives, percentages, simple linear
  equations), hard = adult (bigger numbers/more steps: 2-digit
  multiplication, 3-step expressions, cubes, larger percentages/division).
  Hard is harder via magnitude only, not a tighter clock. `stackable` is
  shape-based, not level-based — see Game rules below.
- `js/game.js` — all game state + DOM wiring. Single `state` object,
  `LEVELS` config (seconds/count per difficulty), timer via `setInterval`
  that runs continuously regardless of which screen is visible. Handles
  level selection (fresh start / resume / abandon-as-loss / show
  already-played result — see `selectLevel()`).
- `js/share.js` — Wordle-style result string + clipboard copy.

## Game rules
- Player picks a level (easy/medium/hard — elementary/middle-high
  school/adult), gets 5 questions per round.
- One shared countdown timer per round (30s/40s/45s by level).
- Wrong answers don't end the round — they just count against your score
  and the round moves on to the next question. Round only ends when the
  timer hits 0 or all 5 questions have been answered.
- Questions render in one of two shapes, decided per-question (not per
  level): plain two-operand +, −, or × problems show as traditional
  stacked column arithmetic (numbers stacked, operator + rule above the
  answer). Everything else — division, and hard's multi-term expressions
  — renders inline as plain text. Medium shows a mix of both depending on
  the individual question; hard's expression shapes are always inline
  (only its plain 2-digit × 2-digit shape stacks).
- A back button on the game screen returns to level select. The timer
  **never pauses** for this — it keeps running in the background exactly
  as if the player were still on the question. Tapping the same level
  again resumes at the same question/time remaining (or shows the fail
  result immediately if time ran out while away). Tapping a different
  level abandons the in-progress round as a loss first.
- Each device gets an anonymous ID (localStorage) used to lock one
  result per (calendar date, level). Once a round for a level is
  finished (won, timed out, or abandoned) today, selecting that level
  again shows the recorded result instead of letting you replay it.
  Session-only in-progress state — a full page reload loses an
  unfinished round rather than resuming it; not considered a bug.
- Result screen shows a grid of 🟩/🟥/⬛ (correct/wrong/unreached) +
  score + elapsed time, with a "copy result to clipboard" share button.
  Title reads "Perfect round!" (all correct), "Round complete" (finished
  with some wrong), "Out of time" (timer ran out), or "Round abandoned"
  (left mid-round for another level). A visual-only placeholder slot
  reserves space for a future streak/leaderboard feature — no data or
  logic behind it yet.
- Puzzles are deterministic per **local calendar date** (not UTC) — see
  `todayKey()` in seed.js. Known tradeoff: players in different timezones
  can see different "today" sets right at midnight boundaries. Intentional
  for now, flagged as a possible future change (switch to UTC if a global
  shared daily puzzle matters more than local-midnight-rollover).

## Design system (current: light "worksheet" theme)
- Palette: warm paper background (`#faf7f0`) with a faint graph-paper
  grid behind content, one red accent (`#e4432f`, "red-pen-grading"
  energy) doing all the interactive work — buttons, timer, focus rings,
  correct-state feedback, result-grid correct tiles.
- Typography: Space Grotesk (bold, geometric) for headings, the timer,
  and question/answer digits; Inter for body copy. Both loaded via
  Google Fonts link in `index.html`. Tabular-nums on all numeric display
  text for alignment.
- Motifs: stopwatch icon next to the timer, chunky bordered "worksheet
  card" level buttons and question box (no glow/shadow), result grid as
  solid-filled Connections-style tiles (✓/✕ glyphs) rather than tinted
  emoji, stacked column-arithmetic layout for simple +/−/× questions.
- All tokens are CSS custom properties at the top of `style.css` — swap
  the theme by editing `:root`, same pattern as before.
- Previous theme was a dark Wordle-style palette (near-black bg, green
  accent) — fully replaced, not layered on top of.

## Status
Styling and all game logic changes have been exercised via a scripted
behavioral test (fake DOM under macOS JavaScriptCore, not a real
browser) covering: 5-question rounds, stacked vs. inline rendering mix,
back/resume without pausing the timer, abandon-as-loss on switching
levels, eager timeout-while-away, and the already-played-today lock.
Not yet manually clicked through in an actual browser — treat as
logically verified but not human-played until someone does.

## Naming history
Originally "Math Wordle" → renamed to "Splitsecond" (Nerdle/Mathler
already occupy the math-Wordle-clone naming space; Splitsecond ties to
the timer mechanic instead). Originally also tied to a fail-fast-on-
wrong-answer mechanic, but that was removed — see Game rules above;
wrong answers no longer end the round, only the timer does.

## Open questions / likely next asks
- Streak tracking, stats (best/average), and a real leaderboard —
  explicitly out of scope so far. The result screen has a visual-only
  placeholder slot reserved for this but no backing logic or UI.
- No sign-in/accounts by design (device-local only) — a leaderboard
  would need to decide how much of that to change.
- No global leaderboard/backend — share is clipboard-only, self-reported.
- In-progress rounds don't survive a page reload (session-only state) —
  accepted limitation for now, not a bug.