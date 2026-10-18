import { parseTransform, setTweenProgress, transformToString, validTransforms } from './utils/tween.js';

const byTransformOrder = (a, b) => validTransforms.indexOf(a) - validTransforms.indexOf(b);

/*
  A track holds every animated property of a single target. Rendering asks each
  property "what is your value at this scroll position?", so overlapping tweens
  on the same property resolve the same way no matter how fast you scroll:

    - the tween that started most recently (before the current position) wins;
    - before every tween started, the earliest tween sets its first value.
*/
class Track {
  constructor(target) {
    this.target = target;
    this.props = new Map();
    this.transformOrder = [];
    this.originals = {};
    this.rendered = {};
    this.isElement = !!(target && target.style);

    this.baseTransform = this.isElement ? target.style.transform : '';
    this.renderedTransform = this.baseTransform;
  }

  add(prop) {
    const { name, type } = prop;

    if (!this.props.has(name)) {
      this.props.set(name, []);
      this.saveOriginal(prop);
    }

    if (type === 'transform' && this.transformOrder.indexOf(name) === -1) {
      this.transformOrder.push(name);
      this.transformOrder.sort(byTransformOrder);
    }

    this.props.get(name).push(prop);
  }

  remove(tween) {
    this.props.forEach((props, name) => {
      const remaining = props.filter((prop) => prop.tween !== tween);

      if (remaining.length) {
        this.props.set(name, remaining);
        return;
      }

      this.revertProp(name, props[0].type);
      this.props.delete(name);
      this.transformOrder = this.transformOrder.filter((n) => n !== name);
    });

    if (!this.transformOrder.length) {
      this.revertTransform();
    }
  }

  get isEmpty() {
    return this.props.size === 0;
  }

  saveOriginal(prop) {
    const { target, name, type } = prop;

    switch (type) {
      case 'css': this.originals[name] = target.style[name]; break;
      case 'var': this.originals[name] = target.style.getPropertyValue(name); break;
      case 'attribute': this.originals[name] = target.getAttribute(name); break;
      case 'object': this.originals[name] = target[name]; break;
    }
  }

  getActiveProp(props, position) {
    let active = null;

    props.forEach((prop) => {
      if (prop.tween.start <= position && (!active || prop.tween.start >= active.tween.start)) {
        active = prop;
      }
    });

    if (active) {
      return active;
    }

    props.forEach((prop) => {
      if (!active || prop.tween.start < active.tween.start) {
        active = prop;
      }
    });

    // `immediateRender: false` leaves the original value alone until the tween starts
    return active && active.tween._tween.immediateRender ? active : null;
  }

  render(position) {
    const transforms = {};

    this.props.forEach((props, name) => {
      const prop = this.getActiveProp(props, position);
      const type = props[0].type;

      if (type === 'transform') {
        if (prop) {
          transforms[name] = prop.valueAt(position);
        }
        return;
      }

      if (!prop) {
        this.revertProp(name, type);
        return;
      }

      this.setValue(name, type, prop.valueAt(position));
    });

    if (this.transformOrder.length) {
      this.setTransform(transforms);
    }
  }

  setValue(name, type, value) {
    if (this.rendered[name] === value) {
      return;
    }

    this.rendered[name] = value;
    setTweenProgress[type](this.target, name, value);
  }

  composeTransform(transforms) {
    const animated = this.transformOrder.filter((name) => name in transforms);

    // Keep the transforms that were already set and are not being animated
    const base = parseTransform(this.baseTransform)
      .filter((t) => animated.indexOf(t.name) === -1)
      .map((t) => `${t.name}(${t.value})`);

    return base
      .concat(animated.map((name) => transformToString(name, transforms[name])))
      .join(' ');
  }

  setTransform(transforms) {
    const transform = this.composeTransform(transforms);

    if (transform === this.renderedTransform) {
      return;
    }

    this.renderedTransform = transform;
    this.target.style.transform = transform;
  }

  revertProp(name, type) {
    if (!(name in this.rendered)) {
      return;
    }

    const original = this.originals[name];
    const target = this.target;

    delete this.rendered[name];

    switch (type) {
      case 'css': target.style[name] = original || ''; break;
      case 'var': original ? target.style.setProperty(name, original) : target.style.removeProperty(name); break;
      case 'attribute': original === null ? target.removeAttribute(name) : target.setAttribute(name, original); break;
      case 'object': target[name] = original; break;
    }
  }

  revertTransform() {
    if (this.isElement && this.renderedTransform !== this.baseTransform) {
      this.target.style.transform = this.baseTransform;
      this.renderedTransform = this.baseTransform;
    }
  }

  // Temporarily removes the animated transforms, so the target can be measured
  // without them. Returns a function that puts them back.
  suspendTransform() {
    if (!this.isElement || this.renderedTransform === this.baseTransform) {
      return () => {};
    }

    const transform = this.renderedTransform;
    this.target.style.transform = this.baseTransform;

    return () => this.target.style.transform = transform;
  }

  revert() {
    this.props.forEach((props, name) => this.revertProp(name, props[0].type));
    this.revertTransform();
  }
}

export default Track;
