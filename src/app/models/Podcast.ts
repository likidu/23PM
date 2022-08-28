import type { Color } from './Color';
import type { Image } from './Image';
import type { User } from './User';

export type PodcastType = typeof PodcastType[keyof typeof PodcastType];

const PodcastType = {
  PODCAST: 'PODCAST',
} as const;

export type PodcastSyncMode = typeof PodcastSyncMode[keyof typeof PodcastSyncMode];

const PodcastSyncMode = {
  RSS: 'RSS',
} as const;

export type PodcastSubscriptionStatus = typeof PodcastSubscriptionStatus[keyof typeof PodcastSubscriptionStatus];

const PodcastSubscriptionStatus = {
  OFF: 'OFF',
  ON: 'ON',
} as const;

export type PodcastStatus = typeof PodcastStatus[keyof typeof PodcastStatus];

const PodcastStatus = {
  NORMAL: 'NORMAL',
} as const;

export interface Podcast {
  type: PodcastType;
  pid: string;
  title: string;
  author: string;
  description: string;
  subscriptionCount: number;
  image: Image;
  color: Color;
  syncMode: PodcastSyncMode;
  episodeCount: number;
  latestEpisodePubDate: string;
  subscriptionStatus: PodcastSubscriptionStatus;
  subscriptionPush: boolean;
  subscriptionStar: boolean;
  status: PodcastStatus;
  payEpisodeCount: number;
  podcasters: User[];
}
