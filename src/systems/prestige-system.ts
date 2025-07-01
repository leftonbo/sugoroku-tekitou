// プレステージ・転生システム

import { formatNumber } from '../utils/math-utils.js';
import { BOARD_CONFIG } from '../utils/constants.js';
import { resetGameStateForPrestige } from '../data/game-state.js';
import type { GameState } from '../types/game-state.js';

// プレステージ統計の型定義
interface BestRunStats {
    credits: number;
    distance: number;
    laps: number;
    level: number;
}

interface PrestigeStats {
    totalRuns: number;
    totalCreditsEarned: number;
    totalDistanceTraveled: number;
    totalLapsCompleted: number;
    bestSingleRun: BestRunStats;
}

interface GameStats {
    totalCredits: number;
    totalDistance: number;
    completedLaps: number;
    currentPosition: number;
    currentLevel: number;
    diceRolls: number;
    creditsEarned: number;
}

interface PrestigeResult {
    success: boolean;
    reason?: string;
    earnedPrestige?: number;
    newAvailable?: number;
    oldStats?: GameStats;
}

interface PrestigeInfo {
    earned: number;
    available: number;
    canPrestige: boolean;
    rebirthCount: number;
    prestigeStats: PrestigeStats | null;
    historical?: PrestigeStats;
}

interface DetailedStats {
    current: {
        diceRolls: number;
        totalMoves: number;
        creditsEarned: number;
        rebirths: number;
        totalPrestigePoints: number;
        currentLevel: number;
        currentPosition: number;
        currentCredits: number;
    };
    prestige: PrestigeInfo;
}

// プレステージアップグレード情報
interface PrestigeUpgradeInfo {
    cost: number;
    canAfford: boolean;
    maxLevel?: number | undefined;
}

// GameStateの拡張（prestigeStats追加）
interface ExtendedGameState extends GameState {
    prestigeStats?: PrestigeStats;
}

export class PrestigeSystem {
    private gameState: ExtendedGameState;

    constructor(gameState: GameState) {
        this.gameState = gameState as ExtendedGameState;
    }

    // プレステージ（転生）の実行
    prestige(): PrestigeResult {
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
    private buildPrestigeConfirmText(): string {
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
    private executePrestige(): PrestigeResult {
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
    private showPrestigeResult(result: PrestigeResult): void {
        if (!result.success) return;
        
        const resultText = `転生しました！\n\n` +
            `獲得プレステージポイント: ${result.earnedPrestige}\n` +
            `使用可能PP: ${result.newAvailable}\n` +
            `新しい冒険が始まります！`;
        alert(resultText);
    }

    // ゲーム統計の取得
    private getGameStats(): GameStats {
        const completedLaps = Math.floor(this.gameState.stats.totalMoves / BOARD_CONFIG.TOTAL_CELLS);
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
    private updatePrestigeStats(stats: GameStats): void {
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
    canPrestige(): boolean {
        return this.gameState.prestigePoints.earned > 0;
    }

    // プレステージポイント関連情報
    getPrestigeInfo(): PrestigeInfo {
        const info: PrestigeInfo = {
            earned: this.gameState.prestigePoints.earned,
            available: this.gameState.prestigePoints.available,
            canPrestige: this.canPrestige(),
            rebirthCount: this.gameState.rebirthCount,
            prestigeStats: this.gameState.prestigeStats || null
        };

        if (this.gameState.prestigeStats) {
            info.historical = this.gameState.prestigeStats;
        }

        return info;
    }

    // 統計情報の取得
    getDetailedStats(): DetailedStats {
        const baseStats: DetailedStats = {
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

        return baseStats;
    }
    
    // プレステージアップグレードのコスト計算
    getPrestigeUpgradeCost(upgradeType: 'creditMultiplier' | 'diceSpeedBoost' | 'bonusChance' | 'bonusMultiplier'): number {
        const currentLevel = this.gameState.prestigeUpgrades[upgradeType].level;
        
        if (upgradeType === 'creditMultiplier') {
            // クレジット倍率: 5 + (レベル * 10) PP
            return 5 + (currentLevel * 10);
        } else if (upgradeType === 'diceSpeedBoost') {
            // 自動ダイス速度: 10 + (レベル * 15) PP
            return 10 + (currentLevel * 15);
        } else if (upgradeType === 'bonusChance') {
            // ボーナス確率: 8 + (レベル * 12) PP
            return 8 + (currentLevel * 12);
        } else if (upgradeType === 'bonusMultiplier') {
            // ボーナス倍率: 15 + (レベル * 20) PP
            return 15 + (currentLevel * 20);
        }
        
        return 0;
    }
    
    // プレステージアップグレード情報の取得
    getPrestigeUpgradeInfo(upgradeType: 'creditMultiplier' | 'diceSpeedBoost' | 'bonusChance' | 'bonusMultiplier'): PrestigeUpgradeInfo {
        const upgrade = this.gameState.prestigeUpgrades[upgradeType];
        const cost = this.getPrestigeUpgradeCost(upgradeType);
        
        return {
            cost,
            canAfford: this.gameState.prestigePoints.available >= cost,
            maxLevel: upgrade.maxLevel
        };
    }
    
    // プレステージアップグレードの購入
    buyPrestigeUpgrade(upgradeType: 'creditMultiplier' | 'diceSpeedBoost' | 'bonusChance' | 'bonusMultiplier'): boolean {
        const upgrade = this.gameState.prestigeUpgrades[upgradeType];
        const cost = this.getPrestigeUpgradeCost(upgradeType);
        
        // 最大レベルチェック
        if (upgrade.maxLevel && upgrade.level >= upgrade.maxLevel) {
            return false;
        }
        
        // コストチェック
        if (this.gameState.prestigePoints.available < cost) {
            return false;
        }
        
        // アップグレード実行
        this.gameState.prestigePoints.available -= cost;
        upgrade.level++;
        
        console.log(`${upgradeType} をレベル ${upgrade.level} にアップグレード（コスト: ${cost}PP）`);
        return true;
    }
    
    // クレジット獲得倍率の計算
    getCreditMultiplier(): number {
        const level = this.gameState.prestigeUpgrades.creditMultiplier.level;
        return 1 + (level * 0.5); // レベル1で1.5倍、レベル2で2倍...
    }
    
    // 自動ダイス速度ボーナスの計算
    getDiceSpeedMultiplier(): number {
        const level = this.gameState.prestigeUpgrades.diceSpeedBoost.level;
        const maxLevel = this.gameState.prestigeUpgrades.diceSpeedBoost.maxLevel || 40;
        const cappedLevel = Math.min(level, maxLevel);
        return 1 + (cappedLevel * 0.1); // レベル1で1.1倍、レベル40で5倍（上限4倍+基本1倍）
    }
}