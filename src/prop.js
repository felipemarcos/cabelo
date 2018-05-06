import {
  decomposeValue,
  getAnimationType,
  mapPropToTransform,
  setTweenProgress
} from './utils/tween';

import is from './utils/is';

class Prop {
  constructor(options) {
    this.id = options.id;
    this.target  = options.target;
    this.name    = mapPropToTransform(options.name);
    this.easing  = options.easing;
    this.type    = getAnimationType(this.target, this.name);

    this.values  = options.values.map((value) => {
      return decomposeValue(this.target, this.name, value);
    });

    this.isColor = is.col(this.values[0].original);
  }

  setValue(value) {
    setTweenProgress[this.type](this.target, this.name, value, this.id);
  }

  tweenValue(start, end, position) {
    return start + (end - start) * this.easing(position);
  }

  updateEdge(beforeFirst, afterLast) {
    const values = this.values;
    const firstValues = values[0];
    const lastValues  = values[values.length - 1];

    const finalValues = beforeFirst ? firstValues : lastValues;
    const output = this.formatValue(finalValues.numbers, finalValues.strings);

    this.setValue(output);
  }

  formatValue(numbers, strings) {
    if (!strings.length) {
      return numbers[0];
    }

    return strings
      .map((string, index) => {
        const nextString = strings[index + 1];
        const number = numbers[index];

        if ( isNaN(number) ) {
          return '';
        }

        if ( !nextString ) {
          return number + ' ';
        }

        if (index === 0) {
          return string + number + nextString;
        }

        return number + nextString;
      })
      .join('');
  }

  tick(durationStart, durationEnd, index, nextIndex, scrollPosition) {
    const values = this.values;

    const start = (values[index] || {});
    const end = (values[nextIndex] || {});
    const unit = this.unit;

    const progress = (scrollPosition - durationStart) / (durationEnd - durationStart);

    const numbers = start.numbers
      .map((number, index) => {
        const endNumber = end.numbers[index];
        let tweenedValue = this.tweenValue(number, endNumber, progress);

        if (this.isColor) {
          tweenedValue = Math.round(tweenedValue);
        }

        return tweenedValue;
      });

    const strings = end.strings;
    const output  = this.formatValue(numbers, strings);

    this.setValue(output);
  }
}

export default Prop;
