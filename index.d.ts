// Type definitions for cabelo

declare namespace cabelo {
  /** A function that maps a progress in [0, 1] to an eased progress. */
  type EasingFunction = (progress: number) => number;

  /**
   * A named easing (`'ease-in-out-cubic'`), a CSS timing function string
   * (`'cubic-bezier(0.2, 0, 0, 1)'`, `'steps(4)'`), the four control points of
   * a cubic bezier, or a function.
   */
  type EasingDefinition = string | [number, number, number, number] | EasingFunction;

  /** Anything that can be animated: elements, selectors, lists of them or plain objects. */
  type Targets = string | Element | object | NodeList | HTMLCollection | ReadonlyArray<string | Element | object>;

  /**
   * A scroll position: a number in pixels, or a relative position such as
   * `'top-bottom'`, `'center-center'` or `'bottom-top+100'`.
   */
  type Position = number | string;

  /** Called once per target with the target, its index and the number of targets. */
  type FunctionValue<T> = (target: any, index: number, total: number) => T;

  type Positions = Position | ReadonlyArray<Position | FunctionValue<Position>> | FunctionValue<Position | Position[]>;

  type Value = number | string;

  type Values = Value | ReadonlyArray<Value | FunctionValue<Value>> | FunctionValue<Value | Value[]>;

  interface TweenDetails {
    /** The target of the tween. */
    target: any;
    /** How far through the tween the scroll position is, from 0 to 1. */
    progress: number;
    direction: Direction;
    scrollTop: number;
    position: number;
  }

  type TweenCallback = (details: TweenDetails) => void;

  interface TweenCallbacks {
    /** Called when the scroll position enters the tween, from either side. */
    onEnter?: TweenCallback;

    /** Called when the scroll position leaves the tween, to either side. */
    onLeave?: TweenCallback;

    /** Called after rendering, whenever the progress of the tween changes. */
    onUpdate?: TweenCallback;
  }

  /** A property with its own positions and options. */
  interface NestedTween extends TweenCallbacks {
    value?: Values;
    values?: Values;
    duration?: Positions;
    from?: Position;
    to?: Position;
    easing?: EasingDefinition;
    round?: boolean | number;
    immediateRender?: boolean;
    trigger?: string | Element | FunctionValue<string | Element>;
  }

  interface TweenOptions extends TweenCallbacks {
    /** What to animate. */
    targets: Targets;

    /** The scroll positions of the tween. A number `n` is the same as `[0, n]`. */
    duration?: Positions;

    /** Start position, an alternative to `duration`. Defaults to 0. */
    from?: Position;

    /** End position, an alternative to `duration`. */
    to?: Position;

    /**
     * The element relative positions are measured from, instead of the target.
     * An element, a selector, or a function that returns one per target.
     */
    trigger?: string | Element | FunctionValue<string | Element>;

    /** Defaults to `'linear'`. */
    easing?: EasingDefinition;

    /**
     * `true` rounds to integers, a number rounds to that many decimals.
     * `zIndex` and `order` are always rounded to integers.
     */
    round?: boolean | number;

    /**
     * Adds `cabelo-before`, `cabelo-inside` and `cabelo-after` classes to the
     * targets. A string replaces the `cabelo` prefix.
     */
    edgeClassName?: boolean | string;

    /**
     * When `false`, the tween leaves the target alone until the scroll
     * position reaches it. Defaults to `true`.
     */
    immediateRender?: boolean;

    /**
     * Any other key is an animated property: a transform (`x`, `y`, `xPercent`,
     * `yPercent`, `rotate`, `scale`...), a CSS property, a CSS variable (`'--name'`), an attribute
     * or a property of the target.
     */
    [property: string]: Values | NestedTween | Targets | boolean | EasingDefinition | TweenCallback | undefined;
  }

  interface HookDetails {
    direction: Direction;
    scrollTop: number;
    position: number;
    /** The target of the hook, or `null` for hooks without targets. */
    target: any;
  }

  interface HookOptions {
    /**
     * A single position (entered at and after it) or a `[start, end]` range
     * (entered while inside it).
     */
    duration?: Positions;

    /** Alias for `duration`. */
    at?: Positions;

    /** Creates one hook per target. Required by relative positions, unless there's a `trigger`. */
    targets?: Targets;

    /** The element relative positions are measured from, instead of the target. */
    trigger?: string | Element | FunctionValue<string | Element>;

    /** A class added to the target while the hook is entered. */
    className?: string;

    enter?: (details: HookDetails) => void;
    leave?: (details: HookDetails) => void;
  }

