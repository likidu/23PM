(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Query = {}));
}(this, (function (exports) { 'use strict';

    class Subscribable {
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

    // UTILS
    const isServer = typeof window === 'undefined';
    function noop() {
        return undefined;
    }
    function functionalUpdate(updater, input) {
        return typeof updater === 'function'
            ? updater(input)
            : updater;
    }
    function isValidTimeout(value) {
        return typeof value === 'number' && value >= 0 && value !== Infinity;
    }
    function ensureQueryKeyArray(value) {
        return (Array.isArray(value)
            ? value
            : [value]);
    }
    function difference(array1, array2) {
        return array1.filter(x => array2.indexOf(x) === -1);
    }
    function replaceAt(array, index, value) {
        const copy = array.slice(0);
        copy[index] = value;
        return copy;
    }
    function timeUntilStale(updatedAt, staleTime) {
        return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0);
    }
    function parseQueryArgs(arg1, arg2, arg3) {
        if (!isQueryKey(arg1)) {
            return arg1;
        }
        if (typeof arg2 === 'function') {
            return Object.assign(Object.assign({}, arg3), { queryKey: arg1, queryFn: arg2 });
        }
        return Object.assign(Object.assign({}, arg2), { queryKey: arg1 });
    }
    function parseMutationArgs(arg1, arg2, arg3) {
        if (isQueryKey(arg1)) {
            if (typeof arg2 === 'function') {
                return Object.assign(Object.assign({}, arg3), { mutationKey: arg1, mutationFn: arg2 });
            }
            return Object.assign(Object.assign({}, arg2), { mutationKey: arg1 });
        }
        if (typeof arg1 === 'function') {
            return Object.assign(Object.assign({}, arg2), { mutationFn: arg1 });
        }
        return Object.assign({}, arg1);
    }
    function parseFilterArgs(arg1, arg2, arg3) {
        return (isQueryKey(arg1)
            ? [Object.assign(Object.assign({}, arg2), { queryKey: arg1 }), arg3]
            : [arg1 || {}, arg2]);
    }
    function mapQueryStatusFilter(active, inactive) {
        if ((active === true && inactive === true) ||
            (active == null && inactive == null)) {
            return 'all';
        }
        else if (active === false && inactive === false) {
            return 'none';
        }
        else {
            // At this point, active|inactive can only be true|false or false|true
            // so, when only one value is provided, the missing one has to be the negated value
            const isActive = active !== null && active !== void 0 ? active : !inactive;
            return isActive ? 'active' : 'inactive';
        }
    }
    function matchQuery(filters, query) {
        const { active, exact, fetching, inactive, predicate, queryKey, stale, } = filters;
        if (isQueryKey(queryKey)) {
            if (exact) {
                if (query.queryHash !== hashQueryKeyByOptions(queryKey, query.options)) {
                    return false;
                }
            }
            else if (!partialMatchKey(query.queryKey, queryKey)) {
                return false;
            }
        }
        const queryStatusFilter = mapQueryStatusFilter(active, inactive);
        if (queryStatusFilter === 'none') {
            return false;
        }
        else if (queryStatusFilter !== 'all') {
            const isActive = query.isActive();
            if (queryStatusFilter === 'active' && !isActive) {
                return false;
            }
            if (queryStatusFilter === 'inactive' && isActive) {
                return false;
            }
        }
        if (typeof stale === 'boolean' && query.isStale() !== stale) {
            return false;
        }
        if (typeof fetching === 'boolean' && query.isFetching() !== fetching) {
            return false;
        }
        if (predicate && !predicate(query)) {
            return false;
        }
        return true;
    }
    function matchMutation(filters, mutation) {
        const { exact, fetching, predicate, mutationKey } = filters;
        if (isQueryKey(mutationKey)) {
            if (!mutation.options.mutationKey) {
                return false;
            }
            if (exact) {
                if (hashQueryKey(mutation.options.mutationKey) !== hashQueryKey(mutationKey)) {
                    return false;
                }
            }
            else if (!partialMatchKey(mutation.options.mutationKey, mutationKey)) {
                return false;
            }
        }
        if (typeof fetching === 'boolean' &&
            (mutation.state.status === 'loading') !== fetching) {
            return false;
        }
        if (predicate && !predicate(mutation)) {
            return false;
        }
        return true;
    }
    function hashQueryKeyByOptions(queryKey, options) {
        const hashFn = (options === null || options === void 0 ? void 0 : options.queryKeyHashFn) || hashQueryKey;
        return hashFn(queryKey);
    }
    /**
     * Default query keys hash function.
     */
    function hashQueryKey(queryKey) {
        const asArray = ensureQueryKeyArray(queryKey);
        return stableValueHash(asArray);
    }
    /**
     * Hashes the value into a stable hash.
     */
    function stableValueHash(value) {
        return JSON.stringify(value, (_, val) => isPlainObject(val)
            ? Object.keys(val)
                .sort()
                .reduce((result, key) => {
                result[key] = val[key];
                return result;
            }, {})
            : val);
    }
    /**
     * Checks if key `b` partially matches with key `a`.
     */
    function partialMatchKey(a, b) {
        return partialDeepEqual(ensureQueryKeyArray(a), ensureQueryKeyArray(b));
    }
    /**
     * Checks if `b` partially matches with `a`.
     */
    function partialDeepEqual(a, b) {
        if (a === b) {
            return true;
        }
        if (typeof a !== typeof b) {
            return false;
        }
        if (a && b && typeof a === 'object' && typeof b === 'object') {
            return !Object.keys(b).some(key => !partialDeepEqual(a[key], b[key]));
        }
        return false;
    }
    function replaceEqualDeep(a, b) {
        if (a === b) {
            return a;
        }
        const array = Array.isArray(a) && Array.isArray(b);
        if (array || (isPlainObject(a) && isPlainObject(b))) {
            const aSize = array ? a.length : Object.keys(a).length;
            const bItems = array ? b : Object.keys(b);
            const bSize = bItems.length;
            const copy = array ? [] : {};
            let equalItems = 0;
            for (let i = 0; i < bSize; i++) {
                const key = array ? i : bItems[i];
                copy[key] = replaceEqualDeep(a[key], b[key]);
                if (copy[key] === a[key]) {
                    equalItems++;
                }
            }
            return aSize === bSize && equalItems === aSize ? a : copy;
        }
        return b;
    }
    /**
     * Shallow compare objects. Only works with objects that always have the same properties.
     */
    function shallowEqualObjects(a, b) {
        if ((a && !b) || (b && !a)) {
            return false;
        }
        for (const key in a) {
            if (a[key] !== b[key]) {
                return false;
            }
        }
        return true;
    }
    // Copied from: https://github.com/jonschlinkert/is-plain-object
    function isPlainObject(o) {
        if (!hasObjectPrototype(o)) {
            return false;
        }
        // If has modified constructor
        const ctor = o.constructor;
        if (typeof ctor === 'undefined') {
            return true;
        }
        // If has modified prototype
        const prot = ctor.prototype;
        if (!hasObjectPrototype(prot)) {
            return false;
        }
        // If constructor does not have an Object-specific method
        if (!prot.hasOwnProperty('isPrototypeOf')) {
            return false;
        }
        // Most likely a plain Object
        return true;
    }
    function hasObjectPrototype(o) {
        return Object.prototype.toString.call(o) === '[object Object]';
    }
    function isQueryKey(value) {
        return typeof value === 'string' || Array.isArray(value);
    }
    function isError(value) {
        return value instanceof Error;
    }
    function sleep(timeout) {
        return new Promise(resolve => {
            setTimeout(resolve, timeout);
        });
    }
    /**
     * Schedules a microtask.
     * This can be useful to schedule state updates after rendering.
     */
    function scheduleMicrotask(callback) {
        Promise.resolve()
            .then(callback)
            .catch(error => setTimeout(() => {
            throw error;
        }));
    }
    function getAbortController() {
        if (typeof AbortController === 'function') {
            return new AbortController();
        }
    }

    class FocusManager extends Subscribable {
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
    const focusManager = new FocusManager();

    class OnlineManager extends Subscribable {
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
    const onlineManager = new OnlineManager();

    function defaultRetryDelay(failureCount) {
        return Math.min(1000 * 2 ** failureCount, 30000);
    }
    function isCancelable(value) {
        return typeof (value === null || value === void 0 ? void 0 : value.cancel) === 'function';
    }
    class CancelledError {
        constructor(options) {
            this.revert = options === null || options === void 0 ? void 0 : options.revert;
            this.silent = options === null || options === void 0 ? void 0 : options.silent;
        }
    }
    function isCancelledError(value) {
        return value instanceof CancelledError;
    }
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
                    sleep(delay)
                        // Pause if the document is not visible or when the device is offline
                        .then(() => {
                        if (!focusManager.isFocused() || !onlineManager.isOnline()) {
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

    // CLASS
    class NotifyManager {
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
    const notifyManager = new NotifyManager();

    // TYPES
    // FUNCTIONS
    let logger = console;
    function getLogger() {
        return logger;
    }
    function setLogger(newLogger) {
        logger = newLogger;
    }

    // CLASS
    class Query {
        constructor(config) {
            this.abortSignalConsumed = false;
            this.hadObservers = false;
            this.defaultOptions = config.defaultOptions;
            this.setOptions(config.options);
            this.observers = [];
            this.cache = config.cache;
            this.queryKey = config.queryKey;
            this.queryHash = config.queryHash;
            this.initialState = config.state || this.getDefaultState(this.options);
            this.state = this.initialState;
            this.meta = config.meta;
            this.scheduleGc();
        }
        setOptions(options) {
            var _a;
            this.options = Object.assign(Object.assign({}, this.defaultOptions), options);
            this.meta = options === null || options === void 0 ? void 0 : options.meta;
            // Default to 5 minutes if not cache time is set
            this.cacheTime = Math.max(this.cacheTime || 0, (_a = this.options.cacheTime) !== null && _a !== void 0 ? _a : 5 * 60 * 1000);
        }
        setDefaultOptions(options) {
            this.defaultOptions = options;
        }
        scheduleGc() {
            this.clearGcTimeout();
            if (isValidTimeout(this.cacheTime)) {
                // @ts-ignore
                this.gcTimeout = setTimeout(() => {
                    this.optionalRemove();
                }, this.cacheTime);
            }
        }
        clearGcTimeout() {
            clearTimeout(this.gcTimeout);
            this.gcTimeout = undefined;
        }
        optionalRemove() {
            if (!this.observers.length) {
                if (this.state.isFetching) {
                    if (this.hadObservers) {
                        this.scheduleGc();
                    }
                }
                else {
                    this.cache.remove(this);
                }
            }
        }
        setData(updater, options) {
            var _a, _b;
            const prevData = this.state.data;
            // Get the new data
            let data = functionalUpdate(updater, prevData);
            // Use prev data if an isDataEqual function is defined and returns `true`
            if ((_b = (_a = this.options).isDataEqual) === null || _b === void 0 ? void 0 : _b.call(_a, prevData, data)) {
                data = prevData;
            }
            else if (this.options.structuralSharing !== false) {
                // Structurally share data between prev and new data if needed
                data = replaceEqualDeep(prevData, data);
            }
            // Set data and mark it as cached
            this.dispatch({
                data,
                type: 'success',
                dataUpdatedAt: options === null || options === void 0 ? void 0 : options.updatedAt,
            });
            return data;
        }
        setState(state, setStateOptions) {
            this.dispatch({ type: 'setState', state, setStateOptions });
        }
        cancel(options) {
            var _a;
            const promise = this.promise;
            (_a = this.retryer) === null || _a === void 0 ? void 0 : _a.cancel(options);
            return promise ? promise.then(noop).catch(noop) : Promise.resolve();
        }
        destroy() {
            this.clearGcTimeout();
            this.cancel({ silent: true });
        }
        reset() {
            this.destroy();
            this.setState(this.initialState);
        }
        isActive() {
            return this.observers.some(observer => observer.options.enabled !== false);
        }
        isFetching() {
            return this.state.isFetching;
        }
        isStale() {
            return (this.state.isInvalidated ||
                !this.state.dataUpdatedAt ||
                this.observers.some(observer => observer.getCurrentResult().isStale));
        }
        isStaleByTime(staleTime = 0) {
            return (this.state.isInvalidated ||
                !this.state.dataUpdatedAt ||
                !timeUntilStale(this.state.dataUpdatedAt, staleTime));
        }
        onFocus() {
            var _a;
            const observer = this.observers.find(x => x.shouldFetchOnWindowFocus());
            if (observer) {
                observer.refetch();
            }
            // Continue fetch if currently paused
            (_a = this.retryer) === null || _a === void 0 ? void 0 : _a.continue();
        }
        onOnline() {
            var _a;
            const observer = this.observers.find(x => x.shouldFetchOnReconnect());
            if (observer) {
                observer.refetch();
            }
            // Continue fetch if currently paused
            (_a = this.retryer) === null || _a === void 0 ? void 0 : _a.continue();
        }
        addObserver(observer) {
            if (this.observers.indexOf(observer) === -1) {
                this.observers.push(observer);
                this.hadObservers = true;
                // Stop the query from being garbage collected
                this.clearGcTimeout();
                this.cache.notify({ type: 'observerAdded', query: this, observer });
            }
        }
        removeObserver(observer) {
            if (this.observers.indexOf(observer) !== -1) {
                this.observers = this.observers.filter(x => x !== observer);
                if (!this.observers.length) {
                    // If the transport layer does not support cancellation
                    // we'll let the query continue so the result can be cached
                    if (this.retryer) {
                        if (this.retryer.isTransportCancelable || this.abortSignalConsumed) {
                            this.retryer.cancel({ revert: true });
                        }
                        else {
                            this.retryer.cancelRetry();
                        }
                    }
                    if (this.cacheTime) {
                        this.scheduleGc();
                    }
                    else {
                        this.cache.remove(this);
                    }
                }
                this.cache.notify({ type: 'observerRemoved', query: this, observer });
            }
        }
        getObserversCount() {
            return this.observers.length;
        }
        invalidate() {
            if (!this.state.isInvalidated) {
                this.dispatch({ type: 'invalidate' });
            }
        }
        fetch(options, fetchOptions) {
            var _a, _b, _c, _d, _e, _f;
            if (this.state.isFetching) {
                if (this.state.dataUpdatedAt && (fetchOptions === null || fetchOptions === void 0 ? void 0 : fetchOptions.cancelRefetch)) {
                    // Silently cancel current fetch if the user wants to cancel refetches
                    this.cancel({ silent: true });
                }
                else if (this.promise) {
                    // make sure that retries that were potentially cancelled due to unmounts can continue
                    (_a = this.retryer) === null || _a === void 0 ? void 0 : _a.continueRetry();
                    // Return current promise if we are already fetching
                    return this.promise;
                }
            }
            // Update config if passed, otherwise the config from the last execution is used
            if (options) {
                this.setOptions(options);
            }
            // Use the options from the first observer with a query function if no function is found.
            // This can happen when the query is hydrated or created with setQueryData.
            if (!this.options.queryFn) {
                const observer = this.observers.find(x => x.options.queryFn);
                if (observer) {
                    this.setOptions(observer.options);
                }
            }
            const queryKey = ensureQueryKeyArray(this.queryKey);
            const abortController = getAbortController();
            // Create query function context
            const queryFnContext = {
                queryKey,
                pageParam: undefined,
                meta: this.meta,
            };
            Object.defineProperty(queryFnContext, 'signal', {
                enumerable: true,
                get: () => {
                    if (abortController) {
                        this.abortSignalConsumed = true;
                        return abortController.signal;
                    }
                    return undefined;
                },
            });
            // Create fetch function
            const fetchFn = () => {
                if (!this.options.queryFn) {
                    return Promise.reject('Missing queryFn');
                }
                this.abortSignalConsumed = false;
                return this.options.queryFn(queryFnContext);
            };
            // Trigger behavior hook
            const context = {
                fetchOptions,
                options: this.options,
                queryKey: queryKey,
                state: this.state,
                fetchFn,
                meta: this.meta,
            };
            if ((_b = this.options.behavior) === null || _b === void 0 ? void 0 : _b.onFetch) {
                (_c = this.options.behavior) === null || _c === void 0 ? void 0 : _c.onFetch(context);
            }
            // Store state in case the current fetch needs to be reverted
            this.revertState = this.state;
            // Set to fetching state if not already in it
            if (!this.state.isFetching ||
                this.state.fetchMeta !== ((_d = context.fetchOptions) === null || _d === void 0 ? void 0 : _d.meta)) {
                this.dispatch({ type: 'fetch', meta: (_e = context.fetchOptions) === null || _e === void 0 ? void 0 : _e.meta });
            }
            // Try to fetch the data
            this.retryer = new Retryer({
                fn: context.fetchFn,
                abort: (_f = abortController === null || abortController === void 0 ? void 0 : abortController.abort) === null || _f === void 0 ? void 0 : _f.bind(abortController),
                onSuccess: data => {
                    var _a, _b;
                    this.setData(data);
                    // Notify cache callback
                    (_b = (_a = this.cache.config).onSuccess) === null || _b === void 0 ? void 0 : _b.call(_a, data, this);
                    // Remove query after fetching if cache time is 0
                    if (this.cacheTime === 0) {
                        this.optionalRemove();
                    }
                },
                onError: (error) => {
                    var _a, _b;
                    // Optimistically update state if needed
                    if (!(isCancelledError(error) && error.silent)) {
                        this.dispatch({
                            type: 'error',
                            error: error,
                        });
                    }
                    if (!isCancelledError(error)) {
                        // Notify cache callback
                        (_b = (_a = this.cache.config).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error, this);
                        // Log error
                        getLogger().error(error);
                    }
                    // Remove query after fetching if cache time is 0
                    if (this.cacheTime === 0) {
                        this.optionalRemove();
                    }
                },
                onFail: () => {
                    this.dispatch({ type: 'failed' });
                },
                onPause: () => {
                    this.dispatch({ type: 'pause' });
                },
                onContinue: () => {
                    this.dispatch({ type: 'continue' });
                },
                retry: context.options.retry,
                retryDelay: context.options.retryDelay,
            });
            this.promise = this.retryer.promise;
            return this.promise;
        }
        dispatch(action) {
            this.state = this.reducer(this.state, action);
            notifyManager.batch(() => {
                this.observers.forEach(observer => {
                    observer.onQueryUpdate(action);
                });
                this.cache.notify({ query: this, type: 'queryUpdated', action });
            });
        }
        getDefaultState(options) {
            const data = typeof options.initialData === 'function'
                ? options.initialData()
                : options.initialData;
            const hasInitialData = typeof options.initialData !== 'undefined';
            const initialDataUpdatedAt = hasInitialData
                ? typeof options.initialDataUpdatedAt === 'function'
                    ? options.initialDataUpdatedAt()
                    : options.initialDataUpdatedAt
                : 0;
            const hasData = typeof data !== 'undefined';
            return {
                data,
                dataUpdateCount: 0,
                dataUpdatedAt: hasData ? initialDataUpdatedAt !== null && initialDataUpdatedAt !== void 0 ? initialDataUpdatedAt : Date.now() : 0,
                error: null,
                errorUpdateCount: 0,
                errorUpdatedAt: 0,
                fetchFailureCount: 0,
                fetchMeta: null,
                isFetching: false,
                isInvalidated: false,
                isPaused: false,
                status: hasData ? 'success' : 'idle',
            };
        }
        reducer(state, action) {
            var _a, _b;
            switch (action.type) {
                case 'failed':
                    return Object.assign(Object.assign({}, state), { fetchFailureCount: state.fetchFailureCount + 1 });
                case 'pause':
                    return Object.assign(Object.assign({}, state), { isPaused: true });
                case 'continue':
                    return Object.assign(Object.assign({}, state), { isPaused: false });
                case 'fetch':
                    return Object.assign(Object.assign(Object.assign({}, state), { fetchFailureCount: 0, fetchMeta: (_a = action.meta) !== null && _a !== void 0 ? _a : null, isFetching: true, isPaused: false }), (!state.dataUpdatedAt && {
                        error: null,
                        status: 'loading',
                    }));
                case 'success':
                    return Object.assign(Object.assign({}, state), { data: action.data, dataUpdateCount: state.dataUpdateCount + 1, dataUpdatedAt: (_b = action.dataUpdatedAt) !== null && _b !== void 0 ? _b : Date.now(), error: null, fetchFailureCount: 0, isFetching: false, isInvalidated: false, isPaused: false, status: 'success' });
                case 'error':
                    const error = action.error;
                    if (isCancelledError(error) && error.revert && this.revertState) {
                        return Object.assign({}, this.revertState);
                    }
                    return Object.assign(Object.assign({}, state), { error: error, errorUpdateCount: state.errorUpdateCount + 1, errorUpdatedAt: Date.now(), fetchFailureCount: state.fetchFailureCount + 1, isFetching: false, isPaused: false, status: 'error' });
                case 'invalidate':
                    return Object.assign(Object.assign({}, state), { isInvalidated: true });
                case 'setState':
                    return Object.assign(Object.assign({}, state), action.state);
                default:
                    return state;
            }
        }
    }

    class QueryObserver extends Subscribable {
        constructor(client, options) {
            super();
            this.client = client;
            this.options = options;
            this.trackedProps = [];
            this.previousSelectError = null;
            this.bindMethods();
            this.setOptions(options);
        }
        bindMethods() {
            this.remove = this.remove.bind(this);
            this.refetch = this.refetch.bind(this);
        }
        onSubscribe() {
            if (this.listeners.length === 1) {
                this.currentQuery.addObserver(this);
                if (shouldFetchOnMount(this.currentQuery, this.options)) {
                    this.executeFetch();
                }
                this.updateTimers();
            }
        }
        onUnsubscribe() {
            if (!this.listeners.length) {
                this.destroy();
            }
        }
        shouldFetchOnReconnect() {
            return shouldFetchOnReconnect(this.currentQuery, this.options);
        }
        shouldFetchOnWindowFocus() {
            return shouldFetchOnWindowFocus(this.currentQuery, this.options);
        }
        destroy() {
            this.listeners = [];
            this.clearTimers();
            this.currentQuery.removeObserver(this);
        }
        setOptions(options, notifyOptions) {
            const prevOptions = this.options;
            const prevQuery = this.currentQuery;
            this.options = this.client.defaultQueryObserverOptions(options);
            if (typeof this.options.enabled !== 'undefined' &&
                typeof this.options.enabled !== 'boolean') {
                throw new Error('Expected enabled to be a boolean');
            }
            // Keep previous query key if the user does not supply one
            if (!this.options.queryKey) {
                this.options.queryKey = prevOptions.queryKey;
            }
            this.updateQuery();
            const mounted = this.hasListeners();
            // Fetch if there are subscribers
            if (mounted &&
                shouldFetchOptionally(this.currentQuery, prevQuery, this.options, prevOptions)) {
                this.executeFetch();
            }
            // Update result
            this.updateResult(notifyOptions);
            // Update stale interval if needed
            if (mounted &&
                (this.currentQuery !== prevQuery ||
                    this.options.enabled !== prevOptions.enabled ||
                    this.options.staleTime !== prevOptions.staleTime)) {
                this.updateStaleTimeout();
            }
            const nextRefetchInterval = this.computeRefetchInterval();
            // Update refetch interval if needed
            if (mounted &&
                (this.currentQuery !== prevQuery ||
                    this.options.enabled !== prevOptions.enabled ||
                    nextRefetchInterval !== this.currentRefetchInterval)) {
                this.updateRefetchInterval(nextRefetchInterval);
            }
        }
        updateOptions(options, notifyOptions) {
            const mergedOptions = Object.assign(Object.assign({}, this.options), options);
            if (options.queryKey && !options.queryHash && options.queryKey !== this.options.queryKey) {
                mergedOptions.queryHash = hashQueryKeyByOptions(options.queryKey, mergedOptions);
            }
            this.setOptions(mergedOptions, notifyOptions);
        }
        getOptimisticResult(options) {
            const defaultedOptions = this.client.defaultQueryObserverOptions(options);
            const query = this.client
                .getQueryCache()
                .build(this.client, defaultedOptions);
            return this.createResult(query, defaultedOptions);
        }
        getCurrentResult() {
            return this.currentResult;
        }
        trackResult(result, defaultedOptions) {
            const trackedResult = {};
            const trackProp = (key) => {
                if (!this.trackedProps.includes(key)) {
                    this.trackedProps.push(key);
                }
            };
            Object.keys(result).forEach(key => {
                Object.defineProperty(trackedResult, key, {
                    configurable: false,
                    enumerable: true,
                    get: () => {
                        trackProp(key);
                        return result[key];
                    },
                });
            });
            if (defaultedOptions.useErrorBoundary || defaultedOptions.suspense) {
                trackProp('error');
            }
            return trackedResult;
        }
        getNextResult(options) {
            return new Promise((resolve, reject) => {
                const unsubscribe = this.subscribe(result => {
                    if (!result.isFetching) {
                        unsubscribe();
                        if (result.isError && (options === null || options === void 0 ? void 0 : options.throwOnError)) {
                            reject(result.error);
                        }
                        else {
                            resolve(result);
                        }
                    }
                });
            });
        }
        getCurrentQuery() {
            return this.currentQuery;
        }
        remove() {
            this.client.getQueryCache().remove(this.currentQuery);
        }
        refetch(options) {
            return this.fetch(Object.assign(Object.assign({}, options), { meta: { refetchPage: options === null || options === void 0 ? void 0 : options.refetchPage } }));
        }
        fetchOptimistic(options) {
            const defaultedOptions = this.client.defaultQueryObserverOptions(options);
            const query = this.client
                .getQueryCache()
                .build(this.client, defaultedOptions);
            return query.fetch().then(() => this.createResult(query, defaultedOptions));
        }
        fetch(fetchOptions) {
            return this.executeFetch(fetchOptions).then(() => {
                this.updateResult();
                return this.currentResult;
            });
        }
        executeFetch(fetchOptions) {
            // Make sure we reference the latest query as the current one might have been removed
            this.updateQuery();
            // Fetch
            let promise = this.currentQuery.fetch(this.options, fetchOptions);
            if (!(fetchOptions === null || fetchOptions === void 0 ? void 0 : fetchOptions.throwOnError)) {
                promise = promise.catch(noop);
            }
            return promise;
        }
        updateStaleTimeout() {
            this.clearStaleTimeout();
            if (isServer ||
                this.currentResult.isStale ||
                !isValidTimeout(this.options.staleTime)) {
                return;
            }
            const time = timeUntilStale(this.currentResult.dataUpdatedAt, this.options.staleTime);
            // The timeout is sometimes triggered 1 ms before the stale time expiration.
            // To mitigate this issue we always add 1 ms to the timeout.
            const timeout = time + 1;
            // @ts-ignore
            this.staleTimeoutId = setTimeout(() => {
                if (!this.currentResult.isStale) {
                    this.updateResult();
                }
            }, timeout);
        }
        computeRefetchInterval() {
            var _a;
            return typeof this.options.refetchInterval === 'function'
                ? this.options.refetchInterval(this.currentResult.data, this.currentQuery)
                : (_a = this.options.refetchInterval) !== null && _a !== void 0 ? _a : false;
        }
        updateRefetchInterval(nextInterval) {
            this.clearRefetchInterval();
            this.currentRefetchInterval = nextInterval;
            if (isServer ||
                this.options.enabled === false ||
                !isValidTimeout(this.currentRefetchInterval) ||
                this.currentRefetchInterval === 0) {
                return;
            }
            // @ts-ignore
            this.refetchIntervalId = setInterval(() => {
                if (this.options.refetchIntervalInBackground ||
                    focusManager.isFocused()) {
                    this.executeFetch();
                }
            }, this.currentRefetchInterval);
        }
        updateTimers() {
            this.updateStaleTimeout();
            this.updateRefetchInterval(this.computeRefetchInterval());
        }
        clearTimers() {
            this.clearStaleTimeout();
            this.clearRefetchInterval();
        }
        clearStaleTimeout() {
            clearTimeout(this.staleTimeoutId);
            this.staleTimeoutId = undefined;
        }
        clearRefetchInterval() {
            clearInterval(this.refetchIntervalId);
            this.refetchIntervalId = undefined;
        }
        createResult(query, options) {
            var _a;
            const prevQuery = this.currentQuery;
            const prevOptions = this.options;
            const prevResult = this.currentResult;
            const prevResultState = this.currentResultState;
            const prevResultOptions = this.currentResultOptions;
            const queryChange = query !== prevQuery;
            const queryInitialState = queryChange
                ? query.state
                : this.currentQueryInitialState;
            const prevQueryResult = queryChange
                ? this.currentResult
                : this.previousQueryResult;
            const { state } = query;
            let { dataUpdatedAt, error, errorUpdatedAt, isFetching, status } = state;
            let isPreviousData = false;
            let isPlaceholderData = false;
            let data;
            // Optimistically set result in fetching state if needed
            // @ts-ignore
            if (options.optimisticResults) {
                const mounted = this.hasListeners();
                const fetchOnMount = !mounted && shouldFetchOnMount(query, options);
                const fetchOptionally = mounted && shouldFetchOptionally(query, prevQuery, options, prevOptions);
                if (fetchOnMount || fetchOptionally) {
                    isFetching = true;
                    if (!dataUpdatedAt) {
                        status = 'loading';
                    }
                }
            }
            // Keep previous data if needed
            if (options.keepPreviousData &&
                !state.dataUpdateCount && (prevQueryResult === null || prevQueryResult === void 0 ? void 0 : prevQueryResult.isSuccess) &&
                status !== 'error') {
                data = prevQueryResult.data;
                dataUpdatedAt = prevQueryResult.dataUpdatedAt;
                status = prevQueryResult.status;
                isPreviousData = true;
            }
            // Select data if needed
            else if (options.select && typeof state.data !== 'undefined') {
                // Memoize select result
                if (prevResult &&
                    state.data === (prevResultState === null || prevResultState === void 0 ? void 0 : prevResultState.data) &&
                    options.select === ((_a = this.previousSelect) === null || _a === void 0 ? void 0 : _a.fn) &&
                    !this.previousSelectError) {
                    data = this.previousSelect.result;
                }
                else {
                    try {
                        data = options.select(state.data);
                        if (options.structuralSharing !== false) {
                            data = replaceEqualDeep(prevResult === null || prevResult === void 0 ? void 0 : prevResult.data, data);
                        }
                        this.previousSelect = {
                            fn: options.select,
                            result: data,
                        };
                        this.previousSelectError = null;
                    }
                    catch (selectError) {
                        getLogger().error(selectError);
                        error = selectError;
                        this.previousSelectError = selectError;
                        errorUpdatedAt = Date.now();
                        status = 'error';
                    }
                }
            }
            // Use query data
            else {
                data = state.data;
            }
            // Show placeholder data if needed
            if (typeof options.placeholderData !== 'undefined' &&
                typeof data === 'undefined' &&
                (status === 'loading' || status === 'idle')) {
                let placeholderData;
                // Memoize placeholder data
                if ((prevResult === null || prevResult === void 0 ? void 0 : prevResult.isPlaceholderData) &&
                    options.placeholderData === (prevResultOptions === null || prevResultOptions === void 0 ? void 0 : prevResultOptions.placeholderData)) {
                    placeholderData = prevResult.data;
                }
                else {
                    placeholderData =
                        typeof options.placeholderData === 'function'
                            ? options.placeholderData()
                            : options.placeholderData;
                    if (options.select && typeof placeholderData !== 'undefined') {
                        try {
                            placeholderData = options.select(placeholderData);
                            if (options.structuralSharing !== false) {
                                placeholderData = replaceEqualDeep(prevResult === null || prevResult === void 0 ? void 0 : prevResult.data, placeholderData);
                            }
                            this.previousSelectError = null;
                        }
                        catch (selectError) {
                            getLogger().error(selectError);
                            error = selectError;
                            this.previousSelectError = selectError;
                            errorUpdatedAt = Date.now();
                            status = 'error';
                        }
                    }
                }
                if (typeof placeholderData !== 'undefined') {
                    status = 'success';
                    data = placeholderData;
                    isPlaceholderData = true;
                }
            }
            const result = {
                status,
                isLoading: status === 'loading',
                isSuccess: status === 'success',
                isError: status === 'error',
                isIdle: status === 'idle',
                data,
                dataUpdatedAt,
                error,
                errorUpdatedAt,
                failureCount: state.fetchFailureCount,
                isFetched: state.dataUpdateCount > 0 || state.errorUpdateCount > 0,
                isFetchedAfterMount: state.dataUpdateCount > queryInitialState.dataUpdateCount ||
                    state.errorUpdateCount > queryInitialState.errorUpdateCount,
                isFetching,
                isRefetching: isFetching && status !== 'loading',
                isLoadingError: status === 'error' && state.dataUpdatedAt === 0,
                isPlaceholderData,
                isPreviousData,
                isRefetchError: status === 'error' && state.dataUpdatedAt !== 0,
                isStale: isStale(query, options),
                refetch: this.refetch,
                remove: this.remove,
            };
            return result;
        }
        shouldNotifyListeners(result, prevResult) {
            if (!prevResult) {
                return true;
            }
            const { notifyOnChangeProps, notifyOnChangePropsExclusions } = this.options;
            if (!notifyOnChangeProps && !notifyOnChangePropsExclusions) {
                return true;
            }
            if (notifyOnChangeProps === 'tracked' && !this.trackedProps.length) {
                return true;
            }
            const includedProps = notifyOnChangeProps === 'tracked'
                ? this.trackedProps
                : notifyOnChangeProps;
            return Object.keys(result).some(key => {
                const typedKey = key;
                const changed = result[typedKey] !== prevResult[typedKey];
                const isIncluded = includedProps === null || includedProps === void 0 ? void 0 : includedProps.some(x => x === key);
                const isExcluded = notifyOnChangePropsExclusions === null || notifyOnChangePropsExclusions === void 0 ? void 0 : notifyOnChangePropsExclusions.some(x => x === key);
                return changed && !isExcluded && (!includedProps || isIncluded);
            });
        }
        updateResult(notifyOptions) {
            const prevResult = this.currentResult;
            this.currentResult = this.createResult(this.currentQuery, this.options);
            this.currentResultState = this.currentQuery.state;
            this.currentResultOptions = this.options;
            // Only notify if something has changed
            if (shallowEqualObjects(this.currentResult, prevResult)) {
                return;
            }
            // Determine which callbacks to trigger
            const defaultNotifyOptions = { cache: true };
            if ((notifyOptions === null || notifyOptions === void 0 ? void 0 : notifyOptions.listeners) !== false &&
                this.shouldNotifyListeners(this.currentResult, prevResult)) {
                defaultNotifyOptions.listeners = true;
            }
            this.notify(Object.assign(Object.assign({}, defaultNotifyOptions), notifyOptions));
        }
        updateQuery() {
            const query = this.client
                .getQueryCache()
                .build(this.client, this.options);
            if (query === this.currentQuery) {
                return;
            }
            const prevQuery = this.currentQuery;
            this.currentQuery = query;
            this.currentQueryInitialState = query.state;
            this.previousQueryResult = this.currentResult;
            if (this.hasListeners()) {
                prevQuery === null || prevQuery === void 0 ? void 0 : prevQuery.removeObserver(this);
                query.addObserver(this);
            }
        }
        onQueryUpdate(action) {
            const notifyOptions = {};
            if (action.type === 'success') {
                notifyOptions.onSuccess = true;
            }
            else if (action.type === 'error' && !isCancelledError(action.error)) {
                notifyOptions.onError = true;
            }
            this.updateResult(notifyOptions);
            if (this.hasListeners()) {
                this.updateTimers();
            }
        }
        notify(notifyOptions) {
            notifyManager.batch(() => {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                // First trigger the configuration callbacks
                if (notifyOptions.onSuccess) {
                    (_b = (_a = this.options).onSuccess) === null || _b === void 0 ? void 0 : _b.call(_a, this.currentResult.data);
                    (_d = (_c = this.options).onSettled) === null || _d === void 0 ? void 0 : _d.call(_c, this.currentResult.data, null);
                }
                else if (notifyOptions.onError) {
                    (_f = (_e = this.options).onError) === null || _f === void 0 ? void 0 : _f.call(_e, this.currentResult.error);
                    (_h = (_g = this.options).onSettled) === null || _h === void 0 ? void 0 : _h.call(_g, undefined, this.currentResult.error);
                }
                // Then trigger the listeners
                if (notifyOptions.listeners) {
                    this.listeners.forEach(listener => {
                        listener(this.currentResult);
                    });
                }
                // Then the cache listeners
                if (notifyOptions.cache) {
                    this.client
                        .getQueryCache()
                        .notify({ query: this.currentQuery, type: 'observerResultsUpdated' });
                }
            });
        }
    }
    function shouldLoadOnMount(query, options) {
        return (options.enabled !== false &&
            !query.state.dataUpdatedAt &&
            !(query.state.status === 'error' && options.retryOnMount === false));
    }
    function shouldRefetchOnMount(query, options) {
        return (options.enabled !== false &&
            query.state.dataUpdatedAt > 0 &&
            (options.refetchOnMount === 'always' ||
                (options.refetchOnMount !== false && isStale(query, options))));
    }
    function shouldFetchOnMount(query, options) {
        return (shouldLoadOnMount(query, options) || shouldRefetchOnMount(query, options));
    }
    function shouldFetchOnReconnect(query, options) {
        return (options.enabled !== false &&
            (options.refetchOnReconnect === 'always' ||
                (options.refetchOnReconnect !== false && isStale(query, options))));
    }
    function shouldFetchOnWindowFocus(query, options) {
        return (options.enabled !== false &&
            (options.refetchOnWindowFocus === 'always' ||
                (options.refetchOnWindowFocus !== false && isStale(query, options))));
    }
    function shouldFetchOptionally(query, prevQuery, options, prevOptions) {
        return (options.enabled !== false &&
            (query !== prevQuery || prevOptions.enabled === false) &&
            (!options.suspense || query.state.status !== 'error') &&
            isStale(query, options));
    }
    function isStale(query, options) {
        return query.isStaleByTime(options.staleTime);
    }

    // CLASS
    class QueryCache extends Subscribable {
        constructor(config) {
            super();
            this.config = config || {};
            this.queries = [];
            this.queriesMap = {};
        }
        build(client, options, state) {
            var _a;
            const queryKey = options.queryKey;
            const queryHash = (_a = options.queryHash) !== null && _a !== void 0 ? _a : hashQueryKeyByOptions(queryKey, options);
            let query = this.get(queryHash);
            if (!query) {
                query = new Query({
                    cache: this,
                    queryKey,
                    queryHash,
                    options: client.defaultQueryOptions(options),
                    state,
                    defaultOptions: client.getQueryDefaults(queryKey),
                    meta: options.meta,
                });
                this.add(query);
            }
            return query;
        }
        add(query) {
            if (!this.queriesMap[query.queryHash]) {
                this.queriesMap[query.queryHash] = query;
                this.queries.push(query);
                this.notify({
                    type: 'queryAdded',
                    query,
                });
            }
        }
        remove(query) {
            const queryInMap = this.queriesMap[query.queryHash];
            if (queryInMap) {
                query.destroy();
                this.queries = this.queries.filter(x => x !== query);
                if (queryInMap === query) {
                    delete this.queriesMap[query.queryHash];
                }
                this.notify({ type: 'queryRemoved', query });
            }
        }
        clear() {
            notifyManager.batch(() => {
                this.queries.forEach(query => {
                    this.remove(query);
                });
            });
        }
        get(queryHash) {
            return this.queriesMap[queryHash];
        }
        getAll() {
            return this.queries;
        }
        find(arg1, arg2) {
            const [filters] = parseFilterArgs(arg1, arg2);
            if (typeof filters.exact === 'undefined') {
                filters.exact = true;
            }
            return this.queries.find(query => matchQuery(filters, query));
        }
        findAll(arg1, arg2) {
            const [filters] = parseFilterArgs(arg1, arg2);
            return Object.keys(filters).length > 0
                ? this.queries.filter(query => matchQuery(filters, query))
                : this.queries;
        }
        notify(event) {
            notifyManager.batch(() => {
                this.listeners.forEach(listener => {
                    listener(event);
                });
            });
        }
        onFocus() {
            notifyManager.batch(() => {
                this.queries.forEach(query => {
                    query.onFocus();
                });
            });
        }
        onOnline() {
            notifyManager.batch(() => {
                this.queries.forEach(query => {
                    query.onOnline();
                });
            });
        }
    }

    // CLASS
    class Mutation {
        constructor(config) {
            this.options = Object.assign(Object.assign({}, config.defaultOptions), config.options);
            this.mutationId = config.mutationId;
            this.mutationCache = config.mutationCache;
            this.observers = [];
            this.state = config.state || getDefaultState();
            this.meta = config.meta;
        }
        setState(state) {
            this.dispatch({ type: 'setState', state });
        }
        addObserver(observer) {
            if (this.observers.indexOf(observer) === -1) {
                this.observers.push(observer);
            }
        }
        removeObserver(observer) {
            this.observers = this.observers.filter(x => x !== observer);
        }
        cancel() {
            if (this.retryer) {
                this.retryer.cancel();
                return this.retryer.promise.then(noop).catch(noop);
            }
            return Promise.resolve();
        }
        continue() {
            if (this.retryer) {
                this.retryer.continue();
                return this.retryer.promise;
            }
            return this.execute();
        }
        execute() {
            let data;
            const restored = this.state.status === 'loading';
            let promise = Promise.resolve();
            if (!restored) {
                this.dispatch({ type: 'loading', variables: this.options.variables });
                promise = promise
                    .then(() => {
                    var _a, _b;
                    // Notify cache callback
                    (_b = (_a = this.mutationCache.config).onMutate) === null || _b === void 0 ? void 0 : _b.call(_a, this.state.variables, this);
                })
                    .then(() => { var _a, _b; return (_b = (_a = this.options).onMutate) === null || _b === void 0 ? void 0 : _b.call(_a, this.state.variables); })
                    .then(context => {
                    if (context !== this.state.context) {
                        this.dispatch({
                            type: 'loading',
                            context,
                            variables: this.state.variables,
                        });
                    }
                });
            }
            return promise
                .then(() => this.executeMutation())
                .then(result => {
                var _a, _b;
                data = result;
                // Notify cache callback
                (_b = (_a = this.mutationCache.config).onSuccess) === null || _b === void 0 ? void 0 : _b.call(_a, data, this.state.variables, this.state.context, this);
            })
                .then(() => { var _a, _b; return (_b = (_a = this.options).onSuccess) === null || _b === void 0 ? void 0 : _b.call(_a, data, this.state.variables, this.state.context); })
                .then(() => { var _a, _b; return (_b = (_a = this.options).onSettled) === null || _b === void 0 ? void 0 : _b.call(_a, data, null, this.state.variables, this.state.context); })
                .then(() => {
                this.dispatch({ type: 'success', data });
                return data;
            })
                .catch(error => {
                var _a, _b;
                // Notify cache callback
                (_b = (_a = this.mutationCache.config).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error, this.state.variables, this.state.context, this);
                // Log error
                getLogger().error(error);
                return Promise.resolve()
                    .then(() => { var _a, _b; return (_b = (_a = this.options).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error, this.state.variables, this.state.context); })
                    .then(() => { var _a, _b; return (_b = (_a = this.options).onSettled) === null || _b === void 0 ? void 0 : _b.call(_a, undefined, error, this.state.variables, this.state.context); })
                    .then(() => {
                    this.dispatch({ type: 'error', error });
                    throw error;
                });
            });
        }
        executeMutation() {
            var _a;
            this.retryer = new Retryer({
                fn: () => {
                    if (!this.options.mutationFn) {
                        return Promise.reject('No mutationFn found');
                    }
                    return this.options.mutationFn(this.state.variables);
                },
                onFail: () => {
                    this.dispatch({ type: 'failed' });
                },
                onPause: () => {
                    this.dispatch({ type: 'pause' });
                },
                onContinue: () => {
                    this.dispatch({ type: 'continue' });
                },
                retry: (_a = this.options.retry) !== null && _a !== void 0 ? _a : 0,
                retryDelay: this.options.retryDelay,
            });
            return this.retryer.promise;
        }
        dispatch(action) {
            this.state = reducer(this.state, action);
            notifyManager.batch(() => {
                this.observers.forEach(observer => {
                    observer.onMutationUpdate(action);
                });
                this.mutationCache.notify(this);
            });
        }
    }
    function getDefaultState() {
        return {
            context: undefined,
            data: undefined,
            error: null,
            failureCount: 0,
            isPaused: false,
            status: 'idle',
            variables: undefined,
        };
    }
    function reducer(state, action) {
        switch (action.type) {
            case 'failed':
                return Object.assign(Object.assign({}, state), { failureCount: state.failureCount + 1 });
            case 'pause':
                return Object.assign(Object.assign({}, state), { isPaused: true });
            case 'continue':
                return Object.assign(Object.assign({}, state), { isPaused: false });
            case 'loading':
                return Object.assign(Object.assign({}, state), { context: action.context, data: undefined, error: null, isPaused: false, status: 'loading', variables: action.variables });
            case 'success':
                return Object.assign(Object.assign({}, state), { data: action.data, error: null, status: 'success', isPaused: false });
            case 'error':
                return Object.assign(Object.assign({}, state), { data: undefined, error: action.error, failureCount: state.failureCount + 1, isPaused: false, status: 'error' });
            case 'setState':
                return Object.assign(Object.assign({}, state), action.state);
            default:
                return state;
        }
    }

    // CLASS
    class MutationCache extends Subscribable {
        constructor(config) {
            super();
            this.config = config || {};
            this.mutations = [];
            this.mutationId = 0;
        }
        build(client, options, state) {
            const mutation = new Mutation({
                mutationCache: this,
                mutationId: ++this.mutationId,
                options: client.defaultMutationOptions(options),
                state,
                defaultOptions: options.mutationKey
                    ? client.getMutationDefaults(options.mutationKey)
                    : undefined,
                meta: options.meta,
            });
            this.add(mutation);
            return mutation;
        }
        add(mutation) {
            this.mutations.push(mutation);
            this.notify(mutation);
        }
        remove(mutation) {
            this.mutations = this.mutations.filter(x => x !== mutation);
            mutation.cancel();
            this.notify(mutation);
        }
        clear() {
            notifyManager.batch(() => {
                this.mutations.forEach(mutation => {
                    this.remove(mutation);
                });
            });
        }
        getAll() {
            return this.mutations;
        }
        find(filters) {
            if (typeof filters.exact === 'undefined') {
                filters.exact = true;
            }
            return this.mutations.find(mutation => matchMutation(filters, mutation));
        }
        findAll(filters) {
            return this.mutations.filter(mutation => matchMutation(filters, mutation));
        }
        notify(mutation) {
            notifyManager.batch(() => {
                this.listeners.forEach(listener => {
                    listener(mutation);
                });
            });
        }
        onFocus() {
            this.resumePausedMutations();
        }
        onOnline() {
            this.resumePausedMutations();
        }
        resumePausedMutations() {
            const pausedMutations = this.mutations.filter(x => x.state.isPaused);
            return notifyManager.batch(() => pausedMutations.reduce((promise, mutation) => promise.then(() => mutation.continue().catch(noop)), Promise.resolve()));
        }
    }

    function infiniteQueryBehavior() {
        return {
            onFetch: context => {
                context.fetchFn = () => {
                    var _a, _b, _c, _d, _e, _f;
                    const refetchPage = (_b = (_a = context.fetchOptions) === null || _a === void 0 ? void 0 : _a.meta) === null || _b === void 0 ? void 0 : _b.refetchPage;
                    const fetchMore = (_d = (_c = context.fetchOptions) === null || _c === void 0 ? void 0 : _c.meta) === null || _d === void 0 ? void 0 : _d.fetchMore;
                    const pageParam = fetchMore === null || fetchMore === void 0 ? void 0 : fetchMore.pageParam;
                    const isFetchingNextPage = (fetchMore === null || fetchMore === void 0 ? void 0 : fetchMore.direction) === 'forward';
                    const isFetchingPreviousPage = (fetchMore === null || fetchMore === void 0 ? void 0 : fetchMore.direction) === 'backward';
                    const oldPages = ((_e = context.state.data) === null || _e === void 0 ? void 0 : _e.pages) || [];
                    const oldPageParams = ((_f = context.state.data) === null || _f === void 0 ? void 0 : _f.pageParams) || [];
                    const abortController = getAbortController();
                    const abortSignal = abortController === null || abortController === void 0 ? void 0 : abortController.signal;
                    let newPageParams = oldPageParams;
                    let cancelled = false;
                    // Get query function
                    const queryFn = context.options.queryFn || (() => Promise.reject('Missing queryFn'));
                    const buildNewPages = (pages, param, page, previous) => {
                        newPageParams = previous
                            ? [param, ...newPageParams]
                            : [...newPageParams, param];
                        return previous ? [page, ...pages] : [...pages, page];
                    };
                    // Create function to fetch a page
                    const fetchPage = (pages, manual, param, previous) => {
                        if (cancelled) {
                            return Promise.reject('Cancelled');
                        }
                        if (typeof param === 'undefined' && !manual && pages.length) {
                            return Promise.resolve(pages);
                        }
                        const queryFnContext = {
                            queryKey: context.queryKey,
                            signal: abortSignal,
                            pageParam: param,
                            meta: context.meta,
                        };
                        const queryFnResult = queryFn(queryFnContext);
                        const promise = Promise.resolve(queryFnResult).then(page => buildNewPages(pages, param, page, previous));
                        if (isCancelable(queryFnResult)) {
                            const promiseAsAny = promise;
                            promiseAsAny.cancel = queryFnResult.cancel;
                        }
                        return promise;
                    };
                    let promise;
                    // Fetch first page?
                    if (!oldPages.length) {
                        promise = fetchPage([]);
                    }
                    // Fetch next page?
                    else if (isFetchingNextPage) {
                        const manual = typeof pageParam !== 'undefined';
                        const param = manual
                            ? pageParam
                            : getNextPageParam(context.options, oldPages);
                        promise = fetchPage(oldPages, manual, param);
                    }
                    // Fetch previous page?
                    else if (isFetchingPreviousPage) {
                        const manual = typeof pageParam !== 'undefined';
                        const param = manual
                            ? pageParam
                            : getPreviousPageParam(context.options, oldPages);
                        promise = fetchPage(oldPages, manual, param, true);
                    }
                    // Refetch pages
                    else {
                        newPageParams = [];
                        const manual = typeof context.options.getNextPageParam === 'undefined';
                        const shouldFetchFirstPage = refetchPage && oldPages[0]
                            ? refetchPage(oldPages[0], 0, oldPages)
                            : true;
                        // Fetch first page
                        promise = shouldFetchFirstPage
                            ? fetchPage([], manual, oldPageParams[0])
                            : Promise.resolve(buildNewPages([], oldPageParams[0], oldPages[0]));
                        // Fetch remaining pages
                        for (let i = 1; i < oldPages.length; i++) {
                            promise = promise.then(pages => {
                                const shouldFetchNextPage = refetchPage && oldPages[i]
                                    ? refetchPage(oldPages[i], i, oldPages)
                                    : true;
                                if (shouldFetchNextPage) {
                                    const param = manual
                                        ? oldPageParams[i]
                                        : getNextPageParam(context.options, pages);
                                    return fetchPage(pages, manual, param);
                                }
                                return Promise.resolve(buildNewPages(pages, oldPageParams[i], oldPages[i]));
                            });
                        }
                    }
                    const finalPromise = promise.then(pages => ({
                        pages,
                        pageParams: newPageParams,
                    }));
                    const finalPromiseAsAny = finalPromise;
                    finalPromiseAsAny.cancel = () => {
                        cancelled = true;
                        abortController === null || abortController === void 0 ? void 0 : abortController.abort();
                        if (isCancelable(promise)) {
                            promise.cancel();
                        }
                    };
                    return finalPromise;
                };
            },
        };
    }
    function getNextPageParam(options, pages) {
        var _a;
        return (_a = options.getNextPageParam) === null || _a === void 0 ? void 0 : _a.call(options, pages[pages.length - 1], pages);
    }
    function getPreviousPageParam(options, pages) {
        var _a;
        return (_a = options.getPreviousPageParam) === null || _a === void 0 ? void 0 : _a.call(options, pages[0], pages);
    }
    /**
     * Checks if there is a next page.
     * Returns `undefined` if it cannot be determined.
     */
    function hasNextPage(options, pages) {
        if (options.getNextPageParam && Array.isArray(pages)) {
            const nextPageParam = getNextPageParam(options, pages);
            return (typeof nextPageParam !== 'undefined' &&
                nextPageParam !== null &&
                nextPageParam !== false);
        }
    }
    /**
     * Checks if there is a previous page.
     * Returns `undefined` if it cannot be determined.
     */
    function hasPreviousPage(options, pages) {
        if (options.getPreviousPageParam && Array.isArray(pages)) {
            const previousPageParam = getPreviousPageParam(options, pages);
            return (typeof previousPageParam !== 'undefined' &&
                previousPageParam !== null &&
                previousPageParam !== false);
        }
    }

    // CLASS
    class QueryClient {
        constructor(config = {}) {
            this.queryCache = config.queryCache || new QueryCache();
            this.mutationCache = config.mutationCache || new MutationCache();
            this.defaultOptions = config.defaultOptions || {};
            this.queryDefaults = [];
            this.mutationDefaults = [];
        }
        mount() {
            this.unsubscribeFocus = focusManager.subscribe(() => {
                if (focusManager.isFocused() && onlineManager.isOnline()) {
                    this.mutationCache.onFocus();
                    this.queryCache.onFocus();
                }
            });
            this.unsubscribeOnline = onlineManager.subscribe(() => {
                if (focusManager.isFocused() && onlineManager.isOnline()) {
                    this.mutationCache.onOnline();
                    this.queryCache.onOnline();
                }
            });
        }
        unmount() {
            var _a, _b;
            (_a = this.unsubscribeFocus) === null || _a === void 0 ? void 0 : _a.call(this);
            (_b = this.unsubscribeOnline) === null || _b === void 0 ? void 0 : _b.call(this);
        }
        isFetching(arg1, arg2) {
            const [filters] = parseFilterArgs(arg1, arg2);
            filters.fetching = true;
            return this.queryCache.findAll(filters).length;
        }
        isMutating(filters) {
            return this.mutationCache.findAll(Object.assign(Object.assign({}, filters), { fetching: true })).length;
        }
        getQueryData(queryKey, filters) {
            var _a;
            return (_a = this.queryCache.find(queryKey, filters)) === null || _a === void 0 ? void 0 : _a.state.data;
        }
        getQueriesData(queryKeyOrFilters) {
            return this.getQueryCache()
                .findAll(queryKeyOrFilters)
                .map(({ queryKey, state }) => {
                const data = state.data;
                return [queryKey, data];
            });
        }
        setQueryData(queryKey, updater, options) {
            const parsedOptions = parseQueryArgs(queryKey);
            const defaultedOptions = this.defaultQueryOptions(parsedOptions);
            return this.queryCache
                .build(this, defaultedOptions)
                .setData(updater, options);
        }
        setQueriesData(queryKeyOrFilters, updater, options) {
            return notifyManager.batch(() => this.getQueryCache()
                .findAll(queryKeyOrFilters)
                .map(({ queryKey }) => [
                queryKey,
                this.setQueryData(queryKey, updater, options),
            ]));
        }
        getQueryState(queryKey, filters) {
            var _a;
            return (_a = this.queryCache.find(queryKey, filters)) === null || _a === void 0 ? void 0 : _a.state;
        }
        removeQueries(arg1, arg2) {
            const [filters] = parseFilterArgs(arg1, arg2);
            const queryCache = this.queryCache;
            notifyManager.batch(() => {
                queryCache.findAll(filters).forEach(query => {
                    queryCache.remove(query);
                });
            });
        }
        resetQueries(arg1, arg2, arg3) {
            const [filters, options] = parseFilterArgs(arg1, arg2, arg3);
            const queryCache = this.queryCache;
            const refetchFilters = Object.assign(Object.assign({}, filters), { active: true });
            return notifyManager.batch(() => {
                queryCache.findAll(filters).forEach(query => {
                    query.reset();
                });
                return this.refetchQueries(refetchFilters, options);
            });
        }
        cancelQueries(arg1, arg2, arg3) {
            const [filters, cancelOptions = {}] = parseFilterArgs(arg1, arg2, arg3);
            if (typeof cancelOptions.revert === 'undefined') {
                cancelOptions.revert = true;
            }
            const promises = notifyManager.batch(() => this.queryCache.findAll(filters).map(query => query.cancel(cancelOptions)));
            return Promise.all(promises).then(noop).catch(noop);
        }
        invalidateQueries(arg1, arg2, arg3) {
            var _a, _b, _c;
            const [filters, options] = parseFilterArgs(arg1, arg2, arg3);
            const refetchFilters = Object.assign(Object.assign({}, filters), { 
                // if filters.refetchActive is not provided and filters.active is explicitly false,
                // e.g. invalidateQueries({ active: false }), we don't want to refetch active queries
                active: (_b = (_a = filters.refetchActive) !== null && _a !== void 0 ? _a : filters.active) !== null && _b !== void 0 ? _b : true, inactive: (_c = filters.refetchInactive) !== null && _c !== void 0 ? _c : false });
            return notifyManager.batch(() => {
                this.queryCache.findAll(filters).forEach(query => {
                    query.invalidate();
                });
                return this.refetchQueries(refetchFilters, options);
            });
        }
        refetchQueries(arg1, arg2, arg3) {
            const [filters, options] = parseFilterArgs(arg1, arg2, arg3);
            const promises = notifyManager.batch(() => this.queryCache.findAll(filters).map(query => query.fetch(undefined, Object.assign(Object.assign({}, options), { meta: { refetchPage: filters === null || filters === void 0 ? void 0 : filters.refetchPage } }))));
            let promise = Promise.all(promises).then(noop);
            if (!(options === null || options === void 0 ? void 0 : options.throwOnError)) {
                promise = promise.catch(noop);
            }
            return promise;
        }
        fetchQuery(arg1, arg2, arg3) {
            const parsedOptions = parseQueryArgs(arg1, arg2, arg3);
            const defaultedOptions = this.defaultQueryOptions(parsedOptions);
            // https://github.com/tannerlinsley/react-query/issues/652
            if (typeof defaultedOptions.retry === 'undefined') {
                defaultedOptions.retry = false;
            }
            const query = this.queryCache.build(this, defaultedOptions);
            return query.isStaleByTime(defaultedOptions.staleTime)
                ? query.fetch(defaultedOptions)
                : Promise.resolve(query.state.data);
        }
        prefetchQuery(arg1, arg2, arg3) {
            return this.fetchQuery(arg1, arg2, arg3)
                .then(noop)
                .catch(noop);
        }
        fetchInfiniteQuery(arg1, arg2, arg3) {
            const parsedOptions = parseQueryArgs(arg1, arg2, arg3);
            parsedOptions.behavior = infiniteQueryBehavior();
            return this.fetchQuery(parsedOptions);
        }
        prefetchInfiniteQuery(arg1, arg2, arg3) {
            return this.fetchInfiniteQuery(arg1, arg2, arg3)
                .then(noop)
                .catch(noop);
        }
        cancelMutations() {
            const promises = notifyManager.batch(() => this.mutationCache.getAll().map(mutation => mutation.cancel()));
            return Promise.all(promises).then(noop).catch(noop);
        }
        resumePausedMutations() {
            return this.getMutationCache().resumePausedMutations();
        }
        executeMutation(options) {
            return this.mutationCache.build(this, options).execute();
        }
        getQueryCache() {
            return this.queryCache;
        }
        getMutationCache() {
            return this.mutationCache;
        }
        getDefaultOptions() {
            return this.defaultOptions;
        }
        setDefaultOptions(options) {
            this.defaultOptions = options;
        }
        setQueryDefaults(queryKey, options) {
            const result = this.queryDefaults.find(x => hashQueryKey(queryKey) === hashQueryKey(x.queryKey));
            if (result) {
                result.defaultOptions = options;
            }
            else {
                this.queryDefaults.push({ queryKey, defaultOptions: options });
            }
        }
        getQueryDefaults(queryKey) {
            var _a;
            return queryKey
                ? (_a = this.queryDefaults.find(x => partialMatchKey(queryKey, x.queryKey))) === null || _a === void 0 ? void 0 : _a.defaultOptions : undefined;
        }
        setMutationDefaults(mutationKey, options) {
            const result = this.mutationDefaults.find(x => hashQueryKey(mutationKey) === hashQueryKey(x.mutationKey));
            if (result) {
                result.defaultOptions = options;
            }
            else {
                this.mutationDefaults.push({ mutationKey, defaultOptions: options });
            }
        }
        getMutationDefaults(mutationKey) {
            var _a;
            return mutationKey
                ? (_a = this.mutationDefaults.find(x => partialMatchKey(mutationKey, x.mutationKey))) === null || _a === void 0 ? void 0 : _a.defaultOptions : undefined;
        }
        defaultQueryOptions(options) {
            if (options === null || options === void 0 ? void 0 : options._defaulted) {
                return options;
            }
            const defaultedOptions = Object.assign(Object.assign(Object.assign(Object.assign({}, this.defaultOptions.queries), this.getQueryDefaults(options === null || options === void 0 ? void 0 : options.queryKey)), options), { _defaulted: true });
            if (!defaultedOptions.queryHash && defaultedOptions.queryKey) {
                defaultedOptions.queryHash = hashQueryKeyByOptions(defaultedOptions.queryKey, defaultedOptions);
            }
            return defaultedOptions;
        }
        defaultQueryObserverOptions(options) {
            return this.defaultQueryOptions(options);
        }
        defaultMutationOptions(options) {
            if (options === null || options === void 0 ? void 0 : options._defaulted) {
                return options;
            }
            return Object.assign(Object.assign(Object.assign(Object.assign({}, this.defaultOptions.mutations), this.getMutationDefaults(options === null || options === void 0 ? void 0 : options.mutationKey)), options), { _defaulted: true });
        }
        clear() {
            this.queryCache.clear();
            this.mutationCache.clear();
        }
    }

    class QueriesObserver extends Subscribable {
        constructor(client, queries) {
            super();
            this.client = client;
            this.queries = [];
            this.result = [];
            this.observers = [];
            this.observersMap = {};
            if (queries) {
                this.setQueries(queries);
            }
        }
        onSubscribe() {
            if (this.listeners.length === 1) {
                this.observers.forEach(observer => {
                    observer.subscribe(result => {
                        this.onUpdate(observer, result);
                    });
                });
            }
        }
        onUnsubscribe() {
            if (!this.listeners.length) {
                this.destroy();
            }
        }
        destroy() {
            this.listeners = [];
            this.observers.forEach(observer => {
                observer.destroy();
            });
        }
        setQueries(queries, notifyOptions) {
            this.queries = queries;
            this.updateObservers(notifyOptions);
        }
        getCurrentResult() {
            return this.result;
        }
        getOptimisticResult(queries) {
            return this.findMatchingObservers(queries).map(match => match.observer.getOptimisticResult(match.defaultedQueryOptions));
        }
        findMatchingObservers(queries) {
            const prevObservers = this.observers;
            const defaultedQueryOptions = queries.map(options => this.client.defaultQueryObserverOptions(options));
            const matchingObservers = defaultedQueryOptions.flatMap(defaultedOptions => {
                const match = prevObservers.find(observer => observer.options.queryHash === defaultedOptions.queryHash);
                if (match != null) {
                    return [{ defaultedQueryOptions: defaultedOptions, observer: match }];
                }
                return [];
            });
            const matchedQueryHashes = matchingObservers.map(match => match.defaultedQueryOptions.queryHash);
            const unmatchedQueries = defaultedQueryOptions.filter(defaultedOptions => !matchedQueryHashes.includes(defaultedOptions.queryHash));
            const unmatchedObservers = prevObservers.filter(prevObserver => !matchingObservers.some(match => match.observer === prevObserver));
            const newOrReusedObservers = unmatchedQueries.map((options, index) => {
                if (options.keepPreviousData) {
                    // return previous data from one of the observers that no longer match
                    const previouslyUsedObserver = unmatchedObservers[index];
                    if (previouslyUsedObserver !== undefined) {
                        return {
                            defaultedQueryOptions: options,
                            observer: previouslyUsedObserver,
                        };
                    }
                }
                return {
                    defaultedQueryOptions: options,
                    observer: this.getObserver(options),
                };
            });
            const sortMatchesByOrderOfQueries = (a, b) => defaultedQueryOptions.indexOf(a.defaultedQueryOptions) -
                defaultedQueryOptions.indexOf(b.defaultedQueryOptions);
            return matchingObservers
                .concat(newOrReusedObservers)
                .sort(sortMatchesByOrderOfQueries);
        }
        getObserver(options) {
            const defaultedOptions = this.client.defaultQueryObserverOptions(options);
            const currentObserver = this.observersMap[defaultedOptions.queryHash];
            return currentObserver !== null && currentObserver !== void 0 ? currentObserver : new QueryObserver(this.client, defaultedOptions);
        }
        updateObservers(notifyOptions) {
            notifyManager.batch(() => {
                const prevObservers = this.observers;
                const newObserverMatches = this.findMatchingObservers(this.queries);
                // set options for the new observers to notify of changes
                newObserverMatches.forEach(match => match.observer.setOptions(match.defaultedQueryOptions, notifyOptions));
                const newObservers = newObserverMatches.map(match => match.observer);
                const newObserversMap = Object.fromEntries(newObservers.map(observer => [observer.options.queryHash, observer]));
                const newResult = newObservers.map(observer => observer.getCurrentResult());
                const hasIndexChange = newObservers.some((observer, index) => observer !== prevObservers[index]);
                if (prevObservers.length === newObservers.length && !hasIndexChange) {
                    return;
                }
                this.observers = newObservers;
                this.observersMap = newObserversMap;
                this.result = newResult;
                if (!this.hasListeners()) {
                    return;
                }
                difference(prevObservers, newObservers).forEach(observer => {
                    observer.destroy();
                });
                difference(newObservers, prevObservers).forEach(observer => {
                    observer.subscribe(result => {
                        this.onUpdate(observer, result);
                    });
                });
                this.notify();
            });
        }
        onUpdate(observer, result) {
            const index = this.observers.indexOf(observer);
            if (index !== -1) {
                this.result = replaceAt(this.result, index, result);
                this.notify();
            }
        }
        notify() {
            notifyManager.batch(() => {
                this.listeners.forEach(listener => {
                    listener(this.result);
                });
            });
        }
    }

    class InfiniteQueryObserver extends QueryObserver {
        // // Type override
        // subscribe!: (
        //   listener?: InfiniteQueryObserverListener<TData, TError>
        // ) => () => void
        // // Type override
        // getCurrentResult!: () => InfiniteQueryObserverResult<TData, TError>
        // // Type override
        // protected fetch!: (
        //   fetchOptions?: ObserverFetchOptions
        // ) => Promise<InfiniteQueryObserverResult<TData, TError>>
        // eslint-disable-next-line @typescript-eslint/no-useless-constructor
        constructor(client, options) {
            super(client, options);
        }
        subscribe(listener) {
            return super.subscribe(listener);
        }
        getCurrentResult() {
            return super.getCurrentResult();
        }
        fetch(fetchOptions) {
            return super.fetch(fetchOptions);
        }
        bindMethods() {
            super.bindMethods();
            this.fetchNextPage = this.fetchNextPage.bind(this);
            this.fetchPreviousPage = this.fetchPreviousPage.bind(this);
        }
        setOptions(options, notifyOptions) {
            super.setOptions(Object.assign(Object.assign({}, options), { behavior: infiniteQueryBehavior() }), notifyOptions);
        }
        getOptimisticResult(options) {
            options.behavior = infiniteQueryBehavior();
            return super.getOptimisticResult(options);
        }
        fetchNextPage(options) {
            var _a;
            return this.fetch({
                // TODO consider removing `?? true` in future breaking change, to be consistent with `refetch` API (see https://github.com/tannerlinsley/react-query/issues/2617)
                cancelRefetch: (_a = options === null || options === void 0 ? void 0 : options.cancelRefetch) !== null && _a !== void 0 ? _a : true,
                throwOnError: options === null || options === void 0 ? void 0 : options.throwOnError,
                meta: {
                    fetchMore: { direction: 'forward', pageParam: options === null || options === void 0 ? void 0 : options.pageParam },
                },
            });
        }
        fetchPreviousPage(options) {
            var _a;
            return this.fetch({
                // TODO consider removing `?? true` in future breaking change, to be consistent with `refetch` API (see https://github.com/tannerlinsley/react-query/issues/2617)
                cancelRefetch: (_a = options === null || options === void 0 ? void 0 : options.cancelRefetch) !== null && _a !== void 0 ? _a : true,
                throwOnError: options === null || options === void 0 ? void 0 : options.throwOnError,
                meta: {
                    fetchMore: { direction: 'backward', pageParam: options === null || options === void 0 ? void 0 : options.pageParam },
                },
            });
        }
        createResult(query, options) {
            var _a, _b, _c, _d, _e, _f;
            const { state } = query;
            const result = super.createResult(query, options);
            return Object.assign(Object.assign({}, result), { fetchNextPage: this.fetchNextPage, fetchPreviousPage: this.fetchPreviousPage, hasNextPage: hasNextPage(options, (_a = state.data) === null || _a === void 0 ? void 0 : _a.pages), hasPreviousPage: hasPreviousPage(options, (_b = state.data) === null || _b === void 0 ? void 0 : _b.pages), isFetchingNextPage: state.isFetching && ((_d = (_c = state.fetchMeta) === null || _c === void 0 ? void 0 : _c.fetchMore) === null || _d === void 0 ? void 0 : _d.direction) === 'forward', isFetchingPreviousPage: state.isFetching &&
                    ((_f = (_e = state.fetchMeta) === null || _e === void 0 ? void 0 : _e.fetchMore) === null || _f === void 0 ? void 0 : _f.direction) === 'backward' });
        }
    }

    // CLASS
    class MutationObserver extends Subscribable {
        constructor(client, options) {
            super();
            this.client = client;
            this.setOptions(options);
            this.bindMethods();
            this.updateResult();
        }
        bindMethods() {
            this.mutate = this.mutate.bind(this);
            this.reset = this.reset.bind(this);
        }
        setOptions(options) {
            this.options = this.client.defaultMutationOptions(options);
        }
        onUnsubscribe() {
            var _a;
            if (!this.listeners.length) {
                (_a = this.currentMutation) === null || _a === void 0 ? void 0 : _a.removeObserver(this);
            }
        }
        onMutationUpdate(action) {
            this.updateResult();
            // Determine which callbacks to trigger
            const notifyOptions = {
                listeners: true,
            };
            if (action.type === 'success') {
                notifyOptions.onSuccess = true;
            }
            else if (action.type === 'error') {
                notifyOptions.onError = true;
            }
            this.notify(notifyOptions);
        }
        getCurrentResult() {
            return this.currentResult;
        }
        reset() {
            this.currentMutation = undefined;
            this.updateResult();
            this.notify({ listeners: true });
        }
        mutate(variables, options) {
            this.mutateOptions = options;
            if (this.currentMutation) {
                this.currentMutation.removeObserver(this);
            }
            this.currentMutation = this.client.getMutationCache().build(this.client, Object.assign(Object.assign({}, this.options), { variables: typeof variables !== 'undefined' ? variables : this.options.variables }));
            this.currentMutation.addObserver(this);
            return this.currentMutation.execute();
        }
        updateResult() {
            const state = this.currentMutation
                ? this.currentMutation.state
                : getDefaultState();
            const result = Object.assign(Object.assign({}, state), { isLoading: state.status === 'loading', isSuccess: state.status === 'success', isError: state.status === 'error', isIdle: state.status === 'idle', mutate: this.mutate, reset: this.reset });
            this.currentResult = result;
        }
        notify(options) {
            notifyManager.batch(() => {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                // First trigger the mutate callbacks
                if (this.mutateOptions) {
                    if (options.onSuccess) {
                        (_b = (_a = this.mutateOptions).onSuccess) === null || _b === void 0 ? void 0 : _b.call(_a, this.currentResult.data, this.currentResult.variables, this.currentResult.context);
                        (_d = (_c = this.mutateOptions).onSettled) === null || _d === void 0 ? void 0 : _d.call(_c, this.currentResult.data, null, this.currentResult.variables, this.currentResult.context);
                    }
                    else if (options.onError) {
                        (_f = (_e = this.mutateOptions).onError) === null || _f === void 0 ? void 0 : _f.call(_e, this.currentResult.error, this.currentResult.variables, this.currentResult.context);
                        (_h = (_g = this.mutateOptions).onSettled) === null || _h === void 0 ? void 0 : _h.call(_g, undefined, this.currentResult.error, this.currentResult.variables, this.currentResult.context);
                    }
                }
                // Then trigger the listeners
                if (options.listeners) {
                    this.listeners.forEach(listener => {
                        listener(this.currentResult);
                    });
                }
            });
        }
    }

    // FUNCTIONS
    function dehydrateMutation(mutation) {
        return {
            mutationKey: mutation.options.mutationKey,
            state: mutation.state,
        };
    }
    // Most config is not dehydrated but instead meant to configure again when
    // consuming the de/rehydrated data, typically with useQuery on the client.
    // Sometimes it might make sense to prefetch data on the server and include
    // in the html-payload, but not consume it on the initial render.
    function dehydrateQuery(query) {
        return {
            state: query.state,
            queryKey: query.queryKey,
            queryHash: query.queryHash,
        };
    }
    function defaultShouldDehydrateMutation(mutation) {
        return mutation.state.isPaused;
    }
    function defaultShouldDehydrateQuery(query) {
        return query.state.status === 'success';
    }
    function dehydrate(client, options) {
        options = options || {};
        const mutations = [];
        const queries = [];
        if ((options === null || options === void 0 ? void 0 : options.dehydrateMutations) !== false) {
            const shouldDehydrateMutation = options.shouldDehydrateMutation || defaultShouldDehydrateMutation;
            client
                .getMutationCache()
                .getAll()
                .forEach(mutation => {
                if (shouldDehydrateMutation(mutation)) {
                    mutations.push(dehydrateMutation(mutation));
                }
            });
        }
        if ((options === null || options === void 0 ? void 0 : options.dehydrateQueries) !== false) {
            const shouldDehydrateQuery = options.shouldDehydrateQuery || defaultShouldDehydrateQuery;
            client
                .getQueryCache()
                .getAll()
                .forEach(query => {
                if (shouldDehydrateQuery(query)) {
                    queries.push(dehydrateQuery(query));
                }
            });
        }
        return { mutations, queries };
    }
    function hydrate(client, dehydratedState, options) {
        if (typeof dehydratedState !== 'object' || dehydratedState === null) {
            return;
        }
        const mutationCache = client.getMutationCache();
        const queryCache = client.getQueryCache();
        const mutations = dehydratedState.mutations || [];
        const queries = dehydratedState.queries || [];
        mutations.forEach(dehydratedMutation => {
            var _a;
            mutationCache.build(client, Object.assign(Object.assign({}, (_a = options === null || options === void 0 ? void 0 : options.defaultOptions) === null || _a === void 0 ? void 0 : _a.mutations), { mutationKey: dehydratedMutation.mutationKey }), dehydratedMutation.state);
        });
        queries.forEach(dehydratedQuery => {
            var _a;
            const query = queryCache.get(dehydratedQuery.queryHash);
            // Do not hydrate if an existing query exists with newer data
            if (query) {
                if (query.state.dataUpdatedAt < dehydratedQuery.state.dataUpdatedAt) {
                    query.setState(dehydratedQuery.state);
                }
                return;
            }
            // Restore query
            queryCache.build(client, Object.assign(Object.assign({}, (_a = options === null || options === void 0 ? void 0 : options.defaultOptions) === null || _a === void 0 ? void 0 : _a.queries), { queryKey: dehydratedQuery.queryKey, queryHash: dehydratedQuery.queryHash }), dehydratedQuery.state);
        });
    }

    async function persistQueryClient({ queryClient, persistor, maxAge = 1000 * 60 * 60 * 24, buster = '', hydrateOptions, dehydrateOptions, }) {
        if (typeof window !== 'undefined') {
            // Subscribe to changes
            const saveClient = () => {
                const persistClient = {
                    buster,
                    timestamp: Date.now(),
                    clientState: dehydrate(queryClient, dehydrateOptions),
                };
                persistor.persistClient(persistClient);
            };
            // Attempt restore
            try {
                const persistedClient = await persistor.restoreClient();
                if (persistedClient) {
                    if (persistedClient.timestamp) {
                        const expired = Date.now() - persistedClient.timestamp > maxAge;
                        const busted = persistedClient.buster !== buster;
                        if (expired || busted) {
                            persistor.removeClient();
                        }
                        else {
                            hydrate(queryClient, persistedClient.clientState, hydrateOptions);
                        }
                    }
                    else {
                        persistor.removeClient();
                    }
                }
            }
            catch (err) {
                getLogger().error(err);
                getLogger().warn('Encountered an error attempting to restore client cache from persisted location. As a precaution, the persisted cache will be discarded.');
                persistor.removeClient();
            }
            // Subscribe to changes in the query cache to trigger the save
            queryClient.getQueryCache().subscribe(saveClient);
        }
    }

    function createWebStoragePersistor({ storage, key = `SVELTE_QUERY_OFFLINE_CACHE`, throttleTime = 1000, serialize = JSON.stringify, deserialize = JSON.parse, }) {
        //try to save data to storage
        function trySave(persistedClient) {
            try {
                storage.setItem(key, serialize(persistedClient));
            }
            catch (_a) {
                return false;
            }
            return true;
        }
        if (typeof storage !== 'undefined') {
            return {
                persistClient: throttle(persistedClient => {
                    if (trySave(persistedClient) !== true) {
                        const mutations = [...persistedClient.clientState.mutations];
                        const queries = [...persistedClient.clientState.queries];
                        const client = Object.assign(Object.assign({}, persistedClient), { clientState: { mutations, queries } });
                        // sort queries by dataUpdatedAt (oldest first)
                        const sortedQueries = [...queries].sort((a, b) => a.state.dataUpdatedAt - b.state.dataUpdatedAt);
                        // clean old queries and try to save
                        while (sortedQueries.length > 0) {
                            const oldestData = sortedQueries.shift();
                            client.clientState.queries = queries.filter(q => q !== oldestData);
                            if (trySave(client)) {
                                return; // save success
                            }
                        }
                        // clean mutations and try to save
                        while (mutations.shift()) {
                            if (trySave(client)) {
                                return; // save success
                            }
                        }
                    }
                }, throttleTime),
                restoreClient: () => {
                    const cacheString = storage.getItem(key);
                    if (!cacheString) {
                        return;
                    }
                    return deserialize(cacheString);
                },
                removeClient: () => {
                    storage.removeItem(key);
                },
            };
        }
        return {
            persistClient: noop,
            restoreClient: noop,
            removeClient: noop,
        };
    }
    function throttle(func, wait = 100) {
        let timer = null;
        let params;
        return function (...args) {
            params = args;
            if (timer === null) {
                // @ts-ignore
                timer = setTimeout(() => {
                    func(...params);
                    timer = null;
                }, wait);
            }
        };
    }

    const createAsyncStoragePersistor = ({ storage, key = `SVELTE_QUERY_OFFLINE_CACHE`, throttleTime = 1000, serialize = JSON.stringify, deserialize = JSON.parse, }) => {
        return {
            persistClient: asyncThrottle(persistedClient => storage.setItem(key, serialize(persistedClient)), { interval: throttleTime }),
            restoreClient: async () => {
                const cacheString = await storage.getItem(key);
                if (!cacheString) {
                    return;
                }
                return deserialize(cacheString);
            },
            removeClient: () => storage.removeItem(key),
        };
    };
    function asyncThrottle(func, { interval = 1000, limit = 1 } = {}) {
        if (typeof func !== 'function')
            throw new Error('argument is not function.');
        const running = { current: false };
        let lastTime = 0;
        let timeout;
        const queue = [];
        return (...args) => (async () => {
            if (running.current) {
                lastTime = Date.now();
                if (queue.length > limit) {
                    queue.shift();
                }
                queue.push(args);
                clearTimeout(timeout);
            }
            if (Date.now() - lastTime > interval) {
                running.current = true;
                await func(...args);
                lastTime = Date.now();
                running.current = false;
            }
            else {
                if (queue.length > 0) {
                    const lastArgs = queue[queue.length - 1];
                    // @ts-ignore
                    timeout = setTimeout(async () => {
                        if (!running.current) {
                            running.current = true;
                            await func(...lastArgs);
                            running.current = false;
                        }
                    }, interval);
                }
            }
        })();
    }

    async function broadcastQueryClient({ queryClient, broadcastChannel = 'svelte-query', }) {
        const { BroadcastChannel } = await import('broadcast-channel');
        let transaction = false;
        const tx = (cb) => {
            transaction = true;
            cb();
            transaction = false;
        };
        const channel = new BroadcastChannel(broadcastChannel, {
            webWorkerSupport: false,
        });
        const queryCache = queryClient.getQueryCache();
        queryClient.getQueryCache().subscribe(queryEvent => {
            var _a;
            if (transaction || !(queryEvent === null || queryEvent === void 0 ? void 0 : queryEvent.query)) {
                return;
            }
            const { query: { queryHash, queryKey, state }, } = queryEvent;
            if (queryEvent.type === 'queryUpdated' &&
                ((_a = queryEvent.action) === null || _a === void 0 ? void 0 : _a.type) === 'success') {
                channel.postMessage({
                    type: 'queryUpdated',
                    queryHash,
                    queryKey,
                    state,
                });
            }
            if (queryEvent.type === 'queryRemoved') {
                channel.postMessage({
                    type: 'queryRemoved',
                    queryHash,
                    queryKey,
                });
            }
        });
        channel.onmessage = action => {
            if (!(action === null || action === void 0 ? void 0 : action.type)) {
                return;
            }
            tx(() => {
                const { type, queryHash, queryKey, state } = action;
                if (type === 'queryUpdated') {
                    const query = queryCache.get(queryHash);
                    if (query) {
                        query.setState(state);
                        return;
                    }
                    queryCache.build(queryClient, {
                        queryKey,
                        queryHash,
                    }, state);
                }
                else if (type === 'queryRemoved') {
                    const query = queryCache.get(queryHash);
                    if (query) {
                        queryCache.remove(query);
                    }
                }
            });
        };
    }

    function noop$1() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop$1;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop$1,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop$1;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    /* src/queryClientProvider/QueryClientProvider.svelte generated by Svelte v3.31.0 */

    function create_fragment(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	
    	let { queryCache = new QueryCache() } = $$props;
    	let { mutationCache = new MutationCache() } = $$props;
    	let { defaultOptions = {} } = $$props;

    	let { client = new QueryClient({
    			queryCache,
    			mutationCache,
    			defaultOptions
    		}) } = $$props;

    	onMount(() => {
    		client.mount();
    	});

    	setContext("queryClient", client);

    	onDestroy(() => {
    		client.unmount();
    	});

    	$$self.$$set = $$props => {
    		if ("queryCache" in $$props) $$invalidate(0, queryCache = $$props.queryCache);
    		if ("mutationCache" in $$props) $$invalidate(1, mutationCache = $$props.mutationCache);
    		if ("defaultOptions" in $$props) $$invalidate(2, defaultOptions = $$props.defaultOptions);
    		if ("client" in $$props) $$invalidate(3, client = $$props.client);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	return [queryCache, mutationCache, defaultOptions, client, $$scope, slots];
    }

    class QueryClientProvider extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			queryCache: 0,
    			mutationCache: 1,
    			defaultOptions: 2,
    			client: 3
    		});
    	}
    }

    function useQueryClient() {
        const queryClient = getContext('queryClient');
        if (!queryClient) {
            throw new Error('No QueryClient set, use QueryClientProvider to set one');
        }
        return queryClient;
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop$1) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop$1) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop$1;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function setBatchCalls(options) {
        // Make sure results are optimistically set in fetching state before subscribing or updating options
        options.optimisticResults = true;
        if (options.onError) {
            options.onError = notifyManager.batchCalls(options.onError);
        }
        if (options.onSuccess) {
            options.onSuccess = notifyManager.batchCalls(options.onSuccess);
        }
        if (options.onSettled) {
            options.onSettled = notifyManager.batchCalls(options.onSettled);
        }
        return options;
    }

    /* eslint-disable no-shadow */
    function useQuery(arg1, arg2, arg3) {
        const options = parseQueryArgs(arg1, arg2, arg3);
        const client = useQueryClient();
        let defaultedOptions = client.defaultQueryObserverOptions(options);
        // Include callbacks in batch renders
        defaultedOptions = setBatchCalls(defaultedOptions);
        const observer = new QueryObserver(client, defaultedOptions);
        const { subscribe } = readable(observer.getCurrentResult(), set => {
            return observer.subscribe(notifyManager.batchCalls(set));
        });
        // Update result to make sure we did not miss any query updates
        // between creating the observer and subscribing to it.
        observer.updateResult();
        function setOptions(arg1, arg2, arg3) {
            const options = parseQueryArgs(arg1, arg2, arg3);
            let defaultedOptions = client.defaultQueryObserverOptions(options);
            // Include callbacks in batch renders
            defaultedOptions = setBatchCalls(defaultedOptions);
            if (observer.hasListeners()) {
                observer.setOptions(defaultedOptions, { listeners: false });
            }
        }
        function updateOptions(options) {
            observer.updateOptions(options);
        }
        function setEnabled(enabled) {
            updateOptions({ enabled });
        }
        return { subscribe, setOptions, updateOptions, setEnabled };
    }

    /* src/query/Query.svelte generated by Svelte v3.31.0 */
    const get_query_slot_changes = dirty => ({ queryResult: dirty & /*queryResult*/ 1 });
    const get_query_slot_context = ctx => ({ queryResult: /*queryResult*/ ctx[0] });

    function create_fragment$1(ctx) {
    	let current;
    	const query_slot_template = /*#slots*/ ctx[6].query;
    	const query_slot = create_slot(query_slot_template, ctx, /*$$scope*/ ctx[5], get_query_slot_context);

    	return {
    		c() {
    			if (query_slot) query_slot.c();
    		},
    		m(target, anchor) {
    			if (query_slot) {
    				query_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (query_slot) {
    				if (query_slot.p && dirty & /*$$scope, queryResult*/ 33) {
    					update_slot(query_slot, query_slot_template, ctx, /*$$scope*/ ctx[5], dirty, get_query_slot_changes, get_query_slot_context);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(query_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(query_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (query_slot) query_slot.d(detaching);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $query;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	
    	
    	let { options } = $$props;
    	let { queryResult = undefined } = $$props;
    	let firstRender = true;

    	onMount(() => {
    		$$invalidate(3, firstRender = false);
    	});

    	const query = useQuery(options);
    	component_subscribe($$self, query, value => $$invalidate(4, $query = value));

    	$$self.$$set = $$props => {
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    		if ("queryResult" in $$props) $$invalidate(0, queryResult = $$props.queryResult);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$query*/ 16) {
    			$$invalidate(0, queryResult = $query);
    		}

    		if ($$self.$$.dirty & /*firstRender, options*/ 12) {
    			{
    				if (!firstRender) {
    					query.setOptions(options);
    				}
    			}
    		}
    	};

    	return [queryResult, query, options, firstRender, $query, $$scope, slots];
    }

    class Query$1 extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { options: 2, queryResult: 0 });
    	}
    }

    /* eslint-disable no-shadow */
    function useInfiniteQuery(arg1, arg2, arg3) {
        const options = parseQueryArgs(arg1, arg2, arg3);
        const client = useQueryClient();
        let defaultedOptions = client.defaultQueryObserverOptions(options);
        // Include callbacks in batch renders
        defaultedOptions = setBatchCalls(defaultedOptions);
        const observer = new InfiniteQueryObserver(client, defaultedOptions);
        const { subscribe } = readable(observer.getCurrentResult(), set => {
            return observer.subscribe(notifyManager.batchCalls(set));
        });
        // between creating the observer and subscribing to it.
        observer.updateResult();
        function setOptions(arg1, arg2, arg3) {
            if (observer.hasListeners()) {
                const options = parseQueryArgs(arg1, arg2, arg3);
                let defaultedOptions = client.defaultQueryObserverOptions(options);
                // Include callbacks in batch renders
                defaultedOptions = setBatchCalls(defaultedOptions);
                observer.setOptions(defaultedOptions, { listeners: false });
            }
        }
        function updateOptions(options) {
            observer.updateOptions(options);
        }
        function setEnabled(enabled) {
            updateOptions({ enabled });
        }
        return { subscribe, setOptions, updateOptions, setEnabled };
    }

    /* src/infiniteQuery/InfiniteQuery.svelte generated by Svelte v3.31.0 */
    const get_query_slot_changes$1 = dirty => ({ queryResult: dirty & /*queryResult*/ 1 });
    const get_query_slot_context$1 = ctx => ({ queryResult: /*queryResult*/ ctx[0] });

    function create_fragment$2(ctx) {
    	let current;
    	const query_slot_template = /*#slots*/ ctx[6].query;
    	const query_slot = create_slot(query_slot_template, ctx, /*$$scope*/ ctx[5], get_query_slot_context$1);

    	return {
    		c() {
    			if (query_slot) query_slot.c();
    		},
    		m(target, anchor) {
    			if (query_slot) {
    				query_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (query_slot) {
    				if (query_slot.p && dirty & /*$$scope, queryResult*/ 33) {
    					update_slot(query_slot, query_slot_template, ctx, /*$$scope*/ ctx[5], dirty, get_query_slot_changes$1, get_query_slot_context$1);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(query_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(query_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (query_slot) query_slot.d(detaching);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $query;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	
    	let { options } = $$props;
    	let { queryResult = undefined } = $$props;
    	let firstRender = true;

    	onMount(() => {
    		$$invalidate(3, firstRender = false);
    	});

    	const query = useInfiniteQuery(options);
    	component_subscribe($$self, query, value => $$invalidate(4, $query = value));

    	$$self.$$set = $$props => {
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    		if ("queryResult" in $$props) $$invalidate(0, queryResult = $$props.queryResult);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$query*/ 16) {
    			$$invalidate(0, queryResult = $query);
    		}

    		if ($$self.$$.dirty & /*firstRender, options*/ 12) {
    			{
    				if (!firstRender) {
    					query.setOptions(options);
    				}
    			}
    		}
    	};

    	return [queryResult, query, options, firstRender, $query, $$scope, slots];
    }

    class InfiniteQuery extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { options: 2, queryResult: 0 });
    	}
    }

    function useQueries(queries) {
        const client = useQueryClient();
        function getDefaultQuery(newQueries) {
            return newQueries.map(options => {
                const defaultedOptions = client.defaultQueryObserverOptions(options);
                // Make sure the results are already in fetching state before subscribing or updating options
                defaultedOptions.optimisticResults = true;
                return defaultedOptions;
            });
        }
        const defaultedQueries = getDefaultQuery(queries);
        const observer = new QueriesObserver(client, defaultedQueries);
        const { subscribe } = readable(observer.getCurrentResult(), (set) => {
            return observer.subscribe(notifyManager.batchCalls(set));
        });
        const setQueries = (newQueries) => {
            if (observer.hasListeners()) {
                const defaultedNewQueries = getDefaultQuery(newQueries);
                observer.setQueries(defaultedNewQueries, { listeners: false });
            }
        };
        return { subscribe, setQueries };
    }

    /* src/queries/Queries.svelte generated by Svelte v3.31.0 */

    const get_queries_slot_changes = dirty => ({
    	currentResult: dirty & /*currentResult*/ 1
    });

    const get_queries_slot_context = ctx => ({ currentResult: /*currentResult*/ ctx[0] });

    function create_fragment$3(ctx) {
    	let current;
    	const queries_slot_template = /*#slots*/ ctx[6].queries;
    	const queries_slot = create_slot(queries_slot_template, ctx, /*$$scope*/ ctx[5], get_queries_slot_context);

    	return {
    		c() {
    			if (queries_slot) queries_slot.c();
    		},
    		m(target, anchor) {
    			if (queries_slot) {
    				queries_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (queries_slot) {
    				if (queries_slot.p && dirty & /*$$scope, currentResult*/ 33) {
    					update_slot(queries_slot, queries_slot_template, ctx, /*$$scope*/ ctx[5], dirty, get_queries_slot_changes, get_queries_slot_context);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(queries_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(queries_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (queries_slot) queries_slot.d(detaching);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $queriesStore;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	
    	let { queries } = $$props;
    	let { currentResult = [] } = $$props;
    	let firstRender = true;

    	onMount(() => {
    		$$invalidate(3, firstRender = false);
    	});

    	const queriesStore = useQueries(queries);
    	component_subscribe($$self, queriesStore, value => $$invalidate(4, $queriesStore = value));

    	$$self.$$set = $$props => {
    		if ("queries" in $$props) $$invalidate(2, queries = $$props.queries);
    		if ("currentResult" in $$props) $$invalidate(0, currentResult = $$props.currentResult);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$queriesStore*/ 16) {
    			$$invalidate(0, currentResult = $queriesStore);
    		}

    		if ($$self.$$.dirty & /*firstRender, queries*/ 12) {
    			{
    				if (!firstRender) {
    					queriesStore.setQueries(queries);
    				}
    			}
    		}
    	};

    	return [
    		currentResult,
    		queriesStore,
    		queries,
    		firstRender,
    		$queriesStore,
    		$$scope,
    		slots
    	];
    }

    class Queries extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { queries: 2, currentResult: 0 });
    	}
    }

    function useIsFetching(arg1, arg2) {
        const [filters] = parseFilterArgs(arg1, arg2);
        const client = useQueryClient();
        const cache = client.getQueryCache();
        // isFetching is the prev value initialized on mount *
        let isFetching = client.isFetching(filters);
        const { subscribe } = readable(isFetching, set => {
            return cache.subscribe(notifyManager.batchCalls(() => {
                const newIsFetching = client.isFetching(filters);
                if (isFetching !== newIsFetching) {
                    // * and update with each change
                    isFetching = newIsFetching;
                    set(isFetching);
                }
            }));
        });
        return { subscribe };
    }

    /* src/isFetching/IsFetching.svelte generated by Svelte v3.31.0 */
    const get_isFetching_slot_changes = dirty => ({ isFetching: dirty & /*isFetching*/ 1 });
    const get_isFetching_slot_context = ctx => ({ isFetching: /*isFetching*/ ctx[0] });

    function create_fragment$4(ctx) {
    	let current;
    	const isFetching_slot_template = /*#slots*/ ctx[5].isFetching;
    	const isFetching_slot = create_slot(isFetching_slot_template, ctx, /*$$scope*/ ctx[4], get_isFetching_slot_context);

    	return {
    		c() {
    			if (isFetching_slot) isFetching_slot.c();
    		},
    		m(target, anchor) {
    			if (isFetching_slot) {
    				isFetching_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (isFetching_slot) {
    				if (isFetching_slot.p && dirty & /*$$scope, isFetching*/ 17) {
    					update_slot(isFetching_slot, isFetching_slot_template, ctx, /*$$scope*/ ctx[4], dirty, get_isFetching_slot_changes, get_isFetching_slot_context);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(isFetching_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(isFetching_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (isFetching_slot) isFetching_slot.d(detaching);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $isFetchingResult,
    		$$unsubscribe_isFetchingResult = noop$1,
    		$$subscribe_isFetchingResult = () => ($$unsubscribe_isFetchingResult(), $$unsubscribe_isFetchingResult = subscribe(isFetchingResult, $$value => $$invalidate(3, $isFetchingResult = $$value)), isFetchingResult);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_isFetchingResult());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	
    	let { filters = undefined } = $$props;
    	let { isFetching = undefined } = $$props;

    	$$self.$$set = $$props => {
    		if ("filters" in $$props) $$invalidate(2, filters = $$props.filters);
    		if ("isFetching" in $$props) $$invalidate(0, isFetching = $$props.isFetching);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	let isFetchingResult;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*filters*/ 4) {
    			$$subscribe_isFetchingResult($$invalidate(1, isFetchingResult = useIsFetching(filters)));
    		}

    		if ($$self.$$.dirty & /*$isFetchingResult*/ 8) {
    			$$invalidate(0, isFetching = $isFetchingResult);
    		}
    	};

    	return [isFetching, isFetchingResult, filters, $isFetchingResult, $$scope, slots];
    }

    class IsFetching extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { filters: 2, isFetching: 0 });
    	}
    }

    function useIsMutating(filters) {
        const client = useQueryClient();
        const cache = client.getMutationCache();
        // isMutating is the prev value initialized on mount *
        let isMutating = client.isMutating(filters);
        const { subscribe } = readable(isMutating, set => {
            return cache.subscribe(notifyManager.batchCalls(() => {
                const newIisMutating = client.isMutating(filters);
                if (isMutating !== newIisMutating) {
                    // * and update with each change
                    isMutating = newIisMutating;
                    set(isMutating);
                }
            }));
        });
        return { subscribe };
    }

    /* src/isMutating/IsMutating.svelte generated by Svelte v3.31.0 */
    const get_isMutating_slot_changes = dirty => ({ isMutating: dirty & /*isMutating*/ 1 });
    const get_isMutating_slot_context = ctx => ({ isMutating: /*isMutating*/ ctx[0] });

    function create_fragment$5(ctx) {
    	let current;
    	const isMutating_slot_template = /*#slots*/ ctx[5].isMutating;
    	const isMutating_slot = create_slot(isMutating_slot_template, ctx, /*$$scope*/ ctx[4], get_isMutating_slot_context);

    	return {
    		c() {
    			if (isMutating_slot) isMutating_slot.c();
    		},
    		m(target, anchor) {
    			if (isMutating_slot) {
    				isMutating_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (isMutating_slot) {
    				if (isMutating_slot.p && dirty & /*$$scope, isMutating*/ 17) {
    					update_slot(isMutating_slot, isMutating_slot_template, ctx, /*$$scope*/ ctx[4], dirty, get_isMutating_slot_changes, get_isMutating_slot_context);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(isMutating_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(isMutating_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (isMutating_slot) isMutating_slot.d(detaching);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $isMutatingResult,
    		$$unsubscribe_isMutatingResult = noop$1,
    		$$subscribe_isMutatingResult = () => ($$unsubscribe_isMutatingResult(), $$unsubscribe_isMutatingResult = subscribe(isMutatingResult, $$value => $$invalidate(3, $isMutatingResult = $$value)), isMutatingResult);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_isMutatingResult());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	
    	let { filters = undefined } = $$props;
    	let { isMutating = undefined } = $$props;

    	$$self.$$set = $$props => {
    		if ("filters" in $$props) $$invalidate(2, filters = $$props.filters);
    		if ("isMutating" in $$props) $$invalidate(0, isMutating = $$props.isMutating);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	let isMutatingResult;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*filters*/ 4) {
    			$$subscribe_isMutatingResult($$invalidate(1, isMutatingResult = useIsMutating(filters)));
    		}

    		if ($$self.$$.dirty & /*$isMutatingResult*/ 8) {
    			$$invalidate(0, isMutating = $isMutatingResult);
    		}
    	};

    	return [isMutating, isMutatingResult, filters, $isMutatingResult, $$scope, slots];
    }

    class IsMutating extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { filters: 2, isMutating: 0 });
    	}
    }

    /* eslint-disable no-shadow */
    function useMutation(arg1, arg2, arg3) {
        const options = parseMutationArgs(arg1, arg2, arg3);
        const queryClient = useQueryClient();
        const observer = new MutationObserver(queryClient, options);
        const mutate = (variables, mutateOptions) => {
            observer.mutate(variables, mutateOptions).catch(noop);
        };
        const initialResult = observer.getCurrentResult();
        const initialMutationResult = Object.assign(Object.assign({}, initialResult), { mutate, mutateAsync: initialResult.mutate });
        const { subscribe } = readable(initialMutationResult, set => {
            return observer.subscribe(notifyManager.batchCalls((result) => {
                // Check if the component is still mounted
                if (observer.hasListeners()) {
                    set(Object.assign(Object.assign({}, result), { mutate, mutateAsync: result.mutate }));
                }
            }));
        });
        function setOptions(arg1, arg2, arg3) {
            if (observer.hasListeners()) {
                const newOptions = parseMutationArgs(arg1, arg2, arg3);
                observer.setOptions(newOptions);
            }
        }
        return { subscribe, setOptions };
    }

    /* src/mutation/Mutation.svelte generated by Svelte v3.31.0 */

    const get_mutation_slot_changes = dirty => ({
    	mutationResult: dirty & /*mutationResult*/ 1
    });

    const get_mutation_slot_context = ctx => ({
    	mutationResult: /*mutationResult*/ ctx[0]
    });

    function create_fragment$6(ctx) {
    	let current;
    	const mutation_slot_template = /*#slots*/ ctx[7].mutation;
    	const mutation_slot = create_slot(mutation_slot_template, ctx, /*$$scope*/ ctx[6], get_mutation_slot_context);

    	return {
    		c() {
    			if (mutation_slot) mutation_slot.c();
    		},
    		m(target, anchor) {
    			if (mutation_slot) {
    				mutation_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (mutation_slot) {
    				if (mutation_slot.p && dirty & /*$$scope, mutationResult*/ 65) {
    					update_slot(mutation_slot, mutation_slot_template, ctx, /*$$scope*/ ctx[6], dirty, get_mutation_slot_changes, get_mutation_slot_context);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(mutation_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(mutation_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (mutation_slot) mutation_slot.d(detaching);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $mutation;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	
    	
    	let { mutationFn } = $$props;
    	let { options = undefined } = $$props;
    	let { mutationResult = undefined } = $$props;
    	let firstRender = true;

    	onMount(() => {
    		$$invalidate(4, firstRender = false);
    	});

    	const mutation = useMutation(mutationFn, options);
    	component_subscribe($$self, mutation, value => $$invalidate(5, $mutation = value));

    	$$self.$$set = $$props => {
    		if ("mutationFn" in $$props) $$invalidate(2, mutationFn = $$props.mutationFn);
    		if ("options" in $$props) $$invalidate(3, options = $$props.options);
    		if ("mutationResult" in $$props) $$invalidate(0, mutationResult = $$props.mutationResult);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$mutation*/ 32) {
    			$$invalidate(0, mutationResult = $mutation);
    		}

    		if ($$self.$$.dirty & /*firstRender, mutationFn, options*/ 28) {
    			{
    				if (!firstRender) {
    					mutation.setOptions(mutationFn, options);
    				}
    			}
    		}
    	};

    	return [
    		mutationResult,
    		mutation,
    		mutationFn,
    		options,
    		firstRender,
    		$mutation,
    		$$scope,
    		slots
    	];
    }

    class Mutation$1 extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			mutationFn: 2,
    			options: 3,
    			mutationResult: 0
    		});
    	}
    }

    function useHydrate(state, options) {
        const client = useQueryClient();
        if (state) {
            hydrate(client, state, options);
        }
    }

    /* src/hydration/Hydrate.svelte generated by Svelte v3.31.0 */

    function create_fragment$7(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	
    	let { state } = $$props;
    	let { options = undefined } = $$props;
    	useHydrate(state, options);

    	$$self.$$set = $$props => {
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	return [state, options, $$scope, slots];
    }

    class Hydrate extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { state: 0, options: 1 });
    	}
    }

    exports.CancelledError = CancelledError;
    exports.Hydrate = Hydrate;
    exports.InfiniteQuery = InfiniteQuery;
    exports.InfiniteQueryObserver = InfiniteQueryObserver;
    exports.IsFetching = IsFetching;
    exports.IsMutating = IsMutating;
    exports.Mutation = Mutation$1;
    exports.MutationCache = MutationCache;
    exports.MutationObserver = MutationObserver;
    exports.Queries = Queries;
    exports.QueriesObserver = QueriesObserver;
    exports.Query = Query$1;
    exports.QueryCache = QueryCache;
    exports.QueryClient = QueryClient;
    exports.QueryClientProvider = QueryClientProvider;
    exports.QueryObserver = QueryObserver;
    exports.broadcastQueryClient = broadcastQueryClient;
    exports.createAsyncStoragePersistor = createAsyncStoragePersistor;
    exports.createWebStoragePersistor = createWebStoragePersistor;
    exports.dehydrate = dehydrate;
    exports.focusManager = focusManager;
    exports.hashQueryKey = hashQueryKey;
    exports.hydrate = hydrate;
    exports.isCancelledError = isCancelledError;
    exports.isError = isError;
    exports.notifyManager = notifyManager;
    exports.onlineManager = onlineManager;
    exports.persistQueryClient = persistQueryClient;
    exports.setLogger = setLogger;
    exports.useHydrate = useHydrate;
    exports.useInfiniteQuery = useInfiniteQuery;
    exports.useIsFetching = useIsFetching;
    exports.useIsMutating = useIsMutating;
    exports.useMutation = useMutation;
    exports.useQueries = useQueries;
    exports.useQuery = useQuery;
    exports.useQueryClient = useQueryClient;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
