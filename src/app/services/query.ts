/**
 * svelte-query
 **/

import { useQuery } from '@sveltestack/svelte-query';
import type { DiscoveryList, EditorPickList, Episode, InboxList, Media } from '../models';
import client from './client';

// Discovery list
const discoveryList = async (type?: string): Promise<DiscoveryList> => {
  const request = type ? { returnAll: false, type } : { returnAll: false };
  const { data } = await client.post('discovery-feed/list', request);
  return data;
};

export const useDiscoveryList = (type?: string) =>
  useQuery<DiscoveryList>(['discovery', type], () => discoveryList(type));

// Inbox list
const inboxList = async (limit = 10): Promise<InboxList> => {
  const { data } = await client.post('/inbox/list', { limit });
  return data;
};

export const useInboxList = () => useQuery('inbox', () => inboxList());

// Individual episode
const episode = async (eid: string): Promise<Episode> => {
  const { data } = await client.get(`/episode/get?eid=${eid}`);

  return data.data;
};

// Tip on use for multiple components: Episode and Player:
// https://github.com/SvelteStack/svelte-query/issues/95#issuecomment-1210381083
export const useEpisode = (eid: string) =>
  useQuery(['episode', eid], () => episode(eid), { enabled: !!eid, refetchOnWindowFocus: false });
