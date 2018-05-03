import Instance from './instance';
import Easing from './easing';

let activeInstances = [];
window.instances = activeInstances;

function skroller(options) {
  const instance = new Instance(options);
  activeInstances.push(instance);

  return instance;
}

export { Easing };
export default skroller;
