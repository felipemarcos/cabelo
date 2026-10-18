import Instance from './instance.js';
import Easing from './easing.js';

function cabelo(options) {
  return new Instance(options);
}

// The shared timeline of the page scroll, behind `cabelo.add()` and friends.
// Created on first use, so importing cabelo stays free of side effects.
let page = null;

function getPage() {
  if (!page || page.destroyed) {
    page = new Instance();
  }

  return page;
}

['add', 'hook', 'remove', 'on', 'once', 'off', 'refresh', 'render', 'scrollTo', 'stopScroll']
  .forEach((method) => {
    cabelo[method] = (...args) => getPage()[method](...args);
  });

// Destroys the shared timeline. The next `cabelo.add()` starts a new one.
cabelo.destroy = (options) => {
  const instance = page;
  page = null;

  return instance ? instance.destroy(options) : undefined;
};

cabelo.Easing = Easing;
cabelo.Instance = Instance;

export { Easing, Instance };
export default cabelo;
