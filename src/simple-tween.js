const EADGES = {
  ENTER: 'enter',
  LEAVE: 'leave'
};

class SimpleTween {
  constructor(t) {
    this.tween = t;
    this.edge = EADGES.LEAVE;
  }

  tick(scrollY) {
    if (scrollY >= this.tween.duration) {
      if (this.edge !== EADGES.ENTER) {
        this.enter();

        this.edge = EADGES.ENTER;
      }
    } else {
      if (this.edge !== EADGES.LEAVE) {
        this.leave();

        this.edge = EADGES.LEAVE;
      }
    }
  }

  enter() {
    if (this.tween.enter) {
      this.tween.enter();
    }
  }

  leave() {
    if (this.tween.leave) {
      this.tween.leave();
    }
  }

  getMaxDuration() {
    return this.tween.duration;
  }
}

export default SimpleTween;
