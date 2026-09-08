// 拍①：逼
import { sound } from "../engine/audio.js";
import { scriptData } from "../data/script.js";

export function runBeat1(controller) {
  controller.updateSceneBg("scene-ruins");
  controller.setActors({ chengming: true, officer: true, wife: false, son: false });
  controller.setFortune(0, "大祸临头", "摊派催逼 · 杖责五十");
  
  const scripts = scriptData.beat1;
  let idx = 0;

  function showNext() {
    if (idx >= scripts.length) {
      controller.nextBeat();
      return;
    }
    const item = scripts[idx];
    controller.showDialog({
      kicker: item.kicker,
      speaker: item.speaker,
      text: item.text,
      btnText: item.action,
      onNext: () => {
        if (item.event === "cane_hit") {
          sound.playHeavyCaneHit();
          controller.flashScreen();
          controller.shakeScreen(400);
          controller.spawnInkSplatter();
        }
        idx++;
        showNext();
      }
    });
  }

  showNext();
}
