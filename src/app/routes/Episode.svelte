<script lang="ts">
  import { onDestroy, getContext } from 'svelte';

  import View from '../../ui/components/view/View.svelte';
  import ViewHeader from '../../ui/components/view/ViewHeader.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import ViewFooter from '../../ui/components/view/ViewFooter.svelte';

  import { KeyManager } from '../../ui/services';

  import IconButton from '../../ui/components/buttons/IconButton.svelte';

  import Play from '../assets/icons/Play.svelte';
  import Pause from '../assets/icons/Pause.svelte';
  import MdHome from 'svelte-icons/md/MdHome.svelte';

  import Progress from '../components/Progress.svelte';

  import { menu, isPlaying, eid, mediaKey, duration, current } from '../stores';
  import { useEpisode, displayDuration } from '../services';

  export let params: { eid: string };

  let progress = 0;

  const episode = useEpisode(params.eid);

  const volume = navigator.volumeManager;

  const keyMan = KeyManager.subscribe({
    onEnter: () => {
      isPlaying.update((isPlaying) => !isPlaying);
      return true;
    },
    onArrowLeft: () => {
      // Rewind 15s
      return true;
    },
    onArrowRight: () => {
      // Wind 30s
      return true;
    },
    onArrowUp: () => {
      volume.requestUp();
      return true;
    },
    onArrowDown: () => {
      volume.requestDown();
      return true;
    },
  });

  // If query is loaded and eid is not the current one is playing
  $: if (!!$episode.data?.mediaKey && $eid !== $episode.data.eid) {
    eid.set($episode.data.eid);
    mediaKey.set($episode.data.mediaKey);
    duration.set($episode.data.duration);

    console.log(`[Episode] : mediaKey ${$mediaKey}`);
  }

  // Set progress bar percent and reserve 4 fraction values
  $: progress = Math.round(($current / $duration) * 10000) / 10000;

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
      <div id="track-time">
        <small>{displayDuration($current)}</small>
        <small>-{displayDuration($duration - $current)}</small>
      </div>
      <Progress {progress} />
      <p>{progress}</p>
    </ViewContent>
    <ViewFooter>
      {#if $isPlaying}
        <IconButton icon={Pause} navi={{ itemId: 'pauseButton' }} />
      {:else}
        <IconButton icon={Play} navi={{ itemId: 'playButton' }} />
      {/if}
    </ViewFooter>
  {/if}
</View>
