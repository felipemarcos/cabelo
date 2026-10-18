# cabelo

> Tiny, dependency-free library to animate anything based on the scroll position.

**[Documentation](https://felipemarcos.github.io/cabelo/)** · **[Live examples](https://felipemarcos.github.io/cabelo/examples/)**

Cabelo turns the scroll position into a timeline. You describe what a property should look like at given scroll positions, and cabelo interpolates everything in between as the page scrolls, up and down, as fast as the user likes.

```js
cabelo()
  .add({
    targets: '.title',
    duration: [0, 1000],   // from 0px to 1000px of scroll
    y: [-200, 0],          // move from -200px to 0
    opacity: [0, 1]
  });
```

- **Anything is animatable**: transforms, CSS properties, CSS variables, colors, SVG attributes, DOM properties like `textContent`, and plain JavaScript objects.
- **Positions in pixels or relative to elements**: `'top-bottom'` means "when the top of the element reaches the bottom of the viewport", and is measured again when the layout changes.
- **Predictable**: overlapping tweens resolve the same way no matter how fast you scroll, so jumping around the page never leaves stale values behind.
- **Keyframes, easing, staggering**: multiple positions per tween, CSS-like easings (`cubic-bezier()`, `steps()`), and per-target function values.
- **Hooks**: run code or toggle classes when the scroll position crosses a point or enters a range.
- **Works anywhere**: the document or any scroll container, vertical or horizontal. Safe to import during server-side rendering.
- **Small**: about 9 KB minified and gzipped, no dependencies, TypeScript types included.

## Install

```sh
npm install cabelo
```

```js
import cabelo from 'cabelo';
```

Or use it straight from a CDN:

```html
<script src="https://unpkg.com/cabelo"></script>
<script>
  const tl = cabelo();
</script>
```

## Quick start

```html
<h1 class="title">Hello World</h1>
<div class="box"></div>
<div class="box"></div>
<div class="box"></div>
```

```js
import cabelo from 'cabelo';

const tl = cabelo();

tl
  // The title slides in during the first 1000px of scroll
  .add({
    targets: '.title',
    duration: [0, 1000],
    y: [-1000, 0],
    rotate: [100, 0],
    easing: 'ease-out-cubic'
  })
  // Each box starts 100px after the previous one
  .add({
    targets: '.box',
    duration: (el, i) => [1000 + i * 100, 2000],
    x: [0, '50vw'],
    backgroundColor: ['#3F51B5', '#E91E63']
  })
  // Elements can also be animated while they cross the viewport
  .add({
    targets: '.photo',
    duration: ['top-bottom', 'bottom-top'],
    y: [-50, 50]
  })
  .on('update', ({ progress }) => console.log(`${Math.round(progress * 100)}%`));
```

The timeline starts on its own once the chain has run: it measures everything, makes the page tall enough to scroll through the whole timeline (see [`forceHeight`](docs/api.md#options)) and starts listening to scroll events.

Effects spread across a page don't each need their own timeline. `cabelo.add()`, `cabelo.hook()` and `cabelo.on()` add to one shared timeline for the page scroll:

```js
// hero.js
cabelo.add({ targets: '.hero', duration: [0, 600], opacity: [1, 0] });

// gallery.js
cabelo.add({ targets: '.photo', duration: ['top-bottom', 'bottom-top'], y: [-50, 50] });
```

## How it works

Every tween has **positions** (scroll offsets, in pixels) and **values** for each animated property. At any scroll position, cabelo finds the segment you are in and interpolates its values:

```js
tl.add({
  targets: '.box',
  duration: [0, 500, 1000], // three positions...
  x: [0, 300, 300],         // ...and a value for each one
  y: [0, 0, 200]
});
```

Scrolling to 250px puts the box at `x: 150, y: 0`; scrolling to 750px puts it at `x: 300, y: 100`. Before the first position the first values apply, after the last position the last values do.

## Documentation

The full documentation is at **<https://felipemarcos.github.io/cabelo/>**. The same guides are in the [`docs`](docs) folder:

- [Getting started](docs/getting-started.md): the core ideas, step by step.
- [Tweens](docs/tweens.md): targets, positions, values, properties, easing and how tweens combine.
- [Hooks](docs/hooks.md): callbacks and class toggling at scroll positions.
- [API reference](docs/api.md): every option, method and event.
- [Recipes](docs/recipes.md): reveal on scroll, progress bars, parallax, horizontal scroll, frameworks, reduced motion and more.
- [Changelog](CHANGELOG.md)

The [examples](https://felipemarcos.github.io/cabelo/examples/) can be tried online. To run them locally, clone the repository and run:

```sh
npm install
npm start
```

Then open <http://localhost:8080/examples/>. To work on the documentation site, run `npm run docs:dev`.

## Browser support

All modern browsers. Cabelo uses `ResizeObserver`, when available, to measure the page again when it changes size.

## License

MIT © [Felipe Marcos](https://felipe.zip)
