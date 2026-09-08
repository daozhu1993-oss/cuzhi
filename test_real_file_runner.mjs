// 真实 file:// 双击版验收测试（Playwright + Chromium）
//
// 目的：Node 版 test_master_runner.mjs 用的是 DOM mock，
//       mock 的 getElementById 对任何 ID 都会凭空造元素，
//       因此"元素存在"类断言在 mock 里恒真，无法发现真实双击版的问题。
//       本文件用真实浏览器以 file:// 协议加载打包产物，
//       真实渲染、真实点击、真实 localStorage，专治这类误判。
//
// 运行：
//   NODE_PATH=/Users/gx/.workbuddy/binaries/node/workspace/node_modules \
//   node test_real_file_runner.mjs

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";

// ESM 不认 NODE_PATH，优先用项目内 playwright，
// 找不到再回退到受管工作区（避免污染用户项目目录）
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

const results = [];
let failures = 0;

function check(name, condition, detail = "") {
  if (condition) {
    results.push(`  [PASS] ${name}`);
  } else {
    failures++;
    results.push(`  [FAIL] ${name}${detail ? " -> " + detail : ""}`);
  }
}

async function openScenario(browser, playthroughCount) {
  const context = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const page = await context.newPage();

  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });

  // 首次加载只为拿到 file:// 源，写入周目数后 reload 让游戏读到
  await page.goto(FILE_URL, { waitUntil: "load", timeout: 60000 });
  await page.evaluate((n) => {
    try { localStorage.setItem("cuzhi_playthrough_count", String(n)); } catch (e) {}
  }, playthroughCount);
  await page.reload({ waitUntil: "load", timeout: 60000 });
  await page.waitForFunction(() => !!window.__cuzhi, null, { timeout: 30000 });

  return { context, page, pageErrors, consoleErrors };
}

async function visibilityProbe(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { exists: false };
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      exists: true,
      hidden: el.hidden,
      display: style.display,
      visibility: style.visibility,
      opacity: parseFloat(style.opacity || "1"),
      rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
      inViewport: rect.width > 0 && rect.height > 0 &&
        rect.top < window.innerHeight && rect.bottom > 0
    };
  }, selector);
}

