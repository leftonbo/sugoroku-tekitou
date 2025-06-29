// 盤面システム（盤面生成・プレイヤー移動・マス効果）

import { 
    seededRandom, 
    getBoardSeed, 
    calculateCreditAmount, 
    calculateBackwardSteps, 
    calculateForwardSteps, 
    calculateBackwardRatio 
} from '../utils/math-utils.js';
import { BOARD_CONFIG, CELL_PROBABILITY, GAME_CONFIG } from '../utils/constants.js';

export class BoardSystem {
    constructor(gameState) {
        this.gameState = gameState;
    }

    // マス種類の決定
    getCellType(position, level) {
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
            
            // プレステージポイント獲得
            this.gameState.prestigePoints.earned += levelsCompleted;
            this.gameState.stats.totalPrestigePoints += levelsCompleted;
            prestigeEarned = levelsCompleted;
            
            console.log(`レベル ${this.gameState.level} に到達！プレステージポイント +${levelsCompleted}`);
            
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
                // 移動を実行（再帰的な効果は無視）
                const backwardResult = this.movePlayerDirect(-cellData.effect);
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