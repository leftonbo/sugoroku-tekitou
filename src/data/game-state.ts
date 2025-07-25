// ゲーム状態の初期値定義

import type { GameState } from '../types/game-state.js';
import { DICE_CONFIGS, GAME_CONFIG } from '../utils/constants.js';

// デフォルトゲーム状態の生成
export function createDefaultGameState(): GameState {
  return {
    credits: 0, // クレジット
    position: 0, // 現在位置
    level: 1, // 現在のレベル
    rebirthCount: 0, // 転生回数
    boardRandomSeed: Math.floor(Math.random() * 0x7fffffff), // 盤面生成用ランダムシード
    boardStates: {}, // 盤面状態差分（初期は空）

    // プレステージポイント（分離）
    prestigePoints: {
      earned: 0, // 転生時に獲得予定
      available: 0, // 使用可能ポイント
    },

    // プレステージアップグレード
    prestigeUpgrades: {
      creditMultiplier: {
        level: 0, // 初期レベル0
      },
      diceSpeedBoost: {
        level: 0, // 初期レベル0
        maxLevel: 40, // 最大40レベル（4倍速まで）
      },
      bonusChance: {
        level: 0, // 初期レベル0
        maxLevel: 100, // 最大100レベル
      },
      bonusMultiplier: {
        level: 0, // 初期レベル0
        maxLevel: 50, // 最大50レベル
      },
    },

    // 統計情報
    stats: {
      totalDiceRolls: 0, // サイコロを振った総回数
      manualDiceRolls: 0, // 手動ダイス振り回数
      autoDiceRolls: 0, // 自動ダイス振り回数
      totalMoves: 0, // 進んだマスの総計
      totalCreditsEarned: 0, // 総獲得クレジット
      totalRebirths: 0, // 転生回数
      totalPrestigePoints: 0, // 総獲得プレステージポイント
      manualDiceUpgrades: 0, // 手動ダイスアップグレード回数
      autoDiceUpgrades: 0, // 自動ダイスアップグレード回数
      autoDiceAscensions: 0, // 自動ダイスアセンション回数
    },

    // 手動ダイス（プレイヤーが操作）
    manualDice: {
      count: 1, // 6面ダイスの個数
      upgradeLevel: 0, // アップグレードレベル
    },

    // 自動ダイス（7種類独立）- 新しいレベルシステム
    autoDice: DICE_CONFIGS.map(config => ({
      faces: config.faces,
      level: 0, // 0=未解禁、1以上=解禁済み
      ascension: 0, // アセンションレベル
      baseInterval: config.baseInterval,
      progress: 0,
    })),

    // ゲーム設定
    settings: {
      tickRate: GAME_CONFIG.TICK_RATE,
      numberFormat: 'english' as const, // デフォルトは英語形式（K/M/B）
    },
  };
}

// ゲーム状態のリセット（転生用）
export function resetGameStateForPrestige(currentState: GameState): GameState {
  // 転生回数と使用可能PP、プレステージアップグレードは保持
  const preservedRebirthCount = currentState.rebirthCount;
  const preservedAvailablePP = currentState.prestigePoints.available;
  const preservedPrestigeUpgrades = { ...currentState.prestigeUpgrades };
  const preservedStats = { ...currentState.stats };

  // 新しい初期状態を作成
  const resetState = createDefaultGameState();

  // 保持する値を復元
  resetState.rebirthCount = preservedRebirthCount;
  resetState.prestigePoints.available = preservedAvailablePP;
  resetState.prestigeUpgrades = preservedPrestigeUpgrades;
  resetState.stats = preservedStats;

  // 転生時に新しい盤面ランダムシードを生成
  resetState.boardRandomSeed = Math.floor(Math.random() * 0x7fffffff);

  // 転生時に盤面状態をクリア（ボーナスマス等の状態をリセット）
  resetState.boardStates = {};

  return resetState;
}

// ゲーム状態の検証とマージ
export function mergeGameState(defaultState: GameState, savedState: Partial<GameState>): GameState {
  const merged = { ...defaultState };

  // トップレベルプロパティのマージ
  Object.keys(savedState).forEach(key => {
    const typedKey = key as keyof GameState;
    const defaultValue = defaultState[typedKey];
    const savedValue = savedState[typedKey];

    if (savedValue !== undefined) {
      if (
        typeof defaultValue === 'object' &&
        !Array.isArray(defaultValue) &&
        !Array.isArray(savedValue) &&
        typeof savedValue === 'object' &&
        savedValue !== null
      ) {
        (merged as any)[typedKey] = { ...defaultValue, ...savedValue };
      } else {
        (merged as any)[typedKey] = savedValue;
      }
    }
  });

  return merged;
}
