import type { Readable } from "svelte/store";
import type { MutateOptions, QueryObserverOptions, QueryObserverResult, QueryFunction, QueryKey, MutationStatus, MutationKey, MutationFunction, InfiniteQueryObserverOptions, InfiniteQueryObserverResult } from "./queryCore";
import { RetryDelayValue, RetryValue } from "./queryCore/core/retryer";
export interface UseQueryStoreResult<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> extends Readable<UseQueryResult<TData, TError>> {
    setEnabled(enabled: boolean): void;
    setOptions: {
        (options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): any;
        (queryKey: TQueryKey, options?: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): any;
        (queryKey: TQueryKey, queryFn: QueryFunction<TQueryFnData, TQueryKey>, options?: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): any;
    };
    updateOptions(options: Partial<UseQueryOptions<TQueryFnData, TError, TData>>): void;
}
export interface UseQueryOptions<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> extends QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey> {
}
export declare type UseQueryResult<TData = unknown, TError = unknown> = QueryObserverResult<TData, TError>;
export interface UseInfiniteQueryStoreResult<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> extends Readable<UseInfiniteQueryResult<TData, TError>> {
    setEnabled(enabled: boolean): void;
    setOptions: {
        (options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>): any;
        (queryKey: TQueryKey, options?: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>): any;
        (queryKey: TQueryKey, queryFn: QueryFunction<TQueryFnData, TQueryKey>, options?: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>): any;
    };
    updateOptions(options: Partial<UseInfiniteQueryOptions<TQueryFnData, TError, TData>>): void;
}
export interface UseInfiniteQueryOptions<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData, TQueryData = TQueryFnData, TQueryKey extends QueryKey = QueryKey> extends InfiniteQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> {
}
export declare type UseInfiniteQueryResult<TData = unknown, TError = unknown> = InfiniteQueryObserverResult<TData, TError>;
declare type MAXIMUM_DEPTH = 20;
declare type GetOptions<T extends any> = T extends {
    queryFnData: infer TQueryFnData;
    error?: infer TError;
    data: infer TData;
} ? UseQueryOptions<TQueryFnData, TError, TData> : T extends {
    queryFnData: infer TQueryFnData;
    error?: infer TError;
} ? UseQueryOptions<TQueryFnData, TError> : T extends {
    data: infer TData;
    error?: infer TError;
} ? UseQueryOptions<unknown, TError, TData> : T extends [infer TQueryFnData, infer TError, infer TData] ? UseQueryOptions<TQueryFnData, TError, TData> : T extends [infer TQueryFnData, infer TError] ? UseQueryOptions<TQueryFnData, TError> : T extends [infer TQueryFnData] ? UseQueryOptions<TQueryFnData> : T extends {
    queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>;
    select: (data: any) => infer TData;
} ? UseQueryOptions<TQueryFnData, unknown, TData, TQueryKey> : T extends {
    queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>;
} ? UseQueryOptions<TQueryFnData, unknown, TQueryFnData, TQueryKey> : UseQueryOptions;
declare type GetResults<T> = T extends {
    queryFnData: any;
    error?: infer TError;
    data: infer TData;
} ? UseQueryResult<TData, TError> : T extends {
    queryFnData: infer TQueryFnData;
    error?: infer TError;
} ? UseQueryResult<TQueryFnData, TError> : T extends {
    data: infer TData;
    error?: infer TError;
} ? UseQueryResult<TData, TError> : T extends [any, infer TError, infer TData] ? UseQueryResult<TData, TError> : T extends [infer TQueryFnData, infer TError] ? UseQueryResult<TQueryFnData, TError> : T extends [infer TQueryFnData] ? UseQueryResult<TQueryFnData> : T extends {
    queryFn?: QueryFunction<any, any>;
    select: (data: any) => infer TData;
} ? UseQueryResult<TData> : T extends {
    queryFn?: QueryFunction<infer TQueryFnData, any>;
} ? UseQueryResult<TQueryFnData> : UseQueryResult;
/**
 * QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
export declare type QueriesOptions<T extends any[], Result extends any[] = [], Depth extends ReadonlyArray<number> = []> = Depth['length'] extends MAXIMUM_DEPTH ? UseQueryOptions[] : T extends [] ? [] : T extends [infer Head] ? [...Result, GetOptions<Head>] : T extends [infer Head, ...infer Tail] ? QueriesOptions<[...Tail], [...Result, GetOptions<Head>], [...Depth, 1]> : unknown[] extends T ? T : T extends UseQueryOptions<infer TQueryFnData, infer TError, infer TData>[] ? UseQueryOptions<TQueryFnData, TError, TData>[] : UseQueryOptions[];
/**
 * QueriesResults reducer recursively maps type param to results
 */
