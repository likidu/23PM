<script>import { onMount } from 'svelte';
;
;
import useQuery from './useQuery';
export let options;
// useful for binding
export let queryResult = undefined;
let firstRender = true;
onMount(() => {
    firstRender = false;
});
const query = useQuery(options);
$: queryResult = $query;
$: {
    if (!firstRender) {
        query.setOptions(options);
    }
}
</script>

<slot name="query" {queryResult} />
