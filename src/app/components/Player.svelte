<script lang="ts">
  import { onDestroy, createEventDispatcher } from 'svelte';

  import IconButton from '../../ui/components/buttons/IconButton.svelte';

  import { KeyManager } from '../../ui/services';

  import Play from '../assets/icons/Play.svelte';

  import { Player } from '../services';
  import type { Audio } from '../models';

  export let audio: Audio;

  let element: HTMLDivElement;

  const svelteDispatch = createEventDispatcher();
  const player = new Player(dispatch);

  const keyMan = KeyManager.subscribe({
    onEnter: () => {
      player.paused ? player.play() : player.pause();

      return true;
    },
  });

  $: player.src = audio.url;

  /**
   * @summary: Dispatch customer events for Player class
   * @param name: Event name
   * @param detail: Event details
   * @ret none
   */
  function dispatch(name, detail?: any) {
    svelteDispatch(name, detail);
    element.dispatchEvent && element.dispatchEvent(new CustomEvent(name, { detail }));
  }

  onDestroy(() => keyMan.unsubscribe());
</script>

<div id="player" bind:this={element} class="bg-slate-300">
  <img src={audio.cover} alt="Episode Cover" width="156" />
  <p>{audio.name}</p>
  <IconButton icon={Play} navi={{ itemId: 'playButton' }} />
</div>
