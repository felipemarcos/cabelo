import {
  isRelativeValue,
  parseRelativeValue,
  relativeToAbsoluteValue
} from '../src/utils/relative.js';

test('isRelativeValue', () => {
  ['top-bottom', 'center-center', 'middle-top', 'bottom-top+100', 'top-bottom-25%', 'left-right', 'top-bottom + 50px']
    .forEach((value) => expect(isRelativeValue(value)).toBe(true));

  ['top', 'foo-bar', '100', 100, 'top-bottom+', 'ease-in']
    .forEach((value) => expect(isRelativeValue(value)).toBe(false));
});

test('parseRelativeValue', () => {
  expect(parseRelativeValue('top-bottom')).toEqual({ target: 0, viewport: 1, offset: 0, percent: false });
  expect(parseRelativeValue('center-middle-50')).toEqual({ target: 0.5, viewport: 0.5, offset: -50, percent: false });
  expect(parseRelativeValue('bottom-top+25%')).toEqual({ target: 1, viewport: 0, offset: 25, percent: true });
});

describe('relativeToAbsoluteValue', () => {
  // A 200px tall element 1000px from the top of the page, in an 800px viewport.
  const rect = { start: 1000, size: 200 };
  const viewport = 800;

  const cases = {
    'top-top': 1000,
    'top-bottom': 200,
    'top-middle': 600,
    'center-center': 700,
    'bottom-top': 1200,
    'bottom-bottom': 400,
    'top-bottom+100': 300,
    'top-bottom-100px': 100,
    'top-top+50%': 1400
  };

  Object.keys(cases).forEach((value) => {
    test(value, () => {
      expect(relativeToAbsoluteValue(rect, value, viewport)).toBe(cases[value]);
    });
  });
});
