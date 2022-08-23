import { SvelteComponentTyped } from "svelte";
import type { UseQueryOptions } from '../types';
import type { QueryKey } from '../queryCore/core';
declare class __sveltets_Render<TQueryFnData extends any, TError extends any, TData extends TQueryFnData, TQueryKey extends QueryKey> {
    props(): {
        options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>;
        queryResult?: import("../queryCore/core").QueryObserverResult<TData, TError>;
    };
    events(): {} & {
        [evt: string]: CustomEvent<any>;
    };
    slots(): {
        query: {
            queryResult: import("../queryCore/core").QueryObserverResult<TData, TError>;
        };
    };
}
export declare type QueryProps<TQueryFnData extends any, TError extends any, TData extends TQueryFnData, TQueryKey extends QueryKey> = ReturnType<__sveltets_Render<TQueryFnData, TError, TData, TQueryKey>['props']>;
export declare type QueryEvents<TQueryFnData extends any, TError extends any, TData extends TQueryFnData, TQueryKey extends QueryKey> = ReturnType<__sveltets_Render<TQueryFnData, TError, TData, TQueryKey>['events']>;
export declare type QuerySlots<TQueryFnData extends any, TError extends any, TData extends TQueryFnData, TQueryKey extends QueryKey> = ReturnType<__sveltets_Render<TQueryFnData, TError, TData, TQueryKey>['slots']>;
export default class Query<TQueryFnData extends any, TError extends any, TData extends TQueryFnData, TQueryKey extends QueryKey> extends SvelteComponentTyped<QueryProps<TQueryFnData, TError, TData, TQueryKey>, QueryEvents<TQueryFnData, TError, TData, TQueryKey>, QuerySlots<TQueryFnData, TError, TData, TQueryKey>> {
}
export {};
