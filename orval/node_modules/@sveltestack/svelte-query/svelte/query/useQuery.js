/* eslint-disable no-shadow */
import { readable } from 'svelte/store';
import { notifyManager, QueryObserver } from '../queryCore/core';
import { parseQueryArgs } from '../queryCore/core/utils';
import { useQueryClient } from '../queryClientProvider';
import { setBatchCalls } from '../utils';
export default function useQuery(arg1, arg2, arg3) {
    const options = parseQueryArgs(arg1, arg2, arg3);
    const client = useQueryClient();
    let defaultedOptions = client.defaultQueryObserverOptions(options);
    // Include callbacks in batch renders
    defaultedOptions = setBatchCalls(defaultedOptions);
    const observer = new QueryObserver(client, defaultedOptions);
    const { subscribe } = readable(observer.getCurrentResult(), set => {
        return observer.subscribe(notifyManager.batchCalls(set));
    });
    // Update result to make sure we did not miss any query updates
    // between creating the observer and subscribing to it.
    observer.updateResult();
    function setOptions(arg1, arg2, arg3) {
        const options = parseQueryArgs(arg1, arg2, arg3);
        let defaultedOptions = client.defaultQueryObserverOptions(options);
        // Include callbacks in batch renders
        defaultedOptions = setBatchCalls(defaultedOptions);
        if (observer.hasListeners()) {
            observer.setOptions(defaultedOptions, { listeners: false });
        }
    }
    function updateOptions(options) {
        observer.updateOptions(options);
    }
    function setEnabled(enabled) {
        updateOptions({ enabled });
    }
    return { subscribe, setOptions, updateOptions, setEnabled };
}
