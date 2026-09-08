// Web Audio API 原生程序化音效与全沉浸古风 BGM 引擎 v5
// （古琴、琵琶、尺八洞箫、编钟雅乐、战鼓紧锣密鼓、环境声全合成，零外部音频文件依赖）

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.bgmEnabled = true;
    this.isSecondPlaythrough = false;

    // BGM 控制状态
    this.currentBgmScene = null;
    this.bgmTimer = null;
    this.bgmNodes = [];
    this.masterBgmGain = null;
    this.bgmStep = 0;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterBgmGain = this.ctx.createGain();
        this.masterBgmGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
        this.masterBgmGain.connect(this.ctx.destination);
      }
    } catch (error) {
      // file:// 预览或受限 WebView 禁用音频时，剧情仍可继续。
      this.enabled = false;
      console.warn("Audio unavailable:", error);
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopBGM();
    } else if (this.currentBgmScene) {
      this.playBGM(this.currentBgmScene);
    }
    return this.enabled;
  }

  vibrate(pattern) {
    if (!this.enabled) return;
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {}
  }

  // ==========================================
  // 🎵 1. 原生程序化古风乐器物理建模合成器
  // ==========================================

  // 【古琴 · 散音/按音/泛音与吟猱滑音】
  synthesizeGuqin(freq, duration = 2.4, slideTo = null, isHarmonic = false, volume = 0.35) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = isHarmonic ? "sine" : "triangle";
    osc2.type = "sine";

    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * (isHarmonic ? 2.0 : 1.002), now);

    if (slideTo) {
      osc1.frequency.exponentialRampToValueAtTime(slideTo, now + duration * 0.7);
      osc2.frequency.exponentialRampToValueAtTime(slideTo * 1.002, now + duration * 0.7);
    }

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(isHarmonic ? 3200 : 1400, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(volume * 0.4, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterBgmGain || this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  // 【琵琶 · 清脆弹挑与快速琶音】
  synthesizePipa(freq, duration = 1.0, volume = 0.28) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(freq, now);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(freq * 1.8, now);
    if (filter.Q && filter.Q.setValueAtTime) filter.Q.setValueAtTime(3.5, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterBgmGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // 【尺八/洞箫 · 气息感与悠扬颤音】
  synthesizeXiao(freq, duration = 3.2, volume = 0.25) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // 气息白噪声微量融合
    const bufferSize = this.ctx.sampleRate * 0.2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * 0.15;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(freq * 1.2, now);
    if (noiseFilter.Q && noiseFilter.Q.setValueAtTime) noiseFilter.Q.setValueAtTime(2.0, now);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.04, now);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    // 气震音微调
    osc.frequency.linearRampToValueAtTime(freq * 1.015, now + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(freq, now + duration);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(850, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(filter);
    filter.connect(gain);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gain);

    gain.connect(this.masterBgmGain || this.ctx.destination);

    osc.start(now);
    if (noiseSource.start) noiseSource.start(now);
    osc.stop(now + duration);
    if (noiseSource.stop) noiseSource.stop(now + duration);
  }

  // 【编钟/磬/铜锣 · 宫廷金属泛音】
  synthesizeBianzhong(freq, duration = 3.5, volume = 0.3) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const partials = [1.0, 1.58, 2.76, 3.42];
    const gains = [0.6, 0.25, 0.12, 0.05];

    partials.forEach((ratio, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * ratio, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * gains[i], now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration / (ratio * 0.6));

      osc.connect(gain);
      gain.connect(this.masterBgmGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    });
  }

  // 【堂鼓/战鼓 · 低频厚重击打】
  synthesizeWarDrum(pitch = 75, duration = 0.35, volume = 0.45) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterBgmGain || this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  // ==========================================
  // 🎼 2. 六折剧情全沉浸 BGM 乐章调度系统
  // ==========================================

  playBGM(scene) {
    this.resume();
    this.currentBgmScene = scene;
    if (!this.enabled || !this.ctx) return;

    this.stopBGM(false);
    this.bgmStep = 0;

    // 宫商角徵羽五声音阶频率表
    const P = {
      C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00, A3: 220.00,
      C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
      C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00
    };

    if (scene === "beat1") {
      // 拍①【逼】：凄风苦雨 · 萧瑟尺八与压抑低频风声
      const xiaoMelody = [P.D4, P.E4, P.A3, P.D4, P.C4, P.A3];
      this.bgmTimer = setInterval(() => {
        if (!this.enabled) return;
        const note = xiaoMelody[this.bgmStep % xiaoMelody.length];
        this.synthesizeXiao(note, 3.8, 0.22);
        if (this.bgmStep % 2 === 0) {
          this.synthesizeWarDrum(55, 0.6, 0.25);
        }
        this.bgmStep++;
      }, 3400);
      this.synthesizeXiao(xiaoMelody[0], 3.8, 0.22);

    } else if (scene === "beat2") {
      // 拍②【捕】：月黑古庙 · 空灵古琴散音与幽虫草际呢喃
      const qinMelody = [
        { f: P.D3, s: P.E3 }, { f: P.G3, s: null }, { f: P.A3, s: P.C4 },
        { f: P.D4, s: null }, { f: P.C4, s: P.A3 }, { f: P.G3, s: null }
      ];
      this.bgmTimer = setInterval(() => {
        if (!this.enabled) return;
        const item = qinMelody[this.bgmStep % qinMelody.length];
        this.synthesizeGuqin(item.f, 2.8, item.s, this.bgmStep % 3 === 0, 0.28);
        this.bgmStep++;
      }, 2600);
      this.synthesizeGuqin(qinMelody[0].f, 2.8, qinMelody[0].s, false, 0.28);

    } else if (scene === "beat3") {
      // 拍③【养】：案头温情 · 五音流水琵琶与喜悦轻鸣
      const pipaArp = [P.C4, P.E4, P.G4, P.A4, P.C5, P.A4, P.G4, P.E4];
      this.bgmTimer = setInterval(() => {
        if (!this.enabled) return;
        const note = pipaArp[this.bgmStep % pipaArp.length];
        this.synthesizePipa(note, 1.2, 0.2);
        if (this.bgmStep % 4 === 0) {
          this.synthesizeGuqin(P.C3, 3.0, null, false, 0.25);
        }
        this.bgmStep++;
      }, 800);

    } else if (scene === "beat4") {
      // 拍④【祸】：大悲无声 · 音乐骤停，唯有凄厉单音洞箫与枯井水滴
      this.synthesizeXiao(P.A3, 4.5, 0.18);
      this.bgmTimer = setInterval(() => {
        if (!this.enabled) return;
        if (this.bgmStep % 3 === 0) {
          this.synthesizeXiao(P.D3, 4.0, 0.15);
        } else if (this.bgmStep % 3 === 1) {
          this.playWaterDrop();
        }
        this.bgmStep++;
      }, 4200);

    } else if (scene === "beat5") {
      // 拍⑤【斗】：斗场风云 · 紧锣密鼓战鼓与十面埋伏扫弦
      const combatPipa = [P.D4, P.D4, P.E4, P.G4, P.A4, P.D5, P.A4, P.G4];
      this.bgmTimer = setInterval(() => {
        if (!this.enabled) return;
        const note = combatPipa[this.bgmStep % combatPipa.length];
        this.synthesizePipa(note, 0.45, 0.26);

        if (this.bgmStep % 2 === 0) {
          this.synthesizeWarDrum(85, 0.25, 0.35);
        }
        if (this.bgmStep % 4 === 0) {
          this.synthesizeWarDrum(110, 0.2, 0.4);
        }
        this.bgmStep++;
      }, 360);

    } else if (scene === "beat5_palace") {
      // 拍⑤【御案弄乐】：金銮殿编钟雅乐与庄严宫廷五音
      const palaceScale = [P.C4, P.D4, P.E4, P.G4, P.A4, P.C5];
      this.bgmTimer = setInterval(() => {
        if (!this.enabled) return;
        const note = palaceScale[this.bgmStep % palaceScale.length];
        this.synthesizeBianzhong(note, 3.2, 0.35);
        this.bgmStep++;
      }, 1600);
      this.synthesizeBianzhong(palaceScale[0], 3.2, 0.35);

    } else if (scene === "beat6") {
      // 拍⑥【苏】：梦醒照见 · 悠扬空灵古琴泛音与深沉长鸣
      const awakeQin = [P.G3, P.A3, P.D4, P.E4, P.G4, P.D4];
      this.bgmTimer = setInterval(() => {
        if (!this.enabled) return;
        const note = awakeQin[this.bgmStep % awakeQin.length];
        this.synthesizeGuqin(note, 3.5, null, true, 0.32);
        this.bgmStep++;
      }, 3200);
      this.synthesizeGuqin(awakeQin[0], 3.5, null, true, 0.32);
    }
  }

  stopBGM(clearScene = true) {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (clearScene) this.currentBgmScene = null;
  }

  // ==========================================
  // 💥 3. 战斗与高保真微交互音效合成器
  // ==========================================

  playSpatialChirp(pan = 0, distFactor = 0.5) {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const masterGain = this.ctx.createGain();

    const vol = Math.max(0.08, 0.45 * (1.0 - distFactor * 0.8));
    const duration = 0.16 + (1.0 - distFactor) * 0.1;

    carrier.type = "sine";
    carrier.frequency.setValueAtTime(4500, now);
    carrier.frequency.exponentialRampToValueAtTime(4100, now + duration);

    modulator.type = "triangle";
    modulator.frequency.setValueAtTime(60, now);

    modGain.gain.setValueAtTime(1100, now);
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(vol, now + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    carrier.connect(masterGain);

    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
      masterGain.connect(panner);
      panner.connect(this.ctx.destination);
    } else {
      masterGain.connect(this.ctx.destination);
    }

    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + duration);
    modulator.stop(now + duration);
  }

  playChildHumming(pan = 0, distFactor = 0.5) {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.linearRampToValueAtTime(392, now + 0.3);
    osc.frequency.linearRampToValueAtTime(330, now + 0.6);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(650, now);

    const vol = Math.max(0.02, 0.12 * (1.0 - distFactor * 0.7));
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);

    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), now);
      gain.connect(panner);
      panner.connect(this.ctx.destination);
    } else {
      gain.connect(this.ctx.destination);
    }

    osc.start(now);
    osc.stop(now + 0.65);
  }

  playChirp(duration = 0.22, volume = 0.35) {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const masterGain = this.ctx.createGain();

    carrier.type = "sine";
    carrier.frequency.setValueAtTime(4500, now);
    carrier.frequency.exponentialRampToValueAtTime(4100, now + duration);

    modulator.type = "triangle";
    modulator.frequency.setValueAtTime(60, now);

    modGain.gain.setValueAtTime(1100, now);
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(volume, now + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    carrier.connect(masterGain);
    masterGain.connect(this.ctx.destination);

    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + duration);
    modulator.stop(now + duration);
  }

  playBurstChirps(count = 3) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.playChirp(0.16, 0.3), i * 110);
    }
  }

  playHeavyCaneHit() {
    this.resume();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    // 低频沉重木质钝击
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
    
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);

    // 骨肉碎裂高频脆响
    const noise = this.ctx.createOscillator();
    const nGain = this.ctx.createGain();
    noise.type = "sawtooth";
    noise.frequency.setValueAtTime(300, now);
    noise.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    nGain.gain.setValueAtTime(0.4, now);
    nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    noise.connect(nGain);
    nGain.connect(this.masterGain || this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.15);
    this.vibrate([60, 40, 100]);
  }

  playGrainCrunch() {
    this.resume();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800 + Math.random() * 300, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
    this.vibrate(10);
  }

  playTaijiParry() {
    this.resume();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    // 空灵编钟金石之音 + 破风回旋
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(550, now + 0.6);
    
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    
    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
    this.vibrate([20, 30, 80]);
  }

  playCaneHit() {
    this.vibrate(120);
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

    const bufferSize = this.ctx.sampleRate * 0.15;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(70, now + 0.2);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(0.75, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(now);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playStrawTickle() {
    this.vibrate(15);
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.linearRampToValueAtTime(1500, now + 0.1);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playBite() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.09);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playParry() {
    this.vibrate(35);
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1050, now);
    osc.frequency.exponentialRampToValueAtTime(1600, now + 0.22);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  playCriticalHitHole() {
    this.vibrate([50, 40, 110]);
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bass = this.ctx.createOscillator();
    const bGain = this.ctx.createGain();
    bass.type = "triangle";
    bass.frequency.setValueAtTime(120, now);
    bass.frequency.exponentialRampToValueAtTime(20, now + 0.1);
    bGain.gain.setValueAtTime(0.7, now);
    bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    bass.connect(bGain);
    bGain.connect(this.ctx.destination);
    bass.start(now);
    bass.stop(now + 0.1);
  }

  playQinDanceStep(step = 0) {
    this.vibrate(25);
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
    const pitch = scale[step % scale.length];
    this.synthesizeBianzhong(pitch, 2.5, 0.4);
  }

  playPaperFlip() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.07);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  playInkBleed() {
    this.vibrate([30, 40, 160]);
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(85, now);
    osc.frequency.exponentialRampToValueAtTime(18, now + 0.5);

    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playRoosterSquawk() {
    this.vibrate([60, 40, 80]);
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.linearRampToValueAtTime(300, now + 0.35);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  playLidOpen() {
    this.vibrate(25);
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.18);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  playWaterDrop() {
    this.vibrate([20, 30, 40]);
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.25);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playHeartbeat() {
    this.vibrate([40, 60, 40]);
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }
}

export const sound = new SoundEngine();
