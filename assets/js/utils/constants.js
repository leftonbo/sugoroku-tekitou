// ゲーム定数・設定値

// 自動ダイス関連定数
export const DICE_CONFIGS = [
    { faces: 2,  baseInterval: 1500,  unlockCost: 30,    speedBaseCost: 15,   countBaseCost: 60,    emoji: '🎯' },
    { faces: 4,  baseInterval: 2500,  unlockCost: 120,   speedBaseCost: 60,   countBaseCost: 240,   emoji: '🔹' },
    { faces: 6,  baseInterval: 3500,  unlockCost: 300,   speedBaseCost: 150,  countBaseCost: 600,   emoji: '🎲' },
    { faces: 8,  baseInterval: 5000,  unlockCost: 750,   speedBaseCost: 375,  countBaseCost: 1500,  emoji: '🔸' },
    { faces: 10, baseInterval: 6500,  unlockCost: 1800,  speedBaseCost: 900,  countBaseCost: 3600,  emoji: '🔟' },
    { faces: 12, baseInterval: 8000,  unlockCost: 4500,  speedBaseCost: 2250, countBaseCost: 9000,  emoji: '🔵' },
    { faces: 20, baseInterval: 12000, unlockCost: 12000, speedBaseCost: 6000, countBaseCost: 24000, emoji: '⭐' }
];

// アップグレードコスト係数
export const UPGRADE_MULTIPLIERS = {
    MANUAL_DICE: 1.6,
    AUTO_SPEED: 1.5,
    AUTO_COUNT: 2.5
};

// 手動ダイス関連定数
export const MANUAL_DICE_CONFIG = {
    BASE_UPGRADE_COST: 75,
    BASE_FACES: 6
};

// 盤面生成定数
export const BOARD_CONFIG = {
    TOTAL_CELLS: 100,
    CELL_TYPES: {
        EMPTY: 'empty',
        CREDIT: 'credit',
        FORWARD: 'forward',
        BACKWARD: 'backward'
    }
};

// マス目確率設定
export const CELL_PROBABILITY = {
    CREDIT_RATIO: 0.55,
    FORWARD_RATIO: 0.18,
    BACKWARD_BASE_RATIO: 0.08,
    BACKWARD_MAX_RATIO: 0.2
};

// ゲーム設定
export const GAME_CONFIG = {
    TICK_RATE: 1000 / 60,  // 60fps
    SAVE_INTERVAL: 30000,  // 30秒間隔で保存
    MAX_SPEED_MULTIPLIER: 10,
    MAX_BACKWARD_STEPS: 5
};

// 固定戻るマス設定
export const FIXED_BACKWARD_CONFIG = {
    START_LEVEL: 10,       // 固定配置開始レベル
    AREA_START: 90,        // 固定配置エリア開始位置
    AREA_END: 99,          // 固定配置エリア終了位置
    MAX_COUNT: 10,         // 最大固定配置数
    LEVEL_INCREMENT: 10    // レベル増加間隔
};

// クレジット計算設定
export const CREDIT_CONFIG = {
    BASE_AMOUNT_DIVISOR: 8,
    MIN_BASE_AMOUNT: 2,
    LEVEL_BONUS_MULTIPLIER: 0.8,
    RANDOM_BONUS_MIN: 1,
    RANDOM_BONUS_MAX: 4
};

// UI関連定数
export const UI_CONFIG = {
    ANIMATION_DURATION: 800,
    DICE_ANIMATION_DURATION: 600,
    GLOW_EFFECT_DURATION: 1500
};

// 統計表示用定数
export const STORAGE_KEYS = {
    GAME_STATE: 'sugoroku-game-state'
};