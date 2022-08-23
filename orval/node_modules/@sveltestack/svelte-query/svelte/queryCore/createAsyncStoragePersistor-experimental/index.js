import '../persistQueryClient-experimental';
export const createAsyncStoragePersistor = ({ storage, key = `SVELTE_QUERY_OFFLINE_CACHE`, throttleTime = 1000, serialize = JSON.stringify, deserialize = JSON.parse, }) => {
    return {
        persistClient: asyncThrottle(persistedClient => storage.setItem(key, serialize(persistedClient)), { interval: throttleTime }),
        restoreClient: async () => {
            const cacheString = await storage.getItem(key);
            if (!cacheString) {
                return;
            }
            return deserialize(cacheString);
        },
        removeClient: () => storage.removeItem(key),
    };
};
function asyncThrottle(func, { interval = 1000, limit = 1 } = {}) {
    if (typeof func !== 'function')
        throw new Error('argument is not function.');
    const running = { current: false };
    let lastTime = 0;
    let timeout;
    const queue = [];
    return (...args) => (async () => {
        if (running.current) {
            lastTime = Date.now();
            if (queue.length > limit) {
                queue.shift();
            }
            queue.push(args);
            clearTimeout(timeout);
        }
        if (Date.now() - lastTime > interval) {
            running.current = true;
            await func(...args);
            lastTime = Date.now();
            running.current = false;
        }
        else {
            if (queue.length > 0) {
                const lastArgs = queue[queue.length - 1];
                // @ts-ignore
                timeout = setTimeout(async () => {
                    if (!running.current) {
                        running.current = true;
                        await func(...lastArgs);
                        running.current = false;
                    }
                }, interval);
            }
        }
    })();
}
