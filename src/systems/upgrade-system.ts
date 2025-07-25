// アップグレードシステム（手動・自動ダイスのアップグレード管理）

import type { GameState, BulkPurchaseAmount, BulkUpgradeInfo } from '../types/game-state.js';
import {
  DICE_CONFIGS,
  UPGRADE_MULTIPLIERS,
  MANUAL_DICE_CONFIG,
  AUTO_DICE_LEVEL_CONFIG,
} from '../utils/constants.js';
import {
  calculateManualDiceUpgradeCost,
  calculateLevelUpCost,
  calculateAscensionCost,
  calculateMaxLevel,
  calculateBulkLevelUpCost,
  calculateMaxPurchasableCount,
  calculateMaxPurchasableCountNoAscension,
} from '../utils/math-utils.js';

// アップグレード情報の型定義
interface ManualUpgradeInfo {
  cost: number;
  canAfford: boolean;
  currentCount: number;
  currentLevel: number;
}

interface AutoDiceUpgradeInfo {
  index: number;
  faces: number;
  unlocked: boolean;
  level: number;
  ascensionLevel: number;
  maxLevel: number;
  levelUpCost: number;
  ascensionCost: number;
  canUnlock: boolean;
  canLevelUp: boolean;
  canAscend: boolean;
}

interface AllUpgradeInfo {
  manual: ManualUpgradeInfo;
  auto: AutoDiceUpgradeInfo[];
  totalCredits: number;
}

export class UpgradeSystem {
  private gameState: GameState;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  // 手動ダイス個数アップグレード
  upgradeManualDiceCount(): boolean {
    const cost = this.getManualDiceUpgradeCost();

    if (this.gameState.credits >= cost) {
      this.gameState.credits -= cost;
      this.gameState.manualDice.count++;
      this.gameState.manualDice.upgradeLevel++;

      // 統計を更新
      this.gameState.stats.manualDiceUpgrades++;

      console.log(`手動ダイス個数アップグレード！現在: ${this.gameState.manualDice.count}個`);
      return true;
    }
    return false;
  }

  // 自動ダイス解禁（レベル1に上げる）
  unlockAutoDice(diceIndex: number): boolean {
    const dice = this.gameState.autoDice[diceIndex];
    if (!dice || dice.level > 0) return false;

    const cost = this.getAutoDiceLevelUpCost(diceIndex);

    if (this.gameState.credits >= cost) {
      this.gameState.credits -= cost;
      dice.level = 1;
      dice.progress = 0; // 解禁時は0に設定（次の更新で実行される）

      // 統計を更新
      this.gameState.stats.autoDiceUpgrades++;

      console.log(`${dice.faces}面自動ダイス解禁！レベル1`);
      return true;
    }
    return false;
  }

  // 自動ダイスレベルアップ
  levelUpAutoDice(diceIndex: number): boolean {
    const dice = this.gameState.autoDice[diceIndex];
    if (!dice || dice.level === 0) return false;

    const maxLevel = calculateMaxLevel(
      dice.ascension,
      AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE,
      AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT
    );

    if (dice.level >= maxLevel) return false;

    const cost = this.getAutoDiceLevelUpCost(diceIndex);

    if (this.gameState.credits >= cost) {
      this.gameState.credits -= cost;
      dice.level++;

      // 統計を更新
      this.gameState.stats.autoDiceUpgrades++;

      console.log(`${dice.faces}面ダイスレベルアップ！レベル: ${dice.level}`);
      return true;
    }
    return false;
  }

  // 自動ダイスアセンション
  ascendAutoDice(diceIndex: number): boolean {
    const dice = this.gameState.autoDice[diceIndex];
    if (!dice || dice.level === 0) return false;

    const maxLevel = calculateMaxLevel(
      dice.ascension,
      AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE,
      AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT
    );

    if (dice.level < maxLevel) return false;

    const cost = this.getAutoDiceAscensionCost(diceIndex);

    if (this.gameState.credits >= cost) {
      this.gameState.credits -= cost;
      dice.level = 1; // レベルリセット
      dice.ascension++;

      // 統計を更新
      this.gameState.stats.autoDiceAscensions++;

      console.log(`${dice.faces}面ダイスアセンション！アセンションレベル: ${dice.ascension}`);
      return true;
    }
    return false;
  }

