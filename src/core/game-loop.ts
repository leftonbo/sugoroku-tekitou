/**
 * ゲームループ管理
 *
 * このシステムは以下の機能を提供します：
 * - ゲームループ管理：60fpsでの安定したゲーム更新
 * - パフォーマンス監視：FPS計測と最適化
 * - デバッグ機能：ゲーム状態のリアルタイム監視
 * - 一時停止・再開機能
 */

import type { BoardSystem } from '../systems/board-system.js';
import type { DiceSystem } from '../systems/dice-system.js';
import type { PrestigeSystem } from '../systems/prestige-system.js';
import type { UpgradeSystem } from '../systems/upgrade-system.js';
import type { GameState } from '../types/game-state.js';
import type { UIManager } from '../ui/ui-manager.js';
import { GAME_CONFIG } from '../utils/constants.js';

/**
 * システムの型定義
 * ゲームループで使用される各システムを統合管理します。
 */
interface Systems {
  dice: DiceSystem;
  board: BoardSystem;
  upgrade: UpgradeSystem;
  prestige: PrestigeSystem;
}

/**
 * 自動ダイス結果の型定義
 * ゲームループ内で使用される自動ダイスの結果を表します。
 */
interface AutoDiceRoll {
  index: number;
  faces: number;
  result: number;
}

// 移動結果の型定義は../types/game-state.tsで定義済み

/**
 * ゲームループ状態の型定義
 * ゲームループの実行状態を管理します。
 */
interface GameLoopStatus {
  isRunning: boolean;
  lastUpdateTime: number;
  animationId: number | null;
}

/**
 * デバッグ情報の型定義
 * ゲームループのデバッグ情報を提供します。
 */
interface DebugInfo extends GameLoopStatus {
  fps: number;
  targetFrameTime: number;
  currentTick: number;
  gameState: {
    position: number;
    level: number;
    credits: number;
    autoDiceCount: number;
  };
}

/**
 * 詳細デバッグ情報の型定義
 * より詳細なデバッグ情報を提供します。
 */
interface DetailedDebugInfo extends DebugInfo {
  timestamp: number;
  autoDice: Array<{
    index: number;
    faces: number;
    unlocked: boolean;
    count: number;
    level: number;
    progress: number;
    interval: number;
  }>;
  prestigeInfo: any;
  upgradeInfo: any;
}

export class GameLoop {
  private gameState: GameState;
  private systems: Systems;
  private uiManager: UIManager;
  private isRunning: boolean;
  private animationId: number | null;
  private lastUpdateTime: number;
  private currentTick: number;

  constructor(gameState: GameState, systems: Systems, uiManager: UIManager) {
    this.gameState = gameState;
    this.systems = systems;
    this.uiManager = uiManager;
    this.isRunning = false;
    this.animationId = null;
    this.lastUpdateTime = 0;
    this.currentTick = 0;
  }

  // ゲームループの開始
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastUpdateTime = performance.now();

