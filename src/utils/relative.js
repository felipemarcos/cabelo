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

export function parseRelativeValue(value) {
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

export function isRelativeValue(value) {
  return parseRelativeValue(value) !== null;
}

/*
  Converts a relative position to an absolute scroll position.
  @param {object} rect The target `start` offset and `size` inside the scrollable content
  @param {string} value The relative position, e.g. 'top-bottom'
  @param {number} viewportSize The size of the viewport (or scroll container)
  @returns {number}
*/
export function relativeToAbsoluteValue(rect, value, viewportSize) {
  const relative = parseRelativeValue(value);

  if (!relative) {
    return 0;
  }

  const offset = relative.percent ? viewportSize * relative.offset / 100 : relative.offset;

  return rect.start + rect.size * relative.target - viewportSize * relative.viewport + offset;
}
