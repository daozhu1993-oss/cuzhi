# 《促织 2.0》Codex → WorkBuddy 增量交接（2026-09-01）

> 本文档是对原 `HANDOVER.md` 的增量补充，不覆盖原交接。  
> 用户当前结论：**真实双击版仍会卡死，请 WorkBuddy 接手修复。**  
> 关键要求：必须用 `file://` 双击版、二周目状态实际验收，不能只看自动化或 localhost 结果。

## 1. 项目与当前产物

- 项目根目录：`/Users/gx/.gemini/antigravity/scratch/cuzhi/`
- 原交接：`/Users/gx/.gemini/antigravity/scratch/cuzhi/HANDOVER.md`
- 当前用户实测文件：`/Users/gx/.gemini/antigravity/scratch/cuzhi/促织_最终修复版.html`
- 主产物：`/Users/gx/.gemini/antigravity/scratch/cuzhi/促织_双击直接玩.html`
- 构建脚本：`/Users/gx/.gemini/antigravity/brain/92edefc5-43d8-4b67-801e-0f8592197e7a/scratch/clean_builder.py`
- 自动测试：`/Users/gx/.gemini/antigravity/scratch/cuzhi/test_master_runner.mjs`
- 当前目录不是 Git 仓库，需按文件核对改动。

当前四份主要 HTML 内容一致，SHA-256 均为：

```text
d143a40f5fe9b15772d4af745c582d0da58fd22c6ddbea68c199b14fd533ebf4
```

`促织_最终修复版.html` 当前大小为 14,007,587 bytes，构建时间为 2026-09-01 11:38:16。

## 2. 最新真实复现（本次最重要）

用户打开：

```text
file:///Users/gx/.gemini/antigravity/scratch/cuzhi/促织_最终修复版.html
```

操作到第 2 折抓虫结束、验虫确认后，页面进入第 3 折，但再次卡死。

最新截图：

```text
/var/folders/t3/xnjj78js0c90301rv26028480000gn/T/TemporaryItems/NSIRD_screencaptureui_b6AKM1/截屏2026-09-01 上午11.59.49.png
```

截图中已经出现以下第 3 折状态：

- 背景为破屋：`scene-cottage`；
- 成名、成妻、成子三张立绘均可见；
- 左下角陶盆可见，但尚未完成掀盖交互初始化；
- 顶部家运为“翻身有望 / 得神虫青项金翅 · 悉心照护”；
- **底部 `#narrative-panel` 完全不可见，没有“掀开瓦盖”按钮，页面无法继续。**

这说明 `runBeat3()` 已执行完第 8～10 行的场景、人物、家运设置，但在随后调用 `controller.showDialog()` 前中断。

## 3. 高置信根因：二周目调用了不存在的方法

`src/scenes/beat3-raise.js` 当前顺序为：

```javascript
controller.updateSceneBg("scene-cottage");
controller.setActors({ chengming: true, son: true, wife: true, officer: false, pot: true });
controller.setFortune(30, "翻身有望", "得神虫青项金翅 · 悉心照护");

if (storage.isSecondPlaythroughOrMore()) {
  controller.showMarginNote("朱批：得此神物，祸福倚伏……");
}

// 此后才初始化陶盆并调用 controller.showDialog(...)
```

但全项目检查结果是：

- `controller.showMarginNote(...)` 只在 `beat3-raise.js` 和 `beat4-disaster.js` 被调用；
- `GameController` 中**没有 `showMarginNote` 方法实现**；
- `src/styles/main.css` 中存在 `.vermilion-margin-note` 样式，说明朱批功能只写了一半：有样式、有调用、没有控制器方法；
- `storage.isSecondPlaythroughOrMore()` 在 `cuzhi_playthrough_count >= 1` 时返回 `true`。

因此二周目进入第 3 折时极可能抛出：

```text
TypeError: controller.showMarginNote is not a function
```

异常发生位置与用户截图完全吻合：场景、三个人物、家运已更新，之后的陶盆 DOM 初始化和 `showDialog()` 均未执行。

第 4 折也有同一调用，若只绕过第 3 折，第 4 折二周目仍会再次卡死。

## 4. 为什么此前测试一直误判通过

### 4.1 localhost 与真实双击版不是同一运行状态

Codex 曾用同一份打包内容在 `http://127.0.0.1:8080/` 完成可视点击测试，首周目可以从捕虫进入第 3 折并看到“掀开瓦盖”。但 localhost 使用的是新的 origin，`cuzhi_playthrough_count` 通常为 0，不会进入朱批分支。

用户真实打开的是长期复用的 `file://` 环境，已经多次体验，极可能保存了 `cuzhi_playthrough_count >= 1`，会进入缺失方法分支。

### 4.2 自动测试没有覆盖二周目

`test_master_runner.mjs` 没有提供持久化 `localStorage` 的二周目测试数据。`storage.getPlaythroughCount()` 访问失败时会捕获异常并返回 0，因此测试始终走首周目路径，无法发现 `showMarginNote` 缺失。

结论：当前“六折自动测试通过”只能证明首周目模拟链路，不能证明真实双击版或二周目链路。

## 5. WorkBuddy 建议修复顺序

