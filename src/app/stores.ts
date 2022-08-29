import { writable } from 'svelte/store';
import type { MenuItem, Player, User } from './models';

export const user = writable<User>(undefined);

export const menu = writable<MenuItem[]>([]);

export const mobilePhoneNumber = writable('');

export const player = writable<Player | {}>({});
