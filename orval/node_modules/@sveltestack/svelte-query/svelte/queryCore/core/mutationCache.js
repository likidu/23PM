import { notifyManager } from './notifyManager';
import { Mutation } from './mutation';
import { matchMutation, noop } from './utils';
import { Subscribable } from './subscribable';
// CLASS
export class MutationCache extends Subscribable {
    constructor(config) {
        super();
        this.config = config || {};
        this.mutations = [];
        this.mutationId = 0;
    }
    build(client, options, state) {
        const mutation = new Mutation({
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
        notifyManager.batch(() => {
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
        return this.mutations.find(mutation => matchMutation(filters, mutation));
    }
    findAll(filters) {
        return this.mutations.filter(mutation => matchMutation(filters, mutation));
    }
    notify(mutation) {
        notifyManager.batch(() => {
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
        return notifyManager.batch(() => pausedMutations.reduce((promise, mutation) => promise.then(() => mutation.continue().catch(noop)), Promise.resolve()));
    }
}
