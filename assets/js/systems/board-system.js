// 盤面システム（盤面生成・プレイヤー移動・マス効果）

import { 
    seededRandom, 
    getBoardSeed, 
    calculateCreditAmount, 
    calculateBackwardSteps, 
    calculateForwardSteps, 
    calculateBackwardRatio,
    calculatePrestigePointsForLevel
} from '../utils/math-utils.js';
import { BOARD_CONFIG, CELL_PROBABILITY, GAME_CONFIG, FIXED_BACKWARD_CONFIG, PRESTIGE_CONFIG } from '../utils/constants.js';

export class BoardSystem {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // マス種類の決定
    getCellType(position, level) {
        // レベル10以降の固定戻るマス処理
        if (level >= FIXED_BACKWARD_CONFIG.START_LEVEL) {
            const fixedBackwardCell = this.checkFixedBackwardCell(position, level);
            if (fixedBackwardCell) {
                return fixedBackwardCell;
            }
        }
        
        const seed = getBoardSeed(this.gameState.rebirthCount, level) + position;
        const rand = seededRandom(seed);
        
        // 盤面の後半ほど戻るマスが多くなる（バランス調整済み）
        const backwardRatio = calculateBackwardRatio(
            position, 
            CELL_PROBABILITY.BACKWARD_BASE_RATIO, 
            CELL_PROBABILITY.BACKWARD_MAX_RATIO
        );
        const forwardRatio = CELL_PROBABILITY.FORWARD_RATIO;
        const creditRatio = CELL_PROBABILITY.CREDIT_RATIO;
        const emptyRatio = 1 - backwardRatio - forwardRatio - creditRatio;
        
        if (rand < emptyRatio) {
            return { type: BOARD_CONFIG.CELL_TYPES.EMPTY, effect: null };
        } else if (rand < emptyRatio + creditRatio) {
            // クレジット獲得マス
            const amount = calculateCreditAmount(position, level, seed);
            return { 
                type: BOARD_CONFIG.CELL_TYPES.CREDIT, 
                effect: amount 
            };
        } else if (rand < emptyRatio + creditRatio + forwardRatio) {
            // 進むマス（1-3マス）
            const steps = calculateForwardSteps(seed);
            return { type: BOARD_CONFIG.CELL_TYPES.FORWARD, effect: steps };
        } else {
            // 戻るマス（1-3マス、レベルペナルティ軽減）
            const steps = calculateBackwardSteps(level, seed, GAME_CONFIG.MAX_BACKWARD_STEPS);
            return { type: BOARD_CONFIG.CELL_TYPES.BACKWARD, effect: steps };
        }
    }

    // 固定戻るマスのチェック
    checkFixedBackwardCell(position, level) {
        // 固定配置エリア外は対象外
        if (position < FIXED_BACKWARD_CONFIG.AREA_START || position > FIXED_BACKWARD_CONFIG.AREA_END) {
            return null;
        }
        
        // レベルに応じた固定配置数を計算
        const levelProgress = Math.floor((level - FIXED_BACKWARD_CONFIG.START_LEVEL) / FIXED_BACKWARD_CONFIG.LEVEL_INCREMENT);
        const fixedCount = Math.min(levelProgress + 1, FIXED_BACKWARD_CONFIG.MAX_COUNT);
        
        // 固定配置する位置を決定（後ろから配置）
        const areaSize = FIXED_BACKWARD_CONFIG.AREA_END - FIXED_BACKWARD_CONFIG.AREA_START + 1;
        const startFixedPosition = FIXED_BACKWARD_CONFIG.AREA_END - fixedCount + 1;
        
        if (position >= startFixedPosition) {
            // 固定戻るマスとして配置
            const seed = getBoardSeed(this.gameState.rebirthCount, level) + position + 9999; // 異なるシードを使用
            const steps = Math.floor(seededRandom(seed) * 3) + 2; // 2-4マス戻る（通常より強め）
            return { 
                type: BOARD_CONFIG.CELL_TYPES.BACKWARD, 
                effect: Math.min(steps, GAME_CONFIG.MAX_BACKWARD_STEPS) 
            };
        }
        
        return null;
    }

    // プレイヤーの移動
    movePlayer(steps) {
        const oldPosition = this.gameState.position;
        const newPosition = oldPosition + steps;
        
        // 統計を更新
        this.gameState.stats.totalMoves += steps;
        
        const moveResult = this.handlePositionChange(newPosition);
        
        return {
            oldPosition,
            newPosition: this.gameState.position,
            levelChanged: moveResult.levelChanged,
            prestigeEarned: moveResult.prestigeEarned
        };
    }

