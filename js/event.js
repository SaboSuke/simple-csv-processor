class EventEmitter {
    on(name, callback) {
        var callbacks = this[name];
        if (!callbacks) this[name] = [callback];
        else callbacks.push(callback);
    }

    dispatch(name, event) {
        var callbacks = this[name];
        if (callbacks) callbacks.forEach(callback => callback(event));
    }
}

var emitter = new EventEmitter();

emitter.on('test', event => {
    console.log(event);
});

emitter.dispatch('test', 'hello world');