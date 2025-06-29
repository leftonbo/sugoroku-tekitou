// アップグレードシステム（手動・自動ダイスのアップグレード管理）

import { 
    calculateManualDiceUpgradeCost,
    calculateAutoDiceSpeedUpgradeCost,
    calculateAutoDiceCountUpgradeCost 
} from '../utils/math-utils.js';
import { DICE_CONFIGS, UPGRADE_MULTIPLIERS, MANUAL_DICE_CONFIG } from '../utils/constants.js';
import type { GameState } from '../types/game-state.js';

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
    count: number;
    speedLevel: number;
    countLevel: number;
    unlockCost: number;
    speedUpgradeCost: number;
    countUpgradeCost: number;
    canUnlock: boolean;
    canUpgradeSpeed: boolean;
    canUpgradeCount: boolean;
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
            
            console.log(`手動ダイス個数アップグレード！現在: ${this.gameState.manualDice.count}個`);
            return true;
        }
        return false;
    }

    // 自動ダイス解禁
    unlockAutoDice(diceIndex: number): boolean {
        const cost = this.getAutoDiceUnlockCost(diceIndex);
        const dice = this.gameState.autoDice[diceIndex];
        
        if (dice && this.gameState.credits >= cost && !dice.unlocked) {
            this.gameState.credits -= cost;
            dice.unlocked = true;
            dice.lastRoll = performance.now();
            
            console.log(`${dice.faces}面自動ダイス解禁！`);
            return true;
        }
        return false;
    }

    // 自動ダイス速度アップグレード
    upgradeAutoDiceSpeed(diceIndex: number): boolean {
        const cost = this.getAutoDiceSpeedUpgradeCost(diceIndex);
        const dice = this.gameState.autoDice[diceIndex];
        
        if (dice && this.gameState.credits >= cost && dice.unlocked) {
            this.gameState.credits -= cost;
            dice.speedLevel++;
            
            console.log(`${dice.faces}面ダイス速度アップグレード！レベル: ${dice.speedLevel}`);
            return true;
        }
        return false;
    }

    // 自動ダイス個数アップグレード
    upgradeAutoDiceCount(diceIndex: number): boolean {
        const cost = this.getAutoDiceCountUpgradeCost(diceIndex);
        const dice = this.gameState.autoDice[diceIndex];
        
        if (dice && this.gameState.credits >= cost && dice.unlocked) {
            this.gameState.credits -= cost;
            dice.count++;
            dice.countLevel++;
            
            console.log(`${dice.faces}面ダイス個数アップグレード！現在: ${dice.count}個`);
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

    // 自動ダイス解禁のコスト計算
    getAutoDiceUnlockCost(diceIndex: number): number {
        if (diceIndex < 0 || diceIndex >= DICE_CONFIGS.length) return Infinity;
        return DICE_CONFIGS[diceIndex]!.unlockCost;
    }

    // 自動ダイス速度アップグレードのコスト計算
    getAutoDiceSpeedUpgradeCost(diceIndex: number): number {
        if (diceIndex < 0 || diceIndex >= DICE_CONFIGS.length) return Infinity;
        
        const dice = this.gameState.autoDice[diceIndex];
        const config = DICE_CONFIGS[diceIndex];
        if (!dice || !config) return Infinity;
        
        const baseCost = config.speedBaseCost;
        return calculateAutoDiceSpeedUpgradeCost(
            baseCost,
            dice.speedLevel,
            UPGRADE_MULTIPLIERS.AUTO_SPEED
        );
    }

    // 自動ダイス個数アップグレードのコスト計算
    getAutoDiceCountUpgradeCost(diceIndex: number): number {
        if (diceIndex < 0 || diceIndex >= DICE_CONFIGS.length) return Infinity;
        
        const dice = this.gameState.autoDice[diceIndex];
        const config = DICE_CONFIGS[diceIndex];
        if (!dice || !config) return Infinity;
        
        const baseCost = config.countBaseCost;
        return calculateAutoDiceCountUpgradeCost(
            baseCost,
            dice.countLevel,
            UPGRADE_MULTIPLIERS.AUTO_COUNT
        );
    }

    // アップグレード可能性チェック
    canUpgradeManualDice(): boolean {
        return this.gameState.credits >= this.getManualDiceUpgradeCost();
    }

    canUnlockAutoDice(diceIndex: number): boolean {
        const dice = this.gameState.autoDice[diceIndex];
        return dice ? 
            this.gameState.credits >= this.getAutoDiceUnlockCost(diceIndex) && !dice.unlocked :
            false;
    }

    canUpgradeAutoDiceSpeed(diceIndex: number): boolean {
        const dice = this.gameState.autoDice[diceIndex];
        return dice ? 
            this.gameState.credits >= this.getAutoDiceSpeedUpgradeCost(diceIndex) && dice.unlocked :
            false;
    }

    canUpgradeAutoDiceCount(diceIndex: number): boolean {
        const dice = this.gameState.autoDice[diceIndex];
        return dice ? 
            this.gameState.credits >= this.getAutoDiceCountUpgradeCost(diceIndex) && dice.unlocked :
            false;
    }

    // 全アップグレード情報の取得
    getAllUpgradeInfo(): AllUpgradeInfo {
        const manualInfo: ManualUpgradeInfo = {
            cost: this.getManualDiceUpgradeCost(),
            canAfford: this.canUpgradeManualDice(),
            currentCount: this.gameState.manualDice.count,
            currentLevel: this.gameState.manualDice.upgradeLevel
        };

        const autoInfo: AutoDiceUpgradeInfo[] = this.gameState.autoDice.map((dice, index) => ({
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
    getTotalUpgradesPurchased(): number {
        let total = this.gameState.manualDice.upgradeLevel;
        
        this.gameState.autoDice.forEach(dice => {
            total += dice.speedLevel + dice.countLevel;
            if (dice.unlocked) total += 1; // 解禁もカウント
        });
        
        return total;
    }
}