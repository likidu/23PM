import { SvelteComponentTyped } from "svelte";
import { MutationCache, QueryCache, QueryClient } from '../queryCore';
import type { DefaultOptions } from '../queryCore';
declare const __propDef: {
    props: {
        queryCache?: QueryCache;
        mutationCache?: MutationCache;
        defaultOptions?: DefaultOptions;
        client?: QueryClient;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {};
    };
};
export declare type QueryClientProviderProps = typeof __propDef.props;
export declare type QueryClientProviderEvents = typeof __propDef.events;
export declare type QueryClientProviderSlots = typeof __propDef.slots;
export default class QueryClientProvider extends SvelteComponentTyped<QueryClientProviderProps, QueryClientProviderEvents, QueryClientProviderSlots> {
}
export {};
