export class Subscribable {
    constructor() {
        this.listeners = [];
    }
    subscribe(listener) {
        const callback = listener || (() => undefined);
        this.listeners.push(callback);
        this.onSubscribe();
        return () => {
            this.listeners = this.listeners.filter(x => x !== callback);
            this.onUnsubscribe();
        };
    }
    hasListeners() {
        return this.listeners.length > 0;
    }
    onSubscribe() {
        // Do nothing
    }
    onUnsubscribe() {
        // Do nothing
    }
}
