<script lang="ts">
  import KaiOS from 'kaios-lib';
  import { onDestroy } from 'svelte';

  import View from '../../ui/components/view/View.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import Card from '../../ui/components/card/Card.svelte';
  import CardContent from '../../ui/components/card/CardContent.svelte';
  import CardHeader from '../../ui/components/card/CardHeader.svelte';
  import CardFooter from '../../ui/components/card/CardFooter.svelte';
  import Icon from '../../ui/components/icon/Icon.svelte';
  import Progressbar from '../../ui/components/form/Progressbar.svelte';
  import Typography from '../../ui/components/Typography.svelte';

  import { KeyManager } from '../../ui/services';
  import { appMenu } from '../../ui/stores';
  import { Priority, RenderState } from '../../ui/enums';

  import MdHome from 'svelte-icons/md/MdHome.svelte';

  import { load, pause, play, skip, skipTo } from '../components/Audio.svelte';
  import { Play, Pause } from '../assets/icons';

  import { menu } from '../stores/user';
  import { player } from '../stores/player';
  import { useEpisode } from '../services';
  import { formatSeconds } from '../helper';

  export let params: { eid: string };

  let progress = 0;
  let current = 0;
  let remaining = 0;
  let eid: string;
  let triggered = false;

  const episode = useEpisode(params.eid);
  $: eid = $episode.data?.eid;

  const keyMan = KeyManager.subscribe(
    {
      onEnter: () => {
        triggered = true;
        $player.playing ? pause() : play();
        return true;
      },
      onArrowLeft: () => {
        // Rewind 15s
        skip(-15);
        return true;
      },
      onArrowLeftLong: () => {
        skipTo(0);
        return true;
      },
      onArrowRight: () => {
        // Wind 30s
        skip(30);
        return true;
      },
      onArrowRightLong: () => {
        skipTo($player.duration - 5);
        return true;
      },
      onArrowUp: () => {
        new KaiOS.Volume().up().catch(() => {});
        return true;
      },
      onArrowDown: () => {
        new KaiOS.Volume().down().catch(() => {});
        return true;
      },
    },
    Priority.High,
  );

  // If query is loaded and eid is not the current one is playing.
  $: {
    console.log(`[Episode] : eid ${eid}, $player.eid ${$player.eid}, triggered ${triggered}`);

    if (eid && eid !== $player.eid && triggered) {
      console.log('[Episode] : Triggered.');

      stop();

      const { mediaKey, duration } = $episode.data;
      load(eid, mediaKey, duration);
    }
  }

  // Set progress bar percent and reserve 43 fraction values (100,000 / 100).
  $: if (eid === $player.eid) {
    progress = Math.round(($player.current / $player.duration) * 100000) / 1000;
    current = $player.current;
    remaining = $player.duration - $player.current;
  }

  $menu = [{ id: 'logout', text: 'Log out', route: '/', icon: MdHome }];

  $: {
    if (eid && $appMenu.state === RenderState.Destroyed) keyMan.enable();
    else keyMan.disable();
  }

  onDestroy(() => {
    keyMan.unsubscribe();
  });
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
          <img src={episode.image.smallPicUrl} alt="Episode Cover" width="156" />
          <h4>{episode.title}</h4>
          <div id="time-tracker" class="flex justify-between">
            <small>{formatSeconds(current)}</small>
            <small>{formatSeconds(remaining)}</small>
          </div>
          <Progressbar value={progress} />
        </CardContent>
        <CardFooter>
          {#if $player.playing && eid === $player.eid}
            <Icon><Pause /></Icon>
          {:else}
            <Icon><Play /></Icon>
          {/if}
        </CardFooter>
      {/if}
    </Card>
  </ViewContent>
</View>
