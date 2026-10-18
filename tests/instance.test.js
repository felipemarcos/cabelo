import cabelo, { Easing, Instance } from '../src/index.js';

function box(style = '') {
  const el = document.createElement('div');
  el.setAttribute('style', style);
  document.body.appendChild(el);
  return el;
}

function mockRect(el, rect) {
  el.getBoundingClientRect = () => Object.assign({ top: 0, left: 0, width: 0, height: 0 }, rect);
}

let warn;

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('style');
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

describe('cabelo()', () => {
  test('returns an instance', () => {
    const tl = cabelo();
    expect(tl).toBeInstanceOf(Instance);
    expect(cabelo.Easing).toBe(Easing);
    expect(cabelo.Instance).toBe(Instance);
  });

  test('methods are chainable', () => {
    const el = box();
    const tl = cabelo();

    expect(tl.add({ targets: el, duration: [0, 100], opacity: [0, 1] })).toBe(tl);
    expect(tl.hook({ duration: 10 })).toBe(tl);
    expect(tl.on('update', () => {})).toBe(tl);
    expect(tl.off('update')).toBe(tl);
    expect(tl.render(0)).toBe(tl);
  });
});

describe('tweens', () => {
  test('transforms', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [0, 1000], y: [0, 100], rotate: [0, 90] });

    tl.render(0);
    expect(el.style.transform).toBe('translateY(0px) rotate(0deg)');

    tl.render(500);
    expect(el.style.transform).toBe('translateY(50px) rotate(45deg)');

    tl.render(2000);
    expect(el.style.transform).toBe('translateY(100px) rotate(90deg)');
  });

  test('css properties keep their unit', () => {
    const el = box('width: 10px');
    const tl = cabelo().add({ targets: el, duration: [0, 100], width: [0, 200], opacity: [0, 1] });

    tl.render(50);
    expect(el.style.width).toBe('100px');
    expect(el.style.opacity).toBe('0.5');
  });

  test('duration as a number, and from/to', () => {
    const a = box();
    const b = box();

    const tl = cabelo()
      .add({ targets: a, duration: 200, opacity: [0, 1] })
      .add({ targets: b, from: 100, to: 300, opacity: [0, 1] });

    tl.render(100);
    expect(a.style.opacity).toBe('0.5');
    expect(b.style.opacity).toBe('0');

    tl.render(200);
    expect(b.style.opacity).toBe('0.5');
    expect(tl.duration).toBe(300);
  });

  test('multiple keyframes', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [0, 100, 200], x: [0, 100, 0] });

    tl.render(50);
    expect(el.style.transform).toBe('translateX(50px)');
    tl.render(150);
    expect(el.style.transform).toBe('translateX(50px)');
    tl.render(200);
    expect(el.style.transform).toBe('translateX(0px)');
  });

  test('more values than positions are spread evenly', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [0, 200], x: [0, 100, 0] });

    tl.render(100);
    expect(el.style.transform).toBe('translateX(100px)');
    tl.render(150);
    expect(el.style.transform).toBe('translateX(50px)');
    expect(warn).not.toHaveBeenCalled();
  });

  test('easing', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [0, 100], x: [0, 100], easing: (t) => t * t });

    tl.render(50);
    expect(el.style.transform).toBe('translateX(25px)');
  });

  test('a single value animates from the current value', () => {
    const el = box('opacity: 0.5');
    const tl = cabelo().add({ targets: el, duration: [0, 100], opacity: 1 });

    tl.render(0);
    expect(el.style.opacity).toBe('0.5');
    tl.render(50);
    expect(el.style.opacity).toBe('0.75');
  });

  test('relative values', () => {
    const el = box('transform: translateX(10px)');
    const tl = cabelo().add({ targets: el, duration: [0, 100, 200], x: ['+=10', '+=30', '-=40'] });

    tl.render(0);
    expect(el.style.transform).toBe('translateX(20px)');
    tl.render(100);
    expect(el.style.transform).toBe('translateX(50px)');
    tl.render(200);
    expect(el.style.transform).toBe('translateX(10px)');
  });

  test('function values receive the target, index and total', () => {
    const els = [box(), box(), box()];
    const fn = vi.fn((el, i) => [0, (i + 1) * 100]);

    const tl = cabelo().add({ targets: els, duration: (el, i) => [0, 100 * (i + 1)], x: fn });

    expect(fn).toHaveBeenCalledWith(els[2], 2, 3);

    tl.render(100);
    expect(els[0].style.transform).toBe('translateX(100px)');
    expect(els[1].style.transform).toBe('translateX(100px)');
    expect(els[2].style.transform).toBe('translateX(100px)');
  });

  test('colors keep their alpha channel', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [0, 100], backgroundColor: ['rgba(0, 0, 0, 0)', '#ff0000'] });

    tl.render(50);
    expect(el.style.backgroundColor).toBe('rgba(128, 0, 0, 0.5)');
  });

  test('named colors', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [0, 100], color: ['white', 'black'] });

    tl.render(50);
    expect(el.style.color).toBe('rgb(128, 128, 128)');
  });

  test('values that cannot be interpolated switch when the segment starts', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [100, 200], display: ['none', 'block'] });

    tl.render(100);
    expect(el.style.display).toBe('none');
    tl.render(101);
    expect(el.style.display).toBe('block');
  });

  test('mixed units are interpolated with calc()', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [0, 100], x: ['100px', '50vw'] });

    tl.render(50);
    expect(el.style.transform).toBe('translateX(calc(50px + 25vw))');
    tl.render(100);
    expect(el.style.transform).toBe('translateX(50vw)');
  });

  test('round', () => {
    const el = box();
    const counter = { value: 0 };

    const tl = cabelo()
      .add({ targets: counter, duration: [0, 3], value: [0, 10], round: true })
      .add({ targets: el, duration: [0, 3], opacity: [0, 1], round: 2 });

    tl.render(1);
    expect(counter.value).toBe(3);
    expect(el.style.opacity).toBe('0.33');
  });

  test('plain objects', () => {
    const obj = { progress: 0, label: '0%' };
    const tl = cabelo().add({ targets: obj, duration: [0, 100], progress: [0, 1], label: ['0%', '100%'] });

    tl.render(25);
    expect(obj.progress).toBe(0.25);
    expect(obj.label).toBe('25%');
  });

  test('CSS variables', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [0, 100], '--progress': [0, 1], '--offset': ['0px', '100px'] });

    tl.render(50);
    expect(el.style.getPropertyValue('--progress')).toBe('0.5');
    expect(el.style.getPropertyValue('--offset')).toBe('50px');
  });

  test('attributes', () => {
    const el = box();
    el.setAttribute('data-value', '0');

    const tl = cabelo().add({ targets: el, duration: [0, 100], 'data-value': [0, 100] });

    tl.render(50);
    expect(el.getAttribute('data-value')).toBe('50');
  });

  test('DOM properties, like a counter', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [0, 100], textContent: [0, 1000], round: true });

    tl.render(33);
    expect(el.textContent).toBe('330');
  });

  test('existing transforms are kept', () => {
    const el = box('transform: translate(-50%, -50%)');
    const tl = cabelo().add({ targets: el, duration: [0, 100], rotate: [0, 90] });

    tl.render(50);
    expect(el.style.transform).toBe('translate(-50%, -50%) rotate(45deg)');
  });

  test('unknown properties are ignored with a warning', () => {
    const el = box();
    cabelo().add({ targets: el, duration: [0, 100], notAProperty: [0, 1] });
    expect(warn).toHaveBeenCalled();
  });

  test('selector targets', () => {
    box().className = 'item';
    box().className = 'item';

    const tl = cabelo().add({ targets: '.item', duration: [0, 100], opacity: [0, 1] });
    expect(tl.tweens).toHaveLength(2);
  });
});

