"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-shadow */
const store_1 = require("svelte/store");
const utils_1 = require("../queryCore/core/utils");
const queryClientProvider_1 = require("../queryClientProvider");
const infiniteQueryObserver_1 = require("../queryCore/core/infiniteQueryObserver");
const core_1 = require("../queryCore/core");
const utils_2 = require("../utils");
function useInfiniteQuery(arg1, arg2, arg3) {
    const options = utils_1.parseQueryArgs(arg1, arg2, arg3);
    const client = queryClientProvider_1.useQueryClient();
    let defaultedOptions = client.defaultQueryObserverOptions(options);
    // Include callbacks in batch renders
    defaultedOptions = utils_2.setBatchCalls(defaultedOptions);
    const observer = new infiniteQueryObserver_1.InfiniteQueryObserver(client, defaultedOptions);
    const { subscribe } = store_1.readable(observer.getCurrentResult(), set => {
        return observer.subscribe(core_1.notifyManager.batchCalls(set));
    });
    // between creating the observer and subscribing to it.
    observer.updateResult();
    function setOptions(arg1, arg2, arg3) {
        if (observer.hasListeners()) {
            const options = utils_1.parseQueryArgs(arg1, arg2, arg3);
            let defaultedOptions = client.defaultQueryObserverOptions(options);
            // Include callbacks in batch renders
            defaultedOptions = utils_2.setBatchCalls(defaultedOptions);
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
exports.default = useInfiniteQuery;
