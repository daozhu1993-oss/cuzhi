// 斗场四阶梯对手数据模型（爽快干脆、斩杀感极强的对决数值）
import { imageAssets } from "./assets.js";

export const opponentsData = [
  {
    id: "crab_green",
    name: "蟹壳青",
    title: "市井霸王 · 初遇劲敌",
    image: imageAssets.illustration_cricket_god,
    imageKey: "illustration_cricket_god",
    maxHp: 50,
    attackPower: 12,
    speed: 1.0,
    windupDuration: 1000,
    reward: "一吊铜钱",
    rewardText: "解燃眉之急 · 换得数日口粮",
    description: "头大项阔，背如墨玉，性暴善扑，市井少年所豢之头号霸王。"
  },
  {
    id: "yamen_beetle",
    name: "县衙巨甲",
    title: "县衙恶霸 · 公堂钢颚",
    image: imageAssets.illustration_cricket_god,
    imageKey: "illustration_cricket_god",
    maxHp: 60,
    attackPower: 16,
    speed: 1.1,
    windupDuration: 900,
    reward: "免除徭役 · 补邑庠生",
    rewardText: "县令大喜 · 赠金放归免催逼",
    description: "躯干如铁，赤须钢颚，连毙敌虫数十只，性极残忍。"
  },
  {
    id: "fujun_rooster",
    name: "抚军巨雄鸡",
    title: "巨型霸主 · 惊世奇斗",
    image: imageAssets.illustration_rooster,
    imageKey: "illustration_rooster",
    maxHp: 65,
    attackPower: 18,
    speed: 1.2,
    windupDuration: 950,
    isSpecialRooster: true,
    reward: "赐金百两 · 骏马雕鞍",
    rewardText: "巡抚惊骇 · 驰表进贡入深宫",
    description: "高冠金爪，怒目若火。直跃其冠，一击绝杀！"
  },
  {
    id: "palace_emperor",
    name: "御前金案",
    title: "金銮大殿 · 龙颜弄乐",
    image: imageAssets.bg_imperial_palace,
    imageKey: "bg_imperial_palace",
    maxHp: 100,
    attackPower: 0,
    speed: 1.0,
    windupDuration: 1000,
    isPalaceDance: true,
    reward: "富埒世家 · 恩荫子孙",
    rewardText: "天子龙颜大悦 · 诏封显爵",
    description: "明宣宗宣德帝御座。闻琴则起舞，应宫商角徵羽五音，天下无双。"
  }
];
