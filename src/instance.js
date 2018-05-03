import Emittery from 'emittery';

import Targets from './targets';
import Tween from './tween';
import SimpleTween from './simple-tween';

import is from './utils/is';
import { maxValue } from './utils';
import { isPropATween, mapPropToTween } from './utils/tween';

class Instance extends Emittery {
  constructor(options) {
    super(options);

    this.options = Object.assign({}, {
      container: document.documentElement,
      forceHeight: true,
      debug: false
    }, options);

    this.container = this.options.container;
    this.tweens = [];
    this.ticking = false;
    this.scrollY = 0;

    this.add = this.add.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.events();
  }

  add(t) {
    // get extra tweens from current tween if there are any
    this.getExtraTweens(t);

    // create tween
    const targets = new Targets(t.targets);

    targets.forEach((target) => {
      delete t.targets;
      const tween = new Tween({ ...t, target: target });
      this.tweens.push(tween);
    });

    return this;
  }

  hook(t) {
    const tween = new SimpleTween(t);
    this.tweens.push(tween);

    return this;
  }

  tick() {
    this.tweens
      .forEach((tween) => tween.tick(this.scrollY));
  }

  getExtraTweens(t) {
    const extraTweens = [];
    Object.keys(t).forEach((prop) => {
      if ( isPropATween(t[prop]) ) {
        extraTweens.push(
          mapPropToTween(prop, t[prop], t)
        );

        delete t[prop];
      }
    });

    extraTweens.forEach(this.add);
  }

  getScrollTop() {
    return this.container.scrollTop || 0;
  }

  getTotalDuration() {
    const durations = this.tweens
      .map((tween) => tween.getMaxDuration());

    return maxValue(durations);
  }

  getHeight() {
    return this.container.clientHeight;
  }

  //
  on() {}
  off() {}

  //
  events() {
    this.scrollEl = this.container === document.documentElement ? window : this.container;
    this.scrollEl.addEventListener('scroll', this.onScroll);
  }

  onScroll() {
    this.scrollY = this.getScrollTop();

    if (this.ticking) {
      return;
    }

    requestAnimationFrame(() => {
      this.tick();
      this.ticking = false;
    });

    this.ticking = true;
  }

  //
  reflow() {
    const height = this.getHeight();
    const duration = this.getTotalDuration();

    if (this.options.forceHeight) {
      this.container.style.height = `${height + duration}px`;
    }

    return this;
  }

  refresh() {
    this.reflow();
    return this;
  }

  destroy() {
    this.scrollEl.removeEventListener('scroll', this.onScroll);

    return this;
  }

  init() {
    this.refresh();
    this.onScroll();

    return this;
  }
}

export default Instance;
