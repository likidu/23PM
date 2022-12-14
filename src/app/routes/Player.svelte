<script lang="ts">
  import KaiOS from 'kaios-lib';
  import { onDestroy } from 'svelte';
  import { push } from 'svelte-spa-router';

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
  import { IconSize, Priority } from '../../ui/enums';

  import { reload, pause, play, skip, skipTo, src } from '../components/Audio.svelte';
  import { IconPlay, IconPause, IconBackward, IconForward, IconInfo, IconComment } from '../assets/icons';

  import { player } from '../stores/player';
  import { useEpisode } from '../services';
  import { formatSeconds } from '../helper';

  let eid: string;
  let progress = 0;
  let buffered = 0;

  const imageSize = 144;

  const episode = useEpisode($player.eid);

  const keyMan = KeyManager.subscribe(
    {
      onEnter: () => {
        // $player.playing ? pause() : play();
        if (!$player.playing) {
          // Only play when buffered
          if ($player.buffered > $player.progress) play();
        } else {
          pause();
        }
        return true;
      },
      onSoftLeft: () => {
        push(`/episode/${eid}`);
        return true;
      },
      onSoftRight: () => {
        push(`/comment/${eid}`);
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
        skipTo($player.duration - 10);
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

  // Ensure episode data is loaded
  $: eid = $episode.data?.eid;

  $: if (eid && src() === '') {
    // Load this episode.
    reload($episode.data.mediaKey, $player.progress);
  }

  // Set progress bar percent and reserve 3 fraction values (100,000 / 1,000).
  $: progress = Math.round(($player.progress / $player.duration) * 100000) / 1000;
  $: buffered = Math.round(($player.buffered / $player.duration) * 100000) / 1000;

  $: {
    if ($player.eid) keyMan.enable();
    else keyMan.disable();
  }

  onDestroy(() => keyMan.unsubscribe());
</script>

<View>
  <ViewContent>
    {#if !$player.eid}
      <Card>
        <CardHeader title="Player" />
        <CardContent>
          <Typography align="center">Nothing is playing...</Typography>
        </CardContent>
      </Card>
    {:else}
      <Card>
        {#if $episode.status === 'loading'}
          <Typography align="center">Loading...</Typography>
        {:else if $episode.status === 'error'}
          <Typography align="center">Error!</Typography>
        {:else}
          {@const episode = $episode.data}
          <CardHeader title={episode.podcast.title} style={`color: ${episode.podcast.color.light}`} />
          <CardContent>
            <div class="player-content">
              {#if episode.image}
                <img src={episode.image.smallPicUrl} alt="Episode Cover" width={imageSize} />
              {:else}
                <img src={episode.podcast.image.smallPicUrl} alt="Podcast Cover" width={imageSize} />
              {/if}
              <h2 class="line-clamp-2">{episode.title}</h2>
            </div>
          </CardContent>
          <CardFooter>
            <div id="time-tracker" class="flex justify-between">
              <span class="text-sm">{formatSeconds($player.progress)}</span>
              <span class="text-sm">{formatSeconds($player.duration - $player.progress)}</span>
            </div>
            <Progressbar value={progress} shade={buffered} />
            <footer class="softkey">
              <div><Icon size={IconSize.Small}><IconInfo /></Icon></div>
              <div class="player-controller">
                <Icon size={IconSize.Small}><IconBackward /></Icon>
                {#if $player.playing}
                  <Icon size={IconSize.Large}><IconPause /></Icon>
                {:else}
                  <Icon size={IconSize.Large}><IconPlay /></Icon>
                {/if}
                <Icon size={IconSize.Small}><IconForward /></Icon>
              </div>
              <div><Icon size={IconSize.Small}><IconComment /></Icon></div>
            </footer>
          </CardFooter>
        {/if}
      </Card>
    {/if}
  </ViewContent>
</View>
