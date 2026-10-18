import is from './is.js';

const CSS_KEYWORDS = ['inherit', 'initial', 'unset', 'revert', 'currentcolor'];

// Matches hex, rgb(a) and hsl(a) colors inside a larger string, e.g. a box-shadow.
const COLOR_RGX = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|(?:rgba?|hsla?)\([^)]*\)/gi;

const namedColors = {};

function channels(value) {
  // Supports both `rgb(1, 2, 3, .5)` and `rgb(1 2 3 / 50%)`
  return value
    .slice(value.indexOf('(') + 1, value.lastIndexOf(')'))
    .split(/[\s,/]+/)
    .filter(Boolean);
}

function alpha(value) {
  if (is.und(value)) {
    return 1;
  }

  return /%$/.test(value) ? parseFloat(value) / 100 : parseFloat(value);
}

export function rgbToRgba(rgbValue) {
  const values = channels(rgbValue);

  if (values.length < 3) {
    return rgbValue;
  }

  const [r, g, b] = values.map((value) => {
    return /%$/.test(value) ? Math.round(parseFloat(value) * 2.55) : parseFloat(value);
  });

  return `rgba(${r},${g},${b},${alpha(values[3])})`;
}

export function hexToRgba(hexValue) {
  let hex = hexValue.replace('#', '');

  if (hex.length <= 4) {
    hex = hex.split('').map((char) => char + char).join('');
  }

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? Math.round(parseInt(hex.slice(6, 8), 16) / 255 * 1000) / 1000 : 1;

  return `rgba(${r},${g},${b},${a})`;
}

export function hslToRgba(hslValue) {
  const values = channels(hslValue);
  const h = (parseFloat(values[0]) % 360 + 360) % 360 / 360;
  const s = parseFloat(values[1]) / 100;
  const l = parseFloat(values[2]) / 100;
  const a = alpha(values[3]);

  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
}

// Resolves named colors (`red`, `transparent`, ...) using the browser itself.
export function namedColorToRgba(name) {
  if (!is.str(name) || !/^[a-z]+$/i.test(name) || typeof document === 'undefined' || !document.body) {
    return;
  }

  const key = name.toLowerCase();

  if (CSS_KEYWORDS.indexOf(key) > -1) {
    return;
  }

  if (!(key in namedColors)) {
    const el = document.createElement('i');
    el.style.color = key;

    let color;

    if (el.style.color) {
      document.body.appendChild(el);
      color = getComputedStyle(el).color;
      document.body.removeChild(el);
    }

    namedColors[key] = is.rgb(color) ? rgbToRgba(color) : undefined;
  }

  return namedColors[key];
}

export function colorToRgb(val) {
  if (is.rgb(val)) return rgbToRgba(val);
  if (is.hex(val)) return hexToRgba(val);
  if (is.hsl(val)) return hslToRgba(val);
  return namedColorToRgba(val);
}

// Converts every color found inside `value` to rgba so that complex values
// like `0 0 10px #fff` can be interpolated number by number.
export function normalizeColors(value) {
  return value.replace(COLOR_RGX, (color) => colorToRgb(color) || color);
}
