// Compile-time checks for index.d.ts. Run with `npm run typecheck`.
import cabelo, { Easing, Instance } from '..';

const tl: Instance = cabelo({ container: '.scroller', axis: 'x', forceHeight: false });

tl
  .add({
    targets: '.box',
    duration: [0, 1000],
    y: [-100, 0],
    opacity: 1,
    backgroundColor: ['#fff', 'rgb(0, 0, 0)'],
    '--progress': [0, 1],
    scale: { duration: ['top-bottom', 'bottom-top'], value: [0.5, 1], easing: 'ease-out' },
    easing: [0.2, 0, 0, 1],
    round: 2,
    edgeClassName: 'hero',
    xPercent: [0, -50],
    onEnter: ({ target, direction }) => target && direction === 'down',
    onUpdate: ({ progress }) => progress.toFixed(2),
    rotate: { value: [0, 90], onLeave: ({ position }) => position }
  })
  .add({
    targets: document.querySelectorAll('.item'),
    duration: (el, i) => [i * 100, i * 100 + 500],
    x: (el, i, total) => [0, (i / total) * 100],
    easing: (t) => t * t
  })
  .add({ targets: { value: 0 }, from: 0, to: 500, value: [0, 100] })
  .hook({ duration: 500, enter: ({ direction }) => direction === 'down' })
  .hook({ targets: '.card', duration: ['top-bottom', 'bottom-top'], className: 'is-visible' })
  .on('update', ({ progress, direction }) => progress.toFixed(2) + direction)
  .on('complete', ({ scrollTop }) => scrollTop)
  .once('ready', () => {})
  .init();

const position: number = tl.scrollTop + tl.progress + tl.duration;

tl.scrollTo('end', 1, 'ease-out').then((completed: boolean) => completed);
tl.scrollTo(document.body).cancel();
tl.remove('.box').destroy({ revert: true });

Easing['my-easing'] = [0.5, 0, 0.5, 1];
cabelo.Easing['other'] = (t: number) => t;

// @ts-expect-error unknown event
tl.on('nope', () => {});

// @ts-expect-error targets are required
tl.add({ duration: [0, 100] });

// @ts-expect-error invalid axis
cabelo({ axis: 'z' });

export { position };

// Namespace types are reachable from the default import
const options: cabelo.TweenOptions = { targets: '.box', duration: [0, 100], x: [0, 100] };
const hookOptions: cabelo.HookOptions = { at: 'top-center', targets: '.box' };
cabelo().add(options).hook(hookOptions);

// Shared page timeline
const page: Instance = cabelo
  .add({ targets: '.photo', duration: ['top-bottom', 'bottom-top'], y: [-60, 60] })
  .hook({ targets: '.card', duration: ['top-bottom', 'bottom-top'], className: 'is-visible' });

cabelo.hook({ duration: 100 }).on('update', ({ progress }) => progress);
cabelo.on('ready', () => {});
cabelo.remove('.photo').refresh();
cabelo.scrollTo('.card', 1).then((completed: boolean) => completed);
cabelo.destroy({ revert: true });
cabelo({ autoInit: false }).init();

// @ts-expect-error unknown event
cabelo.on('nope', () => {});

export { page };
