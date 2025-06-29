// プレステージ・転生システム

import { formatNumber } from '../utils/math-utils.js';
import { resetGameStateForPrestige } from '../data/game-state.js';

export class PrestigeSystem {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // プレステージ（転生）の実行
    prestige() {
        if (this.gameState.prestigePoints.earned === 0) {
            return { success: false, reason: 'no_points' };
        }
        
        const confirmText = this.buildPrestigeConfirmText();
        const confirmed = confirm(confirmText);
        
        if (confirmed) {
            const result = this.executePrestige();
            this.showPrestigeResult(result);
            return result;
        }
        
        return { success: false, reason: 'cancelled' };
    }

    // 転生確認テキスト生成
    buildPrestigeConfirmText() {
        return `転生しますか？\n\n` +
            `現在の統計:\n` +
            `・獲得予定プレステージポイント: ${this.gameState.prestigePoints.earned}\n` +
            `・総クレジット獲得: ${formatNumber(this.gameState.credits)}\n` +
            `・現在レベル: ${this.gameState.level}\n` +
            `・サイコロ振り回数: ${this.gameState.stats.totalDiceRolls}\n\n` +
            `注意: 現在の進行状況はリセットされますが、\n` +
            `プレステージポイントは使用可能になります。`;
    }

    // 転生の実行
    executePrestige() {
        // 現在の統計を保存
        const oldStats = this.getGameStats();
        
        // プレステージポイントを使用可能に移動
        const earnedPrestige = this.gameState.prestigePoints.earned;
        this.gameState.prestigePoints.available += earnedPrestige;
        
        // 転生統計を更新
        this.gameState.rebirthCount++;
        this.gameState.stats.totalRebirths++;
        
        // プレステージ統計を更新
        this.updatePrestigeStats(oldStats);
        
        // ゲーム状態をリセット
        const newState = resetGameStateForPrestige(this.gameState);
        Object.assign(this.gameState, newState);
        
        console.log(`転生完了！プレステージポイント: ${earnedPrestige} 獲得`);
        
        return {
            success: true,
            earnedPrestige,
            newAvailable: this.gameState.prestigePoints.available,
            oldStats
        };
    }

    // 転生結果の表示
    showPrestigeResult(result) {
        if (!result.success) return;
        
        const resultText = `転生しました！\n\n` +
            `獲得プレステージポイント: ${result.earnedPrestige}\n` +
            `使用可能PP: ${result.newAvailable}\n` +
            `新しい冒険が始まります！`;
        alert(resultText);
    }

    // ゲーム統計の取得
    getGameStats() {
        const completedLaps = Math.floor(this.gameState.stats.totalMoves / 100);
        return {
            totalCredits: this.gameState.credits,
            totalDistance: this.gameState.stats.totalMoves,
            completedLaps: completedLaps,
            currentPosition: this.gameState.position,
            currentLevel: this.gameState.level,
            diceRolls: this.gameState.stats.totalDiceRolls,
            creditsEarned: this.gameState.stats.totalCreditsEarned
        };
    }

    // プレステージ統計の更新
    updatePrestigeStats(stats) {
        if (!this.gameState.prestigeStats) {
            this.gameState.prestigeStats = {
                totalRuns: 0,
                totalCreditsEarned: 0,
                totalDistanceTraveled: 0,
                totalLapsCompleted: 0,
                bestSingleRun: {
                    credits: 0,
                    distance: 0,
                    laps: 0,
                    level: 1
                }
            };
        }
        
        const prestigeStats = this.gameState.prestigeStats;
        
        // 総計を更新
        prestigeStats.totalRuns++;
        prestigeStats.totalCreditsEarned += stats.totalCredits;
        prestigeStats.totalDistanceTraveled += stats.totalDistance;
        prestigeStats.totalLapsCompleted += stats.completedLaps;
        
        // 最高記録を更新
        if (stats.totalCredits > prestigeStats.bestSingleRun.credits) {
            prestigeStats.bestSingleRun.credits = stats.totalCredits;
        }
        if (stats.totalDistance > prestigeStats.bestSingleRun.distance) {
            prestigeStats.bestSingleRun.distance = stats.totalDistance;
        }
        if (stats.completedLaps > prestigeStats.bestSingleRun.laps) {
            prestigeStats.bestSingleRun.laps = stats.completedLaps;
        }
        if (stats.currentLevel > prestigeStats.bestSingleRun.level) {
            prestigeStats.bestSingleRun.level = stats.currentLevel;
        }
    }

    // 転生可能性チェック
    canPrestige() {
        return this.gameState.prestigePoints.earned > 0;
    }

    // プレステージポイント関連情報
    getPrestigeInfo() {
        return {
            earned: this.gameState.prestigePoints.earned,
            available: this.gameState.prestigePoints.available,
            canPrestige: this.canPrestige(),
            rebirthCount: this.gameState.rebirthCount,
            prestigeStats: this.gameState.prestigeStats || null
        };
    }

    // 統計情報の取得
    getDetailedStats() {
        const baseStats = {
            // 現在のゲーム統計
            current: {
                diceRolls: this.gameState.stats.totalDiceRolls,
                totalMoves: this.gameState.stats.totalMoves,
                creditsEarned: this.gameState.stats.totalCreditsEarned,
                rebirths: this.gameState.stats.totalRebirths,
                totalPrestigePoints: this.gameState.stats.totalPrestigePoints,
                currentLevel: this.gameState.level,
                currentPosition: this.gameState.position,
                currentCredits: this.gameState.credits
            },
            
            // プレステージ関連
            prestige: this.getPrestigeInfo()
        };

        // プレステージ統計が存在する場合は追加
        if (this.gameState.prestigeStats) {
            baseStats.prestige.historical = this.gameState.prestigeStats;
        }

        return baseStats;
    }
}