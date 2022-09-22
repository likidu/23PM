<script lang="ts">
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { registerView } from '../../ui/stores';

  import { useInboxList } from '../services';
  import EpisodeItem from '../components/EpisodeItem.svelte';

  const inbox = useInboxList();

  registerView({});
</script>

<View>
  <ViewContent>
    <Card>
      <CardHeader title="Inbox" />
      <CardContent>
        {#if $inbox.status === 'loading'}
          <Typography align="center">Loading</Typography>
        {:else if $inbox.status === 'error'}
          <Typography align="center">Error!</Typography>
        {:else}
          <div>
            {#each $inbox.data.data as episode, i}
              <EpisodeItem {episode} idx={i} icon="podcast" />
            {/each}
          </div>
        {/if}
      </CardContent>
    </Card>
  </ViewContent>
</View>
