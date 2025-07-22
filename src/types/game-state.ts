/**
 * ゲーム状態の型定義
 * すごろくゲームの全体的な状態管理に使用される型定義を提供します。
 */

/**
 * プレステージポイントの基本型定義
 * レベル50以降で獲得できるポイントの管理に使用します。
 */
export interface PrestigePoints {
  earned: number; // 転生時に獲得予定
  available: number; // 使用可能ポイント
}

/**
 * プレステージアップグレード関連の型定義
 * 永続強化システムで使用される個々のアップグレードを表します。
 */
export interface PrestigeUpgrade {
  level: number; // アップグレードレベル
  maxLevel?: number; // 最大レベル（無制限の場合はundefined）
}

/**
 * プレステージアップグレード全体の型定義
 * すべての永続強化の状態を管理します。
 */
export interface PrestigeUpgrades {
  creditMultiplier: PrestigeUpgrade; // クレジット獲得倍率
  diceSpeedBoost: PrestigeUpgrade; // 自動ダイス速度向上
  bonusChance: PrestigeUpgrade; // ボーナスマス出現確率向上
  bonusMultiplier: PrestigeUpgrade; // ボーナスマス倍率向上
}

/**
 * ゲーム統計情報の型定義
 * プレイヤーの行動履歴や実績を追跡します。
 */
export interface GameStats {
  totalDiceRolls: number; // サイコロを振った総回数
  manualDiceRolls: number; // 手動ダイス振り回数
  autoDiceRolls: number; // 自動ダイス振り回数
  totalMoves: number; // 進んだマスの総計
  totalCreditsEarned: number; // 総獲得クレジット
  totalRebirths: number; // 転生回数
  totalPrestigePoints: number; // 総獲得プレステージポイント
  manualDiceUpgrades: number; // 手動ダイスアップグレード回数
  autoDiceUpgrades: number; // 自動ダイスアップグレード回数
  autoDiceAscensions: number; // 自動ダイスアセンション回数
}

/**
 * 手動ダイスの型定義
 * プレイヤーが手動で振る6面ダイスの状態を管理します。
 */
export interface ManualDice {
  count: number; // 6面ダイスの個数
  upgradeLevel: number; // アップグレードレベル
}

/**
 * 自動ダイスの型定義
 * 自動的に実行される各種ダイス（4/6/8/10/12/20面）の状態を管理します。
 */
export interface AutoDice {
  faces: number; // ダイスの面数
  level: number; // ダイスレベル（0=未解禁、1以上=解禁済み）
  ascension: number; // アセンション回数
  baseInterval: number; // 基本実行間隔（ティック数）
  progress: number; // 進行値 (1になるとダイスを振る)
}

/**
 * 数値表示フォーマットの種類
 * UI上での数値表示方法を制御します。
 */
export type NumberFormatType = 'japanese' | 'english' | 'scientific';

/**
 * ゲーム設定の型定義
 * ゲーム全体の動作設定を管理します。
 */
export interface GameSettings {
  tickRate: number; // ゲームループのティック間隔
  numberFormat: NumberFormatType; // 数値表示形式
}

/**
 * 盤面状態差分の型定義
 * マス目の状態変更を効率的に保存するための差分情報を表します。
 * ボーナスマスの使用済み状態などを記録します。
 */
export interface BoardStateDiff {
  type: string;
  effect: number | null;
  activates?: number;
}

/**
 * メインゲーム状態インターフェース
 * ゲーム全体の状態を包括的に管理する最上位の型定義です。
 * セーブデータの中核となる構造を提供します。
 */
export interface GameState {
  credits: number; // クレジット
  position: number; // 現在位置
  level: number; // 現在のレベル
  rebirthCount: number; // 転生回数
  boardRandomSeed: number; // 盤面生成用ランダムシード（転生ごとに変更）
  boardStates: { [level: number]: { [position: number]: BoardStateDiff } }; // 盤面状態差分
  prestigePoints: PrestigePoints; // プレステージポイント
  prestigeUpgrades: PrestigeUpgrades; // プレステージアップグレード
  stats: GameStats; // 統計情報
  manualDice: ManualDice; // 手動ダイス
  autoDice: AutoDice[]; // 自動ダイス配列
  settings: GameSettings; // ゲーム設定
}

/**
 * アップグレード関連の型定義
 * 単一のアップグレードに関する情報を提供します。
 */
export interface UpgradeInfo {
  cost: number;
  maxLevel?: number;
  canAfford: boolean;
}

/**
 * まとめ買い用の型定義
 * アップグレードの一括購入で指定可能な数量を定義します。
 */
export type BulkPurchaseAmount = 1 | 5 | 10 | 'max' | 'max-no-ascension';

/**
 * まとめ買い情報の型定義
 * アップグレードの一括購入時の詳細情報を提供します。
 */
export interface BulkUpgradeInfo {
  amount: BulkPurchaseAmount;
  actualCount: number; // 実際に購入される個数
  totalCost: number; // 総コスト
  canAfford: boolean; // 購入可能かどうか
  willReachMaxLevel: boolean; // 最大レベルに到達するか
  ascensionsIncluded: number; // 含まれるアセンション回数
}

/**
 * アニメーション関連の型定義
 * UI要素のアニメーション設定を管理します。
 */
export interface AnimationConfig {
  duration: number;
  element: HTMLElement;
  className: string;
}

/**
 * システム状態の型定義
 * ゲームループやデバッグ機能の状態を管理します。
 */
export interface SystemStatus {
  isPaused: boolean;
  fps: number;
  lastUpdate: number;
  debugMode: boolean;
}

/**
 * セーブデータの型定義
 * ローカルストレージに保存されるデータの構造を定義します。
 */
export interface SaveData {
  gameState: GameState;
  timestamp: number;
  version: string;
}
