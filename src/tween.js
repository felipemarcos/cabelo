import { assign, maxValue } from './utils';
import is from './utils/is';
import {
  getFunctionValue,
  updateTransform,
  normalizeEasing
} from './utils/tween';

import {
  isRelativeValue,
  relativeToAbsoluteValue
} from './utils/relative';

import transforms from './transforms';

import Prop from './prop';

const defaultOptions = {
  id: null,
  target: null,
  targetIndex: 0,
  duration: [],
  easing: 'linear',
  immediateRender: true,
  getClientHeight: null,
  getScrollTop: null
};

const EDGE = {
  BEFORE: 'before',
  AFTER: 'after'
};

//
const cachedTargets = [];

class Tween {
  constructor(tween) {
    this._tween = assign(defaultOptions, tween);
    this.target = this._tween.target;
    this.targetIndex = this._tween.targetIndex;

    this.id = this.getID();
    this.duration = this.getDuration();
    this.easing = normalizeEasing(this._tween.easing);
    this.props = this.getProps();
    this.edge = null;
  }

  getID() {
    const cachedTarget = cachedTargets
      .find((t) => t.target === this.target);

    if (!cachedTarget) {
      const id = Symbol();
      cachedTargets.push({ id, target: this.target });

      return id;
    }

    return cachedTarget.id;
  }

  getDuration() {
    let durations = getFunctionValue(this._tween.duration, this.target, this.targetIndex);

    if (durations.length && (this._tween.from || this._tween.to)) {
      console.warn('You can\'t use `duration` and `from` or `to` in the same tween.', this._tween);
    }

    if (this._tween.from && this._tween.to) {
      durations = [this._tween.from, this._tween.to];
    } else if (this._tween.to) {
      durations = [0, this._tween.to];
    }

    return durations
      .map((duration) => {
        if (isRelativeValue(duration)) {
          return relativeToAbsoluteValue(
            this.target,
            duration,
            this._tween.getClientHeight,
            this._tween.getScrollTop
          );
        }

        return duration;
      });
  }

  getProps() {
    return Object
      .keys(this._tween)
      // remove default properties
      .filter( (p) => !defaultOptions.hasOwnProperty(p) )
      .map((name) => {
        return new Prop({
          id: this.id,

          target: this.target,
          targetIndex: this._tween.targetIndex,

          name: name,
          values: this._tween[name],
          easing: this.easing
        });
      });
  }

  getMaxDuration() {
    return maxValue(this.duration);
  }

  updateEdges(scrollTop) {
    const durations = this.duration;

    const firstDuration = durations[0];
    const lastDuration = durations[durations.length - 1];
    const beforeFirst = scrollTop < firstDuration;
    const afterLast = scrollTop > lastDuration;

    if (beforeFirst || afterLast) {
      if (beforeFirst && this.edge !== EDGE.BEFORE || afterLast && this.edge !== EDGE.AFTER) {
        if (beforeFirst && !this._tween.immediateRender) {
          return;
        }

        this.props.forEach((prop) => {
          prop.updateEdge(beforeFirst, afterLast);
        });

        updateTransform(this.target, this.id);
      }

      this.edge = beforeFirst ? EDGE.BEFORE : EDGE.AFTER;
    } else if (this.edge !== null) {
      this.edge = null;
    }
  }

  updateProgress(scrollTop) {
    this.duration
      .forEach((duration, index) => {
        const nextIndex = index + 1;

        const start = duration;
        const end = this.duration[nextIndex];

        if (scrollTop >= start && scrollTop <= end) {
          this.props
            .forEach((prop) => {
              prop.tick({ start, end }, { index, nextIndex }, scrollTop);
            });

          updateTransform(this.target, this.id);
        }
      });
  }

  tick(scrollTop) {
    // If we are before/after the first/last duration, set the styles accordingly.
    this.updateEdges(scrollTop);

    // Update props progress
    this.updateProgress(scrollTop);
  }
}

export default Tween;