describe('integer properties', () => {
  test('zIndex is always rounded', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [0, 100], zIndex: [0, 10] });

    tl.render(33);
    expect(el.style.zIndex).toBe('3');
    tl.render(100);
    expect(el.style.zIndex).toBe('10');
  });
});

describe('percent translations', () => {
  test('xPercent and yPercent translate by a percentage', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [0, 100], xPercent: [0, -50], yPercent: [0, 100] });

    tl.render(50);
    expect(el.style.transform).toBe('translate(-25%, 0) translate(0, 50%)');
  });

  test('combine with x and keep inline transforms', () => {
    const el = box('transform: translate(-50%, -50%)');
    const tl = cabelo().add({ targets: el, duration: [0, 100], x: [0, 100], xPercent: [0, 10] });

    tl.render(100);
    expect(el.style.transform).toBe('translate(-50%, -50%) translateX(100px) translate(10%, 0)');

    tl.destroy({ revert: true });
    expect(el.style.transform).toBe('translate(-50%, -50%)');
  });
});

describe('tween callbacks', () => {
  function setup() {
    const el = box();
    const onEnter = vi.fn();
    const onLeave = vi.fn();
    const onUpdate = vi.fn(() => el.style.opacity);
    const tl = cabelo().add({ targets: el, duration: [100, 200], opacity: [0, 1], onEnter, onLeave, onUpdate });

    return { el, tl, onEnter, onLeave, onUpdate };
  }

  test('onEnter and onLeave fire when crossing the tween', () => {
    const { el, tl, onEnter, onLeave } = setup();

    tl.render(0);
    expect(onEnter).not.toHaveBeenCalled();

    tl.render(150);
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onEnter.mock.calls[0][0]).toMatchObject({ target: el, direction: 'down', position: 150, progress: 0.5 });

    tl.render(160);
    expect(onEnter).toHaveBeenCalledTimes(1);

    tl.render(300);
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(onLeave.mock.calls[0][0]).toMatchObject({ direction: 'down', progress: 1 });

    tl.render(150);
    expect(onEnter).toHaveBeenCalledTimes(2);
    expect(onEnter.mock.calls[1][0]).toMatchObject({ direction: 'up' });
  });

  test('jumping over the tween calls both', () => {
    const { tl, onEnter, onLeave } = setup();

    tl.render(0);
    tl.render(500);
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  test('onEnter fires on the first render when it starts inside', () => {
    const { tl, onEnter, onLeave } = setup();

    tl.render(150);
    expect(onEnter).toHaveBeenCalledTimes(1);

    const other = setup();
    other.tl.render(500);
    expect(other.onEnter).not.toHaveBeenCalled();
    expect(other.onLeave).not.toHaveBeenCalled();
    expect(onLeave).not.toHaveBeenCalled();
  });

  test('onUpdate fires when the progress changes, after rendering', () => {
    const { tl, onUpdate } = setup();

    tl.render(0);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0].progress).toBe(0);

    tl.render(50);
    expect(onUpdate).toHaveBeenCalledTimes(1);

    tl.render(150);
    expect(onUpdate).toHaveBeenCalledTimes(2);
    expect(onUpdate.mock.results[1].value).toBe('0.5');

    tl.render(400);
    tl.render(500);
    expect(onUpdate).toHaveBeenCalledTimes(3);
    expect(onUpdate.mock.calls[2][0].progress).toBe(1);
  });

  test('are not animated properties', () => {
    setup();
    expect(warn).not.toHaveBeenCalled();
  });

  test('nested tweens have their own callbacks', () => {
    const el = box();
    const parent = vi.fn();
    const nested = vi.fn();

    const tl = cabelo().add({
      targets: el,
      duration: [0, 100],
      x: [0, 100],
      onUpdate: parent,
      opacity: { duration: [100, 200], value: [0, 1], onUpdate: nested }
    });

    tl.render(50);
    expect(parent.mock.calls[0][0].progress).toBe(0.5);
    expect(nested.mock.calls[0][0].progress).toBe(0);

    tl.render(150);
    expect(nested.mock.calls[1][0].progress).toBe(0.5);
    expect(parent).toHaveBeenCalledTimes(2);
  });
});

