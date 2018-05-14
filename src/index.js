import Instance from './instance';
import Easing from './easing';

let instances = [];

function cabelo(options) {
  const instance = new Instance(options);
  instances.push(instance);

  return instance;
}

export { Easing };
export default cabelo;
