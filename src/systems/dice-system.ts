/**
 * サイコロシステム（手動・自動サイコロ関連機能）
 * 
 * このクラスは以下の機能を提供します：
 * - 手動ダイス：プレイヤーが手動で振る6面ダイス（複数個対応）
 * - 自動ダイス：6種類の自動ダイス（4/6/8/10/12/20面）の管理
 * - 負荷システム：レベル上昇に伴うダイス出目の減少効果
 * - タイマー管理：各自動ダイスの実行間隔制御
 * - 統計追跡：ダイス振り回数の記録
 * 
 * @example
 * const diceSystem = new DiceSystem(gameState, prestigeSystem);
 * const result = diceSystem.rollManualDice();
 * const autoDiceRolls = diceSystem.checkAutoDiceTimers();
 */

import { 
    calculateDiceSpeedFromLevel, 
    calculateDiceCountFromAscension 
} from '../utils/math-utils.js';
import { MANUAL_DICE_CONFIG, BURDEN_CONFIG, AUTO_DICE_LEVEL_CONFIG } from '../utils/constants.js';
import type { GameState } from '../types/game-state.js';
import type { PrestigeSystem } from './prestige-system.js';

// ダイス結果の型定義

/** 手動ダイスの振り結果 */
interface ManualDiceResult {
    /** 出目の合計値（負荷効果適用後） */
    total: number;
    /** 各ダイスの出目配列 */
    results: number[];
}

/** 自動ダイスの振り結果 */
interface AutoDiceRoll {
    /** ダイスのインデックス（0-5） */
    index: number;
    /** ダイスの面数 */
    faces: number;
    /** 出目の結果（負荷効果適用後） */
    result: number;
}

/** 自動ダイスの詳細情報 */
interface AutoDiceInfo {
    /** ダイスの面数 */
    faces: number;
    /** ダイスの個数（アセンションレベルに依存） */
    count: number;
    /** 解禁状態 */
    unlocked: boolean;
    /** 現在のレベル */
    level: number;
    /** アセンションレベル */
    ascensionLevel: number;
    /** 最大レベル（アセンションに依存） */
    maxLevel: number;
    /** 実行間隔（Tick単位） */
    interval: number;
    /** 1分間の実行回数 */
    rollsPerMinute: number;
    /** 次回実行までの進行度（0.0-60.0） */
    progress: number;
    /** アセンション可能かどうか */
    canAscend: boolean;
}

/** 手動ダイスの情報 */
interface ManualDiceInfo {
    /** ダイスの個数 */
    count: number;
    /** アップグレードレベル */
    upgradeLevel: number;
    /** ダイスの面数（常に6） */
    faces: number;
}

/** 負荷システムの詳細情報 */
interface BurdenInfo {
    /** 現在の負荷レベル */
    level: number;
    /** レベル100以降による総計減少量 */
    totalReduction: number;
    /** 個別ダイス出目の減少量 */
    diceReduction: number;
    /** 総計半減効果が発動中かどうか */
    totalHalving: boolean;
    /** 次の負荷レベルの情報 */
    nextBurdenLevel: NextBurdenLevelInfo | null;
}

/** 次の負荷レベルの情報 */
interface NextBurdenLevelInfo {
    /** 次の負荷レベル */
    level: number;
    /** 必要なレベル */
    levelRequired: number;
    /** 残りレベル数 */
    levelsRemaining: number;
}

/**
 * ダイスシステムクラス
 * 
 * ゲーム内のすべてのダイス関連機能を管理します。
 * 手動ダイスと自動ダイスの振り機能、負荷システムによる出目調整、
 * タイマー管理、統計追跡などを提供します。
 */
export class DiceSystem {
    private gameState: GameState;
    private prestigeSystem: PrestigeSystem;
    private manualDiceResults: number[];

    /**
     * DiceSystemのコンストラクタ
     * 
     * @param gameState ゲーム状態オブジェクト
     * @param prestigeSystem プレステージシステムのインスタンス
     */
    constructor(gameState: GameState, prestigeSystem: PrestigeSystem) {
        this.gameState = gameState;
        this.prestigeSystem = prestigeSystem;
        this.manualDiceResults = [];  // 手動ダイスの結果表示用
    }

