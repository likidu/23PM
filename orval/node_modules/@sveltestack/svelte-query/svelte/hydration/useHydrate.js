import { useQueryClient } from "../queryClientProvider";
import { hydrate } from '../queryCore/hydration';
export default function useHydrate(state, options) {
    const client = useQueryClient();
    if (state) {
        hydrate(client, state, options);
    }
}
