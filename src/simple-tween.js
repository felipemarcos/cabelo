class SimpleTween {
  constructor(t) {
    this.tween = t;
  }

  tick(scrollY) {
    if (this.tween.duration >= scrollY) {
      this.tween.enter();
    } else {
      this.tween.leave();
    }
  }
}

export default SimpleTween;
