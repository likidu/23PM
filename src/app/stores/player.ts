import { writable } from 'svelte/store';

import type { Media } from '../models';

// Default values for player store
export const DEFAULT_MEDIA = {
  eid: undefined,
  duration: 0,
  current: 0,
  playing: false,
};

function createPlayer() {
  const { subscribe, update, set } = writable<Media>(DEFAULT_MEDIA);

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

export const player = createPlayer();
