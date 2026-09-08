// 拍⑤：斗/献/舞（四场阶梯战役单实例精密流转）
import { sound } from "../engine/audio.js";
import { state } from "../engine/state.js";
import { opponentsData } from "../data/opponents.js";
import { BattleGame } from "../mini-games/battle-game.js";

export function runBeat5(controller) {
  controller.updateSceneBg("scene-court");
  controller.setActors({ chengming: false, wife: false, son: false, officer: false, pot: false, well: false });
  controller.hideDialog();

  // 清空本局战绩
  state.battleLog = [];

  const battleLayer = document.getElementById("battle-layer");
  battleLayer.hidden = false;

  let currentMatch = 0;
  let battleGame = new BattleGame({
    particleEngine: controller.particleEngine,
    onVictory: (opp, idx) => {
      // 记录战绩
      state.addBattleRecord({
        title: opp.title,
        oppName: opp.name,
        reward: opp.reward,
        rewardText: opp.rewardText
      });

      const newFortune = Math.min(100, 30 + (currentMatch + 1) * 20);
      controller.setFortune(newFortune, "如日中天", opp.rewardText);

      currentMatch++;

      if (currentMatch < opponentsData.length) {
        if (currentMatch === 2) {
          // 第2场（县衙巨甲）打赢后，必须进行案头研药调理备战大公鸡
          setTimeout(() => {
            showConditioningBeforeBoss(() => {
              battleGame.startMatch(currentMatch);
            });
          }, 600);
        } else {
          setTimeout(() => {
            battleGame.startMatch(currentMatch);
          }, 400);
        }
      } else {
        // 全部4场完成，进入拍⑥
        setTimeout(() => {
          battleGame.stop();
          battleLayer.hidden = true;
          controller.nextBeat();
        }, 600);
      }
    },
    onDefeat: (opp, idx) => {
      controller.setFortune(Math.max(10, state.fortune - 10), "战绩受挫", "虫伤了，败绩若传开全家难保");
    }
  });

  function showConditioningBeforeBoss(onReady) {
    let modal = document.getElementById("rescue-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "rescue-modal";
      modal.className = "rescue-modal";
      document.body.appendChild(modal);
    }
    modal.hidden = false;

    let step = 0;
    const maxStep = 3;

    modal.innerHTML = `
      <div class="rescue-box">
        <h4 style="color:#c49c48;">【 案头研药 · 调理神虫 】</h4>
        <p id="rescue-desc">连胜两阵，小虫甲壳微损。明日将入抚军府与巨雄鸡生死一决……成名取清露草药，细细研磨敷治！</p>
        <div class="rescue-progress"><div class="rescue-fill" id="rescue-fill" style="background:#c49c48;"></div></div>
        <button class="rescue-action-btn" id="btn-do-rescue" type="button" style="background:#c49c48;">研磨药草（点按 0/3）</button>
      </div>
    `;

    const btn = document.getElementById("btn-do-rescue");
    const fill = document.getElementById("rescue-fill");
    const desc = document.getElementById("rescue-desc");

    btn.onclick = (e) => {
      e.stopPropagation();
      step++;
      sound.playWaterDrop();
      sound.vibrate(25);

      if (fill) fill.style.width = ((step / maxStep) * 100) + "%";
      if (btn) btn.innerText = `研磨敷治（点按 ${step}/${maxStep}）`;

      if (step >= maxStep) {
        sound.playBurstChirps(3);
        sound.vibrate([40, 50, 100]);
        if (desc) desc.innerHTML = `<span style="color:#c49c48;font-weight:bold;">金翅华彩大盛，神虫精力充盈！</span><br><small style="color:#555;">成名拜祷：“明日斗大公鸡，全仗神物神威！”</small>`;
        btn.innerText = "【 入抚军府迎战巨鸡 】";
        btn.style.background = "#a8382b";
        btn.onclick = (ev) => {
          ev.stopPropagation();
          modal.remove();
          if (onReady) onReady();
        };
      }
    };
  }

  // 开始第1场对决
  battleGame.startMatch(0);
}
