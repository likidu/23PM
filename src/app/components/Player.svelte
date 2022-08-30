<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';

  import { isPlaying } from '../stores';

  let audio: HTMLAudioElement;

  const dispatch = createEventDispatcher();

  //Event dispatch
  const canplay = (e: Event) => dispatch('canplay', e);
  const canplaythrough = (e: Event) => dispatch('canplaythrough', e);
  const durationchange = (e: Event) => dispatch('durationchange', e);
  const loadeddata = (e: Event) => dispatch('loadeddata', e);
  const playing = (e: Event) => dispatch('playing', e);
  const stalled = (e: Event) => dispatch('stalled', e);
  const suspend = (e: Event) => dispatch('suspend', e);
  const waiting = (e: Event) => dispatch('waiting', e);
  const volumechange = (e: Event) => dispatch('volumechange', e);

  $: progress = 0;

  $: {
    $isPlaying ? audio.play() : audio.pause();
  }

  // runs every time audio currentTime changes
  function timeUpdate(e: Event) {
    progress = audio.currentTime ?? 0;
    dispatch('timeupdate', e);
  }

  onMount(() => {
    if (audio) {
      audio.mozAudioChannelType = 'content';
    }
  });
</script>

<audio
  bind:this={audio}
  class="hidden"
  preload="auto"
  src={urls[$trackIndex]}
  on:loadedmetadata={loadedMetadata}
  on:timeupdate={timeUpdate}
  on:ended={ended}
  on:canplay={canplay}
  on:canplaythrough={canplaythrough}
  on:durationchange={durationchange}
  on:loadeddata={loadeddata}
  on:playing={playing}
  on:stalled={stalled}
  on:suspend={suspend}
  on:waiting={waiting}
  on:volumechange={volumechange}
/>
