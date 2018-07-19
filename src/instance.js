import Emittery from 'emittery';
import omit from 'lodash.omit';
import autoBind from 'auto-bind';

import Tween from './tween';
import Hook from './hook';

import is from './utils/is';
import { getTargets } from './utils/dom';
import { assign, maxValue } from './utils';
import { isPropATween, mapPropToTween } from './utils/tween';
import animate from './utils/animate';

const EVENTS = {
  BEGIN: 'begin',
  COMPLETE: 'COMPLETE',
  UPDATE: 'update',
  READY: 'ready',
  SCROLL: 'scroll',
  RESIZE: 'resize'
};

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
    this.isDocument = this.container === document.documentElement || this.container === document.body;
    this.tweens = [];
    this.ticking = false;
    this.began = false;
    this.lastScrollTop = 0;
    this.scrollTop = 0;

    autoBind(this);
    this.events();
  }

  add(tween) {
    // get extra tweens from current tween if there are any
    const propsToRemove = this.getNestedTweens(tween);
    tween = omit(tween, propsToRemove);

    // create new target
    const targets = getTargets(tween.targets);

    targets
      .forEach((target, targetIndex) => {
        const newTween = assign(
          omit(tween, ['targets']),
          {
            target,
            targetIndex,
            instance: this
          }
        );

        this.tweens.push(new Tween(newTween));
      });

    return this;
  }

  hook(t) {
    this.tweens.push(new Hook(t));
    return this;
  }

  tick() {
    this.tweens.forEach((tween) => tween.tick(this.scrollTop));
  }

  animate() {
    this.lastScrollTop = this.scrollTop;
    this.scrollTop = this.getScrollTop();

    if (this.ticking) {
      return;
    }

    requestAnimationFrame(() => {
      this.tick();
      this.ticking = false;

      this.emitter.emit(EVENTS.UPDATE, {
        scrollTop: this.scrollTop,
        direction: this.getDirection()
      });
    });

    this.ticking = true;

    if (this.scrollTop === 0 && !this.began) {
      this.began = true;
      this.emitter.emit(EVENTS.BEGIN);
    }

    if (this.scrollTop >= this.getTotalDuration()) {
      this.completed = true;
      this.emitter.emit(EVENTS.COMPLETE);
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

  setScrollTop(newScrollTop) {
    if (this.isDocument) {
      window.scrollTo(0, newScrollTop);
    } else {
      this.container.scrollTop = newScrollTop;
    }
  }

  getTotalDuration() {
    const durations = this.tweens
      .map((tween) => tween.getMaxDuration());

    return maxValue(durations);
  }

  getDirection() {
    return this.scrollTop >= this.lastScrollTop ? DIRECTION.DOWN : DIRECTION.UP;
  }

  getClientHeight() {
    return this.container.clientHeight;
  }

  getHeight() {
    return this.container.offsetHeight;
  }

  setHeight(height) {
    this.container.style.height = `${height}px`;
  }

  unsetHeight() {
    this.container.style.height = '';
  }

  scrollTo(to, duration) {
    const from = this.getScrollTop();

    if (to === 'start') {
      to = 0;
    }

    if (to === 'end') {
      to = this.getHeight();
    }

    const props = { duration, from, to };

    return animate(props, this.setScrollTop);
  }

  on(eventName, listener) {
    this.emitter.on(eventName, listener);
    return this;
  }

  off(eventName, listener) {
    this.emitter.off(eventName, listener);
    return this;
  }

  events() {
    this.emitter = new Emittery();

    this.scrollEl = this.isDocument ? window : this.container;

    this.scrollEl.addEventListener(EVENTS.SCROLL, this.animate);

    if (typeof window.ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this.refresh);
      this.resizeObserver.observe(this.container);
    } else {
      this.scrollEl.addEventListener(EVENTS.RESIZE, this.animate);
    }
  }

  reflow() {
    const height = this.getClientHeight();
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
    this.scrollEl.removeEventListener(EVENTS.SCROLL, this.animate);

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    } else {
      this.scrollEl.removeEventListener(EVENTS.RESIZE, this.refresh);
    }

    this.unsetHeight();

    return this;
  }

  init() {
    this.emitter.emit(EVENTS.READY);

    this.refresh();
    this.animate();

    return this;
  }
}

export default Instance;
