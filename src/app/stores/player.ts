import { writable } from 'svelte/store';
import { Storage } from '../../ui/services';
import type { Media } from '../models';

// Default values for player store
const DEFAULT_MEDIA: Media = {
  eid: undefined,
  duration: 0,
  buffered: 0,
  progress: 0,
  playing: false,
};

function createPlayer(key: 'media', initStore: Media) {
  const { subscribe, update, set } = writable<Media>(initStore);

  subscribe((val: Partial<Media>) => {
    // Only update LocalStorage when the audio is paused
    if (!val.playing) Storage.set(key, val);
  });

  return {
    subscribe,
    update: function (data: Partial<Media>) {
      update((previous) => ({ ...previous, ...data }));
    },
    reset: function () {
      set(DEFAULT_MEDIA);
    },
  };
}

const storedMedia = Storage.get<Media>('media');
let initStore = DEFAULT_MEDIA;
if (storedMedia) initStore = storedMedia;

export const player = createPlayer('media', initStore);
