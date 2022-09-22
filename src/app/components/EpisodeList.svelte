<script lang="ts">
  import { push } from 'svelte-spa-router';

  import ListItem from '../../ui/components/list/ListItem.svelte';
  import Icon from '../../ui/components/icon/Icon.svelte';

  import { Color, IconSize } from '../../ui/enums';

  import type { Episode } from '../models';

  import { IconComment, IconHeadphone } from '../assets/icons';
  import { placeholderImage } from '../helper';

  export let list: Episode[];
  export let icon: 'episode' | 'podcast' = 'episode';
</script>

{#each list as episode, i}
  {#if episode.type === 'EPISODE'}
    {@const url = episode.image && icon === 'episode' ? episode.image.thumbnailUrl : episode.podcast.image.thumbnailUrl}
    <ListItem
      imageUrl={url ?? placeholderImage}
      primaryText={episode.title}
      secondaryText={episode.description}
      navi={{ itemId: `${i + 1}`, onSelect: () => push(`/episode/${episode.eid}`) }}
    >
      <div slot="bottom" class="stats">
        <div class="item">
          <Icon size={IconSize.Smallest} color={Color.Secondary}><IconComment /></Icon>
          <span>{episode.commentCount}</span>
        </div>
        <div class="item">
          <Icon size={IconSize.Smallest} color={Color.Secondary}><IconHeadphone /></Icon>
          <span>{episode.playCount}</span>
        </div>
      </div>
    </ListItem>
  {/if}
{/each}

<style lang="postcss">
  .stats {
    color: var(--secondary-text-color);
    @apply flex space-x-6 mt-1;
  }
  :global(.stats .item) {
    @apply flex items-center space-x-1 text-xl;
  }
</style>
