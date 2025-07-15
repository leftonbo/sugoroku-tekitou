// 数値計算・フォーマット関連ユーティリティ

import { PRESTIGE_CONFIG, CALCULATION_CONSTANTS, AUTO_DICE_LEVEL_CONFIG } from './constants.js';
import type { NumberFormatType } from '../types/game-state.js';

// 数値のフォーマット（K, M, B単位）- 後方互換性のため保持
export function formatNumber(num: number): string {
    return formatNumberWithType(num, 'english');
}

// 数値のフォーマット（フォーマット種類指定）
export function formatNumberWithType(num: number, formatType: NumberFormatType): string {
    if (num === 0) return '0';
    
    switch (formatType) {
        case 'japanese':
            return formatNumberJapanese(num);
        case 'english':
            return formatNumberEnglish(num);
        case 'scientific':
            return formatNumberScientific(num);
        default:
            return formatNumberEnglish(num);
    }
}

// 日本語形式（万、億、兆など）
function formatNumberJapanese(num: number): string {
    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    
    if (absNum < 10000) {
        return sign + Math.floor(absNum).toString();
    } else if (absNum < 100000000) { // 1億未満
        return sign + (absNum / 10000).toFixed(1) + '万';
    } else if (absNum < 1000000000000) { // 1兆未満
        return sign + (absNum / 100000000).toFixed(1) + '億';
    } else if (absNum < 10000000000000000) { // 1京未満
        return sign + (absNum / 1000000000000).toFixed(1) + '兆';
    } else if (absNum < 1e20) { // 1垓未満
        return sign + (absNum / 1e16).toFixed(1) + '京';
    } else if (absNum < 1e24) { // 1秭未満
        return sign + (absNum / 1e20).toFixed(1) + '垓';
    } else if (absNum < 1e28) { // 1穣未満
        return sign + (absNum / 1e24).toFixed(1) + '秭';
    } else if (absNum < 1e32) { // 1溝未満
        return sign + (absNum / 1e28).toFixed(1) + '穣';
    } else if (absNum < 1e36) { // 1澗未満
        return sign + (absNum / 1e32).toFixed(1) + '溝';
    } else if (absNum < 1e40) { // 1正未満
        return sign + (absNum / 1e36).toFixed(1) + '澗';
    } else if (absNum < 1e44) { // 1載未満
        return sign + (absNum / 1e40).toFixed(1) + '正';
    } else if (absNum < 1e48) { // 1極未満
        return sign + (absNum / 1e44).toFixed(1) + '載';
    } else if (absNum < 1e52) { // 1恒河沙未満
        return sign + (absNum / 1e48).toFixed(1) + '極';
    } else if (absNum < 1e56) { // 1阿僧祇未満
        return sign + (absNum / 1e52).toFixed(1) + '恒河沙';
    } else if (absNum < 1e60) { // 1那由他未満
        return sign + (absNum / 1e56).toFixed(1) + '阿僧祇';
    } else if (absNum < 1e64) { // 1不可思議未満
        return sign + (absNum / 1e60).toFixed(1) + '那由他';
    } else {
        return sign + (absNum / 1e64).toFixed(1) + '不可思議';
    }
}

