<script lang="ts">
  import { push } from 'svelte-spa-router';

  import ListItem from '../../ui/components/list/ListItem.svelte';
  import ListHeader from '../../ui/components/list/ListHeader.svelte';

  import type { TopList } from '../models';

  export let top: TopList;

  const { data } = top;
  // Only use the first two list: Hot and Skyrocket
  data.pop();
</script>

{#each data as topList}
  {#if topList.category === 'HOT_EPISODES_IN_24_HOURS'}
    <ListHeader title="24 Hours Hot" />
  {:else if topList.category === 'SKYROCKET_EPISODES'}
    <ListHeader title="Skyrocket" />
  {:else}
    <ListHeader title="New Stars" />
  {/if}
  {#each topList.items as list, i}
    <ListItem
      imageUrl={list.item.podcast.image.thumbnailUrl}
      primaryText={list.item.title}
      secondaryText={list.item.podcast.title}
      navi={{ itemId: `${topList.category}_${i + 1}`, onSelect: () => push(`/episode/${list.item.eid}`) }}
    />
  {/each}
{/each}

<style lang="postcss">
  .comment {
    @apply p-1;
  }
</style>
