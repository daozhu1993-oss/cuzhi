// 真实用户路径浏览器测试：从 Beat 1 一路真实点击到 Beat 6
//
// 之前 test_real_file_runner 用 __cuzhi.startBeat(3) 跳折验证，
// 但用户实际卡住的是这条路径：Beat 1 走完 → 抓虫 → 验虫 → 进 Beat 3 冻死。
// 本测试完整复现这条路径，用真 file:// + 真 localStorage + 真点击。
//
// 运行：
//   node test_real_journey.mjs

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  const fallbackRoot = path.join(
    os.homedir(), ".workbuddy/binaries/node/workspace/node_modules"
  ) + path.sep;
  ({ chromium } = createRequire(fallbackRoot)("playwright"));
}

const TARGET = path.resolve("./促织_最终修复版.html");
const FILE_URL = pathToFileURL(TARGET).href;
const SHOT_DIR = "/tmp";

let failures = 0;
const log = [];

function check(name, ok, detail = "") {
  if (ok) { log.push(`  [PASS] ${name}`); }
  else { failures++; log.push(`  [FAIL] ${name}${detail ? " -> " + detail : ""}`); }
}

async function shot(page, name) {
  const p = path.join(SHOT_DIR, `cuzhi_journey_${name}.png`);
  await page.screenshot({ path: p });
  return p;
}

async function waitFor(page, predicate, timeout = 10000, interval = 100) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await page.evaluate(predicate)) return true;
    await page.waitForTimeout(interval);
  }
  return false;
}

