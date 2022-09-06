<script lang="ts">
  import { onDestroy } from 'svelte';
  import { push } from 'svelte-spa-router';

  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import CardFooter from '../../ui/components/card/CardFooter.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { KeyManager } from '../../ui/services';
  import { appMenu, registerView } from '../../ui/stores';
  import { Priority, RenderState } from '../../ui/enums';

  import { load, play, stop } from '../components/Audio.svelte';
  import { IconDiscover, IconInbox, IconPlayer } from '../assets/icons';

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
        <CardHeader title={episode.podcast.title} />
        <CardContent>
          <img src={episode.podcast.image.thumbnailUrl} alt="Podcast Cover" class="rounded-sm" width="48" />
          <h2>{episode.title}</h2>
          <h4>{episode.podcast.title}</h4>
          <caption>{formatSeconds(episode.duration)}</caption>
          <section class="shownotes">{@html episode.shownotes}</section>
        </CardContent>
        <CardFooter>
          <p>Play</p>
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
