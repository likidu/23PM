import type { UseQueriesStoreResult, QueriesOptions } from "../types";
export default function useQueries<T extends any[]>(queries: readonly [...QueriesOptions<T>]): UseQueriesStoreResult<T>;
