<script lang="ts">
  import { onDestroy } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { useQueryClient } from '@sveltestack/svelte-query';

  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import CardFooter from '../../ui/components/card/CardFooter.svelte';
  import Icon from '../../ui/components/icon/Icon.svelte';
  import ListItem from '../../ui/components/list/ListItem.svelte';
  import ListHeader from '../../ui/components/list/ListHeader.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { IconSize, Priority, RenderState } from '../../ui/enums';
  import { appMenu, dialog, registerView } from '../../ui/stores';
  import { Onyx, KeyManager } from '../../ui/services';

  import { IconMenu, IconPodcast, IconSubscribeAdd, IconSubscribeRemove } from '../assets/icons';

  import { Client, usePodcast, useEpisodeList } from '../services';
  import type { SubscriptionMode } from '../models';

  export let params: { pid: string };

  let pid: string;

  const podcast = usePodcast(params.pid);
  const episodeList = useEpisodeList(params.pid);

  const queryClient = useQueryClient();

  const keyMan = KeyManager.subscribe(
    {
      onSoftRight: () => {
        if ($podcast.data.subscriptionStatus === 'OFF') {
          Onyx.dialog.show({
            title: 'Subscribe Podcast',
            body: `Do you want to subscribe to ${$podcast.data.title}?`,
            actions: {
              left: { label: 'Cancel', fn: () => console.log('Cancel') },
              right: { label: 'Subscribe', fn: () => updateSubscription(pid, 'ON') },
            },
          });
        } else if ($podcast.data.subscriptionStatus === 'ON') {
          Onyx.dialog.show({
            title: 'Unsubscribe Podcast',
            body: `Do you want to unsubscribe to ${$podcast.data.title}?`,
            actions: {
              left: { label: 'Cancel', fn: () => console.log('Cancel') },
              right: { label: 'Unsubscribe', fn: () => updateSubscription(pid, 'OFF') },
            },
          });
        }
        return true;
      },
    },
    Priority.High,
  );

  // Ensure podcast data is loaded
  $: pid = $podcast.data?.pid;

  // Prevent keyManager from working when the episode data is not loaded yet and dialog is opened
  $: {
    if (pid && $dialog.state === RenderState.Destroyed) keyMan.enable();
    else keyMan.disable();
  }

  // TODO: Do we need this?
  $: {
    if ($appMenu.state === RenderState.Destroyed) keyMan.enable();
    else keyMan.disable();
  }

  registerView({});

  function updateSubscription(pid: string, mode: SubscriptionMode) {
    Client.updateSubscription(pid, mode);
    queryClient.invalidateQueries('podcast');
  }

  onDestroy(() => keyMan.unsubscribe());
</script>

<View>
  <ViewContent>
    <Card>
      {#if $podcast.status === 'loading'}
        <Typography align="center">Loading...</Typography>
      {:else if $podcast.status === 'error'}
        <Typography align="center">Error!</Typography>
      {:else}
        {@const podcast = $podcast.data}
        {@const podcastColor = podcast.color.dark}
        <CardHeader title={podcast.title} style={`color: ${podcastColor}`} />
        <CardContent>
          <div class="flex flex-col space-y-2 px-3">
            <div class="flex space-x-2">
              <p class="line-clamp-4">{podcast.description}</p>
              <img src={podcast.image.thumbnailUrl} class="inline-box rounded-sm w-24 h-24" alt="Podcast" />
            </div>
            {#each podcast.podcasters as podcaster}
              <div class="flex items-center space-x-2">
                <img src={podcaster.avatar.picture.thumbnailUrl} class="rounded-full w-8" alt="Podcast" />
                <p class="text-sm text-secondary">{podcaster.nickname}</p>
              </div>
            {/each}
            <div class="flex items-center justify-between space-x-2">
              <p><strong>{podcast.subscriptionCount}</strong> subscribers</p>
              {#if podcast.subscriptionStatus === 'ON'}
                <p>Subscribed</p>
              {/if}
            </div>
          </div>
          {#if $episodeList.status === 'loading'}
            <Typography align="center">Loading...</Typography>
          {:else if $episodeList.status === 'error'}
            <Typography align="center">Error!</Typography>
          {:else}
            {@const list = $episodeList.data}
            <ListHeader title="Last 20 Episodes" />
            {#each list.data as episode, i}
              <ListItem
                icon={IconPodcast}
                primaryText={episode.title}
                navi={{ itemId: `ABC_${i + 1}`, onSelect: () => push(`/episode/${episode.eid}`) }}
              >
                <div slot="bottom">
                  <p class="line-clamp-2 text-sm">{episode.description}</p>
                </div>
              </ListItem>
            {/each}
          {/if}
        </CardContent>
        <CardFooter>
          <footer class="softkey">
            <div><Icon size={IconSize.Small} color={podcastColor}><IconMenu /></Icon></div>
            <div>
              <Icon size={IconSize.Small} color={podcastColor}>
                {#if podcast.subscriptionStatus === 'ON'}
                  <IconSubscribeRemove />
                {:else}
                  <IconSubscribeAdd />
                {/if}
              </Icon>
            </div>
          </footer>
        </CardFooter>
      {/if}
    </Card>
  </ViewContent>
</View>