describe('nested tweens', () => {
  test('have their own duration', () => {
    const el = box();

    const tl = cabelo().add({
      targets: el,
      duration: [0, 100],
      x: [0, 100],
      opacity: { duration: [100, 200], value: [0, 1] }
    });

    tl.render(50);
    expect(el.style.opacity).toBe('0');
    tl.render(150);
    expect(el.style.opacity).toBe('0.5');
  });

  test('inherit the parent duration and easing', () => {
    const el = box();

    const tl = cabelo().add({
      targets: el,
      duration: [0, 100],
      easing: (t) => t * t,
      opacity: { value: [0, 1] },
      x: { value: [0, 100], easing: 'linear' }
    });

    tl.render(50);
    expect(el.style.opacity).toBe('0.25');
    expect(el.style.transform).toBe('translateX(50px)');
  });
});

describe('overlapping tweens', () => {
  function setup(options = {}) {
    const el = box();

    const tl = cabelo()
      .add({ targets: el, duration: [0, 1000], rotate: [100, 0] })
      .add(Object.assign({ targets: el, duration: [1500, 3000], rotate: [0, 360] }, options));

    return { el, tl };
  }

  test('the tween that started most recently wins', () => {
    const { el, tl } = setup();

    tl.render(500);
    expect(el.style.transform).toBe('rotate(50deg)');
    tl.render(1200);
    expect(el.style.transform).toBe('rotate(0deg)');
    tl.render(2250);
    expect(el.style.transform).toBe('rotate(180deg)');
  });

  test('jumping back does not leave a stale value', () => {
    const { el, tl } = setup();

    tl.render(3000);
    tl.render(500);
    expect(el.style.transform).toBe('rotate(50deg)');
  });

  test('immediateRender: false restores the original value before the tween starts', () => {
    const el = box('opacity: 0.3');
    const tl = cabelo().add({ targets: el, duration: [100, 200], opacity: [0, 1], immediateRender: false });

    tl.render(0);
    expect(el.style.opacity).toBe('0.3');
    tl.render(150);
    expect(el.style.opacity).toBe('0.5');
    tl.render(0);
    expect(el.style.opacity).toBe('0.3');
  });
});

