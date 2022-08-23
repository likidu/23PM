"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPreviousPage = exports.hasNextPage = exports.getPreviousPageParam = exports.getNextPageParam = exports.infiniteQueryBehavior = void 0;
const retryer_1 = require("./retryer");
const utils_1 = require("./utils");
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
                const abortController = utils_1.getAbortController();
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
                    if (retryer_1.isCancelable(queryFnResult)) {
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
                    if (retryer_1.isCancelable(promise)) {
                        promise.cancel();
                    }
                };
                return finalPromise;
            };
        },
    };
}
exports.infiniteQueryBehavior = infiniteQueryBehavior;
function getNextPageParam(options, pages) {
    var _a;
    return (_a = options.getNextPageParam) === null || _a === void 0 ? void 0 : _a.call(options, pages[pages.length - 1], pages);
}
exports.getNextPageParam = getNextPageParam;
function getPreviousPageParam(options, pages) {
    var _a;
    return (_a = options.getPreviousPageParam) === null || _a === void 0 ? void 0 : _a.call(options, pages[0], pages);
}
exports.getPreviousPageParam = getPreviousPageParam;
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
exports.hasNextPage = hasNextPage;
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
exports.hasPreviousPage = hasPreviousPage;