    // 位置変更の処理
    handlePositionChange(newPosition) {
        let levelChanged = false;
        let prestigeEarned = 0;
        
        // レベルアップの処理
        if (newPosition >= BOARD_CONFIG.TOTAL_CELLS) {
            const levelsCompleted = Math.floor(newPosition / BOARD_CONFIG.TOTAL_CELLS);
            this.gameState.level += levelsCompleted;
            levelChanged = true;
            
            // プレステージポイント獲得（レベル50以降）
            if (this.gameState.level >= PRESTIGE_CONFIG.START_LEVEL) {
                const prestigePointsEarned = calculatePrestigePointsForLevel(
                    this.gameState.level, 
                    PRESTIGE_CONFIG.START_LEVEL, 
                    PRESTIGE_CONFIG.BASE_POINTS, 
                    PRESTIGE_CONFIG.SCALING_POWER
                );
                
                // 前のレベルでのプレステージポイントを計算
                const previousLevelPrestige = this.gameState.level > PRESTIGE_CONFIG.START_LEVEL ? 
                    calculatePrestigePointsForLevel(
                        this.gameState.level - levelsCompleted, 
                        PRESTIGE_CONFIG.START_LEVEL, 
                        PRESTIGE_CONFIG.BASE_POINTS, 
                        PRESTIGE_CONFIG.SCALING_POWER
                    ) : 0;
                
                const newPrestigePoints = prestigePointsEarned - previousLevelPrestige;
                this.gameState.prestigePoints.earned += newPrestigePoints;
                this.gameState.stats.totalPrestigePoints += newPrestigePoints;
                prestigeEarned = newPrestigePoints;
                
                console.log(`レベル ${this.gameState.level} に到達！プレステージポイント +${newPrestigePoints}`);
            } else {
                console.log(`レベル ${this.gameState.level} に到達！`);
            }
            
            // 位置をリセット（新しいレベルの盤面）
            this.gameState.position = newPosition % BOARD_CONFIG.TOTAL_CELLS;
        } else {
            this.gameState.position = newPosition;
        }
        
        return { levelChanged, prestigeEarned };
    }

    // 直接移動（マス効果を適用しない）
    movePlayerDirect(steps) {
        const oldPosition = this.gameState.position;
        let newPosition = oldPosition + steps;
        
        // 範囲チェック
        if (newPosition < 0) {
            newPosition = 0;
        } else if (newPosition >= BOARD_CONFIG.TOTAL_CELLS) {
            const moveResult = this.handlePositionChange(newPosition);
            newPosition = this.gameState.position;
            
            // 統計を更新
            this.gameState.stats.totalMoves += Math.abs(steps);
            
            return {
                oldPosition,
                newPosition,
                levelChanged: moveResult.levelChanged,
                prestigeEarned: moveResult.prestigeEarned
            };
        }
        
        this.gameState.position = newPosition;
        
        // 統計を更新
        this.gameState.stats.totalMoves += Math.abs(steps);
        
        return {
            oldPosition,
            newPosition,
            levelChanged: false,
            prestigeEarned: 0
        };
    }

    // マス目の効果を適用
    applySquareEffect(position) {
        const cellData = this.getCellType(position, this.gameState.level);
        const effect = {
            type: cellData.type,
            value: cellData.effect,
            position: position,
            applied: false
        };
        
        switch (cellData.type) {
            case BOARD_CONFIG.CELL_TYPES.EMPTY:
                console.log(`何もなし (位置: ${position})`);
                effect.applied = true;
                break;
                
            case BOARD_CONFIG.CELL_TYPES.CREDIT:
                this.gameState.credits += cellData.effect;
                this.gameState.stats.totalCreditsEarned += cellData.effect;
                console.log(`クレジット +${cellData.effect} (位置: ${position})`);
                effect.applied = true;
                break;
                
            case BOARD_CONFIG.CELL_TYPES.FORWARD:
                console.log(`${cellData.effect}マス進む! (位置: ${position})`);
                // 移動を実行（再帰的な効果は無視）
                const forwardResult = this.movePlayerDirect(cellData.effect);
                effect.moveResult = forwardResult;
                effect.applied = true;
                break;
                
            case BOARD_CONFIG.CELL_TYPES.BACKWARD:
                console.log(`${cellData.effect}マス戻る... (位置: ${position})`);
                // 移動を実行（再帰的な効果は無視、0マス目を下回らないよう制限）
                const maxBackwardSteps = Math.min(cellData.effect, this.gameState.position);
                const backwardResult = this.movePlayerDirect(-maxBackwardSteps);
                effect.moveResult = backwardResult;
                effect.applied = true;
                break;
        }
        
        return effect;
    }

    // 現在の位置情報取得
    getCurrentPositionInfo() {
        return {
            position: this.gameState.position,
            level: this.gameState.level,
            cellData: this.getCellType(this.gameState.position, this.gameState.level)
        };
    }

    // 盤面の完全な情報取得（UI生成用）
    getBoardData() {
        const boardData = [];
        for (let i = 0; i < BOARD_CONFIG.TOTAL_CELLS; i++) {
            const cellData = this.getCellType(i, this.gameState.level);
            boardData.push({
                position: i,
                type: cellData.type,
                effect: cellData.effect,
                isPlayerPosition: i === this.gameState.position
            });
        }
        return boardData;
    }
}