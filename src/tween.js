import { assign, maxValue, minValue, warn } from './utils/index.js';
import is from './utils/is.js';
import { getFunctionValue, normalizeEasing } from './utils/tween.js';
import { getElement } from './utils/dom.js';
import { isRelativeValue } from './utils/relative.js';

import Prop from './prop.js';

export const defaultOptions = {
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
  instance: null
};

// Keys that configure a tween instead of describing an animated property.
export const reservedKeys = Object.keys(defaultOptions).concat(['targets']);

const EDGE = {
  BEFORE: 'before',
  INSIDE: 'inside',
  AFTER: 'after'
};

/*
  Normalizes the different ways of defining when a tween happens:
  `duration: [0, 1000]`, `duration: 1000`, `from: 200, to: 800` or `to: 800`.
*/
export function getRawPositions(options) {
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
export function resolvePosition(position, target, instance) {
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
export function getTrigger(trigger, target, index, total) {
  if (is.nil(trigger)) {
    return target;
  }

  const el = getElement(getFunctionValue(trigger, target, index, total));

  if (!el) {
    warn('Trigger not found.', trigger);
  }

  return el || target;
}

export function resolvePositions(raw, target, index, total, instance) {
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
    this._tween = assign(defaultOptions, tween);
    this.target = this._tween.target;
    this.targetIndex = this._tween.targetIndex;
    this.instance = this._tween.instance;

    this.easing = normalizeEasing(this._tween.easing);
    this.rawPositions = getRawPositions(this._tween);
    this.positions = [];
    this.edge = null;

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

  revert() {
    this.updateClass(null);
    this.edge = null;
  }
}

export default Tween;
