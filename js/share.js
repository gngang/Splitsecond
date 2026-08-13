function copyResult(state, LEVELS) {
  const cfg = LEVELS[state.level];
  const num = window.SeedUtil.puzzleNumber();
  const correctCount = state.results.filter((r) => r === 'correct').length;
  const elapsed = Math.round((state.endedAt - state.startedAt) / 1000);

  const grid = state.results
    .map((r) => (r === 'correct' ? '🟩' : r === 'wrong' ? '🟥' : '⬛'))
    .join('');

  const text =
    `Splitsecond #${num} — ${cfg.label}\n` +
    `${correctCount}/${cfg.count} in ${elapsed}s\n` +
    `${grid}`;

  navigator.clipboard.writeText(text).then(
    () => flashShareState(true),
    () => flashShareState(false, text)
  );
}

function flashShareState(ok, fallbackText) {
  const btn = document.getElementById('share-btn');
  const original = btn.textContent;
  btn.textContent = ok ? 'Copied!' : 'Copy failed — see console';
  if (!ok && fallbackText) console.log(fallbackText);
  setTimeout(() => (btn.textContent = original), 1500);
}

window.Share = { copyResult };
