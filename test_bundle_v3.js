// mock dom v3

global.window = {
  addEventListener: () => {},
  devicePixelRatio: 2,
  AudioContext: class {
    createOscillator() { return { type: '', frequency: { setValueAtTime: ()=>{}, exponentialRampToValueAtTime: ()=>{}, linearRampToValueAtTime: ()=>{} }, connect: ()=>{}, start: ()=>{}, stop: ()=>{} }; }
    createGain() { return { gain: { setValueAtTime: ()=>{}, linearRampToValueAtTime: ()=>{}, exponentialRampToValueAtTime: ()=>{} }, connect: ()=>{} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
    createBufferSource() { return { connect: ()=>{}, start: ()=>{} }; }
    createBiquadFilter() { return { frequency: { setValueAtTime: ()=>{}, exponentialRampToValueAtTime: ()=>{} }, connect: ()=>{} }; }
    createStereoPanner() { return { pan: { setValueAtTime: ()=>{} }, connect: ()=>{} }; }
  }
};
global.document = {
  body: { appendChild: ()=>{} },
  getElementById: (id) => ({
    style: {},
    classList: { add: ()=>{}, remove: ()=>{} },
    appendChild: ()=>{},
    after: ()=>{},
    addEventListener: ()=>{},
    getBoundingClientRect: () => ({ width: 400, height: 260, left: 0, top: 0 }),
    getContext: () => ({
      fillRect: ()=>{}, strokeRect: ()=>{}, fillText: ()=>{}, stroke: ()=>{}, fill: ()=>{}, beginPath: ()=>{}, moveTo: ()=>{}, lineTo: ()=>{}, arc: ()=>{}, ellipse: ()=>{}, clearRect: ()=>{}, save: ()=>{}, restore: ()=>{}, translate: ()=>{}, scale: ()=>{}, rotate: ()=>{}, quadraticCurveTo: ()=>{}
    }),
    toDataURL: () => 'data:image/png;base64,mock',
    innerHTML: '',
    hidden: false
  }),
  querySelector: () => ({ style: {}, classList: { add: ()=>{}, remove: ()=>{} }, after: ()=>{} }),
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, classList: { add: ()=>{} }, appendChild: ()=>{}, remove: ()=>{}, addEventListener: ()=>{} })
};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.performance = { now: () => Date.now() };
// navigator mock

// 《促织》全维体验升级 v3 单文件版本
// Web Audio API 原生程序化音效合成器 v3（3D空间立体声＋触觉马达震动＋印泥渗透声）
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.isSecondPlaythrough = false;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      this.ctx = new AudioCtx();
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
    return this.enabled;
  }

  // 手机原生触觉马达振动封装
  vibrate(pattern) {
    if (!this.enabled) return;
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      // ignore
    }
  }

  // 3D 空间立体声蟋蟀鸣叫（戴耳机可辨左右与远近）
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

    // 立体声声道平移（-1.0 左 ~ +1.0 右）
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

  // 基础促织鸣叫
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

    // 二周目呼吸轻音
    if (this.isSecondPlaythrough) {
      const breath = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      breath.type = "sine";
      breath.frequency.setValueAtTime(560, now);
      bGain.gain.setValueAtTime(0.04, now);
      bGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      breath.connect(bGain);
      bGain.connect(this.ctx.destination);
      breath.start(now);
      breath.stop(now + duration);
    }

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

  playCaneHit() {
    this.vibrate(120); // 触觉重顿震
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
    this.vibrate(15); // 微弱触须挑逗震
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
    this.vibrate(35); // 清脆格挡震
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

  playQinNote(pitch = 440) {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(pitch, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.8);
  }

  playQinDanceStep(step = 0) {
    this.vibrate(25);
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
    const pitch = scale[step % scale.length];
    this.playQinNote(pitch);
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

  // 印泥渗透与盖印重击声
  playInkBleed() {
    this.vibrate([30, 40, 160]); // 浸润长震
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
}

const sound = new SoundEngine();
// 本地持久化与虫谱解锁状态
const STORAGE_KEY_PLAYTHROUGH = "cuzhi_playthrough_count";
const STORAGE_KEY_RECORDS = "cuzhi_battle_records";
const STORAGE_KEY_MANUAL = "cuzhi_unlocked_manual";

const storage = {
  getPlaythroughCount() {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY_PLAYTHROUGH) || "0", 10);
    } catch {
      return 0;
    }
  },

  incrementPlaythrough() {
    try {
      const current = this.getPlaythroughCount();
      localStorage.setItem(STORAGE_KEY_PLAYTHROUGH, (current + 1).toString());
      return current + 1;
    } catch {
      return 1;
    }
  },

  isSecondPlaythroughOrMore() {
    return this.getPlaythroughCount() >= 1;
  },

  unlockManualItem(id) {
    try {
      const list = this.getUnlockedManual();
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(STORAGE_KEY_MANUAL, JSON.stringify(list));
      }
    } catch (e) {
      console.warn("Manual save failed:", e);
    }
  },

  getUnlockedManual() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_MANUAL) || '["crab_green"]');
    } catch {
      return ["crab_green"];
    }
  }
};
// 全局游戏状态机与对战统计模型

class GameState {
  constructor() {
    this.currentBeat = 1;
    this.scriptIndex = 0;
    this.cricketName = "青项金翅";
    this.smallCricketName = "小梅花";
    
    // 显性表：得意与家运 (0 ~ 100)
    this.fortune = 0;
    this.fortuneLabel = "大祸临头";
    this.fortuneSubtext = "摊派催逼 · 杖责五十";

    // 战绩实录清单
    this.battleLog = [];

    // 对战综合统计（用于生成千人千面藏书票印章）
    this.stats = {
      totalParries: 0,
      totalStrikes: 0,
      sufferedDefeats: 0,
      perfectDance: true,
      strawTeaseCount: 0
    };

    // 周目状态
    this.isSecondPlaythrough = storage.isSecondPlaythroughOrMore();
  }

  setBeat(beat) {
    this.currentBeat = beat;
    this.scriptIndex = 0;
  }

  updateFortune(value, label, subtext) {
    this.fortune = Math.max(0, Math.min(100, value));
    if (label) this.fortuneLabel = label;
    if (subtext) this.fortuneSubtext = subtext;
  }

  addBattleRecord(record) {
    this.battleLog.push(record);
  }

  // 计算千人千面藏书票印鉴评价
  getSealTitle() {
    if (this.stats.sufferedDefeats === 0 && this.stats.totalParries >= 3) {
      return { title: "灵犀绝杀", sub: "破尽敌芒 · 算无遗策" };
    } else if (this.stats.sufferedDefeats === 0) {
      return { title: "百战无伤", sub: "轻捷迅勇 · 一往直前" };
    } else if (this.stats.sufferedDefeats > 0) {
      return { title: "险胜入宫", sub: "如履薄冰 · 死里求生" };
    }
    return { title: "天子近臣", sub: "应节羽舞 · 恩荫子孙" };
  }

  reset() {
    this.currentBeat = 1;
    this.scriptIndex = 0;
    this.cricketName = "青项金翅";
    this.smallCricketName = "小梅花";
    this.fortune = 0;
    this.fortuneLabel = "大祸临头";
    this.fortuneSubtext = "摊派催逼 · 杖责五十";
    this.battleLog = [];
    this.stats = {
      totalParries: 0,
      totalStrikes: 0,
      sufferedDefeats: 0,
      perfectDance: true,
      strawTeaseCount: 0
    };
    this.isSecondPlaythrough = storage.isSecondPlaythroughOrMore();
  }
}

const state = new GameState();
// 尘土粒子与墨点视觉特效
class ParticleEngine {
  constructor(container) {
    this.container = container;
    this.particles = [];
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.createAmbientDust();
  }

