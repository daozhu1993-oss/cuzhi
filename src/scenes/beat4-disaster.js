// 拍④：祸（盆覆儿亡 · 捡拾遗履 · 绝望拾小虫）
import { sound } from "../engine/audio.js";
import { state } from "../engine/state.js";
import { scriptData } from "../data/script.js";
import { storage } from "../engine/storage.js";

export function runBeat4(controller) {
  controller.updateSceneBg("scene-cottage");
  controller.setActors({ chengming: true, son: false, wife: true, officer: false, pot: true, well: false });
  controller.setFortune(5, "家破人亡", "神虫毙 · 幼子失踪");

  if (storage.isSecondPlaythroughOrMore()) {
    controller.showMarginNote("朱批：痛极无言，何忍读之……");
  }

  const pot = document.getElementById("prop-pot");
  if (pot) {
    pot.classList.add("is-dead");
  }

  const scripts = scriptData.beat4;
  let idx = 0;

  function showNext() {
    if (idx >= scripts.length) {
      controller.nextBeat();
      return;
    }
    const item = scripts[idx];

    // 井沿场景拾起湿草鞋
    if (item.event === "well_scene") {
      controller.updateSceneBg("scene-well");
      controller.setActors({ chengming: true, wife: true, son: false, officer: false, pot: false, well: true });

      const shoe = document.querySelector(".wet-shoe");
      if (shoe) {
        shoe.classList.add("interactive");
        const onPick = (e) => {
          if (e) e.stopPropagation();
          shoe.onclick = null;
          shoe.ontouchend = null;
          shoe.classList.remove("interactive");
          sound.playWaterDrop();
          controller.flashScreen();
          idx++;
          showNext();
        };
        shoe.onclick = onPick;
        shoe.ontouchend = onPick;
      }

      controller.showDialog({
        kicker: item.kicker,
        speaker: item.speaker,
        text: item.text,
        btnText: "拾起遗履",
        onNext: () => {
          sound.playWaterDrop();
          if (shoe) shoe.classList.remove("interactive");
          idx++;
          showNext();
        }
      });
      return;
    }

    // 黑场时间断点过渡
    if (item.event === "blackout_transition" || item.isBlackout) {
      controller.showDialog({
        kicker: item.kicker,
        speaker: item.speaker,
        text: item.text,
        btnText: item.action || "绝望求生",
        onNext: () => {
          controller.hideDialog();
          controller.flashBlackout(() => {
            idx++;
            showNext();
          });
        }
      });
      return;
    }

    // 绝望中为羸弱小虫起名
    if (item.event === "name_small_cricket") {
      controller.updateSceneBg("scene-cottage");
      controller.setActors({ chengming: true, son: false, wife: true, officer: false, pot: true, well: false });
      if (pot) pot.classList.remove("is-dead");

      controller.showDialogWithInput({
        kicker: item.kicker,
        speaker: item.speaker,
        text: item.text,
        defaultName: state.smallCricketName || "小梅花",
        inputHint: "为这只瘦小促织起名：",
        btnText: "收存入盆",
        onConfirm: (name) => {
          state.smallCricketName = name || "小梅花";
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
        idx++;
        showNext();
      }
    });
  }

  showNext();
}
