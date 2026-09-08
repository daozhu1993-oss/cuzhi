// 拍②：捕
import { sound } from "../engine/audio.js";
import { scriptData } from "../data/script.js";
import { CatchGame } from "../mini-games/catch-game.js";

export function runBeat2(controller) {
  controller.updateSceneBg("scene-temple");
  controller.setActors({ chengming: true, wife: true, officer: false, son: false });
  controller.setFortune(15, "绝处求生", "得驼背巫画卷 · 寻虫古寺");

  const scripts = Array.isArray(scriptData.beat2) ? scriptData.beat2 : [];
  let idx = 0;
  let recoveryTimer = null;

  function removeRecovery() {
    if (recoveryTimer) clearTimeout(recoveryTimer);
    recoveryTimer = null;
    document.getElementById("beat2-recovery-btn")?.remove();
  }

  function showRecovery() {
    if (document.getElementById("beat2-recovery-btn")) return;
    const button = document.createElement("button");
    button.id = "beat2-recovery-btn";
    button.className = "beat2-recovery-btn";
    button.type = "button";
    button.innerText = "继续故事";
    button.onclick = () => {
      removeRecovery();
      proceedToInspection();
    };
    document.body.appendChild(button);
  }

  function proceedToInspection() {
    removeRecovery();
    const catchLayer = document.getElementById("catch-layer");
    if (catchLayer) {
      catchLayer.hidden = true;
      catchLayer.style.display = "none";
    }
    try {
      controller.showCricketInspectionModal(() => controller.nextBeat());
    } catch (error) {
      console.warn("Cricket inspection unavailable:", error);
      controller.nextBeat();
    }
  }

  function startCatch() {
    removeRecovery();
    const catchLayer = document.getElementById("catch-layer");
    try {
      new CatchGame(catchLayer, proceedToInspection).start();
      const catchField = document.getElementById("catch-field");
      if (!catchLayer || catchLayer.hidden || typeof catchField?.onclick !== "function") {
        throw new Error("Catch input unavailable");
      }
    } catch (error) {
      console.warn("Catch game unavailable:", error);
      if (catchLayer) {
        catchLayer.hidden = true;
        catchLayer.style.display = "none";
      }
      controller.showDialog({
        kicker: "【 神虫现形 】",
        speaker: "成名",
        text: "草际金光一闪，已将异虫扣入瓦盆。",
        btnText: "奉入陶盆",
        onNext: proceedToInspection
      });
    }
  }

  function showNext() {
    removeRecovery();
    if (idx >= scripts.length) {
      controller.hideDialog();
      startCatch();
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

  try {
    showNext();
  } catch (error) {
    console.warn("Beat 2 dialog unavailable:", error);
    showRecovery();
    return;
  }

  recoveryTimer = setTimeout(() => {
    const panel = document.getElementById("narrative-panel");
    if (idx === 0 && (!panel || panel.hidden || panel.style.display === "none")) showRecovery();
  }, 350);
}
