// サイコロシステム（手動・自動サイコロ関連機能）

import { 
    calculateDiceSpeedFromLevel, 
    calculateDiceCountFromAscension 
} from '../utils/math-utils.js';
import { MANUAL_DICE_CONFIG, BURDEN_CONFIG, AUTO_DICE_LEVEL_CONFIG } from '../utils/constants.js';
import type { GameState } from '../types/game-state.js';
import type { PrestigeSystem } from './prestige-system.js';

// ダイス結果の型定義
interface ManualDiceResult {
    total: number;
    results: number[];
    quality: number;
}

interface AutoDiceRoll {
    index: number;
    faces: number;
    result: number;
}

interface AutoDiceInfo {
    faces: number;
    count: number;
    unlocked: boolean;
    level: number;
    ascensionLevel: number;
    maxLevel: number;
    interval: number;
    rollsPerMinute: number;
    progress: number;
    canAscend: boolean;
}

interface ManualDiceInfo {
    count: number;
    upgradeLevel: number;
    faces: number;
}

interface BurdenInfo {
    level: number;
    diceReduction: number;
    totalHalving: boolean;
    nextBurdenLevel: NextBurdenLevelInfo | null;
}

interface NextBurdenLevelInfo {
    level: number;
    levelRequired: number;
    levelsRemaining: number;
}

export class DiceSystem {
    private gameState: GameState;
    private prestigeSystem: PrestigeSystem;
    private manualDiceResults: number[];

    constructor(gameState: GameState, prestigeSystem: PrestigeSystem) {
        this.gameState = gameState;
        this.prestigeSystem = prestigeSystem;
        this.manualDiceResults = [];  // 手動ダイスの結果表示用
    }

    // 手動ダイスを振る
    rollManualDice(): ManualDiceResult {
        const diceCount = this.gameState.manualDice.count;
        let totalRoll = 0;
        this.manualDiceResults = [];
        
        // 6面ダイスを指定個数振る
        for (let i = 0; i < diceCount; i++) {
            let roll = Math.floor(Math.random() * MANUAL_DICE_CONFIG.BASE_FACES) + 1;
            
            // 負荷による出目補正を適用
            roll = this.applyBurdenEffect(roll, MANUAL_DICE_CONFIG.BASE_FACES);
            
            this.manualDiceResults.push(roll);
            totalRoll += roll;
        }
        
        // 負荷レベル3による総計半減
        if (this.getBurdenLevel() >= 3) {
            totalRoll = Math.floor(totalRoll / 2);
        }
        
        // 統計を更新
        this.gameState.stats.totalDiceRolls++;
        this.gameState.stats.manualDiceRolls++;
        
        console.log(`手動ダイス: ${this.manualDiceResults.join(', ')} = ${totalRoll}`);
        
        return {
            total: totalRoll,
            results: [...this.manualDiceResults],
            quality: this.calculateRollQuality(totalRoll, diceCount)
        };
    }

    // 手動ダイスの結果品質を計算
    private calculateRollQuality(total: number, diceCount: number): number {
        const maxPossible = diceCount * MANUAL_DICE_CONFIG.BASE_FACES;
        const minPossible = diceCount;
        return (total - minPossible) / (maxPossible - minPossible);
    }

    // 自動ダイスを振る（種類別）
    rollAutoDice(diceIndex: number): number {
        const dice = this.gameState.autoDice[diceIndex];
        if (!dice || dice.level === 0) return 0;
        
        let totalRoll = 0;
        
        // ダイスの個数を計算（アセンションレベルベース）
        const diceCount = calculateDiceCountFromAscension(
            dice.ascension, 
            AUTO_DICE_LEVEL_CONFIG.DICE_COUNT_BASE, 
            AUTO_DICE_LEVEL_CONFIG.DICE_COUNT_MULTIPLIER
        );
        
        // 指定個数分振る
        for (let i = 0; i < diceCount; i++) {
            let roll = Math.floor(Math.random() * dice.faces) + 1;
            
            // 負荷による出目補正を適用
            roll = this.applyBurdenEffect(roll, dice.faces);
            
            totalRoll += roll;
        }
        
        // 負荷レベル3による総計半減
        if (this.getBurdenLevel() >= 3) {
            totalRoll = Math.floor(totalRoll / 2);
        }
        
        // 統計を更新
        this.gameState.stats.totalDiceRolls++;
        this.gameState.stats.autoDiceRolls++;
        
        // lastRollを更新（Tick-based）
        // Note: この時点ではcurrentTickは利用できないため、GameLoopから設定される
        
        console.log(`自動${dice.faces}面ダイス: ${totalRoll}`);
        
        return totalRoll;
    }

    // 自動ダイスの間隔計算
    getAutoDiceInterval(diceIndex: number): number {
        const dice = this.gameState.autoDice[diceIndex];
        if (!dice) return 0;
        
        // ダイスレベルによる基本間隔計算
        const baseInterval = calculateDiceSpeedFromLevel(
            dice.level,
            dice.baseInterval,
            AUTO_DICE_LEVEL_CONFIG.SPEED_MULTIPLIER_MAX
        );
        
        // プレステージ速度倍率を適用
        const prestigeSpeedMultiplier = this.prestigeSystem.getDiceSpeedMultiplier();
        return baseInterval / prestigeSpeedMultiplier;
    }

