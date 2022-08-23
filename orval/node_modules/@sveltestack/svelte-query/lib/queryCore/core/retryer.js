"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Retryer = exports.isCancelledError = exports.CancelledError = exports.isCancelable = void 0;
const focusManager_1 = require("./focusManager");
const onlineManager_1 = require("./onlineManager");
const utils_1 = require("./utils");
require("./types");
function defaultRetryDelay(failureCount) {
    return Math.min(1000 * 2 ** failureCount, 30000);
}
function isCancelable(value) {
    return typeof (value === null || value === void 0 ? void 0 : value.cancel) === 'function';
}
exports.isCancelable = isCancelable;
class CancelledError {
    constructor(options) {
        this.revert = options === null || options === void 0 ? void 0 : options.revert;
        this.silent = options === null || options === void 0 ? void 0 : options.silent;
    }
}
exports.CancelledError = CancelledError;
function isCancelledError(value) {
    return value instanceof CancelledError;
}
exports.isCancelledError = isCancelledError;
// CLASS
class Retryer {
    constructor(config) {
        let cancelRetry = false;
        let cancelFn;
        let continueFn;
        let promiseResolve;
        let promiseReject;
        this.abort = config.abort;
        this.cancel = cancelOptions => cancelFn === null || cancelFn === void 0 ? void 0 : cancelFn(cancelOptions);
        this.cancelRetry = () => {
            cancelRetry = true;
        };
        this.continueRetry = () => {
            cancelRetry = false;
        };
        this.continue = () => continueFn === null || continueFn === void 0 ? void 0 : continueFn();
        this.failureCount = 0;
        this.isPaused = false;
        this.isResolved = false;
        this.isTransportCancelable = false;
        this.promise = new Promise((outerResolve, outerReject) => {
            promiseResolve = outerResolve;
            promiseReject = outerReject;
        });
        const resolve = (value) => {
            var _a;
            if (!this.isResolved) {
                this.isResolved = true;
                (_a = config.onSuccess) === null || _a === void 0 ? void 0 : _a.call(config, value);
                continueFn === null || continueFn === void 0 ? void 0 : continueFn();
                promiseResolve(value);
            }
        };
        const reject = (value) => {
            var _a;
            if (!this.isResolved) {
                this.isResolved = true;
                (_a = config.onError) === null || _a === void 0 ? void 0 : _a.call(config, value);
                continueFn === null || continueFn === void 0 ? void 0 : continueFn();
                promiseReject(value);
            }
        };
        const pause = () => {
            return new Promise(continueResolve => {
                var _a;
                continueFn = continueResolve;
                this.isPaused = true;
                (_a = config.onPause) === null || _a === void 0 ? void 0 : _a.call(config);
            }).then(() => {
                var _a;
                continueFn = undefined;
                this.isPaused = false;
                (_a = config.onContinue) === null || _a === void 0 ? void 0 : _a.call(config);
            });
        };
        // Create loop function
        const run = () => {
            // Do nothing if already resolved
            if (this.isResolved) {
                return;
            }
            let promiseOrValue;
            // Execute query
            try {
                promiseOrValue = config.fn();
            }
            catch (error) {
                promiseOrValue = Promise.reject(error);
            }
            // Create callback to cancel this fetch
            cancelFn = cancelOptions => {
                var _a;
                if (!this.isResolved) {
                    reject(new CancelledError(cancelOptions));
                    (_a = this.abort) === null || _a === void 0 ? void 0 : _a.call(this);
                    // Cancel transport if supported
                    if (isCancelable(promiseOrValue)) {
                        try {
                            promiseOrValue.cancel();
                        }
                        catch (_b) { }
                    }
                }
            };
            // Check if the transport layer support cancellation
            this.isTransportCancelable = isCancelable(promiseOrValue);
            Promise.resolve(promiseOrValue)
                .then(resolve)
                .catch(error => {
                var _a, _b, _c;
                // Stop if the fetch is already resolved
                if (this.isResolved) {
                    return;
                }
                // Do we need to retry the request?
                const retry = (_a = config.retry) !== null && _a !== void 0 ? _a : 3;
                const retryDelay = (_b = config.retryDelay) !== null && _b !== void 0 ? _b : defaultRetryDelay;
                const delay = typeof retryDelay === 'function'
                    ? retryDelay(this.failureCount, error)
                    : retryDelay;
                const shouldRetry = retry === true ||
                    (typeof retry === 'number' && this.failureCount < retry) ||
                    (typeof retry === 'function' && retry(this.failureCount, error));
                if (cancelRetry || !shouldRetry) {
                    // We are done if the query does not need to be retried
                    reject(error);
                    return;
                }
                this.failureCount++;
                // Notify on fail
                (_c = config.onFail) === null || _c === void 0 ? void 0 : _c.call(config, this.failureCount, error);
                // Delay
                utils_1.sleep(delay)
                    // Pause if the document is not visible or when the device is offline
                    .then(() => {
                    if (!focusManager_1.focusManager.isFocused() || !onlineManager_1.onlineManager.isOnline()) {
                        return pause();
                    }
                })
                    .then(() => {
                    if (cancelRetry) {
                        reject(error);
                    }
                    else {
                        run();
                    }
                });
            });
        };
        // Start loop
        run();
    }
}
exports.Retryer = Retryer;
