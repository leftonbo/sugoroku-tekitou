/**
 * 盤面システム（盤面生成・プレイヤー移動・マス効果）
 *
 * このシステムは以下の機能を提供します：
 * - 盤面生成：レベルごとのランダム盤面生成
 * - プレイヤー移動：サイコロ結果による位置更新
 * - マス効果：各マス目の効果適用と状態管理
 * - ボーナスマス：特別なクレジットボーナスマスの管理
 * - 状態保存：マス状態の差分保存で効率化
 */

import type { PrestigeSystem } from './prestige-system.js';
import type { GameState, BoardStateDiff } from '../types/game-state.js';
import {
  BOARD_CONFIG,
  CELL_PROBABILITY,
  GAME_CONFIG,
  FIXED_BACKWARD_CONFIG,
  PRESTIGE_CONFIG,
  CALCULATION_CONSTANTS,
  CREDIT_CONFIG,
} from '../utils/constants.js';
import {
  calculateBackwardRatio,
  calculatePrestigePointsForLevel,
  getBoardSeed,
} from '../utils/math-utils.js';
import { XorShiftRandom } from '../utils/xorshift-random.js';

/**
 * ボード関連の型定義
 */

/**
 * セルタイプの定義
 * 盤面上のマス目の種類を表します。
 */
type CellType = 'empty' | 'credit' | 'forward' | 'backward' | 'credit_bonus';

/**
 * セルデータのインターフェース
 * 各マス目の詳細情報を管理します。
 */
interface CellData {
  type: CellType;
  effect: number | null;
  activates?: number; // 踏んだ回数
}

/**
 * 移動結果のインターフェース
 * プレイヤー移動の結果を表します。
 */
interface MoveResult {
  oldPosition: number;
  newPosition: number;
  levelChanged: boolean;
  prestigeEarned: number;
}

/**
 * 位置変更結果のインターフェース
 * 位置変更時の追加情報を管理します。
 */
interface PositionChangeResult {
  levelChanged: boolean;
  prestigeEarned: number;
}

/**
 * マス効果のインターフェース
 * マス目の効果適用結果を表します。
 */
interface SquareEffect {
  type: CellType;
  value: number | null;
  position: number;
  applied: boolean;
  moveResult?: MoveResult;
  levelChanged?: boolean; // マス効果による移動でレベル変更が発生したか
  prestigeEarned?: number; // マス効果による移動で獲得したプレステージポイント
}

/**
 * 位置情報のインターフェース
 * 特定位置の詳細情報を提供します。
 */
interface PositionInfo {
  position: number;
  level: number;
  cellData: CellData;
}

/**
 * 盤面セルのインターフェース
 * 盤面上の個々のマス目情報を表します。
 */
interface BoardCell {
  position: number;
  type: CellType;
  effect: number | null;
  isPlayerPosition: boolean;
  activates: number; // 踏んだ回数
}

export class BoardSystem {
  private gameState: GameState;
  private prestigeSystem: PrestigeSystem;
  private random: XorShiftRandom;
  private currentLevel: number = -1; // 現在の盤面レベルをキャッシュ
  private cellDataCache: CellData[] = []; // キャッシュ用の配列

  constructor(gameState: GameState, prestigeSystem: PrestigeSystem) {
    this.random = new XorShiftRandom();
    this.gameState = gameState;
    this.prestigeSystem = prestigeSystem;
  }

  generateBoard(level: number) {
    // レベルと盤面ランダムシードを組み合わせて Random を作成
    const seed = getBoardSeed(this.gameState.boardRandomSeed, level);
    this.random.setStateBySeed(seed);
    this.currentLevel = level;

    // マスのデータを生成
    this.cellDataCache = [];
    for (let i = 0; i < BOARD_CONFIG.TOTAL_CELLS; i++) {
      const cellData = this.createRandomCell(i);
      this.cellDataCache.push(cellData);
    }
  }

