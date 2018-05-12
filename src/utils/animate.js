import {
  minMaxValue
} from './index';

/*
  Animate a prop in x seconds
  @param {object}
  @param {function}
  @returns {Promise} A promise that resolves when the animation is complete
*/
export default function animate (props, update = () => {}) {
  let now = 0;
  let startTime = 0;
  let engineTime = 0;
  let engineDuration = props.duration * 1000;

  let raf;
  let resolve = null;
  const promise = new Promise(_resolve => resolve = _resolve);

  const step = (t) => {
    now = t;

    if (!startTime) {
      startTime = now;
    }

    engineTime = now - startTime;

    let elapsed = minMaxValue(engineTime, 0, engineDuration) / engineDuration;

    // Duration might be zero seconds, we add this to prevent division by zero.
    elapsed = isNaN(elapsed) ? 1 : elapsed;

    const progress = props.from + (elapsed * (props.to - props.from));
    update(Math.round(progress));

    if (engineTime < engineDuration) {
      play();
    } else {
      resolve();
    }
  }

  const play = (t) => {
    raf = requestAnimationFrame(step);
  };

  play();

  return promise;
};
