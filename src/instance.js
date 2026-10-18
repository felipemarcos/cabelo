import Emitter from './utils/emitter.js';
import Tween, { reservedKeys } from './tween.js';
import Hook from './hook.js';
import Track from './track.js';

import is from './utils/is.js';
import { getElement, getTargets, isDocumentElement } from './utils/dom.js';
import { assign, maxValue, minValue, minMaxValue, omit, warn } from './utils/index.js';
import { isPropATween, mapPropToTween } from './utils/tween.js';
import { relativeToAbsoluteValue } from './utils/relative.js';
import animate from './utils/animate.js';

const EVENTS = {
  BEGIN: 'begin',
  COMPLETE: 'complete',
  UPDATE: 'update',
  READY: 'ready',
  REFRESH: 'refresh',
  SCROLL: 'scroll',
  RESIZE: 'resize'
};

const DIRECTION = {
  UP: 'up',
  DOWN: 'down'
};

const AXIS = {
  y: { scroll: 'scrollTop', client: 'clientHeight', start: 'top', size: 'height', border: 'clientTop', minSize: 'minHeight' },
  x: { scroll: 'scrollLeft', client: 'clientWidth', start: 'left', size: 'width', border: 'clientLeft', minSize: 'minWidth' }
};

const defaultOptions = {
  container: null,
  axis: 'y',
  forceHeight: true
};

// Options that a nested property tween inherits from its parent tween.
const inheritedOptions = ['easing', 'round', 'immediateRender', 'trigger'];

class Instance {
  constructor(options) {
    this.options = assign(defaultOptions, options);

    const container = getElement(this.options.container);

    if (this.options.container && !container) {
      warn('Container not found, using the document instead.', this.options.container);
    }

    this.isDocument = !container || isDocumentElement(container);
    this.container = this.isDocument ? (document.scrollingElement || document.documentElement) : container;
    this.axis = AXIS[this.options.axis] || AXIS.y;

    this.tweens = [];
    this.hooks = [];
    this.tracks = new Map();
    this.emitter = new Emitter();

    this.ticking = false;
    this.initialized = false;
    this.destroyed = false;
    this.began = false;
    this.completed = false;

    this.lastScrollTop = null;
    this.scrollTop = 0;
    this.direction = DIRECTION.DOWN;
    this.start = 0;
    this.end = 0;

    this.animate = this.animate.bind(this);
    this.refresh = this.refresh.bind(this);
    this.scheduleRefresh = this.scheduleRefresh.bind(this);
    this.setScrollTop = this.setScrollTop.bind(this);
    this.getScrollTop = this.getScrollTop.bind(this);
    this.getClientHeight = this.getClientHeight.bind(this);
  }

  /*
    Adds a tween. Properties that are objects become their own tween:
    `scale: { duration: [0, 500], value: [0, 1] }`.
  */
  add(tween) {
    // get extra tweens from current tween if there are any
    const propsToRemove = this.getNestedTweens(tween);
    tween = omit(tween, propsToRemove);

    // create new target
    const targets = getTargets(tween.targets);

    if (!targets.length) {
      warn('No targets found for', tween.targets);
    }

    targets
      .forEach((target, targetIndex) => {
        const newTween = new Tween(assign(
          omit(tween, ['targets']),
          {
            target,
            targetIndex,
            targetCount: targets.length,
            instance: this
          }
        ));

        this.tweens.push(newTween);
        this.addToTrack(newTween);
      });

    this.invalidate();

    return this;
  }

  hook(t) {
    if (is.nil(t.targets)) {
      this.hooks.push(new Hook(t, this));
    } else {
      const targets = getTargets(t.targets);

      targets.forEach((target, index) => {
        this.hooks.push(new Hook(t, this, target, index, targets.length));
      });
    }

    this.invalidate();

    return this;
  }

  // Removes every tween and hook of the given targets (or all of them) and
  // restores the original values of the animated properties.
  remove(targets) {
    const list = is.nil(targets) ? null : getTargets(targets);
    const matches = (target) => list === null || list.indexOf(target) > -1;

    this.tweens = this.tweens.filter((tween) => {
      if (!matches(tween.target)) {
        return true;
      }

      tween.revert();

      const track = this.tracks.get(tween.target);

      if (track) {
        track.remove(tween);

        if (track.isEmpty) {
          this.tracks.delete(tween.target);
        }
      }

      return false;
    });

    this.hooks = this.hooks.filter((hook) => {
      const remove = list === null || (hook.target && matches(hook.target));

      if (remove) {
        hook.revert();
      }

      return !remove;
    });

    this.invalidate();

    return this;
  }

  addToTrack(tween) {
    let track = this.tracks.get(tween.target);

    if (!track) {
      track = new Track(tween.target);
      this.tracks.set(tween.target, track);
    }

    tween.props.forEach((prop) => track.add(prop));
  }

