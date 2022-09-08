<script context="module" lang="ts">
  import 'dayjs/esm/locale/zh-cn';
  import dayjs from 'dayjs/esm';

  // Day.js use Chinese locale
  dayjs.locale('zh-cn');
</script>

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { push } from 'svelte-spa-router';
  import Time from 'svelte-time';

  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import CardFooter from '../../ui/components/card/CardFooter.svelte';
  import Icon from '../../ui/components/icon/Icon.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { KeyManager } from '../../ui/services';
  import { appMenu, registerView } from '../../ui/stores';
  import { IconSize, Priority, RenderState } from '../../ui/enums';

  import { load, play, stop } from '../components/Audio.svelte';
  import { IconDiscover, IconInbox, IconPlayer, IconMenu, IconComment } from '../assets/icons';

  import { menu } from '../stores/user';
  import { player } from '../stores/player';
  import { useEpisode } from '../services';
  import { formatSeconds } from '../helper';

  export let params: { eid: string };

  let eid: string;

  const episode = useEpisode(params.eid);
  $: eid = $episode.data?.eid;

  const keyMan = KeyManager.subscribe(
    {
      onEnter: () => {
        if (eid && eid !== $player.eid) {
          // Stop current playing episode.
          stop();
          // Load this episode.
          const { mediaKey, duration } = $episode.data;
          load(eid, mediaKey, duration);
          // Immediate play the episode once loaded.
          play();
        }
        push('/player');
        return true;
      },
    },
    Priority.High,
  );

  $: {
    if (eid && $appMenu.state === RenderState.Destroyed) keyMan.enable();
    else keyMan.disable();
  }

  registerView({});

  $menu = [
    { id: 'discover', text: 'Discover', route: '#/', icon: IconDiscover },
    { id: 'inbox', text: 'Inbox', route: '/inbox', icon: IconInbox },
    { id: 'player', text: 'Player', route: '/player', icon: IconPlayer },
  ];

  onDestroy(() => keyMan.unsubscribe());
</script>

<View>
  <ViewContent>
    <Card>
      {#if $episode.status === 'loading'}
        <Typography align="center">Loading...</Typography>
      {:else if $episode.status === 'error'}
        <Typography align="center">Error!</Typography>
      {:else}
        {@const episode = $episode.data}
        {@const podcastColor = episode.podcast.color.dark}
        <CardHeader title={episode.podcast.title} style={`color: ${podcastColor}`} />
        <CardContent>
          <div class="episode-content">
            <img src={episode.podcast.image.thumbnailUrl} alt="Podcast Cover" class="rounded-sm" width="48" />
            <h1>{episode.title}</h1>
            <div class="flex space-x-2 text-secondary mb-4">
              <span>{formatSeconds(episode.duration)}</span>
              <span>/</span>
              <span><Time relative timestamp={episode.pubDate} /></span>
            </div>
            <section class="shownotes">{@html episode.shownotes}</section>
          </div>
        </CardContent>
        <CardFooter>
          <footer class="softkey">
            <div><Icon size={IconSize.Small} color={podcastColor}><IconMenu /></Icon></div>
            <div style={`color: ${podcastColor}`}>Play</div>
            <div><Icon size={IconSize.Small} color={podcastColor}><IconComment /></Icon></div>
          </footer>
        </CardFooter>
      {/if}
    </Card>
  </ViewContent>
</View>

<style lang="postcss">
  .shownotes {
    @apply flex flex-col;
  }
  .shownotes > :global(p) {
    @apply mb-4;
  }
</style>
