class AudioManager {
  context: AudioContext | null = null;
  effects = Number(localStorage.getItem("order:effects") ?? ".3");
  music = Number(localStorage.getItem("order:music") ?? ".3");
  ambient = Number(localStorage.getItem("order:ambient") ?? ".2");
  player: HTMLAudioElement | null = null;
  unlocked = false;
  unlock() {
    this.context ||= new AudioContext();
    void this.context.resume();
    this.unlocked = true;
  }
  tone(kind: "click" | "open" | "card" | "dice" | "turn" = "click") {
    if (!this.unlocked || !this.context || !this.effects) return;
    const ctx = this.context,
      osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = kind === "open" ? "sine" : "triangle";
    osc.frequency.setValueAtTime(
      kind === "open"
        ? 60
        : kind === "turn"
          ? 260
          : kind === "dice"
            ? 480
            : kind === "card"
              ? 340
              : 500,
      ctx.currentTime,
    );
    osc.frequency.exponentialRampToValueAtTime(
      kind === "open" ? 110 : 80,
      ctx.currentTime + 0.2,
    );
    gain.gain.setValueAtTime(this.effects * 0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }
  sync(data: { url: string; startedAt: number; playing: boolean }) {
    if (this.player) {
      this.player.pause();
      this.player = null;
    }
    if (!this.unlocked || !data.playing || !data.url) return;
    const a = new Audio(data.url);
    a.loop = true;
    a.volume = this.ambient;
    this.player = a;
    a.onloadedmetadata = () => {
      if (Number.isFinite(a.duration) && a.duration > 0)
        a.currentTime = ((Date.now() - data.startedAt) / 1000) % a.duration;
      void a.play().catch(() => {});
    };
  }
  stop() {
    this.player?.pause();
    this.player = null;
  }
  set(channel: "effects" | "music" | "ambient", value: number) {
    this[channel] = value;
    localStorage.setItem(`order:${channel}`, String(value));
    if (channel === "ambient" && this.player) this.player.volume = value;
  }
}
export const audio = new AudioManager();
