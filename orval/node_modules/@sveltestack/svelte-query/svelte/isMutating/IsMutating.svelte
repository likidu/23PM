<script>;
import useIsMutating from './useIsMutating';
export let filters = undefined;
export let isMutating = undefined;
$: isMutatingResult = useIsMutating(filters);
$: isMutating = $isMutatingResult;
</script>

<slot name="isMutating" {isMutating} />
