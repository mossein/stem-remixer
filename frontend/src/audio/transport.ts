import { resumeContext } from "./engine";
import { AudioTrack } from "./track";
import { useMixerStore } from "../store/mixerStore";

class Transport {
  private tracks: AudioTrack[] = [];
  private animFrame: number | null = null;
  private _isPlaying = false;

  setTracks(tracks: AudioTrack[]) {
    this.stop();
    this.tracks = tracks;
  }

  async play() {
    if (this._isPlaying) return;
    await resumeContext();
    this._isPlaying = true;
    useMixerStore.getState().setPlaying(true);

    const promises = this.tracks.map((t) => t.getAudioElement().play());
    await Promise.all(promises);

    this.startTimeSync();
  }

  pause() {
    if (!this._isPlaying) return;
    this._isPlaying = false;
    useMixerStore.getState().setPlaying(false);
    this.tracks.forEach((t) => t.getAudioElement().pause());
    this.stopTimeSync();
  }

  stop() {
    this.pause();
    this.tracks.forEach((t) => {
      t.getAudioElement().currentTime = 0;
    });
    useMixerStore.getState().setCurrentTime(0);
  }

  seek(time: number) {
    this.tracks.forEach((t) => {
      t.getAudioElement().currentTime = time;
    });
    useMixerStore.getState().setCurrentTime(time);
  }

  setTempo(ratio: number) {
    this.tracks.forEach((t) => {
      const el = t.getAudioElement();
      el.preservesPitch = true;
      el.playbackRate = ratio;
    });
  }

  setLoop(enabled: boolean, start: number, end: number) {
    // Loop is handled via timeupdate events since MediaElement doesn't
    // support built-in loop regions
    this.tracks.forEach((t) => {
      const el = t.getAudioElement();
      el.ontimeupdate = enabled
        ? () => {
            if (el.currentTime >= end) {
              el.currentTime = start;
            }
          }
        : null;
    });
  }

  get isPlaying() {
    return this._isPlaying;
  }

  private startTimeSync() {
    const sync = () => {
      if (!this._isPlaying) return;
      const el = this.tracks[0]?.getAudioElement();
      if (el) {
        useMixerStore.getState().setCurrentTime(el.currentTime);

        // Check for track end
        if (el.ended) {
          const store = useMixerStore.getState();
          if (store.loopEnabled) {
            this.seek(store.loopStart);
            this.tracks.forEach((t) => t.getAudioElement().play());
          } else {
            this.stop();
            return;
          }
        }
      }
      this.animFrame = requestAnimationFrame(sync);
    };
    this.animFrame = requestAnimationFrame(sync);
  }

  private stopTimeSync() {
    if (this.animFrame !== null) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  dispose() {
    this.stop();
    this.tracks.forEach((t) => t.dispose());
    this.tracks = [];
  }
}

export const transport = new Transport();
