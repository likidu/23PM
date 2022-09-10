<script lang="ts">
  import Button from '../../ui/components/buttons/Button.svelte';
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import CardFooter from '../../ui/components/card/CardFooter.svelte';
  import ListItem from '../../ui/components/list/ListItem.svelte';
  import Icon from '../../ui/components/icon/Icon.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { KeyManager } from '../../ui/services';
  import { IconSize, Priority, RenderState } from '../../ui/enums';

  import { IconMenu, IconComment } from '../assets/icons';

  import { useCommentList } from '../services';

  export let params: { eid: string };

  let load = 'End of list';

  const comments = useCommentList(params.eid);

  $: if ($comments.isFetching) {
    load = 'Loading more...';
  } else if ($comments.hasNextPage) {
    load = 'Load more';
  }
</script>

<View>
  <ViewContent>
    <Card>
      <CardHeader title="Comments" />
      <CardContent>
        {#if $comments.status === 'loading'}
          <span>Loading...</span>
        {:else if $comments.status === 'error'}
          <span class="text-red-500">Error!</span>
        {:else}
          {#each $comments.data.pages as page}
            {#each page.data as comment, i}
              <ListItem primaryText={comment.author.nickname} navi={{ itemId: `${i + 1}` }}>
                <div slot="bottom" class="comment-reply">Reply</div>
              </ListItem>
            {/each}
          {/each}
          <Button
            title={load}
            disabled={!$comments.hasNextPage || $comments.isFetchingNextPage}
            navi={{
              itemId: 'LOAD_MORE',
              onSelect: () => {
                $comments.fetchNextPage();
              },
            }}
          />
        {/if}
      </CardContent>
      <CardFooter>
        <footer class="softkey">
          <div><Icon size={IconSize.Small}><IconMenu /></Icon></div>
          <div>
            <Icon size={IconSize.Small}><IconComment /></Icon>
          </div>
        </footer>
      </CardFooter>
    </Card>
  </ViewContent>
</View>
