<script lang="ts">
  import { replace } from 'svelte-spa-router';

  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Button from '../../ui/components/buttons/Button.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import InputRow from '../../ui/components/form/InputRow.svelte';
  import ListHeader from '../../ui/components/list/ListHeader.svelte';
  import ListItem from '../../ui/components/list/ListItem.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { registerView } from '../../ui/stores';
  import { KeyManager } from '../../ui/services';
  import { Priority, RenderState } from '../../ui/enums';

  import { useSearchPreset } from '../services';

  let keyword = '';

  const preset = useSearchPreset();

  registerView({});

  function search(keyword: string) {
    replace(`/search/${encodeURIComponent(keyword)}`);
  }
</script>

<View>
  <ViewContent>
    <Card>
      <CardHeader title="Search" />
      <CardContent>
        <InputRow label="Keyword" value={keyword} placeholder="Enter keyword..." onChange={(val) => (keyword = val)} />
        <Button
          title="Search"
          disabled={!!(keyword === '')}
          navi={{
            itemId: 'BUTTON_START',
            onSelect: async () => search(keyword),
          }}
        />
        {#if $preset.status === 'loading'}
          <Typography align="center">Loading</Typography>
        {:else if $preset.status === 'error'}
          <Typography align="center">Error!</Typography>
        {:else}
          <ListHeader title="Suggestions" />
          {#each $preset.data as suggest, i}
            <ListItem
              primaryText={suggest.text}
              navi={{
                itemId: `PRESET_${i + 1}`,
                onSelect: () => {
                  const urlParams = new URLSearchParams(suggest.link);
                  search(urlParams.get('keyword'));
                },
              }}
            />
          {/each}
        {/if}
      </CardContent>
    </Card>
  </ViewContent>
</View>