### P0：补齐或安全降级 `showMarginNote`

推荐保留已有朱批设计，在 `GameController` 中实现一个可复用方法：

```javascript
showMarginNote(text) {
  const stage = document.getElementById("stage-shell") || document.querySelector(".stage");
  if (!stage) return;

  let note = document.getElementById("vermilion-margin-note");
  if (!note) {
    note = document.createElement("div");
    note.id = "vermilion-margin-note";
    note.className = "vermilion-margin-note";
    stage.appendChild(note);
  }
  note.textContent = text || "";
  note.hidden = false;
}
```

同时确认切换场景时旧朱批是否需要复用、替换或隐藏。

如需先快速解除卡死，可在 Beat 3、Beat 4 调用处加安全判断：

```javascript
if (storage.isSecondPlaythroughOrMore() && typeof controller.showMarginNote === "function") {
  controller.showMarginNote("...");
}
```

但这只会关闭未完成的朱批功能；正式修复优先补齐方法。

### P0：新增二周目回归测试

测试必须让：

```text
localStorage.getItem("cuzhi_playthrough_count") === "1"
```

然后至少验证：

1. `startBeat(3)` 不抛异常；
2. `.vermilion-margin-note` 可见或安全跳过；
3. `#narrative-panel` 可见；
4. `#btn-next` 文案为“掀开瓦盖”；
5. 点击陶盆后能进入起名与喂养流程；
6. 第 4 折二周目同样不因 `showMarginNote` 卡死。

### P1：若仍有差异，给双击版加临时屏内错误日志

若 WorkBuddy 环境无法读取 `file://` 控制台，可临时把 `window.onerror` 与 `unhandledrejection` 显示在右下角调试层，直接让用户截图错误文本。定位完成后再移除调试层。

不要继续只依赖 DOM 节点“存在”；对弹窗和对话面板应同时检查 `isVisible`、视口矩形和真实点击结果。

## 6. Codex 本轮之前已经做过的改动

以下改动已在当前源码和产物中，不代表问题全部解决：

- `src/engine/audio.js`
  - Web Audio 初始化失败时捕获异常并禁用声音，避免离线环境因音频中断。
- `src/main.js`
  - 对话推进音效增加保护；
  - `isAdvancing` 用 `try/finally` 释放；
  - `showDialog()` 强制显示面板并把层级设为 1000；
  - 验虫确认时先隐藏 `#catch-layer` 再进入下一折。
- `src/mini-games/catch-game.js`
  - 捕虫监听先于音效初始化；
  - 音效调用增加异常保护；
  - 抓虫成功 1 秒后隐藏捕虫层并调用完成回调。
- `src/scenes/beat2-catch.js`
  - 捕虫或 Canvas 不可用时回退到可继续对话；
  - 增加 Beat 2 独立“继续故事”恢复按钮。
- `src/scenes/beat3-raise.js`
  - 增加 `potOpening` 防重复掀盖。
- `src/styles/stage.css`
  - `#narrative-panel` 改为固定视口并提高层级；
  - 补齐验虫弹窗 `.inspect-card-modal` 等可见样式；
  - 增加 Beat 2 恢复按钮样式。
- `test_master_runner.mjs`
  - 当前有 11 个检查步骤，包括首周目六折流程、音频/Canvas 降级、Beat 2 面板恢复、验虫弹窗 CSS；
  - **尚未覆盖二周目 `showMarginNote` 分支。**
- `clean_builder.py`
  - 当前同时输出 `促织_双击直接玩.html`、`促织_修复验证版.html`、`促织_最终修复版.html`、`index.html` 等同内容文件。

## 7. 构建与测试命令

重新打包：

```bash
python3 /Users/gx/.gemini/antigravity/brain/92edefc5-43d8-4b67-801e-0f8592197e7a/scratch/clean_builder.py
```

运行当前自动测试：

```bash
node /Users/gx/.gemini/antigravity/scratch/cuzhi/test_master_runner.mjs
```

建议额外检查：

```bash
rg -n "showMarginNote|isSecondPlaythroughOrMore" /Users/gx/.gemini/antigravity/scratch/cuzhi/src
```

## 8. 完成标准（必须逐项满足）

1. 首周目和二周目都能从捕虫进入第 3 折；
2. 真实 `file://` 双击版进入第 3 折后，底部面板显示“掀开瓦盖”；
3. 二周目朱批正常出现，或在功能不可用时安全跳过，不能阻断主线；
4. 掀盖、起名、喂养能继续到第 4 折；
5. 第 4 折二周目不会因同一个 `showMarginNote` 调用再次卡死；
6. `test_master_runner.mjs` 增加二周目用例并通过；
7. 重新构建所有单文件产物；
8. 最后由用户亲自在新文件名的双击版中逐关确认，不能用 localhost 自动测试替代用户验收。

## 9. 当前交接结论

- 验虫弹窗不可见的问题已补过样式；
- 最新实际卡点已经推进到 Beat 3 入场；
- **`showMarginNote` 缺失是当前最符合全部证据的高置信根因，尚未修复；**
- 本文档创建后，Codex 不再声称当前版本已经可完整游玩，等待 WorkBuddy 修复与用户复验。
