import './types';
// UTILS
export const isServer = typeof window === 'undefined';
export function noop() {
    return undefined;
}
export function functionalUpdate(updater, input) {
    return typeof updater === 'function'
        ? updater(input)
        : updater;
}
export function isValidTimeout(value) {
    return typeof value === 'number' && value >= 0 && value !== Infinity;
}
export function ensureQueryKeyArray(value) {
    return (Array.isArray(value)
        ? value
        : [value]);
}
export function difference(array1, array2) {
    return array1.filter(x => array2.indexOf(x) === -1);
}
export function replaceAt(array, index, value) {
    const copy = array.slice(0);
    copy[index] = value;
    return copy;
}
export function timeUntilStale(updatedAt, staleTime) {
    return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0);
}
export function parseQueryArgs(arg1, arg2, arg3) {
    if (!isQueryKey(arg1)) {
        return arg1;
    }
    if (typeof arg2 === 'function') {
        return Object.assign(Object.assign({}, arg3), { queryKey: arg1, queryFn: arg2 });
    }
    return Object.assign(Object.assign({}, arg2), { queryKey: arg1 });
}
export function parseMutationArgs(arg1, arg2, arg3) {
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
export function parseFilterArgs(arg1, arg2, arg3) {
    return (isQueryKey(arg1)
        ? [Object.assign(Object.assign({}, arg2), { queryKey: arg1 }), arg3]
        : [arg1 || {}, arg2]);
}
export function parseMutationFilterArgs(arg1, arg2) {
    return isQueryKey(arg1) ? Object.assign(Object.assign({}, arg2), { mutationKey: arg1 }) : arg1;
}
export function mapQueryStatusFilter(active, inactive) {
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
export function matchQuery(filters, query) {
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
export function matchMutation(filters, mutation) {
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
export function hashQueryKeyByOptions(queryKey, options) {
    const hashFn = (options === null || options === void 0 ? void 0 : options.queryKeyHashFn) || hashQueryKey;
    return hashFn(queryKey);
}
/**
 * Default query keys hash function.
 */
export function hashQueryKey(queryKey) {
    const asArray = ensureQueryKeyArray(queryKey);
    return stableValueHash(asArray);
}
/**
 * Hashes the value into a stable hash.
 */
export function stableValueHash(value) {
    return JSON.stringify(value, (_, val) => isPlainObject(val)
        ? Object.keys(val)
            .sort()
            .reduce((result, key) => {
            result[key] = val[key];
            return result;
        }, {})
        : val);
}
/**
 * Checks if key `b` partially matches with key `a`.
 */
export function partialMatchKey(a, b) {
    return partialDeepEqual(ensureQueryKeyArray(a), ensureQueryKeyArray(b));
}
/**
 * Checks if `b` partially matches with `a`.
 */
export function partialDeepEqual(a, b) {
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
export function replaceEqualDeep(a, b) {
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
/**
 * Shallow compare objects. Only works with objects that always have the same properties.
 */
export function shallowEqualObjects(a, b) {
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
// Copied from: https://github.com/jonschlinkert/is-plain-object
export function isPlainObject(o) {
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
function hasObjectPrototype(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
}
export function isQueryKey(value) {
    return typeof value === 'string' || Array.isArray(value);
}
export function isError(value) {
    return value instanceof Error;
}
export function sleep(timeout) {
    return new Promise(resolve => {
        setTimeout(resolve, timeout);
    });
}
/**
 * Schedules a microtask.
 * This can be useful to schedule state updates after rendering.
 */
export function scheduleMicrotask(callback) {
    Promise.resolve()
        .then(callback)
        .catch(error => setTimeout(() => {
        throw error;
    }));
}
export function getAbortController() {
    if (typeof AbortController === 'function') {
        return new AbortController();
    }
}
