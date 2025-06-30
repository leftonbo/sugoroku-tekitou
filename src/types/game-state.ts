// ゲーム状態の型定義

// 基本型定義
export interface PrestigePoints {
    earned: number;      // 転生時に獲得予定
    available: number;   // 使用可能ポイント
}

// プレステージアップグレード関連の型定義
export interface PrestigeUpgrade {
    level: number;       // アップグレードレベル
    maxLevel?: number;   // 最大レベル（無制限の場合はundefined）
}

export interface PrestigeUpgrades {
    creditMultiplier: PrestigeUpgrade;  // クレジット獲得倍率
    diceSpeedBoost: PrestigeUpgrade;    // 自動ダイス速度向上
}

export interface GameStats {
    totalDiceRolls: number;      // サイコロを振った総回数
    totalMoves: number;          // 進んだマスの総計
    totalCreditsEarned: number;  // 総獲得クレジット
    totalRebirths: number;       // 転生回数
    totalPrestigePoints: number; // 総獲得プレステージポイント
}

export interface ManualDice {
    count: number;         // 6面ダイスの個数
    upgradeLevel: number;  // アップグレードレベル
}

export interface AutoDice {
    faces: number;         // ダイスの面数
    level: number;         // ダイスレベル（0=未解禁、1以上=解禁済み）
    ascensionLevel: number; // アセンションレベル
    baseInterval: number;  // 基本実行間隔（ティック数）
    lastRoll: number;      // 最後にロールしたTick
}

export interface GameSettings {
    tickRate: number;      // ゲームループのティック間隔
}

// メインゲーム状態インターフェース
export interface GameState {
    credits: number;                    // クレジット
    position: number;                   // 現在位置
    level: number;                      // 現在のレベル
    rebirthCount: number;               // 転生回数
    prestigePoints: PrestigePoints;     // プレステージポイント
    prestigeUpgrades: PrestigeUpgrades; // プレステージアップグレード
    stats: GameStats;                   // 統計情報
    manualDice: ManualDice;             // 手動ダイス
    autoDice: AutoDice[];               // 自動ダイス配列
    settings: GameSettings;             // ゲーム設定
}


// アップグレード関連の型定義
export interface UpgradeInfo {
    cost: number;
    maxLevel?: number;
    canAfford: boolean;
}

// アニメーション関連の型定義
export interface AnimationConfig {
    duration: number;
    element: HTMLElement;
    className: string;
}

// システム状態の型定義
export interface SystemStatus {
    isPaused: boolean;
    fps: number;
    lastUpdate: number;
    debugMode: boolean;
}

// セーブデータの型定義
export interface SaveData {
    gameState: GameState;
    timestamp: number;
    version: string;
}