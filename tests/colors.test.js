import {
  rgbToRgba,
  hexToRgba,
  hslToRgba,
  colorToRgb
} from '../src/utils/colors';

describe('colors', () => {
  test('rgb to rgba', () => {
    expect(rgbToRgba('rgb(255,255,255)')).toBe('rgba(255,255,255,1)');
  });

  test('hex to rgba', () => {
    expect(hexToRgba('#fff')).toBe('rgba(255,255,255,1)');
  });

  test('hsl to rgba', () => {
    expect(hslToRgba('hsl(0, 100%, 100%)')).toBe('rgba(255,255,255,1)');
  });

  test('any color to rgba', () => {
    expect(colorToRgb('#fff')).toBe('rgba(255,255,255,1)');
    expect(colorToRgb('rgb(255,255,255)')).toBe('rgba(255,255,255,1)');
    expect(colorToRgb('hsl(0, 100%, 100%)')).toBe('rgba(255,255,255,1)');
  });
});
