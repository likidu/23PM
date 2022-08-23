"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryClient = void 0;
const utils_1 = require("./utils");
const queryCache_1 = require("./queryCache");
const mutationCache_1 = require("./mutationCache");
const focusManager_1 = require("./focusManager");
const onlineManager_1 = require("./onlineManager");
const notifyManager_1 = require("./notifyManager");
const infiniteQueryBehavior_1 = require("./infiniteQueryBehavior");
require("./types");
// CLASS
class QueryClient {
    constructor(config = {}) {
        this.queryCache = config.queryCache || new queryCache_1.QueryCache();
        this.mutationCache = config.mutationCache || new mutationCache_1.MutationCache();
        this.defaultOptions = config.defaultOptions || {};
        this.queryDefaults = [];
        this.mutationDefaults = [];
    }
    mount() {
        this.unsubscribeFocus = focusManager_1.focusManager.subscribe(() => {
            if (focusManager_1.focusManager.isFocused() && onlineManager_1.onlineManager.isOnline()) {
                this.mutationCache.onFocus();
                this.queryCache.onFocus();
            }
        });
        this.unsubscribeOnline = onlineManager_1.onlineManager.subscribe(() => {
            if (focusManager_1.focusManager.isFocused() && onlineManager_1.onlineManager.isOnline()) {
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
        const [filters] = utils_1.parseFilterArgs(arg1, arg2);
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
        const parsedOptions = utils_1.parseQueryArgs(queryKey);
        const defaultedOptions = this.defaultQueryOptions(parsedOptions);
        return this.queryCache
            .build(this, defaultedOptions)
            .setData(updater, options);
    }
    setQueriesData(queryKeyOrFilters, updater, options) {
        return notifyManager_1.notifyManager.batch(() => this.getQueryCache()
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
        const [filters] = utils_1.parseFilterArgs(arg1, arg2);
        const queryCache = this.queryCache;
        notifyManager_1.notifyManager.batch(() => {
            queryCache.findAll(filters).forEach(query => {
                queryCache.remove(query);
            });
        });
    }
    resetQueries(arg1, arg2, arg3) {
        const [filters, options] = utils_1.parseFilterArgs(arg1, arg2, arg3);
        const queryCache = this.queryCache;
        const refetchFilters = Object.assign(Object.assign({}, filters), { active: true });
        return notifyManager_1.notifyManager.batch(() => {
            queryCache.findAll(filters).forEach(query => {
                query.reset();
            });
            return this.refetchQueries(refetchFilters, options);
        });
    }
    cancelQueries(arg1, arg2, arg3) {
        const [filters, cancelOptions = {}] = utils_1.parseFilterArgs(arg1, arg2, arg3);
        if (typeof cancelOptions.revert === 'undefined') {
            cancelOptions.revert = true;
        }
        const promises = notifyManager_1.notifyManager.batch(() => this.queryCache.findAll(filters).map(query => query.cancel(cancelOptions)));
        return Promise.all(promises).then(utils_1.noop).catch(utils_1.noop);
    }
    invalidateQueries(arg1, arg2, arg3) {
        var _a, _b, _c;
        const [filters, options] = utils_1.parseFilterArgs(arg1, arg2, arg3);
        const refetchFilters = Object.assign(Object.assign({}, filters), { 
            // if filters.refetchActive is not provided and filters.active is explicitly false,
            // e.g. invalidateQueries({ active: false }), we don't want to refetch active queries
            active: (_b = (_a = filters.refetchActive) !== null && _a !== void 0 ? _a : filters.active) !== null && _b !== void 0 ? _b : true, inactive: (_c = filters.refetchInactive) !== null && _c !== void 0 ? _c : false });
        return notifyManager_1.notifyManager.batch(() => {
            this.queryCache.findAll(filters).forEach(query => {
                query.invalidate();
            });
            return this.refetchQueries(refetchFilters, options);
        });
    }
    refetchQueries(arg1, arg2, arg3) {
        const [filters, options] = utils_1.parseFilterArgs(arg1, arg2, arg3);
        const promises = notifyManager_1.notifyManager.batch(() => this.queryCache.findAll(filters).map(query => query.fetch(undefined, Object.assign(Object.assign({}, options), { meta: { refetchPage: filters === null || filters === void 0 ? void 0 : filters.refetchPage } }))));
        let promise = Promise.all(promises).then(utils_1.noop);
        if (!(options === null || options === void 0 ? void 0 : options.throwOnError)) {
            promise = promise.catch(utils_1.noop);
        }
        return promise;
    }
    fetchQuery(arg1, arg2, arg3) {
        const parsedOptions = utils_1.parseQueryArgs(arg1, arg2, arg3);
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
            .then(utils_1.noop)
            .catch(utils_1.noop);
    }
    fetchInfiniteQuery(arg1, arg2, arg3) {
        const parsedOptions = utils_1.parseQueryArgs(arg1, arg2, arg3);
        parsedOptions.behavior = infiniteQueryBehavior_1.infiniteQueryBehavior();
        return this.fetchQuery(parsedOptions);
    }
    prefetchInfiniteQuery(arg1, arg2, arg3) {
        return this.fetchInfiniteQuery(arg1, arg2, arg3)
            .then(utils_1.noop)
            .catch(utils_1.noop);
    }
    cancelMutations() {
        const promises = notifyManager_1.notifyManager.batch(() => this.mutationCache.getAll().map(mutation => mutation.cancel()));
        return Promise.all(promises).then(utils_1.noop).catch(utils_1.noop);
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
        const result = this.queryDefaults.find(x => utils_1.hashQueryKey(queryKey) === utils_1.hashQueryKey(x.queryKey));
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
            ? (_a = this.queryDefaults.find(x => utils_1.partialMatchKey(queryKey, x.queryKey))) === null || _a === void 0 ? void 0 : _a.defaultOptions : undefined;
    }
    setMutationDefaults(mutationKey, options) {
        const result = this.mutationDefaults.find(x => utils_1.hashQueryKey(mutationKey) === utils_1.hashQueryKey(x.mutationKey));
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
            ? (_a = this.mutationDefaults.find(x => utils_1.partialMatchKey(mutationKey, x.mutationKey))) === null || _a === void 0 ? void 0 : _a.defaultOptions : undefined;
    }
    defaultQueryOptions(options) {
        if (options === null || options === void 0 ? void 0 : options._defaulted) {
            return options;
        }
        const defaultedOptions = Object.assign(Object.assign(Object.assign(Object.assign({}, this.defaultOptions.queries), this.getQueryDefaults(options === null || options === void 0 ? void 0 : options.queryKey)), options), { _defaulted: true });
        if (!defaultedOptions.queryHash && defaultedOptions.queryKey) {
            defaultedOptions.queryHash = utils_1.hashQueryKeyByOptions(defaultedOptions.queryKey, defaultedOptions);
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
exports.QueryClient = QueryClient;
