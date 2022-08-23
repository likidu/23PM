"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryCache = void 0;
const utils_1 = require("./utils");
const query_1 = require("./query");
const notifyManager_1 = require("./notifyManager");
const subscribable_1 = require("./subscribable");
require("./queryObserver");
// CLASS
class QueryCache extends subscribable_1.Subscribable {
    constructor(config) {
        super();
        this.config = config || {};
        this.queries = [];
        this.queriesMap = {};
    }
    build(client, options, state) {
        var _a;
        const queryKey = options.queryKey;
        const queryHash = (_a = options.queryHash) !== null && _a !== void 0 ? _a : utils_1.hashQueryKeyByOptions(queryKey, options);
        let query = this.get(queryHash);
        if (!query) {
            query = new query_1.Query({
                cache: this,
                queryKey,
                queryHash,
                options: client.defaultQueryOptions(options),
                state,
                defaultOptions: client.getQueryDefaults(queryKey),
                meta: options.meta,
            });
            this.add(query);
        }
        return query;
    }
    add(query) {
        if (!this.queriesMap[query.queryHash]) {
            this.queriesMap[query.queryHash] = query;
            this.queries.push(query);
            this.notify({
                type: 'queryAdded',
                query,
            });
        }
    }
    remove(query) {
        const queryInMap = this.queriesMap[query.queryHash];
        if (queryInMap) {
            query.destroy();
            this.queries = this.queries.filter(x => x !== query);
            if (queryInMap === query) {
                delete this.queriesMap[query.queryHash];
            }
            this.notify({ type: 'queryRemoved', query });
        }
    }
    clear() {
        notifyManager_1.notifyManager.batch(() => {
            this.queries.forEach(query => {
                this.remove(query);
            });
        });
    }
    get(queryHash) {
        return this.queriesMap[queryHash];
    }
    getAll() {
        return this.queries;
    }
    find(arg1, arg2) {
        const [filters] = utils_1.parseFilterArgs(arg1, arg2);
        if (typeof filters.exact === 'undefined') {
            filters.exact = true;
        }
        return this.queries.find(query => utils_1.matchQuery(filters, query));
    }
    findAll(arg1, arg2) {
        const [filters] = utils_1.parseFilterArgs(arg1, arg2);
        return Object.keys(filters).length > 0
            ? this.queries.filter(query => utils_1.matchQuery(filters, query))
            : this.queries;
    }
    notify(event) {
        notifyManager_1.notifyManager.batch(() => {
            this.listeners.forEach(listener => {
                listener(event);
            });
        });
    }
    onFocus() {
        notifyManager_1.notifyManager.batch(() => {
            this.queries.forEach(query => {
                query.onFocus();
            });
        });
    }
    onOnline() {
        notifyManager_1.notifyManager.batch(() => {
            this.queries.forEach(query => {
                query.onOnline();
            });
        });
    }
}
exports.QueryCache = QueryCache;
