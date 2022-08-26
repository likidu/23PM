import type { Image } from './Image';
import type { Media } from './Media';
import type { Podcast } from './Podcast';

export type EpisodeType = typeof EpisodeType[keyof typeof EpisodeType];

const EpisodeType = {
  EPISODE: 'EPISODE',
} as const;

export type EpisodeStatus = typeof EpisodeStatus[keyof typeof EpisodeStatus];

const EpisodeStatus = {
  NORMAL: 'NORMAL',
} as const;

export interface Episode {
  type: EpisodeType;
  eid: string;
  pid: string;
  title: string;
  shownotes: string;
  description: string;
  image: Image;
  isPrivateMedia: boolean;
  mediaKey: string;
  media: Media;
  clapCount: number;
  commentCount: number;
  playCount: number;
  favoriteCount: number;
  pubDate: string;
  status: EpisodeStatus;
  duration: number;
  podcast: Podcast;
  isPlayed: boolean;
  isFinished: boolean;
  isPicked: boolean;
  isFavorited: boolean;
}
