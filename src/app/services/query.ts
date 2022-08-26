/**
 * svelte-query
 **/

import { useQuery } from '@sveltestack/svelte-query';
import type { InboxList } from '../models';
import client from './client';

const inboxList = async (limit = 10): Promise<InboxList> => {
  const { data } = await client.post('/inbox/list', { limit });
  return data;
};

export const useInboxList = () =>
  useQuery<InboxList>('inbox', () => inboxList());
