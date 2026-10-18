/*! cabelo v0.2.1 | MIT License | https://github.com/felipemarcos/cabelo */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.cabelo = factory());
})(this, (function () { 'use strict';

  class Emitter {
    constructor() {
      this.listeners = {};
    }

    on(eventName, listener) {
      (this.listeners[eventName] = this.listeners[eventName] || []).push(listener);
    }

    once(eventName, listener) {
      const wrapper = (...args) => {
        this.off(eventName, wrapper);
        listener(...args);
      };

      wrapper.listener = listener;
      this.on(eventName, wrapper);
    }

    off(eventName, listener) {
      if (!eventName) {
        this.listeners = {};
        return;
      }

      if (!listener) {
        delete this.listeners[eventName];
        return;
      }

      const listeners = this.listeners[eventName] || [];
      this.listeners[eventName] = listeners.filter((l) => l !== listener && l.listener !== listener);
    }

    emit(eventName, ...args) {
      (this.listeners[eventName] || [])
        .slice()
        .forEach((listener) => listener(...args));
    }
  }

  function stringContains(str, text) {
    return str.indexOf(text) > -1;
  }

  function arrayContains(arr, val) {
    return arr.some(a => a === val);
  }

  function minMaxValue(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  function maxValue(arr) {
    return Math.max(...arr);
  }

  function minValue(arr) {
    return Math.min(...arr);
  }

  function stringToHyphens(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  function assign(target, sources) {
    return Object.assign({}, target, sources);
  }

  function omit(obj, keys) {
    const result = {};

    Object.keys(obj)
      .filter((key) => !arrayContains(keys, key))
      .forEach((key) => result[key] = obj[key]);

    return result;
  }

  function toArray(value) {
    return Array.isArray(value) ? value : [value];
  }

  function roundTo(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  function warn(...args) {
    if (typeof console !== 'undefined') {
      console.warn('[cabelo]', ...args);
    }
  }

  const is = {
    arr: a => Array.isArray(a),
    obj: a => Object.prototype.toString.call(a) === '[object Object]',
    svg: a => typeof SVGElement !== 'undefined' && a instanceof SVGElement,
    dom: a => !!a && (a.nodeType === 1 || is.svg(a)),
    str: a => typeof a === 'string',
    num: a => typeof a === 'number' && !isNaN(a),
    fnc: a => typeof a === 'function',
    und: a => typeof a === 'undefined',
    nil: a => a === null || typeof a === 'undefined',
    hex: a => /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(a),
    rgb: a => /^rgba?\(/i.test(a),
    hsl: a => /^hsla?\(/i.test(a),
    col: a => (is.hex(a) || is.rgb(a) || is.hsl(a))
  };

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

  function rgbToRgba(rgbValue) {
    const values = channels(rgbValue);

    if (values.length < 3) {
      return rgbValue;
    }

    const [r, g, b] = values.map((value) => {
      return /%$/.test(value) ? Math.round(parseFloat(value) * 2.55) : parseFloat(value);
    });

    return `rgba(${r},${g},${b},${alpha(values[3])})`;
  }

  function hexToRgba(hexValue) {
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

  function hslToRgba(hslValue) {
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
  function namedColorToRgba(name) {
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

  function colorToRgb(val) {
    if (is.rgb(val)) return rgbToRgba(val);
    if (is.hex(val)) return hexToRgba(val);
    if (is.hsl(val)) return hslToRgba(val);
    return namedColorToRgba(val);
  }

  // Converts every color found inside `value` to rgba so that complex values
  // like `0 0 10px #fff` can be interpolated number by number.
  function normalizeColors(value) {
    return value.replace(COLOR_RGX, (color) => colorToRgb(color) || color);
  }

  // Cubic bezier timing function, as defined by CSS `cubic-bezier(x1, y1, x2, y2)`.
  // Solves x(t) with Newton's method and falls back to bisection when the slope
  // is too flat for Newton to converge.

  const EPSILON = 1e-7;
  const NEWTON_ITERATIONS = 8;
  const BISECTION_ITERATIONS = 40;

  const linear$2 = (x) => x;

  function bezier(x1, y1, x2, y2) {
    if (!(x1 >= 0 && x1 <= 1 && x2 >= 0 && x2 <= 1)) {
      throw new Error('[cabelo] Bezier x values must be in the [0, 1] range.');
    }

    if (x1 === y1 && x2 === y2) {
      return linear$2;
    }

    // Polynomial coefficients, with P0 = (0, 0) and P3 = (1, 1)
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;

    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
    const sampleY = (t) => ((ay * t + by) * t + cy) * t;
    const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx;

    function solveT(x) {
      let t = x;

      for (let i = 0; i < NEWTON_ITERATIONS; i++) {
        const error = sampleX(t) - x;

        if (Math.abs(error) < EPSILON) {
          return t;
        }

        const slope = slopeX(t);

        if (Math.abs(slope) < 1e-6) {
          break;
        }

        t -= error / slope;
      }

      let lo = 0;
      let hi = 1;
      t = x;

      for (let i = 0; i < BISECTION_ITERATIONS; i++) {
        const value = sampleX(t);

        if (Math.abs(value - x) < EPSILON) {
          break;
        }

        if (x > value) {
          lo = t;
        } else {
          hi = t;
        }

        t = (lo + hi) / 2;
      }

      return t;
    }

    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      return sampleY(solveT(x));
    };
  }

  // Named easings. Each entry is either the four `cubic-bezier()` control points
  // or a function that maps a progress in [0, 1] to an eased progress.
  // Add your own with `Easing['my-easing'] = [x1, y1, x2, y2]`.
  const Easing = {
    'linear'            : [0.250, 0.250, 0.750, 0.750],

    'ease'              : [0.250, 0.100, 0.250, 1.000],
    'ease-in'           : [0.420, 0.000, 1.000, 1.000],
    'ease-out'          : [0.000, 0.000, 0.580, 1.000],
    'ease-in-out'       : [0.420, 0.000, 0.580, 1.000],

    'ease-in-cubic'     : [0.550, 0.055, 0.675, 0.190],
    'ease-out-cubic'    : [0.215, 0.610, 0.355, 1.000],
    'ease-in-out-cubic' : [0.645, 0.045, 0.355, 1.000],

    'ease-in-circ'      : [0.600, 0.040, 0.980, 0.335],
    'ease-out-circ'     : [0.075, 0.820, 0.165, 1.000],
    'ease-in-out-circ'  : [0.785, 0.135, 0.150, 0.860],

    'ease-in-expo'      : [0.950, 0.050, 0.795, 0.035],
    'ease-out-expo'     : [0.190, 1.000, 0.220, 1.000],
    'ease-in-out-expo'  : [1.000, 0.000, 0.000, 1.000],

    'ease-in-quad'      : [0.550, 0.085, 0.680, 0.530],
    'ease-out-quad'     : [0.250, 0.460, 0.450, 0.940],
    'ease-in-out-quad'  : [0.455, 0.030, 0.515, 0.955],

    'ease-in-quart'     : [0.895, 0.030, 0.685, 0.220],
    'ease-out-quart'    : [0.165, 0.840, 0.440, 1.000],
    'ease-in-out-quart' : [0.770, 0.000, 0.175, 1.000],

    'ease-in-quint'     : [0.755, 0.050, 0.855, 0.060],
    'ease-out-quint'    : [0.230, 1.000, 0.320, 1.000],
    'ease-in-out-quint' : [0.860, 0.000, 0.070, 1.000],

    'ease-in-sine'      : [0.470, 0.000, 0.745, 0.715],
    'ease-out-sine'     : [0.390, 0.575, 0.565, 1.000],
    'ease-in-out-sine'  : [0.445, 0.050, 0.550, 0.950],

    'ease-in-back'      : [0.600, -0.28, 0.735, 0.045],
    'ease-out-back'     : [0.175,  0.885, 0.320, 1.275],
    'ease-in-out-back'  : [0.680, -0.55, 0.265, 1.550]
  };

  const linear$1 = (t) => t;

  function steps(count, position = 'end') {
    const jumpStart = position === 'start' || position === 'jump-start';

    return (t) => {
      if (t >= 1) return 1;
      if (t <= 0) return jumpStart ? 1 / count : 0;

      const step = jumpStart ? Math.ceil(t * count) : Math.floor(t * count);
      return Math.min(step, count) / count;
    };
  }

  function parseFunction(easing) {
    const match = /^([a-z-]+)\(([^)]*)\)$/i.exec(easing.trim());

    if (!match) {
      return;
    }

    const args = match[2].split(',').map((arg) => arg.trim());

    if (match[1] === 'cubic-bezier' && args.length === 4) {
      return bezier(...args.map(Number));
    }

    if (match[1] === 'steps') {
      return steps(Math.max(1, parseInt(args[0], 10) || 1), args[1]);
    }
  }

  const cache = {};

  /*
    Turns any supported easing definition into an easing function.
    @param {string|number[]|function} easing
    @returns {function}
  */
  function normalizeEasing(easing) {
    if (is.fnc(easing)) {
      return easing;
    }

    if (is.arr(easing)) {
      return bezier(...easing);
    }

    if (!is.str(easing)) {
      return linear$1;
    }

    if (Easing[easing] !== cache[easing]?.source) {
      delete cache[easing];
    }

    if (!cache[easing]) {
      const definition = Easing[easing];
      let fn;

      if (definition) {
        fn = is.fnc(definition) ? definition : bezier(...definition);
      } else {
        fn = parseFunction(easing);
      }

      if (!fn) {
        warn(`Unknown easing "${easing}", falling back to "linear".`);
        fn = linear$1;
      }

      cache[easing] = { fn, source: definition };
    }

    return cache[easing].fn;
  }

  // Transforms are always applied in this order, so that translating is not
  // affected by rotating or scaling.
  const validTransforms = [
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

  function mapPropToCSSProp(prop) {
    return mappedCSSProps[prop] || prop;
  }

  // Transforms that aren't CSS functions of their own. `xPercent` and `yPercent`
  // translate by a percentage of the element's size, on top of `x` and `y`.
  const transformFunctions = {
    xPercent: (value) => `translate(${value}, 0)`,
    yPercent: (value) => `translate(0, ${value})`
  };

  function transformToString(propName, value) {
    const fn = transformFunctions[propName];
    return fn ? fn(value) : `${propName}(${value})`;
  }

  function getTransformUnit(propName) {
    if (propName in transformFunctions) return '%';
    if (stringContains(propName, 'translate') || propName === 'perspective') return 'px';
    if (stringContains(propName, 'rotate') || stringContains(propName, 'skew')) return 'deg';
  }

  function getAnimationType(el, prop) {
    if (!is.dom(el)) {
      return el != null && typeof el === 'object' ? 'object' : undefined;
    }

    if (prop.indexOf('--') === 0) return 'var';
    if (arrayContains(validTransforms, prop)) return 'transform';
    if (el.getAttribute(prop) != null || (is.svg(el) && prop in el)) return 'attribute';
    if (prop !== 'transform' && getCSSValue(el, prop)) return 'css';
    if (prop in el) return 'object';
  }

  function getCSSValue(el, prop) {
    if (prop.indexOf('--') === 0) {
      return getComputedStyle(el).getPropertyValue(prop).trim() || el.style.getPropertyValue(prop).trim() || '0';
    }

    if (prop in el.style) {
      return getComputedStyle(el).getPropertyValue(stringToHyphens(prop)) || '0';
    }
  }

  function getUnit(val) {
    const split = UNIT_RGX.exec(val);
    if (split) return split[2];
  }

  function validateValue(val, unit) {
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

  function getFunctionValue(val, el, index, total) {
    if (!is.fnc(val)) return val;
    return val(el, index, total);
  }

  /*
    Splits a value in numbers and the strings between them, so
    'rgba(255,0,0,1)' becomes [255, 0, 0, 1] and ['rgba(', ',', ',', ',', ')'].
  */
  function decomposeValue(target, prop, val, originalValue = getOriginalTargetValue(target, prop)) {
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

  function composeValue(numbers, strings) {
    if (!strings.length) {
      return numbers[0];
    }

    return strings.reduce((output, string, index) => {
      return output + string + (index < numbers.length ? numbers[index] : '');
    }, '');
  }

  function getTransformValue(el, propName) {
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

  function parseTransform(str) {
    const rgx = /(\w+)\(([^)]*)\)/g;
    const transforms = [];
    let match;

    while ((match = rgx.exec(str || ''))) {
      transforms.push({ name: match[1], value: match[2] });
    }

    return transforms;
  }

  function getOriginalTargetValue(target, propName) {
    switch (getAnimationType(target, propName)) {
      case 'transform': return getTransformValue(target, propName);
      case 'var':
      case 'css': return getCSSValue(target, propName);
      case 'attribute': return target.getAttribute(propName);
    }
    return target[propName] || 0;
  }

  function isRelativeOperator(value) {
    return is.str(value) && /^(\*=|\+=|-=)/.test(value);
  }

  function getRelativeValue(to, from) {
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

  function isPropATween(prop) {
    return is.obj(prop);
  }

  function mapPropToTween(propName, propValue, parentTween) {
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

  const setTweenProgress = {
    css: (t, p, v) => t.style[p] = v,
    var: (t, p, v) => t.style.setProperty(p, v),
    attribute: (t, p, v) => t.setAttribute(p, v),
    object: (t, p, v) => t[p] = v
  };

  function flattenArray(arr) {
    return arr.reduce((a, b) => a.concat(is.arr(b) ? flattenArray(b) : b), []);
  }

  const getNode = (node) => {
    return Array.from(document.querySelectorAll(node));
  };

  const getTargets = (targets) => {
    if (targets == null) {
      throw new Error('[cabelo] Cannot tween a null target.');
    }

    if (is.str(targets)) {
      targets = getNode(targets);
    }

    if (typeof NodeList !== 'undefined' && (targets instanceof NodeList || targets instanceof HTMLCollection)) {
      targets = Array.from(targets);
    } else if (!is.arr(targets)) {
      targets = [targets];
    }

    targets = targets
      .map((target) => {
        return is.str(target) ? getNode(target) : target;
      });

    // Remove empty values and duplicates
    return flattenArray(targets)
      .filter((target, index, arr) => target != null && arr.indexOf(target) === index);
  };

  function getElement(el) {
    return is.str(el) ? document.querySelector(el) : el;
  }

  function isDocumentElement(el) {
    return el === document.documentElement || el === document.body || el === document.scrollingElement;
  }

  // Relative positions describe a scroll position by aligning a point of the
  // target element with a point of the viewport (or scroll container):
  //
  //   'top-bottom'        the target's top edge meets the viewport's bottom edge
  //   'center-center'     the target's center meets the viewport's center
  //   'bottom-top+100'    100px after the target's bottom edge meets the viewport's top
  //   'top-bottom-25%'    25% of the viewport size before the target's top meets the bottom

  const ANCHORS = {
    top: 0,
    left: 0,
    start: 0,
    middle: 0.5,
    center: 0.5,
    bottom: 1,
    right: 1,
    end: 1
  };

  const RELATIVE_RGX = /^([a-z]+)-([a-z]+)(?:\s*([+-])\s*(\d*\.?\d+)(px|%)?)?$/;

  function parseRelativeValue(value) {
    const match = RELATIVE_RGX.exec(String(value).trim());

    if (!match || !(match[1] in ANCHORS) || !(match[2] in ANCHORS)) {
      return null;
    }

    const sign = match[3] === '-' ? -1 : 1;

    return {
      target: ANCHORS[match[1]],
      viewport: ANCHORS[match[2]],
      offset: match[4] ? sign * parseFloat(match[4]) : 0,
      percent: match[5] === '%'
    };
  }

  function isRelativeValue(value) {
    return parseRelativeValue(value) !== null;
  }

  /*
    Converts a relative position to an absolute scroll position.
    @param {object} rect The target `start` offset and `size` inside the scrollable content
    @param {string} value The relative position, e.g. 'top-bottom'
    @param {number} viewportSize The size of the viewport (or scroll container)
    @returns {number}
  */
  function relativeToAbsoluteValue(rect, value, viewportSize) {
    const relative = parseRelativeValue(value);

    if (!relative) {
      return 0;
    }

    const offset = relative.percent ? viewportSize * relative.offset / 100 : relative.offset;

    return rect.start + rect.size * relative.target - viewportSize * relative.viewport + offset;
  }

  const linear = (t) => t;

  // CSS properties that only accept integers, so they are always rounded
  const integerProps = ['zIndex', 'order'];

  class Prop {
    constructor(options) {
      this.tween = options.tween || null;
      this.target = options.target;
      this.targetIndex = options.targetIndex || 0;
      this.name = mapPropToCSSProp(options.name);
      this.easing = options.easing || linear;
      this.round = is.und(options.round) ? false : options.round;
      this.type = getAnimationType(this.target, this.name);

      if (this.type === 'css' && integerProps.indexOf(this.name) > -1) {
        this.round = true;
      }

      this.input = options.values;
      this.total = options.total || 1;
      // Function values may depend on the layout, so they are evaluated again on refresh
      this.isDynamic = is.fnc(this.input) || (is.arr(this.input) && this.input.some(is.fnc));
      // The value before any animation, used by single and relative values
      this.original = this.type ? getOriginalTargetValue(this.target, this.name) : null;

      this.values = this.type ? this.getValues() : [];
      this.isColor = !!this.values.length && this.values.every((value) => value.isColor);
    }

    refresh() {
      if (this.isDynamic && this.type) {
        this.values = this.getValues();
      }

      return this;
    }

    getValues() {
      const { target, targetIndex, name, original, total } = this;

      let values = getFunctionValue(this.input, target, targetIndex, total);

      // A single value animates from the current value to it
      if (!is.arr(values)) {
        values = [original, values];
      } else if (values.length === 1) {
        values = [original, values[0]];
      }

      let previous = original;

      return values
        .map((value) => getFunctionValue(value, target, targetIndex, total))
        .map((value) => {
          // Values like '+=100' are relative to the previous value
          const resolved = isRelativeOperator(value) ? getRelativeValue(value, previous) : value;
          previous = resolved;
          return resolved;
        })
        .map((value) => decomposeValue(target, name, value, original));
    }

    // Positions where each value should be reached. When there are more values
    // than positions, the values are spread evenly between the first and last position.
    getPositions() {
      const positions = this.tween ? this.tween.positions : [];

      if (positions.length === 2 && this.values.length > 2) {
        const [start, end] = positions;
        const steps = this.values.length - 1;
        return this.values.map((value, index) => start + (end - start) * index / steps);
      }

      return positions;
    }

    format(value) {
      return composeValue(value.numbers, value.strings);
    }

    tweenValue(start, end, position) {
      return start + (end - start) * this.easing(position);
    }

    interpolate(start, end, progress) {
      // Values that can't be interpolated, like 'none' or 'block', switch as soon
      // as the segment starts.
      if (!start.numbers.length || !end.numbers.length) {
        return this.format(progress > 0 ? end : start);
      }

      const eased = this.easing(progress);

      // '100px' to '50vw' can't be interpolated number by number, so we let CSS do it.
      if (this.hasMixedUnits(start, end)) {
        const from = roundTo(start.numbers[0] * (1 - eased), 4);
        const to = roundTo(end.numbers[0] * eased, 4);
        return `calc(${from}${start.strings[1]} + ${to}${end.strings[1]})`;
      }

      // Use the strings (units, separators) of the end value, unless it is a bare number
      const base = end.strings.length ? end : start;
      const isColor = start.isColor && end.isColor;

      const numbers = end.numbers
        .map((endNumber, index) => {
          const startNumber = is.und(start.numbers[index]) ? endNumber : start.numbers[index];
          let value = startNumber + (endNumber - startNumber) * eased;

          if (isColor) {
            value = index < 3 ? Math.round(value) : roundTo(value, 3);
          } else if (this.round !== false) {
            value = roundTo(value, this.round === true ? 0 : this.round);
          }

          return value;
        });

      return composeValue(numbers, base.strings);
    }

    hasMixedUnits(start, end) {
      const isDimension = (value) => value.numbers.length === 1 && value.strings.length === 2 && !value.strings[0];

      return isDimension(start) && isDimension(end) &&
        start.strings[1] !== end.strings[1] &&
        start.numbers[0] !== 0 && end.numbers[0] !== 0;
    }

    valueAt(position) {
      const values = this.values;
      const positions = this.getPositions();
      const last = Math.min(positions.length, values.length) - 1;

      if (last < 0) {
        return;
      }

      if (position < positions[0]) {
        return this.format(values[0]);
      }

      for (let i = 0; i < last; i++) {
        if (position < positions[i + 1]) {
          const progress = (position - positions[i]) / (positions[i + 1] - positions[i]);
          return this.interpolate(values[i], values[i + 1], progress);
        }
      }

      return this.format(values[last]);
    }
  }

  const defaultOptions$1 = {
    target: null,
    targetIndex: 0,
    targetCount: 1,

    duration: null,
    from: null,
    to: null,
    trigger: null,
    easing: 'linear',
    round: false,

    edgeClassName: false,
    immediateRender: true,
    instance: null,

    onEnter: null,
    onLeave: null,
    onUpdate: null
  };

  // Keys that configure a tween instead of describing an animated property.
  const reservedKeys = Object.keys(defaultOptions$1).concat(['targets']);

  const EDGE = {
    BEFORE: 'before',
    INSIDE: 'inside',
    AFTER: 'after'
  };

  /*
    Normalizes the different ways of defining when a tween happens:
    `duration: [0, 1000]`, `duration: 1000`, `from: 200, to: 800` or `to: 800`.
  */
  function getRawPositions(options) {
    const { duration, from, to } = options;
    const hasFromOrTo = !is.nil(from) || !is.nil(to);

    if (!is.nil(duration) && hasFromOrTo) {
      warn('You can\'t use `duration` and `from` or `to` in the same tween.', options);
    }

    if (hasFromOrTo) {
      if (is.nil(to)) {
        warn('`from` requires a `to` value.', options);
        return [from, from];
      }

      return [is.nil(from) ? 0 : from, to];
    }

    if (is.nil(duration)) {
      return [];
    }

    return duration;
  }

  /*
    Turns a position (a number, numeric string or relative value) into a number.
  */
  function resolvePosition(position, target, instance) {
    if (is.num(position)) {
      return position;
    }

    if (isRelativeValue(position)) {
      if (!target || !instance) {
        warn(`Relative position "${position}" requires a target element.`);
        return 0;
      }

      return instance.getRelativePosition(target, position);
    }

    const number = parseFloat(position);

    if (isNaN(number)) {
      warn(`Invalid position "${position}".`);
      return 0;
    }

    return number;
  }

  /*
    The element that relative positions are measured from: the `trigger` option
    (an element, selector or function) or the target itself.
  */
  function getTrigger(trigger, target, index, total) {
    if (is.nil(trigger)) {
      return target;
    }

    const el = getElement(getFunctionValue(trigger, target, index, total));

    if (!el) {
      warn('Trigger not found.', trigger);
    }

    return el || target;
  }

  function resolvePositions(raw, target, index, total, instance) {
    let positions = getFunctionValue(raw, target, index, total);

    if (!is.arr(positions)) {
      positions = is.nil(positions) ? [] : [0, positions];
    }

    positions = positions
      .map((position) => getFunctionValue(position, target, index, total))
      .map((position) => resolvePosition(position, target, instance));

    return positions.length === 1 ? [positions[0], positions[0]] : positions;
  }

  class Tween {
    constructor(tween) {
      this._tween = assign(defaultOptions$1, tween);
      this.target = this._tween.target;
      this.targetIndex = this._tween.targetIndex;
      this.instance = this._tween.instance;

      this.easing = normalizeEasing(this._tween.easing);
      this.rawPositions = getRawPositions(this._tween);
      this.positions = [];
      this.edge = null;

      // State of the callbacks, kept apart from `edge`, which `immediateRender` can hold back
      this.callbackEdge = null;
      this.progress = null;

      this.edgeClassNames = this.getEdgeClassNames();
      this.props = this.getProps();

      this.measure();
      this.validate();
    }

    getProps() {
      return Object
        .keys(this._tween)
        .filter((p) => reservedKeys.indexOf(p) === -1)
        .map((name) => {
          return new Prop({
            tween: this,

            target: this.target,
            targetIndex: this.targetIndex,
            total: this._tween.targetCount,

            name: name,
            values: this._tween[name],

            easing: this.easing,
            round: this._tween.round
          });
        })
        .filter((prop) => {
          if (!prop.type) {
            warn(`Can't animate "${prop.name}" on`, this.target);
          }

          return !!prop.type;
        });
    }

    getEdgeClassNames() {
      const option = this._tween.edgeClassName;

      if (!option) {
        return null;
      }

      const prefix = is.str(option) ? option : 'cabelo';

      return {
        [EDGE.BEFORE]: `${prefix}-before`,
        [EDGE.INSIDE]: `${prefix}-inside`,
        [EDGE.AFTER]: `${prefix}-after`
      };
    }

    // Calculates the scroll positions of the tween. Called again on every refresh,
    // as relative positions depend on the layout.
    measure() {
      const { trigger, targetCount } = this._tween;
      const measured = getTrigger(trigger, this.target, this.targetIndex, targetCount);

      this.positions = resolvePositions(
        this.rawPositions,
        measured,
        this.targetIndex,
        targetCount,
        this.instance
      );

      return this;
    }

    validate() {
      if (!this.positions.length) {
        warn('A tween needs a `duration` (or `from` and `to`).', this._tween);
      }

      this.props.forEach((prop) => {
        const count = prop.values.length;
        const positions = this.positions.length;

        if (count !== positions && !(positions === 2 && count > 2)) {
          warn(`"${prop.name}" has ${count} values but ${positions} positions.`);
        }
      });
    }

    // Measures the positions and evaluates function values again.
    refresh() {
      this.measure();
      this.props.forEach((prop) => prop.refresh());

      return this;
    }

    get start() {
      return this.positions.length ? minValue(this.positions) : 0;
    }

    get end() {
      return this.positions.length ? maxValue(this.positions) : 0;
    }

    getMaxDuration() {
      return this.end;
    }

    getEdge(position) {
      if (position < this.positions[0]) return EDGE.BEFORE;
      if (position > this.positions[this.positions.length - 1]) return EDGE.AFTER;
      return EDGE.INSIDE;
    }

    updateClass(className) {
      if (!this.edgeClassNames || !this.target.classList) {
        return;
      }

      const toRemove = Object.values(this.edgeClassNames)
        .filter((name) => name !== className);

      this.target.classList.remove(...toRemove);

      if (className) {
        this.target.classList.add(className);
      }
    }

    updateEdges(position) {
      const edge = this.getEdge(position);

      if (edge === this.edge) {
        return;
      }

      if (edge === EDGE.BEFORE && !this._tween.immediateRender && this.edge === null) {
        return;
      }

      this.edge = edge;

      if (this.edgeClassNames) {
        this.updateClass(this.edgeClassNames[edge]);
      }
    }

    tick(position) {
      this.updateEdges(position);
    }

    // How far through the tween a position is, from 0 to 1.
    getProgress(position) {
      const { start, end } = this;

      if (end <= start) {
        return position >= end ? 1 : 0;
      }

      return minMaxValue((position - start) / (end - start), 0, 1);
    }

    // Calls `onEnter`, `onLeave` and `onUpdate`. Runs after the targets were
    // rendered, so callbacks can read the new values.
    notify(position, direction) {
      if (!this.positions.length) {
        return;
      }

      const { onEnter, onLeave, onUpdate } = this._tween;
      const edge = this.getEdge(position);
      const previous = this.callbackEdge;
      const progress = this.getProgress(position);
      const details = { target: this.target, progress, direction, scrollTop: position, position };

      this.callbackEdge = edge;

      if (edge !== previous) {
        const isInside = edge === EDGE.INSIDE;
        const wasInside = previous === EDGE.INSIDE;
        // Jumping from one side to the other goes through the tween
        const crossed = previous !== null && !isInside && !wasInside;

        if ((isInside || crossed) && onEnter) onEnter(details);
        if ((wasInside || crossed) && onLeave) onLeave(details);
      }

      if (progress !== this.progress) {
        this.progress = progress;

        if (onUpdate) onUpdate(details);
      }
    }

    revert() {
      this.updateClass(null);
      this.edge = null;
      this.callbackEdge = null;
      this.progress = null;
    }
  }

  const EDGES = {
    ENTER: 'enter',
    LEAVE: 'leave'
  };

  /*
    Hooks call `enter` and `leave` when the scroll position crosses a point, or
    enters and leaves a range:

      { duration: 500, enter() {}, leave() {} }
      { targets: '.item', duration: ['top-bottom', 'bottom-top'], className: 'is-visible' }

    When there are multiple targets, the instance creates one hook per target.
  */
  class Hook {
    constructor(t, instance, target = null, targetIndex = 0, targetCount = 1) {
      this.tween = t;
      this.instance = instance;
      this.target = target;
      this.targetIndex = targetIndex;
      this.targetCount = targetCount;
      this.edge = EDGES.LEAVE;
      this.raw = !is.und(t.duration) ? t.duration : t.at;
      this.positions = [];

      if (is.nil(this.raw)) {
        warn('A hook needs a `duration` (or `at`) value.', t);
      }

      this.measure();
    }

    measure() {
      const { target, targetIndex, targetCount } = this;

      if (is.nil(this.raw)) {
        return this;
      }

      const measured = getTrigger(this.tween.trigger, target, targetIndex, targetCount);
      const raw = toArray(getFunctionValue(this.raw, target, targetIndex, targetCount));
      const positions = resolvePositions(raw, measured, targetIndex, targetCount, this.instance);

      // A single position is a point: the hook is entered at and after it
      this.positions = raw.length === 1 ? [positions[0], Infinity] : positions;

      return this;
    }

    get start() {
      return this.positions.length ? this.positions[0] : 0;
    }

    get end() {
      const end = this.positions[this.positions.length - 1];
      return isFinite(end) ? end : this.start;
    }

    tick(scrollY, direction) {
      const [start, end] = this.positions;
      const inside = scrollY >= start && scrollY <= end;
      const details = { direction, scrollTop: scrollY, position: scrollY, target: this.target };

      if (inside) {
        if (this.edge !== EDGES.ENTER) {
          this.edge = EDGES.ENTER;
          this.enter(details);
        }
      } else {
        if (this.edge !== EDGES.LEAVE) {
          this.edge = EDGES.LEAVE;
          this.leave(details);
        }
      }
    }

    toggleClass(force) {
      const className = this.tween.className;

      if (className && this.target && this.target.classList) {
        this.target.classList.toggle(className, force);
      }
    }

    enter(details) {
      this.toggleClass(true);

      if (this.tween.enter) {
        this.tween.enter(details);
      }
    }

    leave(details) {
      this.toggleClass(false);

      if (this.tween.leave) {
        this.tween.leave(details);
      }
    }

    getMaxDuration() {
      return this.end;
    }

    revert() {
      this.toggleClass(false);
      this.edge = EDGES.LEAVE;
    }
  }

  const byTransformOrder = (a, b) => validTransforms.indexOf(a) - validTransforms.indexOf(b);

  /*
    A track holds every animated property of a single target. Rendering asks each
    property "what is your value at this scroll position?", so overlapping tweens
    on the same property resolve the same way no matter how fast you scroll:

      - the tween that started most recently (before the current position) wins;
      - before every tween started, the earliest tween sets its first value.
  */
  class Track {
    constructor(target) {
      this.target = target;
      this.props = new Map();
      this.transformOrder = [];
      this.originals = {};
      this.rendered = {};
      this.isElement = !!(target && target.style);

      this.baseTransform = this.isElement ? target.style.transform : '';
      this.renderedTransform = this.baseTransform;
    }

    add(prop) {
      const { name, type } = prop;

      if (!this.props.has(name)) {
        this.props.set(name, []);
        this.saveOriginal(prop);
      }

      if (type === 'transform' && this.transformOrder.indexOf(name) === -1) {
        this.transformOrder.push(name);
        this.transformOrder.sort(byTransformOrder);
      }

      this.props.get(name).push(prop);
    }

    remove(tween) {
      this.props.forEach((props, name) => {
        const remaining = props.filter((prop) => prop.tween !== tween);

        if (remaining.length) {
          this.props.set(name, remaining);
          return;
        }

        this.revertProp(name, props[0].type);
        this.props.delete(name);
        this.transformOrder = this.transformOrder.filter((n) => n !== name);
      });

      if (!this.transformOrder.length) {
        this.revertTransform();
      }
    }

    get isEmpty() {
      return this.props.size === 0;
    }

    saveOriginal(prop) {
      const { target, name, type } = prop;

      switch (type) {
        case 'css': this.originals[name] = target.style[name]; break;
        case 'var': this.originals[name] = target.style.getPropertyValue(name); break;
        case 'attribute': this.originals[name] = target.getAttribute(name); break;
        case 'object': this.originals[name] = target[name]; break;
      }
    }

    getActiveProp(props, position) {
      let active = null;

      props.forEach((prop) => {
        if (prop.tween.start <= position && (!active || prop.tween.start >= active.tween.start)) {
          active = prop;
        }
      });

      if (active) {
        return active;
      }

      props.forEach((prop) => {
        if (!active || prop.tween.start < active.tween.start) {
          active = prop;
        }
      });

      // `immediateRender: false` leaves the original value alone until the tween starts
      return active && active.tween._tween.immediateRender ? active : null;
    }

    render(position) {
      const transforms = {};

      this.props.forEach((props, name) => {
        const prop = this.getActiveProp(props, position);
        const type = props[0].type;

        if (type === 'transform') {
          if (prop) {
            transforms[name] = prop.valueAt(position);
          }
          return;
        }

        if (!prop) {
          this.revertProp(name, type);
          return;
        }

        this.setValue(name, type, prop.valueAt(position));
      });

      if (this.transformOrder.length) {
        this.setTransform(transforms);
      }
    }

    setValue(name, type, value) {
      if (this.rendered[name] === value) {
        return;
      }

      this.rendered[name] = value;
      setTweenProgress[type](this.target, name, value);
    }

    composeTransform(transforms) {
      const animated = this.transformOrder.filter((name) => name in transforms);

      // Keep the transforms that were already set and are not being animated
      const base = parseTransform(this.baseTransform)
        .filter((t) => animated.indexOf(t.name) === -1)
        .map((t) => `${t.name}(${t.value})`);

      return base
        .concat(animated.map((name) => transformToString(name, transforms[name])))
        .join(' ');
    }

    setTransform(transforms) {
      const transform = this.composeTransform(transforms);

      if (transform === this.renderedTransform) {
        return;
      }

      this.renderedTransform = transform;
      this.target.style.transform = transform;
    }

    revertProp(name, type) {
      if (!(name in this.rendered)) {
        return;
      }

      const original = this.originals[name];
      const target = this.target;

      delete this.rendered[name];

      switch (type) {
        case 'css': target.style[name] = original || ''; break;
        case 'var': original ? target.style.setProperty(name, original) : target.style.removeProperty(name); break;
        case 'attribute': original === null ? target.removeAttribute(name) : target.setAttribute(name, original); break;
        case 'object': target[name] = original; break;
      }
    }

    revertTransform() {
      if (this.isElement && this.renderedTransform !== this.baseTransform) {
        this.target.style.transform = this.baseTransform;
        this.renderedTransform = this.baseTransform;
      }
    }

    // Temporarily removes the animated transforms, so the target can be measured
    // without them. Returns a function that puts them back.
    suspendTransform() {
      if (!this.isElement || this.renderedTransform === this.baseTransform) {
        return () => {};
      }

      const transform = this.renderedTransform;
      this.target.style.transform = this.baseTransform;

      return () => this.target.style.transform = transform;
    }

    revert() {
      this.props.forEach((props, name) => this.revertProp(name, props[0].type));
      this.revertTransform();
    }
  }

  /*
    Animate a value from `props.from` to `props.to` in `props.duration` seconds.
    @param {object} props `{ from, to, duration, easing }`
    @param {function} update Called on every frame with the current value
    @returns {Promise} A promise that resolves when the animation is complete.
      The promise has a `cancel()` method that stops the animation.
  */
  function animate (props, update = () => {}) {
    const duration = (props.duration || 0) * 1000;
    const easing = normalizeEasing(props.easing || 'ease-in-out-cubic');

    let startTime = null;
    let raf = null;
    let resolve = null;
    let cancelled = false;

    const promise = new Promise(_resolve => resolve = _resolve);

    const step = (now) => {
      if (cancelled) {
        return;
      }

      if (startTime === null) {
        startTime = now;
      }

      const elapsed = now - startTime;
      // Duration might be zero seconds, so we jump straight to the end.
      const progress = duration > 0 ? minMaxValue(elapsed / duration, 0, 1) : 1;

      update(Math.round(props.from + easing(progress) * (props.to - props.from)));

      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        resolve(true);
      }
    };

    raf = requestAnimationFrame(step);

    promise.cancel = () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      resolve(false);
    };

    return promise;
  }

  const EVENTS = {
    BEGIN: 'begin',
    COMPLETE: 'complete',
    UPDATE: 'update',
    READY: 'ready',
    REFRESH: 'refresh',
    SCROLL: 'scroll',
    RESIZE: 'resize'
  };

  const DIRECTION = {
    UP: 'up',
    DOWN: 'down'
  };

  const AXIS = {
    y: { scroll: 'scrollTop', client: 'clientHeight', start: 'top', size: 'height', border: 'clientTop', minSize: 'minHeight' },
    x: { scroll: 'scrollLeft', client: 'clientWidth', start: 'left', size: 'width', border: 'clientLeft', minSize: 'minWidth' }
  };

  const defaultOptions = {
    container: null,
    axis: 'y',
    forceHeight: true
  };

  // Options that a nested property tween inherits from its parent tween.
  const inheritedOptions = ['easing', 'round', 'immediateRender', 'trigger'];

  class Instance {
    constructor(options) {
      this.options = assign(defaultOptions, options);

      const container = getElement(this.options.container);

      if (this.options.container && !container) {
        warn('Container not found, using the document instead.', this.options.container);
      }

      this.isDocument = !container || isDocumentElement(container);
      this.container = this.isDocument ? (document.scrollingElement || document.documentElement) : container;
      this.axis = AXIS[this.options.axis] || AXIS.y;

      this.tweens = [];
      this.hooks = [];
      this.tracks = new Map();
      this.emitter = new Emitter();

      this.ticking = false;
      this.initialized = false;
      this.destroyed = false;
      this.began = false;
      this.completed = false;

      this.lastScrollTop = null;
      this.scrollTop = 0;
      this.direction = DIRECTION.DOWN;
      this.start = 0;
      this.end = 0;

      this.animate = this.animate.bind(this);
      this.refresh = this.refresh.bind(this);
      this.scheduleRefresh = this.scheduleRefresh.bind(this);
      this.setScrollTop = this.setScrollTop.bind(this);
      this.getScrollTop = this.getScrollTop.bind(this);
      this.getClientHeight = this.getClientHeight.bind(this);
    }

    /*
      Adds a tween. Properties that are objects become their own tween:
      `scale: { duration: [0, 500], value: [0, 1] }`.
    */
    add(tween) {
      // get extra tweens from current tween if there are any
      const propsToRemove = this.getNestedTweens(tween);
      tween = omit(tween, propsToRemove);

      // create new target
      const targets = getTargets(tween.targets);

      if (!targets.length) {
        warn('No targets found for', tween.targets);
      }

      targets
        .forEach((target, targetIndex) => {
          const newTween = new Tween(assign(
            omit(tween, ['targets']),
            {
              target,
              targetIndex,
              targetCount: targets.length,
              instance: this
            }
          ));

          this.tweens.push(newTween);
          this.addToTrack(newTween);
        });

      this.invalidate();

      return this;
    }

    hook(t) {
      if (is.nil(t.targets)) {
        this.hooks.push(new Hook(t, this));
      } else {
        const targets = getTargets(t.targets);

        targets.forEach((target, index) => {
          this.hooks.push(new Hook(t, this, target, index, targets.length));
        });
      }

      this.invalidate();

      return this;
    }

    // Removes every tween and hook of the given targets (or all of them) and
    // restores the original values of the animated properties.
    remove(targets) {
      const list = is.nil(targets) ? null : getTargets(targets);
      const matches = (target) => list === null || list.indexOf(target) > -1;

      this.tweens = this.tweens.filter((tween) => {
        if (!matches(tween.target)) {
          return true;
        }

        tween.revert();

        const track = this.tracks.get(tween.target);

        if (track) {
          track.remove(tween);

          if (track.isEmpty) {
            this.tracks.delete(tween.target);
          }
        }

        return false;
      });

      this.hooks = this.hooks.filter((hook) => {
        const remove = list === null || (hook.target && matches(hook.target));

        if (remove) {
          hook.revert();
        }

        return !remove;
      });

      this.invalidate();

      return this;
    }

    addToTrack(tween) {
      let track = this.tracks.get(tween.target);

      if (!track) {
        track = new Track(tween.target);
        this.tracks.set(tween.target, track);
      }

      tween.props.forEach((prop) => track.add(prop));
    }

    // After the timeline changes, an initialized instance needs to be measured again.
    invalidate() {
      this.updateBounds();

      if (this.initialized) {
        this.scheduleRefresh();
      }
    }

    // Renders every tween at the given scroll position.
    render(scrollTop = this.getScrollTop()) {
      const previous = this.lastScrollTop;

      if (previous !== null && scrollTop !== previous) {
        this.direction = scrollTop > previous ? DIRECTION.DOWN : DIRECTION.UP;
      }

      this.lastScrollTop = scrollTop;
      this.scrollTop = scrollTop;

      this.tweens.forEach((tween) => tween.tick(scrollTop));
      this.tracks.forEach((track) => track.render(scrollTop));
      this.tweens.forEach((tween) => tween.notify(scrollTop, this.direction));
      this.hooks.forEach((hook) => hook.tick(scrollTop, this.direction));

      this.updateState(scrollTop);

      this.emitter.emit(EVENTS.UPDATE, {
        scrollTop,
        position: scrollTop,
        progress: this.getProgress(),
        direction: this.direction
      });

      return this;
    }

    tick() {
      return this.render(this.scrollTop);
    }

    // Emits `begin` when the scroll position moves past the start of the
    // timeline and `complete` when it reaches the end.
    updateState(scrollTop) {
      const began = scrollTop > this.start;
      const completed = scrollTop >= this.end;
      const details = { scrollTop, position: scrollTop, direction: this.direction };

      if (began && !this.began) {
        this.emitter.emit(EVENTS.BEGIN, details);
      }

      if (completed && !this.completed) {
        this.emitter.emit(EVENTS.COMPLETE, details);
      }

      this.began = began;
      this.completed = completed;
    }

    // Scroll handler. Rendering happens at most once per frame.
    animate() {
      if (this.ticking || this.destroyed) {
        return;
      }

      this.ticking = true;

      this.raf = requestAnimationFrame(() => {
        this.ticking = false;
        this.render();
      });
    }

    getNestedTweens(tween) {
      const removeProps = [];

      Object.keys(tween)
        .filter((p) => reservedKeys.indexOf(p) === -1)
        .forEach((p) => {
          const values = tween[p];

          if (isPropATween(values)) {
            this.add(this.inheritOptions(mapPropToTween(p, values, tween), tween));
            removeProps.push(p);
          }
        });

      return removeProps;
    }

    inheritOptions(child, parent) {
      const hasPosition = ['duration', 'from', 'to'].some((key) => !is.nil(child[key]));

      if (!hasPosition) {
        ['duration', 'from', 'to'].forEach((key) => {
          if (!is.nil(parent[key])) {
            child[key] = parent[key];
          }
        });
      }

      inheritedOptions.forEach((key) => {
        if (is.und(child[key]) && !is.und(parent[key])) {
          child[key] = parent[key];
        }
      });

      return child;
    }

    getScrollTop() {
      return this.container[this.axis.scroll] || 0;
    }

    setScrollTop(newScrollTop) {
      if (this.isDocument) {
        const isX = this.axis === AXIS.x;
        window.scrollTo(isX ? newScrollTop : window.scrollX, isX ? window.scrollY : newScrollTop);
      } else {
        this.container[this.axis.scroll] = newScrollTop;
      }
    }

    getProgress() {
      const length = this.end - this.start;

      if (length <= 0) {
        return this.scrollTop >= this.end ? 1 : 0;
      }

      return minMaxValue((this.scrollTop - this.start) / length, 0, 1);
    }

    get progress() {
      return this.getProgress();
    }

    get duration() {
      return this.end;
    }

    getTotalDuration() {
      return this.end;
    }

    updateBounds() {
      const items = this.tweens.concat(this.hooks).filter((item) => item.positions.length);

      this.start = items.length ? minValue(items.map((item) => item.start)) : 0;
      this.end = items.length ? maxValue(items.map((item) => item.getMaxDuration())) : 0;
    }

    getDirection() {
      return this.direction;
    }

    // The size of the viewport (or the scroll container) along the scroll axis.
    getClientHeight() {
      const el = this.isDocument ? document.documentElement : this.container;
      return el[this.axis.client];
    }

    getHeight() {
      return this.container.offsetHeight;
    }

    // The start and size of an element inside the scrollable content.
    getRect(el) {
      const { start, size, border } = this.axis;
      const rect = el.getBoundingClientRect();
      let offset = this.getScrollTop();

      if (!this.isDocument) {
        offset -= this.container.getBoundingClientRect()[start] + this.container[border];
      }

      return {
        start: rect[start] + offset,
        size: rect[size]
      };
    }

    getRelativePosition(el, value) {
      if (!el || !el.getBoundingClientRect) {
        warn(`Relative position "${value}" requires a DOM element target.`);
        return 0;
      }

      return relativeToAbsoluteValue(this.getRect(el), value, this.getClientHeight());
    }

    // Element that receives the forced height: the document itself, or the
    // first child of a custom scroll container.
    getSizeTarget() {
      if (this.isDocument) {
        return this.container;
      }

      return getElement(this.options.content) || this.container.firstElementChild;
    }

    setHeight(height) {
      const target = this.getSizeTarget();
      const value = `${height}px`;

      if (target && target.style[this.axis.minSize] !== value) {
        target.style[this.axis.minSize] = value;
      }
    }

    unsetHeight() {
      const target = this.getSizeTarget();

      if (target) {
        target.style[this.axis.minSize] = '';
      }
    }

    /*
      Smoothly scrolls to a position.
      @param {number|string|Element} to A position, 'start' (0), 'end' (the end of
        the timeline), an element or a selector
      @param {number} duration Duration in seconds
      @param {string|array|function} easing
      @returns {Promise<boolean>} Resolves with `false` if it was cancelled by another scroll
    */
    scrollTo(to, duration = 0, easing) {
      const from = this.getScrollTop();

      if (to === 'start') {
        to = 0;
      } else if (to === 'end') {
        to = this.end;
      } else if (is.dom(to) || (is.str(to) && isNaN(parseFloat(to)))) {
        const el = getElement(to);

        if (!el) {
          warn('Cannot scroll to a missing element.', to);
        }

        to = el ? this.getRect(el).start : from;
      }

      this.stopScroll();

      const props = { duration, from, to: parseFloat(to) || 0, easing };
      this.scrolling = animate(props, this.setScrollTop);

      return this.scrolling;
    }

    stopScroll() {
      if (this.scrolling) {
        this.scrolling.cancel();
        this.scrolling = null;
      }

      return this;
    }

    on(eventName, listener) {
      this.emitter.on(eventName, listener);
      return this;
    }

    once(eventName, listener) {
      this.emitter.once(eventName, listener);
      return this;
    }

    off(eventName, listener) {
      this.emitter.off(eventName, listener);
      return this;
    }

    events() {
      this.scrollEl = this.isDocument ? window : this.container;

      this.scrollEl.addEventListener(EVENTS.SCROLL, this.animate, { passive: true });
      window.addEventListener(EVENTS.RESIZE, this.scheduleRefresh);

      if (typeof window.ResizeObserver !== 'undefined') {
        const content = this.isDocument ? document.body : this.getSizeTarget();

        this.resizeObserver = new ResizeObserver(this.scheduleRefresh);
        this.resizeObserver.observe(this.isDocument ? document.documentElement : this.container);

        if (content) {
          this.resizeObserver.observe(content);
        }
      }
    }

    // Measures the relative positions again and updates the scrollable size.
    reflow() {
      // Measure the elements without the transforms we applied to them
      const restore = [];
      this.tracks.forEach((track) => restore.push(track.suspendTransform()));

      this.tweens.forEach((tween) => tween.refresh());
      this.hooks.forEach((hook) => hook.measure());

      restore.forEach((fn) => fn());

      this.updateBounds();

      if (this.options.forceHeight) {
        this.setHeight(this.getClientHeight() + Math.max(0, this.end));
      }

      return this;
    }

    scheduleRefresh() {
      if (this.refreshing || this.destroyed) {
        return;
      }

      this.refreshing = true;

      requestAnimationFrame(() => {
        this.refreshing = false;
        this.refresh();
      });
    }

    refresh() {
      if (this.destroyed) {
        return this;
      }

      this.reflow();
      this.render();
      this.emitter.emit(EVENTS.REFRESH);

      return this;
    }

    /*
      Removes the listeners. Pass `{ revert: true }` to also restore every
      animated property to its original value.
    */
    destroy(options = {}) {
      if (this.scrollEl) {
        this.scrollEl.removeEventListener(EVENTS.SCROLL, this.animate);
        window.removeEventListener(EVENTS.RESIZE, this.scheduleRefresh);
      }

      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }

      cancelAnimationFrame(this.raf);
      this.stopScroll();

      if (this.options.forceHeight) {
        this.unsetHeight();
      }

      if (options.revert) {
        this.tweens.forEach((tween) => tween.revert());
        this.hooks.forEach((hook) => hook.revert());
        this.tracks.forEach((track) => track.revert());
      }

      this.destroyed = true;
      this.initialized = false;

      return this;
    }

    init() {
      if (this.initialized) {
        return this.refresh();
      }

      this.destroyed = false;
      this.initialized = true;

      this.events();
      this.refresh();

      this.emitter.emit(EVENTS.READY);

      return this;
    }
  }

  function cabelo(options) {
    return new Instance(options);
  }

  cabelo.Easing = Easing;
  cabelo.Instance = Instance;

  // The UMD build exposes a single function. `Easing` and `Instance` are
  // available as `cabelo.Easing` and `cabelo.Instance`.

  return cabelo;

}));
