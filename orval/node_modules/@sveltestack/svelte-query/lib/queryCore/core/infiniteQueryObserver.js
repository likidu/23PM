"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfiniteQueryObserver = void 0;
const queryObserver_1 = require("./queryObserver");
const infiniteQueryBehavior_1 = require("./infiniteQueryBehavior");
require("./query");
class InfiniteQueryObserver extends queryObserver_1.QueryObserver {
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
        super.setOptions(Object.assign(Object.assign({}, options), { behavior: infiniteQueryBehavior_1.infiniteQueryBehavior() }), notifyOptions);
    }
    getOptimisticResult(options) {
        options.behavior = infiniteQueryBehavior_1.infiniteQueryBehavior();
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
        return Object.assign(Object.assign({}, result), { fetchNextPage: this.fetchNextPage, fetchPreviousPage: this.fetchPreviousPage, hasNextPage: infiniteQueryBehavior_1.hasNextPage(options, (_a = state.data) === null || _a === void 0 ? void 0 : _a.pages), hasPreviousPage: infiniteQueryBehavior_1.hasPreviousPage(options, (_b = state.data) === null || _b === void 0 ? void 0 : _b.pages), isFetchingNextPage: state.isFetching && ((_d = (_c = state.fetchMeta) === null || _c === void 0 ? void 0 : _c.fetchMore) === null || _d === void 0 ? void 0 : _d.direction) === 'forward', isFetchingPreviousPage: state.isFetching &&
                ((_f = (_e = state.fetchMeta) === null || _e === void 0 ? void 0 : _e.fetchMore) === null || _f === void 0 ? void 0 : _f.direction) === 'backward' });
    }
}
exports.InfiniteQueryObserver = InfiniteQueryObserver;