describe('edge class names', () => {
  test('default prefix', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [100, 200], edgeClassName: true });

    tl.render(0);
    expect(el.className).toBe('cabelo-before');
    tl.render(150);
    expect(el.className).toBe('cabelo-inside');
    tl.render(300);
    expect(el.className).toBe('cabelo-after');
  });

  test('custom prefix', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [100, 200], edgeClassName: 'hero' });

    tl.render(150);
    expect(el.classList.contains('hero-inside')).toBe(true);
  });
});

describe('hooks', () => {
  test('a point: enter after it, leave before it', () => {
    const enter = vi.fn();
    const leave = vi.fn();
    const tl = cabelo().hook({ duration: 500, enter, leave });

    tl.render(0);
    expect(enter).not.toHaveBeenCalled();

    tl.render(600);
    expect(enter).toHaveBeenCalledTimes(1);
    expect(enter.mock.calls[0][0]).toMatchObject({ direction: 'down', scrollTop: 600 });

    tl.render(700);
    expect(enter).toHaveBeenCalledTimes(1);

    tl.render(100);
    expect(leave).toHaveBeenCalledTimes(1);
    expect(leave.mock.calls[0][0]).toMatchObject({ direction: 'up' });
  });

  test('a range', () => {
    const enter = vi.fn();
    const leave = vi.fn();
    const tl = cabelo().hook({ duration: [100, 200], enter, leave });

    tl.render(150);
    tl.render(250);
    tl.render(150);
    tl.render(50);

    expect(enter).toHaveBeenCalledTimes(2);
    expect(leave).toHaveBeenCalledTimes(2);
  });

  test('toggles a class on each target', () => {
    const a = box();
    const b = box();
    mockRect(a, { top: 1000, height: 100 });
    mockRect(b, { top: 2000, height: 100 });

    const tl = cabelo({ forceHeight: false })
      .hook({ targets: [a, b], duration: ['top-top', 'bottom-top'], className: 'is-active' });

    tl.render(1050);
    expect(a.classList.contains('is-active')).toBe(true);
    expect(b.classList.contains('is-active')).toBe(false);

    tl.render(2050);
    expect(a.classList.contains('is-active')).toBe(false);
    expect(b.classList.contains('is-active')).toBe(true);
  });
});

describe('events', () => {
  test('begin and complete fire once per crossing', () => {
    const begin = vi.fn();
    const complete = vi.fn();
    const el = box();

    const tl = cabelo()
      .add({ targets: el, duration: [0, 100], opacity: [0, 1] })
      .on('begin', begin)
      .on('complete', complete);

    tl.render(0);
    tl.render(50);
    tl.render(60);
    expect(begin).toHaveBeenCalledTimes(1);

    tl.render(100);
    tl.render(120);
    expect(complete).toHaveBeenCalledTimes(1);

    tl.render(0);
    tl.render(150);
    expect(begin).toHaveBeenCalledTimes(2);
    expect(complete).toHaveBeenCalledTimes(2);
  });

  test('update has the progress and direction', () => {
    const update = vi.fn();
    const el = box();

    const tl = cabelo()
      .add({ targets: el, duration: [0, 200], opacity: [0, 1] })
      .on('update', update);

    tl.render(100);
    tl.render(50);

    expect(update.mock.calls[0][0]).toEqual({ scrollTop: 100, position: 100, progress: 0.5, direction: 'down' });
    expect(update.mock.calls[1][0]).toMatchObject({ progress: 0.25, direction: 'up' });
  });

  test('once and off', () => {
    const listener = vi.fn();
    const tl = cabelo().once('update', listener);

    tl.render(0);
    tl.render(10);
    expect(listener).toHaveBeenCalledTimes(1);

    const other = vi.fn();
    tl.on('update', other).off('update', other).render(20);
    expect(other).not.toHaveBeenCalled();
  });

  test('ready and refresh', () => {
    const ready = vi.fn();
    const refresh = vi.fn();

    const tl = cabelo().on('ready', ready).on('refresh', refresh).init();

    expect(ready).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    tl.destroy();
  });
});

