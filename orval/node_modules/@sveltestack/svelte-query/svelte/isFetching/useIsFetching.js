import { readable } from 'svelte/store';
import { parseFilterArgs } from '../queryCore/core/utils';
import { notifyManager } from '../queryCore/core';
import { useQueryClient } from '../queryClientProvider';
export default function useIsFetching(arg1, arg2) {
    const [filters] = parseFilterArgs(arg1, arg2);
    const client = useQueryClient();
    const cache = client.getQueryCache();
    // isFetching is the prev value initialized on mount *
    let isFetching = client.isFetching(filters);
    const { subscribe } = readable(isFetching, set => {
        return cache.subscribe(notifyManager.batchCalls(() => {
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
