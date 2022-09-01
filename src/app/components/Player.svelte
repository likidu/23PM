<script context="module" lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';

  import { player } from '../stores/player';
  import { clamp } from '../helper';

  let audio = document.createElement('audio');
  // Make KaiOS able to control the volume of it
  audio.mozAudioChannelType = 'content';

  audio.onloadedmetadata = () => {};

  export function load(eid: string, mediaKey: string, duration: number) {
    audio.src = mediaKey;
    audio.currentTime = 0;

    player.update({ eid, duration });

    audio.play();
    player.update({ playing: true });
  }

  export function play() {
    audio.play();
    player.update({ playing: true });
  }

  export function pause() {
    audio.pause();
    player.update({ playing: false });
  }

  export function stop() {
    audio.src = '';
    audio.currentTime = 0;
    player.reset();
  }

  export function skip(seconds: number) {
    const newTime = clamp(audio.currentTime + seconds, 0, audio.duration);
    audio.currentTime = audio.currentTime + seconds;
    player.update({ current: newTime });
  }

  export function skipTo(seconds: number) {
    const newTime = clamp(seconds, 0, audio.duration);
    audio.currentTime = seconds;
    player.update({ current: newTime });
  }

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

  $: {
    if (audio && $mediaKey) {
      console.log(`[Player] : mediaKey ${$mediaKey}`);
      $isPlaying ? audio.play() : audio.pause();
    }
  }

  // runs every time audio currentTime changes
  function timeUpdate(e: Event) {
    $current = audio.currentTime ?? 0;
    dispatch('timeupdate', e);
  }

  onMount(() => {});
</script>

<audio
  bind:this={audio}
  class="hidden"
  preload="auto"
  src={$mediaKey}
  duration={$duration}
  on:timeupdate={timeUpdate}
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