describe('relative positions', () => {
  test('are measured from the element', () => {
    const el = box();
    mockRect(el, { top: 1000, height: 200 });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 800, configurable: true });

    const tl = cabelo({ forceHeight: false })
      .add({ targets: el, duration: ['top-bottom', 'bottom-top'], opacity: [0, 1] });

    tl.refresh();
    expect(tl.tweens[0].positions).toEqual([200, 1200]);
    expect(tl.duration).toBe(1200);

    delete document.documentElement.clientHeight;
  });

  test('ignore the transforms applied by the tween', () => {
    const el = box();
    el.getBoundingClientRect = () => {
      const match = /translateY\((-?[\d.]+)px\)/.exec(el.style.transform);
      return { top: 1000 + (match ? parseFloat(match[1]) : 0), height: 100, left: 0, width: 0 };
    };

    const tl = cabelo({ forceHeight: false })
      .add({ targets: el, duration: ['top-top', 'top-top+100'], y: [0, 500] });

    tl.render(1100);
    expect(el.style.transform).toBe('translateY(500px)');

    tl.refresh();
    expect(tl.tweens[0].positions).toEqual([1000, 1100]);
  });

  test('inside a scroll container', () => {
    const container = box();
    const el = document.createElement('div');
    container.appendChild(el);

    mockRect(container, { top: 100 });
    mockRect(el, { top: 600, height: 100 });
    Object.defineProperty(container, 'clientHeight', { value: 400 });

    const tl = cabelo({ container, forceHeight: false })
      .add({ targets: el, duration: ['top-bottom', 'top-top'], opacity: [0, 1] });

    expect(tl.tweens[0].positions).toEqual([100, 500]);
  });
});

describe('lifecycle', () => {
  test('forceHeight makes the document tall enough', () => {
    const el = box();
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 800, configurable: true });

    const tl = cabelo().add({ targets: el, duration: [0, 2000], opacity: [0, 1] }).init();
    expect(document.documentElement.style.minHeight).toBe('2800px');

    tl.destroy();
    expect(document.documentElement.style.minHeight).toBe('');

    delete document.documentElement.clientHeight;
  });

  test('forceHeight in a scroll container sizes its content', () => {
    const container = box();
    const content = document.createElement('div');
    container.appendChild(content);
    Object.defineProperty(container, 'clientHeight', { value: 300 });

    const tl = cabelo({ container })
      .add({ targets: content, duration: [0, 1000], opacity: [0, 1] })
      .init();

    expect(content.style.minHeight).toBe('1300px');
    expect(container.style.minHeight).toBe('');
    tl.destroy();
  });

  test('destroy removes the listeners', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');

    const tl = cabelo().init();
    const added = add.mock.calls.map((call) => call[0]).sort();

    tl.destroy();
    const removed = remove.mock.calls.map((call) => call[0]).sort();

    expect(removed).toEqual(added);

    add.mockRestore();
    remove.mockRestore();
  });

  test('destroy({ revert: true }) restores the original values', () => {
    const el = box('opacity: 0.4; transform: translate(-50%, -50%)');
    el.setAttribute('data-x', '1');

    const tl = cabelo({ forceHeight: false })
      .add({ targets: el, duration: [0, 100], opacity: [0, 1], rotate: [0, 90], 'data-x': [0, 10], edgeClassName: true })
      .init();

    tl.render(50);
    expect(el.style.opacity).toBe('0.5');

    tl.destroy({ revert: true });
    expect(el.style.opacity).toBe('0.4');
    expect(el.style.transform).toBe('translate(-50%, -50%)');
    expect(el.getAttribute('data-x')).toBe('1');
    expect(el.className).toBe('');
  });

  test('remove(targets)', () => {
    const a = box();
    const b = box('opacity: 0.2');

    const tl = cabelo()
      .add({ targets: [a, b], duration: [0, 100], opacity: [0, 1] });

    tl.render(50);
    tl.remove(b);

    expect(tl.tweens).toHaveLength(1);
    expect(b.style.opacity).toBe('0.2');

    tl.render(100);
    expect(a.style.opacity).toBe('1');
    expect(b.style.opacity).toBe('0.2');
  });

  test('the scroll axis', () => {
    const container = box();
    Object.defineProperty(container, 'scrollLeft', { value: 120 });
    Object.defineProperty(container, 'scrollTop', { value: 999 });

    const tl = cabelo({ container, axis: 'x' });
    expect(tl.getScrollTop()).toBe(120);
  });
});

