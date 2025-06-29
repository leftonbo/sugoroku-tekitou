// サイコロシステム（手動・自動サイコロ関連機能）

import { calculateAutoDiceInterval } from '../utils/math-utils.js';
import { GAME_CONFIG, MANUAL_DICE_CONFIG } from '../utils/constants.js';

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
            const roll = Math.floor(Math.random() * MANUAL_DICE_CONFIG.BASE_FACES) + 1;
            this.manualDiceResults.push(roll);
            totalRoll += roll;
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
            totalRoll += Math.floor(Math.random() * dice.faces) + 1;
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
}