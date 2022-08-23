import '../core';
export async function broadcastQueryClient({ queryClient, broadcastChannel = 'svelte-query', }) {
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
