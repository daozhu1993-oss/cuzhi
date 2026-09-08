# 《促织 2.0 终极进化版》· 技术交接与排障指南 (HANDOVER.md)

> **致接手工程师（Codex / 开发团队）：**  
> 本文档旨在完整梳理《促织 2.0》项目的全景架构、模块依赖、剧情状态机、当前已定位的现场问题现象与深度排查线索，协助你以最快速度接手并彻底根治问题。

---

## 1. 项目基本信息与全景架构

- **项目根目录**：`/Users/gx/.gemini/antigravity/scratch/cuzhi/`
- **最终单文件产物**：`/Users/gx/.gemini/antigravity/scratch/cuzhi/促织_双击直接玩.html`  
  *(约 13.3 MB，纯前端 HTML 单文件，零外部网络依赖，离线内置所有 Base64 水墨工笔立绘、Web Audio 合成音效与粒子)*
- **局域网测试服务**：`http://192.168.1.192:8080/` (对应根目录 `index.html`)
- **构建打包脚本**：`/Users/gx/.gemini/antigravity/brain/92edefc5-43d8-4b67-801e-0f8592197e7a/scratch/clean_builder.py`  
  *(将 `src/` 下所有 JS/CSS/资源打包编译为 `index.html` 和 `促织_双击直接玩.html`)*

### 目录与文件清单

```text
/Users/gx/.gemini/antigravity/scratch/cuzhi/
├── 促织_双击直接玩.html         # 最终单文件产物（用户直接运行的文件）
├── index.html                  # 静态服务入口
├── test_master_runner.mjs      # 自动化全流程仿真测试脚本
├── assets/images/              # 水墨工笔原画（JPG）
├── src/
│   ├── main.js                 # 核心控制器 GameController、HUD绑定、对话框管理、藏书票生成
│   ├── data/
│   │   ├── script.js           # 1~6 折全部剧情剧本配置
│   │   ├── opponents.js        # 斗虫 4 阶对手配置与奖励
│   │   └── assets.js           # 资源索引
│   ├── engine/
│   │   ├── audio.js            # Web Audio 纯算法合成音效与国风琵琶/笛音引擎
│   │   ├── state.js            # 全局响应式状态管理（GameState）
│   │   ├── storage.js          # 本地周目与图鉴持久化
│   │   └── particles.js        # 水墨浮尘粒子引擎
│   ├── mini-games/
│   │   ├── catch-game.js       # 第 2 折古庙草丛听声辨位寻虫游戏
│   │   ├── battle-game.js      # 第 5 折四阶斗虫战斗引擎（避咬/绝杀/大公鸡战）
│   │   └── coliseum-game.js    # 鬼市百妖无尽对决擂台
│   ├── scenes/
│   │   ├── sandbox-scroll.js   # 荒诞家运沙盘画卷
│   │   ├── beat1-force.js      # 第 1 折【逼】：差役索蟋蟀、杖责五十
│   │   ├── beat2-catch.js      # 第 2 折【捕】：古寺寻踪、古风虫鉴
│   │   ├── beat3-raise.js      # 第 3 折【养】：破屋陶盆、掀盖赐名、喂养粟米
│   │   ├── beat4-disaster.js   # 第 4 折【祸】：盆覆儿亡、井沿拾履、石缝羸弱小虫
│   │   ├── beat5-triumph.js    # 第 5 折【斗】：斗蟹壳青/县衙巨甲/抚军巨鸡/御前金案
│   │   └── beat6-awake.js      # 第 6 折【苏】：金殿梦醒、宣德家运簿、钤印定案、藏书票导出
│   └── styles/
│       ├── main.css            # 全局布局、HUD、字体与动画
│       ├── stage.css           # 2.5D 画卷舞台、演员立绘、道具、底部叙事面板
│       ├── battle.css          # 斗虫血条、斗罐、斩击特效
│       ├── ledger.css          # 宣德家运簿、血书折页、藏书票弹窗
│       ├── sandbox.css         # 沙盘样式
│       └── coliseum.css        # 鬼市擂台样式
```

---

## 2. 6 折剧情生命周期流转机制

1. **第 1 折【逼】(`beat1-force.js`)**：
   - 华阴县衙差役催逼，成名受杖刑五十（震屏 + 钝击音效），掩面归家进入第 2 折。
2. **第 2 折【捕】(`beat2-catch.js`)**：
   - 对话后隐藏对话框，呼出 `#catch-layer`；
   - 运行 `CatchGame`：玩家点击草丛 1~2 次定位神虫金光，扣入瓦盆；
   - 弹出 `showCricketInspectionModal`（工笔立绘虫鉴），点击【谨遵神物 · 奉入陶盆】进入第 3 折。