  getCellType(position: number, level: number): CellData {
    // レベルが変わった場合は新しい盤面を生成
    if (this.currentLevel !== level) {
      this.generateBoard(level);
    }

    // キャッシュからマスのデータを取得
    if (position < 0 || position >= this.cellDataCache.length) {
      throw new Error(`Invalid position: ${position}`);
    }

    // キャッシュが無いのはおかしいのでエラーを投げる
    if (!this.cellDataCache[position]) {
      throw new Error(`Cell data not found for position: ${position}`);
    }

    // 保存された状態があるかチェック
    const savedState = this.getSavedCellState(level, position);
    if (savedState) {
      // 保存された状態をキャッシュにも反映
      this.cellDataCache[position] = this.convertBoardStateToCellData(savedState);
    }

    return this.cellDataCache[position];
  }

  // 保存された盤面状態を取得
  private getSavedCellState(level: number, position: number): BoardStateDiff | null {
    const levelStates = this.gameState.boardStates[level];
    if (!levelStates) {
      return null;
    }
    return levelStates[position] || null;
  }

  // BoardStateDiff を CellData に変換
  private convertBoardStateToCellData(boardState: BoardStateDiff): CellData {
    return {
      type: boardState.type as CellType,
      effect: boardState.effect,
      activates: boardState.activates || 0, // 初期値は0
    };
  }

  // マス状態を保存
  private saveCellState(level: number, position: number, cellData: CellData): void {
    // レベルごとの状態管理オブジェクトを初期化
    if (!this.gameState.boardStates[level]) {
      this.gameState.boardStates[level] = {};
    }

    // 状態を保存
    this.gameState.boardStates[level][position] = {
      type: cellData.type,
      effect: cellData.effect,
      activates: cellData.activates || 0, // 初期値は0
    };

    // キャッシュも更新
    this.cellDataCache[position] = cellData;
  }

  // マス種類の決定
  private createRandomCell(position: number): CellData {
    // レベル10以降の固定戻るマス処理
    if (this.currentLevel >= FIXED_BACKWARD_CONFIG.START_LEVEL) {
      const fixedBackwardCell = this.checkFixedBackwardCell(position, this.random);
      if (fixedBackwardCell) {
        return fixedBackwardCell;
      }
    }

    // 盤面の後半ほど戻るマスが多くなる（バランス調整済み）
    const backwardRatio = calculateBackwardRatio(
      position,
      CELL_PROBABILITY.BACKWARD_BASE_RATIO,
      CELL_PROBABILITY.BACKWARD_MAX_RATIO
    );
    const forwardRatio = CELL_PROBABILITY.FORWARD_RATIO;
    const creditRatio = CELL_PROBABILITY.CREDIT_RATIO;
    const emptyRatio = 1 - backwardRatio - forwardRatio - creditRatio;

    const rand = this.random.nextFloat();
    if (rand < emptyRatio) {
      return { type: BOARD_CONFIG.CELL_TYPES.EMPTY, effect: null };
    } else if (rand < emptyRatio + creditRatio) {
      // クレジット獲得マス（ボーナスマス判定あり）
      const amount = this.calculateCreditAmount(position, this.currentLevel, this.random);

      // ボーナスマス判定
      const bonusChance = this.getBonusChance();
      const bonusRoll = this.random.nextFloat();

      if (bonusRoll < bonusChance) {
        // ボーナスマスとして生成
        return {
          type: BOARD_CONFIG.CELL_TYPES.CREDIT_BONUS,
          effect: amount,
        };
      } else {
        // 通常クレジットマス
        return {
          type: BOARD_CONFIG.CELL_TYPES.CREDIT,
          effect: amount,
        };
      }
    } else if (rand < emptyRatio + creditRatio + forwardRatio) {
      // 進むマス（1-3マス）
      const steps = this.calculateForwardSteps(this.random);
      return { type: BOARD_CONFIG.CELL_TYPES.FORWARD, effect: steps };
    } else {
      // 戻るマス（1-3マス、レベルペナルティ軽減）
      const steps = this.calculateBackwardSteps(
        this.currentLevel,
        this.random,
        GAME_CONFIG.MAX_BACKWARD_STEPS
      );
      return { type: BOARD_CONFIG.CELL_TYPES.BACKWARD, effect: steps };
    }
  }