  // After the timeline changes, an initialized instance needs to be measured again.
  invalidate() {
    this.updateBounds();

    if (this.initialized) {
      this.scheduleRefresh();
    }
  }

  // Renders every tween at the given scroll position.
  render(scrollTop = this.getScrollTop()) {
    const previous = this.lastScrollTop;

    if (previous !== null && scrollTop !== previous) {
      this.direction = scrollTop > previous ? DIRECTION.DOWN : DIRECTION.UP;
    }

    this.lastScrollTop = scrollTop;
    this.scrollTop = scrollTop;

    this.tweens.forEach((tween) => tween.tick(scrollTop));
    this.tracks.forEach((track) => track.render(scrollTop));
    this.hooks.forEach((hook) => hook.tick(scrollTop, this.direction));

    this.updateState(scrollTop);

    this.emitter.emit(EVENTS.UPDATE, {
      scrollTop,
      position: scrollTop,
      progress: this.getProgress(),
      direction: this.direction
    });

    return this;
  }

  tick() {
    return this.render(this.scrollTop);
  }

  // Emits `begin` when the scroll position moves past the start of the
  // timeline and `complete` when it reaches the end.
  updateState(scrollTop) {
    const began = scrollTop > this.start;
    const completed = scrollTop >= this.end;
    const details = { scrollTop, position: scrollTop, direction: this.direction };

    if (began && !this.began) {
      this.emitter.emit(EVENTS.BEGIN, details);
    }

    if (completed && !this.completed) {
      this.emitter.emit(EVENTS.COMPLETE, details);
    }

    this.began = began;
    this.completed = completed;
  }

  // Scroll handler. Rendering happens at most once per frame.
  animate() {
    if (this.ticking || this.destroyed) {
      return;
    }

    this.ticking = true;

    this.raf = requestAnimationFrame(() => {
      this.ticking = false;
      this.render();
    });
  }

  getNestedTweens(tween) {
    const removeProps = [];

    Object.keys(tween)
      .filter((p) => reservedKeys.indexOf(p) === -1)
      .forEach((p) => {
        const values = tween[p];

        if (isPropATween(values)) {
          this.add(this.inheritOptions(mapPropToTween(p, values, tween), tween));
          removeProps.push(p);
        }
      });

    return removeProps;
  }

  inheritOptions(child, parent) {
    const hasPosition = ['duration', 'from', 'to'].some((key) => !is.nil(child[key]));

    if (!hasPosition) {
      ['duration', 'from', 'to'].forEach((key) => {
        if (!is.nil(parent[key])) {
          child[key] = parent[key];
        }
      });
    }

    inheritedOptions.forEach((key) => {
      if (is.und(child[key]) && !is.und(parent[key])) {
        child[key] = parent[key];
      }
    });

    return child;
  }

  getScrollTop() {
    return this.container[this.axis.scroll] || 0;
  }

  setScrollTop(newScrollTop) {
    if (this.isDocument) {
      const isX = this.axis === AXIS.x;
      window.scrollTo(isX ? newScrollTop : window.scrollX, isX ? window.scrollY : newScrollTop);
    } else {
      this.container[this.axis.scroll] = newScrollTop;
    }
  }

  getProgress() {
    const length = this.end - this.start;

    if (length <= 0) {
      return this.scrollTop >= this.end ? 1 : 0;
    }

    return minMaxValue((this.scrollTop - this.start) / length, 0, 1);
  }

  get progress() {
    return this.getProgress();
  }

  get duration() {
    return this.end;
  }

  getTotalDuration() {
    return this.end;
  }

  updateBounds() {
    const items = this.tweens.concat(this.hooks).filter((item) => item.positions.length);

    this.start = items.length ? minValue(items.map((item) => item.start)) : 0;
    this.end = items.length ? maxValue(items.map((item) => item.getMaxDuration())) : 0;
  }

  getDirection() {
    return this.direction;
  }

  // The size of the viewport (or the scroll container) along the scroll axis.
  getClientHeight() {
    const el = this.isDocument ? document.documentElement : this.container;
    return el[this.axis.client];
  }

  getHeight() {
    return this.container.offsetHeight;
  }

  // The start and size of an element inside the scrollable content.
  getRect(el) {
    const { start, size, border } = this.axis;
    const rect = el.getBoundingClientRect();
    let offset = this.getScrollTop();

    if (!this.isDocument) {
      offset -= this.container.getBoundingClientRect()[start] + this.container[border];
    }

    return {
      start: rect[start] + offset,
      size: rect[size]
    };
  }

