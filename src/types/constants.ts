// 定数関連の型定義

// ダイス設定の型定義
export interface DiceConfig {
    faces: number;
    baseInterval: number;
    emoji: string;
}


// 手動ダイス設定の型定義
export interface ManualDiceConfig {
    BASE_UPGRADE_COST: number;
    BASE_FACES: number;
}

// ボード設定の型定義
export interface BoardConfig {
    TOTAL_CELLS: number;
    CELL_TYPES: {
        EMPTY: 'empty';
        CREDIT: 'credit';
        FORWARD: 'forward';
        BACKWARD: 'backward';
        CREDIT_BONUS: 'credit_bonus';
    };
}

// セル確率設定の型定義
export interface CellProbability {
    CREDIT_RATIO: number;
    FORWARD_RATIO: number;
    BACKWARD_BASE_RATIO: number;
    BACKWARD_MAX_RATIO: number;
}

// ゲーム設定の型定義
export interface GameConfig {
    TICK_RATE: number;
    SAVE_INTERVAL: number;
    MAX_SPEED_MULTIPLIER: number;
    MAX_BACKWARD_STEPS: number;
}

// 固定戻るマス設定の型定義
export interface FixedBackwardConfig {
    START_LEVEL: number;
    AREA_START: number;
    AREA_END: number;
    MAX_COUNT: number;
    LEVEL_INCREMENT: number;
}

// クレジット計算設定の型定義
export interface CreditConfig {
    BASE_AMOUNT: number;                    // 基礎クレジット量
    LEVEL_SCALING_BASE: number;             // レベルスケーリングの基数 (1000.0)
    LEVEL_SCALING_DIVISOR: number;          // レベルスケーリングの除数 (100.0)
    POSITION_BONUS_DIVISOR: number;         // 位置ボーナスの除数 (100.0)
    RANDOM_RANGE: number;                   // ランダムボーナスの範囲 (0.4)
    RANDOM_MIN: number;                     // ランダムボーナスの最小値 (0.8)
}

// UI設定の型定義
export interface UIConfig {
    ANIMATION_DURATION: number;
    DICE_ANIMATION_DURATION: number;
    GLOW_EFFECT_DURATION: number;
}

// プレステージシステム設定の型定義
export interface PrestigeConfig {
    START_LEVEL: number;
    BASE_POINTS: number;
    SCALING_BASE: number;                   // スケーリングの基数 (2)
    SCALING_LEVEL_DIVISOR: number;          // スケーリングレベルの除数 (50.0)
}

// 負荷システム設定の型定義
export interface BurdenConfig {
    LEVEL_1_START: number;
    LEVEL_2_START: number;
    LEVEL_3_START: number;
}

// 自動ダイスレベルシステム設定の型定義
export interface AutoDiceLevelConfig {
    MAX_LEVEL_BASE: number;
    ASCENSION_LEVEL_INCREMENT: number;
    ASCENSION_COST_MULTIPLIER: number;
    SPEED_MULTIPLIER_MAX: number;
    DICE_COUNT_BASE: number;
    DICE_COUNT_MULTIPLIER: number;
    LEVEL_COST_BASE: number;
    LEVEL_COST_MULTIPLIER: number;
    ASCENSION_COST_BASE_MULTIPLIER: number;
}

// ストレージキー設定の型定義
export interface StorageKeys {
    GAME_STATE: string;
}

// 負荷効果の型定義
export interface BurdenEffect {
    level: number;
    description: string;
    diceModifier: number;  // ダイス結果に対する乗数
}

