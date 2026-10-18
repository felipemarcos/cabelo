class Emitter {
  constructor() {
    this.listeners = {};
  }

  on(eventName, listener) {
    (this.listeners[eventName] = this.listeners[eventName] || []).push(listener);
  }

  once(eventName, listener) {
    const wrapper = (...args) => {
      this.off(eventName, wrapper);
      listener(...args);
    };

    wrapper.listener = listener;
    this.on(eventName, wrapper);
  }

  off(eventName, listener) {
    if (!eventName) {
      this.listeners = {};
      return;
    }

    if (!listener) {
      delete this.listeners[eventName];
      return;
    }

    const listeners = this.listeners[eventName] || [];
    this.listeners[eventName] = listeners.filter((l) => l !== listener && l.listener !== listener);
  }

  emit(eventName, ...args) {
    (this.listeners[eventName] || [])
      .slice()
      .forEach((listener) => listener(...args));
  }
}

export default Emitter;
