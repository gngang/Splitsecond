// Deterministic PRNG so every player gets the same problems on a given date.
// mulberry32: fast, small, good-enough distribution for this use case.

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Turn a string into a 32-bit int seed (djb2-ish hash).
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

// Returns YYYY-MM-DD in the player's local time — deliberately local, not UTC,
// so "today" matches what the player sees on their clock.
function todayKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// One RNG per (date, level) so levels don't share a problem stream.
function getDailyRng(level, dateKey = todayKey()) {
  const seed = hashString(`${dateKey}:${level}`);
  return mulberry32(seed);
}

// Puzzle number since epoch, purely cosmetic (like Wordle's #937).
function puzzleNumber(dateKey = todayKey()) {
  const epoch = new Date('2026-01-01T00:00:00');
  const [y, m, d] = dateKey.split('-').map(Number);
  const today = new Date(y, m - 1, d);
  return Math.max(1, Math.floor((today - epoch) / 86400000) + 1);
}

window.SeedUtil = { mulberry32, hashString, todayKey, getDailyRng, puzzleNumber };
