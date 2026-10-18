import {
  composeValue,
  decomposeValue,
  getFunctionValue,
  getAnimationType,
  getOriginalTargetValue,
  getRelativeValue,
  isRelativeOperator,
  mapPropToCSSProp
} from './utils/tween.js';

import is from './utils/is.js';
import { roundTo } from './utils/index.js';

const linear = (t) => t;

class Prop {
  constructor(options) {
    this.tween = options.tween || null;
    this.target = options.target;
    this.targetIndex = options.targetIndex || 0;
    this.name = mapPropToCSSProp(options.name);
    this.easing = options.easing || linear;
    this.round = is.und(options.round) ? false : options.round;
    this.type = getAnimationType(this.target, this.name);

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

export default Prop;
