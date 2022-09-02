<script lang="ts">
  import Icon from '../../ui/components/icon/Icon.svelte';

  import { Play, Pause } from '../assets/icons';

  export let playing: boolean;
</script>

<div id="player-button">
  {#if playing}
    <Icon><Pause /></Icon>
  {:else}
    <Icon><Play /></Icon>
  {/if}
</div>
