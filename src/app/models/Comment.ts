import type { UserBase } from './User';

type CommentUser = UserBase & { relation: 'STRANGE' };

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
