// Problem generators. Each takes an rng() -> [0,1) function and returns
// { text, answer }. Called sequentially against one rng instance so the
// same level on the same date always yields the same 10 problems, in order.

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

const Generators = {
  easy(rng) {
    const op = pick(rng, ['+', '-']);
    let a = randInt(rng, 1, 20);
    let b = randInt(rng, 1, 20);
    if (op === '-' && b > a) [a, b] = [b, a]; // keep it non-negative
    const answer = op === '+' ? a + b : a - b;
    return { text: `${a} ${op} ${b}`, answer };
  },

  medium(rng) {
    const op = pick(rng, ['+', '-', '*', '/']);
    if (op === '*') {
      const a = randInt(rng, 2, 12);
      const b = randInt(rng, 2, 12);
      return { text: `${a} × ${b}`, answer: a * b };
    }
    if (op === '/') {
      const b = randInt(rng, 2, 12);
      const answer = randInt(rng, 2, 12);
      const a = b * answer; // guarantees a clean integer division
      return { text: `${a} ÷ ${b}`, answer };
    }
    let a = randInt(rng, 10, 99);
    let b = randInt(rng, 10, 99);
    if (op === '-' && b > a) [a, b] = [b, a];
    const answer = op === '+' ? a + b : a - b;
    return { text: `${a} ${op} ${b}`, answer };
  },

  hard(rng) {
    // Two-step expressions respecting order of operations.
    const shape = pick(rng, ['mul_add', 'sq', 'triple']);
    if (shape === 'mul_add') {
      const a = randInt(rng, 2, 12);
      const b = randInt(rng, 2, 12);
      const c = randInt(rng, 1, 20);
      const sign = pick(rng, ['+', '-']);
      const answer = sign === '+' ? a * b + c : a * b - c;
      return { text: `${a} × ${b} ${sign} ${c}`, answer };
    }
    if (shape === 'sq') {
      const a = randInt(rng, 2, 15);
      const c = randInt(rng, 1, 30);
      const sign = pick(rng, ['+', '-']);
      const answer = sign === '+' ? a * a + c : a * a - c;
      return { text: `${a}² ${sign} ${c}`, answer };
    }
    // triple: a + b * c
    const a = randInt(rng, 1, 20);
    const b = randInt(rng, 2, 9);
    const c = randInt(rng, 2, 9);
    const answer = a + b * c;
    return { text: `${a} + ${b} × ${c}`, answer };
  },
};

// Build the fixed 10-question set for a level, given an rng.
function buildRound(level, rng, count = 10) {
  const gen = Generators[level];
  const out = [];
  for (let i = 0; i < count; i++) out.push(gen(rng));
  return out;
}

window.Problems = { Generators, buildRound, randInt, pick };
