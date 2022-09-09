/**
 * svelte-query
 **/

import { useQuery } from '@sveltestack/svelte-query';
import type { DiscoveryList, Episode, InboxList, EpisodeList, Podcast } from '../models';
import client from './client';

// Discovery list
const discoveryList = async (type?: string): Promise<DiscoveryList> => {
  const request = type ? { returnAll: false, type } : { returnAll: false };
  const { data } = await client.post('discovery-feed/list', request);
  return data;
};

export const useDiscoveryList = (type?: string) =>
  useQuery<DiscoveryList>(['discovery', type], () => discoveryList(type));

// Inbox List
const inboxList = async (limit = 10): Promise<InboxList> => {
  const { data } = await client.post('/inbox/list', { limit });
  return data;
};

export const useInboxList = () => useQuery('inbox-list', () => inboxList());

// Individual Episode
const episode = async (eid: string): Promise<Episode> => {
  const { data } = await client.get(`/episode/get?eid=${eid}`);
  return data.data;
};

// Tip on use for multiple components: Episode and Player:
// https://github.com/SvelteStack/svelte-query/issues/95#issuecomment-1210381083
export const useEpisode = (eid: string) =>
  useQuery(['episode', eid], () => episode(eid), { enabled: !!eid, refetchOnWindowFocus: false });

// Podcast
const podcast = async (pid: string): Promise<Podcast> => {
  const { data } = await client.get(`/podcast/get?pid=${pid}`);
  return data.data;
};

export const usePodcast = (pid: string) => useQuery(['podcast', pid], () => podcast(pid));

// Episode List
const episodeList = async (pid: string, limit = 20): Promise<EpisodeList> => {
  const { data } = await client.post('/episode/list', { pid, limit });
  return data;
};

export const useEpisodeList = (pid: string) => useQuery('episode-list', () => episodeList(pid));
