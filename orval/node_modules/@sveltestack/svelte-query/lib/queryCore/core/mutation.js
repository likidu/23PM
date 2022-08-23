"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultState = exports.Mutation = void 0;
const logger_1 = require("./logger");
const notifyManager_1 = require("./notifyManager");
const retryer_1 = require("./retryer");
const utils_1 = require("./utils");
// CLASS
class Mutation {
    constructor(config) {
        this.options = Object.assign(Object.assign({}, config.defaultOptions), config.options);
        this.mutationId = config.mutationId;
        this.mutationCache = config.mutationCache;
        this.observers = [];
        this.state = config.state || getDefaultState();
        this.meta = config.meta;
    }
    setState(state) {
        this.dispatch({ type: 'setState', state });
    }
    addObserver(observer) {
        if (this.observers.indexOf(observer) === -1) {
            this.observers.push(observer);
        }
    }
    removeObserver(observer) {
        this.observers = this.observers.filter(x => x !== observer);
    }
    cancel() {
        if (this.retryer) {
            this.retryer.cancel();
            return this.retryer.promise.then(utils_1.noop).catch(utils_1.noop);
        }
        return Promise.resolve();
    }
    continue() {
        if (this.retryer) {
            this.retryer.continue();
            return this.retryer.promise;
        }
        return this.execute();
    }
    execute() {
        let data;
        const restored = this.state.status === 'loading';
        let promise = Promise.resolve();
        if (!restored) {
            this.dispatch({ type: 'loading', variables: this.options.variables });
            promise = promise
                .then(() => {
                var _a, _b;
                // Notify cache callback
                (_b = (_a = this.mutationCache.config).onMutate) === null || _b === void 0 ? void 0 : _b.call(_a, this.state.variables, this);
            })
                .then(() => { var _a, _b; return (_b = (_a = this.options).onMutate) === null || _b === void 0 ? void 0 : _b.call(_a, this.state.variables); })
                .then(context => {
                if (context !== this.state.context) {
                    this.dispatch({
                        type: 'loading',
                        context,
                        variables: this.state.variables,
                    });
                }
            });
        }
        return promise
            .then(() => this.executeMutation())
            .then(result => {
            var _a, _b;
            data = result;
            // Notify cache callback
            (_b = (_a = this.mutationCache.config).onSuccess) === null || _b === void 0 ? void 0 : _b.call(_a, data, this.state.variables, this.state.context, this);
        })
            .then(() => { var _a, _b; return (_b = (_a = this.options).onSuccess) === null || _b === void 0 ? void 0 : _b.call(_a, data, this.state.variables, this.state.context); })
            .then(() => { var _a, _b; return (_b = (_a = this.options).onSettled) === null || _b === void 0 ? void 0 : _b.call(_a, data, null, this.state.variables, this.state.context); })
            .then(() => {
            this.dispatch({ type: 'success', data });
            return data;
        })
            .catch(error => {
            var _a, _b;
            // Notify cache callback
            (_b = (_a = this.mutationCache.config).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error, this.state.variables, this.state.context, this);
            // Log error
            logger_1.getLogger().error(error);
            return Promise.resolve()
                .then(() => { var _a, _b; return (_b = (_a = this.options).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error, this.state.variables, this.state.context); })
                .then(() => { var _a, _b; return (_b = (_a = this.options).onSettled) === null || _b === void 0 ? void 0 : _b.call(_a, undefined, error, this.state.variables, this.state.context); })
                .then(() => {
                this.dispatch({ type: 'error', error });
                throw error;
            });
        });
    }
    executeMutation() {
        var _a;
        this.retryer = new retryer_1.Retryer({
            fn: () => {
                if (!this.options.mutationFn) {
                    return Promise.reject('No mutationFn found');
                }
                return this.options.mutationFn(this.state.variables);
            },
            onFail: () => {
                this.dispatch({ type: 'failed' });
            },
            onPause: () => {
                this.dispatch({ type: 'pause' });
            },
            onContinue: () => {
                this.dispatch({ type: 'continue' });
            },
            retry: (_a = this.options.retry) !== null && _a !== void 0 ? _a : 0,
            retryDelay: this.options.retryDelay,
        });
        return this.retryer.promise;
    }
    dispatch(action) {
        this.state = reducer(this.state, action);
        notifyManager_1.notifyManager.batch(() => {
            this.observers.forEach(observer => {
                observer.onMutationUpdate(action);
            });
            this.mutationCache.notify(this);
        });
    }
}
exports.Mutation = Mutation;
function getDefaultState() {
    return {
        context: undefined,
        data: undefined,
        error: null,
        failureCount: 0,
        isPaused: false,
        status: 'idle',
        variables: undefined,
    };
}
exports.getDefaultState = getDefaultState;
function reducer(state, action) {
    switch (action.type) {
        case 'failed':
            return Object.assign(Object.assign({}, state), { failureCount: state.failureCount + 1 });
        case 'pause':
            return Object.assign(Object.assign({}, state), { isPaused: true });
        case 'continue':
            return Object.assign(Object.assign({}, state), { isPaused: false });
        case 'loading':
            return Object.assign(Object.assign({}, state), { context: action.context, data: undefined, error: null, isPaused: false, status: 'loading', variables: action.variables });
        case 'success':
            return Object.assign(Object.assign({}, state), { data: action.data, error: null, status: 'success', isPaused: false });
        case 'error':
            return Object.assign(Object.assign({}, state), { data: undefined, error: action.error, failureCount: state.failureCount + 1, isPaused: false, status: 'error' });
        case 'setState':
            return Object.assign(Object.assign({}, state), action.state);
        default:
            return state;
    }
}
