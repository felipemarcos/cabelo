import Emittery from 'emittery';
import omit from 'lodash.omit';
import autoBind from 'auto-bind';

import Targets from './targets';
import Tween from './tween';
import SimpleTween from './simple-tween';

import is from './utils/is';
import { assign, maxValue } from './utils';
import { isPropATween, mapPropToTween } from './utils/tween';

const DIRECTION = {
  UP: 'up',
  DOWN: 'down'
};

const defaultOptions = {
  container: document.scrollingElement || document.documentElement,
  forceHeight: true,
  debug: false
};

class Instance {
  constructor(options) {
    this.options = assign(defaultOptions, options);

    this.container = this.options.container;
    this.tweens = [];
    this.ticking = false;
    this.began = false;
    this.lastscrollTop = 0;
    this.scrollTop = 0;

    autoBind(this);
    this.events();
  }

  add(tween) {
    // get extra tweens from current tween if there are any
    const propsToRemove = this.getNestedTweens(tween);
    tween = omit(tween, propsToRemove);

    // create new target
    const targets = new Targets(tween.targets);

    targets
      .forEach((target, targetIndex) => {
        const newTween = assign(
          omit(tween, ['targets']),
          {
            target,
            targetIndex,
            getHeight: this.getHeight,
            getScrollTop: this.getScrollTop
          }
        );

        this.tweens.push(new Tween(newTween));
      });

    return this;
  }

  hook(t) {
    this.tweens.push(new SimpleTween(t));
    return this;
  }

  tick() {
    this.tweens.forEach((tween) => tween.tick(this.scrollTop));
  }

  animate() {
    this.lastscrollTop = this.scrollTop;
    this.scrollTop = this.getScrollTop();

    if (this.ticking) {
      return;
    }

    requestAnimationFrame(() => {
      this.tick();
      this.ticking = false;

      this.emitter.emit('update', {
        scrollTop: this.scrollTop,
        direction: this.getDirection()
      });
    });

    this.ticking = true;

    if (this.scrollTop === 0 && !this.began) {
      this.began = true;
      this.emitter.emit('begin');
    }

    if (this.scrollTop >= this.getTotalDuration()) {
      this.completed = true;
      this.emitter.emit('complete');
    }
  }

  getNestedTweens(tween) {
    const removeProps = [];

    Object.keys(tween)
      .forEach((p) => {
        const values = tween[p];

        if (isPropATween(values)) {
          this.add(mapPropToTween(p, values, tween));
          removeProps.push(p);
        }
      });

    return removeProps;
  }

  getScrollTop() {
    return this.container.scrollTop || 0;
  }

  getTotalDuration() {
    const durations = this.tweens
      .map((tween) => tween.getMaxDuration());

    return maxValue(durations);
  }

  getDirection() {
    return this.scrollTop >= this.lastscrollTop ? DIRECTION.DOWN : DIRECTION.UP;
  }

  getHeight() {
    return this.container.clientHeight;
  }

  setHeight(height) {
    this.container.style.height = `${height}px`;
  }

  // emitter
  on(eventName, listener) {
    this.emitter.on(eventName, listener);
    return this;
  }

  off(eventName, listener) {
    this.emitter.off(eventName, listener);
    return this;
  }

  //
  events() {
    this.emitter = new Emittery();

    this.scrollEl = this.container === document.documentElement ? window : this.container;

    this.scrollEl.addEventListener('scroll', this.animate);

    if (typeof window.ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.refresh);
      this.resizeObserver.observe(this.container);
    } else {
      this.scrollEl.addEventListener('resize', this.animate);
    }
  }

  //
  reflow() {
    const height = this.getHeight();
    const duration = this.getTotalDuration();

    if (this.options.forceHeight) {
      this.setHeight(height + duration);
    }

    return this;
  }

  refresh() {
    this.reflow();
    return this;
  }

  destroy() {
    this.scrollEl.removeEventListener('scroll', this.animate);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    } else {
      this.scrollEl.removeEventListener('resize', this.refresh);
    }

    return this;
  }

  init() {
    this.emitter.emit('ready');

    this.refresh();
    this.animate();

    return this;
  }
}

export default Instance;
