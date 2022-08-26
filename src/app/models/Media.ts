export type MediaSourceMode =
  typeof MediaSourceMode[keyof typeof MediaSourceMode];

// eslint-disable-next-line @typescript-eslint/no-redeclare
const MediaSourceMode = {
  PUBLIC: 'PUBLIC',
} as const;

interface MediaSource {
  mode: MediaSourceMode;
  url: string;
}

export interface Media {
  id: string;
  size: number;
  mimeType: string;
  source: MediaSource;
  backupSource: MediaSource;
}
