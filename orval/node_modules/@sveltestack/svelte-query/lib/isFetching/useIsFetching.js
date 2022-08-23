"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("svelte/store");
const utils_1 = require("../queryCore/core/utils");
const core_1 = require("../queryCore/core");
const queryClientProvider_1 = require("../queryClientProvider");
function useIsFetching(arg1, arg2) {
    const [filters] = utils_1.parseFilterArgs(arg1, arg2);
    const client = queryClientProvider_1.useQueryClient();
    const cache = client.getQueryCache();
    // isFetching is the prev value initialized on mount *
    let isFetching = client.isFetching(filters);
    const { subscribe } = store_1.readable(isFetching, set => {
        return cache.subscribe(core_1.notifyManager.batchCalls(() => {
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
exports.default = useIsFetching;
