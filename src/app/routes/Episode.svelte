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

  import { menu, isPlaying, audio } from '../stores';
  import { useEpisode, Player } from '../services';

  export let params: { eid: string };

  const player = getContext<Player>('player');

  const episode = useEpisode(params.eid);

  const volume = navigator.volumeManager;

  const keyMan = KeyManager.subscribe({
    onEnter: () => {
      isPlaying.update((isPlaying) => !isPlaying);
      return true;
    },
    onArrowLeft: () => {
      // Rewind 15s
      player.wind(-15);
      return true;
    },
    onArrowRight: () => {
      // Wind 30s
      player.wind(30);
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

  // Determine if episode has been fetched
  $: if (!!$episode.data?.mediaKey) {
    const { data } = $episode;
    $audio = {
      name: data.title,
      url: data.mediaKey,
      duration: data.duration,
      paused: true,
      progress: 0,
    };
  }

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
      <Progress progress={$audio.progress} />
    </ViewContent>
    <ViewFooter>
      {#if $isPlaying}
        <IconButton icon={Play} navi={{ itemId: 'playButton' }} />
      {:else}
        <IconButton icon={Pause} navi={{ itemId: 'pauseButton' }} />
      {/if}
    </ViewFooter>
  {/if}
</View>
