import is from './is.js';

function flattenArray(arr) {
  return arr.reduce((a, b) => a.concat(is.arr(b) ? flattenArray(b) : b), []);
}

export const getNode = (node) => {
  return Array.from(document.querySelectorAll(node));
};

export const getTargets = (targets) => {
  if (targets == null) {
    throw new Error('[cabelo] Cannot tween a null target.');
  }

  if (is.str(targets)) {
    targets = getNode(targets);
  }

  if (typeof NodeList !== 'undefined' && (targets instanceof NodeList || targets instanceof HTMLCollection)) {
    targets = Array.from(targets);
  } else if (!is.arr(targets)) {
    targets = [targets];
  }

  targets = targets
    .map((target) => {
      return is.str(target) ? getNode(target) : target;
    });

  // Remove empty values and duplicates
  return flattenArray(targets)
    .filter((target, index, arr) => target != null && arr.indexOf(target) === index);
};

export function getElement(el) {
  return is.str(el) ? document.querySelector(el) : el;
}

export function isDocumentElement(el) {
  return el === document.documentElement || el === document.body || el === document.scrollingElement;
}
