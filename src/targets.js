import is from './utils/is';
import { getNode } from './utils/dom';

function flattenArray(arr) {
  return arr.reduce((a, b) => a.concat(is.arr(b) ? flattenArray(b) : b), []);
}

class Targets {
  constructor(targets) {
    if (targets == null) {
      throw 'Cannot tween a null target.';
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
}

export default Targets;