  createAmbientDust() {
    if (!this.container) return;
    this.container.innerHTML = '';
    const count = 18;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'dust-speck';
      p.style.position = 'absolute';
      p.style.width = (Math.random() * 3 + 1) + 'px';
      p.style.height = p.style.width;
      p.style.backgroundColor = 'rgba(230, 223, 206, ' + (Math.random() * 0.3 + 0.1) + ')';
      p.style.borderRadius = '50%';
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (Math.random() * 100) + '%';
      p.style.pointerEvents = 'none';
      p.style.filter = 'blur(1px)';
      p.style.animation = 'dustFloat ' + (Math.random() * 6 + 6) + 's infinite ease-in-out ' + (Math.random() * 5) + 's';
      this.container.appendChild(p);
    }
  }

  spawnHitSparks(x, y, text = '破！') {
    const parent = document.getElementById('battle-fx');
    if (!parent) return;
    const spark = document.createElement('div');
    spark.className = 'hit-spark';
    spark.innerText = text;
    spark.style.left = x + 'px';
    spark.style.top = y + 'px';
    parent.appendChild(spark);
    setTimeout(() => spark.remove(), 700);
  }

  spawnMusicNote(x, y, glyph = '♪') {
    const parent = document.getElementById('dance-notes');
    if (!parent) return;
    parent.hidden = false;
    const note = document.createElement('div');
    note.className = 'music-glyph';
    note.innerText = glyph;
    note.style.left = x + 'px';
    note.style.top = y + 'px';
    parent.appendChild(note);
    setTimeout(() => note.remove(), 2000);
  }
}
// 《促织》六拍全剧本台词与人物声音配置（严格无剧透版）
const scriptData = {
  // 拍①：逼
  beat1: [
    {
      kicker: "宣德年间 · 华阴县衙",
      speaker: "差役",
      text: "里正成名！宫里尚促织之戏，岁征民间。今年华阴县这头一份差使，县老爷点名落你头上。三日内不交出一只上品斗虫，按律严办！",
      action: "接差役令"
    },
    {
      kicker: "破屋 · 夫妻相对",
      speaker: "成妻",
      text: "当家的，咱们穷得只剩这几间土坯房，拿什么去市集买那些游侠儿居奇的百金之虫？这差役分明是要逼死咱们……",
      action: "默然长叹"
    },
    {
      kicker: "公堂 · 杖责",
      speaker: "县令",
      text: "限期已过，空手而归！公堂之上，岂容刁民推诿？与我重责五十大板！",
      action: "受杖刑",
      event: "cane_hit"
    },
    {
      kicker: "破屋 · 呻吟",
      speaker: "成名",
      text: "两股脓血，伏枕呻吟。死何足惜，只是这差役一日不了，全家皆无活路……",
      action: "挣扎欲绝"
    }
  ],

  // 拍②：捕
  beat2: [
    {
      kicker: "破屋 · 绝处逢生",
      speaker: "成妻",
      text: "当家的，听闻邑有驼背巫，能通神灵。我求得一纸神图：古寺残壁，巨石叠嶂，乱草丛中有虫鸣……我们不妨照图去寻！",
      action: "依图前往古庙"
    },
    {
      kicker: "大佛阁后 · 残石荒草",
      speaker: "成名",
      text: "草丛深处果有微声！循着鸣声方位搜寻，切莫惊了它……",
      action: "开始寻声捕虫",
      event: "start_catch"
    }
  ],

  // 拍③：养
  beat3: [
    {
      kicker: "破屋 · 绝品神虫",
      speaker: "成名",
      text: "巨身修尾，青项金翅！天下罕见的异种！有了它，不仅免了杖责，全家性命有救了！",
      action: "为神虫命名",
      event: "name_god_cricket"
    },
    {
      kicker: "破屋 · 悉心照料",
      speaker: "成名",
      text: "置于精细竹筒，贮于瓦盆，日日以蟹膏粟粒饲之。这可是全家的性命根子。",
      action: "小心喂养"
    },
    {
      kicker: "破屋 · 幼子注视",
      speaker: "成子",
      text: "爹，娘……它吃了粟粒，安安静静伏在盆底呢。",
      action: "抚盆端详",
      tell: true
    }
  ],

  // 拍④：祸（极简留白，绝不暗示小虫身份）
  beat4: [
    {
      kicker: "破屋 · 惊变",
      speaker: "成名",
      text: "从市集归家，忽见瓦盆翻覆，神虫僵死于地……儿不在，四顾寂然无声。",
      action: "惊恐四顾"
    },
    {
      kicker: "后院 · 井沿留白",
      speaker: "成妻",
      text: "（哭声嘶哑断续）……儿怕你责罚……井边……井边只剩一只湿透的小草鞋……",
      action: "瘫倒于地"
    },
    {
      kicker: "断点 · 数日沉沦",
      speaker: "旁白",
      text: "数日过去，成名万念俱灰，家中连交差的虫都无处着落。县衙差役明日将至，若无虫可缴，合家仍难逃一死。",
      action: "绝望求生",
      isBlackout: true
    },
    {
      kicker: "门前石缝 · 残存微生",
      speaker: "成名",
      text: "门前石缝草际，偶有一只极小极瘦的虫子，形若蝼蚁，梅花翅，伏着不动。再无他法，只得将这只瘦小虫儿充数一试……",
      action: "将就收养命名",
      event: "name_small_cricket"
    }
  ],

  // 拍⑤：斗/献/舞（阶梯战役与家运飙升）
  beat5: [
    {
      kicker: "乡里斗场",
      speaker: "游侠少年",
      text: "成名，听说你找了只小虫？看我这只刚勇绝伦的“蟹壳青”！一爪便能将你这瘦虫撕得粉碎！",
      action: "开盆迎战"
    }
  ],

  // 拍⑥：苏
  beat6: [
    {
      kicker: "晨光微熹 · 豪宅内室",
      speaker: "成名",
      text: "宣德帝龙颜大悦，抚军免我徭役，赠良田千亩、金银百两、裘马过世家……可我这心头，总空落落的。",
      action: "步至榻前"
    },
    {
      kicker: "床榻之上 · 悠悠转醒",
      speaker: "成子",
      text: "爹……娘……我这些天，昏昏沉沉，像做了一场大梦。在梦里……我化作了一只促织，轻捷善斗，咬翻了大虫，还跳上大鸡的鸡冠……",
      action: "定睛凝视"
    }
  ]
};
// 斗场对手数据与战斗曲线
const opponentsData = [
  {
    id: "crab_green",
    name: "蟹壳青",
    title: "第一场 · 少年豪赌",
    description: "身肥体健，铁甲黑须，乡中少年的常胜大将。",
    maxHp: 100,
    attackPower: 12,
    speed: 0.9,
    windupDuration: 950,
    reward: "赢钱数千 · 邻里惊服",
    fortuneInc: 25,
    rewardText: "声名初起 · 免受欺凌"
  },
  {
    id: "county_elite",
    name: "县衙巨甲",
    title: "第二场 · 县令试斗",
    description: "华阴县令珍藏之巨甲，形如铁铸，出招凌厉。",
    maxHp: 140,
    attackPower: 18,
    speed: 1.25,
    windupDuration: 750,
    reward: "免除差役 · 补邑庠生",
    fortuneInc: 25,
    rewardText: "县令嘉奖 · 补弟子员"
  },
  {
    id: "giant_rooster",
    name: "抚军大公鸡",
    title: "第三场 · 抚院惊险",
    description: "巡抚大堂昂首巨鸡，爪利如钩，引颈直啄！",
    maxHp: 180,
    attackPower: 24,
    speed: 1.5,
    windupDuration: 550,
    isSpecialRooster: true,
    reward: "进献御前 · 赐金百两",
    fortuneInc: 25,
    rewardText: "巡抚大骇 · 赏赐良田名马"
  },
  {
    id: "palace_dance",
    name: "宣德御前",
    title: "第四场 · 极乐御前",
    description: "宫廷琴瑟和鸣，宣德帝御案前，小虫应节而舞！",
    maxHp: 100,
    attackPower: 0,
    speed: 1.0,
    windupDuration: 800,
    isPalaceDance: true,
    reward: "富埒世家 · 恩荫子孙",
    fortuneInc: 25,
    rewardText: "龙颜大喜 · 赏赐无算"
  }
];
// 拍②：古庙草丛寻声捕虫小玩法（含 3D 空间立体声定位）

class CatchGame {
  constructor(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.field = document.getElementById("catch-field");
    this.hintEl = document.querySelector(".catch-hint");
    this.targetX = 0;
    this.targetY = 0;
    this.attempts = 0;
    this.chirpTimer = null;
    this.width = 340;
    this.height = 220;
  }

