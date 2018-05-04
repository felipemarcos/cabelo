import { maxValue } from './utils';

import {
  mapPropToTransform,
  getTransformUnit,
  getAnimationType,
  getCSSValue,
  validateValue,
  decomposeValue,
  getOriginalTargetValue,
  getUnit
} from './utils/tween';

import Easing from './easing';
import transforms from './transforms';

const defaultOptions = {
  id: null,
  target: null,
  duration: [],
  easing: Easing.linear,
  immediateRender: true
};

const EDGE = {
  BEFORE: 'before',
  AFTER: 'after'
};

//
const cachedTargets = [];

class Tween {
  get setProgress() {
    return {
      css: (t, p, v) => t.style[p] = v,
      attribute: (t, p, v) => t.setAttribute(p, v),
      transform: (t, p, v) => {
        if (!transforms.values[this.id]) {
          transforms.values[this.id] = [];
        }

        const prop = mapPropToTransform(p);
        transforms.values[this.id][prop] = `${prop}(${v})`;
      }
    }
  }

  constructor(tween) {
    this._tween = Object.assign({}, defaultOptions, tween);
    this.tween = this.normalizeTween();
    this.target = this.tween.target;
    this.edge = null;
    this.id = this.getID();
  }

  normalizeTween() {
    const tween = { ...this._tween };
    const props = this.getProps();

    props.map((prop) => {
      tween[prop] = tween[prop].map((value) => {
        return decomposeValue( tween.target, prop, value );
      });
    });

    return tween;
  }

  getID() {
    const cachedTarget = cachedTargets
      .find((t) => t.target === this.target);

    let id = null;

    if (!cachedTarget) {
      id = Symbol();
      cachedTargets.push({ id: id, target: this.target });
    } else {
      id = cachedTarget.id;
    }

    return id;
  }

  getProps() {
    return Object
      .keys(this._tween)
      // remove default options
      .filter( (p) => !defaultOptions.hasOwnProperty(p) );
  }

  getMaxDuration() {
    return maxValue(this.tween.duration);
  }

  updateTransform() {
    const hasTransforms = Object.getOwnPropertySymbols(transforms.values).length;

    if (!hasTransforms) {
      return;
    }

    if (!transforms.values[this.id]) {
      return;
    }

    this.target.style[transforms.prefix] = Object
      .keys(transforms.values[this.id])
      .map((k) => transforms.values[this.id][k])
      .join(' ');
  }

  tweenValue(start, end, position) {
    return start + (end - start) * this.tween.easing(position);
  }

  getUnit(prop, values) {
    const units = values.map((value) => value.unit);
    return units[0];
  }

  setPropValue(prop, value) {
    const type = getAnimationType(this.target, prop);
    this.setProgress[type](this.target, prop, value);
  }

  updateProgress(prop, durationStart, durationEnd, index, nextIndex, scrollPosition) {
    const values = this.tween[prop];

    const start = (values[index] || {}).number;
    const end = (values[nextIndex] || {}).number;
    const unit = this.getUnit(prop, values);

    const progress = (scrollPosition - durationStart) / (durationEnd - durationStart);
    const tweenedValue = this.tweenValue(start, end, progress);

    this.setPropValue(prop, `${tweenedValue}${unit}`);
  }

  updateEdges(props, durations, scrollPosition) {
    const firstDuration = durations[0];
    const lastDuration = durations[durations.length - 1];
    const beforeFirst = scrollPosition < firstDuration;
    const afterLast = scrollPosition > lastDuration;

    if (beforeFirst || afterLast) {
      if (beforeFirst && this.edge !== EDGE.BEFORE || afterLast && this.edge !== EDGE.AFTER) {
        if (beforeFirst && !this.tween.immediateRender) {
          return;
        }

        props.forEach((prop) => {
          const values = this.tween[prop];
          const firstValue = values[0];
          const lastValue  = values[values.length - 1];

          const value = beforeFirst ? firstValue : lastValue;
          const unit = this.getUnit(prop, values);

          this.setPropValue(prop, `${value.number}${unit}`)
        });

        this.updateTransform();
      }

      this.edge = beforeFirst ? EDGE.BEFORE : EDGE.AFTER;
    } else if (this.edge !== null) {
      this.edge = null;
    }
  }

  updateDurations(props, durations, scrollPosition) {
    durations.forEach((duration, index) => {
      const nextIndex = index + 1;

      const start = duration;
      const end = durations[nextIndex];

      if (scrollPosition >= start && scrollPosition <= end) {
        props
          .forEach((prop) => {
            this.updateProgress(prop, start, end, index, nextIndex, scrollPosition);
          });

        this.updateTransform();
      }
    });
  }

  tick(scrollPosition) {
    const props = this.getProps();
    const durations = this.tween.duration;

    // If we are before/after the first/last duration, set the correct styles accordingly.
    this.updateEdges(props, durations, scrollPosition);

    // Update props progress
    this.updateDurations(props, durations, scrollPosition);
  }
}

export default Tween;
