// 【聊斋百妖奇斗 · 鬼市无尽黑斗擂台】Roguelite 对决引擎 v4
// （神虫飞跃扑咬动效 · 避邪残影 · 工笔妖兽 · 伤害跳字）
import { sound } from "../engine/audio.js";
import { state } from "../engine/state.js";
import { imageAssets } from "../data/assets.js";

export class ColiseumGame {
  constructor(container) {
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.currentFloor = 1;
    this.playerHp = 100;
    this.maxPlayerHp = 100;
    this.enemyHp = 100;
    this.maxEnemyHp = 100;
    this.momentum = 0;
    this.relics = [];
    this.enemyState = "idle";
    this.playerState = "idle";
    this.playerActionTimer = null;
    this.enemyActionTimer = null;
    this.isRunning = false;
    this.animFrame = null;
    this.tellCycle = 0;
    this.width = 680;
    this.height = 340;
    this.floatingTexts = [];

    this.playerImg = new Image();
    this.playerImg.src = (typeof imageAssets !== "undefined" && imageAssets.illustration_cricket_god) || "";

    this.beasts = [
      { id: "spider", name: "黑山络丝鬼蛛", title: "万丝缠魂 · 幽暗毒影", maxHp: 90, atk: 14, color: "#9c3ad6", sub: "口吐幽暗毒丝，附骨撕咬" },
      { id: "cicada", name: "画皮金蝉", title: "金蝉弄影 · 残像迷踪", maxHp: 110, atk: 16, color: "#d1a83b", sub: "金翼幻影重重，难辨真身" },
      { id: "bee", name: "黄英菊仙毒蜂", title: "凌空毒刺 · 破空激射", maxHp: 130, atk: 18, color: "#e58b2b", sub: "菊香化煞，倒马毒针" },
      { id: "centipede", name: "烂柯千足蜈蚣", title: "重铠反震 · 妖煞狂噬", maxHp: 160, atk: 22, color: "#c43b2d", sub: "千足金钩，玄甲难摧" },
      { id: "toad", name: "水莽鬼面蟾", title: "鬼面吞海 · 毒沼绝杀", maxHp: 200, atk: 26, color: "#2ea86b", sub: "背生人面，毒雾滔天" }
    ];

    this.allRelicsPool = [
      { id: "laoshan_talisman", icon: "📜", title: "崂山穿墙符", desc: "侧身辟邪无敌时间大幅延长，并留下一道残影反震" },
      { id: "huabi_gold", icon: "✨", title: "画壁仙砂", desc: "每次绝咬命中散落仙砂，追加 22 点破甲伤害" },
      { id: "xiaoqian_silk", icon: "🎀", title: "聂小倩白绫", desc: "神虫暴击几率提升 50%，气力积攒速度翻倍" },
      { id: "lupan_brush", icon: "🖌️", title: "陆判朱砂笔", desc: "血量低于 35% 时，攻击力狂增 200%" },
      { id: "plum_wing", icon: "🛡️", title: "梅花重羽", desc: "受到近战伤害时，反弹 40% 伤害给妖兽" },
      { id: "thunder_ant", icon: "⚡", title: "雷鸣赤须", desc: "草丝逗弄时释放赤雷，直接令妖兽大僵直" },
      { id: "dragon_fang", icon: "🗡️", title: "龙骨金齿", desc: "妖兽血量低于 25% 时一击必杀" }
    ];
  }

  show() {
    if (!this.container) return;
    this.container.hidden = false;
    sound.playPaperFlip();
    this.renderUI();
    this.startFloor(this.currentFloor);
  }

