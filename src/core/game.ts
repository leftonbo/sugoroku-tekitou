/**
 * すごろくインクリメンタルゲーム メインクラス
 * ゲーム全体の統合管理とシステム間の連携を担当します。
 */

// モジュールのインポート
import { GameLoop } from './game-loop.js';
import {
  loadGameState,
  setupAutoSave,
  saveGameState,
  clearSaveData,
  debugShowStorageData,
  enableAutoSave,
  exportGameData,
  importGameData,
  createBackupBeforeImport,
  getExportFileName,
  createExportBlob,
} from '../data/storage-manager.js';
import { BoardSystem } from '../systems/board-system.js';
import { DiceSystem } from '../systems/dice-system.js';
import { PrestigeSystem } from '../systems/prestige-system.js';
import { UpgradeSystem } from '../systems/upgrade-system.js';
import type { GameState } from '../types/game-state.js';
import { AnimationManager } from '../ui/animation-manager.js';
import { UIManager } from '../ui/ui-manager.js';

/**
 * ストレージシステムの型定義
 * セーブデータの保存・読み込み・管理機能を提供します。
 */
interface StorageSystem {
  saveGameState: () => boolean;
  exportGameData: (gameState: GameState) => string | null;
  importGameData: (data: string) => any;
  createBackupBeforeImport: (gameState: GameState) => string | null;
  getExportFileName: () => string;
  createExportBlob: (data: string) => Blob;
  clearSaveData: (createBackup?: boolean) => any;
  debugShowStorageData: () => any;
  enableAutoSave: () => boolean;
  gameState: GameState;
}

/**
 * システムの型定義
 * ゲームの各サブシステムを統合管理します。
 */
interface Systems {
  dice: DiceSystem;
  board: BoardSystem;
  upgrade: UpgradeSystem;
  prestige: PrestigeSystem;
  storage?: StorageSystem;
  gameLoop?: GameLoop;
}

/**
 * デバッグ情報の型定義
 * デバッグ時に参照される情報を提供します。
 */
interface DebugInfo {
  gameState: GameState;
  gameLoop: any;
  systems: {
    dice: any;
    board: any;
    upgrade: any;
    prestige: any;
  };
}

/**
 * パフォーマンス統計の型定義
 * ゲームのパフォーマンス情報を監視します。
 */
interface PerformanceStats {
  fps: number;
  isRunning: boolean;
  totalCredits: number;
  currentLevel: number;
  autoDiceCount: number;
  totalStats: any;
}

/**
 * グローバル型拡張
 * ブラウザのwindowオブジェクトにゲーム関連の機能を追加します。
 */
declare global {
  interface Window {
    sugorokuGame: SugorokuGame;
    debugGame: () => void;
    resetGame: () => void;
    pauseGame: () => void;
    resumeGame: () => void;
  }
}

/**
 * すごろくインクリメンタルゲームのメインクラス
 * 全システムの統合管理とライフサイクル管理を担当します。
 */
export class SugorokuGame {
  private gameState: GameState | null;
  private systems: Systems;
  private animationManager: AnimationManager | null;
  private uiManager: UIManager | null;
  private gameLoop: GameLoop | null;
  private autoSaveCleanup: (() => void) | null;

  /**
   * コンストラクタ
   * ゲーム全体の初期化を実行します。
   */
  constructor() {
    // ゲーム状態の初期化
    this.gameState = null;

    // システムの初期化
    this.systems = {} as Systems;
    this.animationManager = null;
    this.uiManager = null;
    this.gameLoop = null;

    // 自動保存のクリーンアップ関数
    this.autoSaveCleanup = null;

    // ゲーム初期化
    this.init();
  }

