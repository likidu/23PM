<script lang="ts">
  import { onDestroy } from 'svelte';
  import { replace } from 'svelte-spa-router';

  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import CardFooter from '../../ui/components/card/CardFooter.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { registerView } from '../../ui/stores';
  import { KeyManager } from '../../ui/services';
  import { Priority, RenderState } from '../../ui/enums';

  import { useSearchResultList } from '../services';
  import EpisodeList from '../components/EpisodeList.svelte';

  export let params: { keyword: string };

  const result = useSearchResultList(params.keyword);

  const keyMan = KeyManager.subscribe(
    {
      onBackspace: () => {
        replace('/search');
        return true;
      },
      onSoftLeft: () => {
        return true;
      },
    },
    Priority.High,
  );

  registerView({});

  onDestroy(() => keyMan.unsubscribe());
</script>

<View>
  <ViewContent>
    <Card>
      <CardHeader title={params.keyword} />
      <CardContent>
        {#if $result.status === 'loading'}
          <Typography align="center">Loading</Typography>
        {:else if $result.status === 'error'}
          <Typography align="center">Error!</Typography>
        {:else}
          <EpisodeList list={$result.data.data} />
        {/if}
      </CardContent>
    </Card>
  </ViewContent>
</View>
