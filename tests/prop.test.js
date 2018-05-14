import { normalizeEasing } from '../src/utils/tween';
import Prop from '../src/prop';

const div = document.createElement('div');

const prop = new Prop({
  id: 1,
  target: div,
  targetIndex: 0,
  name: 'translateY',
  easing: normalizeEasing('linear'),
  values: [0, 100]
});

test('prop', () => {
  expect(prop.target).toBe(div);
  expect(prop.targetIndex).toBe(0);
  expect(prop.name).toBe('translateY');
  expect(prop.type).toBe('transform');
  expect(prop.isColor).toBeFalsy();

  expect(prop.values[0].original).toBe('0px');
  expect(prop.values[1].original).toBe('100px');
});

test('tween a value', () => {
  const values = [
    {start: 0, end: 100, position: 0, expected: 0},
    {start: 0, end: 100, position: 0.5, expected: 50},
    {start: 0, end: 100, position: 0.9, expected: 90},
    {start: 0, end: 100, position: 1, expected: 100},
    {start: 0, end: 100, position: 0.1, expected: 10},
    {start: 0, end: 100, position: 0.2, expected: 20},

    {start: 100, end: 360, position: 0.2, expected: 152}
  ];

  values.forEach((value) => {
    const tweenedValue = prop.tweenValue(value.start, value.end, value.position);
    expect(tweenedValue).toBe(value.expected);
  })
})