  getRelativePosition(el, value) {
    if (!el || !el.getBoundingClientRect) {
      warn(`Relative position "${value}" requires a DOM element target.`);
      return 0;
    }

    return relativeToAbsoluteValue(this.getRect(el), value, this.getClientHeight());
  }

  // Element that receives the forced height: the document itself, or the
  // first child of a custom scroll container.
  getSizeTarget() {
    if (this.isDocument) {
      return this.container;
    }

    return getElement(this.options.content) || this.container.firstElementChild;
  }

  setHeight(height) {
    const target = this.getSizeTarget();
    const value = `${height}px`;

    if (target && target.style[this.axis.minSize] !== value) {
      target.style[this.axis.minSize] = value;
    }
  }

  unsetHeight() {
    const target = this.getSizeTarget();

    if (target) {
      target.style[this.axis.minSize] = '';
    }
  }

  /*
    Smoothly scrolls to a position.
    @param {number|string|Element} to A position, 'start' (0), 'end' (the end of
      the timeline), an element or a selector
    @param {number} duration Duration in seconds
    @param {string|array|function} easing
    @returns {Promise<boolean>} Resolves with `false` if it was cancelled by another scroll
  */
  scrollTo(to, duration = 0, easing) {
    const from = this.getScrollTop();

    if (to === 'start') {
      to = 0;
    } else if (to === 'end') {
      to = this.end;
    } else if (is.dom(to) || (is.str(to) && isNaN(parseFloat(to)))) {
      const el = getElement(to);

      if (!el) {
        warn('Cannot scroll to a missing element.', to);
      }

      to = el ? this.getRect(el).start : from;
    }

    this.stopScroll();

    const props = { duration, from, to: parseFloat(to) || 0, easing };
    this.scrolling = animate(props, this.setScrollTop);

    return this.scrolling;
  }

  stopScroll() {
    if (this.scrolling) {
      this.scrolling.cancel();
      this.scrolling = null;
    }

    return this;
  }

  on(eventName, listener) {
    this.emitter.on(eventName, listener);
    return this;
  }

  once(eventName, listener) {
    this.emitter.once(eventName, listener);
    return this;
  }

  off(eventName, listener) {
    this.emitter.off(eventName, listener);
    return this;
  }

  events() {
    this.scrollEl = this.isDocument ? window : this.container;

    this.scrollEl.addEventListener(EVENTS.SCROLL, this.animate, { passive: true });
    window.addEventListener(EVENTS.RESIZE, this.scheduleRefresh);

    if (typeof window.ResizeObserver !== 'undefined') {
      const content = this.isDocument ? document.body : this.getSizeTarget();

      this.resizeObserver = new ResizeObserver(this.scheduleRefresh);
      this.resizeObserver.observe(this.isDocument ? document.documentElement : this.container);

      if (content) {
        this.resizeObserver.observe(content);
      }
    }
  }

  // Measures the relative positions again and updates the scrollable size.
  reflow() {
    // Measure the elements without the transforms we applied to them
    const restore = [];
    this.tracks.forEach((track) => restore.push(track.suspendTransform()));

    this.tweens.forEach((tween) => tween.refresh());
    this.hooks.forEach((hook) => hook.measure());

    restore.forEach((fn) => fn());

    this.updateBounds();

    if (this.options.forceHeight) {
      this.setHeight(this.getClientHeight() + Math.max(0, this.end));
    }

    return this;
  }

  scheduleRefresh() {
    if (this.refreshing || this.destroyed) {
      return;
    }

    this.refreshing = true;

    requestAnimationFrame(() => {
      this.refreshing = false;
      this.refresh();
    });
  }

  refresh() {
    if (this.destroyed) {
      return this;
    }

    this.reflow();
    this.render();
    this.emitter.emit(EVENTS.REFRESH);

    return this;
  }

  /*
    Removes the listeners. Pass `{ revert: true }` to also restore every
    animated property to its original value.
  */
  destroy(options = {}) {
    if (this.scrollEl) {
      this.scrollEl.removeEventListener(EVENTS.SCROLL, this.animate);
      window.removeEventListener(EVENTS.RESIZE, this.scheduleRefresh);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    cancelAnimationFrame(this.raf);
    this.stopScroll();

    if (this.options.forceHeight) {
      this.unsetHeight();
    }

    if (options.revert) {
      this.tweens.forEach((tween) => tween.revert());
      this.hooks.forEach((hook) => hook.revert());
      this.tracks.forEach((track) => track.revert());
    }

    this.destroyed = true;
    this.initialized = false;

    return this;
  }

  init() {
    if (this.initialized) {
      return this.refresh();
    }

    this.destroyed = false;
    this.initialized = true;

    this.events();
    this.refresh();

    this.emitter.emit(EVENTS.READY);

    return this;
  }
}

export default Instance;
