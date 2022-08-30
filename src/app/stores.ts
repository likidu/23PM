import { writable } from 'svelte/store';
import type { MenuItem, Audio, User } from './models';

export const user = writable<User>(undefined);

export const menu = writable<MenuItem[]>([]);

export const mobilePhoneNumber = writable('');

export const isPlaying = writable(false);

// TODO: Fix this
export const audio = writable<Audio>({});
