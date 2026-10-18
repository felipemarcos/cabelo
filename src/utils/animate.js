import { minMaxValue } from './index.js';
import { normalizeEasing } from '../easing.js';

/*
  Animate a value from `props.from` to `props.to` in `props.duration` seconds.
  @param {object} props `{ from, to, duration, easing }`
  @param {function} update Called on every frame with the current value
  @returns {Promise} A promise that resolves when the animation is complete.
    The promise has a `cancel()` method that stops the animation.
*/
export default function animate (props, update = () => {}) {
  const duration = (props.duration || 0) * 1000;
  const easing = normalizeEasing(props.easing || 'ease-in-out-cubic');

  let startTime = null;
  let raf = null;
  let resolve = null;
  let cancelled = false;

  const promise = new Promise(_resolve => resolve = _resolve);

  const step = (now) => {
    if (cancelled) {
      return;
    }

    if (startTime === null) {
      startTime = now;
    }

    const elapsed = now - startTime;
    // Duration might be zero seconds, so we jump straight to the end.
    const progress = duration > 0 ? minMaxValue(elapsed / duration, 0, 1) : 1;

    update(Math.round(props.from + easing(progress) * (props.to - props.from)));

    if (progress < 1) {
      raf = requestAnimationFrame(step);
    } else {
      resolve(true);
    }
  };

  raf = requestAnimationFrame(step);

  promise.cancel = () => {
    cancelled = true;
    cancelAnimationFrame(raf);
    resolve(false);
  };

  return promise;
};
