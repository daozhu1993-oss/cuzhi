// 【一人飞升 · 荒诞家运流转沙盘】组件
import { state } from "../engine/state.js";
import { sound } from "../engine/audio.js";

export class SandboxScroll {
  constructor(container) {
    this.container = container;
    this.wealthVal = 10;
    this.karmaVal = 10;
    this.unlockedStage = 1; // 1~4
  }

  show(stage = null) {
    if (stage) this.unlockedStage = Math.max(this.unlockedStage, stage);
    if (!this.container) return;

    this.container.hidden = false;
    sound.playPaperFlip();

    const stagesData = [
      {
        estateIcon: "🛖",
        estateName: "成名漏屋 · 补瓦食米",
        estateDesc: "赢蟹壳青得一吊铜钱。换得半斗糙米，修补破漏柴顶。夫妇相顾微有喜色。",
        countyIcon: "🌾",
        countyName: "华阴县巷 · 勉强度日",
        countyDesc: "里胥仍在各户敲门催粮，乡邻闻成名得赏，投以艳羡之目光。",
        eventTitle: "【 乡邻乞米 】",
        eventDesc: "隔壁张老汉因赋税被杖，携孙乞求分一口米汤救急。",
        btnKind: "分米半碗 (良心+15)",
        btnGrand: "闭门蓄势 (富贵+15)"
      },
      {
        estateIcon: "🏡",
        estateName: "成名新宅 · 儒生青衫",
        estateDesc: "赢县衙巨甲，免除徭役并补邑庠生。县令亲赠锦缎，成名换上儒生蓝衫。",
        countyIcon: "⛓️",
        countyName: "公堂锁拿 · 啼哭震天",
        countyDesc: "为求佳虫，县衙加紧抓捕。差役正用铁链锁走交不出促织的昔日同窗。",
        eventTitle: "【 同窗泣别 】",
        eventDesc: "昔日好友被差役押往牢狱，泣求成名看在同窗份上在县令前代为美言。",
        btnKind: "代为求情 (良心+20)",
        btnGrand: "明哲保身 (富贵+20)"
      },
      {
        estateIcon: "🏯",
        estateName: "巡抚赐宅 · 骏马雕鞍",
        estateDesc: "斗败抚军大公鸡，巡抚惊骇赏赐万金。成名扩建百间大宅，僮仆数十，出则跨雕鞍骏马。",
        countyIcon: "🍂",
        countyName: "全邑荒芜 · 闭户进山",
        countyDesc: "抚军严令全省献虫，田亩荒芜，百姓阖门入山掘石捉虫，民不聊生。",
        eventTitle: "【 门前乞者 】",
        eventDesc: "昔日救助成名之老邻因进山摔断双腿沦为乞丐，在成名朱门前讨饭。",
        btnKind: "施金收容 (良心+25)",
        btnGrand: "驱离门庭 (富贵+25)"
      },
      {
        estateIcon: "👑",
        estateName: "天子封爵 · 富埒王侯",
        estateDesc: "御前闻琴起舞龙颜大悦，诏封显爵。金殿赐宴锦衣玉食，仙及鸡犬！而祠堂幼子灵位已落尘埃。",
        countyIcon: "📜",
        countyName: "天子一跬步 · 万民白骨枯",
        countyDesc: "宣德帝爱促织，岁贡不绝。华阴一邑几至半空，万民皆被促织之祸所累。",
        eventTitle: "【 灵前独坐 】",
        eventDesc: "夜深人静，紫金蟒袍的成名独坐祠堂，看着跳动的神虫，泪落如雨。",
        btnKind: "散金济民 (功德圆满)",
        btnGrand: "尽享泼天富贵"
      }
    ];

    const cur = stagesData[Math.min(this.unlockedStage - 1, stagesData.length - 1)];

    this.container.innerHTML = `
      <div class="sandbox-modal">
        <div class="sandbox-header">
          <div class="sandbox-title-wrap">
            <h3>【 一人飞升 · 荒诞家运流转沙盘 】</h3>
            <small>天子一跬步，皆关民命 · 见证微观神虫扭转的人世浮世绘</small>
          </div>
          <button class="sandbox-close-btn" id="btn-close-sandbox" type="button">关闭长卷</button>
        </div>

        <div class="sandbox-balance-bar">
          <div class="balance-item">
            <span>成名家族【泼天富贵值】：</span>
            <span class="balance-val val-wealth" id="val-wealth">${this.wealthVal}</span>
          </div>
          <div class="balance-item">
            <span>天下小民【骨血悲悯值】：</span>
            <span class="balance-val val-karma" id="val-karma">${this.karmaVal}</span>
          </div>
        </div>

        <div class="sandbox-scroll-container">
          <div class="scroll-canvas-stage">
            <!-- 左半幅：成名府宅演变 -->
            <div class="scroll-half">
              <div class="scroll-half-title">【 成 名 府 邸 · 飞 升 】</div>
              <div class="scroll-building-visual">
                <div class="building-icon">${cur.estateIcon}</div>
                <div class="building-name">${cur.estateName}</div>
                <div class="building-desc">${cur.estateDesc}</div>
              </div>
              <div class="scroll-event-box">
                <div class="event-box-header">${cur.eventTitle}</div>
                <div class="event-box-desc">${cur.eventDesc}</div>
                <div class="event-choice-actions">
                  <button class="choice-btn btn-kind" id="btn-choice-kind" type="button">${cur.btnKind}</button>
                  <button class="choice-btn btn-grand" id="btn-choice-grand" type="button">${cur.btnGrand}</button>
                </div>
              </div>
            </div>

            <!-- 分割线 -->
            <div class="scroll-divider"></div>

            <!-- 右半幅：华阴县世情演变 -->
            <div class="scroll-half">
              <div class="scroll-half-title">【 华 阴 县 邑 · 浮 世 】</div>
              <div class="scroll-building-visual">
                <div class="building-icon">${cur.countyIcon}</div>
                <div class="building-name">${cur.countyName}</div>
                <div class="building-desc">${cur.countyDesc}</div>
              </div>
              <div class="scroll-event-box" style="background:#fcf8f0;">
                <div class="event-box-header">【 史官喟叹 】</div>
                <div class="event-box-desc">故天子一跬步，皆关民命，不可忽也。独是成氏子以蠹化，羽化而登仙，何其怪也！</div>
              </div>
            </div>
          </div>
        </div>

        <div class="sandbox-footer-tip">左右滑动长卷可纵览全景 · 每次胜出均会推进府邸与民情演变</div>
      </div>
    `;

    document.getElementById("btn-close-sandbox").onclick = () => {
      this.container.hidden = true;
    };

    document.getElementById("btn-choice-kind").onclick = () => {
      this.karmaVal += 20;
      sound.playBurstChirps(2);
      document.getElementById("val-karma").innerText = this.karmaVal;
      document.getElementById("btn-choice-kind").disabled = true;
      document.getElementById("btn-choice-grand").disabled = true;
      document.getElementById("btn-choice-kind").innerText = "已施善举";
    };

    document.getElementById("btn-choice-grand").onclick = () => {
      this.wealthVal += 20;
      sound.playCriticalHitHole();
      document.getElementById("val-wealth").innerText = this.wealthVal;
      document.getElementById("btn-choice-kind").disabled = true;
      document.getElementById("btn-choice-grand").disabled = true;
      document.getElementById("btn-choice-grand").innerText = "富贵滔天";
    };
  }
}