  // ボーナスマス出現確率を取得
  private getBonusChance(): number {
    const baseChance = 0.02; // 2%（デフォルト）
    const upgradeLevel = this.gameState.prestigeUpgrades.bonusChance.level;
    const upgradeBonus = upgradeLevel * 0.005; // レベル1につき0.5%追加
    return baseChance + upgradeBonus;
  }

  // ボーナス倍率を取得
  private getBonusMultiplier(): number {
    const baseMultiplier = 20; // 20倍（デフォルト）
    const upgradeLevel = this.gameState.prestigeUpgrades.bonusMultiplier.level;
    const upgradeBonus = upgradeLevel * 5.0; // レベル1につき5.0倍追加
    return baseMultiplier + upgradeBonus;
  }

  // 固定戻るマスのチェック
  private checkFixedBackwardCell(position: number, random: XorShiftRandom): CellData | null {
    // 固定配置エリア外は対象外
    if (position < FIXED_BACKWARD_CONFIG.AREA_START || position > FIXED_BACKWARD_CONFIG.AREA_END) {
      return null;
    }

    // レベルに応じた固定配置数を計算
    const levelProgress = Math.floor(
      (this.currentLevel - FIXED_BACKWARD_CONFIG.START_LEVEL) /
        FIXED_BACKWARD_CONFIG.LEVEL_INCREMENT
    );
    const fixedCount = Math.min(levelProgress + 1, FIXED_BACKWARD_CONFIG.MAX_COUNT);

    // 固定配置する位置を決定（後ろから配置）
    const startFixedPosition = FIXED_BACKWARD_CONFIG.AREA_END - fixedCount + 1;

    if (position >= startFixedPosition) {
      // 固定戻るマスとして配置
      const steps =
        this.calculateBackwardSteps(this.currentLevel, random, GAME_CONFIG.MAX_BACKWARD_STEPS) + 1; // 2-4マス戻る（通常より強め）
      return {
        type: BOARD_CONFIG.CELL_TYPES.BACKWARD,
        effect: steps,
      };
    }

    return null;
  }

  // プレイヤーの移動
  movePlayer(steps: number): MoveResult {
    const oldPosition = this.gameState.position;
    const newPosition = oldPosition + steps;

    // 統計を更新
    this.gameState.stats.totalMoves += steps;

    const moveResult = this.handlePositionChange(newPosition);

    return {
      oldPosition,
      newPosition: this.gameState.position,
      levelChanged: moveResult.levelChanged,
      prestigeEarned: moveResult.prestigeEarned,
    };
  }

