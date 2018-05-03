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

class Tween {
  constructor(tween) {
    this.defaultOptions = {
      target: null,
      duration: [],
      easing: Easing.linear,
      immediateRender: true
    };

    this.setProgress = {
      css: (t, p, v) => t.style[p] = v,
      attribute: (t, p, v) => t.setAttribute(p, v),
      transform: (t, p, v) => {
        const prop = mapPropToTransform(p);
        this.transforms[prop] = `${prop}(${v})`;
      }
    };

    this._tween = Object.assign({}, this.defaultOptions, tween);
    this.target = this._tween.target;
    this.tween  = this.normalizeTween();

    this.transforms = {};
  }

  normalizeTween() {
    const tween = { ...this._tween };

    const props = this.getProps();

    props.map((prop) => {
      tween[prop] = tween[prop].map((value) => {
        return decomposeValue( this.target, prop, value );
      });
    });

    return tween;
  }

  getProps() {
    return Object
      .keys(this._tween)
      // remove default options
      .filter( (p) => !this.defaultOptions.hasOwnProperty(p) );
  }

  getMaxDuration() {
    return maxValue(this.tween.duration);
  }

  applyFirstRender() {
    if (!this.tween.immediateRender) {
      return;
    }

    const props = this.getProps();

    props.forEach((prop) => {
      const values = this.tween[prop];
      const value = values[0].number;
      const unit = this.getUnit(prop, values);

      const type = getAnimationType(this.target, prop);
      this.setProgress[type](this.target, prop, `${value}${unit}`);
    });

    this.updateTransform();
  }

  updateTransform() {
    const transformsLength = Object.keys(this.transforms).length;

    if (!transformsLength) {
      return;
    }

    if (!this.transformString) {
      const t = 'transform';
      this.transformString = getCSSValue(document.body, t) ? t : `-webkit-${t}`;
    }

    this.target.style[this.transformString] = Object
      .keys(this.transforms)
      .map((k) => this.transforms[k])
      .join(' ');
  }

  tweenValue(start, end, position) {
    return start + (end - start) * this.tween.easing(position);
  }

  getUnit(prop, values) {
    const units = values.map((value) => value.unit);
    return units[0];
  }

  handleProp(prop, durationStart, durationEnd, index, lastIndex, scrollY) {
    const durations = this.tween.duration;
    const values = this.tween[prop];

    let start = (values[index] || {}).number;
    let end = (values[lastIndex] || {}).number;
    const unit = this.getUnit(prop, values);

    // Refactor this
    const progress = (scrollY - durationStart) / (durationEnd - durationStart);
    const tweenedValue = this.tweenValue(start, end, progress);

    const type = getAnimationType(this.target, prop);
    this.setProgress[type](this.target, prop, `${tweenedValue}${unit}`);
  }

  tick(scrollY) {
    const props = this.getProps();

    this.tween.duration
      .forEach((d, index) => {
        const lastIndex = index + 1;

        const start = d;
        const end = this.tween.duration[lastIndex];

        if (scrollY >= start && scrollY <= end) {
          props.forEach( (prop) => this.handleProp(prop, start, end, index, lastIndex, scrollY) );
          this.updateTransform();
        }
      });
  }
}

export default Tween;
