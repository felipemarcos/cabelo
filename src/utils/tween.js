import {
  arrayContains,
  stringContains,
  stringToHyphens
} from './index.js';

import { colorToRgb, normalizeColors } from './colors.js';

import is from './is.js';

export { normalizeEasing } from '../easing.js';

// Transforms are always applied in this order, so that translating is not
// affected by rotating or scaling.
export const validTransforms = [
  'perspective',
  'translateX', 'translateY', 'translateZ', 'xPercent', 'yPercent',
  'rotate', 'rotateX', 'rotateY', 'rotateZ',
  'skew', 'skewX', 'skewY',
  'scale', 'scaleX', 'scaleY', 'scaleZ'
];

const mappedCSSProps = {
  x: 'translateX',
  y: 'translateY',
  z: 'translateZ'
};

const NUMBER_RGX = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
const UNIT_RGX = /([+-]?[0-9#.]+)(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vmin|vmax|svh|lvh|dvh|svw|lvw|dvw|vw|vh|deg|rad|grad|turn)?$/;

export function mapPropToCSSProp(prop) {
  return mappedCSSProps[prop] || prop;
}

// Transforms that aren't CSS functions of their own. `xPercent` and `yPercent`
// translate by a percentage of the element's size, on top of `x` and `y`.
const transformFunctions = {
  xPercent: (value) => `translate(${value}, 0)`,
  yPercent: (value) => `translate(0, ${value})`
};

export function transformToString(propName, value) {
  const fn = transformFunctions[propName];
  return fn ? fn(value) : `${propName}(${value})`;
}

export function getTransformUnit(propName) {
  if (propName in transformFunctions) return '%';
  if (stringContains(propName, 'translate') || propName === 'perspective') return 'px';
  if (stringContains(propName, 'rotate') || stringContains(propName, 'skew')) return 'deg';
}

export function getAnimationType(el, prop) {
  if (!is.dom(el)) {
    return el != null && typeof el === 'object' ? 'object' : undefined;
  }

  if (prop.indexOf('--') === 0) return 'var';
  if (arrayContains(validTransforms, prop)) return 'transform';
  if (el.getAttribute(prop) != null || (is.svg(el) && prop in el)) return 'attribute';
  if (prop !== 'transform' && getCSSValue(el, prop)) return 'css';
  if (prop in el) return 'object';
}

export function getCSSValue(el, prop) {
  if (prop.indexOf('--') === 0) {
    return getComputedStyle(el).getPropertyValue(prop).trim() || el.style.getPropertyValue(prop).trim() || '0';
  }

  if (prop in el.style) {
    return getComputedStyle(el).getPropertyValue(stringToHyphens(prop)) || '0';
  }
}

export function getUnit(val) {
  const split = UNIT_RGX.exec(val);
  if (split) return split[2];
}

export function validateValue(val, unit) {
  const color = colorToRgb(val);

  if (color) {
    return color;
  }

  if (is.str(val) && /\s|\(/.test(val)) {
    return normalizeColors(val);
  }

  const originalUnit = getUnit(val);
  const unitLess = originalUnit ? String(val).slice(0, -originalUnit.length) : val;
  const isNumeric = /^[-+]?\d*\.?\d+(e[-+]?\d+)?$/i.test(String(unitLess).trim());

  return unit && isNumeric ? unitLess + unit : unitLess;
}

export function getFunctionValue(val, el, index, total) {
  if (!is.fnc(val)) return val;
  return val(el, index, total);
}

/*
  Splits a value in numbers and the strings between them, so
  'rgba(255,0,0,1)' becomes [255, 0, 0, 1] and ['rgba(', ',', ',', ',', ')'].
*/
export function decomposeValue(target, prop, val, originalValue = getOriginalTargetValue(target, prop)) {
  const unit = getUnit(val) || getUnit(originalValue);
  const value = validateValue(val, unit) + '';
  const numbers = value.match(NUMBER_RGX);

  return {
    original: value,
    numbers: numbers ? numbers.map(Number) : [],
    strings: (is.str(val) || unit) ? value.split(NUMBER_RGX) : [],
    isColor: is.rgb(value) && !/\s/.test(value)
  };
}

export function composeValue(numbers, strings) {
  if (!strings.length) {
    return numbers[0];
  }

  return strings.reduce((output, string, index) => {
    return output + string + (index < numbers.length ? numbers[index] : '');
  }, '');
}

export function getTransformValue(el, propName) {
  const defaultUnit = getTransformUnit(propName);
  const defaultVal = stringContains(propName, 'scale') ? 1 : 0 + (defaultUnit || '');
  const str = el.style.transform;

  if (!str) {
    return defaultVal;
  }

  const value = parseTransform(str)
    .filter((t) => t.name === propName)
    .map((t) => t.value);

  return value.length ? value[0] : defaultVal;
}

export function parseTransform(str) {
  const rgx = /(\w+)\(([^)]*)\)/g;
  const transforms = [];
  let match;

  while ((match = rgx.exec(str || ''))) {
    transforms.push({ name: match[1], value: match[2] });
  }

  return transforms;
}

export function getOriginalTargetValue(target, propName) {
  switch (getAnimationType(target, propName)) {
    case 'transform': return getTransformValue(target, propName);
    case 'var':
    case 'css': return getCSSValue(target, propName);
    case 'attribute': return target.getAttribute(propName);
  }
  return target[propName] || 0;
}

export function isRelativeOperator(value) {
  return is.str(value) && /^(\*=|\+=|-=)/.test(value);
}

export function getRelativeValue(to, from) {
  const operator = /^(\*=|\+=|-=)/.exec(to);

  if (!operator) {
    return to;
  }

  const u = getUnit(to) || getUnit(from) || '';
  const x = parseFloat(from) || 0;
  const y = parseFloat(to.replace(operator[0], ''));

  switch (operator[0][0]) {
    case '+': return x + y + u;
    case '-': return x - y + u;
    case '*': return x * y + u;
  }
}

export function isPropATween(prop) {
  return is.obj(prop);
}

export function mapPropToTween(propName, propValue, parentTween) {
  const tween = {
    targets: parentTween.targets,
    duration: propValue.duration,
    [propName]: is.und(propValue.value) ? propValue.values : propValue.value
  };

  ['from', 'to', 'easing', 'round', 'immediateRender', 'trigger', 'onEnter', 'onLeave', 'onUpdate']
    .forEach((key) => {
      if (!is.und(propValue[key])) {
        tween[key] = propValue[key];
      }
    });

  return tween;
}

export const setTweenProgress = {
  css: (t, p, v) => t.style[p] = v,
  var: (t, p, v) => t.style.setProperty(p, v),
  attribute: (t, p, v) => t.setAttribute(p, v),
  object: (t, p, v) => t[p] = v
};
