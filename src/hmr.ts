// Customized HMR-safe stores
// Based off https://github.com/svitejs/svite/blob/ddec6b9/packages/playground/hmr/src/stores/hmr-stores.js
import type { Writable } from 'svelte/store';
import { user, menu, mobilePhoneNumber, isPlaying, eid, mediaKey, duration, current } from './app/stores';

let stores: Record<string, Writable<any>> = {};

export function registerStore<T>(id: string, store: Writable<T>) {
  stores[id] = store;
}

registerStore('user', user);
registerStore('menu', menu);
registerStore('mobilePhoneNumber', mobilePhoneNumber);
registerStore('isPlaying', isPlaying);
registerStore('eid', eid);
registerStore('mediaKey', mediaKey);
registerStore('duration', duration);
registerStore('current', current);

// preserve the store across HMR updates
if (import.meta.hot) {
  if (import.meta.hot.data.stores) {
    stores = import.meta.hot.data.stores;
  }
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    import.meta.hot.data.stores = stores;
  });
}