    /**
     * 手動ダイスを振る
     * 
     * プレイヤーが手動で実行するダイス振り機能。
     * 6面ダイスを複数個振り、負荷効果を適用した結果を返します。
     * 
     * @returns 手動ダイスの振り結果（合計値、個別結果、品質）
     */
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
        
        // 盤面レベルの分だけ総計減少
        const level = this.gameState.level;
        const levelReduction = Math.ceil(Math.max(0, level - 100) / 10);
        totalRoll = Math.max(0, totalRoll - levelReduction);
        
        // 負荷10ごとに総計半減
        const burdenLevel = this.getBurdenLevel();
        const halvingCount = Math.floor(burdenLevel / BURDEN_CONFIG.HALVING_INTERVAL);
        for (let i = 0; i < halvingCount; i++) {
            totalRoll = Math.floor(totalRoll / 2);
        }
        
        // 統計を更新
        this.gameState.stats.totalDiceRolls++;
        this.gameState.stats.manualDiceRolls++;
        
        console.log(`手動ダイス: ${this.manualDiceResults.join(', ')} = ${totalRoll}`);
        
        return {
            total: totalRoll,
            results: [...this.manualDiceResults]
        };
    }

    /**
     * 自動ダイスを振る（種類別）
     * 
     * 指定されたインデックスの自動ダイスを振ります。
     * アセンションレベルに応じた個数のダイスを振り、負荷効果を適用します。
     * 
     * @param diceIndex ダイスのインデックス（0-5）
     * @returns 出目の合計値（負荷効果適用後）
     */
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
        
        // 盤面レベルの分だけ総計減少
        const level = this.gameState.level;
        const levelReduction = Math.ceil(Math.max(0, level - 100) / 10);
        totalRoll = Math.max(0, totalRoll - levelReduction);
        
        // 負荷10ごとに総計半減
        const burdenLevel = this.getBurdenLevel();
        const halvingCount = Math.floor(burdenLevel / BURDEN_CONFIG.HALVING_INTERVAL);
        for (let i = 0; i < halvingCount; i++) {
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

    /**
     * 自動ダイスの間隔計算
     * 
     * 指定された自動ダイスの実行間隔を計算します。
     * レベルによる速度向上とプレステージ倍率を考慮します。
     * 
     * @param diceIndex ダイスのインデックス（0-5）
     * @returns 実行間隔（Tick単位）
     */
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

    /**
     * 自動ダイスのタイマーチェック（Tick-based）
     * 
     * 各自動ダイスの進行状況をチェックし、実行タイミングに達したダイスを振ります。
     * ゲームループから毎フレーム呼び出されます。
     * 
     * @returns 実行された自動ダイスの結果配列
     */
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

    /**
     * 手動ダイス結果のゲッター
     * 
     * 最後に振った手動ダイスの個別結果を取得します。
     * UIでの結果表示用に使用されます。
     * 
     * @returns 個別ダイスの出目配列のコピー
     */
    getManualDiceResults(): number[] {
        return [...this.manualDiceResults];
    }

    /**
     * 自動ダイスの解禁状態チェック
     * 
     * 指定されたインデックスの自動ダイスが解禁されているかをチェックします。
     * 
     * @param diceIndex ダイスのインデックス（0-5）
     * @returns 解禁状態（level > 0の場合はtrue）
     */
    isAutoDiceUnlocked(diceIndex: number): boolean {
        return (this.gameState.autoDice[diceIndex]?.level || 0) > 0;
    }

    /**
     * 自動ダイスの情報取得
     * 
     * 指定されたインデックスの自動ダイスの詳細情報を取得します。
     * UI表示やアップグレード処理に使用されます。
     * 
     * @param diceIndex ダイスのインデックス（0-5）
     * @returns ダイスの詳細情報、存在しない場合はnull
     */
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

    /**
     * 全自動ダイスの情報取得
     * 
     * すべての自動ダイスの情報を一括取得します。
     * UIの一括更新時に使用されます。
     * 
     * @returns 全ダイスの情報配列（存在しないインデックスはnull）
     */
    getAllAutoDiceInfo(): (AutoDiceInfo | null)[] {
        return this.gameState.autoDice.map((_, index) => this.getAutoDiceInfo(index));
    }

    /**
     * 手動ダイス情報取得
     * 
     * 手動ダイスの現在の状態情報を取得します。
     * 
     * @returns 手動ダイスの情報（個数、アップグレードレベル、面数）
     */
    getManualDiceInfo(): ManualDiceInfo {
        return {
            count: this.gameState.manualDice.count,
            upgradeLevel: this.gameState.manualDice.upgradeLevel,
            faces: MANUAL_DICE_CONFIG.BASE_FACES
        };
    }

    /**
     * 負荷レベルの計算
     * 
     * 現在のレベルから負荷レベルを計算します。
     * レベル181から負荷が開始され、20レベルごとに負荷レベルが1上昇します。
     * 
     * @returns 現在の負荷レベル（0以上）
     */
    getBurdenLevel(): number {
        const level = this.gameState.level;
        
        if (level < BURDEN_CONFIG.START_LEVEL + 1) {
            return 0;
        }
        
        return 1 + Math.floor((level - BURDEN_CONFIG.START_LEVEL - 1) / BURDEN_CONFIG.LEVEL_INTERVAL);
    }

    /**
     * 負荷による出目補正の適用
     * 
     * 負荷レベルに応じてダイスの出目を調整します。
     * 負荷2ごとに個別ダイス出目-1（最大-10）の効果があります。
     * 出目が0以下になる場合は、元の出目がface/2未満なら0、それ以外は1にします。
     * 
     * @param roll 元の出目
     * @param faces ダイスの面数
     * @returns 調整後の出目
     */
    private applyBurdenEffect(roll: number, faces: number): number {
        const burdenLevel = this.getBurdenLevel();
        
        if (burdenLevel === 0) {
            return roll;
        }
        
        // 負荷2ごとに個別ダイス出目-1 (最大-10)
        const individualReduction = Math.min(
            Math.floor(burdenLevel / 2),
            BURDEN_CONFIG.MAX_INDIVIDUAL_REDUCTION
        );
        
        let adjustedRoll = roll - individualReduction;
        
        // 正数の場合はそのまま
        if (adjustedRoll >= 1) {
            return adjustedRoll;
        }
        
        // adjustedRoll が0以下になる場合
        // 出目が face の半分未満の出目は 0, それ以外は 1 以上に調整
        return roll < faces / 2 ? 0 : 1;
    }

    /**
     * 負荷レベルの詳細情報を取得
     * 
     * 現在の負荷システムの状態を詳細に取得します。
     * UIでの負荷情報表示に使用されます。
     * 
     * @returns 負荷システムの詳細情報
     */
    getBurdenInfo(): BurdenInfo {
        const level = this.gameState.level;
        const burdenLevel = this.getBurdenLevel();
        
        return {
            level: burdenLevel,
            totalReduction: Math.ceil(Math.max(level - 100, 0) / 10),
            diceReduction: Math.min(
                Math.floor(burdenLevel / 2),
                BURDEN_CONFIG.MAX_INDIVIDUAL_REDUCTION
            ),
            totalHalving: burdenLevel >= BURDEN_CONFIG.HALVING_INTERVAL,
            nextBurdenLevel: this.getNextBurdenLevelInfo(level)
        };
    }

    /**
     * 次の負荷レベル情報を取得
     * 
     * 次の負荷レベルに達するための情報を取得します。
     * 
     * @param currentLevel 現在のレベル
     * @returns 次の負荷レベル情報、存在しない場合はnull
     */
    private getNextBurdenLevelInfo(currentLevel: number): NextBurdenLevelInfo | null {
        const currentBurdenLevel = this.getBurdenLevel();
        const nextBurdenLevel = currentBurdenLevel + 1;
        const nextLevelRequired = (nextBurdenLevel * BURDEN_CONFIG.LEVEL_INTERVAL) + 1;
        
        if (currentLevel < nextLevelRequired) {
            return {
                level: nextBurdenLevel,
                levelRequired: nextLevelRequired,
                levelsRemaining: nextLevelRequired - currentLevel
            };
        }
        
        return null; // 次の負荷レベルは存在しない（現在の実装では上限なし）
    }
}