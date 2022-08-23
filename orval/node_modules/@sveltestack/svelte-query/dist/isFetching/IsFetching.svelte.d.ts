import { SvelteComponentTyped } from "svelte";
import type { QueryFilters } from '../queryCore/core/utils';
declare const __propDef: {
    props: {
        filters?: QueryFilters | undefined;
        isFetching?: number | undefined;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        isFetching: {
            isFetching: number;
        };
    };
};
export declare type IsFetchingProps = typeof __propDef.props;
export declare type IsFetchingEvents = typeof __propDef.events;
export declare type IsFetchingSlots = typeof __propDef.slots;
export default class IsFetching extends SvelteComponentTyped<IsFetchingProps, IsFetchingEvents, IsFetchingSlots> {
}
export {};
