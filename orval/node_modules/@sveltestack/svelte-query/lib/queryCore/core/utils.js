"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbortController = exports.scheduleMicrotask = exports.sleep = exports.isError = exports.isQueryKey = exports.isPlainObject = exports.shallowEqualObjects = exports.replaceEqualDeep = exports.partialDeepEqual = exports.partialMatchKey = exports.stableValueHash = exports.hashQueryKey = exports.hashQueryKeyByOptions = exports.matchMutation = exports.matchQuery = exports.mapQueryStatusFilter = exports.parseMutationFilterArgs = exports.parseFilterArgs = exports.parseMutationArgs = exports.parseQueryArgs = exports.timeUntilStale = exports.replaceAt = exports.difference = exports.ensureQueryKeyArray = exports.isValidTimeout = exports.functionalUpdate = exports.noop = exports.isServer = void 0;
require("./types");
// UTILS
exports.isServer = typeof window === 'undefined';
function noop() {
    return undefined;
}
exports.noop = noop;
function functionalUpdate(updater, input) {
    return typeof updater === 'function'
        ? updater(input)
        : updater;
}
exports.functionalUpdate = functionalUpdate;
function isValidTimeout(value) {
    return typeof value === 'number' && value >= 0 && value !== Infinity;
}
exports.isValidTimeout = isValidTimeout;
function ensureQueryKeyArray(value) {
    return (Array.isArray(value)
        ? value
        : [value]);
}
exports.ensureQueryKeyArray = ensureQueryKeyArray;
function difference(array1, array2) {
    return array1.filter(x => array2.indexOf(x) === -1);
}
exports.difference = difference;
function replaceAt(array, index, value) {
    const copy = array.slice(0);
    copy[index] = value;
    return copy;
}
exports.replaceAt = replaceAt;
function timeUntilStale(updatedAt, staleTime) {
    return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0);
}
exports.timeUntilStale = timeUntilStale;
function parseQueryArgs(arg1, arg2, arg3) {
    if (!isQueryKey(arg1)) {
        return arg1;
    }
    if (typeof arg2 === 'function') {
        return Object.assign(Object.assign({}, arg3), { queryKey: arg1, queryFn: arg2 });
    }
    return Object.assign(Object.assign({}, arg2), { queryKey: arg1 });
}
exports.parseQueryArgs = parseQueryArgs;
function parseMutationArgs(arg1, arg2, arg3) {
    if (isQueryKey(arg1)) {
        if (typeof arg2 === 'function') {
            return Object.assign(Object.assign({}, arg3), { mutationKey: arg1, mutationFn: arg2 });
        }
        return Object.assign(Object.assign({}, arg2), { mutationKey: arg1 });
    }
    if (typeof arg1 === 'function') {
        return Object.assign(Object.assign({}, arg2), { mutationFn: arg1 });
    }
    return Object.assign({}, arg1);
}
exports.parseMutationArgs = parseMutationArgs;
function parseFilterArgs(arg1, arg2, arg3) {
    return (isQueryKey(arg1)
        ? [Object.assign(Object.assign({}, arg2), { queryKey: arg1 }), arg3]
        : [arg1 || {}, arg2]);
}
exports.parseFilterArgs = parseFilterArgs;
function parseMutationFilterArgs(arg1, arg2) {
    return isQueryKey(arg1) ? Object.assign(Object.assign({}, arg2), { mutationKey: arg1 }) : arg1;
}
exports.parseMutationFilterArgs = parseMutationFilterArgs;
function mapQueryStatusFilter(active, inactive) {
    if ((active === true && inactive === true) ||
        (active == null && inactive == null)) {
        return 'all';
    }
    else if (active === false && inactive === false) {
        return 'none';
    }
    else {
        // At this point, active|inactive can only be true|false or false|true
        // so, when only one value is provided, the missing one has to be the negated value
        const isActive = active !== null && active !== void 0 ? active : !inactive;
        return isActive ? 'active' : 'inactive';
    }
}
exports.mapQueryStatusFilter = mapQueryStatusFilter;
function matchQuery(filters, query) {
    const { active, exact, fetching, inactive, predicate, queryKey, stale, } = filters;
    if (isQueryKey(queryKey)) {
        if (exact) {
            if (query.queryHash !== hashQueryKeyByOptions(queryKey, query.options)) {
                return false;
            }
        }
        else if (!partialMatchKey(query.queryKey, queryKey)) {
            return false;
        }
    }
    const queryStatusFilter = mapQueryStatusFilter(active, inactive);
    if (queryStatusFilter === 'none') {
        return false;
    }
    else if (queryStatusFilter !== 'all') {
        const isActive = query.isActive();
        if (queryStatusFilter === 'active' && !isActive) {
            return false;
        }
        if (queryStatusFilter === 'inactive' && isActive) {
            return false;
        }
    }
    if (typeof stale === 'boolean' && query.isStale() !== stale) {
        return false;
    }
    if (typeof fetching === 'boolean' && query.isFetching() !== fetching) {
        return false;
    }
    if (predicate && !predicate(query)) {
        return false;
    }
    return true;
}
exports.matchQuery = matchQuery;
function matchMutation(filters, mutation) {
    const { exact, fetching, predicate, mutationKey } = filters;
    if (isQueryKey(mutationKey)) {
        if (!mutation.options.mutationKey) {
            return false;
        }
        if (exact) {
            if (hashQueryKey(mutation.options.mutationKey) !== hashQueryKey(mutationKey)) {
                return false;
            }
        }
        else if (!partialMatchKey(mutation.options.mutationKey, mutationKey)) {
            return false;
        }
    }
    if (typeof fetching === 'boolean' &&
        (mutation.state.status === 'loading') !== fetching) {
        return false;
    }
    if (predicate && !predicate(mutation)) {
        return false;
    }
    return true;
}
exports.matchMutation = matchMutation;
function hashQueryKeyByOptions(queryKey, options) {
    const hashFn = (options === null || options === void 0 ? void 0 : options.queryKeyHashFn) || hashQueryKey;
    return hashFn(queryKey);
}
exports.hashQueryKeyByOptions = hashQueryKeyByOptions;
/**
 * Default query keys hash function.
 */
