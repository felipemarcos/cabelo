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
    if (scrollY >= this.tween.duration ) {
      if (this.edge !== EADGES.ENTER) {
        this.tween.enter();
        this.edge = EADGES.ENTER;
      }
    } else {
      if (this.edge !== EADGES.LEAVE) {
        this.tween.leave();
        this.edge = EADGES.LEAVE;
      }
    }
  }

  getMaxDuration() {
    return this.tween.duration;
  }
}

export default SimpleTween;
