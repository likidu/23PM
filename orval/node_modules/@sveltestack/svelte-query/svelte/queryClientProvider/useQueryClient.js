import { getContext } from 'svelte';
import '../queryCore/core/queryClient';
export default function useQueryClient() {
    const queryClient = getContext('queryClient');
    if (!queryClient) {
        throw new Error('No QueryClient set, use QueryClientProvider to set one');
    }
    return queryClient;
}