  renderUI() {
    this.container.innerHTML = `
      <div class="coliseum-modal">
        <div class="coliseum-header">
          <div class="coliseum-title-wrap">
            <h3 style="color:#d4af37;font-family:var(--font-kai);margin:0;font-size:18px;">【 聊 斋 百 妖 奇 斗 · 鬼 市 擂 台 】</h3>
            <small style="color:#8c9e8e;font-size:11px;">鬼市黑斗 · 胜出可获聊斋至宝 · 当前第 <span id="coliseum-floor-num" style="color:#e5b95c;font-weight:bold;">${this.currentFloor}</span> 层</small>
          </div>
          <button class="sandbox-close-btn" id="btn-close-coliseum" type="button">离开鬼市</button>
        </div>

        <div class="coliseum-relics-bar" id="coliseum-relics-bar">
          <span style="font-size:11px;color:#c49c48;font-weight:bold;">已获奇珍法宝：</span>
          ${this.relics.length === 0 ? '<span style="font-size:11px;color:#666;">暂无法宝（胜出可选）</span>' : ''}
          ${this.relics.map(r => `<span class="relic-badge">${r.icon} ${r.title}</span>`).join('')}
        </div>

        <div class="coliseum-arena-box" id="coliseum-arena-box">
          <canvas id="coliseum-canvas"></canvas>
          <div id="coliseum-fx-layer" style="position:absolute;inset:0;pointer-events:none;"></div>
        </div>

        <div class="coliseum-controls">
          <button class="coliseum-btn" id="btn-c-tease" type="button">
            <strong>草丝逗弄</strong><small>蓄势聚灵 (J)</small>
          </button>
          <button class="coliseum-btn" id="btn-c-parry" type="button">
            <strong>侧身辟邪</strong><small>化解破绽 (K)</small>
          </button>
          <button class="coliseum-btn" id="btn-c-strike" type="button">
            <strong>神虫绝咬</strong><small>扑噬斩妖 (L)</small>
          </button>
        </div>

        <div id="coliseum-draft-layer" class="coliseum-draft-modal" hidden></div>
      </div>
    `;

    document.getElementById("btn-close-coliseum").onclick = () => {
      this.stop();
      this.container.hidden = true;
    };

    document.getElementById("btn-c-tease").onclick = () => this.handleTease();
    document.getElementById("btn-c-parry").onclick = () => this.handleParry();
    document.getElementById("btn-c-strike").onclick = () => this.handleStrike();

    this.canvas = document.getElementById("coliseum-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.resizeCanvas();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const box = document.getElementById("coliseum-arena-box");
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 680;
    this.height = rect.height || 340;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    if (this.ctx) {
      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
    }
  }

  startFloor(floor) {
    this.currentFloor = floor;
    const beastIdx = (floor - 1) % this.beasts.length;
    this.curBeast = this.beasts[beastIdx];

    this.playerHp = this.maxPlayerHp;
    this.enemyHp = this.curBeast.maxHp + Math.floor((floor - 1) * 25);
    this.maxEnemyHp = this.enemyHp;
    this.momentum = 0;
    this.enemyState = "idle";
    this.playerState = "idle";
    this.isRunning = true;

    const fn = document.getElementById("coliseum-floor-num");
    if (fn) fn.innerText = this.currentFloor;

    sound.playBurstChirps(2);
    this.scheduleEnemyAction();
    this.loop();
  }

  handleTease() {
    if (!this.isRunning) return;
    sound.playStrawTickle();
    this.playerState = "tease";
    if (this.playerActionTimer) clearTimeout(this.playerActionTimer);
    this.playerActionTimer = setTimeout(() => { this.playerState = "idle"; }, 350);

    const hasThunder = this.hasRelic("thunder_ant");
    this.momentum = Math.min(100, this.momentum + (hasThunder ? 50 : 35));
    this.spawnCombatText(this.width * 0.28, this.height * 0.35, "蓄势聚灵！", "#e5b95c");

    if (hasThunder && Math.random() > 0.4) {
      this.enemyState = "stunned";
      sound.playCriticalHitHole();
      this.spawnCombatText(this.width * 0.72, this.height * 0.35, "【赤雷震慑！】", "#ff3300");
      setTimeout(() => { this.enemyState = "idle"; }, 1500);
    }
  }

  handleParry() {
    if (!this.isRunning) return;
    sound.playTaijiParry();
    this.playerState = "parry";
    if (this.playerActionTimer) clearTimeout(this.playerActionTimer);
    this.playerActionTimer = setTimeout(() => { this.playerState = "idle"; }, 350);

    this.spawnCombatText(this.width * 0.28, this.height * 0.35, "侧身辟邪！", "#6ed185");

    // 羁绊判定：残影金砂爆
    if (this.hasRelic("laoshan_talisman") && this.hasRelic("huabi_gold")) {
      const synDmg = 40;
      this.enemyHp = Math.max(0, this.enemyHp - synDmg);
      sound.playCriticalHitHole();
      this.spawnCombatText(this.width * 0.5, this.height * 0.3, "⚡ 羁绊【残影金砂爆】 -40", "#ffd700");
      if (this.enemyHp <= 0) {
        this.handleFloorWin();
        return;
      }
    }

    if (this.enemyState === "windup") {
      this.enemyState = "stunned";
      this.momentum = 100;
      sound.playCriticalHitHole();
      this.spawnCombatText(this.width * 0.72, this.height * 0.35, "【完美化劲 · 破绽！】", "#ffd700");
      setTimeout(() => { this.enemyState = "idle"; }, 1600);
    }
  }

  handleStrike() {
    if (!this.isRunning) return;
    this.playerState = "strike";
    if (this.playerActionTimer) clearTimeout(this.playerActionTimer);
    this.playerActionTimer = setTimeout(() => { this.playerState = "idle"; }, 400);

    const isCrit = this.momentum >= 50 || this.enemyState === "stunned" || this.hasRelic("xiaoqian_silk");
    let dmg = isCrit ? 65 : 35;

    if (this.hasRelic("huabi_gold")) dmg += 22;
    if (this.hasRelic("lupan_brush") && (this.playerHp / this.maxPlayerHp) <= 0.35) dmg *= 2.0;

    // 斩杀判定
    if (this.hasRelic("dragon_fang") && (this.enemyHp / this.maxEnemyHp) <= 0.25) {
      dmg = this.enemyHp;
    }

    if (this.enemyHp <= dmg + 10) dmg = this.enemyHp;

    this.enemyHp = Math.max(0, this.enemyHp - dmg);
    this.momentum = 0;

    const box = document.getElementById("coliseum-arena-box");
    if (box) {
      box.classList.add("screen-shake");
      setTimeout(() => box.classList.remove("screen-shake"), 200);
    }

    if (isCrit) {
      sound.playCriticalHitHole();
      this.spawnCombatText(this.width * 0.72, this.height * 0.35, `【神虫绝杀】 -${Math.round(dmg)}`, "#ffd700");
    } else {
      sound.playBite();
      this.spawnCombatText(this.width * 0.72, this.height * 0.35, `-${Math.round(dmg)}`, "#ff6666");
    }

    if (this.enemyHp <= 0) {
      this.handleFloorWin();
    }
  }

  spawnCombatText(x, y, text, color) {
    const fx = document.getElementById("coliseum-fx-layer");
    if (!fx) return;
    const el = document.createElement("div");
    el.className = "hit-spark";
    el.innerText = text;
    el.style.left = (x - 30) + "px";
    el.style.top = (y - 20) + "px";
    el.style.color = color;
    el.style.fontSize = "15px";
    el.style.textShadow = "0 0 10px rgba(0,0,0,0.9)";
    fx.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  hasRelic(id) {
    return this.relics.some(r => r.id === id);
  }

  scheduleEnemyAction() {
    if (!this.isRunning || this.enemyHp <= 0) return;
    if (this.enemyActionTimer) clearTimeout(this.enemyActionTimer);

    this.enemyActionTimer = setTimeout(() => {
      if (!this.isRunning || this.enemyHp <= 0) return;

      if (this.enemyState === "idle") {
        this.enemyState = "windup";
        sound.playChirp(0.1, 0.2);

        this.enemyActionTimer = setTimeout(() => {
          if (this.enemyState === "windup") {
            this.enemyState = "attack";

            const incomingDmg = this.curBeast.atk;
            this.playerHp = Math.max(0, this.playerHp - incomingDmg);
            sound.playBite();
            this.spawnCombatText(this.width * 0.28, this.height * 0.45, `-${incomingDmg}`, "#ff3b30");

            if (this.hasRelic("plum_wing")) {
              const refDmg = Math.floor(incomingDmg * 0.4);
              this.enemyHp = Math.max(0, this.enemyHp - refDmg);
              this.spawnCombatText(this.width * 0.72, this.height * 0.45, `【羽盾反震】 -${refDmg}`, "#c49c48");
            }

            if (this.playerHp <= 0) {
              this.handleColiseumDefeat();
              return;
            }

            this.enemyActionTimer = setTimeout(() => {
              this.enemyState = "idle";
              this.scheduleEnemyAction();
            }, 320);
          }
        }, 950);
      } else {
        this.scheduleEnemyAction();
      }
    }, 1100);
  }

  handleFloorWin() {
    this.isRunning = false;
    if (this.enemyActionTimer) clearTimeout(this.enemyActionTimer);
    sound.playBurstChirps(4);
    setTimeout(() => this.showDraftModal(), 500);
  }

  handleColiseumDefeat() {
    this.isRunning = false;
    if (this.enemyActionTimer) clearTimeout(this.enemyActionTimer);
    alert(`在鬼市第 ${this.currentFloor} 层力竭。重整旗鼓再战！`);
    this.container.hidden = true;
  }

  showDraftModal() {
    const draftLayer = document.getElementById("coliseum-draft-layer");
    if (!draftLayer) return;
    draftLayer.hidden = false;

    const available = this.allRelicsPool.filter(r => !this.hasRelic(r.id));
    const choices = available.sort(() => 0.5 - Math.random()).slice(0, 3);

    draftLayer.innerHTML = `
      <div class="draft-modal-box">
        <h3 style="color:#d4af37;margin:0;font-family:var(--font-kai);font-size:18px;">【 鬼 市 货 郎 · 选 择 聊 斋 至 宝 】</h3>
        <p style="color:#a8bfae;font-size:12px;font-family:var(--font-serif);margin:6px 0 14px 0;">斩杀【${this.curBeast.name}】！请挑选一件奇珍法宝加持神虫：</p>
        
        <div class="draft-cards-grid">
          ${choices.map(c => `
            <div class="relic-card" data-relic-id="${c.id}">
              <div class="relic-icon" style="font-size:24px;">${c.icon}</div>
              <div class="relic-title" style="color:#e5b95c;font-weight:bold;margin:4px 0;">${c.title}</div>
              <div class="relic-desc" style="font-size:11px;color:#c8d4ca;line-height:1.4;">${c.desc}</div>
            </div>
          `).join('')}
        </div>

        <button class="choice-btn btn-kind" id="btn-skip-draft" type="button" style="margin-top:14px;max-width:200px;">攀登下一层（第 ${this.currentFloor + 1} 层）</button>
      </div>
    `;

    draftLayer.querySelectorAll(".relic-card").forEach(card => {
      card.onclick = () => {
        const rId = card.getAttribute("data-relic-id");
        const found = this.allRelicsPool.find(r => r.id === rId);
        if (found) this.relics.push(found);
        draftLayer.hidden = true;
        this.renderUI();
        this.startFloor(this.currentFloor + 1);
      };
    });

    document.getElementById("btn-skip-draft").onclick = () => {
      draftLayer.hidden = true;
      this.renderUI();
      this.startFloor(this.currentFloor + 1);
    };
  }

  loop() {
    if (!this.isRunning || !this.ctx) return;
    this.tellCycle += 0.04;
    this.render();
    this.animFrame = requestAnimationFrame(() => this.loop());
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. 幽冥鬼市战罐阴影与八卦暗纹
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(this.width * 0.5, this.height * 0.65, this.width * 0.42, this.height * 0.20, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 玩家神虫【小梅花】（动态飞跃扑咬、避邪退后动效）
    ctx.save();
    let px = this.width * 0.28;
    let py = this.height * 0.50;

    if (this.playerState === "strike") {
      px += 140;
      py -= 25;
    } else if (this.playerState === "parry") {
      px -= 30;
    } else if (this.playerState === "tease") {
      px += Math.sin(this.tellCycle * 20) * 8;
    }

    ctx.translate(px, py);

    if (this.playerState === "strike") {
      ctx.rotate(0.35);
      // 扑咬金光斩击弧光
      ctx.strokeStyle = "rgba(247, 208, 87, 0.85)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 52, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.stroke();
    }

    if (this.playerImg.complete && this.playerImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, -6, 42, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(this.playerImg, -46, -52, 92, 92);
      ctx.restore();

      ctx.strokeStyle = this.momentum >= 50 ? "#ffd700" : "#6ed185";
      ctx.lineWidth = this.playerState === "strike" ? 4 : 2.5;
      ctx.beginPath();
      ctx.arc(0, -6, 42, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#3d604b";
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 触须抖动
    const antWave = Math.sin(this.tellCycle * 6) * 4;
    ctx.strokeStyle = "#f0c850";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(22, -8);
    ctx.quadraticCurveTo(42, -28 + antWave, 64, -20 + antWave);
    ctx.moveTo(22, 0);
    ctx.quadraticCurveTo(42, 24 - antWave, 64, 16 - antWave);
    ctx.stroke();

    // 玩家血条与名号
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px STKaiti, serif";
    ctx.textAlign = "center";
    ctx.fillText("神虫 · 小梅花", 0, -56);

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(-35, -50, 70, 5);
    ctx.fillStyle = "#6ed185";
    ctx.fillRect(-35, -50, Math.max(0, (this.playerHp / this.maxPlayerHp) * 70), 5);
    ctx.restore();

    // 3. 敌方聊斋异兽（动态出招）
    ctx.save();
    let ex = this.enemyState === "attack" ? this.width * 0.45 : (this.enemyState === "windup" ? this.width * 0.74 : this.width * 0.72);
    let ey = this.height * 0.48;
    ctx.translate(ex, ey);

    if (this.enemyState === "windup") {
      ctx.fillStyle = "rgba(229, 92, 59, 0.45)";
      ctx.beginPath();
      ctx.arc(0, -6, 58, 0, Math.PI * 2);
      ctx.fill();
    }

    this.drawLiaozhaiBeast(ctx, this.curBeast);

    // 敌方血条与名号
    ctx.fillStyle = this.curBeast.color;
    ctx.font = "bold 13px STKaiti, serif";
    ctx.textAlign = "center";
    ctx.fillText(this.curBeast.name, 0, -64);
    ctx.font = "10px STSong, serif";
    ctx.fillStyle = "#a8bfae";
    ctx.fillText(this.curBeast.title, 0, -50);

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(-45, -42, 90, 6);
    ctx.fillStyle = this.curBeast.color;
    ctx.fillRect(-45, -42, Math.max(0, (this.enemyHp / this.maxEnemyHp) * 90), 6);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-45, -42, 90, 6);
    ctx.restore();
  }

  drawLiaozhaiBeast(ctx, beast) {
    const bId = beast.id;
    const pulse = Math.sin(this.tellCycle * 5) * 4;

    if (bId === "spider") {
      ctx.strokeStyle = "rgba(156, 58, 214, 0.4)";
      ctx.lineWidth = 1.5;
      for (let a = 0; a < 6; a++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 60, Math.sin(a) * 60);
        ctx.stroke();
      }

      ctx.fillStyle = "#160a22";
      ctx.strokeStyle = "#9c3ad6";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#35154f";
      ctx.beginPath();
      ctx.arc(14, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#8526be";
      ctx.lineWidth = 3.0;
      [-12, -4, 4, 12].forEach((offset, idx) => {
        ctx.beginPath();
        ctx.moveTo(offset, -8);
        ctx.lineTo(offset * 2 - 15, -34 + (idx % 2 ? pulse : -pulse));
        ctx.lineTo(offset * 2.5 - 20, -18);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(offset, 8);
        ctx.lineTo(offset * 2 - 15, 34 + (idx % 2 ? -pulse : pulse));
        ctx.lineTo(offset * 2.5 - 20, 18);
        ctx.stroke();
      });

      ctx.fillStyle = "#e07aff";
      ctx.beginPath();
      ctx.arc(18, -4, 2.5, 0, Math.PI * 2);
      ctx.arc(18, 4, 2.5, 0, Math.PI * 2);
      ctx.fill();

    } else if (bId === "cicada") {
      ctx.fillStyle = "rgba(209, 168, 59, 0.25)";
      ctx.beginPath();
      ctx.ellipse(-15 + pulse, -8, 30, 12, -0.3, 0, Math.PI * 2);
      ctx.ellipse(-15 + pulse, 8, 30, 12, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#2a3d24";
      ctx.strokeStyle = "#d1a83b";
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#f0c850";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(-6, -6, 24, 8, -0.2, 0, Math.PI * 2);
      ctx.ellipse(-6, 6, 24, 8, 0.2, 0, Math.PI * 2);
      ctx.stroke();

    } else if (bId === "bee") {
      ctx.fillStyle = "#e58b2b";
      ctx.beginPath();
      ctx.ellipse(-8, 0, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#1e140a";
      ctx.fillRect(-14, -10, 6, 20);
      ctx.fillRect(-2, -11, 6, 22);

      ctx.fillStyle = "#ff2200";
      ctx.beginPath();
      ctx.moveTo(-28, 0);
      ctx.lineTo(-38, -3);
      ctx.lineTo(-38, 3);
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.ellipse(0, -18 + pulse, 18, 7, -0.4, 0, Math.PI * 2);
      ctx.fill();

    } else if (bId === "centipede") {
      ctx.fillStyle = "#2b100d";
      ctx.strokeStyle = "#c43b2d";
      ctx.lineWidth = 2.0;

      for (let seg = -4; seg <= 4; seg++) {
        ctx.beginPath();
        ctx.ellipse(seg * 9, 0, 8, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(seg * 9, -12);
        ctx.lineTo(seg * 9 - 4, -24 + (seg % 2 ? pulse : -pulse));
        ctx.moveTo(seg * 9, 12);
        ctx.lineTo(seg * 9 - 4, 24 + (seg % 2 ? -pulse : pulse));
        ctx.stroke();
      }

      ctx.strokeStyle = "#ff4d4d";
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(38, -6);
      ctx.lineTo(52, -1);
      ctx.moveTo(38, 6);
      ctx.lineTo(52, 1);
      ctx.stroke();

    } else {
      ctx.fillStyle = "#1b3d2b";
      ctx.strokeStyle = "#2ea86b";
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.ellipse(0, 0, 38, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0c1f14";
      ctx.beginPath();
      ctx.arc(-8, -6, 4, 0, Math.PI * 2);
      ctx.arc(-8, 6, 4, 0, Math.PI * 2);
      ctx.ellipse(4, 0, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(46, 168, 107, 0.25)";
      ctx.beginPath();
      ctx.arc(0, 0, 48 + pulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.enemyActionTimer) clearTimeout(this.enemyActionTimer);
    if (this.playerActionTimer) clearTimeout(this.playerActionTimer);
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }
}
