// 全局游戏状态机与对战统计模型
import { storage } from "./storage.js";

export class GameState {
  constructor() {
    this.currentBeat = 1;
    this.scriptIndex = 0;
    this.cricketName = "青项金翅";
    this.smallCricketName = "小梅花";
    
    // 显性表：得意与家运 (0 ~ 100)
    this.fortune = 0;
    this.fortuneLabel = "大祸临头";
    this.fortuneSubtext = "摊派催逼 · 杖责五十";

    // 战绩实录清单
    this.battleLog = [];

    // 对战综合统计（用于生成千人千面藏书票印章）
    this.stats = {
      totalParries: 0,
      totalStrikes: 0,
      sufferedDefeats: 0,
      perfectDance: true,
      strawTeaseCount: 0
    };

    // 周目状态
    this.isSecondPlaythrough = storage.isSecondPlaythroughOrMore();
  }

  setBeat(beat) {
    this.currentBeat = beat;
    this.scriptIndex = 0;
  }

  updateFortune(value, label, subtext) {
    this.fortune = Math.max(0, Math.min(100, value));
    if (label) this.fortuneLabel = label;
    if (subtext) this.fortuneSubtext = subtext;
  }

  addBattleRecord(record) {
    this.battleLog.push(record);
  }

  // 计算千人千面藏书票印鉴评价
  getSealTitle() {
    if (this.stats.sufferedDefeats === 0 && this.stats.totalParries >= 3) {
      return { title: "灵犀绝杀", sub: "破尽敌芒 · 算无遗策" };
    } else if (this.stats.sufferedDefeats === 0) {
      return { title: "百战无伤", sub: "轻捷迅勇 · 一往直前" };
    } else if (this.stats.sufferedDefeats > 0) {
      return { title: "险胜入宫", sub: "如履薄冰 · 死里求生" };
    }
    return { title: "天子近臣", sub: "应节羽舞 · 恩荫子孙" };
  }

  reset() {
    this.currentBeat = 1;
    this.scriptIndex = 0;
    this.cricketName = "青项金翅";
    this.smallCricketName = "小梅花";
    this.fortune = 0;
    this.fortuneLabel = "大祸临头";
    this.fortuneSubtext = "摊派催逼 · 杖责五十";
    this.battleLog = [];
    this.stats = {
      totalParries: 0,
      totalStrikes: 0,
      sufferedDefeats: 0,
      perfectDance: true,
      strawTeaseCount: 0
    };
    this.isSecondPlaythrough = storage.isSecondPlaythroughOrMore();
  }
}

export const state = new GameState();