  /**
   * ゲーム初期化
   * 全システムを順次初期化してゲームを開始可能状態にします。
   */
  async init(): Promise<void> {
    try {
      // ゲーム状態を読み込み
      this.gameState = loadGameState();

      // 各システムを初期化
      this.initializeSystems();

      // UI初期化
      this.initializeUI();

      // 自動保存設定
      this.setupAutoSave();

      // ゲームループ開始
      this.startGameLoop();

      console.log('すごろくインクリメンタルゲームが開始されました！');
    } catch (error) {
      console.error('ゲームの初期化に失敗しました:', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * システムの初期化
   * 各サブシステムを適切な順序で初期化します。
   */
  private initializeSystems(): void {
    if (!this.gameState) {
      throw new Error('ゲーム状態が初期化されていません');
    }

    // プレステージシステムを最初に初期化
    const prestigeSystem = new PrestigeSystem(this.gameState);

    this.systems = {
      prestige: prestigeSystem,
      dice: new DiceSystem(this.gameState, prestigeSystem),
      board: new BoardSystem(this.gameState, prestigeSystem),
      upgrade: new UpgradeSystem(this.gameState),
    };
  }

  // UI初期化
  private initializeUI(): void {
    if (!this.gameState) {
      throw new Error('ゲーム状態が初期化されていません');
    }

    this.animationManager = new AnimationManager();
    this.uiManager = new UIManager(
      this.gameState,
      this.systems as Required<Systems>,
      this.animationManager
    );

    // UIManagerの初期化（デバッグモード設定を含む）
    this.uiManager.initialize();
  }

  // 自動保存設定
  private setupAutoSave(): void {
    this.autoSaveCleanup = setupAutoSave(() => this.gameState as GameState);
  }

  // ゲームループ開始
  private startGameLoop(): void {
    if (!this.gameState || !this.uiManager) {
      throw new Error('必要なコンポーネントが初期化されていません');
    }

    this.gameLoop = new GameLoop(this.gameState, this.systems, this.uiManager);

    // デバッグ用にsystemsにstorageとgameLoopの参照を追加
    this.systems.storage = {
      saveGameState: () => this.saveGame(),
      exportGameData: (gameState: GameState) => exportGameData(gameState),
      importGameData: (data: string) => importGameData(data),
      createBackupBeforeImport: (gameState: GameState) => createBackupBeforeImport(gameState),
      getExportFileName: () => getExportFileName(),
      createExportBlob: (data: string) => createExportBlob(data),
      clearSaveData: this.clearSaveData.bind(this),
      debugShowStorageData: this.debugShowStorageData.bind(this),
      enableAutoSave: this.enableAutoSave.bind(this),
      gameState: this.gameState,
    };
    this.systems.gameLoop = this.gameLoop;

    this.gameLoop.start();
  }

  // ゲーム保存
  saveGame(): boolean {
    if (!this.gameState) {
      return false;
    }
    return saveGameState(this.gameState);
  }

  // デバッグ: セーブデータ削除
  clearSaveData(createBackup: boolean = true): any {
    return clearSaveData(createBackup);
  }

  // デバッグ: ストレージデータ表示
  debugShowStorageData(): any {
    return debugShowStorageData();
  }

  // デバッグ: 自動保存再有効化
  enableAutoSave(): boolean {
    return enableAutoSave();
  }

  // 初期化エラーの処理
  private handleInitializationError(error: any): void {
    console.error('ゲーム初期化エラー:', error);

    // エラー画面を表示
    document.body.innerHTML = `
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="alert alert-danger text-center">
                            <h4>ゲームの初期化に失敗しました</h4>
                            <p>ページを再読み込みしてください。</p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                再読み込み
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  // ゲームの一時停止
  pause(): void {
    if (this.gameLoop) {
      this.gameLoop.pause();
    }
  }

  // ゲームの再開
  resume(): void {
    if (this.gameLoop) {
      this.gameLoop.resume();
    }
  }

  // ゲームの完全停止
  stop(): void {
    // ゲームループ停止
    if (this.gameLoop) {
      this.gameLoop.stop();
    }

    // 自動保存停止
    if (this.autoSaveCleanup) {
      this.autoSaveCleanup();
    }

    // アニメーションクリーンアップ
    if (this.animationManager) {
      this.animationManager.cleanupAllAnimations();
    }

    console.log('ゲームを停止しました');
  }

  // デバッグ情報の取得
  getDebugInfo(): DebugInfo {
    return {
      gameState: this.gameState as GameState,
      gameLoop: this.gameLoop?.getDebugInfo() || null,
      systems: {
        dice: this.systems.dice?.getAllAutoDiceInfo() || null,
        board: this.systems.board?.getCurrentPositionInfo() || null,
        upgrade: this.systems.upgrade?.getAllUpgradeInfo() || null,
        prestige: this.systems.prestige?.getPrestigeInfo() || null,
      },
    };
  }

  // 手動でUI更新を強制実行
  forceUpdate(): void {
    if (this.uiManager) {
      this.uiManager.updateUI();
    }
    if (this.gameLoop) {
      this.gameLoop.forceUIUpdate();
    }
  }

  // ゲーム状態のリセット（デバッグ用）
  resetGame(): void {
    if (confirm('ゲームをリセットしますか？すべての進行状況が失われます。')) {
      localStorage.removeItem('sugoroku-game-state');
      location.reload();
    }
  }

  // パフォーマンス統計取得
  getPerformanceStats(): PerformanceStats {
    const debugInfo = this.getDebugInfo();

    return {
      fps: debugInfo.gameLoop?.fps || 0,
      isRunning: debugInfo.gameLoop?.isRunning || false,
      totalCredits: this.gameState?.credits || 0,
      currentLevel: this.gameState?.level || 1,
      autoDiceCount: this.gameState?.autoDice?.filter(d => d.level > 0).length || 0,
      totalStats: this.gameState?.stats || {},
    };
  }
}

// ページ読み込み完了時にゲーム開始
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.sugorokuGame = new SugorokuGame();

    // デバッグ用のグローバル関数
    window.debugGame = () => console.log(window.sugorokuGame.getDebugInfo());
    window.resetGame = () => window.sugorokuGame.resetGame();
    window.pauseGame = () => window.sugorokuGame.pause();
    window.resumeGame = () => window.sugorokuGame.resume();
  } catch (error) {
    console.error('ゲームの作成に失敗しました:', error);
  }
});