  start() {
    if (!this.container || !this.field) return;
    this.container.hidden = false;
    this.field.innerHTML = "";
    this.attempts = 0;

    for (let i = 0; i < 9; i++) {
      const spot = document.createElement("div");
      spot.className = "grass-spot";
      spot.style.left = (10 + (i % 3) * 35 + Math.random() * 8) + "%";
      spot.style.top = (15 + Math.floor(i / 3) * 30 + Math.random() * 8) + "%";
      spot.innerText = "艸";
      this.field.appendChild(spot);
    }

    const rect = this.field.getBoundingClientRect();
    this.width = rect.width || 340;
    this.height = rect.height || 220;
    this.targetX = Math.floor(Math.random() * (this.width - 80)) + 40;
    this.targetY = Math.floor(Math.random() * (this.height - 80)) + 40;

    if (this.hintEl) this.hintEl.innerText = "草丛窸窣 · 听辨方位寻声覆之（建议佩戴耳机）";

    // 初始立体声微弱鸣叫
    const initialPan = (this.targetX - this.width / 2) / (this.width / 2);
    sound.playSpatialChirp(initialPan, 0.7);

    this.chirpTimer = setInterval(() => {
      sound.playSpatialChirp(initialPan, 0.65);
    }, 2400);

    this.field.onclick = (e) => {
      const fRect = this.field.getBoundingClientRect();
      const clickX = e.clientX - fRect.left;
      const clickY = e.clientY - fRect.top;

      const dx = clickX - this.targetX;
      const dy = clickY - this.targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.sqrt(this.width * this.width + this.height * this.height) || 400;
      const distFactor = Math.min(1.0, dist / maxDist);

      const currentPan = (this.targetX - clickX) / (this.width / 2);
      this.attempts++;
      sound.playSpatialChirp(currentPan, distFactor);

      const ripple = document.createElement("div");
      ripple.className = "hit-spark";
      ripple.innerText = dist < 65 ? "急！" : "沙…";
      ripple.style.left = clickX + "px";
      ripple.style.top = clickY + "px";
      this.field.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);

      if (dist < 60 || this.attempts >= 4) {
        this.successCatch();
      } else if (dist < 130) {
        if (this.hintEl) this.hintEl.innerText = "鸣声转急！近在咫尺！";
      } else {
        const dir = dx > 0 ? "左" : "右";
        if (this.hintEl) this.hintEl.innerText = `微声在${dir}侧草际……`;
      }
    };
  }

  successCatch() {
    clearInterval(this.chirpTimer);
    this.field.onclick = null;
    sound.playBurstChirps(4);
    sound.vibrate([40, 50, 100]);

    if (this.hintEl) this.hintEl.innerText = "扣得神虫！青项金翅！";

    const targetNode = document.createElement("div");
    targetNode.className = "catch-target-node";
    targetNode.style.left = (this.targetX - 22) + "px";
    targetNode.style.top = (this.targetY - 22) + "px";
    targetNode.style.transform = "scale(1.5)";
    targetNode.style.background = "rgba(229, 185, 92, 0.9)";
    targetNode.style.boxShadow = "0 0 25px #e5b95c";
    this.field.appendChild(targetNode);

    setTimeout(() => {
      this.container.hidden = true;
      if (this.onComplete) this.onComplete();
    }, 1200);
  }

  cleanup() {
    if (this.chirpTimer) clearInterval(this.chirpTimer);
    if (this.container) this.container.hidden = true;
  }
}
// 拍⑤：核心斗虫引擎 v3（自由拖拽草丝＋战前筹码＋二周目皮影倒影＋振翅高鸣姿态）

class BattleGame {
  constructor(options) {
    this.canvas = document.getElementById("battle-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.onVictory = options.onVictory;
    this.onDefeat = options.onDefeat;
    this.particleEngine = options.particleEngine;

    this.currentOpponentIndex = 0;
    this.opponent = null;

    this.playerHp = 100;
    this.maxPlayerHp = 100;
    this.momentum = 0;
    this.isParrying = false;
    this.isAttacking = false;
    this.isTeased = false;
    this.isVictoryPosture = false;

    this.enemyHp = 100;
    this.maxEnemyHp = 100;
    this.enemyState = "idle";

    // 琴舞模式
    this.danceSteps = 0;
    this.maxDanceSteps = 5;

    // 自由拖拽草丝触摸坐标
    this.touchStraw = { active: false, x: 0, y: 0 };

    this.danmuTimer = null;
    this.tellCycle = 0;
    this.animFrame = null;
    this.isRunning = false;
    this.hitstopUntil = 0;
    this.width = 600;
    this.height = 300;

    this.crowdComments = [
      "好虫！", "神了！", "这瘦虫竟如此了得！", "好一身梅花翅！",
      "咬它！", "再斗一场！", "好利害的牙口！", "真乃神虫也！"
    ];

    this.secondPlayComments = [
      "……不过是一只虫罢了。", "天下人命，不如宫中一戏。",
      "万金买一笑，谁管瓦底魂。", "好狠的局……"
    ];

    this.bindEvents();
    this.bindTouchStraw();
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const bowl = document.getElementById("arena-bowl");
    if (!bowl) return;
    const rect = bowl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 600;
    this.height = rect.height || 300;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    if (this.ctx) {
      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
    }
  }

  bindEvents() {
    const btnTease = document.getElementById("btn-tease");
    const btnParry = document.getElementById("btn-parry");
    const btnStrike = document.getElementById("btn-strike");

    if (btnTease) btnTease.onclick = (e) => { e.stopPropagation(); this.handleTease(); };
    if (btnParry) btnParry.onclick = (e) => { e.stopPropagation(); this.handleParry(); };
    if (btnStrike) btnStrike.onclick = (e) => { e.stopPropagation(); this.handleStrike(); };

    window.addEventListener("keydown", (e) => {
      if (!this.isRunning) return;
      if (e.key === "j" || e.key === "J") this.handleTease();
      if (e.key === "k" || e.key === "K") this.handleParry();
      if (e.key === "l" || e.key === "L") this.handleStrike();
      if (e.key === " " && this.opponent?.isPalaceDance) this.handleDanceStep();
    });
  }

  // 手指在斗草盆自由划动草丝（触摸物理把玩）
  bindTouchStraw() {
    const bowl = document.getElementById("arena-bowl");
    if (!bowl) return;

    const handleMove = (clientX, clientY) => {
      if (!this.isRunning || this.opponent?.isPalaceDance) return;
      const rect = bowl.getBoundingClientRect();
      this.touchStraw.active = true;
      this.touchStraw.x = clientX - rect.left;
      this.touchStraw.y = clientY - rect.top;

      // 检查草丝是否触碰到玩家促织
      const px = this.width * 0.28;
      const py = this.height * 0.55;
      const dx = this.touchStraw.x - px;
      const dy = this.touchStraw.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 40 && !this.isAttacking) {
        state.stats.strawTeaseCount++;
        this.momentum = Math.min(100, this.momentum + 4);
        this.isTeased = true;
        sound.playStrawTickle();
        this.updateHUD();
      }
    };

    bowl.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    bowl.addEventListener("mousemove", (e) => {
      if (e.buttons === 1) {
        handleMove(e.clientX, e.clientY);
      }
    });

    bowl.addEventListener("touchend", () => { this.touchStraw.active = false; });
    bowl.addEventListener("mouseup", () => { this.touchStraw.active = false; });
  }

  startMatch(opponentIndex = 0) {
    this.currentOpponentIndex = opponentIndex;
    this.opponent = opponentsData[this.currentOpponentIndex];
    if (!this.opponent) return;

    storage.unlockManualItem(this.opponent.id);

    this.resizeCanvas();
    this.isRunning = true;
    this.isVictoryPosture = false;
    this.playerHp = 100;
    this.maxPlayerHp = 100;
    this.momentum = 0;
    this.enemyHp = this.opponent.maxHp;
    this.maxEnemyHp = this.opponent.maxHp;
    this.enemyState = "idle";
    this.danceSteps = 0;

    const pName = document.getElementById("my-cricket-name");
    if (pName) pName.innerText = state.smallCricketName || "小梅花";

    this.setupControlsMode();
    this.updateHUD();
    sound.playBurstChirps(2);

    this.startDanmu();

    if (this.opponent.isPalaceDance) {
      sound.playQinDanceStep(0);
      const hint = document.getElementById("battle-hint-bar");
      if (hint) hint.innerText = "琴瑟和鸣 · 点击【应节羽舞】随乐起舞！";
    } else {
      this.scheduleEnemyAction();
    }

    this.loop();
  }

  setupControlsMode() {
    const controls = document.getElementById("battle-controls");
    if (!controls) return;

    if (this.opponent.isPalaceDance) {
      controls.innerHTML = `
        <button class="dance-control-btn" id="btn-dance" type="button">
          <span>闻琴起舞 · 应节振翅（点击）</span>
        </button>
      `;
      const btnDance = document.getElementById("btn-dance");
      if (btnDance) btnDance.onclick = (e) => { e.stopPropagation(); this.handleDanceStep(); };
    } else {
      controls.innerHTML = `
        <button class="battle-btn btn-tease" id="btn-tease" type="button">
          <span class="key-hint">J / 划屏</span><strong>草丝挑逗</strong><small>蓄势积力</small>
        </button>
        <button class="battle-btn btn-parry" id="btn-parry" type="button">
          <span class="key-hint">K / 避咬</span><strong>侧身避咬</strong><small>破其锋芒</small>
        </button>
        <button class="battle-btn btn-strike" id="btn-strike" type="button">
          <span class="key-hint">L / 扑咬</span><strong>疾进直前</strong><small>乘胜绝杀</small>
        </button>
      `;
      this.bindEvents();
    }
  }

  startDanmu() {
    if (this.danmuTimer) clearInterval(this.danmuTimer);
    const pool = (storage.isSecondPlaythroughOrMore() && Math.random() > 0.35) 
      ? this.secondPlayComments 
      : (this.opponent?.isPalaceDance ? ["圣上龙颜大悦！", "真奇虫也！", "百戏未有此妙！", "妙极！"] : this.crowdComments);

    this.danmuTimer = setInterval(() => {
      if (!this.isRunning) return;
      const fxLayer = document.getElementById("battle-fx");
      if (!fxLayer) return;

      const danmu = document.createElement("div");
      danmu.className = "danmu-comment";
      danmu.innerText = pool[Math.floor(Math.random() * pool.length)];
      danmu.style.top = (12 + Math.random() * 64) + "%";
      fxLayer.appendChild(danmu);

      setTimeout(() => danmu.remove(), 4000);
    }, 2600);
  }

