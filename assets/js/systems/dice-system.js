// サイコロシステム（手動・自動サイコロ関連機能）

import { calculateAutoDiceInterval } from '../utils/math-utils.js';
import { GAME_CONFIG, MANUAL_DICE_CONFIG, BURDEN_CONFIG } from '../utils/constants.js';

export class DiceSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.manualDiceResults = [];  // 手動ダイスの結果表示用
    }

    // 手動ダイスを振る
    rollManualDice() {
        const diceCount = this.gameState.manualDice.count;
        let totalRoll = 0;
        this.manualDiceResults = [];
        
        // 6面ダイスを指定個数振る
        for (let i = 0; i < diceCount; i++) {
            let roll = Math.floor(Math.random() * MANUAL_DICE_CONFIG.BASE_FACES) + 1;
            
            // 負荷による出目補正を適用
            roll = this.applyBurdenEffect(roll);
            
            this.manualDiceResults.push(roll);
            totalRoll += roll;
        }
        
        // 負荷レベル3による総計半減
        if (this.getBurdenLevel() >= 3) {
            totalRoll = Math.floor(totalRoll / 2);
        }
        
        // 統計を更新
        this.gameState.stats.totalDiceRolls++;
        
        console.log(`手動ダイス: ${this.manualDiceResults.join(', ')} = ${totalRoll}`);
        
        return {
            total: totalRoll,
            results: [...this.manualDiceResults],
            quality: this.calculateRollQuality(totalRoll, diceCount)
        };
    }

    // 手動ダイスの結果品質を計算
    calculateRollQuality(total, diceCount) {
        const maxPossible = diceCount * MANUAL_DICE_CONFIG.BASE_FACES;
        const minPossible = diceCount;
        return (total - minPossible) / (maxPossible - minPossible);
    }

    // 自動ダイスを振る（種類別）
    rollAutoDice(diceIndex) {
        const dice = this.gameState.autoDice[diceIndex];
        if (!dice.unlocked) return 0;
        
        let totalRoll = 0;
        
        // 指定個数分振る
        for (let i = 0; i < dice.count; i++) {
            let roll = Math.floor(Math.random() * dice.faces) + 1;
            
            // 負荷による出目補正を適用
            roll = this.applyBurdenEffect(roll);
            
            totalRoll += roll;
        }
        
        // 負荷レベル3による総計半減
        if (this.getBurdenLevel() >= 3) {
            totalRoll = Math.floor(totalRoll / 2);
        }
        
        // 統計を更新
        this.gameState.stats.totalDiceRolls++;
        
        // lastRollを更新
        dice.lastRoll = performance.now();
        
        console.log(`自動${dice.faces}面ダイス: ${totalRoll}`);
        
        return totalRoll;
    }

    // 自動ダイスの間隔計算
    getAutoDiceInterval(diceIndex) {
        const dice = this.gameState.autoDice[diceIndex];
        return calculateAutoDiceInterval(
            dice.baseInterval, 
            dice.speedLevel, 
            GAME_CONFIG.MAX_SPEED_MULTIPLIER
        );
    }

    // 自動ダイスのタイマーチェック
    checkAutoDiceTimers(currentTime) {
        const rolledDice = [];
        
        this.gameState.autoDice.forEach((dice, index) => {
            if (!dice.unlocked) return;
            
            const interval = this.getAutoDiceInterval(index);
            if (currentTime - dice.lastRoll >= interval) {
                const rollResult = this.rollAutoDice(index);
                if (rollResult > 0) {
                    rolledDice.push({
                        index,
                        faces: dice.faces,
                        result: rollResult
                    });
                }
            }
        });
        
        return rolledDice;
    }

    // 自動ダイスの初期化（ゲーム開始時）
    initializeAutoDiceTimers(currentTime) {
        this.gameState.autoDice.forEach(dice => {
            // セーブデータ読み込み時に古いperformance.now()タイムスタンプが残っているため
            // すべてのダイスのタイマーを現在時刻でリセット
            dice.lastRoll = currentTime;
        });
    }

    // 手動ダイス結果のゲッター
    getManualDiceResults() {
        return [...this.manualDiceResults];
    }

    // 自動ダイスの解禁状態チェック
    isAutoDiceUnlocked(diceIndex) {
        return this.gameState.autoDice[diceIndex]?.unlocked || false;
    }

    // 自動ダイスの情報取得
    getAutoDiceInfo(diceIndex) {
        const dice = this.gameState.autoDice[diceIndex];
        if (!dice) return null;

        const interval = this.getAutoDiceInterval(diceIndex);
        const rollsPerMinute = Math.round(60000 / interval);
        
        return {
            faces: dice.faces,
            count: dice.count,
            unlocked: dice.unlocked,
            speedLevel: dice.speedLevel,
            countLevel: dice.countLevel,
            interval: interval,
            rollsPerMinute: rollsPerMinute,
            lastRoll: dice.lastRoll
        };
    }

    // 全自動ダイスの情報取得
    getAllAutoDiceInfo() {
        return this.gameState.autoDice.map((_, index) => this.getAutoDiceInfo(index));
    }

    // 手動ダイス情報取得
    getManualDiceInfo() {
        return {
            count: this.gameState.manualDice.count,
            upgradeLevel: this.gameState.manualDice.upgradeLevel,
            faces: MANUAL_DICE_CONFIG.BASE_FACES
        };
    }

    // 負荷レベルの計算
    getBurdenLevel() {
        const level = this.gameState.level;
        
        if (level >= BURDEN_CONFIG.LEVEL_3_START) return 3;
        if (level >= BURDEN_CONFIG.LEVEL_2_START) return 2;
        if (level >= BURDEN_CONFIG.LEVEL_1_START) return 1;
        
        return 0;
    }

    // 負荷による出目補正の適用
    applyBurdenEffect(roll) {
        const burdenLevel = this.getBurdenLevel();
        
        if (burdenLevel === 0) {
            return roll;
        }
        
        // 負荷レベル1: -1、負荷レベル2: -2、負荷レベル3: -2（最小1）
        let adjustedRoll = roll;
        
        if (burdenLevel >= 1) adjustedRoll -= 1;
        if (burdenLevel >= 2) adjustedRoll -= 1;
        
        // 出目は最小1
        return Math.max(1, adjustedRoll);
    }

    // 負荷レベルの詳細情報を取得
    getBurdenInfo() {
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
    getNextBurdenLevelInfo(currentLevel) {
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