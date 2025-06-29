// ゲーム定数・設定値

import type {
    DiceConfig,
    UpgradeMultipliers,
    ManualDiceConfig,
    BoardConfig,
    CellProbability,
    GameConfig,
    FixedBackwardConfig,
    CreditConfig,
    UIConfig,
    PrestigeConfig,
    BurdenConfig,
    StorageKeys
} from '../types/constants.js';

// 自動ダイス関連定数（Tick-based: 60fps時の変換 ms/16.67≈ticks）
export const DICE_CONFIGS: DiceConfig[] = [
    { faces: 2,  baseInterval: 90,   unlockCost: 30,    speedBaseCost: 15,   countBaseCost: 60,    emoji: '🎯' },   // 1500ms → 90ticks
    { faces: 4,  baseInterval: 150,  unlockCost: 120,   speedBaseCost: 60,   countBaseCost: 240,   emoji: '🔹' },   // 2500ms → 150ticks
    { faces: 6,  baseInterval: 210,  unlockCost: 300,   speedBaseCost: 150,  countBaseCost: 600,   emoji: '🎲' },   // 3500ms → 210ticks
    { faces: 8,  baseInterval: 300,  unlockCost: 750,   speedBaseCost: 375,  countBaseCost: 1500,  emoji: '🔸' },   // 5000ms → 300ticks
    { faces: 10, baseInterval: 390,  unlockCost: 1800,  speedBaseCost: 900,  countBaseCost: 3600,  emoji: '🔟' },   // 6500ms → 390ticks
    { faces: 12, baseInterval: 480,  unlockCost: 4500,  speedBaseCost: 2250, countBaseCost: 9000,  emoji: '🔵' },   // 8000ms → 480ticks
    { faces: 20, baseInterval: 720,  unlockCost: 12000, speedBaseCost: 6000, countBaseCost: 24000, emoji: '⭐' }    // 12000ms → 720ticks
];

// アップグレードコスト係数
export const UPGRADE_MULTIPLIERS: UpgradeMultipliers = {
    MANUAL_DICE: 1.6,
    AUTO_SPEED: 1.5,
    AUTO_COUNT: 2.5
};

// 手動ダイス関連定数
export const MANUAL_DICE_CONFIG: ManualDiceConfig = {
    BASE_UPGRADE_COST: 75,
    BASE_FACES: 6
};

// 盤面生成定数
export const BOARD_CONFIG: BoardConfig = {
    TOTAL_CELLS: 100,
    CELL_TYPES: {
        EMPTY: 'empty',
        CREDIT: 'credit',
        FORWARD: 'forward',
        BACKWARD: 'backward'
    }
};

// マス目確率設定
export const CELL_PROBABILITY: CellProbability = {
    CREDIT_RATIO: 0.55,
    FORWARD_RATIO: 0.18,
    BACKWARD_BASE_RATIO: 0.08,
    BACKWARD_MAX_RATIO: 0.2
};

// ゲーム設定
export const GAME_CONFIG: GameConfig = {
    TICK_RATE: 1000 / 60,  // 60fps
    SAVE_INTERVAL: 30000,  // 30秒間隔で保存
    MAX_SPEED_MULTIPLIER: 10,
    MAX_BACKWARD_STEPS: 20
};

// 固定戻るマス設定
export const FIXED_BACKWARD_CONFIG: FixedBackwardConfig = {
    START_LEVEL: 10,       // 固定配置開始レベル
    AREA_START: 90,        // 固定配置エリア開始位置
    AREA_END: 99,          // 固定配置エリア終了位置
    MAX_COUNT: 10,         // 最大固定配置数
    LEVEL_INCREMENT: 10    // レベル増加間隔
};

// クレジット計算設定
export const CREDIT_CONFIG: CreditConfig = {
    BASE_AMOUNT_DIVISOR: 8,
    MIN_BASE_AMOUNT: 2,
    LEVEL_BONUS_MULTIPLIER: 0.8,
    RANDOM_BONUS_MIN: 1,
    RANDOM_BONUS_MAX: 4
};

// UI関連定数
export const UI_CONFIG: UIConfig = {
    ANIMATION_DURATION: 800,
    DICE_ANIMATION_DURATION: 600,
    GLOW_EFFECT_DURATION: 1500
};

// プレステージシステム設定
export const PRESTIGE_CONFIG: PrestigeConfig = {
    START_LEVEL: 50,           // プレステージポイント獲得開始レベル
    BASE_POINTS: 1,            // 基準ポイント（レベル50で1ポイント）
    SCALING_POWER: Math.log(2) / 50  // 50レベルで2倍になる指数
};

// 負荷システム設定
export const BURDEN_CONFIG: BurdenConfig = {
    LEVEL_1_START: 201,        // 負荷レベル1開始
    LEVEL_2_START: 501,        // 負荷レベル2開始
    LEVEL_3_START: 1001        // 負荷レベル3開始
};

// 統計表示用定数
export const STORAGE_KEYS: StorageKeys = {
    GAME_STATE: 'sugoroku-game-state'
};