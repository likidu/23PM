<script>import { onMount } from 'svelte';
;
import useInfiniteQuery from './useInfiniteQuery';
export let options;
// useful for binding
export let queryResult = undefined;
let firstRender = true;
onMount(() => {
    firstRender = false;
});
const query = useInfiniteQuery(options);
$: queryResult = $query;
$: {
    if (!firstRender) {
        query.setOptions(options);
    }
}
</script>

<slot name="query" {queryResult} />