function hashQueryKey(queryKey) {
    const asArray = ensureQueryKeyArray(queryKey);
    return stableValueHash(asArray);
}
exports.hashQueryKey = hashQueryKey;
/**
 * Hashes the value into a stable hash.
 */
function stableValueHash(value) {
    return JSON.stringify(value, (_, val) => isPlainObject(val)
        ? Object.keys(val)
            .sort()
            .reduce((result, key) => {
            result[key] = val[key];
            return result;
        }, {})
        : val);
}
exports.stableValueHash = stableValueHash;
/**
 * Checks if key `b` partially matches with key `a`.
 */
function partialMatchKey(a, b) {
    return partialDeepEqual(ensureQueryKeyArray(a), ensureQueryKeyArray(b));
}
exports.partialMatchKey = partialMatchKey;
/**
 * Checks if `b` partially matches with `a`.
 */
function partialDeepEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (typeof a !== typeof b) {
        return false;
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        return !Object.keys(b).some(key => !partialDeepEqual(a[key], b[key]));
    }
    return false;
}
exports.partialDeepEqual = partialDeepEqual;
function replaceEqualDeep(a, b) {
    if (a === b) {
        return a;
    }
    const array = Array.isArray(a) && Array.isArray(b);
    if (array || (isPlainObject(a) && isPlainObject(b))) {
        const aSize = array ? a.length : Object.keys(a).length;
        const bItems = array ? b : Object.keys(b);
        const bSize = bItems.length;
        const copy = array ? [] : {};
        let equalItems = 0;
        for (let i = 0; i < bSize; i++) {
            const key = array ? i : bItems[i];
            copy[key] = replaceEqualDeep(a[key], b[key]);
            if (copy[key] === a[key]) {
                equalItems++;
            }
        }
        return aSize === bSize && equalItems === aSize ? a : copy;
    }
    return b;
}
exports.replaceEqualDeep = replaceEqualDeep;
/**
 * Shallow compare objects. Only works with objects that always have the same properties.
 */
function shallowEqualObjects(a, b) {
    if ((a && !b) || (b && !a)) {
        return false;
    }
    for (const key in a) {
        if (a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}
exports.shallowEqualObjects = shallowEqualObjects;
// Copied from: https://github.com/jonschlinkert/is-plain-object
function isPlainObject(o) {
    if (!hasObjectPrototype(o)) {
        return false;
    }
    // If has modified constructor
    const ctor = o.constructor;
    if (typeof ctor === 'undefined') {
        return true;
    }
    // If has modified prototype
    const prot = ctor.prototype;
    if (!hasObjectPrototype(prot)) {
        return false;
    }
    // If constructor does not have an Object-specific method
    if (!prot.hasOwnProperty('isPrototypeOf')) {
        return false;
    }
    // Most likely a plain Object
    return true;
}
exports.isPlainObject = isPlainObject;
function hasObjectPrototype(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
}
function isQueryKey(value) {
    return typeof value === 'string' || Array.isArray(value);
}
exports.isQueryKey = isQueryKey;
function isError(value) {
    return value instanceof Error;
}
exports.isError = isError;
function sleep(timeout) {
    return new Promise(resolve => {
        setTimeout(resolve, timeout);
    });
}
exports.sleep = sleep;
/**
 * Schedules a microtask.
 * This can be useful to schedule state updates after rendering.
 */
function scheduleMicrotask(callback) {
    Promise.resolve()
        .then(callback)
        .catch(error => setTimeout(() => {
        throw error;
    }));
}
exports.scheduleMicrotask = scheduleMicrotask;
function getAbortController() {
    if (typeof AbortController === 'function') {
        return new AbortController();
    }
}
exports.getAbortController = getAbortController;