// 英語形式（K, M, B, T）
function formatNumberEnglish(num: number): string {
    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    
    if (absNum < 1000) {
        return sign + Math.floor(absNum).toString();
    } else if (absNum < 1000000) {
        return sign + (absNum / 1000).toFixed(1) + 'K';
    } else if (absNum < 1000000000) {
        return sign + (absNum / 1000000).toFixed(1) + 'M';
    } else if (absNum < 1000000000000) {
        return sign + (absNum / 1000000000).toFixed(1) + 'B';
    } else if (absNum < 1e15) {
        return sign + (absNum / 1e12).toFixed(1) + 'T';
    } else if (absNum < 1e18) {
        return sign + (absNum / 1e15).toFixed(1) + 'Qa';
    } else if (absNum < 1e21) {
        return sign + (absNum / 1e18).toFixed(1) + 'Qi';
    } else if (absNum < 1e24) {
        return sign + (absNum / 1e21).toFixed(1) + 'Sx';
    } else if (absNum < 1e27) {
        return sign + (absNum / 1e24).toFixed(1) + 'Sp';
    } else if (absNum < 1e30) {
        return sign + (absNum / 1e27).toFixed(1) + 'Oc';
    } else if (absNum < 1e33) {
        return sign + (absNum / 1e30).toFixed(1) + 'No';
    } else if (absNum < 1e36) {
        return sign + (absNum / 1e33).toFixed(1) + 'Dc';
    } else if (absNum < 1e39) {
        return sign + (absNum / 1e36).toFixed(1) + 'UDc';
    } else if (absNum < 1e42) {
        return sign + (absNum / 1e39).toFixed(1) + 'DDc';
    } else if (absNum < 1e45) {
        return sign + (absNum / 1e42).toFixed(1) + 'TDc';
    } else if (absNum < 1e48) {
        return sign + (absNum / 1e45).toFixed(1) + 'QaDc';
    } else {
        return sign + (absNum / 1e48).toFixed(1) + 'QiDc';
    }
}

// 指数表記形式（1e10など）
function formatNumberScientific(num: number): string {
    if (Math.abs(num) < 1000) {
        return Math.floor(num).toString();
    }
    return num.toExponential(2);
}

// 盤面用シード生成（改善版：ハッシュ関数的アプローチ）
export function getBoardSeed(rebirthCount: number, level: number): number {
    // より複雑なハッシュ計算でレベル間のシード分散を改善
    let seed = rebirthCount * 12345 + level * 67890;
    
    // ハッシュ関数的な変換を複数回適用
    seed = ((seed ^ (seed >>> 16)) * 0x85ebca6b) >>> 0;
    seed = ((seed ^ (seed >>> 13)) * 0xc2b2ae35) >>> 0;
    seed = (seed ^ (seed >>> 16)) >>> 0;
    
    // 最終的に大きな素数を掛けて分散を向上
    return (seed * 2654435761) >>> 0;
}

