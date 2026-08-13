// Problem generators. Each takes an rng() -> [0,1) function and returns
// { text, answer }. Called sequentially against one rng instance so the
// same level on the same date always yields the same 10 problems, in order.
//
// Level bands: easy = elementary, medium = middle/high school,
// hard = adult. Hard is only harder via bigger numbers/more steps, not
// a tighter clock — timers are shared config in game.js.

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

const Generators = {
  // Elementary: single-step, all 4 operations, small clean operands.
  easy(rng) {
    const op = pick(rng, ['+', '-', '*', '/']);
    if (op === '*') {
      const a = randInt(rng, 2, 10);
      const b = randInt(rng, 2, 10);
      return { text: `${a} × ${b}`, answer: a * b };
    }
    if (op === '/') {
      const b = randInt(rng, 2, 10);
      const answer = randInt(rng, 2, 10);
      const a = b * answer; // guarantees a clean integer division
      return { text: `${a} ÷ ${b}`, answer };
    }
    let a = randInt(rng, 1, 50);
    let b = randInt(rng, 1, 50);
    if (op === '-' && b > a) [a, b] = [b, a]; // keep it non-negative
    const answer = op === '+' ? a + b : a - b;
    return { text: `${a} ${op} ${b}`, answer };
  },

  // Middle/high school: two-step order-of-operations, negatives,
  // percentages, simple linear equations.
  medium(rng) {
    const shape = pick(rng, ['mul_add', 'sq', 'negative_sub', 'percent', 'linear_eq']);

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
    if (shape === 'negative_sub') {
      const a = randInt(rng, 1, 50);
      const b = randInt(rng, 1, 50); // no swap — answer can go negative
      return { text: `${a} - ${b}`, answer: a - b };
    }
    if (shape === 'percent') {
      const p = pick(rng, [10, 20, 25, 50]);
      const n = randInt(rng, 1, 20) * 20; // multiple of 20 divides all of the above cleanly
      return { text: `${p}% of ${n}`, answer: (p * n) / 100 };
    }
    // linear_eq: mx + c = result, solve for x
    const m = randInt(rng, 2, 12);
    const x = randInt(rng, 2, 15);
    const c = randInt(rng, 1, 30);
    const result = m * x + c;
    return { text: `${m}x + ${c} = ${result}`, answer: x };
  },

  // Adult: same problem shapes conceptually, just bigger — 2-digit
  // multiplication, 3-step expressions, cubes, larger division/percentages.
  hard(rng) {
    const shape = pick(rng, ['mul2digit', 'three_step', 'cube', 'percent_big', 'div_big']);

    if (shape === 'mul2digit') {
      const a = randInt(rng, 11, 99);
      const b = randInt(rng, 11, 99);
      return { text: `${a} × ${b}`, answer: a * b };
    }
    if (shape === 'three_step') {
      const a = randInt(rng, 2, 20);
      const b = randInt(rng, 2, 20);
      const c = randInt(rng, 2, 12);
      const d = randInt(rng, 1, 50);
      return { text: `(${a} + ${b}) × ${c} - ${d}`, answer: (a + b) * c - d };
    }
    if (shape === 'cube') {
      const a = randInt(rng, 3, 12);
      const c = randInt(rng, 1, 50);
      const sign = pick(rng, ['+', '-']);
      const answer = sign === '+' ? a * a * a + c : a * a * a - c;
      return { text: `${a}³ ${sign} ${c}`, answer };
    }
    if (shape === 'percent_big') {
      const p = pick(rng, [10, 20, 25, 50, 75]);
      const n = randInt(rng, 5, 100) * 20; // multiple of 20 divides all of the above cleanly
      return { text: `${p}% of ${n}`, answer: (p * n) / 100 };
    }
    // div_big: multi-digit division
    const divisor = randInt(rng, 11, 30);
    const answer = randInt(rng, 11, 40);
    const a = divisor * answer; // guarantees a clean integer division
    return { text: `${a} ÷ ${divisor}`, answer };
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
