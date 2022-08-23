import { hashQueryKey, noop, parseFilterArgs, parseQueryArgs, partialMatchKey, hashQueryKeyByOptions, } from './utils';
import { QueryCache } from './queryCache';
import { MutationCache } from './mutationCache';
import { focusManager } from './focusManager';
import { onlineManager } from './onlineManager';
import { notifyManager } from './notifyManager';
import { infiniteQueryBehavior } from './infiniteQueryBehavior';
import './types';
// CLASS
export class QueryClient {
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
