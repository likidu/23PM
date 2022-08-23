/**
 * Generated by orval v6.9.6 🍺
 * Do not edit manually.
 * Swagger Petstore
 * OpenAPI spec version: 1.0.0
 */
import type { EpisodeType } from './episodeType';
import type { Image } from './image';
import type { Media } from './media';
import type { EpisodeStatus } from './episodeStatus';
import type { Podcast } from './podcast';

export interface Episode {
  type?: EpisodeType;
  eid?: string;
  pid?: string;
  title?: string;
  shownotes?: string;
  description?: string;
  image?: Image;
  isPrivateMedia?: boolean;
  mediaKey: string;
  media?: Media;
  clapCount?: number;
  commentCount?: number;
  playCount?: number;
  favoriteCount?: number;
  pubDate?: string;
  status?: EpisodeStatus;
  duration: number;
  /** From which podcast */
  podcast?: Podcast;
  isPlayed?: boolean;
  isFinished?: boolean;
  isPicked?: boolean;
  isFavorited?: boolean;
}
