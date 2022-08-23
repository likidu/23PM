<script>;
import useIsFetching from './useIsFetching';
export let filters = undefined;
export let isFetching = undefined;
$: isFetchingResult = useIsFetching(filters);
$: isFetching = $isFetchingResult;
</script>

<slot name="isFetching" {isFetching} />
