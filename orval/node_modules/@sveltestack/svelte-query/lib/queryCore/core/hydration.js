"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hydrate = exports.dehydrate = void 0;
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
exports.dehydrate = dehydrate;
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
exports.hydrate = hydrate;
