"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("svelte/store");
const core_1 = require("../queryCore/core");
const queryClientProvider_1 = require("../queryClientProvider");
function useQueries(queries) {
    const client = queryClientProvider_1.useQueryClient();
    function getDefaultQuery(newQueries) {
        return newQueries.map(options => {
            const defaultedOptions = client.defaultQueryObserverOptions(options);
            // Make sure the results are already in fetching state before subscribing or updating options
            defaultedOptions.optimisticResults = true;
            return defaultedOptions;
        });
    }
    const defaultedQueries = getDefaultQuery(queries);
    const observer = new core_1.QueriesObserver(client, defaultedQueries);
    const { subscribe } = store_1.readable(observer.getCurrentResult(), (set) => {
        return observer.subscribe(core_1.notifyManager.batchCalls(set));
    });
    const setQueries = (newQueries) => {
        if (observer.hasListeners()) {
            const defaultedNewQueries = getDefaultQuery(newQueries);
            observer.setQueries(defaultedNewQueries, { listeners: false });
        }
    };
    return { subscribe, setQueries };
}
exports.default = useQueries;
