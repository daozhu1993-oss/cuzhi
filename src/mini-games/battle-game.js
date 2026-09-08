// 拍⑤：核心斗虫与三阶段史诗 Boss 战引擎 v12
// （工笔微距画风 · 大公鸡三幕式电影级对决 · 顿帧水墨打击 · 琴舞五音起舞）
import { sound } from "../engine/audio.js";
import { state } from "../engine/state.js";
import { storage } from "../engine/storage.js";
import { opponentsData } from "../data/opponents.js";
import { imageAssets } from "../data/assets.js";

export class BattleGame {
  constructor(options) {
    this.canvas = document.getElementById("battle-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.onVictory = options.onVictory;
    this.onDefeat = options.onDefeat;
    this.particleEngine = options.particleEngine;

    this.currentOpponentIndex = 0;
    this.opponent = null;

    // 玩家小促织状态
    this.playerHp = 100;
    this.maxPlayerHp = 100;
    this.momentum = 0;
    this.parryUntil = 0;
    this.parryCooldownUntil = 0;
    this.attackUntil = 0;
    this.attackCooldownUntil = 0;
    this.isTeased = false;
    this.isVictoryPosture = false;
    this.playerFlinchUntil = 0;

    // 敌方状态
    this.enemyHp = 100;
    this.maxEnemyHp = 100;
    this.enemyState = "idle"; // idle, windup, attack, stuck_beak, stunned, dead
    this.enemyFlinchUntil = 0;
    this.enemyActionTimer = null;
    this.stuckBeakUntil = 0;

    // 大公鸡三阶段专用计数
    this.roosterPhase = 1; // 1: 避啄, 2: 飞跃鸡冠, 3: 锁冠狂战
    this.combBitesCount = 0;

    // 琴舞节奏音游
    this.danceSteps = 0;
    this.maxDanceSteps = 5;

    // 触摸手势
    this.touchStraw = { active: false, x: 0, y: 0 };
    this.touchStartPos = { x: 0, y: 0 };
    this.isDragging = false;
    this.lastTapTime = 0;

    // 渲染与动画
    this.danmuTimer = null;
    this.tellCycle = 0;
    this.animFrame = null;
    this.isRunning = false;
    this.hitstopUntil = 0;
    this.width = 600;
    this.height = 300;

    // 高画质工笔画资产
    this.playerImg = new Image();
    this.playerImg.src = (typeof imageAssets !== "undefined" && imageAssets.illustration_cricket_god) || "";

    this.crabImg = new Image();
    this.crabImg.src = (typeof imageAssets !== "undefined" && imageAssets.illustration_crab_cricket) || "";

    this.steelImg = new Image();
    this.steelImg.src = (typeof imageAssets !== "undefined" && imageAssets.illustration_steel_cricket) || "";

    this.roosterImg = new Image();
    this.roosterImg.src = (typeof imageAssets !== "undefined" && imageAssets.illustration_rooster) || "";

    this.palaceBgImg = new Image();
    this.palaceBgImg.src = (typeof imageAssets !== "undefined" && imageAssets.bg_imperial_palace) || "";

    this.crowdComments = [
      "好虫！", "神了！", "这瘦虫竟如此了得！", "好一身梅花翅！",
      "咬它！", "直跃鸡冠！", "好利害的牙口！", "真乃神虫也！"
    ];

    this.secondPlayComments = [
      "……不过是一只虫罢了。", "天下人命，不如宫中一戏。",
      "万金买一笑，谁管瓦底魂。", "好狠的局……"
    ];

    this.bindEvents();
    this.bindTouchGestures();
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

  bindTouchGestures() {
    const bowl = document.getElementById("arena-bowl");
    if (!bowl) return;

    const onStart = (clientX, clientY) => {
      if (!this.isRunning) return;
      const rect = bowl.getBoundingClientRect();
      this.touchStartPos = { x: clientX - rect.left, y: clientY - rect.top };
      this.touchStraw.active = true;
      this.touchStraw.x = this.touchStartPos.x;
      this.touchStraw.y = this.touchStartPos.y;
      this.isDragging = false;
    };

    const onMove = (clientX, clientY) => {
      if (!this.isRunning || !this.touchStraw.active) return;
      const rect = bowl.getBoundingClientRect();
      const curX = clientX - rect.left;
      const curY = clientY - rect.top;

      const moveDist = Math.hypot(curX - this.touchStartPos.x, curY - this.touchStartPos.y);
      if (moveDist > 10) this.isDragging = true;

      this.touchStraw.x = curX;
      this.touchStraw.y = curY;

      // 挑逗玩家促织蓄力
      const px = this.width * 0.22;
      const py = this.height * 0.58;
      const dist = Math.hypot(curX - px, curY - py);

      if (dist < 60 && !this.opponent?.isPalaceDance) {
        state.stats.strawTeaseCount++;
        this.momentum = Math.min(100, this.momentum + 4.5);
        this.isTeased = true;
        sound.playStrawTickle();
        this.updateHUD();
      }
    };

    const onEnd = (clientX, clientY) => {
      if (!this.isRunning) return;
      this.touchStraw.active = false;

      if (this.opponent?.isPalaceDance) {
        this.handleDanceStep();
        return;
      }

      if (!this.isDragging) {
        const now = performance.now();
        if (now - this.lastTapTime < 300) {
          this.handleStrike();
        } else {
          this.handleParry();
        }
        this.lastTapTime = now;
      }
    };

    bowl.addEventListener("touchstart", (e) => {
      if (e.touches.length > 0) onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    bowl.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    bowl.addEventListener("touchend", (e) => {
      if (e.changedTouches.length > 0) onEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    });

    bowl.addEventListener("mousedown", (e) => onStart(e.clientX, e.clientY));
    bowl.addEventListener("mousemove", (e) => { if (e.buttons === 1) onMove(e.clientX, e.clientY); });
    bowl.addEventListener("mouseup", (e) => onEnd(e.clientX, e.clientY));
  }

  startMatch(opponentIndex = 0) {
    if (this.enemyActionTimer) clearTimeout(this.enemyActionTimer);
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
    this.parryUntil = 0;
    this.parryCooldownUntil = 0;
    this.attackUntil = 0;
    this.attackCooldownUntil = 0;
    this.enemyHp = this.opponent.maxHp;
    this.maxEnemyHp = this.opponent.maxHp;
    this.enemyState = "idle";
    this.danceSteps = 0;
    this.roosterPhase = 1;
    this.combBitesCount = 0;

    const pName = document.getElementById("my-cricket-name");
    if (pName) pName.innerText = state.smallCricketName || "小梅花";

    this.setupControlsMode();
    this.updateHUD();
    sound.playBurstChirps(2);

    this.startDanmu();

    if (this.opponent.isPalaceDance) {
      sound.playBGM("beat5_palace");
      sound.playQinDanceStep(0);
      const hint = document.getElementById("battle-hint-bar");
      if (hint) hint.innerText = "琴瑟和鸣 · 点按全屏应节而舞！";
    } else {
      sound.playBGM("beat5");
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
          <span>闻琴起舞 · 击节振翅（轻点全屏）</span>
        </button>
      `;
      const btnDance = document.getElementById("btn-dance");
      if (btnDance) btnDance.onclick = (e) => { e.stopPropagation(); this.handleDanceStep(); };
    } else {
      const isRooster = !!this.opponent.isSpecialRooster;
      const strikeTitle = isRooster ? "直跃鸡冠" : "疾进直前";
      const strikeSub = isRooster ? "飞绝腾空" : "乘胜绝杀";
      const parrySub = isRooster ? "避其巨喙" : "破其锋芒";

      controls.innerHTML = `
        <button class="battle-btn btn-tease" id="btn-tease" type="button">
          <span class="key-hint">划屏/J</span><strong>草丝挑逗</strong><small>激怒蓄势</small>
        </button>
        <button class="battle-btn btn-parry" id="btn-parry" type="button">
          <span class="key-hint">点屏/K</span><strong>侧身避咬</strong><small>${parrySub}</small>
        </button>
        <button class="battle-btn btn-strike" id="btn-strike" type="button">
          <span class="key-hint">双击/L</span><strong>${strikeTitle}</strong><small>${strikeSub}</small>
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
    
    const bowl = document.getElementById("arena-bowl");
    if (bowl) {
      if (this.playerHp <= 30 && this.playerHp > 0) {
        bowl.classList.add("desperation-state");
      } else {
        bowl.classList.remove("desperation-state");
      }
    }

    if (mFill) mFill.style.width = this.momentum + "%";
    if (eFill) eFill.style.width = Math.max(0, (this.enemyHp / this.maxEnemyHp) * 100) + "%";
    if (vsBadge) vsBadge.innerText = this.opponent.title.split(" · ")[0];
    if (enemyName) enemyName.innerText = this.opponent.name;

    if (comboBadge) {
      const stakes = [
        "对局：一吊铜钱 vs 半斗米",
        "筹码：免除徭役 补邑庠生",
        "大决：抚军巨雄鸡 生死之战",
        "天赏：御前金案 龙颜弄乐"
      ];
      comboBadge.innerText = stakes[this.currentOpponentIndex] || "激战进行中";
    }

    if (enemyStatus) {
      if (this.opponent.isPalaceDance) {
        enemyStatus.innerText = `御案弄乐 · 节拍 ${this.danceSteps}/${this.maxDanceSteps}`;
      } else if (this.enemyState === "stuck_beak") {
        enemyStatus.innerText = "【巨喙卡地大僵直！】直跃鸡冠！";
      } else if (this.enemyState === "windup") {
        enemyStatus.innerText = "【前摇破绽！】单点避咬！";
      } else if (this.enemyState === "stunned") {
        enemyStatus.innerText = "【大破僵直！】双击绝杀！";
      } else if (this.enemyState === "attack") {
        enemyStatus.innerText = "【猛烈攻来！】";
      } else {
        enemyStatus.innerText = "昂首对峙";
      }
    }
  }

  // 1. 草丝引逗
  handleTease() {
    if (!this.isRunning) return;
    state.stats.strawTeaseCount++;
    sound.playStrawTickle();
    this.momentum = Math.min(100, this.momentum + 40);
    this.isTeased = true;
    sound.playChirp(0.16, 0.25);

    const straw = document.getElementById("straw-brush");
    if (straw) {
      straw.style.opacity = "1";
      straw.style.left = (this.width * 0.22) + "px";
      straw.style.top = (this.height * 0.55) + "px";
      setTimeout(() => { straw.style.opacity = "0"; }, 160);
    }

    if (this.particleEngine) {
      this.particleEngine.spawnHitSparks(this.width * 0.25, this.height * 0.45, "势起！");
    }
    this.updateHUD();
  }

  // 2. 侧身避咬（精准避招窗口 · 大公鸡避啄诱导巨喙卡地）
  handleParry() {
    const now = performance.now();
    if (!this.isRunning || now < this.parryCooldownUntil) return;

    this.parryUntil = now + 280;
    this.parryCooldownUntil = now + 340;
    state.stats.totalParries++;
    sound.playParry();

    if (this.enemyState === "windup") {
      if (this.opponent.isSpecialRooster) {
        // 大公鸡猛啄落空，巨喙深陷泥地卡住（大破绽）
        this.enemyState = "stuck_beak";
        this.stuckBeakUntil = now + 2400;
        this.momentum = 100;
        sound.playCriticalHitHole();
        sound.vibrate([60, 80]);

        if (this.particleEngine) {
          this.particleEngine.spawnHitSparks(this.width * 0.65, this.height * 0.65, "巨喙卡地！");
        }
        const hint = document.getElementById("battle-hint-bar");
        if (hint) hint.innerText = "公鸡巨喙深陷泥地！立即【双击/直跃鸡冠】绝杀！";

        setTimeout(() => {
          if (this.enemyState === "stuck_beak") {
            this.enemyState = "idle";
            this.updateHUD();
            this.scheduleEnemyAction();
          }
        }, 2400);

      } else {
        // 敌虫大破僵直
        this.enemyState = "stunned";
        this.momentum = 100;
        sound.playBurstChirps(3);
        sound.vibrate([40, 60]);

        if (this.particleEngine) {
          this.particleEngine.spawnHitSparks(this.width * 0.72, this.height * 0.45, "大破其锋！");
        }
        const hint = document.getElementById("battle-hint-bar");
        if (hint) hint.innerText = "敌虫大破僵直！立即【双击绝杀】！";

        setTimeout(() => {
          if (this.enemyState === "stunned") {
            this.enemyState = "idle";
            this.updateHUD();
            this.scheduleEnemyAction();
          }
        }, 1800);
      }
    }

    this.updateHUD();
  }

  // 3. 扑咬绝杀（大公鸡直跃鸡冠 · 智能斩杀）
  handleStrike() {
    const now = performance.now();
    if (!this.isRunning || now < this.attackCooldownUntil) return;
    this.attackUntil = now + 340;
    this.attackCooldownUntil = now + 160;
    state.stats.totalStrikes++;

    const isStuck = this.enemyState === "stuck_beak" || this.enemyState === "stunned";
    const isCrit = this.momentum >= 60 || isStuck;
    let dmg = isCrit ? (this.opponent.isSpecialRooster ? 65 : 50) : 35;

    // 残血直接触发致命斩杀
    if (this.enemyHp <= dmg + 10) {
      dmg = this.enemyHp;
    }

    if (isCrit) {
      this.hitstopUntil = now + 90;
      sound.playCriticalHitHole();
      const bowl = document.getElementById("arena-bowl");
      if (bowl) {
        bowl.classList.add("screen-shake");
        setTimeout(() => bowl.classList.remove("screen-shake"), 180);
      }
    } else {
      sound.playBite();
      sound.vibrate(30);
    }

    this.enemyFlinchUntil = now + 260;
    this.enemyHp = Math.max(0, this.enemyHp - dmg);
    this.momentum = 0;

    const hitLabel = this.opponent.isSpecialRooster ? (isCrit ? " 啮其冠肉！" : " 扑啄！") : (isCrit ? " 绝杀！" : "");
    this.spawnCombatText(this.width * 0.72, this.height * 0.35, `-${dmg}` + hitLabel, isCrit ? "#e5b95c" : "#ffffff");

    if (this.opponent.isSpecialRooster) {
      sound.playRoosterSquawk();
      if (this.particleEngine) {
        this.particleEngine.spawnHitSparks(this.width * 0.72, this.height * 0.22, isCrit ? "直跃鸡冠！" : "纵身！");
      }
    }

    this.updateHUD();

    if (this.enemyHp <= 0) {
      this.enemyState = "dead";
      this.isVictoryPosture = true;
      sound.playBurstChirps(4);
      const hint = document.getElementById("battle-hint-bar");
      if (hint) hint.innerText = this.opponent.isSpecialRooster ? "【奇虫伏鸡 · 抚军大骇！】" : "【大获全胜 · 敌寇伏诛！】";
      this.handleMatchWin();
    }
  }

  spawnCombatText(x, y, text, color = "#a8382b") {
    const fxLayer = document.getElementById("battle-fx");
    if (!fxLayer) return;
    const txt = document.createElement("div");
    txt.className = "hit-spark";
    txt.innerText = text;
    txt.style.left = (x - 20) + "px";
    txt.style.top = (y - 30) + "px";
    txt.style.color = color;
    txt.style.textShadow = "0 0 10px rgba(0,0,0,0.8)";
    fxLayer.appendChild(txt);
    setTimeout(() => txt.remove(), 700);
  }

  // 4. 敌方攻击调度
  scheduleEnemyAction() {
    if (!this.isRunning || this.enemyHp <= 0 || this.opponent.isPalaceDance) return;
    if (this.enemyActionTimer) clearTimeout(this.enemyActionTimer);

    const delay = Math.random() * 700 + (this.opponent.speed > 1.2 ? 800 : 1200);

    this.enemyActionTimer = setTimeout(() => {
      if (!this.isRunning || this.enemyHp <= 0 || this.enemyState === "stunned" || this.enemyState === "stuck_beak" || this.opponent.isPalaceDance) return;

      if (this.enemyState === "idle") {
        this.enemyState = "windup";
        this.updateHUD();
        sound.playChirp(0.12, 0.25);

        this.enemyActionTimer = setTimeout(() => {
          if (this.enemyState === "windup") {
            this.enemyState = "attack";
            this.updateHUD();

            const now = performance.now();
            const parryActive = now <= this.parryUntil;

            if (!parryActive) {
              const incomingDmg = this.opponent.attackPower;
              this.playerHp = Math.max(0, this.playerHp - incomingDmg);
              this.playerFlinchUntil = performance.now() + 300;
              this.momentum = Math.max(0, this.momentum - 15);

              sound.playBite();
              sound.vibrate([50, 30, 60]);

              this.spawnCombatText(this.width * 0.22, this.height * 0.4, `-${incomingDmg}`, "#ff3b30");

              const bowl = document.getElementById("arena-bowl");
              if (bowl) {
                bowl.classList.add("screen-shake");
                setTimeout(() => bowl.classList.remove("screen-shake"), 180);
              }

              this.updateHUD();

              if (this.playerHp <= 0) {
                this.handleMatchDefeat();
                return;
              }
            } else {
              sound.playParry();
            }

            this.enemyActionTimer = setTimeout(() => {
              if (this.enemyState === "attack") {
                this.enemyState = "idle";
                this.updateHUD();
                this.scheduleEnemyAction();
              }
            }, 320);
          }
        }, this.opponent.windupDuration);
      } else {
        this.scheduleEnemyAction();
      }
    }, delay);
  }

  // 5. 御案弄乐节奏交互
  handleDanceStep() {
    if (!this.isRunning || !this.opponent.isPalaceDance) return;
    this.danceSteps++;
    sound.playQinDanceStep(this.danceSteps);
    sound.playBurstChirps(1);

    if (this.particleEngine) {
      const glyphs = ["宫", "商", "角", "徵", "羽", "♪"];
      this.particleEngine.spawnMusicNote(this.width * (0.35 + Math.random() * 0.3), this.height * 0.45, glyphs[this.danceSteps % glyphs.length]);
    }

    this.updateHUD();

    if (this.danceSteps >= this.maxDanceSteps) {
      this.handleMatchWin();
    }
  }

  // 战败救援
  handleMatchDefeat() {
    this.isRunning = false;
    if (this.enemyActionTimer) clearTimeout(this.enemyActionTimer);
    state.stats.sufferedDefeats++;
    if (this.danmuTimer) clearInterval(this.danmuTimer);

    const bowl = document.getElementById("arena-bowl");
    if (bowl) bowl.classList.add("screen-shake");
    sound.vibrate([100, 50, 150]);

    setTimeout(() => {
      if (bowl) bowl.classList.remove("screen-shake");
      this.showEmergencyDefeatModal();
    }, 400);
  }

  showEmergencyDefeatModal() {
    let rescueModal = document.getElementById("rescue-modal");
    if (!rescueModal) {
      rescueModal = document.createElement("div");
      rescueModal.id = "rescue-modal";
      rescueModal.className = "rescue-modal";
      document.body.appendChild(rescueModal);
    }
    rescueModal.hidden = false;

    rescueModal.innerHTML = `
      <div class="rescue-box">
        <h4 style="color:#a8382b;">【 小虫力竭受挫 】</h4>
        <p>败于【${this.opponent.name}】之手。成名取清露敷伤调理，重振旗鼓！</p>
        <button class="rescue-action-btn" id="btn-do-rescue" type="button" style="background:#2b5c3b;margin-top:8px;">【 咬牙再战 】</button>
      </div>
    `;

    const btn = document.getElementById("btn-do-rescue");
    btn.onclick = (ev) => {
      ev.stopPropagation();
      rescueModal.remove();
      if (this.onDefeat) {
        this.onDefeat(this.opponent, this.currentOpponentIndex);
      }
      this.startMatch(this.currentOpponentIndex);
    };
  }

  handleMatchWin() {
    this.isRunning = false;
    if (this.enemyActionTimer) clearTimeout(this.enemyActionTimer);
    if (this.danmuTimer) clearInterval(this.danmuTimer);
    sound.playBurstChirps(4);

    setTimeout(() => {
      if (this.onVictory) {
        this.onVictory(this.opponent, this.currentOpponentIndex);
      }
    }, 450);
  }

  loop() {
    if (!this.isRunning && !this.ctx) return;
    
    if (performance.now() >= this.hitstopUntil) {
      this.tellCycle += 0.03;
      this.render();
    }
    
    this.animFrame = requestAnimationFrame(() => this.loop());
  }

  // ==========================================
  // 🖌️ 工笔水墨微距渲染引擎
  // ==========================================
  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = performance.now();
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. 微距盆底古沙与水墨明暗光影
    ctx.save();
    ctx.fillStyle = "rgba(16, 12, 8, 0.45)";
    ctx.beginPath();
    ctx.ellipse(this.width * 0.5, this.height * 0.8, this.width * 0.45, this.height * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 盆底古宣纸开片暗纹
    ctx.strokeStyle = "rgba(196, 156, 72, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.width * 0.15, this.height * 0.75);
    ctx.lineTo(this.width * 0.85, this.height * 0.75);
    ctx.moveTo(this.width * 0.3, this.height * 0.82);
    ctx.lineTo(this.width * 0.7, this.height * 0.82);
    ctx.stroke();
    ctx.restore();

    if (storage.isSecondPlaythroughOrMore()) {
      this.drawChildShadowMetaphor(ctx);
    }

    // 2. 敌方角色位置与绘制
    const isEnemyFlinching = now < this.enemyFlinchUntil;
    let ex = this.enemyState === "attack" ? this.width * 0.52 : (this.enemyState === "windup" ? this.width * 0.74 : this.width * 0.76);
    if (this.enemyState === "stuck_beak") ex = this.width * 0.62;
    if (isEnemyFlinching) ex += 12;
    let ey = this.height * 0.58;

    this.drawOpponent(ctx, ex, ey, isEnemyFlinching);

    // 3. 玩家小促织位置与抛物线飞跃计算
    const isPlayerFlinching = now < this.playerFlinchUntil;
    const isParrying = now < this.parryUntil;
    const isAttacking = now < this.attackUntil;

    let basePx = isParrying ? this.width * 0.16 : this.width * 0.22;
    let basePy = this.height * 0.58;
    let px = basePx;
    let py = basePy;

    if (isAttacking) {
      const progress = 1.0 - Math.max(0, (this.attackUntil - now) / 340);
      const jumpHeight = Math.sin(progress * Math.PI) * (this.opponent?.isSpecialRooster ? 90 : 40);
      const targetPx = this.opponent?.isSpecialRooster ? (ex - 12) : (ex - 45);
      const forwardFactor = Math.sin(progress * Math.PI);
      px = basePx + (targetPx - basePx) * forwardFactor;
      py = basePy - jumpHeight;
    }

    if (isPlayerFlinching) px -= 12;

    if (this.isVictoryPosture) {
      px = this.width * 0.35;
      py = this.height * 0.28;
    }

    this.drawPlayerCricket(ctx, px, py, isPlayerFlinching, isAttacking);

    if (this.touchStraw.active) {
      this.drawInteractiveStraw(ctx, this.touchStraw.x, this.touchStraw.y);
    }
  }

  drawChildShadowMetaphor(ctx) {
    ctx.save();
    ctx.translate(this.width * 0.22, this.height * 0.44);
    const flicker = 0.05 + Math.sin(this.tellCycle * 2) * 0.03;
    ctx.fillStyle = `rgba(180, 150, 100, ${flicker})`;

    ctx.beginPath();
    ctx.arc(0, -22, 10, 0, Math.PI * 2);
    ctx.ellipse(0, 0, 14, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(180, 150, 100, ${flicker})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(20 + Math.sin(this.tellCycle * 3) * 6, -18);
    ctx.stroke();
    ctx.restore();
  }

  drawInteractiveStraw(ctx, x, y) {
    ctx.save();
    const isLateGame = this.currentOpponentIndex >= 2;
    ctx.strokeStyle = isLateGame ? "rgba(168, 56, 43, 0.95)" : "rgba(229, 185, 92, 0.85)";
    ctx.lineWidth = 4.0;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - 45, y + 28);
    ctx.quadraticCurveTo(x - 12, y + 6, x, y);
    ctx.stroke();
    ctx.restore();
  }

      // 工笔重彩神虫【小梅花】（高质插画 + 动作金芒水墨气阵）
  drawPlayerCricket(ctx, x, y, isFlinching = false, isAttacking = false) {
    ctx.save();
    ctx.translate(x, y);

    const tellPhase = Math.sin(this.tellCycle);
    const isTellMoment = Math.abs(tellPhase) > 0.8;
    const headTilt = isTellMoment ? 0.12 : (this.isTeased ? -0.1 : 0);

    if (this.opponent?.isPalaceDance || this.isVictoryPosture) {
      ctx.rotate(Math.sin(this.tellCycle * 5) * 0.22);
    }

    if (isAttacking && this.opponent?.isSpecialRooster) {
      ctx.rotate(0.45);
    }

    // 斗志金芒气场
    if (this.momentum >= 50) {
      ctx.fillStyle = "rgba(229, 185, 92, 0.3)";
      ctx.beginPath();
      ctx.arc(0, 0, 48, 0, Math.PI * 2);
      ctx.fill();
    }

    // 扑咬金光水墨拖尾
    if (isAttacking) {
      ctx.strokeStyle = "rgba(229, 185, 92, 0.75)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-20, 0, 36, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
    }

    ctx.save();
    ctx.rotate(headTilt);

    // 阴影
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(0, 28, 36, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 绘制高画质工笔神虫插画
    if (this.playerImg.complete && this.playerImg.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, -5, 42, 0, Math.PI * 2);
      ctx.clip();

      if (isFlinching) {
        ctx.filter = "brightness(1.5) sepia(1) hue-rotate(-50deg)";
      }
      ctx.drawImage(this.playerImg, -46, -51, 92, 92);
      ctx.restore();

      // 边框金丝与青色项圈
      ctx.strokeStyle = isFlinching ? "#ff3333" : (this.momentum >= 50 ? "#e5b95c" : "#3d604b");
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -5, 42, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // 保底绘制
      ctx.fillStyle = isFlinching ? "#ff4d4d" : "#2c4028";
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 赤金长须（高频颤动）
    const antWave = this.isTeased ? Math.sin(this.tellCycle * 14) * 8 : Math.sin(this.tellCycle * 4) * 3;
    ctx.strokeStyle = isFlinching ? "#ffffff" : "#f0c850";
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(22, -8);
    ctx.quadraticCurveTo(42, -28 + antWave, 64, -20 + antWave);
    ctx.moveTo(22, 0);
    ctx.quadraticCurveTo(42, 24 - antWave, 64, 16 - antWave);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

      // 工笔重彩敌方角色（蟹壳青 / 县衙巨甲 / 抚军巨雄鸡 / 御前金案）
  drawOpponent(ctx, x, y, isFlinching = false) {
    ctx.save();
    ctx.translate(x, y);

    if (this.enemyState === "dead") {
      ctx.rotate(Math.PI);
      ctx.translate(0, -15);
    }

    if (this.opponent?.isPalaceDance) {
      // ==========================================
      // 👑 御前金案 · 金銮殿龙纹紫檀宝案、宣德香炉与白玉金樽
      // ==========================================
      
      // 1. 金銮御座背景
      if (this.palaceBgImg.complete && this.palaceBgImg.naturalWidth > 0) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.drawImage(this.palaceBgImg, -140, -130, 280, 180);
        ctx.restore();
      }

      // 2. 紫檀雕花几案主体
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.ellipse(0, 32, 100, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // 案几实木与金丝漆面
      ctx.fillStyle = "#3b1c14";
      ctx.fillRect(-85, -45, 170, 60);
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 3.0;
      ctx.strokeRect(-85, -45, 170, 60);

      // 3. 明黄织锦云龙桌裙
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(-75, -15, 150, 34);
      ctx.strokeStyle = "#8a2419";
      ctx.lineWidth = 2.0;
      ctx.strokeRect(-75, -15, 150, 34);

      // 桌裙绣字
      ctx.fillStyle = "#8a2419";
      ctx.font = "bold 12px STSong, serif";
      ctx.textAlign = "center";
      ctx.fillText("✦ 皇 家 御 案 · 龙 颜 弄 乐 ✦", 0, 8);

      // 4. 案顶陈列：宣德青铜龙首香炉与仙气白烟
      ctx.fillStyle = "#2d4432";
      ctx.beginPath();
      ctx.ellipse(-52, -54, 15, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 2.0;
      ctx.stroke();

      const smokeOffset = Math.sin(this.tellCycle * 3) * 8;
      ctx.strokeStyle = "rgba(240, 235, 220, 0.55)";
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(-52, -62);
      ctx.quadraticCurveTo(-52 + smokeOffset, -85, -46 - smokeOffset, -115);
      ctx.stroke();

      // 5. 案顶陈列：白玉金樽
      ctx.fillStyle = "#fcf8f0";
      ctx.beginPath();
      ctx.ellipse(52, -52, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // 6. 金色击节音律光环
      const wave = Math.sin(this.tellCycle * 4) * 10;
      ctx.strokeStyle = "rgba(229, 185, 92, 0.75)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, -45, 75 + wave, 15 + wave * 0.2, 0, 0, Math.PI * 2);
      ctx.stroke();

    } else if (this.opponent?.isSpecialRooster) {
      // ==========================================
      // 🐓 抚军巨雄鸡
      // ==========================================
      if (this.enemyState === "windup") {
        ctx.fillStyle = "rgba(184, 59, 38, 0.6)";
        ctx.beginPath();
        ctx.arc(0, -45, 80, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this.enemyState === "stuck_beak") {
        ctx.rotate(-0.35);
        ctx.translate(0, 18);
      }

      if (this.roosterImg.complete && this.roosterImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, -45, 58, 0, Math.PI * 2);
        ctx.clip();
        if (isFlinching) ctx.filter = "brightness(1.6) sepia(1) hue-rotate(-50deg)";
        ctx.drawImage(this.roosterImg, -62, -110, 124, 124);
        ctx.restore();

        ctx.strokeStyle = this.enemyState === "windup" ? "#ff3300" : (this.enemyState === "stuck_beak" ? "#e5b95c" : (isFlinching ? "#ffffff" : "#c49c48"));
        ctx.lineWidth = this.enemyState === "windup" ? 4.5 : 2.8;
        ctx.beginPath();
        ctx.arc(0, -45, 58, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (this.enemyState === "stuck_beak") {
        ctx.fillStyle = "rgba(196, 156, 72, 0.7)";
        ctx.beginPath();
        ctx.arc(-25, 12, 14, 0, Math.PI * 2);
        ctx.arc(-10, 16, 10, 0, Math.PI * 2);
        ctx.fill();
      }

    } else {
      // ==========================================
      // 🦗 对手斗虫（蟹壳青 / 县衙巨甲）高质工笔画渲染
      // ==========================================
      const isCrab = this.currentOpponentIndex === 0;
      const targetImg = isCrab ? this.crabImg : this.steelImg;
      const radius = isCrab ? 45 : 52;

      // 敌虫投影
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(0, 28, radius * 0.85, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      if (targetImg.complete && targetImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, -5, radius, 0, Math.PI * 2);
        ctx.clip();

        if (isFlinching) {
          ctx.filter = "brightness(1.5) sepia(1) hue-rotate(-50deg)";
        }
        ctx.drawImage(targetImg, -radius - 4, -radius - 9, (radius + 4) * 2, (radius + 4) * 2);
        ctx.restore();

        // 强敌边框与煞气光圈
        ctx.strokeStyle = isFlinching ? "#ffffff" : (isCrab ? "#3d604b" : "#8f2619");
        ctx.lineWidth = isCrab ? 2.5 : 3.5;
        ctx.beginPath();
        ctx.arc(0, -5, radius, 0, Math.PI * 2);
        ctx.stroke();

        // 县衙巨甲附带黑煞烟气
        if (!isCrab) {
          ctx.fillStyle = "rgba(143, 38, 25, 0.25)";
          ctx.beginPath();
          ctx.arc(0, -5, radius + 8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // 保底绘制
        ctx.fillStyle = isFlinching ? "#ff4d4d" : (isCrab ? "#2e4a3c" : "#1c1815");
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  stop() {
    this.isRunning = false;
    if (this.enemyActionTimer) clearTimeout(this.enemyActionTimer);
    if (this.danmuTimer) clearInterval(this.danmuTimer);
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }
}