  // 手動ダイスアップグレードのコスト計算
  getManualDiceUpgradeCost(): number {
    const level = this.gameState.manualDice.upgradeLevel;
    return calculateManualDiceUpgradeCost(
      level,
      MANUAL_DICE_CONFIG.BASE_UPGRADE_COST,
      UPGRADE_MULTIPLIERS.MANUAL_DICE
    );
  }

  // 自動ダイスレベルアップのコスト計算
  getAutoDiceLevelUpCost(diceIndex: number): number {
    if (diceIndex < 0 || diceIndex >= DICE_CONFIGS.length) return Infinity;

    const dice = this.gameState.autoDice[diceIndex];
    if (!dice) return Infinity;

    return calculateLevelUpCost(
      diceIndex,
      dice.level,
      dice.ascension,
      AUTO_DICE_LEVEL_CONFIG.LEVEL_COST_BASE,
      AUTO_DICE_LEVEL_CONFIG.LEVEL_COST_MULTIPLIER,
      AUTO_DICE_LEVEL_CONFIG.ASCENSION_COST_BASE_MULTIPLIER
    );
  }

  // 自動ダイスアセンションのコスト計算
  getAutoDiceAscensionCost(diceIndex: number): number {
    if (diceIndex < 0 || diceIndex >= DICE_CONFIGS.length) return Infinity;

    const dice = this.gameState.autoDice[diceIndex];
    if (!dice) return Infinity;

    return calculateAscensionCost(
      diceIndex,
      dice.level,
      dice.ascension,
      AUTO_DICE_LEVEL_CONFIG.LEVEL_COST_BASE,
      AUTO_DICE_LEVEL_CONFIG.LEVEL_COST_MULTIPLIER,
      AUTO_DICE_LEVEL_CONFIG.ASCENSION_COST_BASE_MULTIPLIER,
      AUTO_DICE_LEVEL_CONFIG.ASCENSION_COST_MULTIPLIER
    );
  }

  // アップグレード可能性チェック
  canUpgradeManualDice(): boolean {
    return this.gameState.credits >= this.getManualDiceUpgradeCost();
  }

  canUnlockAutoDice(diceIndex: number): boolean {
    const dice = this.gameState.autoDice[diceIndex];
    return dice
      ? this.gameState.credits >= this.getAutoDiceLevelUpCost(diceIndex) && dice.level === 0
      : false;
  }

  canLevelUpAutoDice(diceIndex: number): boolean {
    const dice = this.gameState.autoDice[diceIndex];
    if (!dice || dice.level === 0) return false;

    const maxLevel = calculateMaxLevel(
      dice.ascension,
      AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE,
      AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT
    );

    return (
      dice.level < maxLevel && this.gameState.credits >= this.getAutoDiceLevelUpCost(diceIndex)
    );
  }

  canAscendAutoDice(diceIndex: number): boolean {
    const dice = this.gameState.autoDice[diceIndex];
    if (!dice || dice.level === 0) return false;

    const maxLevel = calculateMaxLevel(
      dice.ascension,
      AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE,
      AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT
    );

    return (
      dice.level >= maxLevel && this.gameState.credits >= this.getAutoDiceAscensionCost(diceIndex)
    );
  }

  // 全アップグレード情報の取得
  getAllUpgradeInfo(): AllUpgradeInfo {
    const manualInfo: ManualUpgradeInfo = {
      cost: this.getManualDiceUpgradeCost(),
      canAfford: this.canUpgradeManualDice(),
      currentCount: this.gameState.manualDice.count,
      currentLevel: this.gameState.manualDice.upgradeLevel,
    };

    const autoInfo: AutoDiceUpgradeInfo[] = this.gameState.autoDice.map((dice, index) => {
      const maxLevel = calculateMaxLevel(
        dice.ascension,
        AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE,
        AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT
      );

      return {
        index,
        faces: dice.faces,
        unlocked: dice.level > 0,
        level: dice.level,
        ascensionLevel: dice.ascension,
        maxLevel: maxLevel,
        levelUpCost: this.getAutoDiceLevelUpCost(index),
        ascensionCost: this.getAutoDiceAscensionCost(index),
        canUnlock: this.canUnlockAutoDice(index),
        canLevelUp: this.canLevelUpAutoDice(index),
        canAscend: this.canAscendAutoDice(index),
      };
    });

    return {
      manual: manualInfo,
      auto: autoInfo,
      totalCredits: this.gameState.credits,
    };
  }

  // === まとめ買い関連のメソッド ===

