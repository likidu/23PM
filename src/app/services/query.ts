/**
 * svelte-query
 **/

import { useQuery } from '@sveltestack/svelte-query';
import type { Episode, InboxList } from '../models';
import client from './client';

const inboxList = async (limit = 10) => {
  const { data } = await client.post('/inbox/list', { limit });
  return data;
};

export const useInboxList = () => useQuery<InboxList>('inbox', () => inboxList());

const episode = async (eid: string) => {
  const { data } = await client.get(`/episode/get?eid=${eid}`);

  return data.data;
};

// Tip on use for multiple components: Episode and Player
export const useEpisode = (eid) =>
  useQuery<Episode>(['episode', 'player'], () => episode(eid), { refetchOnWindowFocus: false });