  updateHUD() {
    const pFill = document.getElementById("my-energy-fill");
    const mFill = document.getElementById("my-momentum-fill");
    const eFill = document.getElementById("enemy-energy-fill");
    const vsBadge = document.getElementById("battle-vs-badge");
    const enemyName = document.getElementById("enemy-cricket-name");
    const enemyStatus = document.getElementById("enemy-status");
    const comboBadge = document.getElementById("combo-badge");

    if (pFill) pFill.style.width = Math.max(0, (this.playerHp / this.maxPlayerHp) * 100) + "%";
    if (mFill) mFill.style.width = this.momentum + "%";
    if (eFill) eFill.style.width = Math.max(0, (this.enemyHp / this.maxEnemyHp) * 100) + "%";
    if (vsBadge) vsBadge.innerText = this.opponent.title.split(" · ")[0];
    if (enemyName) enemyName.innerText = this.opponent.name;

    if (comboBadge) {
      const stakes = [
        "赌注：一吊铜钱 vs 半斗米",
        "筹码：免役文书 补邑庠生",
        "重赏：赐金百两 骏马良田",
        "天赏：富埒世家 恩荫子孙"
      ];
      comboBadge.innerText = stakes[this.currentOpponentIndex] || "对赌进行中";
    }

    if (enemyStatus) {
      if (this.opponent.isPalaceDance) {
        enemyStatus.innerText = `御案弄乐 · 节拍 ${this.danceSteps}/${this.maxDanceSteps}`;
      } else if (this.enemyState === "windup") {
        enemyStatus.innerText = "【前摇破绽！】速按避咬！";
      } else if (this.enemyState === "stunned") {
        enemyStatus.innerText = "【大破僵直！】速按扑咬！";
      } else {
        enemyStatus.innerText = "昂首对峙";
      }
    }
  }

  handleTease() {
    if (!this.isRunning || this.isAttacking) return;
    state.stats.strawTeaseCount++;
    sound.playStrawTickle();
    this.momentum = Math.min(100, this.momentum + 32);
    this.isTeased = true;
    sound.playChirp(0.16, 0.2);

    const straw = document.getElementById("straw-brush");
    if (straw) {
      straw.style.opacity = "1";
      straw.style.left = (this.width * 0.25) + "px";
      straw.style.top = (this.height * 0.5) + "px";
      setTimeout(() => { straw.style.opacity = "0"; }, 160);
    }

    if (this.particleEngine) {
      this.particleEngine.spawnHitSparks(this.width * 0.3, this.height * 0.45, "势起！");
    }
    this.updateHUD();
  }

  handleParry() {
    if (!this.isRunning || this.isParrying) return;
    this.isParrying = true;
    state.stats.totalParries++;
    sound.playParry();

    if (this.enemyState === "windup") {
      this.enemyState = "stunned";
      this.momentum = 100;
      sound.playBurstChirps(3);
      sound.vibrate([40, 60]);

      if (this.particleEngine) {
        this.particleEngine.spawnHitSparks(this.width * 0.7, this.height * 0.45, "大破其锋！");
      }
      const hint = document.getElementById("battle-hint-bar");
      if (hint) hint.innerText = "敌虫大破僵直！立即按【扑咬】绝杀！";

      setTimeout(() => {
        if (this.enemyState === "stunned") {
          this.enemyState = "idle";
          this.updateHUD();
        }
      }, 1600);
    }

    this.updateHUD();
    setTimeout(() => { this.isParrying = false; }, 280);
  }

  handleStrike() {
    if (!this.isRunning || this.isAttacking) return;
    this.isAttacking = true;
    state.stats.totalStrikes++;

    const isCrit = this.momentum >= 80 || this.enemyState === "stunned";
    const dmg = isCrit ? 52 : 20;

    sound.playBite();

    if (isCrit) {
      this.hitstopUntil = performance.now() + 90;
      sound.vibrate([50, 40, 100]);
      const bowl = document.getElementById("arena-bowl");
      if (bowl) {
        bowl.classList.add("screen-shake");
        setTimeout(() => bowl.classList.remove("screen-shake"), 220);
      }
    } else {
      sound.vibrate(30);
    }

    if (this.opponent.isSpecialRooster) {
      sound.playRoosterSquawk();
      if (this.particleEngine) {
        this.particleEngine.spawnHitSparks(this.width * 0.7, this.height * 0.3, "直跃鸡冠！");
      }
    } else {
      if (this.particleEngine) {
        this.particleEngine.spawnHitSparks(this.width * 0.7, this.height * 0.5, isCrit ? "绝杀！" : "轻咬！");
      }
    }

    this.enemyHp = Math.max(0, this.enemyHp - dmg);
    this.momentum = 0;
    this.updateHUD();

    if (this.enemyHp <= 0) {
      this.enemyState = "dead";
      this.isVictoryPosture = true;
      sound.playBurstChirps(4);
      setTimeout(() => this.handleMatchWin(), 900);
    } else {
      setTimeout(() => { this.isAttacking = false; }, 250);
    }
  }

  handleDanceStep() {
    if (!this.isRunning || !this.opponent.isPalaceDance) return;
    this.danceSteps++;
    sound.playQinDanceStep(this.danceSteps);
    sound.playBurstChirps(1);

    if (this.particleEngine) {
      const glyphs = ["♪", "羽", "徵", "角", "商", "宫"];
      this.particleEngine.spawnMusicNote(this.width * (0.35 + Math.random() * 0.3), this.height * 0.5, glyphs[this.danceSteps % glyphs.length]);
    }

    this.updateHUD();

    if (this.danceSteps >= this.maxDanceSteps) {
      this.handleMatchWin();
    }
  }

  scheduleEnemyAction() {
    if (!this.isRunning || this.opponent.isPalaceDance) return;
    const delay = Math.random() * 1100 + (this.opponent.speed > 1.2 ? 900 : 1700);

    setTimeout(() => {
      if (!this.isRunning || this.enemyHp <= 0 || this.opponent.isPalaceDance) return;

      if (this.enemyState === "idle") {
        this.enemyState = "windup";
        this.updateHUD();
        sound.playChirp(0.12, 0.2);

        setTimeout(() => {
          if (this.enemyState === "windup") {
            this.enemyState = "attack";
            this.updateHUD();
            sound.playBite();

            if (!this.isParrying) {
              this.playerHp = Math.max(0, this.playerHp - this.opponent.attackPower);
              this.updateHUD();

              if (this.playerHp <= 0) {
                this.handleMatchDefeat();
                return;
              }
            }

            setTimeout(() => {
              this.enemyState = "idle";
              this.updateHUD();
              this.scheduleEnemyAction();
            }, 280);
          } else {
            this.scheduleEnemyAction();
          }
        }, this.opponent.windupDuration);
      } else {
        this.scheduleEnemyAction();
      }
    }, delay);
  }

  handleMatchDefeat() {
    this.isRunning = false;
    state.stats.sufferedDefeats++;
    if (this.danmuTimer) clearInterval(this.danmuTimer);

    const hint = document.getElementById("battle-hint-bar");
    if (hint) hint.innerText = "【小虫负伤受挫！】败绩若传开，全家性命难保……";

    const bowl = document.getElementById("arena-bowl");
    if (bowl) bowl.classList.add("screen-shake");
    sound.vibrate([100, 50, 150]);

    setTimeout(() => {
      if (bowl) bowl.classList.remove("screen-shake");
      if (this.onDefeat) {
        this.onDefeat(this.opponent, this.currentOpponentIndex);
      } else {
        this.startMatch(this.currentOpponentIndex);
      }
    }, 1800);
  }

  handleMatchWin() {
    this.isRunning = false;
    if (this.danmuTimer) clearInterval(this.danmuTimer);
    sound.playBurstChirps(5);

    setTimeout(() => {
      if (this.onVictory) {
        this.onVictory(this.opponent, this.currentOpponentIndex);
      }
    }, 800);
  }

