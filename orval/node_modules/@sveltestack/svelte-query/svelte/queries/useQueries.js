import { readable } from 'svelte/store';
import { notifyManager, QueriesObserver } from "../queryCore/core";
import { useQueryClient } from "../queryClientProvider";
export default function useQueries(queries) {
    const client = useQueryClient();
    function getDefaultQuery(newQueries) {
        return newQueries.map(options => {
            const defaultedOptions = client.defaultQueryObserverOptions(options);
            // Make sure the results are already in fetching state before subscribing or updating options
            defaultedOptions.optimisticResults = true;
            return defaultedOptions;
        });
    }
    const defaultedQueries = getDefaultQuery(queries);
    const observer = new QueriesObserver(client, defaultedQueries);
    const { subscribe } = readable(observer.getCurrentResult(), (set) => {
        return observer.subscribe(notifyManager.batchCalls(set));
    });
    const setQueries = (newQueries) => {
        if (observer.hasListeners()) {
            const defaultedNewQueries = getDefaultQuery(newQueries);
            observer.setQueries(defaultedNewQueries, { listeners: false });
        }
    };
    return { subscribe, setQueries };
}
