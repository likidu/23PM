<script lang="ts">
  import { push } from 'svelte-spa-router';

  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import Icon from '../../ui/components/icon/Icon.svelte';
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import ListItem from '../../ui/components/list/ListItem.svelte';

  import { Color, IconSize } from '../../ui/enums';
  import { registerView } from '../../ui/stores';

  import MdHome from 'svelte-icons/md/MdHome.svelte';

  import { menu } from '../stores/user';
  import { useInboxList } from '../services';
  import { Message, Headphone } from '../assets/icons';

  const inbox = useInboxList();

  registerView({});

  $menu = [
    { id: 'player', text: 'Player', route: '/player', icon: MdHome },
    { id: 'logout', text: 'Log out', route: '/', icon: MdHome },
  ];
</script>

<View>
  <ViewContent>
    <Card>
      <CardHeader title="Inbox" />
      <CardContent>
        {#if $inbox.status === 'loading'}
          <span>Loading...</span>
        {:else if $inbox.status === 'error'}
          <span class="text-red-500">Error!</span>
        {:else}
          <div>
            {#each $inbox.data.data as episode, i}
              <ListItem
                imageUrl={episode.podcast.image.thumbnailUrl}
                primaryText={episode.title}
                secondaryText={episode.description}
                navi={{ itemId: `${i + 1}`, onSelect: () => push(`/episode/${episode.eid}`) }}
              >
                <div slot="bottom" class="stats">
                  <div class="item">
                    <Icon size={IconSize.Smallest} color={Color.Secondary}><Message /></Icon>
                    <div>{episode.commentCount}</div>
                  </div>
                  <div class="item">
                    <Icon size={IconSize.Smallest} color={Color.Secondary}><Headphone /></Icon>{episode.playCount}
                  </div>
                </div>
              </ListItem>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  </ViewContent>
</View>

<style>
  .stats {
    color: var(--secondary-text-color);
    @apply flex space-x-6 mt-1;
  }
  .stats > .item {
    @apply flex items-center text-xl;
  }
</style>
