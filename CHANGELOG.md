# Changelog

## 1.0.0 (2026-10-18)

A rewrite of the internals with many new features and fixes. The API is the same, with the behavior changes listed below.

### Added

- Plain JavaScript objects as targets, e.g. to drive a canvas or WebGL scene.
- CSS variables: `'--progress': [0, 1]`.
- DOM properties such as `textContent`, for counters.
- Single values animate from the current value: `opacity: 0`.
- Relative values: `'+=100'`, `'-=50'`, `'*=2'`.
- More values than positions are spread evenly: `duration: [0, 1000], x: [0, 100, 0]`.
- Named colors (`'tomato'`, `'transparent'`), 4 and 8 digit hex colors, modern `rgb()`/`hsl()` syntax, and colors inside complex values like `box-shadow`.
- Values with different units are interpolated with `calc()`: `x: ['100px', '50vw']`.
- Values that can't be interpolated, like `display: ['none', 'block']`.
- Easing as a function, a `'cubic-bezier()'` string or a `'steps()'` string, plus the CSS `ease`, `ease-in`, `ease-out` and `ease-in-out` curves. Custom named easings can be functions.
- `round` accepts a number of decimals.
- `duration` accepts a number: `duration: 1000` is `[0, 1000]`.
- Relative positions accept offsets (`'top-bottom+100'`, `'top-bottom-25%'`) and the `center`, `left`, `right`, `start` and `end` anchors.
- `trigger` option, to measure relative positions from another element (for example the wrapper of a sticky element).
- Function positions and values receive the number of targets as a third argument, and are evaluated again on every refresh.
- `edgeClassName` accepts a custom class prefix.
- Nested tweens inherit `easing`, `round`, `immediateRender`, `trigger` and the parent's positions, and accept their own `easing`, `round`, `from`, `to`, `trigger` and `immediateRender`.
- Hooks can be ranges (`duration: [start, end]`), can have `targets` (one hook per target) and a `trigger`, toggle a `className`, and receive `{ direction, scrollTop, position, target }`.
- `axis: 'x'` for horizontal timelines.
- `content` option, for the element that receives the forced size in a custom container.
- `remove(targets)`, `render(position)`, `once()`, `stopScroll()`, the `refresh` event, and the `progress`, `direction`, `start`, `end` and `duration` properties.
- `update` events include the timeline `progress`.
- Timelines start on their own once the code that created them has run, so calling `init()` is optional. `autoInit: false` turns this off.
- A shared page timeline: `cabelo.add()`, `cabelo.hook()`, `cabelo.remove()`, `cabelo.on()` and the other methods add to one timeline for the page scroll, created on first use. `cabelo.destroy()` destroys it.
- `scrollTo()` accepts an element or a selector and an easing, and returns a cancellable promise.
- `destroy({ revert: true })` restores every animated property, transform and class.
- Transforms already set inline on an element (and not animated) are kept.
- `onEnter`, `onLeave` and `onUpdate` tween callbacks, which receive the tween's `progress`.
- `xPercent` and `yPercent` transforms, to translate by a percentage of the element's size.
- `zIndex` and `order` are always rounded to integers.
- TypeScript types.
- ES module build (`dist/cabelo.mjs`), minified browser build (`dist/cabelo.min.js`) and `exports`/`module`/`types` fields in `package.json`.
- Warnings for common mistakes: unknown properties, selectors that match nothing, mismatched values and positions.

### Fixed

- Overlapping tweens on the same property no longer leave a stale value when scrolling back quickly. Values are now computed from the scroll position alone.
- Relative positions are measured again when the window or the page is resized, ignore the transforms applied by cabelo, and are correct inside scroll containers.
- The alpha channel of colors is no longer rounded to 0 or 1.
- `forceHeight` no longer grows a custom scroll container forever.
- `destroy()` now removes the resize listener.
- `complete` no longer fires on every scroll event past the end.
- Importing cabelo no longer touches `document`, so it's safe for server-side rendering and scripts in `<head>`.
- Animating a plain object target, an unknown property or a non-numeric value no longer throws.
- Unit-less values are no longer given a unit when it would be invalid (like `'autopx'`).
- Memory is no longer retained for every animated element after an instance is gone.

### Changed

These may require changes to existing code:

- **Events**: `begin` fires when the scroll position moves past the start of the timeline (instead of once, on init, at position 0), and again every time it leaves the start. `complete` fires once each time the end is reached.
- **Listeners**: scroll and resize listeners are added by `init()`, not when the instance is created. Timelines call `init()` on their own right after the code that created them has run, so a timeline you meant to start later needs `autoInit: false`.
- **`ready`** fires at the end of `init()`, after the first render.
- **Transform order**: transforms are applied in a fixed order (perspective, translate, rotate, skew, scale) instead of the order they were first used. Scaling no longer shrinks translations that were declared after it.
- **`forceHeight`** sets `min-height` instead of `height`. In a custom container, it sizes the container's first child (or `content`) instead of the container itself.
- **`scrollTo()`** eases with `'ease-in-out-cubic'` by default (it was linear), and `'end'` scrolls to the end of the timeline.
- **Builds**: `dist/cabelo.js` is no longer minified; use `dist/cabelo.min.js` in the browser.
- Removed the `-webkit-transform` fallback and the unused `debug` option.
- No runtime dependencies (`auto-bind`, `bezier-easing`, `event-emitter` and `lodash.omit` were removed).
- Development uses Rollup and Vitest instead of webpack and Jest.

## 0.2.0

- Add the `edgeClassName` option to tweens.

## 0.1.1

- Add `unsetHeight()`.
- Transpile the bundle with Babel.
- Replace `emittery` with `event-emitter`.

## 0.1.0

- First release.
