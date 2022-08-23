"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("svelte/store");
const core_1 = require("../queryCore/core");
const queryClientProvider_1 = require("../queryClientProvider");
function useIsMutating(filters) {
    const client = queryClientProvider_1.useQueryClient();
    const cache = client.getMutationCache();
    // isMutating is the prev value initialized on mount *
    let isMutating = client.isMutating(filters);
    const { subscribe } = store_1.readable(isMutating, set => {
        return cache.subscribe(core_1.notifyManager.batchCalls(() => {
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
exports.default = useIsMutating;
