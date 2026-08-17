const LEVELS = {
  easy: { label: 'Easy', seconds: 30, count: 5 },
  medium: { label: 'Medium', seconds: 40, count: 5 },
  hard: { label: 'Hard', seconds: 45, count: 5 },
};

const state = {
  level: null,
  problems: [],
  index: 0,
  results: [], // 'correct' | 'wrong' | 'unreached', length === count
  timeLeft: 0,
  timerId: null,
  startedAt: null,
  endedAt: null,
  ended: false,
};

const el = {};

function cacheEls() {
  el.screenSelect = document.getElementById('screen-select');
  el.screenGame = document.getElementById('screen-game');
  el.screenResult = document.getElementById('screen-result');

  el.puzzleNum = document.getElementById('puzzle-num');
  el.levelButtons = document.querySelectorAll('[data-level]');

  el.backBtn = document.getElementById('back-btn');
  el.levelLabel = document.getElementById('level-label');
  el.qIndex = document.getElementById('q-index');
  el.qCount = document.getElementById('q-count');
  el.timer = document.getElementById('timer');
  el.question = document.getElementById('question');
  el.answerInput = document.getElementById('answer-input');
  el.submitBtn = document.getElementById('submit-btn');
  el.feedback = document.getElementById('feedback');

  el.resultTitle = document.getElementById('result-title');
  el.resultGrid = document.getElementById('result-grid');
  el.resultScore = document.getElementById('result-score');
  el.resultTime = document.getElementById('result-time');
  el.shareBtn = document.getElementById('share-btn');
  el.playAgainBtn = document.getElementById('play-again-btn');
}

function showScreen(name) {
  el.screenSelect.classList.toggle('hidden', name !== 'select');
  el.screenGame.classList.toggle('hidden', name !== 'game');
  el.screenResult.classList.toggle('hidden', name !== 'result');
}

// Entry point for tapping a level button — decides between starting
// fresh, resuming an in-progress round, showing today's already-played
// result, or abandoning a different round in progress elsewhere.
function selectLevel(level) {
  if (state.level && !state.ended) {
    if (state.level === level) {
      resumeLevel();
      return;
    }
    abandonRound(); // a different round is live — end it as a loss first
  }

  const played = window.Storage.getStoredResult(window.SeedUtil.todayKey(), level);
  if (played) {
    showStoredResult(played);
    return;
  }

  startLevel(level);
}

function startLevel(level) {
  const cfg = LEVELS[level];
  const rng = window.SeedUtil.getDailyRng(level);
  const problems = window.Problems.buildRound(level, rng, cfg.count);

  Object.assign(state, {
    level,
    problems,
    index: 0,
    results: new Array(cfg.count).fill('unreached'),
    timeLeft: cfg.seconds,
    startedAt: Date.now(),
    endedAt: null,
    ended: false,
  });

  el.levelLabel.textContent = cfg.label;
  el.qCount.textContent = cfg.count;
  el.feedback.textContent = '';
  el.feedback.className = 'feedback';

  showScreen('game');
  renderQuestion();
  startTimer();
}

// Re-show the game screen for a round already ticking in the background —
// the timer never stopped, so state.timeLeft/index are already current.
function resumeLevel() {
  if (state.timeLeft <= 0) {
    endRound('time'); // safety net; the interval tick should already catch this
    return;
  }
  const cfg = LEVELS[state.level];
  el.levelLabel.textContent = cfg.label;
  el.qCount.textContent = cfg.count;
  showScreen('game');
  renderQuestion();
}

function abandonRound() {
  finalizeRound('abandoned');
}

// Rehydrate state from a stored record and show it via the normal result
// path, so share.js (which reads live state) keeps working untouched.
function showStoredResult(record) {
  Object.assign(state, {
    level: record.level,
    problems: [],
    index: record.results.length - 1,
    results: record.results,
    timeLeft: 0,
    startedAt: record.startedAt,
    endedAt: record.endedAt,
    ended: true,
  });
  const cfg = LEVELS[record.level];
  el.levelLabel.textContent = cfg.label;
  el.qCount.textContent = cfg.count;
  showResult(record.reason);
}

function startTimer() {
  clearInterval(state.timerId);
  updateTimerDisplay();
  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    updateTimerDisplay();
    if (state.timeLeft <= 0) {
      endRound('time');
    }
  }, 1000);
}

