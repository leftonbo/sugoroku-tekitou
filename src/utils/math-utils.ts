// 数値計算・フォーマット関連ユーティリティ

import { CREDIT_CONFIG, PRESTIGE_CONFIG, CALCULATION_CONSTANTS } from './constants.js';

// 数値のフォーマット（K, M, B単位）
export function formatNumber(num: number): string {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    return (num / 1000000000).toFixed(1) + 'B';
}

// シード付きランダム値生成
export function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// 盤面用シード生成
export function getBoardSeed(rebirthCount: number, level: number): number {
    return rebirthCount * CALCULATION_CONSTANTS.BOARD_SEED_LEVEL_MULTIPLIER + level;
}

// 手動ダイスアップグレードのコスト計算
export function calculateManualDiceUpgradeCost(level: number, baseCost: number, multiplier: number): number {
    return Math.floor(baseCost * Math.pow(multiplier, level));
}

// 自動ダイス速度アップグレードのコスト計算
export function calculateAutoDiceSpeedUpgradeCost(baseCost: number, level: number, multiplier: number): number {
    return Math.floor(baseCost * Math.pow(multiplier, level));
}

// 自動ダイス個数アップグレードのコスト計算
export function calculateAutoDiceCountUpgradeCost(baseCost: number, level: number, multiplier: number): number {
    return Math.floor(baseCost * Math.pow(multiplier, level));
}

// 自動ダイスの間隔計算
export function calculateAutoDiceInterval(baseInterval: number, speedLevel: number, maxMultiplier: number): number {
    const speedMultiplier = Math.pow(1.2, speedLevel);
    const actualMultiplier = Math.min(speedMultiplier, maxMultiplier);
    return baseInterval / actualMultiplier;
}

// クレジット獲得量の計算
export function calculateCreditAmount(position: number, level: number, seed: number): number {
    // 基礎値: 定数から取得
    const baseAmount = CREDIT_CONFIG.BASE_AMOUNT;
    // レベルボーナス: レベルに応じて増加、べき乗算
    const multLevel = Math.pow(CREDIT_CONFIG.LEVEL_SCALING_BASE, level / CREDIT_CONFIG.LEVEL_SCALING_DIVISOR);
    // 位置ボーナス: 位置に応じて増加
    const multPosition = 1.0 + ((position + 1.0) / CREDIT_CONFIG.POSITION_BONUS_DIVISOR);
    // ランダムボーナス: 範囲をCREDIT_CONFIGから取得
    const randomBonus = seededRandom(seed) * CREDIT_CONFIG.RANDOM_RANGE + CREDIT_CONFIG.RANDOM_MIN;
    // クレジット量の計算
    return Math.max(1, Math.floor(baseAmount * multLevel * multPosition * randomBonus));
}

// 戻るマスのステップ数計算
export function calculateBackwardSteps(level: number, seed: number, maxSteps: number): number {
    return Math.floor(seededRandom(seed + CALCULATION_CONSTANTS.BACKWARD_STEPS_SEED_OFFSET) * CALCULATION_CONSTANTS.BACKWARD_STEPS_RANGE + Math.min(level / CALCULATION_CONSTANTS.BACKWARD_LEVEL_DIVISOR, maxSteps)) + 1;
}

// 進むマスのステップ数計算
export function calculateForwardSteps(seed: number): number {
    return Math.floor(seededRandom(seed + CALCULATION_CONSTANTS.FORWARD_STEPS_SEED_OFFSET) * CALCULATION_CONSTANTS.FORWARD_STEPS_RANGE) + 1;
}

// 戻るマスの確率計算（位置に応じて変動）
export function calculateBackwardRatio(position: number, baseRatio: number, maxRatio: number): number {
    return Math.min(maxRatio, baseRatio + (position / CALCULATION_CONSTANTS.BACKWARD_RATIO_DIVISOR) * CALCULATION_CONSTANTS.BACKWARD_RATIO_SCALING);
}

// プレステージポイント計算（レベル50以降、べき乗算的増加）
export function calculatePrestigePointsForLevel(level: number, startLevel: number, basePoints: number): number {
    if (level < startLevel) return 0;
    
    // scalingPowerパラメータは互換性のために保持、実際の計算はPRESTIGE_CONFIGを使用
    const points = basePoints * Math.pow(PRESTIGE_CONFIG.SCALING_BASE, (level - startLevel) / PRESTIGE_CONFIG.SCALING_LEVEL_DIVISOR);
    return Math.round(points);
}

// === 新しいレベルシステム用計算関数 ===

// 自動ダイスの最大レベル計算
export function calculateMaxLevel(ascensionLevel: number, baseMaxLevel: number, increment: number): number {
    return baseMaxLevel + (ascensionLevel * increment);
}

// 自動ダイスレベルアップのコスト計算
export function calculateLevelUpCost(diceIndex: number, currentLevel: number, ascensionLevel: number, 
                                   baseCost: number, multiplier: number, ascensionCostMultiplier: number): number {
    // 基本コスト = ダイス種類別の基本コスト * アセンションレベルによる基本コスト倍率
    const baseForDice = baseCost * Math.pow(ascensionCostMultiplier, ascensionLevel);
    
    // ダイス種類別の基本コスト調整（高面数ダイスほど高コスト）
    const diceMultiplier = Math.pow(2, diceIndex);
    
    // レベルによる乗数
    const levelMultiplier = Math.pow(multiplier, currentLevel);
    
    return Math.floor(baseForDice * diceMultiplier * levelMultiplier);
}

// アセンションコスト計算
export function calculateAscensionCost(diceIndex: number, currentLevel: number, ascensionLevel: number,
                                     baseCost: number, multiplier: number, ascensionCostMultiplier: number,
                                     ascensionPenalty: number): number {
    const levelUpCost = calculateLevelUpCost(diceIndex, currentLevel, ascensionLevel, baseCost, multiplier, ascensionCostMultiplier);
    return Math.floor(levelUpCost * ascensionPenalty);
}

// 自動ダイスの速度計算（レベルベース）
export function calculateDiceSpeedFromLevel(level: number, baseInterval: number, maxSpeedMultiplier: number): number {
    if (level === 0) return baseInterval; // 未解禁
    
    // レベル1 = 1倍、レベル100 = 10倍の速度でべき乗算増加
    const speedMultiplier = Math.pow(maxSpeedMultiplier, (level - 1) / 99);
    return Math.floor(baseInterval / speedMultiplier);
}

// 自動ダイスの個数計算（アセンションベース）
export function calculateDiceCountFromAscension(ascensionLevel: number, baseCount: number, multiplier: number): number {
    return baseCount * Math.pow(multiplier, ascensionLevel);
}