  loop() {
    if (!this.isRunning && !this.ctx) return;
    
    if (performance.now() >= this.hitstopUntil) {
      this.tellCycle += 0.03;
      this.render();
    }
    
    this.animFrame = requestAnimationFrame(() => this.loop());
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 盆底阴影
    ctx.save();
    ctx.fillStyle = "rgba(18, 14, 10, 0.4)";
    ctx.beginPath();
    ctx.ellipse(this.width * 0.5, this.height * 0.75, this.width * 0.4, this.height * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 二周目：烛光皮影残影（盆壁隐现九岁孩童坐跃剪影）
    if (storage.isSecondPlaythroughOrMore()) {
      this.drawChildShadowMetaphor(ctx);
    }

    // 玩家小促织位置
    let px = this.isAttacking ? this.width * 0.6 : (this.isParrying ? this.width * 0.2 : this.width * 0.28);
    let py = this.height * 0.55;

    // 获胜姿态：爬上盆沿振翅高鸣
    if (this.isVictoryPosture) {
      px = this.width * 0.35;
      py = this.height * 0.28;
    }

    this.drawPlayerCricket(ctx, px, py);

    // 敌方角色
    const ex = this.enemyState === "attack" ? this.width * 0.38 : this.width * 0.72;
    const ey = this.height * 0.55;
    this.drawOpponent(ctx, ex, ey);

    // 绘制手指触摸拖拽草丝轨迹
    if (this.touchStraw.active) {
      this.drawInteractiveStraw(ctx, this.touchStraw.x, this.touchStraw.y);
    }
  }

  // 二周目孩童皮影残影
  drawChildShadowMetaphor(ctx) {
    ctx.save();
    ctx.translate(this.width * 0.28, this.height * 0.42);
    const flicker = 0.05 + Math.sin(this.tellCycle * 2) * 0.03;
    ctx.fillStyle = `rgba(180, 150, 100, ${flicker})`;

    // 小小身躯坐立/抬手剪影
    ctx.beginPath();
    ctx.arc(0, -22, 10, 0, Math.PI * 2); // 孩童头
    ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2); // 身体
    ctx.fill();

    // 挥手影子
    ctx.strokeStyle = `rgba(180, 150, 100, ${flicker})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(20 + Math.sin(this.tellCycle * 3) * 6, -18);
    ctx.stroke();
    ctx.restore();
  }

  // 自由划动草丝绘制
  drawInteractiveStraw(ctx, x, y) {
    ctx.save();
    ctx.strokeStyle = "rgba(229, 185, 92, 0.75)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - 40, y + 25);
    ctx.quadraticCurveTo(x - 10, y + 5, x, y);
    ctx.stroke();
    ctx.restore();
  }

  drawPlayerCricket(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    const tellPhase = Math.sin(this.tellCycle);
    const isTellMoment = Math.abs(tellPhase) > 0.8;
    const headTilt = isTellMoment ? 0.14 : (this.isTeased ? -0.08 : 0);
    const legRub = isTellMoment ? Math.sin(this.tellCycle * 8) * 3 : 0;

    if (this.opponent?.isPalaceDance || this.isVictoryPosture) {
      ctx.rotate(Math.sin(this.tellCycle * 5) * 0.25);
    }

    ctx.fillStyle = "#485942";
    ctx.strokeStyle = "#1b241a";
    ctx.lineWidth = 1.8;

    ctx.save();
    ctx.rotate(headTilt);
    ctx.beginPath();
    ctx.ellipse(-6, 0, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#69593c";
    ctx.beginPath();
    ctx.ellipse(3, -3, 12, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#c49c48";
    ctx.beginPath();
    ctx.moveTo(10, -3);
    ctx.quadraticCurveTo(24, -16 + (isTellMoment ? 4 : 0), 38, -12);
    ctx.moveTo(10, 1);
    ctx.quadraticCurveTo(24, 14, 38, 10);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = "#2b3327";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(8 + legRub, 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-12, 2);
    ctx.lineTo(-24, -14);
    ctx.lineTo(-28, 10);
    ctx.stroke();

    ctx.restore();
  }

  drawOpponent(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    if (this.enemyState === "dead") {
      ctx.rotate(Math.PI);
      ctx.translate(0, -15);
    }

    if (this.opponent?.isPalaceDance) {
      ctx.fillStyle = "#a8382b";
      ctx.fillRect(-25, -20, 50, 12);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(-20, -18, 40, 4);
    } else if (this.opponent?.isSpecialRooster) {
      if (this.enemyState === "windup") {
        ctx.fillStyle = "rgba(184, 59, 38, 0.4)";
        ctx.beginPath();
        ctx.arc(0, -30, 60, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = this.enemyState === "windup" ? "#8a281d" : "#2d241d";
      ctx.beginPath();
      ctx.ellipse(0, -30, 40, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#b83b26";
      ctx.beginPath();
      ctx.arc(8, -85, 12, 0, Math.PI * 2);
      ctx.arc(-8, -88, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#c49c48";
      ctx.beginPath();
      ctx.moveTo(-18, -75);
      ctx.lineTo(-50, -65);
      ctx.lineTo(-15, -60);
      ctx.fill();
    } else {
      if (this.enemyState === "windup") {
        ctx.fillStyle = "rgba(184, 59, 38, 0.35)";
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = this.enemyState === "windup" ? "#6e2218" : (this.enemyState === "stunned" ? "#444" : "#1f2420");
      ctx.strokeStyle = "#0d100e";
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#c49c48";
      const jawAngle = this.enemyState === "windup" ? 8 : 2;
      ctx.beginPath();
      ctx.moveTo(-22, -4);
      ctx.lineTo(-38, -jawAngle);
      ctx.moveTo(-22, 4);
      ctx.lineTo(-38, jawAngle);
      ctx.stroke();
    }

    ctx.restore();
  }

  stop() {
    this.isRunning = false;
    if (this.danmuTimer) clearInterval(this.danmuTimer);
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }
}
// 拍①：逼

function runBeat1(controller) {
  controller.updateSceneBg("scene-ruins");
  controller.setActors({ chengming: true, officer: true, wife: false, son: false });
  controller.setFortune(0, "大祸临头", "摊派催逼 · 杖责五十");
  
  const scripts = scriptData.beat1;
  let idx = 0;

  function showNext() {
    if (idx >= scripts.length) {
      controller.nextBeat();
      return;
    }
    const item = scripts[idx];
    controller.showDialog({
      kicker: item.kicker,
      speaker: item.speaker,
      text: item.text,
      btnText: item.action,
      onNext: () => {
        if (item.event === "cane_hit") {
          sound.playCaneHit();
          controller.flashScreen();
        }
        idx++;
        showNext();
      }
    });
  }

  showNext();
}
// 拍②：捕

function runBeat2(controller) {
  controller.updateSceneBg("scene-temple");
  controller.setActors({ chengming: true, wife: true, officer: false, son: false });
  controller.setFortune(15, "绝处求生", "得驼背巫画卷 · 寻虫古寺");

  const scripts = scriptData.beat2;
  let idx = 0;

  function showNext() {
    if (idx >= scripts.length) {
      controller.hideDialog();
      const catchLayer = document.getElementById("catch-layer");
      const catchGame = new CatchGame(catchLayer, () => {
        controller.nextBeat();
      });
      catchGame.start();
      return;
    }
    const item = scripts[idx];
    controller.showDialog({
      kicker: item.kicker,
      speaker: item.speaker,
      text: item.text,
      btnText: item.action,
      onNext: () => {
        idx++;
        showNext();
      }
    });
  }

  showNext();
}
// 拍③：养（亲手起名＋P2-1 喂养小互动）

function runBeat3(controller) {
  controller.updateSceneBg("scene-cottage");
  controller.setActors({ chengming: true, son: true, wife: true, officer: false, pot: true });
  controller.setFortune(30, "翻身有望", "得神虫青项金翅 · 悉心照护");
  
  const scripts = scriptData.beat3;
  let idx = 0;

  function showNext() {
    if (idx >= scripts.length) {
      controller.nextBeat();
      return;
    }
    const item = scripts[idx];

    if (item.event === "name_god_cricket") {
      controller.showDialogWithInput({
        kicker: item.kicker,
        speaker: item.speaker,
        text: item.text,
        defaultName: state.cricketName || "青项金翅",
        inputHint: "为这只神虫赐名：",
        btnText: "定下名号",
        onConfirm: (name) => {
          state.cricketName = name || "青项金翅";
          sound.playBurstChirps(2);
          idx++;
          showNext();
        }
      });
      return;
    }

    if (idx === 1) {
      // P2-1 喂养小互动
      controller.showFeedInteraction({
        kicker: item.kicker,
        speaker: item.speaker,
        text: item.text,
        maxFeed: 3,
        onFeedComplete: () => {
          idx++;
          showNext();
        }
      });
      return;
    }

    controller.showDialog({
      kicker: item.kicker,
      speaker: item.speaker,
      text: item.text,
      btnText: item.action,
      onNext: () => {
        if (item.tell) {
          sound.playChirp(0.2, 0.25);
        }
        idx++;
        showNext();
      }
    });
  }

  showNext();
}
// 拍④：祸（极简留白＋黑场时间断点＋绝望求生）

function runBeat4(controller) {
  controller.updateSceneBg("scene-well");
  controller.setActors({ chengming: true, wife: true, son: false, officer: false, pot: true, well: true });
  
  const pot = document.getElementById("prop-pot");
  if (pot) pot.classList.add("is-dead");

  controller.setFortune(5, "家破人亡", "神虫扑毙 · 井沿湿履");
  
  const scripts = scriptData.beat4;
  let idx = 0;

  function showNext() {
    if (idx >= scripts.length) {
      controller.nextBeat();
      return;
    }
    const item = scripts[idx];

    if (item.isBlackout) {
      controller.flashBlackout(() => {
        controller.showDialog({
          kicker: item.kicker,
          speaker: item.speaker,
          text: item.text,
          btnText: item.action,
          onNext: () => {
            idx++;
            showNext();
          }
        });
      });
      return;
    }

    if (item.event === "name_small_cricket") {
      // 绝望求生收养小虫起名
      sound.playChirp(0.12, 0.15);
      controller.showDialogWithInput({
        kicker: item.kicker,
        speaker: item.speaker,
        text: item.text,
        defaultName: state.smallCricketName || "小梅花",
        inputHint: "给这只瘦小虫儿起名（拿去充数）：",
        btnText: "收入瓦盆",
        onConfirm: (name) => {
          state.smallCricketName = name || "小梅花";
          sound.playChirp(0.18, 0.2);
          idx++;
          showNext();
        }
      });
      return;
    }

    controller.showDialog({
      kicker: item.kicker,
      speaker: item.speaker,
      text: item.text,
      btnText: item.action,
      onNext: () => {
        idx++;
        showNext();
      }
    });
  }

  showNext();
}
// 拍⑤：斗/献/舞（阶梯战役与真实败退机制）

function runBeat5(controller) {
  controller.updateSceneBg("scene-court");
  controller.setActors({ chengming: false, wife: false, son: false, officer: false, pot: false, well: false });
  controller.hideDialog();

  const battleLayer = document.getElementById("battle-layer");
  battleLayer.hidden = false;

  let matchIndex = 0;
  let battleGame = null;

  function startNextMatch() {
    if (matchIndex >= opponentsData.length) {
      battleLayer.hidden = true;
      controller.nextBeat();
      return;
    }

    const opponent = opponentsData[matchIndex];
    battleGame = new BattleGame({
      particleEngine: controller.particleEngine,
      onVictory: (opp, idx) => {
        state.addBattleRecord({
          title: opp.title,
          oppName: opp.name,
          reward: opp.reward,
          rewardText: opp.rewardText
        });

        const newFortune = Math.min(100, 30 + (matchIndex + 1) * 20);
        controller.setFortune(newFortune, "如日中天", opp.rewardText);

        matchIndex++;
        if (matchIndex < opponentsData.length) {
          setTimeout(() => startNextMatch(), 800);
        } else {
          setTimeout(() => {
            battleLayer.hidden = true;
            controller.nextBeat();
          }, 1200);
        }
      },
      onDefeat: (opp, idx) => {
        // P0-2 败北惩罚与重新挑战
        controller.setFortune(Math.max(10, state.fortune - 10), "战绩受挫", "虫伤了，败绩若传开全家难保");
        setTimeout(() => {
          startNextMatch();
        }, 1600);
      }
    });

    battleGame.startMatch(matchIndex);
  }

  startNextMatch();
}
// 拍⑥：苏（照见机关、涟漪置换与长按印泥拟真钤印）

function runBeat6(controller) {
  controller.updateSceneBg("scene-cottage");
  controller.setActors({ chengming: true, wife: true, son: true, officer: false, pot: false, well: false });
  controller.setFortune(100, "极乐圆满", "家益富 · 裘马过世家");

  const scripts = scriptData.beat6;
  let idx = 0;

  function showNext() {
    if (idx >= scripts.length) {
      showAwakeningLedger();
      return;
    }
    const item = scripts[idx];
    controller.showDialog({
      kicker: item.kicker,
      speaker: item.speaker,
      text: item.text,
      btnText: item.action,
      onNext: () => {
        idx++;
        showNext();
      }
    });
  }

  function showAwakeningLedger() {
    controller.hideDialog();
    const overlay = document.getElementById("awakening-overlay");
    const recordsContainer = document.getElementById("ledger-records");
    const actionsContainer = document.querySelector(".summary-actions");
    overlay.hidden = false;
    recordsContainer.innerHTML = "";
    if (actionsContainer) actionsContainer.hidden = true;

    const records = state.battleLog;
    const playerAssignedName = state.smallCricketName || "小梅花";

    records.forEach((rec, i) => {
      const row = document.createElement("div");
      row.className = "record-row";
      row.innerHTML = `
        <div class="record-title">
          <span>${rec.title} · 胜 ${rec.oppName}</span>
          <span class="record-reward">${rec.reward}</span>
        </div>
        <div class="record-subject-box">
          <span class="subject-text">出战者：<span class="subject-highlight" id="subj-${i}">${playerAssignedName}</span></span>
          <small style="display:block;color:#777;margin-top:2px;">${rec.rewardText}</small>
        </div>
      `;
      recordsContainer.appendChild(row);
    });

    // 2.4 秒沉浸后逐条翻转
    setTimeout(() => {
      records.forEach((_, i) => {
        setTimeout(() => {
          sound.playQinNote(293.66 + i * 40);
          sound.vibrate(30);
          const span = document.getElementById(`subj-${i}`);
          if (span) {
            span.style.opacity = "0";
            setTimeout(() => {
              span.innerText = "成子（九岁）";
              span.classList.add("is-son");
              span.style.opacity = "1";
            }, 250);
          }
        }, i * 650);
      });

      const totalRippleTime = records.length * 650 + 1200;
      setTimeout(() => {
        storage.incrementPlaythrough();

        // 拟真长按印泥定案交互
        showPressHoldSealInteraction(() => {
          if (actionsContainer) actionsContainer.hidden = false;

          const btnSave = document.getElementById("btn-save-card");
          const btnRestart = document.getElementById("btn-restart-game");

          if (btnSave) {
            btnSave.onclick = (e) => { e.stopPropagation(); controller.generateMomentCard(); };
          }
          if (btnRestart) {
            btnRestart.onclick = (e) => {
              e.stopPropagation();
              overlay.hidden = true;
              controller.restartGame();
            };
          }
        });
      }, totalRippleTime);
    }, 2400);
  }

  // 拟真长按 1 秒印泥渗透压盖
  function showPressHoldSealInteraction(onStamped) {
    const quoteBox = document.getElementById("awakening-quote");
    if (!quoteBox) {
      if (onStamped) onStamped();
      return;
    }

    const sealSection = document.createElement("div");
    sealSection.className = "seal-affix-section";
    sealSection.innerHTML = `
      <div class="seal-hold-box" id="seal-hold-box">
        <button class="seal-affix-btn" id="seal-affix-btn" type="button">
          <span>长按钤印 · 定案</span>
        </button>
        <div class="seal-progress-bar"><div class="seal-progress-fill" id="seal-progress-fill"></div></div>
        <small style="color:#888;font-size:11px;">按住屏幕一秒，朱印浸透宣纸定案</small>
      </div>
    `;
    quoteBox.after(sealSection);

    const btn = document.getElementById("seal-affix-btn");
    const progressFill = document.getElementById("seal-progress-fill");
    let holdTimer = null;
    let holdProgress = 0;
    let isComplete = false;

    const startHold = (e) => {
      if (isComplete) return;
      e.preventDefault();
      holdProgress = 0;
      sound.vibrate(20);

      holdTimer = setInterval(() => {
        holdProgress += 10;
        if (progressFill) progressFill.style.width = holdProgress + "%";
        if (holdProgress % 30 === 0) sound.vibrate(15);

        if (holdProgress >= 100) {
          clearInterval(holdTimer);
          isComplete = true;
          sound.playInkBleed();
          sealSection.innerHTML = `
            <div class="vermilion-stamp-mark">天子一跬步，皆关民命。</div>
          `;
          setTimeout(() => {
            if (onStamped) onStamped();
          }, 600);
        }
      }, 90);
    };

    const cancelHold = () => {
      if (isComplete) return;
      clearInterval(holdTimer);
      holdProgress = 0;
      if (progressFill) progressFill.style.width = "0%";
    };

    btn.addEventListener("mousedown", startHold);
    btn.addEventListener("touchstart", startHold, { passive: false });
    window.addEventListener("mouseup", cancelHold);
    window.addEventListener("touchend", cancelHold);
  }

  showNext();
}
// 《促织》游戏主控制器与生命周期入口 v3（千人千面藏书票＋3D立体声＋触觉引擎）


class GameController {
  constructor() {
    this.state = state;
    this.sound = sound;
    this.storage = storage;
    this.particleEngine = null;
    this.onDialogNext = null;
    this.typewriterTimer = null;
    this.beatNames = ["① 逼", "② 捕", "③ 养", "④ 祸", "⑤ 斗", "⑥ 苏"];
  }

  init() {
    const dustContainer = document.getElementById("dust-particles");
    this.particleEngine = new ParticleEngine(dustContainer);
    this.particleEngine.start();

    if (this.state.isSecondPlaythrough) {
      this.sound.isSecondPlaythrough = true;
    }

    this.bindHUD();
    this.updatePlaythroughBadge();

    window.addEventListener("touchstart", () => this.sound.resume(), { once: true });
    window.addEventListener("click", () => this.sound.resume(), { once: true });

    this.startBeat(1);
  }

  bindHUD() {
    const soundBtn = document.getElementById("sound-btn");
    const restartBtn = document.getElementById("restart-btn");
    const manualBtn = document.getElementById("manual-btn");
    const nextBtn = document.getElementById("btn-next");
    const closeCardBtn = document.getElementById("btn-close-card");
    const narrativePanel = document.getElementById("narrative-panel");

    if (soundBtn) {
      soundBtn.onclick = (e) => {
        e.stopPropagation();
        const isEnabled = this.sound.toggle();
        soundBtn.innerText = isEnabled ? "声 鸣" : "声 静";
      };
    }

    if (manualBtn) {
      manualBtn.onclick = (e) => {
        e.stopPropagation();
        this.showCricketManual();
      };
    }

    if (restartBtn) {
      restartBtn.onclick = (e) => {
        e.stopPropagation();
        this.showRestartConfirm();
      };
    }

    if (nextBtn) {
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        if (this.onDialogNext) {
          this.sound.playPaperFlip();
          this.onDialogNext();
        }
      };
    }

    if (narrativePanel) {
      narrativePanel.onclick = (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON") return;
        if (this.onDialogNext) {
          this.sound.playPaperFlip();
          this.onDialogNext();
        }
      };
    }

    if (closeCardBtn) {
      closeCardBtn.onclick = (e) => {
        e.stopPropagation();
        const modal = document.getElementById("moment-card-modal");
        if (modal) modal.hidden = true;
      };
    }

    window.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        const dialogPanel = document.getElementById("narrative-panel");
        if (dialogPanel && !dialogPanel.hidden && this.onDialogNext) {
          if (document.activeElement?.tagName === "INPUT") return;
          e.preventDefault();
          this.sound.playPaperFlip();
          this.onDialogNext();
        }
      }
    });
  }

  showRestartConfirm() {
    let modal = document.getElementById("custom-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "custom-modal";
      modal.className = "custom-modal";
      document.body.appendChild(modal);
    }
    modal.hidden = false;
    modal.innerHTML = `
      <div class="modal-box">
        <h4>重翻此页？</h4>
        <p>重新自“① 逼”开始这一局的遭遇与翻身之旅。</p>
        <div class="modal-actions">
          <button class="hud-btn" id="modal-cancel">留下</button>
          <button class="hud-btn" id="modal-confirm" style="background:#a8382b;color:#fff;border-color:#a8382b;">重翻</button>
        </div>
      </div>
    `;

    document.getElementById("modal-cancel").onclick = () => { modal.hidden = true; };
    document.getElementById("modal-confirm").onclick = () => {
      modal.hidden = true;
      this.restartGame();
    };
  }

  showCricketManual() {
    let modal = document.getElementById("manual-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "manual-modal";
      modal.className = "manual-modal";
      document.body.appendChild(modal);
    }
    modal.hidden = false;

    const unlocked = this.storage.getUnlockedManual();
    let listHtml = "";

    opponentsData.forEach((opp) => {
      const isUn = unlocked.includes(opp.id);
      listHtml += `
        <div class="manual-item ${isUn ? "" : "locked"}">
          <h5>${isUn ? opp.name : "？？？"} <small style="color:#a8382b;font-weight:normal;">${opp.title}</small></h5>
          <p>${isUn ? opp.description : "尚未在斗场相逢……"}</p>
        </div>
      `;
    });

    modal.innerHTML = `
      <div class="manual-paper">
        <div class="manual-head">
          <span class="paper-seal">异史拾遗</span>
          <h3>促 织 谱</h3>
        </div>
        <div class="manual-list">${listHtml}</div>
        <div style="text-align:center;margin-top:14px;">
          <button class="hud-btn" id="manual-close-btn">合上虫谱</button>
        </div>
      </div>
    `;

    document.getElementById("manual-close-btn").onclick = () => { modal.hidden = true; };
    modal.onclick = (e) => {
      if (e.target === modal) modal.hidden = true;
    };
  }

  updatePlaythroughBadge() {
    const badge = document.getElementById("second-play-tag");
    if (badge) {
      badge.hidden = !this.state.isSecondPlaythrough;
    }
  }

  updateSceneBg(bgClass) {
    const bg = document.getElementById("stage-bg");
    if (bg) {
      bg.className = "stage-bg " + bgClass;
    }
  }

  setActors(actors = {}) {
    const map = {
      chengming: document.getElementById("actor-chengming"),
      wife: document.getElementById("actor-wife"),
      son: document.getElementById("actor-son"),
      officer: document.getElementById("actor-officer"),
      pot: document.getElementById("prop-pot"),
      well: document.getElementById("prop-well")
    };

    for (const key in map) {
      if (map[key]) {
        map[key].hidden = !actors[key];
      }
    }
  }

  setFortune(val, label, subtext) {
    this.state.updateFortune(val, label, subtext);
    const fill = document.getElementById("fortune-fill");
    const statusText = document.getElementById("fortune-status-text");
    const sub = document.getElementById("fortune-subtext");

    if (fill) fill.style.width = Math.max(5, this.state.fortune) + "%";
    if (statusText) statusText.innerText = this.state.fortuneLabel;
    if (sub) sub.innerText = this.state.fortuneSubtext;
  }

  showDialog({ kicker, speaker, text, btnText = "继续", onNext }) {
    const panel = document.getElementById("narrative-panel");
    const kickerEl = document.getElementById("dialog-kicker");
    const speakerEl = document.getElementById("dialog-speaker");
    const contentEl = document.getElementById("dialog-content");
    const btn = document.getElementById("btn-next");

    if (!panel) return;
    panel.hidden = false;

    if (kickerEl) kickerEl.innerText = kicker || "";
    if (speakerEl) speakerEl.innerText = speaker || "";
    if (btn) btn.innerText = btnText;

    if (this.typewriterTimer) clearTimeout(this.typewriterTimer);
    if (contentEl) {
      contentEl.innerHTML = "<p id=dialog-text></p>";
      const textEl = document.getElementById("dialog-text");
      let i = 0;

      const typeNextChar = () => {
        if (i < text.length) {
          const char = text[i];
          textEl.innerText += char;
          i++;

          let delay = 22;
          if (["，", "、", "；"].includes(char)) delay = 90;
          else if (["。", "！", "？", "…"].includes(char)) delay = 150;

          this.typewriterTimer = setTimeout(typeNextChar, delay);
        }
      };

      typeNextChar();
    }

    this.onDialogNext = onNext;
  }

  showDialogWithInput({ kicker, speaker, text, defaultName, inputHint, btnText, onConfirm }) {
    const panel = document.getElementById("narrative-panel");
    const kickerEl = document.getElementById("dialog-kicker");
    const speakerEl = document.getElementById("dialog-speaker");
    const contentEl = document.getElementById("dialog-content");
    const btn = document.getElementById("btn-next");

    if (!panel) return;
    panel.hidden = false;

    if (kickerEl) kickerEl.innerText = kicker || "";
    if (speakerEl) speakerEl.innerText = speaker || "";
    if (btn) btn.innerText = btnText;

    if (this.typewriterTimer) clearTimeout(this.typewriterTimer);
    if (contentEl) {
      contentEl.innerHTML = `
        <p style="margin-bottom:6px;">${text}</p>
        <div class="dialog-input-wrap">
          <input type="text" id="cricket-name-input" value="${defaultName}" placeholder="${inputHint}" maxlength="8" autocomplete="off" />
        </div>
      `;
    }

    this.onDialogNext = () => {
      const input = document.getElementById("cricket-name-input");
      const name = input ? input.value.trim() : defaultName;
      if (onConfirm) onConfirm(name || defaultName);
    };
  }

  showFeedInteraction({ kicker, speaker, text, maxFeed = 3, onFeedComplete }) {
    const panel = document.getElementById("narrative-panel");
    const kickerEl = document.getElementById("dialog-kicker");
    const speakerEl = document.getElementById("dialog-speaker");
    const contentEl = document.getElementById("dialog-content");
    const btn = document.getElementById("btn-next");

    if (!panel) return;
    panel.hidden = false;

    if (kickerEl) kickerEl.innerText = kicker || "";
    if (speakerEl) speakerEl.innerText = speaker || "";
    if (btn) btn.innerText = "继续照料";

    let fedCount = 0;

    if (this.typewriterTimer) clearTimeout(this.typewriterTimer);
    if (contentEl) {
      contentEl.innerHTML = `
        <p style="margin-bottom:6px;">${text}</p>
        <div class="feed-bowl-wrap">
          <button class="feed-click-btn" id="feed-click-btn" type="button">喂一粒粟</button>
          <span class="feed-count-tip" id="feed-count-tip">点按喂养：0 / ${maxFeed}</span>
        </div>
      `;

      const feedBtn = document.getElementById("feed-click-btn");
      const feedTip = document.getElementById("feed-count-tip");

      feedBtn.onclick = (e) => {
        e.stopPropagation();
        fedCount++;
        sound.playChirp(0.18, 0.25);
        if (feedTip) feedTip.innerText = `点按喂养：${fedCount} / ${maxFeed}`;

        if (fedCount >= maxFeed) {
          feedBtn.disabled = true;
          feedBtn.innerText = "已喂饱";
          if (feedTip) feedTip.innerText = "小虫振须轻鸣，伏盆甚安。";
        }
      };
    }

    this.onDialogNext = () => {
      if (onFeedComplete) onFeedComplete();
    };
  }

  hideDialog() {
    const panel = document.getElementById("narrative-panel");
    if (panel) panel.hidden = true;
    this.onDialogNext = null;
  }

  flashScreen() {
    const stage = document.getElementById("stage-shell");
    if (!stage) return;
    const flash = document.createElement("div");
    flash.style.position = "absolute";
    flash.style.inset = "0";
    flash.style.background = "rgba(168, 56, 43, 0.45)";
    flash.style.zIndex = "40";
    flash.style.pointerEvents = "none";
    stage.appendChild(flash);
    setTimeout(() => flash.remove(), 250);
  }

  flashBlackout(onDone) {
    const stage = document.getElementById("stage-shell");
    if (!stage) return;
    const black = document.createElement("div");
    black.style.position = "absolute";
    black.style.inset = "0";
    black.style.background = "#0d0e0c";
    black.style.zIndex = "45";
    black.style.display = "flex";
    black.style.alignItems = "center";
    black.style.justifyContent = "center";
    black.style.color = "#8c826e";
    black.style.fontSize = "14px";
    black.style.fontFamily = "var(--font-kai)";
    black.style.letterSpacing = "3px";
    black.innerText = "数日过去 · 万念俱灰";
    stage.appendChild(black);

    setTimeout(() => {
      black.remove();
      if (onDone) onDone();
    }, 1800);
  }

  startBeat(beat) {
    this.state.setBeat(beat);
    this.updateBeatProgress(beat);

    if (beat === 1) runBeat1(this);
    else if (beat === 2) runBeat2(this);
    else if (beat === 3) runBeat3(this);
    else if (beat === 4) runBeat4(this);
    else if (beat === 5) runBeat5(this);
    else if (beat === 6) runBeat6(this);
  }

  nextBeat() {
    const next = this.state.currentBeat + 1;
    if (next <= 6) {
      this.startBeat(next);
    }
  }

  updateBeatProgress(beat) {
    const nodes = document.querySelectorAll(".beat-node");
    nodes.forEach((node) => {
      const b = parseInt(node.getAttribute("data-beat"), 10);
      if (b === beat) {
        node.classList.add("active");
        node.classList.remove("passed");
        node.innerText = this.beatNames[b - 1];
      } else if (b < beat) {
        node.classList.remove("active");
        node.classList.add("passed");
        node.innerText = this.beatNames[b - 1];
      } else {
        node.classList.remove("active");
        node.classList.remove("passed");
        node.innerText = `⓪ ?`.replace("⓪", ["①","②","③","④","⑤","⑥"][b-1]);
      }
    });
  }

  // 千人千面古籍藏书票导出海报（P4）
  generateMomentCard() {
    const canvas = document.getElementById("moment-canvas");
    const modal = document.getElementById("moment-card-modal");
    if (!canvas || !modal) return;
    modal.hidden = false;

    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    // 宣纸底色
    ctx.fillStyle = "#f3ece1";
    ctx.fillRect(0, 0, w, h);

    // 古籍双框
    ctx.strokeStyle = "#1a1a18";
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    // 角花纹样
    ctx.strokeStyle = "rgba(168, 56, 43, 0.5)";
    ctx.strokeRect(28, 28, 14, 14);
    ctx.strokeRect(w - 42, 28, 14, 14);
    ctx.strokeRect(28, h - 42, 14, 14);
    ctx.strokeRect(w - 42, h - 42, 14, 14);

    // 聊斋印章
    ctx.fillStyle = "#a8382b";
    ctx.fillRect(w - 88, 45, 48, 48);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px STKaiti, serif";
    ctx.fillText("聊斋", w - 76, 78);

    // 动态千人千面藏书票印章
    const sealData = this.state.getSealTitle();
    ctx.strokeStyle = "#a8382b";
    ctx.lineWidth = 2;
    ctx.strokeRect(w - 180, 45, 80, 30);
    ctx.fillStyle = "#a8382b";
    ctx.font = "bold 15px STKaiti, serif";
    ctx.fillText(sealData.title, w - 172, 66);

    // 标题
    ctx.fillStyle = "#1a1a18";
    ctx.font = "bold 30px STSong, serif";
    ctx.fillText("促 织 · 藏书票", 45, 75);

    ctx.font = "13px STKaiti, serif";
    ctx.fillStyle = "#666";
    ctx.fillText(`宣德三年 · ${sealData.sub}`, 45, 106);

    ctx.strokeStyle = "rgba(168, 56, 43, 0.4)";
    ctx.beginPath();
    ctx.moveTo(45, 122);
    ctx.lineTo(w - 45, 122);
    ctx.stroke();

    const playerAssigned = this.state.smallCricketName || "小梅花";

    ctx.font = "bold 16px STSong, serif";
    ctx.fillStyle = "#1a1a18";
    ctx.fillText("【家运翻身实录】", 45, 155);

    ctx.font = "14px STSong, serif";
    ctx.fillStyle = "#333";
    let y = 188;
    this.state.battleLog.forEach((rec, i) => {
      ctx.fillText(`${i + 1}. 胜【${rec.oppName}】—— 获 ${rec.reward}`, 50, y);
      ctx.fillStyle = "#a8382b";
      ctx.fillText(`   出战者：【${playerAssigned}】`, 50, y + 22);
      ctx.fillStyle = "#333";
      y += 50;
    });

    // 锋利照见句
    ctx.fillStyle = "#a8382b";
    ctx.font = "bold 14px STKaiti, serif";
    ctx.fillText(`—— 你唤它作【${playerAssigned}】，它是你儿子。`, 45, y + 15);

    // 引文框
    ctx.fillStyle = "rgba(26, 26, 24, 0.05)";
    ctx.fillRect(45, y + 26, w - 90, 115);
    ctx.strokeStyle = "#1a1a18";
    ctx.strokeRect(45, y + 26, w - 90, 115);

    ctx.font = "italic 15px STKaiti, serif";
    ctx.fillStyle = "#1a1a18";
    ctx.fillText("“儿床上悠悠转醒，自陈曰：", 60, y + 58);
    ctx.fillText("我这些天……化作了一只促织，轻捷善斗。”", 75, y + 88);
    ctx.font = "12px STSong, serif";
    ctx.fillStyle = "#888";
    ctx.fillText("——《聊斋志异 · 促织》", w - 210, y + 115);

    // 底部落款
    ctx.font = "12px STSong, serif";
    ctx.fillStyle = "#999";
    ctx.fillText("异史氏曰：天子一跬步，皆关民命。", 45, h - 35);

    // 导出图像并渲染
    const dataUrl = canvas.toDataURL("image/png");
    const canvasWrap = document.querySelector(".moment-card-canvas-wrap");
    if (canvasWrap) {
      canvasWrap.innerHTML = `
        <img src="${dataUrl}" class="moment-card-img" alt="促织实录" />
        <span class="moment-tip">长按上方图片可直接存储到相册</span>
        
        <div class="share-copy-box">
          <span class="share-text" id="share-text-content">我养了一整局的常胜蟋蟀，是我儿子。——《促织》【${sealData.title}】</span>
          <button class="copy-text-btn" id="btn-copy-share" type="button">复制文案</button>
        </div>

        <div class="moment-actions-row">
          <a href="${dataUrl}" download="促织_藏书票实录.png" class="hud-btn" style="flex:1;text-align:center;text-decoration:none;display:inline-block;padding:8px 0;background:#a8382b;color:#fff;">下载图片</a>
          <button class="hud-btn close-card-btn" id="btn-close-card" style="flex:1;" type="button">收起</button>
        </div>
      `;

      document.getElementById("btn-close-card").onclick = () => { modal.hidden = true; };

      document.getElementById("btn-copy-share").onclick = (e) => {
        e.stopPropagation();
        const copyBtn = document.getElementById("btn-copy-share");
        const txt = `我养了一整局的常胜蟋蟀，是我儿子。——《促织》【${sealData.title}】`;
        navigator.clipboard?.writeText?.(txt).then(() => {
          if (copyBtn) copyBtn.innerText = "已复制！";
          setTimeout(() => { if (copyBtn) copyBtn.innerText = "复制文案"; }, 2000);
        }).catch(() => {
          alert(txt);
        });
      };
    }
  }

  restartGame() {
    this.state.reset();
    const pot = document.getElementById("prop-pot");
    if (pot) pot.classList.remove("is-dead");

    const overlay = document.getElementById("awakening-overlay");
    if (overlay) overlay.hidden = true;

    const modal = document.getElementById("moment-card-modal");
    if (modal) modal.hidden = true;

    const catchLayer = document.getElementById("catch-layer");
    if (catchLayer) catchLayer.hidden = true;

    const battleLayer = document.getElementById("battle-layer");
    if (battleLayer) battleLayer.hidden = true;

    this.updatePlaythroughBadge();
    this.startBeat(1);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const game = new GameController();
  game.init();
});

