import is from './is';

export function random (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function toArray(o) {
  if (is.arr(o)) return o;
  if (is.str(o)) o = selectString(o) || o;
  if (o instanceof NodeList || o instanceof HTMLCollection) return [].slice.call(o);
  return [o];
}

export function stringContains(str, text) {
  return str.indexOf(text) > -1;
}

export function arrayContains(arr, val) {
  return arr.some(a => a === val);
}

export function minMaxValue(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

export function maxValue(arr) {
  return Math.max(...arr);
}

export function stringToHyphens(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
