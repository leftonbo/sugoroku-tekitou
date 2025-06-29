// アップグレードシステム（手動・自動ダイスのアップグレード管理）

import { 
    calculateManualDiceUpgradeCost,
    calculateAutoDiceSpeedUpgradeCost,
    calculateAutoDiceCountUpgradeCost 
} from '../utils/math-utils.js';
import { DICE_CONFIGS, UPGRADE_MULTIPLIERS, MANUAL_DICE_CONFIG } from '../utils/constants.js';

export class UpgradeSystem {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // 手動ダイス個数アップグレード
    upgradeManualDiceCount() {
        const cost = this.getManualDiceUpgradeCost();
        
        if (this.gameState.credits >= cost) {
            this.gameState.credits -= cost;
            this.gameState.manualDice.count++;
            this.gameState.manualDice.upgradeLevel++;
            
            console.log(`手動ダイス個数アップグレード！現在: ${this.gameState.manualDice.count}個`);
            return true;
        }
        return false;
    }

    // 自動ダイス解禁
    unlockAutoDice(diceIndex) {
        const cost = this.getAutoDiceUnlockCost(diceIndex);
        
        if (this.gameState.credits >= cost && !this.gameState.autoDice[diceIndex].unlocked) {
            this.gameState.credits -= cost;
            this.gameState.autoDice[diceIndex].unlocked = true;
            this.gameState.autoDice[diceIndex].lastRoll = performance.now();
            
            const faces = this.gameState.autoDice[diceIndex].faces;
            console.log(`${faces}面自動ダイス解禁！`);
            return true;
        }
        return false;
    }

    // 自動ダイス速度アップグレード
    upgradeAutoDiceSpeed(diceIndex) {
        const cost = this.getAutoDiceSpeedUpgradeCost(diceIndex);
        
        if (this.gameState.credits >= cost && this.gameState.autoDice[diceIndex].unlocked) {
            this.gameState.credits -= cost;
            this.gameState.autoDice[diceIndex].speedLevel++;
            
            const faces = this.gameState.autoDice[diceIndex].faces;
            const level = this.gameState.autoDice[diceIndex].speedLevel;
            console.log(`${faces}面ダイス速度アップグレード！レベル: ${level}`);
            return true;
        }
        return false;
    }

    // 自動ダイス個数アップグレード
    upgradeAutoDiceCount(diceIndex) {
        const cost = this.getAutoDiceCountUpgradeCost(diceIndex);
        
        if (this.gameState.credits >= cost && this.gameState.autoDice[diceIndex].unlocked) {
            this.gameState.credits -= cost;
            this.gameState.autoDice[diceIndex].count++;
            this.gameState.autoDice[diceIndex].countLevel++;
            
            const faces = this.gameState.autoDice[diceIndex].faces;
            const count = this.gameState.autoDice[diceIndex].count;
            console.log(`${faces}面ダイス個数アップグレード！現在: ${count}個`);
            return true;
        }
        return false;
    }

    // 手動ダイスアップグレードのコスト計算
    getManualDiceUpgradeCost() {
        const level = this.gameState.manualDice.upgradeLevel;
        return calculateManualDiceUpgradeCost(
            level,
            MANUAL_DICE_CONFIG.BASE_UPGRADE_COST,
            UPGRADE_MULTIPLIERS.MANUAL_DICE
        );
    }

    // 自動ダイス解禁のコスト計算
    getAutoDiceUnlockCost(diceIndex) {
        if (diceIndex < 0 || diceIndex >= DICE_CONFIGS.length) return Infinity;
        return DICE_CONFIGS[diceIndex].unlockCost;
    }

    // 自動ダイス速度アップグレードのコスト計算
    getAutoDiceSpeedUpgradeCost(diceIndex) {
        if (diceIndex < 0 || diceIndex >= DICE_CONFIGS.length) return Infinity;
        
        const dice = this.gameState.autoDice[diceIndex];
        const baseCost = DICE_CONFIGS[diceIndex].speedBaseCost;
        return calculateAutoDiceSpeedUpgradeCost(
            baseCost,
            dice.speedLevel,
            UPGRADE_MULTIPLIERS.AUTO_SPEED
        );
    }

    // 自動ダイス個数アップグレードのコスト計算
    getAutoDiceCountUpgradeCost(diceIndex) {
        if (diceIndex < 0 || diceIndex >= DICE_CONFIGS.length) return Infinity;
        
        const dice = this.gameState.autoDice[diceIndex];
        const baseCost = DICE_CONFIGS[diceIndex].countBaseCost;
        return calculateAutoDiceCountUpgradeCost(
            baseCost,
            dice.countLevel,
            UPGRADE_MULTIPLIERS.AUTO_COUNT
        );
    }

    // アップグレード可能性チェック
    canUpgradeManualDice() {
        return this.gameState.credits >= this.getManualDiceUpgradeCost();
    }

    canUnlockAutoDice(diceIndex) {
        return this.gameState.credits >= this.getAutoDiceUnlockCost(diceIndex) && 
               !this.gameState.autoDice[diceIndex].unlocked;
    }

    canUpgradeAutoDiceSpeed(diceIndex) {
        return this.gameState.credits >= this.getAutoDiceSpeedUpgradeCost(diceIndex) && 
               this.gameState.autoDice[diceIndex].unlocked;
    }

    canUpgradeAutoDiceCount(diceIndex) {
        return this.gameState.credits >= this.getAutoDiceCountUpgradeCost(diceIndex) && 
               this.gameState.autoDice[diceIndex].unlocked;
    }

    // 全アップグレード情報の取得
    getAllUpgradeInfo() {
        const manualInfo = {
            cost: this.getManualDiceUpgradeCost(),
            canAfford: this.canUpgradeManualDice(),
            currentCount: this.gameState.manualDice.count,
            currentLevel: this.gameState.manualDice.upgradeLevel
        };

        const autoInfo = this.gameState.autoDice.map((dice, index) => ({
            index,
            faces: dice.faces,
            unlocked: dice.unlocked,
            count: dice.count,
            speedLevel: dice.speedLevel,
            countLevel: dice.countLevel,
            unlockCost: this.getAutoDiceUnlockCost(index),
            speedUpgradeCost: this.getAutoDiceSpeedUpgradeCost(index),
            countUpgradeCost: this.getAutoDiceCountUpgradeCost(index),
            canUnlock: this.canUnlockAutoDice(index),
            canUpgradeSpeed: this.canUpgradeAutoDiceSpeed(index),
            canUpgradeCount: this.canUpgradeAutoDiceCount(index)
        }));

        return {
            manual: manualInfo,
            auto: autoInfo,
            totalCredits: this.gameState.credits
        };
    }

    // 購入したアップグレードの総数を取得
    getTotalUpgradesPurchased() {
        let total = this.gameState.manualDice.upgradeLevel;
        
        this.gameState.autoDice.forEach(dice => {
            total += dice.speedLevel + dice.countLevel;
            if (dice.unlocked) total += 1; // 解禁もカウント
        });
        
        return total;
    }
}