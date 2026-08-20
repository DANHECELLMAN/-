// =========================================================
// 音效系统 (Web Audio API 合成音效，无外部资源依赖，防并发崩溃)
// =========================================================

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.lastPlayTimes = {};
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    // 限流保护：避免高频触发相同音效导致移动端音频线程崩溃
    _canPlay(name, cooldownMs = 60) {
        if (this.isMuted || !this.ctx) return false;
        const now = performance.now();
        if (this.lastPlayTimes[name] && now - this.lastPlayTimes[name] < cooldownMs) {
            return false;
        }
        this.lastPlayTimes[name] = now;
        return true;
    }

    playShoot() {
        if (!this._canPlay('shoot', 80)) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.08);

            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch (e) {}
    }

    playHit() {
        if (!this._canPlay('hit', 50)) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(160, this.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.06);

            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.06);
        } catch (e) {}
    }

    playDash() {
        if (!this._canPlay('dash', 200)) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.15);
        } catch (e) {}
    }

    playPickup() {
        if (!this._canPlay('pickup', 40)) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.04); // E5

            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch (e) {}
    }

    playLevelUp() {
        if (this.isMuted || !this.ctx) return;
        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C-E-G-C
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;

                const start = this.ctx.currentTime + i * 0.08;
                gain.gain.setValueAtTime(0.15, start);
                gain.gain.linearRampToValueAtTime(0.01, start + 0.15);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(start);
                osc.stop(start + 0.15);
            });
        } catch (e) {}
    }

    playGameOver() {
        if (this.isMuted || !this.ctx) return;
        try {
            const notes = [300, 260, 220, 180];
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;

                const start = this.ctx.currentTime + i * 0.12;
                gain.gain.setValueAtTime(0.12, start);
                gain.gain.linearRampToValueAtTime(0.01, start + 0.18);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(start);
                osc.stop(start + 0.18);
            });
        } catch (e) {}
    }
}

export const sound = new SoundManager();