describe('scrollTo', () => {
  test('resolves when done', async () => {
    const container = box();
    const tl = cabelo({ container });

    const done = await tl.scrollTo(250);
    expect(done).toBe(true);
    expect(container.scrollTop).toBe(250);
  });

  test('a new scroll cancels the previous one', async () => {
    const container = box();
    const tl = cabelo({ container });

    const first = tl.scrollTo(1000, 10);
    const second = tl.scrollTo(100);

    expect(await first).toBe(false);
    expect(await second).toBe(true);
  });
});

describe('regressions', () => {
  test('complex values whose end starts with zero keep their units', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [0, 100], boxShadow: ['0 0 0 0 rgba(0, 0, 0, 0)', '0 20px 40px 8px #ff0000'] });

    tl.render(50);
    expect(el.style.boxShadow).toMatch(/^0 10px 20px 4px rgba\(127.5, ?0, ?0, ?0.5\)$/);
  });

  test('transforms are applied in a fixed order', () => {
    const el = box();
    const tl = cabelo().add({ targets: el, duration: [0, 100], scale: [1, 2], rotate: [0, 90], y: [0, 100] });

    tl.render(100);
    expect(el.style.transform).toBe('translateY(100px) rotate(90deg) scale(2)');
  });
});

describe('trigger', () => {
  test('relative positions are measured from the trigger', () => {
    const section = box();
    const el = box();
    mockRect(section, { top: 1000, height: 3000 });
    mockRect(el, { top: 0, height: 100 });
    Object.defineProperty(document.documentElement, 'clientHeight', { value: 800, configurable: true });

    const tl = cabelo({ forceHeight: false })
      .add({ targets: el, trigger: section, duration: ['top-top', 'bottom-bottom'], x: [0, 100], opacity: { value: [0, 1] } })
      .hook({ trigger: section, duration: 'center-center', enter() {} });

    expect(tl.tweens.map((tween) => tween.positions)).toEqual([[1000, 3200], [1000, 3200]]);
    expect(tl.hooks[0].positions).toEqual([2100, Infinity]);

    delete document.documentElement.clientHeight;
  });

  test('can be a function of the target', () => {
    const sections = [box(), box()];
    const items = sections.map((section) => section.appendChild(document.createElement('i')));
    mockRect(sections[0], { top: 100 });
    mockRect(sections[1], { top: 200 });

    const tl = cabelo({ forceHeight: false })
      .add({ targets: items, trigger: (el) => el.parentNode, duration: ['top-top', 'top-top+100'], x: [0, 1] });

    expect(tl.tweens.map((tween) => tween.positions)).toEqual([[100, 200], [200, 300]]);
  });
});

describe('refresh', () => {
  test('evaluates function values again', () => {
    const el = box();
    let width = 100;

    const tl = cabelo({ forceHeight: false })
      .add({ targets: el, duration: [0, 100], x: [0, () => width], y: () => [0, width] });

    tl.render(100);
    expect(el.style.transform).toBe('translateX(100px) translateY(100px)');

    width = 50;
    tl.refresh();
    tl.render(100);
    expect(el.style.transform).toBe('translateX(50px) translateY(50px)');
  });

  test('keeps single and relative values based on the original value', () => {
    const el = box('opacity: 0.5; transform: translateX(10px)');

    const tl = cabelo({ forceHeight: false })
      .add({ targets: el, duration: [0, 100], opacity: () => 1, x: [() => '+=10', '+=10'] });

    tl.render(100);
    tl.refresh();
    tl.render(0);

    expect(el.style.opacity).toBe('0.5');
    expect(el.style.transform).toBe('translateX(20px)');
  });
});

test('scrollTo a missing element stays in place', async () => {
  const container = box();
  container.scrollTop = 0;
  const tl = cabelo({ container });

  expect(await tl.scrollTo('#nope')).toBe(true);
  expect(warn).toHaveBeenCalled();
});
