import is from './is';

function flattenArray(arr) {
  return arr.reduce((a, b) => a.concat(is.arr(b) ? flattenArray(b) : b), []);
}

export const getNode = (node) => {
  return Array.from(document.querySelectorAll(node));
};

export const getTargets = (targets) => {
  if (targets == null) {
    throw new Error('Cannot tween a null target.');
  }

  if (is.str(targets)) {
    targets = getNode(targets);
  }

  if (targets instanceof NodeList || targets instanceof HTMLCollection) {
    targets = [].slice.call(targets);
  } else if (!is.arr(targets)) {
    targets = [targets];
  }

  targets = targets
    .map((target) => {
      return is.str(target) ? getNode(target) : target;
    });

  targets = flattenArray(targets);

  return targets;
}
