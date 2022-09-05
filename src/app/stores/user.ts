import { writable } from 'svelte/store';
import type { MenuItem, User } from '../models';

export const user = writable<User>(undefined);

export const menu = writable<MenuItem[]>([]);
