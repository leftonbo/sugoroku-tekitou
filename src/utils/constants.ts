/**
 * ゲーム定数・設定値
 * ゲーム全体で使用される設定値、バランス値、定数を統合管理します。
 * すべてのゲームバランスはこのファイルで管理されます。
 */

import type {
  DiceConfig,
  ManualDiceConfig,
  BoardConfig,
  CellProbability,
  GameConfig,
  FixedBackwardConfig,
  CreditConfig,
  UIConfig,
  PrestigeConfig,
  BurdenConfig,
  AutoDiceLevelConfig,
  StorageKeys,
} from '../types/constants.js';

/**
 * 自動ダイス関連定数
 * 各自動ダイスの設定を管理します。
 * Tick-based: 60fps時の変換 ms/16.67≈ticks
 * Base interval: face * 10 + 40
 */
export const DICE_CONFIGS: DiceConfig[] = [
  { faces: 4, baseInterval: 80, emoji: '🔹' },
  { faces: 6, baseInterval: 100, emoji: '🎲' },
  { faces: 8, baseInterval: 120, emoji: '🔸' },
  { faces: 10, baseInterval: 140, emoji: '🔟' },
  { faces: 12, baseInterval: 160, emoji: '🔵' },
  { faces: 20, baseInterval: 240, emoji: '⭐' },
];

/**
 * アップグレードコスト係数
 * 各種アップグレードのコスト係数を管理します。
 */
export const UPGRADE_MULTIPLIERS = {
  MANUAL_DICE: 36.0,
} as const;

/**
 * 手動ダイス関連定数
 * プレイヤーが手動で振るダイスの設定を管理します。
 */
export const MANUAL_DICE_CONFIG: ManualDiceConfig = {
  BASE_UPGRADE_COST: 60,
  BASE_FACES: 6,
};

/**
 * 盤面生成定数
 * すごろく盤面の基本設定とマス目の種類を管理します。
 */
export const BOARD_CONFIG: BoardConfig = {
  TOTAL_CELLS: 100,
  CELL_TYPES: {
    EMPTY: 'empty',
    CREDIT: 'credit',
    FORWARD: 'forward',
    BACKWARD: 'backward',
    CREDIT_BONUS: 'credit_bonus',
  },
};

// マス目確率設定
export const CELL_PROBABILITY: CellProbability = {
  CREDIT_RATIO: 0.55,
  FORWARD_RATIO: 0.18,
  BACKWARD_BASE_RATIO: 0.08,
  BACKWARD_MAX_RATIO: 0.2,
};

// 計算定数（math-utils.ts用）
export const CALCULATION_CONSTANTS = {
  // 戻るマス確率計算用
  BACKWARD_RATIO_SCALING: 0.12, // (position / 100) * 0.12
  BACKWARD_RATIO_DIVISOR: 100, // position / 100

  // 進むマス・戻るマスのステップ計算用
  FORWARD_STEPS_RANGE: 3, // 1-3マス
  BACKWARD_STEPS_RANGE: 3, // 1-3マス
  BACKWARD_LEVEL_DIVISOR: 5, // level / 5

  // ボードシード関連
  BOARD_SEED_LEVEL_MULTIPLIER: 1000, // rebirthCount * 1000 + level
};

// ゲーム設定
export const GAME_CONFIG: GameConfig = {
  TICK_RATE: 1000 / 60, // 60fps
  SAVE_INTERVAL: 30000, // 30秒間隔で保存
  MAX_SPEED_MULTIPLIER: 10,
  MAX_BACKWARD_STEPS: 20,
};

// 固定戻るマス設定
export const FIXED_BACKWARD_CONFIG: FixedBackwardConfig = {
  START_LEVEL: 10, // 固定配置開始レベル
  AREA_START: 90, // 固定配置エリア開始位置
  AREA_END: 99, // 固定配置エリア終了位置
  MAX_COUNT: 10, // 最大固定配置数
  LEVEL_INCREMENT: 10, // レベル増加間隔
};

// クレジット計算設定
export const CREDIT_CONFIG: CreditConfig = {
  BASE_AMOUNT: 4, // 基礎クレジット量
  LEVEL_SCALING_BASE: 600.0, // レベルスケーリングの基数
  LEVEL_SCALING_DIVISOR: 100.0, // レベルスケーリングの除数
  POSITION_BONUS_DIVISOR: 100.0, // 位置ボーナスの除数
  RANDOM_RANGE: 0.6, // ランダムボーナスの範囲 (0.8-1.2)
  RANDOM_MIN: 0.7, // ランダムボーナスの最小値
};

// UI関連定数
export const UI_CONFIG: UIConfig = {
  ANIMATION_DURATION: 800,
  DICE_ANIMATION_DURATION: 600,
  GLOW_EFFECT_DURATION: 1500,
};

// プレステージシステム設定
export const PRESTIGE_CONFIG: PrestigeConfig = {
  START_LEVEL: 50, // プレステージポイント獲得開始レベル
  BASE_POINTS: 1, // 基準ポイント（レベル50で1ポイント）
  SCALING_BASE: 2, // スケーリングの基数（2倍ずつ増加）
  SCALING_LEVEL_DIVISOR: 50.0, // スケーリングレベルの除数（50レベルごと）
};

// 負荷システム設定
export const BURDEN_CONFIG: BurdenConfig = {
  START_LEVEL: 100,
  LEVEL_INTERVAL: 50, // 50レベルごとに負荷レベル+1
  MAX_INDIVIDUAL_REDUCTION: 10, // 個別ダイス減少の最大値 (-10)
  HALVING_INTERVAL: 10, // 10負荷レベルごとに総計半減
};

// 自動ダイスレベルシステム設定
export const AUTO_DICE_LEVEL_CONFIG: AutoDiceLevelConfig = {
  MAX_LEVEL_BASE: 20, // 基本最大レベル
  ASCENSION_LEVEL_INCREMENT: 2, // アセンションごとのレベル上限増加
  ASCENSION_COST_MULTIPLIER: 10, // アセンション時のコスト倍率
  SPEED_MULTIPLIER_MAX: 4, // レベル100時の速度倍率
  DICE_COUNT_BASE: 1, // レベル1時のダイス個数
  DICE_COUNT_MULTIPLIER: 2, // アセンションごとのダイス個数倍率
  LEVEL_COST_BASE: 50, // レベルアップ基本コスト
  LEVEL_COST_MULTIPLIER: 1.3, // レベルごとのコスト増加率
  ASCENSION_COST_BASE_MULTIPLIER: 6, // アセンション後のコスト基本倍率増加
};

// 統計表示用定数
export const STORAGE_KEYS: StorageKeys = {
  GAME_STATE: 'sugoroku-game-state',
};
