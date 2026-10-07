// 水墨气韵 · 天候与氛围粒子引擎 v5 (Atmosphere & Particle Engine)
export class ParticleEngine {
  constructor(container) {
    this.container = container;
    this.canvas = document.getElementById("dust-canvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.particles = [];
    this.weatherType = "beat1"; // beat1, beat2, beat3, beat4, beat5, beat6
    this.isRunning = false;
    this.width = window.innerWidth || 800;
    this.height = window.innerHeight || 600;
    this.animId = null;
    this.lastTime = 0;

    this.initCanvas();
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("resize", () => this.resize());
    }
    if (typeof document !== "undefined" && typeof document.addEventListener === "function") {
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.stop();
        } else {
          this.start();
        }
      });
    }
  }

  initCanvas() {
    if (!this.canvas) {
      this.canvas = document.getElementById("dust-canvas");
      if (this.canvas) this.ctx = this.canvas.getContext("2d");
    }
    this.resize();
  }

  resize() {
    if (!this.canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth || 800;
    this.height = window.innerHeight || 600;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    if (this.ctx) {
      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.initParticles();
    this.loop(performance.now());
  }

  stop() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  setMood(mood) {
    this.weatherType = mood;
    this.initParticles();
  }

  initParticles() {
    this.particles = [];
    const count = this.weatherType === "beat4" ? 45 : (this.weatherType === "beat2" ? 28 : 22);

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    const p = {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: 0,
      vy: 0,
      size: 1,
      alpha: Math.random() * 0.4 + 0.1,
      baseAlpha: 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.04 + 0.02,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.03,
      color: "#e6dfce"
    };

    if (this.weatherType === "beat1") {
      // 萧瑟秋风浮尘与枯叶墨点
      p.vx = Math.random() * 0.6 + 0.2;
      p.vy = Math.random() * 0.4 + 0.1;
      p.size = Math.random() * 3 + 1.2;
      p.color = Math.random() > 0.4 ? "rgba(180, 160, 130, " : "rgba(80, 70, 60, ";
    } else if (this.weatherType === "beat2") {
      // 古庙微光流萤
      p.vx = (Math.random() - 0.5) * 0.4;
      p.vy = (Math.random() - 0.5) * 0.3;
      p.size = Math.random() * 2.5 + 1.5;
      p.color = "rgba(235, 205, 110, ";
      p.baseAlpha = Math.random() * 0.6 + 0.3;
    } else if (this.weatherType === "beat3") {
      // 案头融融烛光微粒
      p.vx = (Math.random() - 0.5) * 0.25;
      p.vy = -(Math.random() * 0.5 + 0.2); // 向上升腾
      p.size = Math.random() * 2.8 + 1.0;
      p.color = "rgba(245, 195, 95, ";
    } else if (this.weatherType === "beat4") {
      // 凄风冷雨丝
      p.vx = -1.5 - Math.random() * 1.0;
      p.vy = 6.0 + Math.random() * 4.0;
      p.size = Math.random() * 12 + 8; // 雨丝长度
      p.color = "rgba(180, 190, 200, ";
      p.baseAlpha = 0.25;
    } else if (this.weatherType === "beat5") {
      // 斗场焦点光尘
      p.vx = (Math.random() - 0.5) * 0.5;
      p.vy = (Math.random() - 0.5) * 0.5;
      p.size = Math.random() * 2.5 + 1;
      p.color = "rgba(220, 180, 100, ";
    } else if (this.weatherType === "beat6") {
      // 宫廷金殿紫气香烟
      p.vx = Math.random() * 0.3 + 0.1;
      p.vy = -(Math.random() * 0.3 + 0.1);
      p.size = Math.random() * 4 + 2;
      p.color = "rgba(240, 215, 140, ";
    }

    return p;
  }

  loop(timestamp) {
    if (!this.isRunning) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update();
    this.render();

    this.animId = requestAnimationFrame((t) => this.loop(t));
  }

  update() {
    const w = this.width;
    const h = this.height;

    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += p.pulseSpeed;
      p.rotation += p.vRot;

      if (this.weatherType === "beat4") {
        // 雨丝边界循环
        if (p.y > h) {
          p.y = -20;
          p.x = Math.random() * (w + 100);
        }
        if (p.x < -20) p.x = w + 20;
      } else {
        // 浮尘流萤漂移
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
      }
    });
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.particles.forEach((p) => {
      ctx.save();
      if (this.weatherType === "beat4") {
        // 绘制冷雨丝
        ctx.strokeStyle = p.color + p.baseAlpha + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 1.5, p.y + p.size);
        ctx.stroke();
      } else if (this.weatherType === "beat2") {
        // 绘制呼吸流萤光晕
        const currentAlpha = Math.max(0.05, p.baseAlpha + Math.sin(p.pulse) * 0.35);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        grad.addColorStop(0, p.color + currentAlpha + ")");
        grad.addColorStop(0.5, p.color + (currentAlpha * 0.4) + ")");
        grad.addColorStop(1, p.color + "0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // 绘制水墨微粒与金屑
        const alpha = Math.max(0.08, p.baseAlpha + Math.sin(p.pulse) * 0.15);
        ctx.fillStyle = p.color + alpha + ")";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  spawnHitSparks(x, y, text = "破！") {
    const parent = document.getElementById("battle-fx") || document.body;
    if (!parent) return;
    const spark = document.createElement("div");
    spark.className = "hit-spark";
    spark.innerText = text;
    spark.style.position = "absolute";
    spark.style.left = x + "px";
    spark.style.top = y + "px";
    spark.style.zIndex = "100";
    spark.style.pointerEvents = "none";
    spark.style.fontFamily = "var(--font-kai)";
    spark.style.fontWeight = "bold";
    spark.style.color = "#e5b95c";
    spark.style.textShadow = "0 0 10px rgba(229,185,92,0.8)";
    spark.style.animation = "sparkFade 0.7s forwards ease-out";
    parent.appendChild(spark);
    setTimeout(() => spark.remove(), 700);
  }

  spawnMusicNote(x, y, glyph = "♪") {
    const parent = document.getElementById("dance-notes") || document.body;
    if (!parent) return;
    parent.hidden = false;
    const note = document.createElement("div");
    note.className = "music-glyph";
    note.innerText = glyph;
    note.style.position = "absolute";
    note.style.left = x + "px";
    note.style.top = y + "px";
    note.style.zIndex = "100";
    note.style.pointerEvents = "none";
    note.style.color = "#f4d995";
    note.style.animation = "noteFloat 1.8s forwards ease-out";
    parent.appendChild(note);
    setTimeout(() => note.remove(), 1800);
  }
}
