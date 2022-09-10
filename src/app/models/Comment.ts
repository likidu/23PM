import type { UserBase } from './User';

type CommentUser = UserBase & { relation: 'STRANGE'; ipLoc?: string };

type Owner = {
  id: string;
  type: 'EPISODE';
};

export type Comment = {
  id: string;
  type: 'COMMENT';
  owner: Owner;
  author: CommentUser;
  authorAssociation: 'NONE';
  text: string;
  level: number;
  likeCount: number;
  liked: boolean;
  createAt: string;
  status: 'NORMAL';
};

type LoadMoreKey = {
  direction: 'NEXT';
  hotSortScore: number;
  id: string;
};

export type CommentList = {
  data: [Comment];
  loadNextKey: LoadMoreKey;
  loadMoreKey: LoadMoreKey;
  totalCount: number;
};
