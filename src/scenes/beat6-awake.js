// 拍⑥：苏（照见置换 · 长按/点击钤印定案 · 藏书票导出）
import { sound } from "../engine/audio.js";
import { state } from "../engine/state.js";
import { storage } from "../engine/storage.js";
import { scriptData } from "../data/script.js";

export function runBeat6(controller) {
  controller.updateSceneBg("scene-palace");
  controller.setActors({ chengming: true, wife: true, son: true });
  controller.setFortune(100, "一人飞升", "仙及鸡犬 · 恩荫百代");

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
    controller.setActors({ chengming: false, wife: false, son: false, officer: false, pot: false, well: false });

    const overlay = document.getElementById("awakening-layer") || document.getElementById("awakening-overlay");
    const recordsContainer = document.getElementById("ledger-records");
    const summaryContainer = document.getElementById("ledger-summary");
    const pressArea = document.getElementById("seal-press-area");
    const actionsContainer = document.getElementById("awakening-actions") || document.querySelector(".summary-actions");

    if (!overlay) return;
    overlay.hidden = false;

    // 清理旧钤印
    document.querySelectorAll(".seal-affix-section, .vermilion-stamp-mark").forEach(el => el.remove());

    if (summaryContainer) {
      summaryContainer.innerHTML = `
        <div class="summary-quote">
          “一人飞升，仙及鸡犬……独是成氏子以蠹化，羽化而登仙，何其怪也！”
        </div>
      `;
    }
    if (actionsContainer) actionsContainer.hidden = true;
    if (pressArea) pressArea.hidden = false;

    // 默认 4 条官方战绩
    const canonicalRecords = [
      { oppName: "蟹壳青", reward: "一吊铜钱", rewardText: "解燃眉之急 · 换得数日口粮" },
      { oppName: "县衙巨甲", reward: "免除徭役 · 补邑庠生", rewardText: "县令大喜 · 赠金放归免催逼" },
      { oppName: "抚军巨雄鸡", reward: "赐金百两 · 骏马雕鞍", rewardText: "巡抚惊骇 · 驰表进贡入深宫" },
      { oppName: "御前金案", reward: "富埒世家 · 恩荫子孙", rewardText: "天子龙颜大悦 · 诏封显爵" }
    ];

    const records = (state.battleLog && state.battleLog.length >= 4) ? state.battleLog : canonicalRecords;
    const playerAssigned = state.smallCricketName || "小梅花";

    if (recordsContainer) {
      recordsContainer.innerHTML = "";
      records.forEach((rec, i) => {
        const row = document.createElement("div");
        row.className = "ledger-row";
        row.innerHTML = `
          <div class="ledger-row-title">第 ${i + 1} 场 · 胜【${rec.oppName}】</div>
          <div class="ledger-row-desc">获 ${rec.reward}</div>
          <div class="ledger-subject" id="subj-${i}">出战者：【${playerAssigned}】</div>
        `;
        recordsContainer.appendChild(row);
      });
    }

    sound.playBurstChirps(2);

        // 延迟 500ms 触发水波涟漪置换血书
    setTimeout(() => {
      [0, 1, 2, 3].forEach((i) => {
        setTimeout(() => {
          const subjEl = document.getElementById(`subj-${i}`);
          if (subjEl) {
            subjEl.classList.add("replaced");
            subjEl.innerHTML = `<span style="color:#a8382b;font-weight:bold;">出战者：【成名之子（九岁）】</span>`;
            sound.playWaterDrop();
          }
        }, (i + 1) * 550);
      });

      setTimeout(() => {
        storage.incrementPlaythrough();

        // 启用长按/点击印泥定案
        setupSealInteraction(() => {
          if (pressArea) pressArea.hidden = true;
          if (actionsContainer) actionsContainer.hidden = false;

          const btnExport = document.getElementById("btn-export-card") || document.getElementById("btn-save-card");
          const btnReplay = document.getElementById("btn-replay") || document.getElementById("btn-restart-game");

          if (btnExport) {
            btnExport.onclick = (e) => { e.stopPropagation(); controller.generateMomentCard(); };
          }
          if (btnReplay) {
            btnReplay.onclick = (e) => {
              e.stopPropagation();
              overlay.hidden = true;
              controller.restartGame();
            };
          }
        });
      }, 4 * 550 + 600);
    }, 500);
  }

  function setupSealInteraction(onStamped) {
    const target = document.getElementById("seal-stamp-target");
    const ring = document.getElementById("seal-progress-ring");

    if (!target) {
      if (onStamped) onStamped();
      return;
    }

    let holdTimer = null;
    let holdProgress = 0;
    let isComplete = false;
    let touchStartTime = 0;

    const doStamp = () => {
      if (isComplete) return;
      isComplete = true;
      if (holdTimer) clearInterval(holdTimer);
      sound.playInkBleed();
      sound.vibrate([60, 80, 140]);

      target.innerHTML = `
        <div class="vermilion-stamp-mark" style="color:#a8382b;font-weight:bold;font-size:16px;border:3px solid #a8382b;padding:8px 18px;border-radius:4px;background:rgba(168,56,43,0.08);letter-spacing:2px;display:inline-block;">
          【 天子一跬步 · 皆关民命 】
        </div>
      `;

      setTimeout(() => {
        if (onStamped) onStamped();
      }, 600);
    };

    const startHold = () => {
      if (isComplete) return;
      holdProgress = 0;
      sound.vibrate(20);

      holdTimer = setInterval(() => {
        holdProgress += 20;
        if (ring) {
          ring.style.background = `conic-gradient(#a8382b ${holdProgress * 3.6}deg, transparent 0deg)`;
        }
        if (holdProgress % 40 === 0) sound.vibrate(15);

        if (holdProgress >= 100) {
          doStamp();
        }
      }, 80);
    };

    const cancelHold = () => {
      if (isComplete) return;
      if (holdTimer) clearInterval(holdTimer);
      holdProgress = 0;
      if (ring) ring.style.background = "none";
    };

    target.onmousedown = startHold;
    window.addEventListener("mouseup", cancelHold);

    target.addEventListener("touchstart", () => {
      touchStartTime = Date.now();
      startHold();
    }, { passive: true });

    target.addEventListener("touchend", () => {
      const dur = Date.now() - touchStartTime;
      cancelHold();
      if (dur < 350 && !isComplete) {
        doStamp();
      }
    });

    target.onclick = (e) => {
      e.stopPropagation();
      if (!isComplete) doStamp();
    };
  }

  showNext();
}
