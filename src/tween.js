import { maxValue } from './utils';

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

import Prop from './prop';

//
const cachedTargets = [];

class Tween {
  constructor(tween) {
    this._tween = Object.assign({}, defaultOptions, tween);
    this.target = this._tween.target;
    this.id     = this.getID();
    this.props  = this.getProps();
    this.edge   = null;
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

  getProps() {
    return Object
      .keys(this._tween)
      // remove default properties
      .filter( (p) => !defaultOptions.hasOwnProperty(p) )
      .map((name) => {
        return new Prop({
          id: this.id,
          target: this.target,
          name: name,
          values: this._tween[name],
          easing: this._tween.easing
        });
      });
  }

  getMaxDuration() {
    return maxValue(this._tween.duration);
  }

  updateTransform() {
    const hasTransforms = Object.getOwnPropertySymbols(transforms.values).length;

    if (!hasTransforms || !transforms.values[this.id]) {
      return;
    }

    this.target.style[transforms.prefix] = Object
      .keys(transforms.values[this.id])
      .map((k) => transforms.values[this.id][k])
      .join(' ');
  }

  updateEdges(scrollPosition) {
    const durations = this._tween.duration;

    const firstDuration = durations[0];
    const lastDuration = durations[durations.length - 1];
    const beforeFirst = scrollPosition < firstDuration;
    const afterLast = scrollPosition > lastDuration;

    if (beforeFirst || afterLast) {
      if (beforeFirst && this.edge !== EDGE.BEFORE || afterLast && this.edge !== EDGE.AFTER) {
        if (beforeFirst && !this._tween.immediateRender) {
          return;
        }

        this.props.forEach((prop) => {
          prop.updateEdge(beforeFirst, afterLast);
        });

        this.updateTransform();
      }

      this.edge = beforeFirst ? EDGE.BEFORE : EDGE.AFTER;
    } else if (this.edge !== null) {
      this.edge = null;
    }
  }

  updateProgress(scrollPosition) {
    this._tween.duration
      .forEach((duration, index) => {
        const nextIndex = index + 1;

        const start = duration;
        const end = this._tween.duration[nextIndex];

        if (scrollPosition >= start && scrollPosition <= end) {
          this.props
            .forEach((prop) => {
              prop.tick(start, end, index, nextIndex, scrollPosition);
            });

          this.updateTransform();
        }
      });
  }

  tick(scrollPosition) {
    // If we are before/after the first/last duration, set the styles accordingly.
    this.updateEdges(scrollPosition);

    // Update props progress
    this.updateProgress(scrollPosition);
  }
}

export default Tween;
