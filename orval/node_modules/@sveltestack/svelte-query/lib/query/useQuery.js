"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-shadow */
const store_1 = require("svelte/store");
const core_1 = require("../queryCore/core");
const utils_1 = require("../queryCore/core/utils");
const queryClientProvider_1 = require("../queryClientProvider");
const utils_2 = require("../utils");
function useQuery(arg1, arg2, arg3) {
    const options = utils_1.parseQueryArgs(arg1, arg2, arg3);
    const client = queryClientProvider_1.useQueryClient();
    let defaultedOptions = client.defaultQueryObserverOptions(options);
    // Include callbacks in batch renders
    defaultedOptions = utils_2.setBatchCalls(defaultedOptions);
    const observer = new core_1.QueryObserver(client, defaultedOptions);
    const { subscribe } = store_1.readable(observer.getCurrentResult(), set => {
        return observer.subscribe(core_1.notifyManager.batchCalls(set));
    });
    // Update result to make sure we did not miss any query updates
    // between creating the observer and subscribing to it.
    observer.updateResult();
    function setOptions(arg1, arg2, arg3) {
        const options = utils_1.parseQueryArgs(arg1, arg2, arg3);
        let defaultedOptions = client.defaultQueryObserverOptions(options);
        // Include callbacks in batch renders
        defaultedOptions = utils_2.setBatchCalls(defaultedOptions);
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
exports.default = useQuery;
