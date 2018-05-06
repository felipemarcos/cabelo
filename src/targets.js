import { getNode } from './utils/dom';

class Targets {
  constructor(targets) {
    if (targets == null) {
      throw 'Cannot tween a null target.';
    }

    return (typeof targets === 'string') ? getNode(targets) : [targets];
  }
}

export default Targets;