// 手動ダイスアップグレードのコスト計算
export function calculateManualDiceUpgradeCost(level: number, baseCost: number, multiplier: number): number {
    return Math.floor(baseCost * Math.pow(multiplier, level));
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

// 自動ダイスレベルアップのコスト計算（累積レベルベース）
export function calculateLevelUpCost(diceIndex: number, currentLevel: number, ascensionLevel: number, 
                                   baseCost: number, multiplier: number, ascensionCostMultiplier: number): number {
    // 基本コスト = ダイス種類別の基本コスト * アセンションレベルによる基本コスト倍率
    const baseForDice = baseCost * Math.pow(ascensionCostMultiplier, ascensionLevel);
    
    // ダイス種類別の基本コスト調整（高面数ダイスほど高コスト）
    const diceMultiplier = Math.pow(2, diceIndex);
    
    // 累積投資レベル計算（各アセンションの実際の最大レベルを考慮）
    let totalInvestedLevels = 0;
    
    // 過去のアセンションで投資したレベル数を累積
    for (let i = 0; i < ascensionLevel; i++) {
        const maxLevelForThisAscension = calculateMaxLevel(i, AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE, AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT);
        totalInvestedLevels += maxLevelForThisAscension;
    }
    
    // 現在のアセンションでのレベルを追加
    totalInvestedLevels += currentLevel;
    
    // 累積レベルによる乗数（現在レベルではなく総投資レベルを使用）
    const levelMultiplier = Math.pow(multiplier, totalInvestedLevels);
    
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
    
    const speedMultiplier = 1.0 + maxSpeedMultiplier * ((level - 1.0) / 19.0);
    return baseInterval / speedMultiplier;
}

// 自動ダイスの個数計算（アセンションベース）
export function calculateDiceCountFromAscension(ascensionLevel: number, baseCount: number, multiplier: number): number {
    return baseCount * Math.pow(multiplier, ascensionLevel);
}

// === まとめ買い関連の計算関数 ===

// まとめ買い時の総コスト計算（アセンション境界考慮）
export function calculateBulkLevelUpCost(diceIndex: number, currentLevel: number, ascensionLevel: number,
                                       targetCount: number, baseCost: number, multiplier: number, 
                                       ascensionCostMultiplier: number, ascensionPenalty: number): {
    totalCost: number;
    actualCount: number;
    ascensionsIncluded: number;
} {
    let totalCost = 0;
    let actualCount = 0;
    let ascensionsIncluded = 0;
    let tempLevel = currentLevel;
    let tempAscension = ascensionLevel;
    
    for (let i = 0; i < targetCount; i++) {
        const maxLevel = calculateMaxLevel(tempAscension, AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE, AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT);
        
        if (tempLevel < maxLevel) {
            // 通常のレベルアップ
            const levelUpCost = calculateLevelUpCost(diceIndex, tempLevel, tempAscension, baseCost, multiplier, ascensionCostMultiplier);
            totalCost += levelUpCost;
            tempLevel++;
            actualCount++;
        } else {
            // アセンションが必要
            const ascensionCost = calculateAscensionCost(diceIndex, tempLevel, tempAscension, baseCost, multiplier, ascensionCostMultiplier, ascensionPenalty);
            totalCost += ascensionCost;
            tempLevel = 1; // アセンション後はレベル1
            tempAscension++;
            ascensionsIncluded++;
            actualCount++; // アセンションもカウントに含める
        }
    }
    
    return {
        totalCost,
        actualCount,
        ascensionsIncluded
    };
}

// 指定したクレジット内で購入可能な最大個数を計算
export function calculateMaxPurchasableCount(diceIndex: number, currentLevel: number, ascensionLevel: number,
                                           availableCredits: number, baseCost: number, multiplier: number,
                                           ascensionCostMultiplier: number, ascensionPenalty: number): number {
    let maxCount = 0;
    let totalCost = 0;
    let tempLevel = currentLevel;
    let tempAscension = ascensionLevel;
    
    // 最大1000回まで試行（無限ループ防止）
    for (let i = 0; i < 1000; i++) {
        const maxLevel = calculateMaxLevel(tempAscension, AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE, AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT);
        
        let nextCost = 0;
        if (tempLevel < maxLevel) {
            // 通常のレベルアップコスト
            nextCost = calculateLevelUpCost(diceIndex, tempLevel, tempAscension, baseCost, multiplier, ascensionCostMultiplier);
        } else {
            // アセンションコスト
            nextCost = calculateAscensionCost(diceIndex, tempLevel, tempAscension, baseCost, multiplier, ascensionCostMultiplier, ascensionPenalty);
        }
        
        if (totalCost + nextCost <= availableCredits) {
            totalCost += nextCost;
            maxCount++;
            
            if (tempLevel < maxLevel) {
                tempLevel++;
            } else {
                tempLevel = 1;
                tempAscension++;
            }
        } else {
            break;
        }
    }
    
    return maxCount;
}

// アセンション前で停止する最大購入可能個数を計算
export function calculateMaxPurchasableCountNoAscension(diceIndex: number, currentLevel: number, ascensionLevel: number,
                                                       availableCredits: number, baseCost: number, multiplier: number,
                                                       ascensionCostMultiplier: number): number {
    let maxCount = 0;
    let totalCost = 0;
    let tempLevel = currentLevel;
    
    const maxLevel = calculateMaxLevel(ascensionLevel, AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE, AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT);
    
    // 最大レベルに到達するまでの購入可能数を計算
    while (tempLevel < maxLevel && maxCount < 1000) { // 無限ループ防止
        const nextCost = calculateLevelUpCost(diceIndex, tempLevel, ascensionLevel, baseCost, multiplier, ascensionCostMultiplier);
        
        if (totalCost + nextCost <= availableCredits) {
            totalCost += nextCost;
            maxCount++;
            tempLevel++;
        } else {
            break;
        }
    }
    
    return maxCount;
}