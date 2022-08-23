import { SvelteComponentTyped } from "svelte";
import type { MutationFunction } from '../queryCore';
import type { UseMutationOptions, UseMutationResult } from '../types';
declare class __sveltets_Render<TData extends any, TError extends any, TVariables extends any, TContext extends any> {
    props(): {
        mutationFn: MutationFunction<TData, TVariables>;
        options?: UseMutationOptions<TData, TError, TVariables, TContext>;
        mutationResult?: UseMutationResult<TData, TError, TVariables, TContext>;
    };
    events(): {} & {
        [evt: string]: CustomEvent<any>;
    };
    slots(): {
        mutation: {
            mutationResult: UseMutationResult<TData, TError, TVariables, TContext>;
        };
    };
}
export declare type MutationProps<TData extends any, TError extends any, TVariables extends any, TContext extends any> = ReturnType<__sveltets_Render<TData, TError, TVariables, TContext>['props']>;
export declare type MutationEvents<TData extends any, TError extends any, TVariables extends any, TContext extends any> = ReturnType<__sveltets_Render<TData, TError, TVariables, TContext>['events']>;
export declare type MutationSlots<TData extends any, TError extends any, TVariables extends any, TContext extends any> = ReturnType<__sveltets_Render<TData, TError, TVariables, TContext>['slots']>;
export default class Mutation<TData extends any, TError extends any, TVariables extends any, TContext extends any> extends SvelteComponentTyped<MutationProps<TData, TError, TVariables, TContext>, MutationEvents<TData, TError, TVariables, TContext>, MutationSlots<TData, TError, TVariables, TContext>> {
}
export {};
