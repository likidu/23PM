"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutationObserver = void 0;
const mutation_1 = require("./mutation");
const notifyManager_1 = require("./notifyManager");
const subscribable_1 = require("./subscribable");
// CLASS
class MutationObserver extends subscribable_1.Subscribable {
    constructor(client, options) {
        super();
        this.client = client;
        this.setOptions(options);
        this.bindMethods();
        this.updateResult();
    }
    bindMethods() {
        this.mutate = this.mutate.bind(this);
        this.reset = this.reset.bind(this);
    }
    setOptions(options) {
        this.options = this.client.defaultMutationOptions(options);
    }
    onUnsubscribe() {
        var _a;
        if (!this.listeners.length) {
            (_a = this.currentMutation) === null || _a === void 0 ? void 0 : _a.removeObserver(this);
        }
    }
    onMutationUpdate(action) {
        this.updateResult();
        // Determine which callbacks to trigger
        const notifyOptions = {
            listeners: true,
        };
        if (action.type === 'success') {
            notifyOptions.onSuccess = true;
        }
        else if (action.type === 'error') {
            notifyOptions.onError = true;
        }
        this.notify(notifyOptions);
    }
    getCurrentResult() {
        return this.currentResult;
    }
    reset() {
        this.currentMutation = undefined;
        this.updateResult();
        this.notify({ listeners: true });
    }
    mutate(variables, options) {
        this.mutateOptions = options;
        if (this.currentMutation) {
            this.currentMutation.removeObserver(this);
        }
        this.currentMutation = this.client.getMutationCache().build(this.client, Object.assign(Object.assign({}, this.options), { variables: typeof variables !== 'undefined' ? variables : this.options.variables }));
        this.currentMutation.addObserver(this);
        return this.currentMutation.execute();
    }
    updateResult() {
        const state = this.currentMutation
            ? this.currentMutation.state
            : mutation_1.getDefaultState();
        const result = Object.assign(Object.assign({}, state), { isLoading: state.status === 'loading', isSuccess: state.status === 'success', isError: state.status === 'error', isIdle: state.status === 'idle', mutate: this.mutate, reset: this.reset });
        this.currentResult = result;
    }
    notify(options) {
        notifyManager_1.notifyManager.batch(() => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            // First trigger the mutate callbacks
            if (this.mutateOptions) {
                if (options.onSuccess) {
                    (_b = (_a = this.mutateOptions).onSuccess) === null || _b === void 0 ? void 0 : _b.call(_a, this.currentResult.data, this.currentResult.variables, this.currentResult.context);
                    (_d = (_c = this.mutateOptions).onSettled) === null || _d === void 0 ? void 0 : _d.call(_c, this.currentResult.data, null, this.currentResult.variables, this.currentResult.context);
                }
                else if (options.onError) {
                    (_f = (_e = this.mutateOptions).onError) === null || _f === void 0 ? void 0 : _f.call(_e, this.currentResult.error, this.currentResult.variables, this.currentResult.context);
                    (_h = (_g = this.mutateOptions).onSettled) === null || _h === void 0 ? void 0 : _h.call(_g, undefined, this.currentResult.error, this.currentResult.variables, this.currentResult.context);
                }
            }
            // Then trigger the listeners
            if (options.listeners) {
                this.listeners.forEach(listener => {
                    listener(this.currentResult);
                });
            }
        });
    }
}
exports.MutationObserver = MutationObserver;
