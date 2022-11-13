/**
 * Requests that will save to store using svelte-query
 **/

import { useQuery, useInfiniteQuery } from '@sveltestack/svelte-query';
import type {
  DiscoveryList,
  Episode,
  CommentListRequest,
  CommentLoadMoreKey,
  CommentList,
  InboxList,
  EpisodeList,
  Podcast,
  SearchPreset,
  SearchResultList,
  UserStats,
} from '../models';
import { httpClient } from './httpClient';

// User stats
const userStats = async (uid: string): Promise<UserStats> => {
  const { data } = await httpClient.get(`/user-stats/get?uid=${uid}`);
  return data.data;
};

export const useUserStats = (uid: string) => useQuery('user-stats', () => userStats(uid));

// Discovery list
const discoveryList = async (): Promise<DiscoveryList> => {
  const request = { returnAll: false };

  const { data } = await httpClient.post('/discovery-feed/list', request);
  return data;
};

// {querykey, pageParam} are what pass to the queryFn
export const useDiscoveryList = () => useQuery(['discovery'], () => discoveryList());

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
const commentList = async (eid: string, pageParam: CommentLoadMoreKey): Promise<CommentList> => {
  let request: CommentListRequest = { order: 'HOT', owner: { type: 'EPISODE', id: eid } };
  if (pageParam) request = { loadMoreKey: pageParam, ...request };

  const { data } = await httpClient.post('/comment/list-primary', request);
  return data;
};

// {querykey, pageParam} are what pass to the queryFn
export const useCommentList = (eid: string) =>
  useInfiniteQuery(['comment-list', eid], ({ pageParam }) => commentList(eid, pageParam), {
    getNextPageParam: (lastList) => {
      return lastList.loadMoreKey ? lastList.loadMoreKey : undefined;
    },
    retry: false,
  });

// Search Suggestions
const searchPreset = async (): Promise<SearchPreset[]> => {
  const { data } = await httpClient.get('/search/get-preset');
  return data.data;
};

export const useSearchPreset = () => useQuery('search-preset', () => searchPreset());

// Search
const searchResultList = async (keyword: string): Promise<SearchResultList> => {
  const request = { keyword, limit: 20, type: 'ALL' };
  const { data } = await httpClient.post('search/create', request);
  return data;
};

export const useSearchResultList = (keyword: string) => useQuery('search-result', () => searchResultList(keyword));
