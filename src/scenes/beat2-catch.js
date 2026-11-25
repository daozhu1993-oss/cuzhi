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

  function chooseApproach() {
    const choice = document.createElement('dialog');
    choice.id = 'temple-choice';
    choice.setAttribute('aria-labelledby', 'temple-choice-title');
    choice.style.cssText = 'width:min(88vw,420px);padding:24px;border:1px solid #a58346;background:#241f19;color:#f6e6ba;font:16px/1.65 serif';
    choice.innerHTML = '<h2 id="temple-choice-title">草忽然不动了。</h2><p>蹲下等一阵，可以看清哪侧草尖先抖。现在就拨草，能早一步下手，但要自己找准方位。</p><form method="dialog"><button value="watch">屏息看草尖</button> <button value="search">立即拨草</button></form>';
    for (const button of choice.querySelectorAll('button')) button.style.cssText = 'min-height:44px;padding:6px 12px;font:inherit;cursor:pointer';
    document.body.appendChild(choice);
    choice.addEventListener('close', () => {
      const watch = choice.returnValue === 'watch';
      choice.remove();
      startCatch(watch);
    }, {once:true});
    choice.showModal();
  }

  function startCatch(watch) {
    removeRecovery();
    const catchLayer = document.getElementById("catch-layer");
    try {
      const hunt = new CatchGame(catchLayer, proceedToInspection);
      hunt.start();
      if (watch && hunt.hintEl) {
        hunt.hintEl.textContent = '成名伏下来。风过了一阵……';
        const initialAction = hunt.field.onclick;
        hunt.field.inert = true;
        setTimeout(() => {
          if (hunt.field.onclick !== initialAction) return;
          hunt.field.inert = false;
          hunt.hintEl.textContent = (hunt.targetX < hunt.width / 2 ? '左边' : '右边') + '的草尖先动了。轻按那片草。';
        }, 1500);
      }
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
      chooseApproach();
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
