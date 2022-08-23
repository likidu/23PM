import { Subscribable } from './subscribable';
import { isServer } from './utils';
export class OnlineManager extends Subscribable {
    constructor() {
        super();
        this.setup = onOnline => {
            if (!isServer && (window === null || window === void 0 ? void 0 : window.addEventListener)) {
                const listener = () => onOnline();
                // Listen to online
                window.addEventListener('online', listener, false);
                window.addEventListener('offline', listener, false);
                return () => {
                    // Be sure to unsubscribe if a new handler is set
                    window.removeEventListener('online', listener);
                    window.removeEventListener('offline', listener);
                };
            }
        };
    }
    onSubscribe() {
        if (!this.cleanup) {
            this.setEventListener(this.setup);
        }
    }
    onUnsubscribe() {
        var _a;
        if (!this.hasListeners()) {
            (_a = this.cleanup) === null || _a === void 0 ? void 0 : _a.call(this);
            this.cleanup = undefined;
        }
    }
    setEventListener(setup) {
        var _a;
        this.setup = setup;
        (_a = this.cleanup) === null || _a === void 0 ? void 0 : _a.call(this);
        this.cleanup = setup((online) => {
            if (typeof online === 'boolean') {
                this.setOnline(online);
            }
            else {
                this.onOnline();
            }
        });
    }
    setOnline(online) {
        this.online = online;
        if (online) {
            this.onOnline();
        }
    }
    onOnline() {
        this.listeners.forEach(listener => {
            listener();
        });
    }
    isOnline() {
        if (typeof this.online === 'boolean') {
            return this.online;
        }
        if (typeof navigator === 'undefined' ||
            typeof navigator.onLine === 'undefined') {
            return true;
        }
        return navigator.onLine;
    }
}
export const onlineManager = new OnlineManager();