export declare type QueriesResults<T extends any[], Result extends any[] = [], Depth extends ReadonlyArray<number> = []> = Depth['length'] extends MAXIMUM_DEPTH ? UseQueryResult[] : T extends [] ? [] : T extends [infer Head] ? [...Result, GetResults<Head>] : T extends [infer Head, ...infer Tail] ? QueriesResults<[...Tail], [...Result, GetResults<Head>], [...Depth, 1]> : T extends UseQueryOptions<infer TQueryFnData, infer TError, infer TData>[] ? UseQueryResult<unknown extends TData ? TQueryFnData : TData, TError>[] : UseQueryResult[];
export declare type UseQueriesResult<T extends any[]> = QueriesResults<T>;
export interface UseQueriesStoreResult<T extends any[]> extends Readable<UseQueriesResult<T>> {
    setQueries(newQueries: readonly [...QueriesOptions<T>]): void;
}
export interface MutationStoreResult<TData = unknown, TError = unknown, TVariables = void, TContext = unknown> extends Readable<UseMutationResult<TData, TError, TVariables, TContext>> {
    setOptions: {
        (options: UseMutationOptions<TData, TError, TVariables, TContext>): any;
        (mutationKey: MutationKey, options?: UseMutationOptions<TData, TError, TVariables, TContext>): any;
        (mutationKey: MutationKey, mutationFn?: MutationFunction<TData, TVariables>, options?: UseMutationOptions<TData, TError, TVariables, TContext>): any;
        (mutationFn?: MutationFunction<TData, TVariables>, options?: UseMutationOptions<TData, TError, TVariables, TContext>): any;
    };
}
export interface UseMutationOptions<TData, TError, TVariables, TContext> {
    mutationKey?: string | unknown[];
    onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
    onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => Promise<void> | void;
    onError?: (error: TError, variables: TVariables, context: TContext | undefined) => Promise<void> | void;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => Promise<void> | void;
    retry?: RetryValue<TError>;
    retryDelay?: RetryDelayValue<TError>;
    useErrorBoundary?: boolean;
}
export declare type UseMutateFunction<TData = unknown, TError = unknown, TVariables = void, TContext = unknown> = (variables: TVariables, options?: MutateOptions<TData, TError, TVariables, TContext>) => void;
export declare type UseMutateAsyncFunction<TData = unknown, TError = unknown, TVariables = void, TContext = unknown> = (variables: TVariables, options?: MutateOptions<TData, TError, TVariables, TContext>) => Promise<TData>;
export interface UseMutationResult<TData = unknown, TError = unknown, TVariables = unknown, TContext = unknown> {
    context: TContext | undefined;
    data: TData | undefined;
    error: TError | null;
    failureCount: number;
    isError: boolean;
    isIdle: boolean;
    isLoading: boolean;
    isPaused: boolean;
    isSuccess: boolean;
    mutate: UseMutateFunction<TData, TError, TVariables, TContext>;
    mutateAsync: UseMutateAsyncFunction<TData, TError, TVariables, TContext>;
    reset: () => void;
    status: MutationStatus;
    variables: TVariables | undefined;
}
export {};
