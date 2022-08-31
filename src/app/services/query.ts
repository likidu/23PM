/**
 * svelte-query
 **/

import { useQuery } from '@sveltestack/svelte-query';
import type { Episode, InboxList, Media } from '../models';
import client from './client';

const inboxList = async (limit = 10): Promise<InboxList> => {
  const { data } = await client.post('/inbox/list', { limit });
  return data;
};

export const useInboxList = () => useQuery('inbox', () => inboxList());

const episode = async (eid: string): Promise<Episode> => {
  const { data } = await client.get(`/episode/get?eid=${eid}`);

  return data.data;
};

// Tip on use for multiple components: Episode and Player
export const useEpisode = (eid: string) => useQuery('episode', () => episode(eid), { refetchOnWindowFocus: false });

// const media = (eid: string, mediaKey: string, duration: number): Promise<Media> =>
//   Promise.resolve({
//     eid,
//     mediaKey,
//     duration,
//     progress: 0,
//     paused: true,
//   });

// export const useMedia = (eid: string, mediaKey: string, duration: number) =>
//   useQuery('media', () => media(eid, mediaKey, duration), { enabled: !!mediaKey });
