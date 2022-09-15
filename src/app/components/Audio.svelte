<script context="module" lang="ts">
  import { player } from '../stores/player';
  import { clamp } from '../helper';

  // let audio = document.createElement('audio');
  let audio = new Audio();
  // Make KaiOS able to control the volume of it
  audio.mozAudioChannelType = 'content';
  audio.preload = 'auto';

  audio.onloadedmetadata = () => {};

  audio.ontimeupdate = () => {
    player.update({ progress: audio.currentTime });
  };

  export function load(eid: string, mediaKey: string, duration: number) {
    audio.src = mediaKey;
    audio.currentTime = 0;

    player.update({ eid, duration });
  }

  export function reload(mediaKey: string, progress: number) {
    audio.src = mediaKey;
    audio.currentTime = progress;
  }

  export function src() {
    return audio.src;
  }

  export function play() {
    // Data is available for the current playback position
    if (audio.readyState >= 2) {
      audio.play();
      player.update({ playing: true });
    }
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
    player.update({ progress: newTime });
  }

  export function skipTo(seconds: number) {
    const newTime = clamp(seconds, 0, audio.duration);
    audio.currentTime = seconds;
    player.update({ progress: newTime });
  }
</script>
