import { SvelteComponentTyped } from "svelte";
import type { MutationFilters } from '../queryCore/core/utils';
declare const __propDef: {
    props: {
        filters?: MutationFilters | undefined;
        isMutating?: number | undefined;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        isMutating: {
            isMutating: number;
        };
    };
};
export declare type IsMutatingProps = typeof __propDef.props;
export declare type IsMutatingEvents = typeof __propDef.events;
export declare type IsMutatingSlots = typeof __propDef.slots;
export default class IsMutating extends SvelteComponentTyped<IsMutatingProps, IsMutatingEvents, IsMutatingSlots> {
}
export {};