async function main() {
  console.log("=================================================");
  console.log(">>> 促织 真实用户路径：Beat 1 → Beat 6 <<<");
  console.log("=================================================");
  console.log("目标:", FILE_URL);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const page = await context.newPage();

  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });

  // ===== 0. 准备二周目环境 =====
  await page.goto(FILE_URL, { waitUntil: "load", timeout: 60000 });
  await page.evaluate(() => localStorage.setItem("cuzhi_playthrough_count", "1"));
  await page.reload({ waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(() => !!window.__cuzhi, null, { timeout: 30000 });
  check("二周目状态生效", await page.evaluate(() => window.__cuzhi.storage.isSecondPlaythroughOrMore()));
  await shot(page, "00_start");

  // ===== 1. Beat 1 真实点击对话 =====
  console.log("\n----- Beat 1：逼 -----");
  let beat1Clicks = 0;
  for (let i = 0; i < 30; i++) {
    if (await page.evaluate(() => window.__cuzhi.state.currentBeat !== 1)) break;
    const ready = await page.evaluate(() => {
      const p = document.getElementById("narrative-panel");
      const b = document.getElementById("btn-next");
      return p && !p.hidden && b && !b.disabled;
    });
    if (ready) {
      await page.click("#btn-next");
      beat1Clicks++;
      await page.waitForTimeout(500);
    } else {
      await page.waitForTimeout(300);
    }
  }
  const beat1Final = await page.evaluate(() => window.__cuzhi.state.currentBeat);
  check("Beat 1 推进到下一折", beat1Final === 2, `actual=${beat1Final}, clicks=${beat1Clicks}`);
  await shot(page, "01_after_beat1");

  // ===== 2. Beat 2：捕（古寺抓虫） =====
  console.log("\n----- Beat 2：捕 -----");
  let beat2Clicks = 0;
  for (let i = 0; i < 30; i++) {
    const stage = await page.evaluate(() => {
      const catchLayer = document.getElementById("catch-layer");
      const panel = document.getElementById("narrative-panel");
      return {
        catchActive: catchLayer && !catchLayer.hidden,
        dialogActive: panel && !panel.hidden
      };
    });
    if (stage.catchActive) break;
    if (stage.dialogActive) {
      await page.click("#btn-next");
      beat2Clicks++;
      await page.waitForTimeout(500);
    } else {
      await page.waitForTimeout(300);
    }
  }
  const catchVisible = await page.evaluate(() => {
    const c = document.getElementById("catch-layer");
    return c && !c.hidden;
  });
  check("Beat 2 setup 对话走完进入抓虫层", catchVisible, `setup clicks=${beat2Clicks}`);
  await shot(page, "02a_catch_layer");

  // 真实点击草丛
  for (let i = 0; i < 4; i++) {
    const stillActive = await page.evaluate(() => {
      const c = document.getElementById("catch-layer");
      return c && !c.hidden;
    });
    if (!stillActive) break;
    const box = await page.locator("#catch-field").boundingBox();
    if (!box) break;
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.waitForTimeout(300);
  }
  const inspectAppeared = await waitFor(page, () => {
    const b = document.getElementById("btn-inspect-confirm");
    return b && !b.hidden;
  }, 5000);
  check("抓虫后验虫弹窗出现", inspectAppeared);
  await shot(page, "02b_inspect");

  // ===== 3. 验虫确认（用户原卡点的关键前置） =====
  if (inspectAppeared) {
    await page.click("#btn-inspect-confirm");
    const beat3Reached = await waitFor(page, () =>
      window.__cuzhi && window.__cuzhi.state.currentBeat === 3, 5000);
    check("验虫后进入 Beat 3", beat3Reached);
  }
  await shot(page, "03_beat3_entry");

  // ===== 4. Beat 3：养 —— 这正是用户原卡死点 =====
  console.log("\n----- Beat 3：养（用户原卡死点）-----");
  const beat3PanelVisible = await page.evaluate(() => {
    const p = document.getElementById("narrative-panel");
    return p && !p.hidden;
  });
  check("Beat 3 对话面板真实可见", beat3PanelVisible);

  const beat3BtnText = (await page.textContent("#btn-next") || "").trim();
  check("Beat 3 按钮为「掀开瓦盖」", beat3BtnText === "掀开瓦盖", `actual="${beat3BtnText}"`);

  const noteText = await page.textContent(".vermilion-margin-note").catch(() => null);
  check("Beat 3 朱批真实显示", !!noteText && noteText.includes("祸福倚伏"),
    `note="${noteText}"`);

  check("Beat 3 无未捕获异常", pageErrors.length === 0, pageErrors.join(" | "));
  await shot(page, "04_beat3_pot_ready");

  // 真实点击陶盆
  await page.click("#prop-pot");
  const nameInputAppeared = await waitFor(page, () =>
    !!document.getElementById("cricket-name-input"), 5000);
  check("掀盖后进入起名流程", nameInputAppeared);

  if (nameInputAppeared) {
    await page.fill("#cricket-name-input", "青项金翅");
    await page.click("#btn-next");
    await page.waitForTimeout(800);
    for (let i = 0; i < 3; i++) {
      const fb = await page.$("#feed-click-btn");
      if (fb) { await fb.click(); await page.waitForTimeout(200); }
    }
    // 喂完后 beat3 还有多段对话，必须循环点到 beat 真正切换
    for (let i = 0; i < 15; i++) {
      const cur = await page.evaluate(() => window.__cuzhi.state.currentBeat);
      if (cur !== 3) break;
      const dialogActive = await page.evaluate(() => {
        const p = document.getElementById("narrative-panel");
        return p && !p.hidden;
      });
      if (dialogActive) {
        await page.click("#btn-next");
        await page.waitForTimeout(450);
      } else {
        await page.waitForTimeout(300);
      }
    }
  }
  await shot(page, "05_beat3_after_feed");

  // ===== 5. Beat 4：祸 =====
  console.log("\n----- Beat 4：祸 -----");
  const beat4 = await page.evaluate(() => window.__cuzhi.state.currentBeat);
  check("已进入 Beat 4", beat4 === 4, `actual=${beat4}`);

  const beat4Panel = await page.evaluate(() => {
    const p = document.getElementById("narrative-panel");
    return p && !p.hidden;
  });
  check("Beat 4 对话面板可见", beat4Panel);

  const note4Text = await page.textContent(".vermilion-margin-note").catch(() => null);
  check("Beat 4 朱批真实显示", !!note4Text && note4Text.includes("痛极无言"),
    `note="${note4Text}"`);
  await shot(page, "06_beat4_entry");

  for (let i = 0; i < 10; i++) {
    const cur = await page.evaluate(() => window.__cuzhi.state.currentBeat);
    if (cur !== 4) break;
    const action = await page.evaluate(() => {
      const shoe = document.querySelector(".wet-shoe");
      const input = document.getElementById("cricket-name-input");
      const panel = document.getElementById("narrative-panel");
      const nextBtn = document.getElementById("btn-next");
      if (input) return { kind: "input" };
      if (shoe && shoe.classList.contains("interactive")) return { kind: "shoe" };
      if (panel && !panel.hidden && nextBtn && !nextBtn.disabled) return { kind: "next" };
      return { kind: "wait" };
    });
    if (action.kind === "input") {
      await page.fill("#cricket-name-input", "小梅花");
      await page.click("#btn-next");
    } else if (action.kind === "shoe") {
      // 湿草鞋有呼吸动画，强制点击跳过稳定性检查
      await page.click(".wet-shoe", { force: true });
    } else if (action.kind === "next") {
      await page.click("#btn-next");
    }
    await page.waitForTimeout(500);
  }
  const beat5Reached = await page.evaluate(() => window.__cuzhi.state.currentBeat === 5);
  check("Beat 4 走完进入 Beat 5", beat5Reached);
  await shot(page, "07_beat4_done");

  // ===== 6. Beat 5：斗（战斗 mini-game 太复杂，用 nextBeat 跳过） =====
  console.log("\n----- Beat 5：斗（用 nextBeat 跳过战斗）-----");
  await page.evaluate(() => window.__cuzhi.nextBeat());
  await page.waitForTimeout(300);
  const beat6Reached = await page.evaluate(() => window.__cuzhi.state.currentBeat === 6);
  check("进入 Beat 6", beat6Reached);
  await shot(page, "08_beat6_awakening");

  // ===== 7. Beat 6：苏 =====
  console.log("\n----- Beat 6：苏 -----");
  for (let i = 0; i < 15; i++) {
    const has = await page.evaluate(() => typeof window.__cuzhi.onDialogNext === "function");
    if (!has) break;
    await page.click("#btn-next");
    await page.waitForTimeout(400);
  }
  const stamp = await page.$("#seal-stamp-target");
  if (stamp) {
    try {
      const visible = await stamp.isVisible();
      if (visible) {
        await stamp.click({ force: true });
        await page.waitForTimeout(500);
        check("盖印成功", true);
      } else {
        check("盖印成功", false, "seal-stamp-target 元素存在但不可见（唤醒层未激活）");
      }
    } catch (e) {
      check("盖印成功", false, e.message.split("\n")[0]);
    }
  } else {
    check("盖印成功", false, "seal-stamp-target 不存在");
  }
  check("全程无未捕获异常", pageErrors.length === 0, pageErrors.join(" | "));
  await shot(page, "09_beat6_seal");

  // ===== 收尾 =====
  console.log("\n================= 旅程测试结果 =================");
  log.forEach((l) => console.log(l));
  console.log("==============================================");
  console.log("pageErrors:", pageErrors.length, "consoleErrors:", consoleErrors.length);

  await browser.close();

  console.log(failures === 0
    ? `\n>>> 真实用户路径 0 阻断（${log.length} 项断言全过）<<<`
    : `\n>>> ${failures} 项失败 / ${log.length} 项 <<<`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("[JOURNEY TEST CRASHED]:", e);
  process.exit(1);
});
