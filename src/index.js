import Instance from './instance.js';
import Easing from './easing.js';

function cabelo(options) {
  return new Instance(options);
}

cabelo.Easing = Easing;
cabelo.Instance = Instance;

export { Easing, Instance };
export default cabelo;
