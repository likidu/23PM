<script lang="ts">
  import { onDestroy } from 'svelte';

  import View from '../../ui/components/view/View.svelte';
  import ViewHeader from '../../ui/components/view/ViewHeader.svelte';
  import ViewContent from '../../ui/components/view/ViewContent.svelte';
  import ViewFooter from '../../ui/components/view/ViewFooter.svelte';

  import { KeyManager } from '../../ui/services';

  import MdHome from 'svelte-icons/md/MdHome.svelte';

  import Player from '../components/Player.svelte';

  import { menu, user } from '../stores';
  import { useEpisode } from '../services';

  export let params: { eid: string };

  const episode = useEpisode(params.eid);

  const keyMan = KeyManager.subscribe({});

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
      <Player
        audio={{
          name: episode.title,
          url: episode.mediaKey,
          duration: episode.duration,
          cover: episode.image.smallPicUrl,
        }}
      />
    </ViewContent>
    <ViewFooter>
      <p>Hello</p>
    </ViewFooter>
  {/if}
</View>
