// ゲーム状態の初期値定義

import { DICE_CONFIGS, GAME_CONFIG } from '../utils/constants.js';
import type { GameState } from '../types/game-state.js';

// デフォルトゲーム状態の生成
export function createDefaultGameState(): GameState {
    return {
        credits: 0,                 // クレジット
        position: 0,                // 現在位置
        level: 1,                   // 現在のレベル
        rebirthCount: 0,            // 転生回数
        
        // プレステージポイント（分離）
        prestigePoints: {
            earned: 0,              // 転生時に獲得予定
            available: 0            // 使用可能ポイント
        },
        
        // 統計情報
        stats: {
            totalDiceRolls: 0,      // サイコロを振った総回数
            totalMoves: 0,          // 進んだマスの総計
            totalCreditsEarned: 0,  // 総獲得クレジット
            totalRebirths: 0,       // 転生回数
            totalPrestigePoints: 0  // 総獲得プレステージポイント
        },
        
        // 手動ダイス（プレイヤーが操作）
        manualDice: {
            count: 1,               // 6面ダイスの個数
            upgradeLevel: 0         // アップグレードレベル
        },
        
        // 自動ダイス（7種類独立）- 新しいレベルシステム
        autoDice: DICE_CONFIGS.map(config => ({
            faces: config.faces,
            level: 0,               // 0=未解禁、1以上=解禁済み
            ascensionLevel: 0,      // アセンションレベル
            baseInterval: config.baseInterval,
            lastRoll: 0
        })),
        
        // ゲーム設定
        settings: {
            tickRate: GAME_CONFIG.TICK_RATE
        }
    };
}

// ゲーム状態のリセット（転生用）
export function resetGameStateForPrestige(currentState: GameState): GameState {
    // 転生回数と使用可能PPは保持
    const preservedRebirthCount = currentState.rebirthCount;
    const preservedAvailablePP = currentState.prestigePoints.available;
    const preservedStats = { ...currentState.stats };
    
    // 新しい初期状態を作成
    const resetState = createDefaultGameState();
    
    // 保持する値を復元
    resetState.rebirthCount = preservedRebirthCount;
    resetState.prestigePoints.available = preservedAvailablePP;
    resetState.stats = preservedStats;
    
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
            if (typeof defaultValue === 'object' && 
                !Array.isArray(defaultValue) && 
                !Array.isArray(savedValue) && 
                typeof savedValue === 'object' && 
                savedValue !== null) {
                (merged as any)[typedKey] = { ...defaultValue, ...savedValue };
            } else {
                (merged as any)[typedKey] = savedValue;
            }
        }
    });
    
    return merged;
}