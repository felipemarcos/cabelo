import {
  rgbToRgba,
  hexToRgba,
  hslToRgba,
  colorToRgb,
  normalizeColors
} from '../src/utils/colors.js';

describe('colors', () => {
  test('rgb to rgba', () => {
    expect(rgbToRgba('rgb(255,255,255)')).toBe('rgba(255,255,255,1)');
    expect(rgbToRgba('rgb(255, 0, 10)')).toBe('rgba(255,0,10,1)');
    expect(rgbToRgba('rgba(255, 0, 10, 0.5)')).toBe('rgba(255,0,10,0.5)');
    expect(rgbToRgba('rgb(255 0 10 / 50%)')).toBe('rgba(255,0,10,0.5)');
  });

  test('hex to rgba', () => {
    expect(hexToRgba('#fff')).toBe('rgba(255,255,255,1)');
    expect(hexToRgba('#3F51B5')).toBe('rgba(63,81,181,1)');
    expect(hexToRgba('#0000')).toBe('rgba(0,0,0,0)');
    expect(hexToRgba('#ff000080')).toBe('rgba(255,0,0,0.502)');
  });

  test('hsl to rgba', () => {
    expect(hslToRgba('hsl(0, 100%, 100%)')).toBe('rgba(255,255,255,1)');
    expect(hslToRgba('hsl(0, 100%, 50%)')).toBe('rgba(255,0,0,1)');
    expect(hslToRgba('hsla(120, 100%, 50%, 0.25)')).toBe('rgba(0,255,0,0.25)');
    expect(hslToRgba('hsl(240deg 100% 50% / 10%)')).toBe('rgba(0,0,255,0.1)');
  });

  test('any color to rgba', () => {
    expect(colorToRgb('#fff')).toBe('rgba(255,255,255,1)');
    expect(colorToRgb('rgb(255,255,255)')).toBe('rgba(255,255,255,1)');
    expect(colorToRgb('hsl(0, 100%, 100%)')).toBe('rgba(255,255,255,1)');
  });

  test('named colors', () => {
    expect(colorToRgb('red')).toBe('rgba(255,0,0,1)');
    expect(colorToRgb('transparent')).toBe('rgba(0,0,0,0)');
    expect(colorToRgb('auto')).toBeUndefined();
    expect(colorToRgb('inherit')).toBeUndefined();
  });

  test('colors inside complex values', () => {
    expect(normalizeColors('0 0 10px #fff')).toBe('0 0 10px rgba(255,255,255,1)');
    expect(normalizeColors('linear-gradient(#000, rgb(255, 0, 0))'))
      .toBe('linear-gradient(rgba(0,0,0,1), rgba(255,0,0,1))');
  });
});
