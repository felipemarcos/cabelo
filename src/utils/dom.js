export const getNode = (node) => {
  return [].slice.call(document.querySelectorAll(node));
};