    console.log('ゲームループを開始しました');
    this.animationId = requestAnimationFrame(time => this.gameLoop(time));
  }

  // ゲームループの停止
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    console.log('ゲームループを停止しました');
  }

  // メインゲームループ
  private gameLoop(currentTime: number): void {
    if (!this.isRunning) return;

    // デルタタイム計算
    const deltaTime = currentTime - this.lastUpdateTime;

    // 更新頻度制御（60FPSを目標）
    if (deltaTime >= GAME_CONFIG.TICK_RATE) {
      this.lastUpdateTime = currentTime;
      this.tick();
    }

    // 次のフレームをスケジュール
    this.animationId = requestAnimationFrame(time => this.gameLoop(time));
  }

  // ゲーム状態の更新（Tick-based）
  private tick(): void {
    // 自動ダイスのタイマーチェック
    const rolledDice = this.systems.dice.checkAutoDiceTimers();

    // 自動ダイスが振られた場合の処理
    if (rolledDice.length > 0) {
      this.handleAutoDiceRolls(rolledDice);
    }

    // UI更新（自動ダイス進捗ゲージ用）
    this.updateAutoDiceUI();

    // ティックカウンターを増加
    this.currentTick++;
  }

  // 自動ダイスの結果処理
  private handleAutoDiceRolls(rolledDice: AutoDiceRoll[]): void {
    let totalSteps = 0;

    // 全ての自動ダイス結果を合計
    rolledDice.forEach(diceRoll => {
      totalSteps += diceRoll.result;
    });

    if (totalSteps > 0) {
      // プレイヤーを移動
      const moveResult = this.systems.board.movePlayer(totalSteps);
      this.uiManager.handlePlayerMove(moveResult);

      // ログ出力
      if (rolledDice.length === 1) {
        console.log(`自動ダイス: ${rolledDice[0]!.faces}面 = ${rolledDice[0]!.result}`);
      } else {
        const rollDetails = rolledDice.map(r => `${r.faces}面=${r.result}`).join(', ');
        console.log(`自動ダイス複数: ${rollDetails} 合計=${totalSteps}`);
      }
    }
  }

  // ゲームの一時停止
  pause(): void {
    if (this.isRunning) {
      this.stop();
      console.log('ゲームを一時停止しました');
    }
  }

  // ゲームの再開
  resume(): void {
    if (!this.isRunning) {
      this.start();
      console.log('ゲームを再開しました');
    }
  }

  // 一時停止状態の確認
  isPaused(): boolean {
    return !this.isRunning;
  }

  // 1ステップ実行（デバッグ用）
  step(): void {
    this.stepOneTick();
  }

  // ゲームループの状態取得
  getStatus(): GameLoopStatus {
    return {
      isRunning: this.isRunning,
      lastUpdateTime: this.lastUpdateTime,
      animationId: this.animationId,
    };
  }

  // デバッグ情報の取得
  getDebugInfo(): DebugInfo {
    const status = this.getStatus();
    return {
      ...status,
      fps: this.isRunning ? Math.round(1000 / GAME_CONFIG.TICK_RATE) : 0,
      targetFrameTime: GAME_CONFIG.TICK_RATE,
      currentTick: this.currentTick,
      gameState: {
        position: this.gameState.position,
        level: this.gameState.level,
        credits: this.gameState.credits,
        autoDiceCount: this.gameState.autoDice.filter(d => d.level > 0).length,
      },
    };
  }

  // 強制的なUI更新
  forceUIUpdate(): void {
    this.uiManager.updateUI();
  }

  // 自動ダイスUI更新（毎Tick呼び出し）
  private updateAutoDiceUI(): void {
    // 軽量な自動ダイス進捗更新のみ
    this.uiManager.updateExistingAutoDice();
  }

  // ゲームループのリセット
  reset(): void {
    this.stop();
    this.lastUpdateTime = 0;
    this.currentTick = 0;
    console.log('ゲームループをリセットしました');
  }

  // デバッグ: 1Tick分だけ進める
  stepOneTick(): boolean {
    if (this.isRunning) {
      console.warn('ゲームが実行中です。一時停止してから使用してください。');
      return false;
    }

    const currentTime = performance.now();

    console.log('デバッグ: 1Tick実行中...');
    this.tick();
    this.lastUpdateTime = currentTime;

    console.log('デバッグ: 1Tick完了');
    return true;
  }

  // デバッグ: ゲーム状態の詳細情報取得
  getDetailedDebugInfo(): DetailedDebugInfo {
    const baseInfo = this.getDebugInfo();
    const autoDiceInfo = this.gameState.autoDice.map((dice, index) => {
      const diceInfo = this.systems.dice.getAutoDiceInfo(index);
      return {
        index,
        faces: dice.faces,
        unlocked: dice.level > 0,
        count: diceInfo?.count || 1,
        level: dice.level,
        progress: dice.progress,
        interval: this.systems.dice.getAutoDiceInterval(index),
      };
    });

    return {
      ...baseInfo,
      timestamp: Date.now(),
      autoDice: autoDiceInfo,
      prestigeInfo: this.systems.prestige.getPrestigeInfo(),
      upgradeInfo: this.systems.upgrade.getAllUpgradeInfo(),
    };
  }
}