  // まとめ買い情報の計算
  calculateBulkLevelUpInfo(diceIndex: number, amount: BulkPurchaseAmount): BulkUpgradeInfo {
    const dice = this.gameState.autoDice[diceIndex];
    if (!dice || dice.level === 0) {
      return {
        amount,
        actualCount: 0,
        totalCost: 0,
        canAfford: false,
        willReachMaxLevel: false,
        ascensionsIncluded: 0,
      };
    }

    let targetCount: number;

    if (amount === 'max') {
      targetCount = calculateMaxPurchasableCount(
        diceIndex,
        dice.level,
        dice.ascension,
        this.gameState.credits,
        AUTO_DICE_LEVEL_CONFIG.LEVEL_COST_BASE,
        AUTO_DICE_LEVEL_CONFIG.LEVEL_COST_MULTIPLIER,
        AUTO_DICE_LEVEL_CONFIG.ASCENSION_COST_BASE_MULTIPLIER,
        AUTO_DICE_LEVEL_CONFIG.ASCENSION_COST_MULTIPLIER
      );
    } else if (amount === 'max-no-ascension') {
      targetCount = calculateMaxPurchasableCountNoAscension(
        diceIndex,
        dice.level,
        dice.ascension,
        this.gameState.credits,
        AUTO_DICE_LEVEL_CONFIG.LEVEL_COST_BASE,
        AUTO_DICE_LEVEL_CONFIG.LEVEL_COST_MULTIPLIER,
        AUTO_DICE_LEVEL_CONFIG.ASCENSION_COST_BASE_MULTIPLIER
      );
    } else {
      targetCount = amount;
    }

    if (targetCount === 0) {
      return {
        amount,
        actualCount: 0,
        totalCost: 0,
        canAfford: false,
        willReachMaxLevel: false,
        ascensionsIncluded: 0,
      };
    }

    const bulkInfo = calculateBulkLevelUpCost(
      diceIndex,
      dice.level,
      dice.ascension,
      targetCount,
      AUTO_DICE_LEVEL_CONFIG.LEVEL_COST_BASE,
      AUTO_DICE_LEVEL_CONFIG.LEVEL_COST_MULTIPLIER,
      AUTO_DICE_LEVEL_CONFIG.ASCENSION_COST_BASE_MULTIPLIER,
      AUTO_DICE_LEVEL_CONFIG.ASCENSION_COST_MULTIPLIER
    );

    const currentMaxLevel = calculateMaxLevel(
      dice.ascension,
      AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE,
      AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT
    );

    return {
      amount,
      actualCount: bulkInfo.actualCount,
      totalCost: bulkInfo.totalCost,
      canAfford: this.gameState.credits >= bulkInfo.totalCost,
      willReachMaxLevel: dice.level + bulkInfo.actualCount >= currentMaxLevel,
      ascensionsIncluded: bulkInfo.ascensionsIncluded,
    };
  }

  // まとめ買いでレベルアップ実行
  bulkLevelUpAutoDice(diceIndex: number, amount: BulkPurchaseAmount): boolean {
    const bulkInfo = this.calculateBulkLevelUpInfo(diceIndex, amount);

    if (!bulkInfo.canAfford || bulkInfo.actualCount === 0) {
      return false;
    }

    const dice = this.gameState.autoDice[diceIndex];
    if (!dice || dice.level === 0) {
      return false;
    }

    // クレジットを消費
    this.gameState.credits -= bulkInfo.totalCost;

    // レベル・アセンションを段階的に適用
    for (let i = 0; i < bulkInfo.actualCount; i++) {
      const maxLevel = calculateMaxLevel(
        dice.ascension,
        AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE,
        AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT
      );

      if (dice.level < maxLevel) {
        dice.level++;
        this.gameState.stats.autoDiceUpgrades++;
      } else {
        // アセンション
        dice.level = 1;
        dice.ascension++;
        this.gameState.stats.autoDiceAscensions++;
      }
    }

    console.log(
      `${dice.faces}面ダイス まとめ買い完了！${bulkInfo.actualCount}回アップグレード（アセンション${bulkInfo.ascensionsIncluded}回含む）`
    );
    return true;
  }

  // 購入したアップグレードの総数を取得
  getTotalUpgradesPurchased(): number {
    let total = this.gameState.manualDice.upgradeLevel;

    this.gameState.autoDice.forEach(dice => {
      total += dice.level + dice.ascension; // レベル + アセンション数
    });

    return total;
  }
}
