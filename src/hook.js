import is from './utils/is.js';
import { toArray, warn } from './utils/index.js';
import { getFunctionValue } from './utils/tween.js';
import { getTrigger, resolvePositions } from './tween.js';

const EDGES = {
  ENTER: 'enter',
  LEAVE: 'leave'
};

/*
  Hooks call `enter` and `leave` when the scroll position crosses a point, or
  enters and leaves a range:

    { duration: 500, enter() {}, leave() {} }
    { targets: '.item', duration: ['top-bottom', 'bottom-top'], className: 'is-visible' }

  When there are multiple targets, the instance creates one hook per target.
*/
class Hook {
  constructor(t, instance, target = null, targetIndex = 0, targetCount = 1) {
    this.tween = t;
    this.instance = instance;
    this.target = target;
    this.targetIndex = targetIndex;
    this.targetCount = targetCount;
    this.edge = EDGES.LEAVE;
    this.raw = !is.und(t.duration) ? t.duration : t.at;
    this.positions = [];

    if (is.nil(this.raw)) {
      warn('A hook needs a `duration` (or `at`) value.', t);
    }

    this.measure();
  }

  measure() {
    const { target, targetIndex, targetCount } = this;

    if (is.nil(this.raw)) {
      return this;
    }

    const measured = getTrigger(this.tween.trigger, target, targetIndex, targetCount);
    const raw = toArray(getFunctionValue(this.raw, target, targetIndex, targetCount));
    const positions = resolvePositions(raw, measured, targetIndex, targetCount, this.instance);

    // A single position is a point: the hook is entered at and after it
    this.positions = raw.length === 1 ? [positions[0], Infinity] : positions;

    return this;
  }

  get start() {
    return this.positions.length ? this.positions[0] : 0;
  }

  get end() {
    const end = this.positions[this.positions.length - 1];
    return isFinite(end) ? end : this.start;
  }

  tick(scrollY, direction) {
    const [start, end] = this.positions;
    const inside = scrollY >= start && scrollY <= end;
    const details = { direction, scrollTop: scrollY, position: scrollY, target: this.target };

    if (inside) {
      if (this.edge !== EDGES.ENTER) {
        this.edge = EDGES.ENTER;
        this.enter(details);
      }
    } else {
      if (this.edge !== EDGES.LEAVE) {
        this.edge = EDGES.LEAVE;
        this.leave(details);
      }
    }
  }

  toggleClass(force) {
    const className = this.tween.className;

    if (className && this.target && this.target.classList) {
      this.target.classList.toggle(className, force);
    }
  }

  enter(details) {
    this.toggleClass(true);

    if (this.tween.enter) {
      this.tween.enter(details);
    }
  }

  leave(details) {
    this.toggleClass(false);

    if (this.tween.leave) {
      this.tween.leave(details);
    }
  }

  getMaxDuration() {
    return this.end;
  }

  revert() {
    this.toggleClass(false);
    this.edge = EDGES.LEAVE;
  }
}

export default Hook;
