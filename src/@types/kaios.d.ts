export {};

interface VolumeManager {
  requestUp: () => void;
  requestDown: () => void;
  requestShow: () => void;
}

type MozAudioChannelType =
  | 'alarm'
  | 'content'
  | 'normal'
  | 'notification'
  | 'publicnotification'
  | 'ringer'
  | 'telephony';

declare global {
  interface Navigator {
    volumeManager: VolumeManager;
  }

  // Enum: https://github.com/mozilla/scanjs/blob/master/common/rules.json
  interface HTMLAudioElement {
    mozAudioChannelType: MozAudioChannelType;
  }
}

declare module 'preact' {
  namespace JSX {
    interface HTMLAttributes {
      mozAudioChannelType?: MozAudioChannelType;
    }
  }
}
