import { getAbortController, functionalUpdate, isValidTimeout, noop, replaceEqualDeep, timeUntilStale, ensureQueryKeyArray, } from './utils';
import { notifyManager } from './notifyManager';
import { getLogger } from './logger';
import { Retryer, isCancelledError } from './retryer';
// CLASS
export class Query {
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
