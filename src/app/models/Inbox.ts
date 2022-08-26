import type { Episode } from './Episode';

type LoadMoreKey = {
  pubDate: string;
  id: string;
};

export type InboxList = {
  loadMoreKey: LoadMoreKey;
  data: Episode[];
};
