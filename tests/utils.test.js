import {
  assign,
  maxValue,
  minMaxValue,
  stringToHyphens,
  arrayContains,
  stringContains
} from '../src/utils';

test('maxValue', () => {
  expect(maxValue([1, 2, 3, 10, 4, 5])).toBe(10);
});

test('minMaxValue', () => {
  expect(minMaxValue(250, 100, 400)).toBe(250);
  expect(minMaxValue(50, 100, 400)).toBe(100);
  expect(minMaxValue(500, 100, 400)).toBe(400);
});

test('stringToHyphens', () => {
  expect(stringToHyphens('backgroundColor')).toBe('background-color');
  expect(stringToHyphens('fontSize')).toBe('font-size');
  expect(stringToHyphens('textAlign')).toBe('text-align');
  expect(stringToHyphens('paddingTop')).toBe('padding-top');
  expect(stringToHyphens('borderRadius')).toBe('border-radius');
});

test('arrayContains', () => {
  expect(arrayContains([1, 2, 3], 1)).toBeTruthy();
  expect(arrayContains([1, 2, 3], 2)).toBeTruthy();
  expect(arrayContains([1, 2, 3], 3)).toBeTruthy();
});

test('stringContains', () => {
  expect(stringContains('test', 'es')).toBeTruthy();
  expect(stringContains('test', 'st')).toBeTruthy();
  expect(stringContains('test', 'te')).toBeTruthy();
  expect(stringContains('test', 't')).toBeTruthy();
  expect(stringContains('test', 'b')).toBeFalsy();
});
