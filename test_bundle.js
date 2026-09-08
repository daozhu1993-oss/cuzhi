// mock dom

global.window = {
  addEventListener: () => {},
  devicePixelRatio: 2,
  AudioContext: class {
    createOscillator() { return { type: '', frequency: { setValueAtTime: ()=>{}, exponentialRampToValueAtTime: ()=>{}, linearRampToValueAtTime: ()=>{} }, connect: ()=>{}, start: ()=>{}, stop: ()=>{} }; }
    createGain() { return { gain: { setValueAtTime: ()=>{}, linearRampToValueAtTime: ()=>{}, exponentialRampToValueAtTime: ()=>{} }, connect: ()=>{} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(100) }; }
    createBufferSource() { return { connect: ()=>{}, start: ()=>{} }; }
    createBiquadFilter() { return { frequency: { setValueAtTime: ()=>{}, exponentialRampToValueAtTime: ()=>{} }, connect: ()=>{} }; }
  }
};
global.document = {
  body: { appendChild: ()=>{} },
  getElementById: (id) => ({
    style: {},
    classList: { add: ()=>{}, remove: ()=>{} },
    appendChild: ()=>{},
    getBoundingClientRect: () => ({ width: 400, height: 260 }),
    getContext: () => ({
      fillRect: ()=>{}, strokeRect: ()=>{}, fillText: ()=>{}, stroke: ()=>{}, fill: ()=>{}, beginPath: ()=>{}, moveTo: ()=>{}, lineTo: ()=>{}, arc: ()=>{}, ellipse: ()=>{}, clearRect: ()=>{}, save: ()=>{}, restore: ()=>{}, translate: ()=>{}, scale: ()=>{}, rotate: ()=>{}, quadraticCurveTo: ()=>{}
    }),
    innerHTML: '',
    hidden: false
  }),
  querySelector: () => ({ style: {}, classList: { add: ()=>{}, remove: ()=>{} } }),
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, classList: { add: ()=>{} }, appendChild: ()=>{} })
};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.performance = { now: () => Date.now() };

// 《促织》移动端优先单文件打包版本
// Web Audio API 原生程序化音效合成器
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
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

  // 蟋蟀清脆鸣叫声（FM 频率调制）
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

  // 距离感应鸣叫（捕虫小游戏：距离越近声音越响亮急促）
  playProximityChirp(distFactor = 0.5) {
    // distFactor: 0.0 (近在咫尺) ~ 1.0 (极远)
    const vol = Math.max(0.08, 0.45 * (1.0 - distFactor * 0.8));
    const dur = 0.15 + (1.0 - distFactor) * 0.1;
    this.playChirp(dur, vol);
  }

  // 连续促织急鸣
  playBurstChirps(count = 3) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.playChirp(0.16, 0.3), i * 110);
    }
  }

  // 杖责沉闷击打声
  playCaneHit() {
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

  // 草丝挑逗声
  playStrawTickle() {
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

  // 扑咬打击声
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

  // 侧身闪避 / 破防清音
  playParry() {
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

  // 古琴单音
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

  // 宫廷五音旋律节拍（宫商角徵羽）
  playQinDanceStep(step = 0) {
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

  playRoosterSquawk() {
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
// 本地持久化与周目判断
const STORAGE_KEY_PLAYTHROUGH = 'cuzhi_playthrough_count';
const STORAGE_KEY_RECORDS = 'cuzhi_battle_records';

const storage = {
  getPlaythroughCount() {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY_PLAYTHROUGH) || '0', 10);
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

  saveRecord(record) {
    try {
      const list = this.getRecords();
      list.unshift(record);
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(list.slice(0, 10)));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  },

  getRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_RECORDS) || '[]');
    } catch {
      return [];
    }
  },

  resetAll() {
    try {
      localStorage.removeItem(STORAGE_KEY_PLAYTHROUGH);
      localStorage.removeItem(STORAGE_KEY_RECORDS);
    } catch (e) {
      console.warn('Storage reset failed:', e);
    }
  }
};
// 全局游戏状态机与双表数据模型