  // 位置変更の処理
  private handlePositionChange(newPosition: number): PositionChangeResult {
    let levelChanged = false;
    let prestigeEarned = 0;

    // レベルアップの処理
    if (newPosition >= BOARD_CONFIG.TOTAL_CELLS) {
      const levelsCompleted = Math.floor(newPosition / BOARD_CONFIG.TOTAL_CELLS);
      this.gameState.level += levelsCompleted;
      levelChanged = true;

      // プレステージポイント獲得（レベル50以降）
      if (this.gameState.level >= PRESTIGE_CONFIG.START_LEVEL) {
        prestigeEarned = calculatePrestigePointsForLevel(
          this.gameState.level,
          PRESTIGE_CONFIG.START_LEVEL,
          PRESTIGE_CONFIG.BASE_POINTS
        );

        this.gameState.prestigePoints.earned += prestigeEarned;
        this.gameState.stats.totalPrestigePoints += prestigeEarned;

        console.log(
          `レベル ${this.gameState.level} に到達！プレステージポイント +${prestigeEarned}`
        );
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
  movePlayerDirect(steps: number): MoveResult {
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
        prestigeEarned: moveResult.prestigeEarned,
      };
    }

    this.gameState.position = newPosition;

    // 統計を更新
    this.gameState.stats.totalMoves += Math.abs(steps);

    return {
      oldPosition,
      newPosition,
      levelChanged: false,
      prestigeEarned: 0,
    };
  }

  // マス目の効果を適用
  /**
   * 指定した盤面位置のマス効果を適用する
   *
   * @param position - 効果を適用する盤面位置
   * @param recurseCount - 移動効果用の再帰深度（デフォルト: 0）
   * @returns 適用した {@link SquareEffect} オブジェクト（効果詳細を含む）
   */
  applySquareEffect(position: number, recurseCount: number = 0): SquareEffect {
    const cellData = this.getCellType(position, this.gameState.level);
    const effect: SquareEffect = {
      type: cellData.type,
      value: cellData.effect,
      position: position,
      applied: false,
    };

    switch (cellData.type) {
      case BOARD_CONFIG.CELL_TYPES.EMPTY:
        console.log(`何もなし (位置: ${position})`);
        effect.applied = true;
        break;

      case BOARD_CONFIG.CELL_TYPES.CREDIT:
        if (cellData.effect !== null) {
          const baseAmount = cellData.effect;
          const multiplier = this.prestigeSystem.getCreditMultiplier();
          const finalAmount = Math.floor(baseAmount * multiplier);

          this.gameState.credits += finalAmount;
          this.gameState.stats.totalCreditsEarned += finalAmount;
          console.log(
            `クレジット +${finalAmount} (基本: ${baseAmount}, 倍率: ${multiplier.toFixed(1)}x) (位置: ${position})`
          );
        }
        effect.applied = true;
        break;

      case BOARD_CONFIG.CELL_TYPES.CREDIT_BONUS:
        if (cellData.effect !== null) {
          // ボーナスマス効果を適用
          const baseAmount = cellData.effect;
          const bonusMultiplier = this.getBonusMultiplier();
          const prestigeMultiplier = this.prestigeSystem.getCreditMultiplier();
          const finalAmount = Math.floor(baseAmount * bonusMultiplier * prestigeMultiplier);

          this.gameState.credits += finalAmount;
          this.gameState.stats.totalCreditsEarned += finalAmount;
          console.log(
            `🌟ボーナスクレジット +${finalAmount} (基本: ${baseAmount}, ボーナス: ${bonusMultiplier}x, プレステージ: ${prestigeMultiplier.toFixed(1)}x) (位置: ${position})`
          );
        }
        effect.applied = true;
        break;

      case BOARD_CONFIG.CELL_TYPES.FORWARD:
        if (cellData.effect !== null && recurseCount === 0) {
          console.log(`${cellData.effect}マス進む! (位置: ${position})`);
          // 移動を実行（再帰的な効果は無視）
          const forwardResult = this.movePlayerDirect(cellData.effect);
          effect.moveResult = forwardResult;
          effect.levelChanged = forwardResult.levelChanged;
          effect.prestigeEarned = forwardResult.prestigeEarned;

          // 移動先のマス効果を適用するため、再帰的に呼び出す
          this.applySquareEffect(forwardResult.newPosition, recurseCount + 1);
        }
        effect.applied = true;
        break;

      case BOARD_CONFIG.CELL_TYPES.BACKWARD:
        if (cellData.effect !== null && recurseCount === 0) {
          console.log(`${cellData.effect}マス戻る... (位置: ${position})`);
          // 移動を実行（再帰的な効果は無視、0マス目を下回らないよう制限）
          const maxBackwardSteps = Math.min(cellData.effect, this.gameState.position);
          const backwardResult = this.movePlayerDirect(-maxBackwardSteps);
          effect.moveResult = backwardResult;
          effect.levelChanged = backwardResult.levelChanged;
          effect.prestigeEarned = backwardResult.prestigeEarned;

          // 移動先のマス効果を適用するため、再帰的に呼び出す
          this.applySquareEffect(backwardResult.newPosition, recurseCount + 1);
        }
        effect.applied = true;
        break;
    }

    // 踏んだ回数を更新
    const updatedCellData = {
      ...cellData,
      activates: (cellData.activates || 0) + 1, // 踏んだ回数を1増やす
    };

    // 状態を保存
    this.saveCellState(this.gameState.level, position, updatedCellData);

    return effect;
  }

  // 現在の位置情報取得
  getCurrentPositionInfo(): PositionInfo {
    return {
      position: this.gameState.position,
      level: this.gameState.level,
      cellData: this.getCellType(this.gameState.position, this.gameState.level),
    };
  }

  // 盤面の完全な情報取得（UI生成用）
  getBoardData(): BoardCell[] {
    const boardData: BoardCell[] = [];
    for (let i = 0; i < BOARD_CONFIG.TOTAL_CELLS; i++) {
      const cellData = this.getCellType(i, this.gameState.level);
      boardData.push({
        position: i,
        type: cellData.type,
        effect: cellData.effect,
        isPlayerPosition: i === this.gameState.position,
        activates: cellData.activates || 0, // 踏んだ回数
      });
    }
    return boardData;
  }

  // 実際の獲得クレジット計算（UI表示用）
  calculateActualCredit(baseAmount: number, isBonus: boolean = false): number {
    if (isBonus) {
      const bonusMultiplier = this.getBonusMultiplier();
      const prestigeMultiplier = this.prestigeSystem.getCreditMultiplier();
      return Math.floor(baseAmount * bonusMultiplier * prestigeMultiplier);
    } else {
      const prestigeMultiplier = this.prestigeSystem.getCreditMultiplier();
      return Math.floor(baseAmount * prestigeMultiplier);
    }
  }

  // クレジット獲得量計算
  private calculateCreditAmount(position: number, level: number, random: XorShiftRandom): number {
    // 基礎値: 定数から取得
    const baseAmount = CREDIT_CONFIG.BASE_AMOUNT;
    // レベルボーナス: レベルに応じて増加、べき乗算
    const multLevel = Math.pow(
      CREDIT_CONFIG.LEVEL_SCALING_BASE,
      level / CREDIT_CONFIG.LEVEL_SCALING_DIVISOR
    );
    // 位置ボーナス: 位置に応じて増加
    const multPosition = 1.0 + (position + 1.0) / CREDIT_CONFIG.POSITION_BONUS_DIVISOR;
    // ランダムボーナス: 範囲をCREDIT_CONFIGから取得
    const randomBonus = random.nextFloat() * CREDIT_CONFIG.RANDOM_RANGE + CREDIT_CONFIG.RANDOM_MIN;
    // クレジット量の計算
    return Math.max(1, Math.floor(baseAmount * multLevel * multPosition * randomBonus));
  }

  // 戻るマスステップ数計算
  private calculateBackwardSteps(level: number, random: XorShiftRandom, maxSteps: number): number {
    return (
      Math.floor(
        random.nextFloat() * CALCULATION_CONSTANTS.BACKWARD_STEPS_RANGE +
          Math.min(level / CALCULATION_CONSTANTS.BACKWARD_LEVEL_DIVISOR, maxSteps)
      ) + 1
    );
  }

  // 進むマスステップ数計算
  private calculateForwardSteps(random: XorShiftRandom): number {
    return Math.floor(random.nextFloat() * CALCULATION_CONSTANTS.FORWARD_STEPS_RANGE) + 1;
  }
}
