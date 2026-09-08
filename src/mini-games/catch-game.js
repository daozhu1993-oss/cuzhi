// 拍②：古刹夜草寻声捕虫小玩法（古风水墨草卷 · 流萤引路 · 必定成功机制）
import { sound } from "../engine/audio.js";
import { storage } from "../engine/storage.js";

export class CatchGame {
  constructor(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete;
    this.field = document.getElementById("catch-field");
    this.hintEl = document.querySelector(".catch-hint");
    this.canvas = null;
    this.ctx = null;
    this.targetX = 0;
    this.targetY = 0;
    this.attempts = 0;
    this.chirpTimer = null;
    this.animFrame = null;
    this.width = 560;
    this.height = 300;
    this.tufts = [];
    this.fireflies = [];
    this.revealed = false;
    this.isCaptured = false;
  }

  start() {
    if (!this.container || !this.field) return;
    this.container.hidden = false; this.container.style.display = "flex";
    this.field.innerHTML = "";
    this.attempts = 0;
    this.revealed = false;
    this.isCaptured = false;

    // 创建 Canvas 用于高品质夜草与水墨流萤渲染
    this.canvas = document.createElement("canvas");
    this.canvas.className = "catch-canvas";
    this.canvas.style.position = "absolute";
    this.canvas.style.inset = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.field.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    const rect = this.field.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 560;
    this.height = rect.height || 300;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    if (this.ctx) {
      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
    }

    // 初始化草丛簇群
    this.tufts = [
      { x: this.width * 0.20, y: this.height * 0.38, r: 38, sway: 0, speed: 0.04 },
      { x: this.width * 0.38, y: this.height * 0.70, r: 44, sway: 0, speed: 0.05 },
      { x: this.width * 0.52, y: this.height * 0.38, r: 40, sway: 0, speed: 0.035 },
      { x: this.width * 0.72, y: this.height * 0.65, r: 46, sway: 0, speed: 0.045 },
      { x: this.width * 0.82, y: this.height * 0.32, r: 36, sway: 0, speed: 0.03 },
      { x: this.width * 0.24, y: this.height * 0.76, r: 42, sway: 0, speed: 0.055 },
      { x: this.width * 0.60, y: this.height * 0.78, r: 44, sway: 0, speed: 0.04 }
    ];

    // 随机选择目标草丛
    const targetTuft = this.tufts[Math.floor(Math.random() * this.tufts.length)];
    this.targetX = targetTuft.x + (Math.random() * 16 - 8);
    this.targetY = targetTuft.y + (Math.random() * 16 - 8);

    // 初始化流萤光斑
    this.fireflies = Array.from({ length: 14 }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      alpha: Math.random() * 0.6 + 0.3,
      phase: Math.random() * Math.PI * 2
    }));

    if (this.hintEl) {
      this.hintEl.innerHTML = "古刹残壁 · 草际有微声（轻按草丛寻踪）";
    }

    this.field.onclick = (e) => handleAction.call(this, e.clientX, e.clientY);
    this.field.addEventListener("touchend", (e) => {
      if (e.changedTouches && e.changedTouches.length > 0) {
        e.preventDefault();
        handleAction.call(this, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    }, { passive: false });

    const initialPan = (this.targetX - this.width / 2) / (this.width / 2);
    try {
      sound.playSpatialChirp(initialPan, 0.7);
      if (storage.isSecondPlaythroughOrMore()) {
        sound.playChildHumming(initialPan, 0.7);
      }
    } catch (error) {
      console.warn("Catch sound unavailable:", error);
    }

    this.chirpTimer = setInterval(() => {
      if (this.isCaptured) return;
      try {
        sound.playSpatialChirp(initialPan, 0.65);
        if (storage.isSecondPlaythroughOrMore()) {
          sound.playChildHumming(initialPan, 0.65);
        }
      } catch (error) {
        clearInterval(this.chirpTimer);
      }
    }, 2200);

    function handleAction(clientX, clientY) {
      if (this.isCaptured) return;
      const fRect = this.field.getBoundingClientRect();
      const clickX = clientX - fRect.left;
      const clickY = clientY - fRect.top;

      const dx = clickX - this.targetX;
      const dy = clickY - this.targetY;
      const dist = Math.hypot(dx, dy);

      this.attempts++;
      const currentPan = (this.targetX - clickX) / (this.width / 2);
      try {
        sound.playSpatialChirp(currentPan, Math.min(1.0, dist / (this.width * 0.6)));
      } catch (error) {
        console.warn("Catch sound unavailable:", error);
      }

      // 点击特效：水墨草叶飞溅
      this.spawnLeafSplash(clickX, clickY);

      // 最多 2 次点击必定现身，杜绝无休止循环
      if (dist < 85 || this.attempts >= 2) {
        if (!this.revealed) {
          this.revealCricket();
        } else {
          this.successCatch();
        }
      } else {
        const dir = dx > 0 ? "左前方" : "右前方";
        if (this.hintEl) {
          this.hintEl.innerHTML = `<span style="color:#e5b95c;">微声在${dir}草际……（再点一次草丛）</span>`;
        }
      }
    }

    this.loop();
  }

  revealCricket() {
    this.revealed = true;
    try {
      sound.playBurstChirps(2);
      sound.vibrate([30, 40]);
    } catch (error) {
      console.warn("Catch sound unavailable:", error);
    }
    if (this.hintEl) {
      this.hintEl.innerHTML = "<strong style='color:#e5b95c;font-size:16px;'>【神虫现形！金光破草！快点按覆扣！】</strong>";
    }

    this.fireflies.forEach(f => {
      f.vx = (this.targetX - f.x) * 0.06;
      f.vy = (this.targetY - f.y) * 0.06;
    });
  }

  spawnLeafSplash(x, y) {
    const splash = document.createElement("div");
    splash.className = "hit-spark";
    splash.innerText = this.revealed ? "【疾扑！】" : "🍃 沙…";
    splash.style.left = x + "px";
    splash.style.top = y + "px";
    splash.style.color = this.revealed ? "#e5b95c" : "#a8d59d";
    this.field.appendChild(splash);
    setTimeout(() => splash.remove(), 600);
  }

  loop() {
    if (!this.ctx || this.isCaptured) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. 夜色古刹残石暗影
    ctx.fillStyle = "rgba(10, 14, 10, 0.96)";
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. 绘制草丛簇群
    this.tufts.forEach(t => {
      t.sway += t.speed;
      const swayOffset = Math.sin(t.sway) * 6;
      ctx.save();
      ctx.translate(t.x, t.y);

      // 水墨草丛投影
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(0, 10, t.r * 0.8, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // 水墨苇叶
      ctx.strokeStyle = "rgba(45, 68, 42, 0.88)";
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";

      for (let j = -3; j <= 3; j++) {
        ctx.beginPath();
        ctx.moveTo(j * 8, 8);
        ctx.quadraticCurveTo(j * 12 + swayOffset, -t.r * 0.5, j * 16 + swayOffset * 1.5, -t.r);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 3. 绘制流萤
    this.fireflies.forEach(f => {
      f.x += f.vx;
      f.y += f.vy;
      f.phase += 0.05;
      const alpha = Math.max(0.1, f.alpha + Math.sin(f.phase) * 0.3);

      if (f.x < 0) f.x = this.width;
      if (f.x > this.width) f.x = 0;
      if (f.y < 0) f.y = this.height;
      if (f.y > this.height) f.y = 0;

      ctx.fillStyle = `rgba(229, 210, 120, ${alpha})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(229, 210, 120, ${alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. 若已显形，绘制神虫金光与立绘光环
    if (this.revealed) {
      const pulse = Math.sin(Date.now() * 0.008) * 6;
      ctx.save();
      ctx.translate(this.targetX, this.targetY);

      // 金色灵光波纹
      ctx.strokeStyle = "rgba(229, 185, 92, 0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 32 + pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "rgba(229, 185, 92, 0.25)";
      ctx.fill();

      // 小促织剪影与金色须翅
      ctx.fillStyle = "#1e281c";
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#c49c48";
      ctx.beginPath();
      ctx.ellipse(4, -3, 12, 5, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // 金色长须
      ctx.strokeStyle = "#e5b95c";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(8, -2);
      ctx.quadraticCurveTo(20, -14, 30, -10);
      ctx.moveTo(8, 2);
      ctx.quadraticCurveTo(20, 12, 30, 8);
      ctx.stroke();

      ctx.restore();
    }

    this.animFrame = requestAnimationFrame(() => this.loop());
  }

  successCatch() {
    this.isCaptured = true;
    clearInterval(this.chirpTimer);
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.field.onclick = null;

    try {
      sound.playBurstChirps(4);
      sound.vibrate([40, 50, 120]);
    } catch (error) {
      console.warn("Catch sound unavailable:", error);
    }

    if (this.hintEl) {
      this.hintEl.innerHTML = "<span style='color:#e5b95c;font-size:18px;font-weight:bold;'>【青项金翅 · 扣入瓦盆！】</span>";
    }

    const targetNode = document.createElement("div");
    targetNode.className = "catch-target-node";
    targetNode.style.left = (this.targetX - 25) + "px";
    targetNode.style.top = (this.targetY - 25) + "px";
    targetNode.style.transform = "scale(1.8)";
    targetNode.style.background = "radial-gradient(circle, #ffe699 0%, #c49c48 70%, transparent 100%)";
    targetNode.style.boxShadow = "0 0 35px #e5b95c";
    this.field.appendChild(targetNode);

    setTimeout(() => {
      this.container.hidden = true; this.container.style.display = "none";
      if (this.onComplete) this.onComplete();
    }, 1000);
  }

  cleanup() {
    this.isCaptured = true;
    if (this.chirpTimer) clearInterval(this.chirpTimer);
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.container) this.container.hidden = true; this.container.style.display = "none";
  }
}
