export function isRelativeValue(value) {
  return String(value).match(/^[a-z]+-[a-z]+$/) !== null;
}

export function relativeToAbsoluteValue(target, value, getContainerHeight, getScrollTop) {
  const anchors = value.split('-');
  const targetAnchor = anchors[0];
  const containerAnchor = anchors[1];

  const targetRect = target.getBoundingClientRect();
  const containerHeight = getContainerHeight();
  const scrollTop = getScrollTop();

  let y = 0;

  if (containerAnchor === 'top') {
    y -= 0;
  }

  if (containerAnchor === 'middle') {
    y -= containerHeight / 2;
  }

  if (containerAnchor === 'bottom') {
    y -= containerHeight;
  }

  if (targetAnchor === 'top') {
    y += (targetRect.top + scrollTop);
  }

  if (targetAnchor === 'middle') {
    y += (targetRect.top + scrollTop) + targetRect.height / 2;
  }

  if (targetAnchor === 'bottom') {
    y += (targetRect.top + scrollTop) + targetRect.height;
  }

  return y;
};
