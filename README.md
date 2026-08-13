# Splitsecond

Daily math game, Wordle-format: same puzzles for everyone on a given
calendar date. Static site, vanilla JS, no build step, no backend.

## Stack
Plain HTML/CSS/JS. No framework, no bundler, no package.json.
Runs directly on GitHub Pages by serving the repo root.

## File map
- `index.html` — all 3 screens (select / game / result), markup only
- `css/style.css` — terminal/CRT theme (see "Design system" below)
- `js/seed.js` — date-seeded PRNG (mulberry32). `getDailyRng(level, dateKey)`
  returns a deterministic RNG per (date, level) pair.
- `js/problems.js` — problem generators (`Generators.easy/medium/hard`),
  each takes an rng and returns `{ text, answer }`. `buildRound()` calls
  the generator N times sequentially against one rng instance. Level
  bands: easy = elementary (single-step, all 4 ops), medium = middle/high
  school (two-step order-of-operations, negatives, percentages, simple
  linear equations), hard = adult (bigger numbers/more steps: 2-digit
  multiplication, 3-step expressions, cubes, larger percentages/division).
  Hard is harder via magnitude only — timers are unchanged from before.
- `js/game.js` — all game state + DOM wiring. Single `state` object,
  `LEVELS` config (seconds/count per difficulty), timer via `setInterval`.
- `js/share.js` — Wordle-style result string + clipboard copy.

## Game rules
- Player picks a level (easy/medium/hard — elementary/middle-high
  school/adult), gets 10 questions.
- One shared countdown timer per round (60s/75s/90s by level).
- Wrong answers don't end the round — they just count against your score
  and the round moves on to the next question. Round only ends when the
  timer hits 0 or all 10 questions have been answered.
- Result screen shows a grid of 🟩/🟥/⬛ (correct/wrong/unreached) +
  score + elapsed time, with a "copy result to clipboard" share button.
  Title reads "Perfect round!" (all correct), "Round complete" (finished
  with some wrong), or "Out of time" (timer ran out mid-round).
- Puzzles are deterministic per **local calendar date** (not UTC) — see
  `todayKey()` in seed.js. Known tradeoff: players in different timezones
  can see different "today" sets right at midnight boundaries. Intentional
  for now, flagged as a possible future change (switch to UTC if a global
  shared daily puzzle matters more than local-midnight-rollover).

## Design system (current: terminal/CRT theme)
- Palette: near-black bg (`#060a06`), phosphor green (`#baffc9` body text,
  `#6dffa0` bright/accent), amber `#ffd166` and red `#ff6b6b` for timer
  urgency thresholds (≤10s / ≤5s).
- Font: JetBrains Mono only, loaded via Google Fonts link in `index.html`.
- Motifs: scanline overlay (`body::before`), blinking cursor after the
  h1, `$`/`>`/`//` prefixes on headings/prompts/comments, `[ ]`→`[>]`
  checkbox rows on level buttons, bracketed countdown `[47]`, outlined
  ghost buttons that invert to solid fill on hover.
- All tokens are CSS custom properties at the top of `style.css` — swap
  the theme by editing `:root` and the handful of `::before`/`::after`
  decorations, not by rewriting structure.
- Previous theme (deep-sea/dark, teal accent, circular SVG countdown
  ring) was replaced by this one. If reviving it: the ring markup and
  `RING_CIRCUMFERENCE` JS logic were fully removed, not just hidden —
  would need to be re-added to `game.js` and `index.html`.

## Status
Styling pass is done (terminal theme). Game logic has been manually
played end-to-end in a browser (easy level, original fail-on-wrong
behavior confirmed working). The wrong-answer-continues change and the
redefined level content (elementary/middle-high/adult bands) have NOT
yet been retested in a browser — treat those as unverified until played.

## Naming history
Originally "Math Wordle" → renamed to "Splitsecond" (Nerdle/Mathler
already occupy the math-Wordle-clone naming space; Splitsecond ties to
the timer mechanic instead). Originally also tied to a fail-fast-on-
wrong-answer mechanic, but that was removed — see Game rules above;
wrong answers no longer end the round, only the timer does.

## Open questions / likely next asks
- 5 vs 10 questions per round (currently 10 for all levels — discussed
  shortening easy/medium to 5 for a faster daily-habit loop, undecided).
- No persistence yet: no streak tracking, no localStorage, no "already
  played today" lock — a player can currently replay the same day's
  puzzle repeatedly.
- No global leaderboard/backend — share is clipboard-only, self-reported.
