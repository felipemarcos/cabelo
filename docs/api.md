# API reference

- [`cabelo(options)`](#cabelooptions)
- [Page timeline](#page-timeline)
- [Options](#options)
- [Methods](#methods)
- [Properties](#properties)
- [Events](#events)
- [`Easing`](#easing)
- [TypeScript](#typescript)

## `cabelo(options)`

Creates a timeline. Returns an `Instance`. It starts on its own (see [`init()`](#init)) once the code that created it has run, so the tweens, hooks and listeners chained after `cabelo()` are all in place before the first render.

```js
import cabelo, { Easing, Instance } from 'cabelo';

const tl = cabelo({ forceHeight: false });
```

With the browser build, `cabelo` is a global, and `Easing` and `Instance` are available as `cabelo.Easing` and `cabelo.Instance`.

## Page timeline

`cabelo.add()`, `cabelo.hook()`, `cabelo.remove()`, `cabelo.on()`, `cabelo.once()`, `cabelo.off()`, `cabelo.refresh()`, `cabelo.render()`, `cabelo.scrollTo()` and `cabelo.stopScroll()` call the method of the same name on a timeline shared by the whole page. It is created, with the default options, the first time one of them is called, and starts on its own like any other timeline. Each of them returns what the method returns, so they can be chained:

```js
cabelo
  .add({ targets: '.hero', duration: [0, 600], opacity: [1, 0] })
  .hook({ targets: '.card', duration: ['top-bottom', 'bottom-top'], className: 'is-visible' });

cabelo.on('update', ({ progress }) => console.log(progress));
```

Use it when separate parts of a page add their own effects: they share one set of scroll and resize listeners, and none of them has to keep a reference to the timeline. Create a timeline with `cabelo()` when you need other [options](#options), like a scroll container, or events and `progress` for a group of tweens only.

`cabelo.destroy(options?)` destroys the shared timeline, if there is one, and returns it. The next `cabelo.add()` creates a new one.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `container` | the document | The scrolling element, or a selector for it. |
| `axis` | `'y'` | `'x'` for horizontal timelines. Positions, relative anchors and `forceHeight` follow the axis. |
| `forceHeight` | `true` | Makes the content big enough to scroll through the whole timeline: sets `min-height` (or `min-width`) to the viewport size plus the last position of the timeline. On the document it's set on `<html>`; in a custom container, on its first child (or `content`). Turn it off when your content already provides the scroll length. |
| `content` | first child of `container` | The element that receives the forced size in a custom container. |
| `autoInit` | `true` | Calls `init()` once the code that created the timeline has run. Set it to `false` to call `init()` yourself, or not at all, like when you only [render](#render-position) a position. |

## Methods

All methods return the instance, so they can be chained, unless stated otherwise.

### `add(tween)`

Adds a tween. See [tweens](tweens.md) for everything it accepts.

```js
tl.add({ targets: '.box', duration: [0, 1000], x: [0, 300] });
```

Tweens added after `init()` are measured and rendered on the next frame.

### `hook(hook)`

Adds a hook. See [hooks](hooks.md).

```js
tl.hook({ duration: 500, enter() {}, leave() {} });
```

### `remove(targets?)`

Removes the tweens and hooks of the given targets, restoring their animated properties and classes to their original values. Without arguments, removes everything.

```js
tl.remove('.box');
```

### `init()`

Measures every tween, applies `forceHeight`, renders the current scroll position and starts listening to `scroll` and `resize` events. Calling it again only refreshes.

Timelines call it on their own unless created with `autoInit: false`, so you only need it to start a timeline earlier, or one that doesn't start on its own.

### `refresh()`

Measures relative positions and evaluates function positions and values again, updates the forced size and renders. It runs automatically when the window is resized and, in browsers with `ResizeObserver`, when the page (or the container) changes size. Call it yourself after layout changes that don't change the size of the page, like moving an element around.

### `render(position?)`

Renders every tween at a scroll position, the current one by default, without scrolling. Useful for tests, or to drive the timeline from something other than the scroll position:

```js
const tl = cabelo({ forceHeight: false, autoInit: false }).add({ /* ... */ });

slider.addEventListener('input', () => tl.render(slider.valueAsNumber));
```

### `destroy(options?)`

Stops listening to events, cancels any `scrollTo()` in progress and removes the forced size.

| Option | Default | Description |
| --- | --- | --- |
| `revert` | `false` | Also restores every animated property, transform and class to its original value. |

```js
tl.destroy({ revert: true });
```

### `scrollTo(to, duration?, easing?)`

Smoothly scrolls the container. Returns a promise that resolves with `true` when it's done, or `false` if it was cancelled.

| Argument | Default | Description |
| --- | --- | --- |
| `to` | | A position in pixels, `'start'` (0), `'end'` (the last position of the timeline), an element or a selector. |
| `duration` | `0` | In **seconds**. `0` jumps straight to the position. |
| `easing` | `'ease-in-out-cubic'` | Any [easing](tweens.md#easing). |

```js
await tl.scrollTo('#contact', 1.2, 'ease-out-quart');
```

Calling `scrollTo()` again cancels the previous one. The returned promise also has a `cancel()` method.

### `stopScroll()`

Cancels the `scrollTo()` in progress, if any.

### `on(event, listener)`, `once(event, listener)`, `off(event?, listener?)`

Adds or removes [event](#events) listeners. `once` removes the listener after its first call. `off(event)` removes every listener of that event, and `off()` removes them all.

### Getters

These return values instead of the instance:

| Method | Returns |
| --- | --- |
| `getScrollTop()` | The current scroll position of the container |
| `getProgress()` | Same as the `progress` property |
| `getDirection()` | Same as the `direction` property |
| `getTotalDuration()` | Same as the `end` property |
| `getClientHeight()` | The size of the viewport (or container) along the axis |

`setScrollTop(position)` scrolls the container instantly.

## Properties

| Property | Description |
| --- | --- |
| `scrollTop` | The last rendered scroll position. |
| `direction` | `'down'` or `'up'`, the direction of the last scroll. |
| `start` | The first position of the timeline. |
| `end` | The last position of the timeline. |
| `duration` | Same as `end`. |
| `progress` | How far through the timeline the last rendered position is, from 0 to 1. |
| `container` | The scrolling element. |
| `options` | The options the instance was created with, plus defaults. |
| `tweens` | The tweens, one per target. |
| `hooks` | The hooks, one per target. |

## Events

```js
tl.on('update', ({ scrollTop, progress, direction }) => { /* ... */ });
```

| Event | Fires | Receives |
| --- | --- | --- |
| `ready` | Once, at the end of `init()` | |
| `refresh` | After every refresh, including the one in `init()` | |
| `update` | After every render, at most once per frame while scrolling | `{ scrollTop, position, progress, direction }` |
| `begin` | When the scroll position moves past the start of the timeline. Fires again each time it comes back to the start and leaves it. | `{ scrollTop, position, direction }` |
| `complete` | When the scroll position reaches the end of the timeline. Fires again each time it leaves and reaches the end again. | `{ scrollTop, position, direction }` |

`position` is the same as `scrollTop`, and is clearer on horizontal timelines.

## `Easing`

The object of named easings. Each entry is either the four control points of a cubic bezier or a function. Add entries to make them available by name:

```js
import { Easing } from 'cabelo';

Easing['snappy'] = [0.2, 0, 0, 1];

tl.add({ targets: '.box', duration: [0, 500], x: [0, 100], easing: 'snappy' });
```

See [easing](tweens.md#easing) for the built-in names.

## TypeScript

Types are included. The main ones live in the `cabelo` namespace:

```ts
import cabelo, { Instance } from 'cabelo';

const options: cabelo.TweenOptions = { targets: '.box', duration: [0, 100], x: [0, 100] };
const tl: Instance = cabelo().add(options);
```
