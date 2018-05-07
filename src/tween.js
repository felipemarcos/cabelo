import { maxValue } from './utils';
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

const defaultOptions = {
  id: null,
  target: null,
  targetIndex: 0,
  duration: [],
  easing: 'linear',
  immediateRender: true,
  getHeight: null,
  getScrollTop: null
};

const EDGE = {
  BEFORE: 'before',
  AFTER: 'after'
};

import Prop from './prop';

//
const cachedTargets = [];

class Tween {
  constructor(tween) {
    this._tween = Object.assign({}, defaultOptions, tween);
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
    return getFunctionValue(this._tween.duration, this.target, this.targetIndex)
      .map((duration) => {
        if (isRelativeValue(duration)) {
          return relativeToAbsoluteValue(
            this.target,
            duration,
            this._tween.getHeight,
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
