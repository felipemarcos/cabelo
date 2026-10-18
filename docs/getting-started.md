# Getting started

This guide walks through the ideas behind cabelo by building a small scroll-driven page. If you just want the full list of options, see the [API reference](api.md).

## 1. Create a timeline

```js
import cabelo from 'cabelo';

const tl = cabelo();
```

`cabelo()` creates a timeline (an `Instance`) bound to the page scroll. Pass `{ container: '.scroller' }` to use a scrollable element instead, or `{ axis: 'x' }` for horizontal scrolling. See [options](api.md#options).

If you don't need a reference to the timeline, `cabelo.add()` adds to a [shared page timeline](api.md#page-timeline) instead.

## 2. Add a tween

A tween animates one or more **targets** between scroll **positions**:

```js
tl.add({
  targets: '.hero',
  duration: [0, 600],
  opacity: [1, 0],
  scale: [1, 0.8]
});
```

- `targets` is a selector, an element, a list of elements or a plain object.
- `duration` is a list of scroll positions in pixels. Here the tween starts when the page is at the very top and ends after 600px of scroll.
- Every other key is a property to animate, with one value per position.

Despite its name, `duration` is not a length of time: scroll positions are the timeline.

## 3. Let it start

There is nothing to call: once the code that adds the tweens has run, the timeline starts on its own by calling `init()`, which does three things:

1. Measures every tween (relative positions depend on the layout).
2. Makes the page tall enough to scroll through the whole timeline. With the tween above, the page can scroll at least 600px, even if its content is short. Turn this off with `cabelo({ forceHeight: false })` when your content already provides the scroll height.
3. Renders the current scroll position and starts listening to scroll and resize events.

All methods return the timeline, so you can chain them:

```js
cabelo()
  .add({ targets: '.hero', duration: [0, 600], opacity: [1, 0] })
  .add({ targets: '.title', duration: [200, 800], y: [100, 0] });
```

To decide yourself when it starts, create it with `cabelo({ autoInit: false })` and call `tl.init()`.

## 4. Tie animations to elements

Hardcoded pixels work for full-screen, scroll-jacked experiences. For regular pages, you usually want an animation to happen while an element is on screen. Use **relative positions** for that:

```js
tl.add({
  targets: '.photo',
  duration: ['top-bottom', 'bottom-top'],
  y: [-60, 60]
});
```

`'top-bottom'` reads as "the **top** of the element meets the **bottom** of the viewport", that is, when the element starts entering the screen. `'bottom-top'` is when its bottom edge leaves through the top. Each `.photo` gets its own positions, and they are measured again when the window or the page is resized.

See [relative positions](tweens.md#relative-positions) for all the anchors and offsets.

## 5. Keyframes and easing

Add more positions to build multi-step animations, and an easing to shape each step:

```js
tl.add({
  targets: '.square',
  duration: [0, 750, 1500, 2250, 3000],
  x: [0, 300, 300, 0, 0],
  y: [0, 0, 200, 200, 0],
  background: ['#9B65DE', '#14D790', '#FF1C68', '#198FE3', '#9B65DE'],
  easing: 'ease-in-out-cubic'
});
```

## 6. Stagger multiple targets

Any position or value can be a function. It's called once per target with the target, its index and the number of targets:

```js
tl.add({
  targets: '.box',
  duration: (el, i) => [i * 100, i * 100 + 1000],
  x: [0, 300]
});
```

## 7. React to the scroll

Listen to events to sync other things with the timeline:

```js
tl.on('update', ({ progress, direction }) => {
  progressBar.style.width = `${progress * 100}%`;
});
```

Or use [hooks](hooks.md) to run code, or toggle a class, when the scroll position crosses a point:

```js
tl.hook({
  targets: '.card',
  duration: ['top-bottom', 'bottom-top'],
  className: 'is-visible'
});
```

## 8. Clean up

When the page (or component) goes away, destroy the timeline. Pass `revert: true` to restore every animated property to its original value:

```js
tl.destroy({ revert: true });
```

## Next steps

- [Tweens](tweens.md) covers every way to describe positions and values.
- [Recipes](recipes.md) has ready-to-use patterns.
