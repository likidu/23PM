import type { Readable } from "svelte/store";
import type { MutationFilters } from '../queryCore/core/utils';
export default function useIsMutating(filters?: MutationFilters): Readable<number>;
