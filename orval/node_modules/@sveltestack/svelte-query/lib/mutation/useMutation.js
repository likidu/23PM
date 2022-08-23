"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-shadow */
const store_1 = require("svelte/store");
const queryClientProvider_1 = require("../queryClientProvider");
const utils_1 = require("../queryCore/core/utils");
const mutationObserver_1 = require("../queryCore/core/mutationObserver");
require("../queryCore/core/types");
const queryCore_1 = require("../queryCore");
function useMutation(arg1, arg2, arg3) {
    const options = utils_1.parseMutationArgs(arg1, arg2, arg3);
    const queryClient = queryClientProvider_1.useQueryClient();
    const observer = new mutationObserver_1.MutationObserver(queryClient, options);
    const mutate = (variables, mutateOptions) => {
        observer.mutate(variables, mutateOptions).catch(utils_1.noop);
    };
    const initialResult = observer.getCurrentResult();
    const initialMutationResult = Object.assign(Object.assign({}, initialResult), { mutate, mutateAsync: initialResult.mutate });
    const { subscribe } = store_1.readable(initialMutationResult, set => {
        return observer.subscribe(queryCore_1.notifyManager.batchCalls((result) => {
            // Check if the component is still mounted
            if (observer.hasListeners()) {
                set(Object.assign(Object.assign({}, result), { mutate, mutateAsync: result.mutate }));
            }
        }));
    });
    function setOptions(arg1, arg2, arg3) {
        if (observer.hasListeners()) {
            const newOptions = utils_1.parseMutationArgs(arg1, arg2, arg3);
            observer.setOptions(newOptions);
        }
    }
    return { subscribe, setOptions };
}
exports.default = useMutation;
