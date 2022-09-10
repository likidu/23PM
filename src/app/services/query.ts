/**
 * Requests that will save to store using svelte-query
 **/

import { useQuery, useInfiniteQuery } from '@sveltestack/svelte-query';
import type { DiscoveryList, Episode, CommentList, InboxList, EpisodeList, Podcast } from '../models';
import { httpClient } from './httpClient';

// Discovery list
const discoveryList = async (type?: string): Promise<DiscoveryList> => {
  const request = type ? { returnAll: false, type } : { returnAll: false };
  const { data } = await httpClient.post('discovery-feed/list', request);
  return data;
};

export const useDiscoveryList = (type?: string) =>
  useQuery<DiscoveryList>(['discovery', type], () => discoveryList(type));

// Inbox List
const inboxList = async (limit = 10): Promise<InboxList> => {
  const { data } = await httpClient.post('/inbox/list', { limit });
  return data;
};

export const useInboxList = () => useQuery('inbox-list', () => inboxList());

// Individual Episode
const episode = async (eid: string): Promise<Episode> => {
  const { data } = await httpClient.get(`/episode/get?eid=${eid}`);
  return data.data;
};

// Tip on use for multiple components: Episode and Player:
// https://github.com/SvelteStack/svelte-query/issues/95#issuecomment-1210381083
export const useEpisode = (eid: string) =>
  useQuery(['episode', eid], () => episode(eid), { enabled: !!eid, refetchOnWindowFocus: false });

// Podcast
const podcast = async (pid: string): Promise<Podcast> => {
  const { data } = await httpClient.get(`/podcast/get?pid=${pid}`);
  return data.data;
};

export const usePodcast = (pid: string) => useQuery(['podcast', pid], () => podcast(pid));

// Episode List
const episodeList = async (pid: string, limit = 20): Promise<EpisodeList> => {
  const { data } = await httpClient.post('/episode/list', { pid, limit });
  return data;
};

export const useEpisodeList = (pid: string) => useQuery('episode-list', () => episodeList(pid));

// Comment list
const commentList = async (eid: string, pageParam?): Promise<CommentList> => {
  // TODO: Set right type for request
  let request: any = { order: 'HOT', owner: { type: 'EPISODE', id: eid } };
  if (pageParam) request = { loadMoreKey: pageParam, ...request };
  const { data } = await httpClient.post('/comment/list-primary', request);
  return data;
};

export const useCommentList = (eid: string) =>
  useInfiniteQuery(['comment-list', eid], () => commentList(eid), {
    getNextPageParam: (lastList) => {
      console.log(`lastList: ${JSON.stringify(lastList.loadMoreKey)}`);

      return lastList.loadMoreKey ? lastList.loadMoreKey : undefined;
    },
    retry: false,
  });
