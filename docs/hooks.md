# Hooks

Hooks run code, or toggle a class, when the scroll position crosses a point or enters a range. They don't animate anything themselves, which makes them a good fit for things like starting a video, lazy loading, analytics, or handing an animation over to CSS transitions.

```js
tl.hook({
  duration: 1500,
  enter({ direction }) {
    console.log('scrolled past 1500px', direction);
  },
  leave() {
    console.log('scrolled back above 1500px');
  }
});
```

## Points and ranges

`duration` (or its alias `at`) accepts the same [positions](tweens.md#positions) as tweens:

| Definition | Entered when the scroll position is... |
| --- | --- |
| A single position: `1500`, `'top-center'` | at or after it |
| A range: `[1000, 2000]`, `['top-bottom', 'bottom-top']` | between both positions |

`enter` is called when the scroll position goes from outside to inside, and `leave` when it goes from inside to outside. If the page is already inside when the timeline starts (for example after a reload halfway down), `enter` is called right away.

## Targets and classes

With `targets`, cabelo creates one hook per target. That's required for relative positions, and lets you toggle a class on each target with `className`:

```js
tl.hook({
  targets: '.card',
  duration: ['top-bottom-100', 'bottom-top'],
  className: 'is-visible'
});
```

```css
.card {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.6s, transform 0.6s;
}

.card.is-visible {
  opacity: 1;
  transform: none;
}
```

Each card gets `is-visible` while it's on screen (starting 100px before it enters), and loses it when it leaves.

Like tweens, hooks accept a [`trigger`](tweens.md#measuring-another-element) to measure relative positions from another element. A hook with a `trigger` doesn't need `targets`:

```js
tl.hook({
  trigger: '#pricing',
  duration: ['top-center', 'bottom-center'],
  enter: () => nav.highlight('pricing'),
  leave: () => nav.highlight(null)
});
```

## Callback details

`enter` and `leave` receive an object with:

| Property | Description |
| --- | --- |
| `direction` | `'down'` or `'up'` |
| `scrollTop` | The current scroll position |
| `position` | Same as `scrollTop` |
| `target` | The target of this hook, or `null` |

```js
tl.hook({
  targets: 'video',
  duration: ['top-bottom', 'bottom-top'],
  enter: ({ target }) => target.play(),
  leave: ({ target }) => target.pause()
});
```

## Hooks and the timeline length

Hooks count towards the length of the timeline: a hook at `5000` makes the page at least 5000px scrollable when [`forceHeight`](api.md#options) is on.
