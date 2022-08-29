type Dispatch = (name: string, detail?: any) => void;

export class Player {
  private player: HTMLAudioElement;

  constructor(dispatch: Dispatch) {
    this.player = document.createElement('audio');
    this.bindAudioEvent(this.player, dispatch);
  }

  get paused() {
    return this.player.paused;
  }

  set src(url: string) {
    this.player.src = url;
  }

  async play() {
    try {
      await this.player.play();
    } catch (error) {
      console.error(error);
    }
  }

  pause() {
    this.player.pause();
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