3. **第 3 折【养】(`beat3-raise.js`)**：
   - 场景切为室内 `scene-cottage`，地上有陶盆 `#prop-pot`；
   - 掀开瓦盖 ➔ 触发 `name_god_cricket` 赐名【青项金翅】 ➔ 喂养 3 粒粟米 ➔ 幼子抚盆端详 ➔ 进入第 4 折。
4. **第 4 折【祸】(`beat4-disaster.js`)**：
   - 瓦盆翻覆神虫毙 ➔ 后院荒井拾起湿草鞋（`well_scene`） ➔ 1.8 秒黑场过渡（`flashBlackout`） ➔ 门前草际为羸弱小虫赐名【小梅花】 ➔ 进入第 5 折。
5. **第 5 折【斗】(`beat5-triumph.js`)**：
   - 四阶阶梯对决（蟹壳青 ➔ 县衙巨甲 ➔ 抚军巨雄鸡 ➔ 御前金案） ➔ 战胜后进入第 6 折。
6. **第 6 折【苏】(`beat6-awake.js`)**：
   - 金殿梦醒 ➔ 打开宣德官修家运簿（`showAwakeningLedger`） ➔ 4 场对战血书置换【成名之子（九岁）】 ➔ 点按/长按印泥钤印 ➔ 点击【导出藏书票】生成高清可下载 PNG 藏书票。

---

## 3. 当前遇到的现场问题与现象复现

### 现场复现现象
- **现象描述**：玩家在第 2 折古庙草丛抓完虫子并点击确认后，画面切换到了第 3 折室内破屋背景（`成名`、`成妻` 立绘呈现，左下角有陶盆），但**底部叙事对话面板（`#narrative-panel`）未正常呈现或无法点击交互，画面定格在此处**。

### 核心排查方向建议（给 Codex）

1. **`CatchGame` 结束与第 3 折入场的时序流转**：
   - 在 `src/scenes/beat2-catch.js` 中：
     ```javascript
     const catchGame = new CatchGame(catchLayer, () => {
       controller.showCricketInspectionModal(() => {
         controller.nextBeat(); // 推进到 Beat 3
       });
     });
     ```
   - 检查 `showCricketInspectionModal` 的 `#btn-inspect-confirm` 被点击时，`modal.remove()` 之后是否导致 `#catch-layer` 或其他全局事件监听残留遮挡。

2. **第 3 折 `beat3-raise.js` 的掀盖与对话队列**：
   - 查看 `src/scenes/beat3-raise.js`：
     ```javascript
     export function runBeat3(controller) {
       controller.updateSceneBg("scene-cottage");
       controller.setActors({ chengming: true, son: true, wife: true, officer: false, pot: true });
       controller.setFortune(30, "翻身有望", "得神虫青项金翅 · 悉心照护");
       
       const pot = document.getElementById("prop-pot");
       if (pot) {
         pot.classList.add("can-open");
         // 对话框提示掀盖
         controller.showDialog({
           kicker: "【 案头密护 】",
           speaker: "成名",
           text: "置于陶盆之中，轻掩泥盖……（点按掀开瓦盖察视）",
           btnText: "掀开瓦盖",
           onNext: () => { openPotAndProceed(); }
         });
         pot.onclick = (e) => { e.stopPropagation(); openPotAndProceed(); };
       } else {
         proceedWithScripts();
       }
     ```
   - **注意点**：如果玩家在进入 Beat 3 时，点击事件被快速连击，或者 `showDialog` 没有正确解除 `hidden`，请检查 `controller.showDialog` 中对 `#narrative-panel` 的 DOM 操作是否生效。

3. **对话框 DOM ID 与容器层级**：
   - HTML 中的结构：
     ```html
     <footer class="narrative-panel" id="narrative-panel">
       <div class="dialog-kicker" id="dialog-kicker"></div>
       <div class="dialog-speaker" id="dialog-speaker"></div>
       <div class="dialog-body" id="dialog-content"></div>
       <div class="dialog-actions">
         <button class="dialog-next-btn" id="btn-next" type="button">继续</button>
       </div>
       <div class="beat-progress" id="beat-progress">...</div>
     </footer>
     ```
   - 检查 `src/main.js` 中的 `showDialog`, `showDialogWithInput`, `showFeedInteraction`：
     必须确保 `panel.hidden = false` 且 `panel.style.display = "flex"`。

---

## 4. 构建与测试操作指令

### 1. 修改代码后重新打包单文件
```bash
python3 /Users/gx/.gemini/antigravity/brain/92edefc5-43d8-4b67-801e-0f8592197e7a/scratch/clean_builder.py
```
> 该脚本会自动将 `src/` 下的所有模块与 Base64 资源编译生成 `index.html` 以及 `促织_双击直接玩.html`。

### 2. 运行自动化全流程仿真测试
```bash
node /Users/gx/.gemini/antigravity/scratch/cuzhi/test_master_runner.mjs
```
> 该测试套件会模拟从 Beat 1 到 Beat 6 的所有按钮点击、小游戏、对决与藏书票导出。
