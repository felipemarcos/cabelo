# Recipes

Patterns for common scroll effects. Most of them have a live version in the [examples](https://felipemarcos.github.io/cabelo/examples/).

- [Reveal elements as they enter the screen](#reveal-elements-as-they-enter-the-screen)
- [Parallax layers](#parallax-layers)
- [Reading progress bar](#reading-progress-bar)
- [Pinned section that scrolls sideways](#pinned-section-that-scrolls-sideways)
- [Counters](#counters)
- [Drawing an SVG line](#drawing-an-svg-line)
- [Driving everything with a CSS variable](#driving-everything-with-a-css-variable)
- [Animating a canvas or WebGL scene](#animating-a-canvas-or-webgl-scene)
- [Scroll containers and horizontal scrolling](#scroll-containers-and-horizontal-scrolling)
- [Navigation links](#navigation-links)
- [Single page apps and frameworks](#single-page-apps-and-frameworks)
- [Respecting reduced motion](#respecting-reduced-motion)
- [Content that loads later](#content-that-loads-later)

## Reveal elements as they enter the screen

Let CSS handle the animation and toggle a class with a [hook](hooks.md):

```js
cabelo({ forceHeight: false })
  .hook({
    targets: '.reveal',
    duration: ['top-bottom-100', 'bottom-top'],
    className: 'is-visible'
  });
```

```css
.reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.6s, transform 0.6s; }
.reveal.is-visible { opacity: 1; transform: none; }
```

To tie the animation to the scroll instead, use a tween:

```js
tl.add({
  targets: '.reveal',
  duration: ['top-bottom', 'top-center'],
  opacity: [0, 1],
  y: [40, 0]
});
```

`forceHeight: false` is used on regular pages, where the content already decides how far you can scroll.

## Parallax layers

Move layers at different speeds while they cross the screen. Read the speed from an attribute with a function value:

```html
<div class="layer" data-speed="0.2"></div>
<div class="layer" data-speed="0.5"></div>
```

```js
cabelo({ forceHeight: false })
  .add({
    targets: '.layer',
    duration: ['top-bottom', 'bottom-top'],
    y: (el) => {
      const distance = innerHeight * parseFloat(el.dataset.speed);
      return [-distance, distance];
    }
  });
```

Function values are evaluated again when the window is resized, so the distances stay proportional to the viewport.

## Reading progress bar

```html
<div class="progress"></div>
```

```css
.progress { position: fixed; top: 0; left: 0; width: 100%; height: 4px; transform-origin: 0 50%; }
```

```js
cabelo({ forceHeight: false })
  .add({
    targets: '.progress',
    duration: () => [0, document.documentElement.scrollHeight - innerHeight],
    scaleX: [0, 1]
  });
```

To measure progress through an article instead of the whole page, use the article as the [`trigger`](tweens.md#measuring-another-element):

```js
tl.add({
  targets: '.progress',
  trigger: 'article',
  duration: ['top-top', 'bottom-bottom'],
  scaleX: [0, 1]
});
```

## Pinned section that scrolls sideways

Make a tall section with a `position: sticky` child. While the section scrolls by, the child stays pinned and its track moves sideways. Since the sticky element itself doesn't move while it's pinned, measure the section with `trigger`:

```html
<section class="pinned">
  <div class="sticky">
    <div class="track">...</div>
  </div>
</section>
```

```css
.pinned { height: 400vh; }
.sticky { position: sticky; top: 0; height: 100vh; overflow: hidden; }
.track { display: flex; width: max-content; height: 100%; }
```

```js
const track = document.querySelector('.track');

cabelo({ forceHeight: false })
  .add({
    targets: track,
    trigger: '.pinned',
    duration: ['top-top', 'bottom-bottom'],
    x: [0, () => -(track.scrollWidth - innerWidth)]
  });
```

## Counters

Animate `textContent` and round it:

```js
tl.add({
  targets: '.counter',
  duration: ['top-bottom', 'center-center'],
  textContent: [0, 2500],
  round: true
});
```

For formatted numbers, animate a plain object and render it yourself:

```js
const counter = { value: 0 };
const el = document.querySelector('.counter');
const format = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

tl
  .add({ targets: counter, duration: [0, 1000], value: [0, 2500] })
  .on('update', () => { el.textContent = format.format(counter.value); });
```

## Drawing an SVG line

```html
<svg viewBox="0 0 100 100">
  <path class="line" d="..." pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" />
</svg>
```

```js
tl.add({
  targets: '.line',
  duration: ['top-bottom', 'bottom-center'],
  'stroke-dashoffset': [1, 0]
});
```

`pathLength="1"` makes the dash values independent of the real length of the path. Because the element has a `stroke-dashoffset` attribute, cabelo animates the attribute.

## Driving everything with a CSS variable

Animate a single CSS variable from 0 to 1 and let CSS derive everything else from it:

```js
tl.add({ targets: '.card', duration: [0, 1000], '--progress': [0, 1] });
```

```css
.card {
  --progress: 0;
  border-radius: calc(var(--progress) * 50%);
  rotate: calc(var(--progress) * 180deg);
  background: color-mix(in srgb, tomato calc(var(--progress) * 100%), steelblue);
}
```

The variable is also inherited by the children of the target.

## Animating a canvas or WebGL scene

Plain objects can be targets. Animate the values you need and draw on `update`:

```js
const camera = { z: 10, rotation: 0 };

cabelo
  .add({ targets: camera, duration: [0, 3000], z: [10, 2], rotation: [0, Math.PI] })
  .on('update', () => renderScene(camera));
```

Cabelo renders at most once per frame while scrolling, so `update` is a good place to draw.

## Scroll containers and horizontal scrolling

Pass the scrolling element as `container`. Relative positions are measured inside it:

```js
cabelo({ container: '.scroller', forceHeight: false })
  .add({ targets: '.scroller .item', duration: ['top-bottom', 'bottom-top'], opacity: [0, 1, 0] });
```

For horizontal scrolling, set `axis: 'x'`. Positions are measured from the left, and the anchors `left`, `center` and `right` read more naturally:

```js
cabelo({ container: '.gallery', axis: 'x', forceHeight: false })
  .add({
    targets: '.gallery .slide',
    duration: ['left-right', 'center-center', 'right-left'],
    scale: [0.8, 1, 0.8]
  });
```

With `forceHeight` on, a custom container's first child (or the `content` option) gets the forced size.

## Navigation links

```js
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    tl.scrollTo(link.getAttribute('href'), 1, 'ease-in-out-quart');
  });
});
```

`scrollTo()` returns a promise, so you can wait for it:

```js
await tl.scrollTo('end', 2);
showConfetti();
```

## Single page apps and frameworks

Create the timeline when the view mounts and destroy it, reverting the styles, when it unmounts. With React:

```jsx
import { useEffect, useRef } from 'react';
import cabelo from 'cabelo';

function Hero() {
  const ref = useRef(null);

  useEffect(() => {
    const tl = cabelo({ forceHeight: false })
      .add({ targets: ref.current, duration: [0, 600], opacity: [1, 0], y: [0, -100] });

    return () => tl.destroy({ revert: true });
  }, []);

  return <h1 ref={ref}>Hello</h1>;
}
```

Importing cabelo doesn't touch `window` or `document`, so it's safe in server-rendered apps. Only create timelines in the browser.

Components that share the [page timeline](api.md#page-timeline) remove their own targets instead of destroying it:

```js
useEffect(() => {
  cabelo.add({ targets: ref.current, duration: ['top-bottom', 'bottom-top'], y: [-50, 50] });

  return () => cabelo.remove(ref.current);
}, []);
```

## Respecting reduced motion

Skip the scroll animations for people who prefer reduced motion, and show the final state instead. `autoInit: false` keeps the timeline from starting on its own:

```js
const tl = cabelo({ forceHeight: false, autoInit: false })
  .add({ targets: '.title', duration: [0, 600], y: [100, 0], opacity: [0, 1] });

if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  tl.render(tl.end);
} else {
  tl.init();
}
```

## Content that loads later

Cabelo refreshes automatically when the window or the page changes size. If something moves elements without changing the size of the page, like a web font swapping in, refresh by hand:

```js
document.fonts.ready.then(() => tl.refresh());
```

New tweens can be added at any time, even after the timeline has started:

```js
loadMore().then((items) => {
  tl.add({ targets: items, duration: ['top-bottom', 'top-center'], opacity: [0, 1] });
});
```
