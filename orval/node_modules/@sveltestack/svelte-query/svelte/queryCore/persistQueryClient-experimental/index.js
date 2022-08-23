import '../core';
import { getLogger } from '../core/logger';
import { dehydrate, hydrate, } from '../core';
export async function persistQueryClient({ queryClient, persistor, maxAge = 1000 * 60 * 60 * 24, buster = '', hydrateOptions, dehydrateOptions, }) {
    if (typeof window !== 'undefined') {
        // Subscribe to changes
        const saveClient = () => {
            const persistClient = {
                buster,
                timestamp: Date.now(),
                clientState: dehydrate(queryClient, dehydrateOptions),
            };
            persistor.persistClient(persistClient);
        };
        // Attempt restore
        try {
            const persistedClient = await persistor.restoreClient();
            if (persistedClient) {
                if (persistedClient.timestamp) {
                    const expired = Date.now() - persistedClient.timestamp > maxAge;
                    const busted = persistedClient.buster !== buster;
                    if (expired || busted) {
                        persistor.removeClient();
                    }
                    else {
                        hydrate(queryClient, persistedClient.clientState, hydrateOptions);
                    }
                }
                else {
                    persistor.removeClient();
                }
            }
        }
        catch (err) {
            getLogger().error(err);
            getLogger().warn('Encountered an error attempting to restore client cache from persisted location. As a precaution, the persisted cache will be discarded.');
            persistor.removeClient();
        }
        // Subscribe to changes in the query cache to trigger the save
        queryClient.getQueryCache().subscribe(saveClient);
    }
}
