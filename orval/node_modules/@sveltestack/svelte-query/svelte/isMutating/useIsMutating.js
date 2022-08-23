import { readable } from 'svelte/store';
import { notifyManager } from '../queryCore/core';
import { useQueryClient } from '../queryClientProvider';
export default function useIsMutating(filters) {
    const client = useQueryClient();
    const cache = client.getMutationCache();
    // isMutating is the prev value initialized on mount *
    let isMutating = client.isMutating(filters);
    const { subscribe } = readable(isMutating, set => {
        return cache.subscribe(notifyManager.batchCalls(() => {
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
