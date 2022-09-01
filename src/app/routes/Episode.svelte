<script lang="ts">
  import KaiOS from 'kaios-lib';
  import { onDestroy } from 'svelte';

  import View from '../../ui/components/view/View.svelte';
  import ViewHeader from '../../ui/components/view/ViewHeader.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import ViewFooter from '../../ui/components/view/ViewFooter.svelte';
  import IconButton from '../../ui/components/buttons/IconButton.svelte';

  import { KeyManager } from '../../ui/services';
  import { Priority } from '../..//ui/enums';

  import Play from '../assets/icons/Play.svelte';
  import Pause from '../assets/icons/Pause.svelte';
  import MdHome from 'svelte-icons/md/MdHome.svelte';

  import { load, pause, play, skip, skipTo } from '../components/Player.svelte';
  import Progress from '../components/Progress.svelte';

  import { menu } from '../stores';
  import { player } from '../stores/player';
  import { useEpisode } from '../services';
  import { formatSeconds } from '../helper';

  export let params: { eid: string };

  let progress = 0;

  const episode = useEpisode(params.eid);

  const keyMan = KeyManager.subscribe(
    {
      onEnter: () => {
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

  // If query is loaded and eid is not the current one is playing
  $: if (!!$episode.data?.mediaKey && $player.eid !== $episode.data.eid) {
    const { eid, mediaKey, duration } = $episode.data;
    load(eid, mediaKey, duration);
    console.log(`[Episode] : mediaKey ${mediaKey}`);
  }

  // Set progress bar percent and reserve 4 fraction values
  $: progress = Math.round(($player.current / $player.duration) * 10000) / 10000;

  $menu = [{ id: 'logout', text: 'Log out', route: '/', icon: MdHome }];

  onDestroy(() => keyMan.unsubscribe());
</script>

<View>
  {#if $episode.status === 'loading'}
    <ViewHeader>
      <h4>Episode</h4>
    </ViewHeader>
    <ViewContent>
      <p>Loading...</p>
    </ViewContent>
  {:else if $episode.status === 'error'}
    <span class="text-red-500">Error!</span>
  {:else}
    {@const episode = $episode.data}
    <ViewHeader>
      <h4>{episode.podcast.title}</h4>
    </ViewHeader>
    <ViewContent>
      <img src={episode.image.smallPicUrl} alt="Episode Cover" width="156" />
      <h4>{episode.title}</h4>
      <div id="time-tracker">
        <small>{formatSeconds($current)}</small>
        <small>-{formatSeconds($duration - $current)}</small>
      </div>
      <Progress {progress} />
    </ViewContent>
    <ViewFooter>
      {#if $player.playing}
        <IconButton icon={Pause} navi={{ itemId: 'pauseButton' }} />
      {:else}
        <IconButton icon={Play} navi={{ itemId: 'playButton' }} />
      {/if}
    </ViewFooter>
  {/if}
</View>
