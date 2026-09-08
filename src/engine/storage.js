// 本地持久化与虫谱解锁状态
const STORAGE_KEY_PLAYTHROUGH = "cuzhi_playthrough_count";
const STORAGE_KEY_RECORDS = "cuzhi_battle_records";
const STORAGE_KEY_MANUAL = "cuzhi_unlocked_manual";

export const storage = {
  getPlaythroughCount() {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEY_PLAYTHROUGH) || "0", 10);
    } catch {
      return 0;
    }
  },

  incrementPlaythrough() {
    try {
      const current = this.getPlaythroughCount();
      localStorage.setItem(STORAGE_KEY_PLAYTHROUGH, (current + 1).toString());
      return current + 1;
    } catch {
      return 1;
    }
  },

  isSecondPlaythroughOrMore() {
    return this.getPlaythroughCount() >= 1;
  },

  unlockManualItem(id) {
    try {
      const list = this.getUnlockedManual();
      if (!list.includes(id)) {
        list.push(id);
        localStorage.setItem(STORAGE_KEY_MANUAL, JSON.stringify(list));
      }
    } catch (e) {
      console.warn("Manual save failed:", e);
    }
  },

  getUnlockedManual() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_MANUAL) || '["crab_green"]');
    } catch {
      return ["crab_green"];
    }
  }
};
