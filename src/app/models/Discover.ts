import type { Comment } from './Comment';
import type { Episode } from './Episode';

type Pick = {
  episode: Episode;
  comment: Comment;
};

type Picks = {
  date: string;
  picks: Pick[];
};

export type EditorPickList = {
  data: Picks[];
  loadMoreKey: string;
};
