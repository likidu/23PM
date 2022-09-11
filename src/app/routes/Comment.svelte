<script lang="ts">
  import { dayjs } from 'svelte-time';
  import Button from '../../ui/components/buttons/Button.svelte';
  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import CardFooter from '../../ui/components/card/CardFooter.svelte';
  import ListHeader from '../../ui/components/list/ListHeader.svelte';
  import ListItem from '../../ui/components/list/ListItem.svelte';
  import Icon from '../../ui/components/icon/Icon.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { KeyManager } from '../../ui/services';
  import { IconSize, Priority, RenderState } from '../../ui/enums';

  import { IconMenu, IconInfo } from '../assets/icons';

  import { useCommentList } from '../services';

  export let params: { eid: string };

  let load: string;

  const comments = useCommentList(params.eid);

  $: if ($comments.isFetching) {
    load = 'Loading more...';
  } else if ($comments.hasNextPage) {
    load = 'Load more';
  } else {
    load = 'End of list';
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
          <ListHeader title={`${$comments.data.pages[0].totalCount.toString()} comments total`} />
          {#each $comments.data.pages as page, i}
            {#each page.data as comment, j}
              <ListItem
                imageUrl={comment.author.avatar.picture.thumbnailUrl}
                imageStyle="circle"
                imageSize={IconSize.Small}
                primaryText={comment.author.nickname}
                secondaryText={dayjs().to(comment.createdAt)}
                navi={{ itemId: `${comment.type}_${i + 1}_${j + 1}` }}
              >
                <div slot="bottom" class="comment-content">
                  <section class="line-clamp-4">{@html comment.text}</section>
                  {#if comment.replies.length > 0}
                    <div class="comment-reply">
                      {#each comment.replies as reply}
                        <div>
                          <span class="text-secondary">{reply.author.nickname}&#58; </span>
                          <span class="line-clamp-2">{reply.text}</span>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
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
            <Icon size={IconSize.Small}><IconInfo /></Icon>
          </div>
        </footer>
      </CardFooter>
    </Card>
  </ViewContent>
</View>
