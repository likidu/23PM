type Dispatch = (name: string, detail?: any) => void;

export interface Player {
  set src(arg: string);
  get currentTime(): number;
  play(): void;
  pause(): void;
  wind(arg: number);
}

class PlayerInstance implements Player {
  protected readonly instance: HTMLAudioElement;
  private static classInstance: PlayerInstance;

  constructor(dispatch: Dispatch) {
    this.instance = document.createElement('audio');
    // TODO: Figure out why
    this.instance.mozAudioChannelType = 'content';
    this.bindAudioEvent(this.instance, dispatch);
  }

  // Singleton
  static getInstance(dispatch: Dispatch) {
    if (!this.classInstance) {
      this.classInstance = new PlayerInstance(dispatch);
    }
    return this.classInstance;
  }

  get currentTime() {
    return this.instance.currentTime;
  }

  set src(url: string) {
    this.instance.src = url;
  }

  async play() {
    try {
      await this.instance.play();
    } catch (error) {
      console.error(error);
    }
  }

  pause() {
    this.instance.pause();
  }

  wind(seconds: number) {
    this.instance.currentTime += seconds;
  }

  private bindAudioEvent(player: HTMLAudioElement, dispatch: Dispatch) {
    const events = [
      'abort',
      'canplay',
      'canplaythrough',
      'durationchange',
      'emptied',
      'ended',
      'error',
      'loadeddata',
      'loadedmetadata',
      'loadstart',
      'mozaudioavailable',
      'pause',
      'play',
      'playing',
      'progress',
      'ratechange',
      'seeked',
      'seeking',
      'stalled',
      'suspend',
      'timeupdate',
      'volumechange',
      'waiting',
    ];
    events.forEach((name) => {
      player.addEventListener(name, (ev) => dispatch(name, ev));
    });
  }
}

export const createPlayer = (dispatch: Dispatch) => PlayerInstance.getInstance(dispatch);
