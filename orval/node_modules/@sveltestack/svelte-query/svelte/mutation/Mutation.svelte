<script>import { onMount } from 'svelte';
;
;
import useMutation from './useMutation';
export let mutationFn;
export let options = undefined;
// useful for binding
export let mutationResult = undefined;
let firstRender = true;
onMount(() => {
    firstRender = false;
});
const mutation = useMutation(mutationFn, options);
$: mutationResult = $mutation;
$: {
    if (!firstRender) {
        mutation.setOptions(mutationFn, options);
    }
}
</script>

<slot name="mutation" {mutationResult} />
