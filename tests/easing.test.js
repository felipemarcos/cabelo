import bezier from '../src/utils/bezier.js';
import Easing, { normalizeEasing } from '../src/easing.js';

const close = (a, b, precision = 4) => expect(a).toBeCloseTo(b, precision);

describe('bezier', () => {
  test('linear curves are the identity', () => {
    const fn = bezier(0.25, 0.25, 0.75, 0.75);
    [0, 0.1, 0.33, 0.5, 0.9, 1].forEach((x) => expect(fn(x)).toBe(x));
  });

  test('matches the CSS `ease` curve', () => {
    const ease = bezier(0.25, 0.1, 0.25, 1);
    close(ease(0.25), 0.40851);
    close(ease(0.5), 0.80240);
    close(ease(0.75), 0.96046);
  });

  test('symmetric curves are 0.5 at the middle', () => {
    close(bezier(0.42, 0, 0.58, 1)(0.5), 0.5);
    close(bezier(0.42, 0, 0.58, 1)(0.3) + bezier(0.42, 0, 0.58, 1)(0.7), 1);
  });

  test('clamps the edges', () => {
    const fn = bezier(0.68, -0.55, 0.265, 1.55);
    expect(fn(0)).toBe(0);
    expect(fn(1)).toBe(1);
    expect(fn(-1)).toBe(0);
    expect(fn(2)).toBe(1);
  });

  test('supports y values outside [0, 1]', () => {
    const back = bezier(0.6, -0.28, 0.735, 0.045);
    expect(back(0.2)).toBeLessThan(0);
  });

  test('is monotonic for monotonic curves', () => {
    const fn = bezier(1, 0, 0, 1);
    let previous = 0;

    for (let x = 0; x <= 1; x += 0.01) {
      const y = fn(x);
      expect(y).toBeGreaterThanOrEqual(previous - 1e-6);
      previous = y;
    }
  });

  test('throws for invalid x values', () => {
    expect(() => bezier(1.5, 0, 0, 1)).toThrow();
  });
});

describe('normalizeEasing', () => {
  test('named easings', () => {
    Object.keys(Easing).forEach((name) => {
      const fn = normalizeEasing(name);
      expect(fn(0)).toBe(0);
      expect(fn(1)).toBe(1);
    });
  });

  test('bezier arrays', () => {
    close(normalizeEasing([0.25, 0.1, 0.25, 1])(0.5), 0.8024);
  });

  test('functions are used as they are', () => {
    const fn = (t) => t * t;
    expect(normalizeEasing(fn)).toBe(fn);
  });

  test('cubic-bezier() strings', () => {
    close(normalizeEasing('cubic-bezier(0.25, 0.1, 0.25, 1)')(0.5), 0.8024);
  });

  test('steps() strings', () => {
    const end = normalizeEasing('steps(4)');
    expect(end(0.1)).toBe(0);
    expect(end(0.3)).toBe(0.25);
    expect(end(0.99)).toBe(0.75);
    expect(end(1)).toBe(1);

    const start = normalizeEasing('steps(4, start)');
    expect(start(0.1)).toBe(0.25);
    expect(start(0.3)).toBe(0.5);
  });

  test('custom easings can be registered', () => {
    Easing['my-square'] = (t) => t * t;
    expect(normalizeEasing('my-square')(0.5)).toBe(0.25);

    Easing['my-square'] = [0.25, 0.25, 0.75, 0.75];
    expect(normalizeEasing('my-square')(0.5)).toBe(0.5);

    delete Easing['my-square'];
  });

  test('unknown easings fall back to linear', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizeEasing('nope')(0.3)).toBe(0.3);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
