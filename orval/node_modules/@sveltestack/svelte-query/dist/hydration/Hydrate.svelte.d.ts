import { SvelteComponentTyped } from "svelte";
import type { DehydratedState, HydrateOptions } from '../queryCore/hydration';
declare const __propDef: {
    props: {
        state: DehydratedState;
        options?: HydrateOptions | undefined;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {};
    };
};
export declare type HydrateProps = typeof __propDef.props;
export declare type HydrateEvents = typeof __propDef.events;
export declare type HydrateSlots = typeof __propDef.slots;
export default class Hydrate extends SvelteComponentTyped<HydrateProps, HydrateEvents, HydrateSlots> {
}
export {};
