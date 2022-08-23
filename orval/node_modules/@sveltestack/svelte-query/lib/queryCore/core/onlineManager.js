"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlineManager = exports.OnlineManager = void 0;
const subscribable_1 = require("./subscribable");
const utils_1 = require("./utils");
class OnlineManager extends subscribable_1.Subscribable {
    constructor() {
        super();
        this.setup = onOnline => {
            if (!utils_1.isServer && (window === null || window === void 0 ? void 0 : window.addEventListener)) {
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
exports.OnlineManager = OnlineManager;
exports.onlineManager = new OnlineManager();
