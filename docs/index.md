---
layout: home

hero:
  name: cabelo
  text: Animate anything based on the scroll position
  tagline: Tiny, dependency-free, about 9 KB minified and gzipped.
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: Live examples
      link: /examples/
      target: _self
    - theme: alt
      text: View on GitHub
      link: https://github.com/felipemarcos/cabelo

features:
  - title: Anything is animatable
    details: Transforms, CSS properties, CSS variables, colors, SVG attributes, DOM properties like textContent, and plain JavaScript objects.
  - title: Pixels or elements
    details: "'top-bottom' means when the top of the element reaches the bottom of the viewport, and is measured again when the layout changes."
  - title: Predictable
    details: Overlapping tweens resolve the same way no matter how fast you scroll, so jumping around the page never leaves stale values behind.
  - title: Keyframes, easing, staggering
    details: Multiple positions per tween, CSS-like easings such as cubic-bezier() and steps(), and per-target function values.
  - title: Hooks
    details: Run code or toggle classes when the scroll position crosses a point or enters a range.
  - title: Works anywhere
    details: The document or any scroll container, vertical or horizontal. Safe to import during server-side rendering, with TypeScript types included.
---

## Install

```sh
npm install cabelo
```

Or use it straight from a CDN:

```html
<script src="https://unpkg.com/cabelo"></script>
```

## A first timeline

```js
import cabelo from 'cabelo';

cabelo()
  .add({
    targets: '.title',
    duration: [0, 1000],   // from 0px to 1000px of scroll
    y: [-200, 0],          // move from -200px to 0
    opacity: [0, 1]
  })
  .init();
```

Continue with the [getting started guide](getting-started.md).
