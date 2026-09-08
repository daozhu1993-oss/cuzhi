// 尘土粒子与墨点视觉特效
export class ParticleEngine {
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
