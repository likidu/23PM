<script lang="ts">
  import { push } from 'svelte-spa-router';

  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import ListItem from '../../ui/components/list/ListItem.svelte';

  import MdHome from 'svelte-icons/md/MdHome.svelte';

  import { menu } from '../stores';
  import { useInboxList, truncate } from '../services';

  const inbox = useInboxList();

  $menu = [{ id: 'logout', text: 'Log out', route: '/', icon: MdHome }];

  function openEpisode(eid: string) {
    push(`/episode/${eid}`);
  }
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
                imageUrl={episode.image.thubmnailUrl}
                primaryText={episode.title}
                secondaryText={episode.description}
                navi={{ itemId: `${i + 1}`, onSelect: () => openEpisode(episode.eid) }}
              />
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  </ViewContent>
</View>
