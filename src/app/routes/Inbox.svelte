<script lang="ts">
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';

  import MdHome from 'svelte-icons/md/MdHome.svelte';

  import { menu } from '../stores';
  import { useInboxList } from '../services/query';

  const inbox = useInboxList();

  $menu = [{ id: 'logout', text: 'Log out', route: '/', icon: MdHome }];
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
            {#each $inbox.data.data as episode}
              <p>{episode.title}</p>
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  </ViewContent>
</View>
