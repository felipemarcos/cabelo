import {
  arrayContains,
  stringContains,
  maxValue,
  stringToHyphens
} from './index';

import { colorToRgb } from './colors';

import is from './is';

const validTransforms = ['x', 'y', 'translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skewX', 'skewY', 'perspective'];

const mappedTransforms = {
  x: 'translateX',
  y: 'translateY'
};

export function mapPropToTransform(prop) {
  return mappedTransforms[prop] || prop;
}

export function getTransformUnit(propName) {
  if (stringContains(propName, 'translate') || propName === 'perspective') return 'px';
  if (stringContains(propName, 'rotate') || stringContains(propName, 'skew')) return 'deg';
}

export function getAnimationType(el, prop) {
  if (is.dom(el) && arrayContains(validTransforms, prop)) return 'transform';
  if (is.dom(el) && (el.getAttribute(prop) || (is.svg(el) && el[prop]))) return 'attribute';
  if (is.dom(el) && (prop !== 'transform' && getCSSValue(el, prop))) return 'css';
}

export function getCSSValue(el, prop) {
  if (prop in el.style) {
    return getComputedStyle(el).getPropertyValue(stringToHyphens(prop)) || '0';
  }
}

export function validateValue(val, unit) {
  if (is.col(val)) {
    return colorToRgb(val);
  }

  const originalUnit = getUnit(val);
  const unitLess = originalUnit ? val.substr(0, val.length - originalUnit.length) : val;

  return unit && !/\s/g.test(val) ? unitLess + unit : unitLess;
}

export function decomposeValue(target, prop, val) {
  const rgx = /-?\d*\.?\d+/g;

  const originalValue = getOriginalTargetValue( target, prop );
  const unit = getUnit(val) || getUnit(originalValue) || '';

  const value = validateValue(val, unit) + '';
  const number = parseInt(value.replace(unit, ''), 10);

  return {
    original: value,
    number,
    unit
  };
}

export function getUnit(val) {
  const split = /([\+\-]?[0-9#\.]+)(%|px|pt|em|rem|in|cm|mm|ex|ch|pc|vw|vh|vmin|vmax|deg|rad|turn)?$/.exec(val);
  if (split) return split[2];
}

function getTransformValue(el, propName) {
  propName = mapPropToTransform(propName);
  const defaultUnit = getTransformUnit(propName);
  const defaultVal = stringContains(propName, 'scale') ? 1 : 0 + defaultUnit;
  const str = el.style.transform;
  if (!str) return defaultVal;
  let match = [];
  let props = [];
  let values = [];
  const rgx = /(\w+)\((.+?)\)/g;
  while (match = rgx.exec(str)) {
    props.push(match[1]);
    values.push(match[2]);
  }
  const value = values
    .filter((val, i) => props[i] === propName);

  return value.length ? value[0] : defaultVal;
}

export function getOriginalTargetValue(target, propName) {
  switch (getAnimationType(target, propName)) {
    case 'transform': return getTransformValue(target, propName);
    case 'css': return getCSSValue(target, propName);
    case 'attribute': return target.getAttribute(propName);
  }
  return target[propName] || 0;
}

export function isPropATween(prop) {
  return is.obj(prop);
}

export function mapPropToTween(propName, propValue, parentTween) {
  return {
    targets: parentTween.target || parentTween.targets,
    duration: propValue.duration,
    [propName]: propValue.value
  }
}
