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

export default is;
