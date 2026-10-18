import bezier from './utils/bezier.js';
import is from './utils/is.js';
import { warn } from './utils/index.js';

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

  'ease-in-back'      : [0.600, -0.280, 0.735, 0.045],
  'ease-out-back'     : [0.175,  0.885, 0.320, 1.275],
  'ease-in-out-back'  : [0.680, -0.550, 0.265, 1.550]
};

const linear = (t) => t;

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
export function normalizeEasing(easing) {
  if (is.fnc(easing)) {
    return easing;
  }

  if (is.arr(easing)) {
    return bezier(...easing);
  }

  if (!is.str(easing)) {
    return linear;
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
      fn = linear;
    }

    cache[easing] = { fn, source: definition };
  }

  return cache[easing].fn;
}

export default Easing;
