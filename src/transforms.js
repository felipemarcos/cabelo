import { getCSSValue } from './utils/tween';

export default {
  values: {},
  prefix: (() => {
    const t = 'transform';
    return getCSSValue(document.body, t) ? t : `-webkit-${t}`;
  })()
};