class GameState {
  constructor() {
    this.currentBeat = 1; // 1:逼, 2:捕, 3:养, 4:祸, 5:斗, 6:苏
    this.scriptIndex = 0;
    this.cricketName = "青项金翅";
    this.smallCricketName = "小梅花";
    
    // 显性表：得意与家运 (0 ~ 100)
    this.fortune = 0;
    this.fortuneLabel = "大祸临头";
    this.fortuneSubtext = "摊派催逼 · 杖责五十";

    // 战绩实录清单（用于拍⑥ 主语置换）
    this.battleLog = [];

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

  reset() {
    this.currentBeat = 1;
    this.scriptIndex = 0;
    this.cricketName = "青项金翅";
    this.smallCricketName = "小梅花";
    this.fortune = 0;
    this.fortuneLabel = "大祸临头";
    this.fortuneSubtext = "摊派催逼 · 杖责五十";
    this.battleLog = [];
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
// 拍②：古庙草丛寻声捕虫小玩法（含声学距离感应）

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
  }

  start() {
    if (!this.container || !this.field) return;
    this.container.hidden = false;
    this.field.innerHTML = "";
    this.attempts = 0;

    // 绘制散落的草丛装饰点
    for (let i = 0; i < 9; i++) {
      const spot = document.createElement("div");
      spot.className = "grass-spot";
      spot.style.left = (10 + (i % 3) * 35 + Math.random() * 10) + "%";
      spot.style.top = (15 + Math.floor(i / 3) * 30 + Math.random() * 10) + "%";
      spot.innerText = "艸";
      this.field.appendChild(spot);
    }

    // 随机隐藏神虫位置
    const rect = this.field.getBoundingClientRect();
    const w = rect.width || 340;
    const h = rect.height || 220;
    this.targetX = Math.floor(Math.random() * (w - 80)) + 40;
    this.targetY = Math.floor(Math.random() * (h - 80)) + 40;

    if (this.hintEl) this.hintEl.innerText = "草丛窸窣 · 点击寻其声而覆之";

    // 初始微弱鸣叫
    sound.playProximityChirp(0.8);
    this.chirpTimer = setInterval(() => {
      sound.playProximityChirp(0.7);
    }, 2400);

    // 点击搜寻
    this.field.onclick = (e) => {
      const fRect = this.field.getBoundingClientRect();
      const clickX = e.clientX - fRect.left;
      const clickY = e.clientY - fRect.top;

      const dx = clickX - this.targetX;
      const dy = clickY - this.targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.sqrt(w * w + h * h) || 400;
      const distFactor = Math.min(1.0, dist / maxDist);

      this.attempts++;
      sound.playProximityChirp(distFactor);

      // 视觉微尘
      const ripple = document.createElement("div");
      ripple.className = "hit-spark";
      ripple.innerText = dist < 70 ? "急！" : "沙…";
      ripple.style.left = clickX + "px";
      ripple.style.top = clickY + "px";
      this.field.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);

      // 距离提示
      if (dist < 60 || this.attempts >= 4) {
        // 成功捕获
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

    if (this.hintEl) this.hintEl.innerText = "扣得神虫！青项金翅！";

    // 亮出神虫
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
// 拍⑤：核心斗虫技巧小游戏引擎（自适应画布＋P0-2 Tell微动作＋P1-1破绽格挡＋P1-2琴舞）

class BattleGame {
  constructor(options) {
    this.canvas = document.getElementById("battle-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.onVictory = options.onVictory;
    this.particleEngine = options.particleEngine;

    this.currentOpponentIndex = 0;
    this.opponent = null;

    // 玩家促织数据
    this.playerHp = 100;
    this.maxPlayerHp = 100;
    this.momentum = 0; // 0 ~ 100
    this.isParrying = false;
    this.isAttacking = false;
    this.isTeased = false;

    // 敌方数据
    this.enemyHp = 100;
    this.maxEnemyHp = 100;
    this.enemyState = "idle"; // idle, windup, attack, stunned, hurt
    this.enemyWindupTimer = 0;

    // 琴舞模式数据
    this.danceSteps = 0;
    this.maxDanceSteps = 5;

    // 动画状态与 Tell 计时
    this.tellCycle = 0; // P0-2 儿子习惯微动作计时
    this.animFrame = null;
    this.isRunning = false;
    this.width = 600;
    this.height = 300;

    this.bindEvents();
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
      if (e.key === " ") {
        if (this.opponent?.isPalaceDance) this.handleDanceStep();
      }
    });
  }

  startMatch(opponentIndex = 0) {
    this.currentOpponentIndex = opponentIndex;
    this.opponent = opponentsData[this.currentOpponentIndex];
    if (!this.opponent) return;

    this.resizeCanvas();
    this.isRunning = true;
    this.playerHp = 100;
    this.maxPlayerHp = 100;
    this.momentum = 0;
    this.enemyHp = this.opponent.maxHp;
    this.maxEnemyHp = this.opponent.maxHp;
    this.enemyState = "idle";
    this.danceSteps = 0;

    // 更新名字与界面
    const pName = document.getElementById("my-cricket-name");
    if (pName) pName.innerText = state.smallCricketName || "小梅花";

    this.setupControlsMode();
    this.updateHUD();
    sound.playBurstChirps(2);

    if (this.opponent.isPalaceDance) {
      sound.playQinDanceStep(0);
      const hint = document.getElementById("battle-hint-bar");
      if (hint) hint.innerText = "琴瑟之声和鸣 · 点击【应节羽舞】随乐起舞！";
    } else {
      this.scheduleEnemyAction();
    }

    this.loop();
  }

  setupControlsMode() {
    const controls = document.getElementById("battle-controls");
    if (!controls) return;

    if (this.opponent.isPalaceDance) {
      // 切换为独立琴舞大按钮
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
          <span class="key-hint">J / 挑逗</span><strong>草丝挑逗</strong><small>蓄势积力</small>
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

  updateHUD() {
    const pFill = document.getElementById("my-energy-fill");
    const mFill = document.getElementById("my-momentum-fill");
    const eFill = document.getElementById("enemy-energy-fill");
    const vsBadge = document.getElementById("battle-vs-badge");
    const enemyName = document.getElementById("enemy-cricket-name");
    const enemyStatus = document.getElementById("enemy-status");

    if (pFill) pFill.style.width = Math.max(0, (this.playerHp / this.maxPlayerHp) * 100) + "%";
    if (mFill) mFill.style.width = this.momentum + "%";
    if (eFill) eFill.style.width = Math.max(0, (this.enemyHp / this.maxEnemyHp) * 100) + "%";
    if (vsBadge) vsBadge.innerText = this.opponent.title.split(" · ")[0];
    if (enemyName) enemyName.innerText = this.opponent.name;

    if (enemyStatus) {
      if (this.opponent.isPalaceDance) {
        enemyStatus.innerText = `御案弄乐 · 节拍 ${this.danceSteps}/${this.maxDanceSteps}`;
      } else if (this.enemyState === "windup") {
        enemyStatus.innerText = "【前摇破绽！】速按避咬！";
      } else if (this.enemyState === "stunned") {
        enemyStatus.innerText = "【破防僵直！】速扑咬！";
      } else {
        enemyStatus.innerText = "昂首对峙";
      }
    }
  }

  // 1. 草丝挑逗
  handleTease() {
    if (!this.isRunning || this.isAttacking) return;
    sound.playStrawTickle();
    this.momentum = Math.min(100, this.momentum + 30);
    this.isTeased = true;
    sound.playChirp(0.16, 0.2);

    const straw = document.getElementById("straw-brush");
    if (straw) {
      straw.style.opacity = "1";
      straw.style.left = (this.width * 0.25) + "px";
      straw.style.top = (this.height * 0.5) + "px";
      setTimeout(() => { straw.style.opacity = "0"; }, 180);
    }

    if (this.particleEngine) {
      this.particleEngine.spawnHitSparks(this.width * 0.3, this.height * 0.45, "势起！");
    }
    this.updateHUD();
  }

  // 2. 侧身闪避 / 破防格挡（P1-1 核心技巧）
  handleParry() {
    if (!this.isRunning || this.isParrying) return;
    this.isParrying = true;
    sound.playParry();

    if (this.enemyState === "windup") {
      // 成功格挡！触发破防硬直
      this.enemyState = "stunned";
      this.momentum = 100; // 直接满势
      sound.playBurstChirps(3);
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
    setTimeout(() => { this.isParrying = false; }, 300);
  }

  // 3. 扑咬攻击
  handleStrike() {
    if (!this.isRunning || this.isAttacking) return;
    this.isAttacking = true;
    const isCrit = this.momentum >= 80 || this.enemyState === "stunned";
    const dmg = isCrit ? 50 : 20;

    sound.playBite();

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
      this.handleMatchWin();
    } else {
      setTimeout(() => { this.isAttacking = false; }, 250);
    }
  }

  // 4. 琴舞节奏处理（P1-2 独立舞拍）
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
    const delay = Math.random() * 1200 + (this.opponent.speed > 1.2 ? 1000 : 1800);

    setTimeout(() => {
      if (!this.isRunning || this.enemyHp <= 0 || this.opponent.isPalaceDance) return;

      if (this.enemyState === "idle") {
        this.enemyState = "windup"; // 前摇起手
        this.updateHUD();
        sound.playChirp(0.12, 0.2);

        setTimeout(() => {
          if (this.enemyState === "windup") {
            this.enemyState = "attack";
            this.updateHUD();
            sound.playBite();

            if (!this.isParrying) {
              this.playerHp = Math.max(10, this.playerHp - this.opponent.attackPower);
              this.updateHUD();
            }

            setTimeout(() => {
              this.enemyState = "idle";
              this.updateHUD();
              this.scheduleEnemyAction();
            }, 300);
          } else {
            this.scheduleEnemyAction();
          }
        }, this.opponent.windupDuration);
      } else {
        this.scheduleEnemyAction();
      }
    }, delay);
  }

  handleMatchWin() {
    this.isRunning = false;
    sound.playBurstChirps(5);

    setTimeout(() => {
      if (this.onVictory) {
        this.onVictory(this.opponent, this.currentOpponentIndex);
      }
    }, 1000);
  }

  loop() {
    if (!this.isRunning && !this.ctx) return;
    this.tellCycle += 0.03;
    this.render();
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

    // 绘制玩家小促织（含 P0-2 Tell 微动作）
    const px = this.isAttacking ? this.width * 0.6 : (this.isParrying ? this.width * 0.2 : this.width * 0.28);
    const py = this.height * 0.55;
    this.drawPlayerCricket(ctx, px, py);

    // 绘制敌方角色（含 P1-1 前摇破绽警示光）
    const ex = this.enemyState === "attack" ? this.width * 0.38 : this.width * 0.72;
    const ey = this.height * 0.55;
    this.drawOpponent(ctx, ex, ey);
  }

  drawPlayerCricket(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // P0-2 Tell 微动作：每隔几秒，小促织歪头、触须轻颤、前足如在衣角蹭手
    const tellPhase = Math.sin(this.tellCycle);
    const isTellMoment = Math.abs(tellPhase) > 0.8;
    const headTilt = isTellMoment ? 0.12 : 0;
    const legRub = isTellMoment ? Math.sin(this.tellCycle * 8) * 3 : 0;

    // 琴舞模式下翻转腾跃
    if (this.opponent?.isPalaceDance) {
      ctx.rotate(Math.sin(this.tellCycle * 4) * 0.2);
    }

    ctx.fillStyle = "#485942";
    ctx.strokeStyle = "#1b241a";
    ctx.lineWidth = 1.8;

    // 腹部与头（带微偏角）
    ctx.save();
    ctx.rotate(headTilt);
    ctx.beginPath();
    ctx.ellipse(-6, 0, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 梅花翅
    ctx.fillStyle = "#69593c";
    ctx.beginPath();
    ctx.ellipse(3, -3, 12, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 长须
    ctx.strokeStyle = "#c49c48";
    ctx.beginPath();
    ctx.moveTo(10, -3);
    ctx.quadraticCurveTo(24, -16 + (isTellMoment ? 4 : 0), 38, -12);
    ctx.moveTo(10, 1);
    ctx.quadraticCurveTo(24, 14, 38, 10);
    ctx.stroke();
    ctx.restore();

    // 前足（蹭擦微动作）
    ctx.strokeStyle = "#2b3327";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(8 + legRub, 10);
    ctx.stroke();

    // 后腿
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

    if (this.opponent?.isPalaceDance) {
      // 宫廷琴案剪影
      ctx.fillStyle = "#a8382b";
      ctx.fillRect(-25, -20, 50, 12);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(-20, -18, 40, 4);
    } else if (this.opponent?.isSpecialRooster) {
      // 大公鸡
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

      // 鸡冠
      ctx.fillStyle = "#b83b26";
      ctx.beginPath();
      ctx.arc(8, -85, 12, 0, Math.PI * 2);
      ctx.arc(-8, -88, 10, 0, Math.PI * 2);
      ctx.fill();

      // 喙
      ctx.fillStyle = "#c49c48";
      ctx.beginPath();
      ctx.moveTo(-18, -75);
      ctx.lineTo(-50, -65);
      ctx.lineTo(-15, -60);
      ctx.fill();
    } else {
      // 巨甲大虫
      if (this.enemyState === "windup") {
        // P1-1 明显前摇破绽光环
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

      // 巨齿钳
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
// 拍③：养（亲手起名与喂养互动）

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
      // 弹出给大虫起名输入
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
// 拍⑤：斗/献/舞（阶梯战役与家运飙升）

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
        // 记录战绩
        state.addBattleRecord({
          title: opp.title,
          oppName: opp.name,
          reward: opp.reward,
          rewardText: opp.rewardText
        });

        // 显性家运飙升
        const newFortune = Math.min(100, 30 + (matchIndex + 1) * 20);
        controller.setFortune(newFortune, "如日中天", opp.rewardText);

        matchIndex++;
        if (matchIndex < opponentsData.length) {
          setTimeout(() => {
            startNextMatch();
          }, 800);
        } else {
          setTimeout(() => {
            battleLayer.hidden = true;
            controller.nextBeat();
          }, 1200);
        }
      }
    });

    battleGame.startMatch(matchIndex);
  }

  startNextMatch();
}
// 拍⑥：苏（照见机关、涟漪置换与静默定格）

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

    // P1-4 先让玩家得意 2.5 秒，再进行逐条涟漪式主语翻转
    setTimeout(() => {
      records.forEach((_, i) => {
        setTimeout(() => {
          sound.playQinNote(293.66 + i * 40);
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

      // 翻转完成后进入静默定格
      const totalRippleTime = records.length * 650 + 1200;
      setTimeout(() => {
        storage.incrementPlaythrough();

        // 浮现静默定格提示并最终展现操作按钮
        if (actionsContainer) {
          actionsContainer.hidden = false;
        }

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
      }, totalRippleTime);
    }, 2400);
  }

  showNext();
}
// 《促织》游戏主控制器与生命周期入口（移动端优先＋标点停顿＋防剧透进度＋起名交互）


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

    this.bindHUD();
    this.updatePlaythroughBadge();

    // 首次触摸任意位置解锁 Web Audio
    window.addEventListener("touchstart", () => this.sound.resume(), { once: true });
    window.addEventListener("click", () => this.sound.resume(), { once: true });

    // 启动第一拍：逼
    this.startBeat(1);
  }

  bindHUD() {
    const soundBtn = document.getElementById("sound-btn");
    const restartBtn = document.getElementById("restart-btn");
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

    // 点击整个叙事卡片也可推进对话
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
          // 如果当前在输入框内回车，不拦截
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

  // P2-3 打字机（含标点停顿）
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

          // 标点停顿
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

  // P1-3 亲手起名输入
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

  // P2-1 进度条防剧透：未到达的拍名显示为 ？
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

    // 墨线边框
    ctx.strokeStyle = "#1a1a18";
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    // 印章
    ctx.fillStyle = "#a8382b";
    ctx.fillRect(w - 90, 45, 50, 50);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px STKaiti, serif";
    ctx.fillText("聊斋", w - 78, 78);

    // 标题
    ctx.fillStyle = "#1a1a18";
    ctx.font = "bold 32px STSong, serif";
    ctx.fillText("促 织 · 实 录", 45, 75);

    ctx.font = "14px STKaiti, serif";
    ctx.fillStyle = "#666";
    ctx.fillText("明 · 宣德三年 华阴县令进献卷", 45, 108);

    // 分隔线
    ctx.strokeStyle = "rgba(168, 56, 43, 0.4)";
    ctx.beginPath();
    ctx.moveTo(45, 126);
    ctx.lineTo(w - 45, 126);
    ctx.stroke();

    // 战绩记录
    ctx.font = "bold 17px STSong, serif";
    ctx.fillStyle = "#1a1a18";
    ctx.fillText("【家运履历】", 45, 160);

    ctx.font = "14px STSong, serif";
    ctx.fillStyle = "#333";
    let y = 195;
    this.state.battleLog.forEach((rec, i) => {
      ctx.fillText(`${i + 1}. 胜【${rec.oppName}】—— 获 ${rec.reward}`, 50, y);
      ctx.fillStyle = "#a8382b";
      ctx.fillText(`   出战者：成子（九岁）`, 50, y + 22);
      ctx.fillStyle = "#333";
      y += 50;
    });

    // 结尾引文框
    ctx.fillStyle = "rgba(26, 26, 24, 0.05)";
    ctx.fillRect(45, y + 15, w - 90, 130);
    ctx.strokeStyle = "#1a1a18";
    ctx.strokeRect(45, y + 15, w - 90, 130);

    ctx.font = "italic 15px STKaiti, serif";
    ctx.fillStyle = "#1a1a18";
    ctx.fillText("“儿床上悠悠转醒，自陈曰：", 60, y + 52);
    ctx.fillText("我这些天……化作了一只促织，轻捷善斗。”", 75, y + 85);
    ctx.font = "12px STSong, serif";
    ctx.fillStyle = "#888";
    ctx.fillText("——《聊斋志异 · 促织》", w - 210, y + 120);

    // 底部落款
    ctx.font = "12px STSong, serif";
    ctx.fillStyle = "#999";
    ctx.fillText("异史氏曰：天子一跬步，皆关民命。", 45, h - 40);
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

// 自启动
window.addEventListener("DOMContentLoaded", () => {
  const game = new GameController();
  game.init();
});