async function runScenario(browser, count, label) {
  console.log(`\n===== ${label}（cuzhi_playthrough_count = ${count}）=====`);
  const { context, page, pageErrors, consoleErrors } = await openScenario(browser, count);

  // 周目数必须真的生效，否则本用例无意义
  const effective = await page.evaluate(() =>
    window.__cuzhi.storage.isSecondPlaythroughOrMore());
  check(`${label} · 周目状态生效`, effective === (count >= 1), `isSecond=${effective}`);

  // --- 进入第 3 折 ---
  await page.evaluate(() => window.__cuzhi.startBeat(3));
  await page.waitForTimeout(600);

  check(`${label} · Beat3 无未捕获异常`, pageErrors.length === 0, pageErrors.join(" | "));

  const panel = await visibilityProbe(page, "#narrative-panel");
  check(`${label} · Beat3 对话面板真实可见`,
    panel.exists && !panel.hidden && panel.inViewport && panel.opacity > 0,
    JSON.stringify(panel));

  const btnText = await page.textContent("#btn-next");
  check(`${label} · Beat3 按钮为「掀开瓦盖」`, (btnText || "").trim() === "掀开瓦盖",
    `实际="${(btnText || "").trim()}"`);

  const hasNext = await page.evaluate(() => typeof window.__cuzhi.onDialogNext === "function");
  check(`${label} · Beat3 有推进回调`, hasNext);

  // --- 朱批（仅二周目应有）---
  const note = await visibilityProbe(page, ".vermilion-margin-note");
  const noteText = note.exists ? (await page.textContent(".vermilion-margin-note")) : "";
  if (count >= 1) {
    check(`${label} · Beat3 朱批已渲染`, !!noteText && noteText.includes("祸福倚伏"),
      `文案="${noteText}"`);
    check(`${label} · Beat3 朱批真实可见`,
      note.exists && !note.hidden && note.inViewport && note.opacity > 0,
      JSON.stringify(note));
  } else {
    check(`${label} · 首周目不显示朱批`, !note.exists || note.hidden,
      JSON.stringify(note));
  }

  // --- 真实点击陶盆，验证掀盖 -> 起名 ---
  await page.click("#prop-pot");
  await page.waitForTimeout(1000);
  const namingInput = await page.$("#cricket-name-input");
  check(`${label} · 点陶盆后进入起名流程`, !!namingInput);

  if (namingInput) {
    await page.fill("#cricket-name-input", "青项金翅");
    await page.click("#btn-next");
    await page.waitForTimeout(500);

    // 喂养交互
    const feedBtn = await page.$("#feed-click-btn");
    check(`${label} · 进入喂养交互`, !!feedBtn);
    if (feedBtn) {
      await feedBtn.click();
      await feedBtn.click();
      await feedBtn.click();
    }
    await page.click("#btn-next");
    await page.waitForTimeout(500);
  }

  const beatAfterFeed = await page.evaluate(() => window.__cuzhi.state.currentBeat);
  check(`${label} · 喂养后仍在推进（未冻死）`, beatAfterFeed >= 3, `beat=${beatAfterFeed}`);

  // --- 第 4 折二周目不得二次卡死 ---
  await page.evaluate(() => window.__cuzhi.startBeat(4));
  await page.waitForTimeout(600);
  const beat4Panel = await visibilityProbe(page, "#narrative-panel");
  check(`${label} · Beat4 面板真实可见`,
    beat4Panel.exists && !beat4Panel.hidden && beat4Panel.inViewport,
    JSON.stringify(beat4Panel));
  const beat4Next = await page.evaluate(() => typeof window.__cuzhi.onDialogNext === "function");
  check(`${label} · Beat4 有推进回调`, beat4Next);

  if (count >= 1) {
    const note4Text = await page.textContent(".vermilion-margin-note");
    check(`${label} · Beat4 朱批已渲染`, !!note4Text && note4Text.includes("痛极无言"),
      `文案="${note4Text}"`);
  }

  // --- HUD 按钮必须真的绑上事件 ---
  const hudBound = await page.evaluate(() => {
    const probe = (id) => {
      const el = document.getElementById(id);
      return { id, exists: !!el, bound: !!(el && typeof el.onclick === "function") };
    };
    return [probe("btn-audio"), probe("btn-restart"), probe("btn-manual")];
  });
  for (const b of hudBound) {
    check(`${label} · HUD 按钮 #${b.id} 已绑定`, b.exists && b.bound, JSON.stringify(b));
  }

  // --- 促织谱能开能关 ---
  await page.click("#btn-manual");
  await page.waitForTimeout(400);
  const manualOpen = await page.evaluate(() => !document.getElementById("manual-modal").hidden);
  check(`${label} · 促织谱可打开`, manualOpen);
  if (manualOpen) {
    const closeBtn = await page.$("#manual-close-btn");
    check(`${label} · 促织谱有关闭按钮`, !!closeBtn);
    if (closeBtn) {
      await closeBtn.click();
      await page.waitForTimeout(300);
      const manualClosed = await page.evaluate(() =>
        document.getElementById("manual-modal").hidden);
      check(`${label} · 促织谱可关闭（不会软锁）`, manualClosed);
    }
  }

  const shotPath = `/tmp/cuzhi_${count >= 1 ? "second" : "first"}_beat3.png`;
  await page.evaluate(() => window.__cuzhi.startBeat(3));
  await page.waitForTimeout(800);
  await page.screenshot({ path: shotPath });
  console.log(`  截图: ${shotPath}`);

  if (pageErrors.length) {
    console.log(`  !! 未捕获异常: ${pageErrors.join(" | ")}`);
  }
  if (consoleErrors.length) {
    console.log(`  !! console.error: ${consoleErrors.slice(0, 3).join(" | ")}`);
  }

  await context.close();
}

async function main() {
  console.log("=================================================");
  console.log(">>> 促织 真实 file:// 双击版验收 <<<");
  console.log("=================================================");
  console.log("目标文件:", FILE_URL);

  const browser = await chromium.launch({ headless: true });
  try {
    await runScenario(browser, 0, "首周目");
    await runScenario(browser, 1, "二周目");
  } finally {
    await browser.close();
  }

  console.log("\n================= 结果汇总 =================");
  results.forEach((r) => console.log(r));
  console.log("============================================");
  console.log(failures === 0
    ? `>>> 全部通过（${results.length} 项）<<<`
    : `>>> 失败 ${failures} / ${results.length} 项 <<<`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("[REAL FILE TEST CRASHED]:", e);
  process.exit(1);
});
