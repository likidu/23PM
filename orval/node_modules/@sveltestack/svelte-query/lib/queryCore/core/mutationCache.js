"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutationCache = void 0;
const notifyManager_1 = require("./notifyManager");
const mutation_1 = require("./mutation");
const utils_1 = require("./utils");
const subscribable_1 = require("./subscribable");
// CLASS
class MutationCache extends subscribable_1.Subscribable {
    constructor(config) {
        super();
        this.config = config || {};
        this.mutations = [];
        this.mutationId = 0;
    }
    build(client, options, state) {
        const mutation = new mutation_1.Mutation({
            mutationCache: this,
            mutationId: ++this.mutationId,
            options: client.defaultMutationOptions(options),
            state,
            defaultOptions: options.mutationKey
                ? client.getMutationDefaults(options.mutationKey)
                : undefined,
            meta: options.meta,
        });
        this.add(mutation);
        return mutation;
    }
    add(mutation) {
        this.mutations.push(mutation);
        this.notify(mutation);
    }
    remove(mutation) {
        this.mutations = this.mutations.filter(x => x !== mutation);
        mutation.cancel();
        this.notify(mutation);
    }
    clear() {
        notifyManager_1.notifyManager.batch(() => {
            this.mutations.forEach(mutation => {
                this.remove(mutation);
            });
        });
    }
    getAll() {
        return this.mutations;
    }
    find(filters) {
        if (typeof filters.exact === 'undefined') {
            filters.exact = true;
        }
        return this.mutations.find(mutation => utils_1.matchMutation(filters, mutation));
    }
    findAll(filters) {
        return this.mutations.filter(mutation => utils_1.matchMutation(filters, mutation));
    }
    notify(mutation) {
        notifyManager_1.notifyManager.batch(() => {
            this.listeners.forEach(listener => {
                listener(mutation);
            });
        });
    }
    onFocus() {
        this.resumePausedMutations();
    }
    onOnline() {
        this.resumePausedMutations();
    }
    resumePausedMutations() {
        const pausedMutations = this.mutations.filter(x => x.state.isPaused);
        return notifyManager_1.notifyManager.batch(() => pausedMutations.reduce((promise, mutation) => promise.then(() => mutation.continue().catch(utils_1.noop)), Promise.resolve()));
    }
}
exports.MutationCache = MutationCache;
