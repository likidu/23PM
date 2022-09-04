/**
 * svelte-query
 **/

import { useQuery } from '@sveltestack/svelte-query';
import type { EditorPickList, Episode, InboxList, Media } from '../models';
import client from './client';

// Editor pick list
const editorPickList = async (limit = 1): Promise<EditorPickList> => {
  const { data } = await client.post('editor-pick/list', { limit });
  return data;
};

export const useEditorPickList = () => useQuery<EditorPickList>('editor-pick', () => editorPickList());

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