function updateTimerDisplay() {
  el.timer.textContent = `${Math.max(0, state.timeLeft)}s`;
  el.timer.classList.toggle('low', state.timeLeft <= 10);
}

function renderQuestion() {
  const p = state.problems[state.index];
  el.qIndex.textContent = state.index + 1;
  renderQuestionShape(p);
  el.answerInput.value = '';
  el.answerInput.focus();
}

// Stacked (column-arithmetic) layout for simple two-operand +/-/×
// problems; plain inline text for everything else (division, multi-term
// expressions) — shape-based per problem.stackable, not by level.
function renderQuestionShape(p) {
  el.question.classList.toggle('question--stacked', p.stackable);
  el.question.innerHTML = '';

  if (!p.stackable) {
    el.question.textContent = p.text;
    return;
  }

  const a = document.createElement('span');
  a.className = 'stack-a';
  a.textContent = p.a;

  const op = document.createElement('span');
  op.className = 'stack-op';
  op.textContent = p.op;

  const b = document.createElement('span');
  b.className = 'stack-b';
  b.textContent = p.b;

  const rule = document.createElement('span');
  rule.className = 'stack-rule';

  el.question.append(a, op, b, rule);
}

function submitAnswer() {
  if (state.ended) return;
  const raw = el.answerInput.value.trim();
  if (raw === '') return;
  const val = Number(raw);
  const p = state.problems[state.index];
  const correct = val === p.answer;

  state.results[state.index] = correct ? 'correct' : 'wrong';
  flashFeedback(correct ? 'Correct' : `Wrong — it was ${p.answer}`, correct);

  if (state.index === state.problems.length - 1) {
    endRound('finished');
    return;
  }

  state.index += 1;
  setTimeout(renderQuestion, 250);
}

function flashFeedback(msg, ok) {
  el.feedback.textContent = msg;
  el.feedback.className = `feedback ${ok ? 'ok' : 'bad'}`;
}

// Marks the round ended and persists it — no screen change. Used both by
// normal endings (endRound) and by abandoning a round to start another
// level, where we don't want to flash the abandoned result on screen.
function finalizeRound(reason) {
  if (state.ended) return;
  state.ended = true;
  state.endedAt = Date.now();
  clearInterval(state.timerId);
  window.Storage.storeResult(window.SeedUtil.todayKey(), state.level, {
    deviceId: window.Storage.getDeviceId(),
    level: state.level,
    dateKey: window.SeedUtil.todayKey(),
    results: state.results.slice(),
    startedAt: state.startedAt,
    endedAt: state.endedAt,
    reason,
  });
}

function endRound(reason) {
  if (state.ended) return;
  finalizeRound(reason);
  showResult(reason);
}

function showResult(reason) {
  const cfg = LEVELS[state.level];
  const correctCount = state.results.filter((r) => r === 'correct').length;
  const elapsed = Math.round((state.endedAt - state.startedAt) / 1000);

  el.resultTitle.textContent =
    reason === 'time'
      ? 'Out of time'
      : reason === 'abandoned'
      ? 'Round abandoned'
      : correctCount === cfg.count
      ? 'Perfect round!'
      : 'Round complete';

  el.resultGrid.innerHTML = '';
  state.results.forEach((r) => {
    const sq = document.createElement('span');
    sq.className = `sq ${r}`;
    sq.textContent = r === 'correct' ? '🟩' : r === 'wrong' ? '🟥' : '⬛';
    el.resultGrid.appendChild(sq);
  });

  el.resultScore.textContent = `${correctCount}/${cfg.count} correct`;
  el.resultTime.textContent = `${elapsed}s elapsed`;

  showScreen('result');
}

function init() {
  cacheEls();
  el.puzzleNum.textContent = window.SeedUtil.puzzleNumber();

  el.levelButtons.forEach((btn) => {
    btn.addEventListener('click', () => selectLevel(btn.dataset.level));
  });

  el.backBtn.addEventListener('click', () => showScreen('select'));

  el.submitBtn.addEventListener('click', submitAnswer);
  el.answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitAnswer();
  });

  el.playAgainBtn.addEventListener('click', () => showScreen('select'));
  el.shareBtn.addEventListener('click', () => window.Share.copyResult(state, LEVELS));
}

document.addEventListener('DOMContentLoaded', init);

window.GameState = state; // exposed for share.js
