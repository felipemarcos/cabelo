import {
  getUnit,
  decomposeValue,
  getAnimationType,
  mapPropToTween,
  mapPropToCSSProp
} from '../src/utils/tween';

const div = document.createElement('div');
div.setAttribute('title', 'Test');
document.body.appendChild(div);

test('decomposeValue', () => {
  const value = decomposeValue(div, 'translateY', '100px');

  expect(value.original).toBe('100px');

  expect(value.numbers).toHaveLength(1);
  expect(value.numbers[0]).toBe(100);

  expect(value.strings).toHaveLength(2);
  expect(value.strings[1]).toBe('px');
});

test('getUnit', () => {
  const units = 'px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn'.split('|');

  units.forEach((unit) => {
    expect(getUnit(`0${unit}`)).toBe(unit);
    expect(getUnit(`100${unit}`)).toBe(unit);
    expect(getUnit(`10000${unit}`)).toBe(unit);
    expect(getUnit(`10.50${unit}`)).toBe(unit);
  });
});

test('getAnimationType', () => {
  expect(getAnimationType(div, 'scaleY')).toBe('transform');
  expect(getAnimationType(div, 'translateX')).toBe('transform');
  expect(getAnimationType(div, 'width')).toBe('css');
  expect(getAnimationType(div, 'height')).toBe('css');
  expect(getAnimationType(div, 'opacity')).toBe('css');
  expect(getAnimationType(div, 'title')).toBe('attribute');
  expect(getAnimationType(div, 'blablabla')).toBeUndefined();
});

test('mapPropToTween', () => {
  const tween = {
    targets: div,
    duration: [0, 1000],
    scale: {
      duration: [0, 2000],
      value: [0, 100]
    }
  };

  const mappedTween = mapPropToTween('scale', tween.scale, tween);

  expect(mappedTween).toEqual({
    targets: div,
    duration: tween.scale.duration,
    scale: tween.scale.value
  });
});

test('mapPropToCSSProp', () => {
  expect(mapPropToCSSProp('x')).toBe('translateX');
  expect(mapPropToCSSProp('y')).toBe('translateY');
  expect(mapPropToCSSProp('color')).toBe('color');
});
