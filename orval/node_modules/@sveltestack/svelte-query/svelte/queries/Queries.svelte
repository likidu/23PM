<script>import { onMount } from 'svelte';
;
import useQueries from './useQueries';
export let queries;
// useful for binding
export let currentResult = [];
let firstRender = true;
onMount(() => {
    firstRender = false;
});
const queriesStore = useQueries(queries);
$: currentResult = $queriesStore;
$: {
    if (!firstRender) {
        queriesStore.setQueries(queries);
    }
}
</script>

<slot name="queries" {currentResult} />
