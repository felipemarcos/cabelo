// Cubic bezier timing function, as defined by CSS `cubic-bezier(x1, y1, x2, y2)`.
// Solves x(t) with Newton's method and falls back to bisection when the slope
// is too flat for Newton to converge.

const EPSILON = 1e-7;
const NEWTON_ITERATIONS = 8;
const BISECTION_ITERATIONS = 40;

const linear = (x) => x;

export default function bezier(x1, y1, x2, y2) {
  if (!(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1)) {
    throw new Error('[cabelo] Bezier x values must be in the [0, 1] range.');
  }

  if (x1 === y1 && x2 === y2) {
    return linear;
  }

  // Polynomial coefficients, with P0 = (0, 0) and P3 = (1, 1)
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx;

  function solveT(x) {
    let t = x;

    for (let i = 0; i < NEWTON_ITERATIONS; i++) {
      const error = sampleX(t) - x;

      if (Math.abs(error) < EPSILON) {
        return t;
      }

      const slope = slopeX(t);

      if (Math.abs(slope) < 1e-6) {
        break;
      }

      t -= error / slope;
    }

    let lo = 0;
    let hi = 1;
    t = x;

    for (let i = 0; i < BISECTION_ITERATIONS; i++) {
      const value = sampleX(t);

      if (Math.abs(value - x) < EPSILON) {
        break;
      }

      if (x > value) {
        lo = t;
      } else {
        hi = t;
      }

      t = (lo + hi) / 2;
    }

    return t;
  }

  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return sampleY(solveT(x));
  };
}
