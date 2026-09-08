// 拍③：养（物理掀盖透光＋亲手起名＋喂养互动＋二周目朱批）
import { sound } from "../engine/audio.js";
import { state } from "../engine/state.js";
import { scriptData } from "../data/script.js";
import { storage } from "../engine/storage.js";

export function runBeat3(controller) {
  controller.updateSceneBg("scene-cottage");
  controller.setActors({ chengming: true, son: true, wife: true, officer: false, pot: true });
  controller.setFortune(30, "翻身有望", "得神虫青项金翅 · 悉心照护");

  if (storage.isSecondPlaythroughOrMore()) {
    controller.showMarginNote("朱批：得此神物，祸福倚伏……");
  }

  // 物理掀盖交互
  const pot = document.getElementById("prop-pot");
  let potOpening = false;
  if (pot) {
    pot.classList.add("can-open");
    pot.classList.remove("is-opened");
    if (!pot.querySelector(".pot-lid")) {
      pot.innerHTML = `
        <div class="pot-lid"></div>
        <div class="pot-light-beam"></div>
        <div class="pot-sprite"></div>
      `;
    }

    controller.showDialog({
      kicker: "【 案头密护 】",
      speaker: "成名",
      text: "置于陶盆之中，轻掩泥盖……（点按掀开瓦盖察视）",
      btnText: "掀开瓦盖",
      onNext: () => {
        openPotAndProceed();
      }
    });

    pot.onclick = (e) => {
      e.stopPropagation();
      openPotAndProceed();
    };
  } else {
    proceedWithScripts();
  }

  function openPotAndProceed() {
    if (potOpening) return;
    potOpening = true;
    if (pot) {
      pot.onclick = null;
      pot.classList.add("is-opened");
      pot.classList.remove("can-open");
    }
    sound.playLidOpen();
    sound.playBurstChirps(3);
    setTimeout(() => {
      proceedWithScripts();
    }, 600);
  }

  function proceedWithScripts() {
    const scripts = scriptData.beat3;
    let idx = 0;

    function showNext() {
      if (idx >= scripts.length) {
        controller.nextBeat();
        return;
      }
      const item = scripts[idx];

      if (item.event === "name_god_cricket") {
        controller.showDialogWithInput({
          kicker: item.kicker,
          speaker: item.speaker,
          text: item.text,
          defaultName: state.cricketName || "青项金翅",
          inputHint: "为这只神虫赐名：",
          btnText: "定下名号",
          onConfirm: (name) => {
            state.cricketName = name || "青项金翅";
            sound.playBurstChirps(2);
            idx++;
            showNext();
          }
        });
        return;
      }

      if (idx === 1) {
        controller.showFeedInteraction({
          kicker: item.kicker,
          speaker: item.speaker,
          text: item.text,
          maxFeed: 3,
          onFeedComplete: () => {
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
          if (item.tell) {
            sound.playChirp(0.2, 0.25);
          }
          idx++;
          showNext();
        }
      });
    }

    showNext();
  }
}
