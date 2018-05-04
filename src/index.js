import Instance from './instance';
import Easing from './easing';

let activeInstances = [];

function skroller(options) {
  const instance = new Instance(options);
  activeInstances.push(instance);

  return instance;
}

export { Easing };
export default skroller;
