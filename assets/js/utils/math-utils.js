// 数値計算・フォーマット関連ユーティリティ

// 数値のフォーマット（K, M, B単位）
export function formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    return (num / 1000000000).toFixed(1) + 'B';
}

// シード付きランダム値生成
export function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

// 盤面用シード生成
export function getBoardSeed(rebirthCount, level) {
    return rebirthCount * 1000 + level;
}

// 手動ダイスアップグレードのコスト計算
export function calculateManualDiceUpgradeCost(level, baseCost, multiplier) {
    return Math.floor(baseCost * Math.pow(multiplier, level));
}

// 自動ダイス速度アップグレードのコスト計算
export function calculateAutoDiceSpeedUpgradeCost(baseCost, level, multiplier) {
    return Math.floor(baseCost * Math.pow(multiplier, level));
}

// 自動ダイス個数アップグレードのコスト計算
export function calculateAutoDiceCountUpgradeCost(baseCost, level, multiplier) {
    return Math.floor(baseCost * Math.pow(multiplier, level));
}

// 自動ダイスの間隔計算
export function calculateAutoDiceInterval(baseInterval, speedLevel, maxMultiplier) {
    const speedMultiplier = Math.pow(1.2, speedLevel);
    const actualMultiplier = Math.min(speedMultiplier, maxMultiplier);
    return baseInterval / actualMultiplier;
}

// クレジット獲得量の計算
export function calculateCreditAmount(position, level, seed) {
    const baseAmount = Math.max(2, Math.floor(position / 8) + 2);
    const levelBonus = Math.floor(level * 0.8);
    const randomBonus = Math.floor(seededRandom(seed + 1000) * 4) + 1; // 1-4の追加ランダム
    return baseAmount + levelBonus + randomBonus;
}

// 戻るマスのステップ数計算
export function calculateBackwardSteps(level, seed, maxSteps) {
    const baseSteps = Math.floor(seededRandom(seed + 3000) * 3) + 1;
    const levelPenalty = Math.floor(level / 5);
    return Math.min(baseSteps + levelPenalty, maxSteps);
}

// 進むマスのステップ数計算
export function calculateForwardSteps(seed) {
    return Math.floor(seededRandom(seed + 2000) * 3) + 1;
}

// 戻るマスの確率計算（位置に応じて変動）
export function calculateBackwardRatio(position, baseRatio, maxRatio) {
    return Math.min(maxRatio, baseRatio + (position / 100) * 0.12);
}