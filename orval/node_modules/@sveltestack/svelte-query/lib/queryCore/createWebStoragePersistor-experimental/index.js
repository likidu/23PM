"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebStoragePersistor = void 0;
const utils_1 = require("../core/utils");
require("../persistQueryClient-experimental");
function createWebStoragePersistor({ storage, key = `SVELTE_QUERY_OFFLINE_CACHE`, throttleTime = 1000, serialize = JSON.stringify, deserialize = JSON.parse, }) {
    //try to save data to storage
    function trySave(persistedClient) {
        try {
            storage.setItem(key, serialize(persistedClient));
        }
        catch (_a) {
            return false;
        }
        return true;
    }
    if (typeof storage !== 'undefined') {
        return {
            persistClient: throttle(persistedClient => {
                if (trySave(persistedClient) !== true) {
                    const mutations = [...persistedClient.clientState.mutations];
                    const queries = [...persistedClient.clientState.queries];
                    const client = Object.assign(Object.assign({}, persistedClient), { clientState: { mutations, queries } });
                    // sort queries by dataUpdatedAt (oldest first)
                    const sortedQueries = [...queries].sort((a, b) => a.state.dataUpdatedAt - b.state.dataUpdatedAt);
                    // clean old queries and try to save
                    while (sortedQueries.length > 0) {
                        const oldestData = sortedQueries.shift();
                        client.clientState.queries = queries.filter(q => q !== oldestData);
                        if (trySave(client)) {
                            return; // save success
                        }
                    }
                    // clean mutations and try to save
                    while (mutations.shift()) {
                        if (trySave(client)) {
                            return; // save success
                        }
                    }
                }
            }, throttleTime),
            restoreClient: () => {
                const cacheString = storage.getItem(key);
                if (!cacheString) {
                    return;
                }
                return deserialize(cacheString);
            },
            removeClient: () => {
                storage.removeItem(key);
            },
        };
    }
    return {
        persistClient: utils_1.noop,
        restoreClient: utils_1.noop,
        removeClient: utils_1.noop,
    };
}
exports.createWebStoragePersistor = createWebStoragePersistor;
function throttle(func, wait = 100) {
    let timer = null;
    let params;
    return function (...args) {
        params = args;
        if (timer === null) {
            // @ts-ignore
            timer = setTimeout(() => {
                func(...params);
                timer = null;
            }, wait);
        }
    };
}
