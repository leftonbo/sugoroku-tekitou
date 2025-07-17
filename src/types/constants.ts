/**
 * 定数関連の型定義
 * ゲーム全体で使用される設定値や定数の型定義を提供します。
 */

/**
 * ダイス設定の型定義
 * 自動ダイスの基本設定を管理します。
 */
export interface DiceConfig {
    faces: number;
    baseInterval: number;
    emoji: string;
}


/**
 * 手動ダイス設定の型定義
 * プレイヤーが手動で振るダイスの設定を管理します。
 */
export interface ManualDiceConfig {
    BASE_UPGRADE_COST: number;
    BASE_FACES: number;
}

/**
 * ボード設定の型定義
 * すごろく盤面の基本設定と、各種マス目の定義を管理します。
 */
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

/**
 * セル確率設定の型定義
 * 盤面生成時の各種マス目の出現確率を管理します。
 */
export interface CellProbability {
    CREDIT_RATIO: number;
    FORWARD_RATIO: number;
    BACKWARD_BASE_RATIO: number;
    BACKWARD_MAX_RATIO: number;
}

/**
 * ゲーム設定の型定義
 * ゲーム全体の動作に関する基本設定を管理します。
 */
export interface GameConfig {
    TICK_RATE: number;
    SAVE_INTERVAL: number;
    MAX_SPEED_MULTIPLIER: number;
    MAX_BACKWARD_STEPS: number;
}

/**
 * 固定戻るマス設定の型定義
 * レベル10以降の90-99マス目に配置される固定戻るマスの設定を管理します。
 */
export interface FixedBackwardConfig {
    START_LEVEL: number;
    AREA_START: number;
    AREA_END: number;
    MAX_COUNT: number;
    LEVEL_INCREMENT: number;
}

/**
 * クレジット計算設定の型定義
 * クレジットマスでの獲得クレジット量の計算に使用される設定を管理します。
 */
export interface CreditConfig {
    BASE_AMOUNT: number;                    // 基礎クレジット量
    LEVEL_SCALING_BASE: number;             // レベルスケーリングの基数 (1000.0)
    LEVEL_SCALING_DIVISOR: number;          // レベルスケーリングの除数 (100.0)
    POSITION_BONUS_DIVISOR: number;         // 位置ボーナスの除数 (100.0)
    RANDOM_RANGE: number;                   // ランダムボーナスの範囲 (0.4)
    RANDOM_MIN: number;                     // ランダムボーナスの最小値 (0.8)
}

/**
 * UI設定の型定義
 * ユーザーインターフェースのアニメーション設定を管理します。
 */
export interface UIConfig {
    ANIMATION_DURATION: number;
    DICE_ANIMATION_DURATION: number;
    GLOW_EFFECT_DURATION: number;
}

/**
 * プレステージシステム設定の型定義
 * 転生システムとプレステージポイントの計算設定を管理します。
 */
export interface PrestigeConfig {
    START_LEVEL: number;
    BASE_POINTS: number;
    SCALING_BASE: number;                   // スケーリングの基数 (2)
    SCALING_LEVEL_DIVISOR: number;          // スケーリングレベルの除数 (50.0)
}

/**
 * 負荷システム設定の型定義
 * 高レベルでの負荷効果による難易度調整設定を管理します。
 */
export interface BurdenConfig {
    START_LEVEL: number;              // 負荷システム開始レベル
    LEVEL_INTERVAL: number;           // 負荷レベル上昇の間隔
    MAX_INDIVIDUAL_REDUCTION: number; // 個別ダイス減少の最大値
    HALVING_INTERVAL: number;         // 総計半減の間隔
}

/**
 * 自動ダイスレベルシステム設定の型定義
 * 自動ダイスのレベルアップとアセンションに関する設定を管理します。
 */
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

/**
 * ストレージキー設定の型定義
 * ローカルストレージに使用されるキー名の設定を管理します。
 */
export interface StorageKeys {
    GAME_STATE: string;
}

/**
 * 負荷効果の型定義
 * レベルごとの負荷効果の具体的な内容を管理します。
 */
export interface BurdenEffect {
    level: number;
    description: string;
    diceModifier: number;  // ダイス結果に対する乗数
}

