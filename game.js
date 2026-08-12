const LEVELS = {
  easy: { label: 'Easy', seconds: 60, count: 10 },
  medium: { label: 'Medium', seconds: 75, count: 10 },
  hard: { label: 'Hard', seconds: 90, count: 10 },
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

function startTimer() {
  clearInterval(state.timerId);
  updateTimerDisplay();
  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    updateTimerDisplay();
    if (state.timeLeft <= 0) {
      endRound(false, 'time');
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
  el.question.textContent = p.text;
  el.answerInput.value = '';
  el.answerInput.focus();
}

function submitAnswer() {
  if (state.ended) return;
  const raw = el.answerInput.value.trim();
  if (raw === '') return;
  const val = Number(raw);
  const p = state.problems[state.index];
  const correct = val === p.answer;

  state.results[state.index] = correct ? 'correct' : 'wrong';

  if (!correct) {
    flashFeedback(`Wrong — it was ${p.answer}`, false);
    endRound(false, 'wrong');
    return;
  }

  flashFeedback('Correct', true);

  if (state.index === state.problems.length - 1) {
    endRound(true, 'finished');
    return;
  }

  state.index += 1;
  setTimeout(renderQuestion, 250);
}

function flashFeedback(msg, ok) {
  el.feedback.textContent = msg;
  el.feedback.className = `feedback ${ok ? 'ok' : 'bad'}`;
}

function endRound(won, reason) {
  if (state.ended) return;
  state.ended = true;
  state.endedAt = Date.now();
  clearInterval(state.timerId);
  showResult(won, reason);
}

function showResult(won, reason) {
  const cfg = LEVELS[state.level];
  const correctCount = state.results.filter((r) => r === 'correct').length;
  const elapsed = Math.round((state.endedAt - state.startedAt) / 1000);

  el.resultTitle.textContent = won
    ? 'Solved it!'
    : reason === 'time'
    ? 'Out of time'
    : 'Wrong answer';

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
    btn.addEventListener('click', () => startLevel(btn.dataset.level));
  });

  el.submitBtn.addEventListener('click', submitAnswer);
  el.answerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitAnswer();
  });

  el.playAgainBtn.addEventListener('click', () => showScreen('select'));
  el.shareBtn.addEventListener('click', () => window.Share.copyResult(state, LEVELS));
}

document.addEventListener('DOMContentLoaded', init);

window.GameState = state; // exposed for share.js
