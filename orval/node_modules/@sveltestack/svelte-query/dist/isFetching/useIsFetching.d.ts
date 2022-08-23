import type { Readable } from "svelte/store";
import { QueryKey } from '../queryCore/core';
import type { QueryFilters } from '../queryCore/core/utils';
export declare function useIsFetching(filters?: QueryFilters): Readable<number>;
export declare function useIsFetching(queryKey?: QueryKey, filters?: QueryFilters): Readable<number>;
export default function useIsFetching(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): Readable<number>;
