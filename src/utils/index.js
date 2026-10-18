export function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

export function minValue(arr) {
  return Math.min(...arr);
}

export function stringToHyphens(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

export function assign(target, sources) {
  return Object.assign({}, target, sources);
}

export function omit(obj, keys) {
  const result = {};

  Object.keys(obj)
    .filter((key) => !arrayContains(keys, key))
    .forEach((key) => result[key] = obj[key]);

  return result;
}

export function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

export function roundTo(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function warn(...args) {
  if (typeof console !== 'undefined') {
    console.warn('[cabelo]', ...args);
  }
}
