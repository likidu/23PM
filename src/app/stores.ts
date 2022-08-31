import { writable } from 'svelte/store';
import type { MenuItem, User } from './models';

export const user = writable<User>(undefined);

export const menu = writable<MenuItem[]>([]);

export const mobilePhoneNumber = writable('');

// For Player
export const isPlaying = writable(false);

export const eid = writable<string>(undefined);

export const mediaKey = writable<string>(undefined);

export const duration = writable(0);

export const current = writable(0);