  interface Options {
    /** The scrolling element, or a selector for it. Defaults to the document. */
    container?: string | Element | null;

    /** The scroll axis. Defaults to `'y'`. */
    axis?: 'x' | 'y';

    /**
     * Makes the content tall (or wide) enough to scroll through the whole
     * timeline. Defaults to `true`.
     */
    forceHeight?: boolean;

    /**
     * The element that receives the forced size inside a custom container.
     * Defaults to the container's first child.
     */
    content?: string | Element;

    /**
     * Calls `init()` once the calls chained after `cabelo()` have run.
     * Defaults to `true`.
     */
    autoInit?: boolean;
  }

  type Direction = 'up' | 'down';

  interface UpdateEvent {
    scrollTop: number;
    position: number;
    /** Progress of the whole timeline, from 0 to 1. */
    progress: number;
    direction: Direction;
  }

  interface StateEvent {
    scrollTop: number;
    position: number;
    direction: Direction;
  }

  interface EventMap {
    ready: () => void;
    refresh: () => void;
    update: (event: UpdateEvent) => void;
    begin: (event: StateEvent) => void;
    complete: (event: StateEvent) => void;
  }

  interface DestroyOptions {
    /** Restores every animated property and class to its original value. */
    revert?: boolean;
  }

  /** A promise that can be cancelled. Resolves with `false` when cancelled. */
  interface ScrollPromise extends Promise<boolean> {
    cancel(): void;
  }

  class Instance {
    constructor(options?: Options);

    readonly options: Required<Pick<Options, 'axis' | 'forceHeight'>> & Options;
    readonly container: Element;

    /** The current scroll position. */
    readonly scrollTop: number;
    /** The direction of the last scroll. */
    readonly direction: Direction;
    /** The first position of the timeline. */
    readonly start: number;
    /** The last position of the timeline. */
    readonly end: number;
    /** Alias for `end`. */
    readonly duration: number;
    /** Progress of the whole timeline, from 0 to 1. */
    readonly progress: number;

    add(tween: TweenOptions): this;
    hook(hook: HookOptions): this;
    /** Removes the tweens and hooks of the targets (or all of them), restoring their values. */
    remove(targets?: Targets): this;

    /** Measures, renders and starts listening to scroll and resize events. */
    init(): this;
    /** Measures relative positions and the scrollable size again, then renders. */
    refresh(): this;
    /** Renders every tween at a scroll position (the current one by default). */
    render(scrollTop?: number): this;
    destroy(options?: DestroyOptions): this;

    /**
     * Smoothly scrolls to a position, `'start'`, `'end'`, an element or a selector.
     * @param duration In seconds. Defaults to 0.
     * @param easing Defaults to `'ease-in-out-cubic'`.
     */
    scrollTo(to: number | string | Element, duration?: number, easing?: EasingDefinition): ScrollPromise;
    stopScroll(): this;

    on<K extends keyof EventMap>(eventName: K, listener: EventMap[K]): this;
    once<K extends keyof EventMap>(eventName: K, listener: EventMap[K]): this;
    off<K extends keyof EventMap>(eventName?: K, listener?: EventMap[K]): this;

    getScrollTop(): number;
    setScrollTop(scrollTop: number): void;
    getTotalDuration(): number;
    getProgress(): number;
    getDirection(): Direction;
    getClientHeight(): number;
  }

  const Easing: Record<string, [number, number, number, number] | EasingFunction>;

  // The shared timeline of the page scroll, created on first use. Each
  // function calls the method of the same name and returns that timeline.

  function add(tween: TweenOptions): Instance;
  function hook(hook: HookOptions): Instance;
  function remove(targets?: Targets): Instance;
  function on<K extends keyof EventMap>(eventName: K, listener: EventMap[K]): Instance;
  function once<K extends keyof EventMap>(eventName: K, listener: EventMap[K]): Instance;
  function off<K extends keyof EventMap>(eventName?: K, listener?: EventMap[K]): Instance;
  function refresh(): Instance;
  function render(scrollTop?: number): Instance;
  function scrollTo(to: number | string | Element, duration?: number, easing?: EasingDefinition): ScrollPromise;
  function stopScroll(): Instance;
  /** Destroys the shared timeline, if there is one. The next `cabelo.add()` starts a new one. */
  function destroy(options?: DestroyOptions): Instance | undefined;
}

declare function cabelo(options?: cabelo.Options): cabelo.Instance;

export import Easing = cabelo.Easing;
export import Instance = cabelo.Instance;
export default cabelo;
