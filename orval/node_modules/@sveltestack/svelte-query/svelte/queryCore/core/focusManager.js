import { Subscribable } from './subscribable';
import { isServer } from './utils';
export class FocusManager extends Subscribable {
    constructor() {
        super();
        this.setup = onFocus => {
            if (!isServer && (window === null || window === void 0 ? void 0 : window.addEventListener)) {
                const listener = () => onFocus();
                // Listen to visibillitychange and focus
                window.addEventListener('visibilitychange', listener, false);
                window.addEventListener('focus', listener, false);
                return () => {
                    // Be sure to unsubscribe if a new handler is set
                    window.removeEventListener('visibilitychange', listener);
                    window.removeEventListener('focus', listener);
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
        this.cleanup = setup(focused => {
            if (typeof focused === 'boolean') {
                this.setFocused(focused);
            }
            else {
                this.onFocus();
            }
        });
    }
    setFocused(focused) {
        this.focused = focused;
        if (focused) {
            this.onFocus();
        }
    }
    onFocus() {
        this.listeners.forEach(listener => {
            listener();
        });
    }
    isFocused() {
        if (typeof this.focused === 'boolean') {
            return this.focused;
        }
        // document global can be unavailable in react native
        if (typeof document === 'undefined') {
            return true;
        }
        return [undefined, 'visible', 'prerender'].includes(document.visibilityState);
    }
}
export const focusManager = new FocusManager();
