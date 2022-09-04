<script lang="ts">
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';

  import ListItem from '../../ui/components/list/ListItem.svelte';
  import ListHeader from '../../ui/components/list/ListHeader.svelte';

  import type { EditorPickList } from '../models';

  export let editorPick: EditorPickList;
</script>

{#each editorPick.data as day}
  <ListHeader title={day.date} />
  {#each day.picks as pick, i}
    <ListItem
      imageUrl={pick.episode.podcast.image.thumbnailUrl}
      primaryText={pick.episode.title}
      secondaryText={pick.episode.podcast.title}
      navi={{ itemId: `${i + 1}`, onSelect: () => push(`/episode/${pick.episode.eid}`) }}
    >
      <div slot="bottom" class="comment">
        <p class="line-clamp-3 text-lg"><strong>{pick.comment.author.nickname}: </strong>{pick.comment.text}</p>
      </div>
    </ListItem>
  {/each}
{/each}

<style lang="postcss">
  .comment {
    @apply p-1;
  }
</style>
