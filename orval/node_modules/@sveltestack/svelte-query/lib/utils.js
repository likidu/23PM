"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setBatchCalls = void 0;
const queryCore_1 = require("./queryCore");
function setBatchCalls(options) {
    // Make sure results are optimistically set in fetching state before subscribing or updating options
    options.optimisticResults = true;
    if (options.onError) {
        options.onError = queryCore_1.notifyManager.batchCalls(options.onError);
    }
    if (options.onSuccess) {
        options.onSuccess = queryCore_1.notifyManager.batchCalls(options.onSuccess);
    }
    if (options.onSettled) {
        options.onSettled = queryCore_1.notifyManager.batchCalls(options.onSettled);
    }
    return options;
}
exports.setBatchCalls = setBatchCalls;
