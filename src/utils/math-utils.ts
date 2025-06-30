// 数値計算・フォーマット関連ユーティリティ

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
    return rebirthCount * 1000 + level;
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
    // 基礎値: 2
    const baseAmount = 2;
    // レベルボーナス: レベルに応じて増加、べき乗算
    const multLevel = Math.pow(1000, level / 100);
    // 位置ボーナス: 位置に応じて増加
    const multPosition = 1 + ((position + 1) / 100);
    // ランダムボーナス: 0.8 - 1.2の範囲でランダム
    const randomBonus = seededRandom(seed) * 0.4 + 0.8
    // クレジット量の計算
    return Math.max(1, Math.floor(baseAmount * multLevel * multPosition * randomBonus));
}

// 戻るマスのステップ数計算
export function calculateBackwardSteps(level: number, seed: number, maxSteps: number): number {
    return Math.floor(seededRandom(seed + 3000) * 3 + Math.min(level / 5, maxSteps)) + 1;
}

// 進むマスのステップ数計算
export function calculateForwardSteps(seed: number): number {
    return Math.floor(seededRandom(seed + 2000) * 3) + 1;
}

// 戻るマスの確率計算（位置に応じて変動）
export function calculateBackwardRatio(position: number, baseRatio: number, maxRatio: number): number {
    return Math.min(maxRatio, baseRatio + (position / 100) * 0.12);
}

// プレステージポイント計算（レベル50以降、べき乗算的増加）
export function calculatePrestigePointsForLevel(level: number, startLevel: number, basePoints: number, scalingPower: number): number {
    if (level < startLevel) return 0;
    
    const points = basePoints * Math.exp(scalingPower * (level - startLevel));
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