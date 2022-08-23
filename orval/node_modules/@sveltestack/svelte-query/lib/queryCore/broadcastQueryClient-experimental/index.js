"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastQueryClient = void 0;
require("../core");
async function broadcastQueryClient({ queryClient, broadcastChannel = 'svelte-query', }) {
    const { BroadcastChannel } = await Promise.resolve().then(() => __importStar(require('broadcast-channel')));
    let transaction = false;
    const tx = (cb) => {
        transaction = true;
        cb();
        transaction = false;
    };
    const channel = new BroadcastChannel(broadcastChannel, {
        webWorkerSupport: false,
    });
    const queryCache = queryClient.getQueryCache();
    queryClient.getQueryCache().subscribe(queryEvent => {
        var _a;
        if (transaction || !(queryEvent === null || queryEvent === void 0 ? void 0 : queryEvent.query)) {
            return;
        }
        const { query: { queryHash, queryKey, state }, } = queryEvent;
        if (queryEvent.type === 'queryUpdated' &&
            ((_a = queryEvent.action) === null || _a === void 0 ? void 0 : _a.type) === 'success') {
            channel.postMessage({
                type: 'queryUpdated',
                queryHash,
                queryKey,
                state,
            });
        }
        if (queryEvent.type === 'queryRemoved') {
            channel.postMessage({
                type: 'queryRemoved',
                queryHash,
                queryKey,
            });
        }
    });
    channel.onmessage = action => {
        if (!(action === null || action === void 0 ? void 0 : action.type)) {
            return;
        }
        tx(() => {
            const { type, queryHash, queryKey, state } = action;
            if (type === 'queryUpdated') {
                const query = queryCache.get(queryHash);
                if (query) {
                    query.setState(state);
                    return;
                }
                queryCache.build(queryClient, {
                    queryKey,
                    queryHash,
                }, state);
            }
            else if (type === 'queryRemoved') {
                const query = queryCache.get(queryHash);
                if (query) {
                    queryCache.remove(query);
                }
            }
        });
    };
}
exports.broadcastQueryClient = broadcastQueryClient;
