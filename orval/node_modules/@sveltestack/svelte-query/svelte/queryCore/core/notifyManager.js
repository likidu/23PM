import { scheduleMicrotask } from './utils';
// CLASS
export class NotifyManager {
    constructor() {
        this.queue = [];
        this.transactions = 0;
        this.notifyFn = (callback) => {
            callback();
        };
        this.batchNotifyFn = (callback) => {
            callback();
        };
    }
    batch(callback) {
        let result;
        this.transactions++;
        try {
            result = callback();
        }
        finally {
            this.transactions--;
            if (!this.transactions) {
                this.flush();
            }
        }
        return result;
    }
    schedule(callback) {
        if (this.transactions) {
            this.queue.push(callback);
        }
        else {
            scheduleMicrotask(() => {
                this.notifyFn(callback);
            });
        }
    }
    /**
     * All calls to the wrapped function will be batched.
     */
    batchCalls(callback) {
        return ((...args) => {
            this.schedule(() => {
                callback(...args);
            });
        });
    }
    flush() {
        const queue = this.queue;
        this.queue = [];
        if (queue.length) {
            scheduleMicrotask(() => {
                this.batchNotifyFn(() => {
                    queue.forEach(callback => {
                        this.notifyFn(callback);
                    });
                });
            });
        }
    }
    /**
     * Use this method to set a custom notify function.
     * This can be used to for example wrap notifications with `React.act` while running tests.
     */
    setNotifyFunction(fn) {
        this.notifyFn = fn;
    }
    /**
     * Use this method to set a custom function to batch notifications together into a single tick.
     * By default React Query will use the batch function provided by ReactDOM or React Native.
     */
    setBatchNotifyFunction(fn) {
        this.batchNotifyFn = fn;
    }
}
// SINGLETON
export const notifyManager = new NotifyManager();