    // 自動ダイスのタイマーチェック（Tick-based）
    checkAutoDiceTimers(): AutoDiceRoll[] {
        const rolledDice: AutoDiceRoll[] = [];
        
        this.gameState.autoDice.forEach((dice, index) => {
            if (dice.level === 0) return; // 未解禁
            
            const interval = this.getAutoDiceInterval(index);
            dice.progress += 60.0 / interval;
            while (dice.progress >= 60.0) {
                dice.progress -= 60.0;

                const rollResult = this.rollAutoDice(index);
                rolledDice.push({
                    index,
                    faces: dice.faces,
                    result: rollResult
                });
            }
        });
        
        return rolledDice;
    }

    // 手動ダイス結果のゲッター
    getManualDiceResults(): number[] {
        return [...this.manualDiceResults];
    }

    // 自動ダイスの解禁状態チェック
    isAutoDiceUnlocked(diceIndex: number): boolean {
        return (this.gameState.autoDice[diceIndex]?.level || 0) > 0;
    }

    // 自動ダイスの情報取得
    getAutoDiceInfo(diceIndex: number): AutoDiceInfo | null {
        const dice = this.gameState.autoDice[diceIndex];
        if (!dice) return null;

        const interval = this.getAutoDiceInterval(diceIndex);
        const rollsPerMinute = interval > 0 ? Math.round(3600 / interval) : 0;  // 60fps × 60sec = 3600 ticks/min
        const maxLevel = AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE + 
                        (dice.ascension * AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT);
        const diceCount = calculateDiceCountFromAscension(
            dice.ascension, 
            AUTO_DICE_LEVEL_CONFIG.DICE_COUNT_BASE, 
            AUTO_DICE_LEVEL_CONFIG.DICE_COUNT_MULTIPLIER
        );
        
        return {
            faces: dice.faces,
            count: diceCount,
            unlocked: dice.level > 0,
            level: dice.level,
            ascensionLevel: dice.ascension,
            maxLevel: maxLevel,
            interval: interval,
            rollsPerMinute: rollsPerMinute,
            progress: dice.progress,
            canAscend: dice.level >= maxLevel
        };
    }

    // 全自動ダイスの情報取得
    getAllAutoDiceInfo(): (AutoDiceInfo | null)[] {
        return this.gameState.autoDice.map((_, index) => this.getAutoDiceInfo(index));
    }

    // 手動ダイス情報取得
    getManualDiceInfo(): ManualDiceInfo {
        return {
            count: this.gameState.manualDice.count,
            upgradeLevel: this.gameState.manualDice.upgradeLevel,
            faces: MANUAL_DICE_CONFIG.BASE_FACES
        };
    }

    // 負荷レベルの計算
    getBurdenLevel(): number {
        const level = this.gameState.level;
        
        if (level >= BURDEN_CONFIG.LEVEL_3_START) return 3;
        if (level >= BURDEN_CONFIG.LEVEL_2_START) return 2;
        if (level >= BURDEN_CONFIG.LEVEL_1_START) return 1;
        
        return 0;
    }

    // 負荷による出目補正の適用
    private applyBurdenEffect(roll: number, faces: number): number {
        const burdenLevel = this.getBurdenLevel();
        
        if (burdenLevel === 0) {
            return roll;
        }
        
        // 負荷レベル1: -1、負荷レベル2: -2
        let adjustedRoll = roll;
        
        if (burdenLevel >= 1) adjustedRoll -= 1;
        if (burdenLevel >= 2) adjustedRoll -= 1;
        
        // 正数の場合はそのまま
        if (adjustedRoll >= 1) {
            return adjustedRoll;
        }
        
        // adjustedRoll が0以下になる場合
        // 出目が face の半分未満の出目は 0, それ以外は 1 以上に調整
        // (出目ペナルティの上限は 0/1 の 2 面ダイスと同じ効果になるまで)
        return roll < faces / 2 ? 0 : 1;
    }

    // 負荷レベルの詳細情報を取得
    getBurdenInfo(): BurdenInfo {
        const level = this.gameState.level;
        const burdenLevel = this.getBurdenLevel();
        
        return {
            level: burdenLevel,
            diceReduction: burdenLevel >= 1 ? Math.min(burdenLevel, 2) : 0,
            totalHalving: burdenLevel >= 3,
            nextBurdenLevel: this.getNextBurdenLevelInfo(level)
        };
    }

    // 次の負荷レベル情報を取得
    private getNextBurdenLevelInfo(currentLevel: number): NextBurdenLevelInfo | null {
        if (currentLevel < BURDEN_CONFIG.LEVEL_1_START) {
            return {
                level: 1,
                levelRequired: BURDEN_CONFIG.LEVEL_1_START,
                levelsRemaining: BURDEN_CONFIG.LEVEL_1_START - currentLevel
            };
        } else if (currentLevel < BURDEN_CONFIG.LEVEL_2_START) {
            return {
                level: 2,
                levelRequired: BURDEN_CONFIG.LEVEL_2_START,
                levelsRemaining: BURDEN_CONFIG.LEVEL_2_START - currentLevel
            };
        } else if (currentLevel < BURDEN_CONFIG.LEVEL_3_START) {
            return {
                level: 3,
                levelRequired: BURDEN_CONFIG.LEVEL_3_START,
                levelsRemaining: BURDEN_CONFIG.LEVEL_3_START - currentLevel
            };
        }
        
        return null; // 最大負荷レベルに到達
    }
}