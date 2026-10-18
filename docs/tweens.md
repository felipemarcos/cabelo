# Tweens

A tween animates properties of one or more targets between scroll positions:

```js
tl.add({
  targets: '.box',          // what to animate
  duration: [0, 1000],      // when (scroll positions)
  x: [0, 300],              // what changes
  opacity: [0, 1],
  easing: 'ease-out-cubic'  // how
});
```

- [Targets](#targets)
- [Positions](#positions)
  - [Relative positions](#relative-positions)
- [Values](#values)
- [Properties](#properties)
- [Nested tweens](#nested-tweens)
- [Easing](#easing)
- [Options](#options)
- [Overlapping tweens](#overlapping-tweens)

## Targets

`targets` accepts:

| Type | Example |
| --- | --- |
| CSS selector | `'.box'` |
| Element | `document.querySelector('.box')` |
| `NodeList` or `HTMLCollection` | `document.querySelectorAll('.box')` |
| Array of any of the above | `['.box', header]` |
| Plain object | `{ value: 0 }` |

Every target gets its own tween, so function values (see below) can differ per target. Duplicates are ignored.

## Positions

Positions are scroll offsets, in pixels, measured from the top of the page (or the left, for horizontal timelines). You can define them in a few ways:

```js
duration: [0, 1000]             // from 0 to 1000
duration: 1000                  // same as [0, 1000]
from: 200, to: 800              // same as duration: [200, 800]
to: 800                         // same as duration: [0, 800]
duration: [0, 500, 1000]        // keyframes: one value per position
duration: ['top-bottom', 'bottom-top'] // relative to the target
duration: (el, i, total) => [i * 100, i * 100 + 500] // per target
duration: [0, (el, i) => 500 + i * 100]               // per item
```

Positions should go up. A tween with two equal positions, like `[500, 500]`, switches from its first to its last values at that point.

> The name `duration` is kept for compatibility. It describes a stretch of scroll, not time.

### Relative positions

A relative position aligns an edge of the **target** with an edge of the **viewport** (or the scroll container):

```
<target anchor>-<viewport anchor>[<offset>]
```

| Anchor | Meaning |
| --- | --- |
| `top`, `left`, `start` | The start edge |
| `center`, `middle` | The center |
| `bottom`, `right`, `end` | The end edge |

Some examples, on a vertical timeline:

| Position | The scroll position where... |
| --- | --- |
| `'top-bottom'` | the target's top meets the viewport's bottom: it starts entering the screen |
| `'bottom-top'` | the target's bottom meets the viewport's top: it has just left the screen |
| `'top-top'` | the target's top reaches the top of the viewport |
| `'center-center'` | the target is centered in the viewport |
| `'bottom-bottom'` | the target's bottom is at the bottom of the viewport: it's fully visible |
| `'top-bottom+100'` | 100px after `'top-bottom'` |
| `'top-bottom-25%'` | 25% of the viewport height before `'top-bottom'` |

Relative positions are measured:

- with the transforms applied by cabelo removed, so moving an element doesn't change when its own animation happens;
- again on every [`refresh()`](api.md#refresh), which runs automatically when the window or the page content is resized.

Function positions are also evaluated again on every refresh, which is handy for positions that depend on the layout:

```js
duration: () => [0, document.documentElement.scrollHeight - innerHeight]
```

### Measuring another element

By default, relative positions are measured from the target. Use `trigger` to measure from another element: for example the tall wrapper of a `position: sticky` element, whose own position changes while it's pinned.

```js
tl.add({
  targets: '.pinned .track',
  trigger: '.pinned',                      // an element or a selector...
  duration: ['top-top', 'bottom-bottom'],
  x: [0, -1000]
});

tl.add({
  targets: '.slide img',
  trigger: (el) => el.closest('.slide'),   // ...or a function, called per target
  duration: ['top-bottom', 'bottom-top'],
  y: [-40, 40]
});
```

## Values

Give one value per position:

```js
duration: [0, 500, 1000],
x: [0, 300, 0]
```

### More values than positions

When a tween has two positions and a property has more values, the values are spread evenly. These two are the same:

```js
duration: [0, 1000], x: [0, 300, 0]
duration: [0, 500, 1000], x: [0, 300, 0]
```

### A single value

A single value animates from the target's current value:

```js
opacity: 0 // from the current opacity to 0
```

### Units

Numbers without a unit get the unit of the current value: `px` for translations and most CSS lengths, `deg` for rotations and skews, and no unit for `scale` and `opacity`. You can always be explicit:

```js
x: [0, '50vw'],
rotate: ['0turn', '1turn'],
width: ['10%', '50%']
```

When the units of two values differ, cabelo interpolates them with `calc()`, so `x: ['100px', '50vw']` works too.

### Relative values

`+=`, `-=` and `*=` are relative to the previous value (or to the current value, for the first one):

```js
x: ['+=0', '+=100', '-=50'] // current, current + 100, current + 50
```

### Colors

Hex (`#fff`, `#ffffff`, and with alpha, `#ffff`, `#ffffffff`), `rgb()`/`rgba()`, `hsl()`/`hsla()` (comma or space separated) and named colors (`'tomato'`, `'transparent'`) can be mixed freely. Colors inside complex values are animated too:

```js
backgroundColor: ['transparent', '#3F51B5'],
boxShadow: ['0 0 0 0 rgba(0, 0, 0, 0)', '0 20px 40px 0 hsl(340, 80%, 50%)']
```

Inside complex values, write colors as hex, `rgb()` or `hsl()`: named colors are only recognized as values of their own.

### Values that can't be interpolated

Values without numbers, like `display: ['none', 'block']`, switch as soon as the scroll position moves past the start of their segment.

### Function values

A property, or any of its values, can be a function. It's called for each target with the target, its index and the number of targets:

```js
x: (el, i) => [0, 100 + i * 50],
rotate: [0, (el, i, total) => (i / total) * 360]
```

Function values are evaluated again on every [refresh](api.md#refresh), so they can depend on the layout:

```js
x: [0, () => -(track.scrollWidth - innerWidth)]
```

Single values and relative values (`+=`) stay based on the value the target had before it was animated.

## Properties

Every key that isn't an [option](#options) is an animated property. Cabelo picks how to animate it in this order:

1. **Plain objects**: any key, e.g. `{ targets: camera, zoom: [1, 2] }`.
2. **CSS variables**: keys starting with `--`, e.g. `'--progress': [0, 1]`.
3. **Transforms**: see below.
4. **Attributes**: when the element has the attribute (`data-value`, SVG `stroke-dashoffset`, `points`, `d`...).
5. **CSS properties**, in camelCase: `opacity`, `backgroundColor`, `borderRadius`...
6. **DOM properties**: `textContent`, `scrollTop`, `value`...

Properties that don't match any of these are ignored, with a warning in the console.

### Transforms

| Property | Default unit |
| --- | --- |
| `x`, `y`, `z` (aliases for `translateX`, `translateY`, `translateZ`) | `px` |
| `translateX`, `translateY`, `translateZ` | `px` |
| `rotate`, `rotateX`, `rotateY`, `rotateZ` | `deg` |
| `skew`, `skewX`, `skewY` | `deg` |
| `scale`, `scaleX`, `scaleY`, `scaleZ` | none |
| `perspective` | `px` |

Transforms of all the tweens of a target are combined into a single `transform`, always in this order: `perspective`, translations, rotations, skews, scales. This means scaling or rotating an element never changes how far it moves.

Transforms that were already set inline on the element, and that cabelo doesn't animate, are kept. For example, an element with `style="transform: translate(-50%, -50%)"` stays centered while you animate its `rotate`.

## Nested tweens

A property can be an object with its own positions and options:

```js
tl.add({
  targets: '.title',
  duration: [0, 1000],
  y: [-1000, 0],
  scale: {
    duration: [100, 2000],
    value: [0, 1],
    easing: 'ease-out-back'
  },
  color: {
    duration: [2000, 2500],
    value: ['#252525', 'rgb(156, 39, 176)']
  }
});
```

A nested tween accepts `value` (or `values`), `duration`, `from`, `to`, `trigger`, `easing`, `round` and `immediateRender`. Anything it doesn't set is inherited from its parent: positions, `trigger`, easing, rounding and `immediateRender`.

## Easing

`easing` shapes the progress between each pair of positions. It defaults to `'linear'` and accepts:

```js
easing: 'ease-in-out-cubic'                 // a named easing
easing: 'cubic-bezier(0.2, 0, 0, 1)'        // a CSS cubic-bezier()
easing: 'steps(4)'                          // a CSS steps(), also 'steps(4, start)'
easing: [0.2, 0, 0, 1]                      // bezier control points
easing: (t) => 1 - Math.pow(1 - t, 3)       // any function from [0, 1] to [0, 1]
```

The named easings are:

| | in | out | in-out |
| --- | --- | --- | --- |
| CSS | `ease-in` | `ease-out` | `ease-in-out` |
| quad | `ease-in-quad` | `ease-out-quad` | `ease-in-out-quad` |
| cubic | `ease-in-cubic` | `ease-out-cubic` | `ease-in-out-cubic` |
| quart | `ease-in-quart` | `ease-out-quart` | `ease-in-out-quart` |
| quint | `ease-in-quint` | `ease-out-quint` | `ease-in-out-quint` |
| sine | `ease-in-sine` | `ease-out-sine` | `ease-in-out-sine` |
| expo | `ease-in-expo` | `ease-out-expo` | `ease-in-out-expo` |
| circ | `ease-in-circ` | `ease-out-circ` | `ease-in-out-circ` |
| back | `ease-in-back` | `ease-out-back` | `ease-in-out-back` |

Plus `linear` and `ease`. Register your own on the `Easing` object:

```js
import { Easing } from 'cabelo'; // or cabelo.Easing

Easing['snappy'] = [0.2, 0, 0, 1];
Easing['bounce'] = (t) => /* ... */ t;
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `targets` | | What to animate. Required. |
| `duration` | | Positions. See [positions](#positions). |
| `from`, `to` | | Alternative to `duration`. |
| `trigger` | the target | The element relative positions are measured from. See [measuring another element](#measuring-another-element). |
| `easing` | `'linear'` | See [easing](#easing). |
| `round` | `false` | `true` rounds values to integers, a number rounds to that many decimals. Handy for counters. Color channels are always rounded. |
| `edgeClassName` | `false` | Adds `cabelo-before`, `cabelo-inside` or `cabelo-after` to the target depending on where the scroll position is relative to the tween. Pass a string to use another prefix: `edgeClassName: 'hero'` adds `hero-before`, and so on. |
| `immediateRender` | `true` | When `false`, the tween doesn't touch the target until the scroll position reaches its first position. Before that, the target keeps its original value. |

## Overlapping tweens

Several tweens can animate the same property of the same target. At any scroll position, the value comes from:

1. the tween that **started most recently**, among those that already started (if two start at the same position, the one added last);
2. if none started yet, the tween that starts first, with its first value (unless it has `immediateRender: false`).

```js
tl
  .add({ targets: '.title', duration: [0, 1000], rotate: [100, 0] })
  .add({ targets: '.title', duration: [1500, 3000], rotate: [0, 360] });
```

Here `rotate` goes from 100 to 0 during the first 1000px, stays at 0 until 1500, then turns to 360. Values are computed from the scroll position alone, so the result is the same whether you scroll slowly, jump with the scrollbar, or reload the page halfway down.
