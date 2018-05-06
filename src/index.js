import Instance from './instance';
import Easing from './easing';

let instances = [];

function skroller(options) {
  const instance = new Instance(options);
  instances.push(instance);

  return instance;
}

export { Easing };
export default skroller;
