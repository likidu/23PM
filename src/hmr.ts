// Customized HMR-safe stores
// Based off https://github.com/svitejs/svite/blob/ddec6b9/packages/playground/hmr/src/stores/hmr-stores.js
import type { Writable } from 'svelte/store';
import { user, menu, mobilePhoneNumber, player } from './app/stores';

let stores: Record<string, Writable<any>> = {};

export function registerStore<T>(id: string, store: Writable<T>) {
  stores[id] = store;
}

registerStore('user', user);
registerStore('menu', menu);
registerStore('mobilePhoneNumber', mobilePhoneNumber);
registerStore('player', player);

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
