import './types';
import { hashQueryKeyByOptions, isServer, isValidTimeout, noop, replaceEqualDeep, shallowEqualObjects, timeUntilStale, } from './utils';
import { notifyManager } from './notifyManager';
import { focusManager } from './focusManager';
import { Subscribable } from './subscribable';
import { getLogger } from './logger';
import { isCancelledError } from './retryer';
export class QueryObserver extends Subscribable {
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
