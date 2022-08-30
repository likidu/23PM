import type { Image } from './Image';
import type { Podcast } from './Podcast';

export type MediaSourceMode = typeof MediaSourceMode[keyof typeof MediaSourceMode];

// eslint-disable-next-line @typescript-eslint/no-redeclare
const MediaSourceMode = {
  PUBLIC: 'PUBLIC',
} as const;

interface MediaSource {
  mode: MediaSourceMode;
  url: string;
}

export interface MediaContent {
  id: string;
  size: number;
  mimeType: string;
  source: MediaSource;
  backupSource: MediaSource;
}

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
  media: MediaContent;
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
