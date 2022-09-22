<script lang="ts">
  import Button from '../../ui/components/buttons/Button.svelte';
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { registerView } from '../../ui/stores';

  import Banner from '../components/Banner.svelte';
  import EditorPickList from '../components/EditorPickList.svelte';
  import TopList from '../components/TopList.svelte';

  import { useDiscoveryList } from '../services';

  const discoveryList = useDiscoveryList();

  registerView({});
</script>

<View>
  <ViewContent>
    <Card>
      <CardHeader title="Discover" />
      <CardContent>
        {#if $discoveryList.status === 'loading'}
          <Typography align="center">Loading</Typography>
        {:else if $discoveryList.status === 'error'}
          <Typography align="center">Error!</Typography>
        {:else}
          {#each $discoveryList.data.data as list}
            {#if list.type === 'DISCOVERY_BANNER'}
              <Banner content={list} />
            {:else if list.type === 'EDITOR_PICK'}
              <EditorPickList {list} />
            {:else if list.type === 'TOP_LIST'}
              <TopList {list} />
            {/if}
          {/each}
          <Button
            title="End of list"
            disabled={true}
            navi={{
              itemId: 'endoflist',
            }}
          />
        {/if}
      </CardContent>
    </Card>
  </ViewContent>
</View>
