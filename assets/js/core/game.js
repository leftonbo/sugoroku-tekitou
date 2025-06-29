// すごろくインクリメンタルゲーム メインクラス

// モジュールのインポート
import { loadGameState, setupAutoSave, saveGameState } from '../data/storage-manager.js';
import { DiceSystem } from '../systems/dice-system.js';
import { BoardSystem } from '../systems/board-system.js';
import { UpgradeSystem } from '../systems/upgrade-system.js';
import { PrestigeSystem } from '../systems/prestige-system.js';
import { AnimationManager } from '../ui/animation-manager.js';
import { UIManager } from '../ui/ui-manager.js';
import { GameLoop } from './game-loop.js';

export class SugorokuGame {
    constructor() {
        // ゲーム状態の初期化
        this.gameState = null;
        
        // システムの初期化
        this.systems = {};
        this.animationManager = null;
        this.uiManager = null;
        this.gameLoop = null;
        
        // 自動保存のクリーンアップ関数
        this.autoSaveCleanup = null;
        
        // ゲーム初期化
        this.init();
    }
    
    // ゲーム初期化
    async init() {
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
    
    // システムの初期化
    initializeSystems() {
        this.systems = {
            dice: new DiceSystem(this.gameState),
            board: new BoardSystem(this.gameState),
            upgrade: new UpgradeSystem(this.gameState),
            prestige: new PrestigeSystem(this.gameState),
            storage: { 
                saveGameState: () => this.saveGame(),
                gameState: this.gameState
            }
        };
    }
    
    // UI初期化
    initializeUI() {
        this.animationManager = new AnimationManager();
        this.uiManager = new UIManager(this.gameState, this.systems, this.animationManager);
        
        // DOM要素のバインド
        this.uiManager.bindDOMElements();
        
        // イベントリスナーの設定
        this.uiManager.setupEventListeners();
        
        // ゲームボードの生成
        this.uiManager.generateGameBoard();
        
        // UI更新
        this.uiManager.updateUI();
    }
    
    // 自動保存設定
    setupAutoSave() {
        this.autoSaveCleanup = setupAutoSave(() => this.gameState);
    }
    
    // ゲームループ開始
    startGameLoop() {
        this.gameLoop = new GameLoop(this.gameState, this.systems, this.uiManager);
        this.gameLoop.start();
    }
    
    // ゲーム保存
    saveGame() {
        return saveGameState(this.gameState);
    }
    
    // 初期化エラーの処理
    handleInitializationError(error) {
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
    pause() {
        if (this.gameLoop) {
            this.gameLoop.pause();
        }
    }
    
    // ゲームの再開
    resume() {
        if (this.gameLoop) {
            this.gameLoop.resume();
        }
    }
    
    // ゲームの完全停止
    stop() {
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
    getDebugInfo() {
        return {
            gameState: this.gameState,
            gameLoop: this.gameLoop?.getDebugInfo() || null,
            systems: {
                dice: this.systems.dice?.getAllAutoDiceInfo() || null,
                board: this.systems.board?.getCurrentPositionInfo() || null,
                upgrade: this.systems.upgrade?.getAllUpgradeInfo() || null,
                prestige: this.systems.prestige?.getPrestigeInfo() || null
            }
        };
    }
    
    // 手動でUI更新を強制実行
    forceUpdate() {
        if (this.uiManager) {
            this.uiManager.updateUI();
        }
        if (this.gameLoop) {
            this.gameLoop.forceUIUpdate();
        }
    }
    
    // ゲーム状態のリセット（デバッグ用）
    resetGame() {
        if (confirm('ゲームをリセットしますか？すべての進行状況が失われます。')) {
            localStorage.removeItem('sugoroku-game-state');
            location.reload();
        }
    }
    
    // パフォーマンス統計取得
    getPerformanceStats() {
        const debugInfo = this.getDebugInfo();
        
        return {
            fps: debugInfo.gameLoop?.fps || 0,
            isRunning: debugInfo.gameLoop?.isRunning || false,
            totalCredits: this.gameState?.credits || 0,
            currentLevel: this.gameState?.level || 1,
            autoDiceCount: this.gameState?.autoDice?.filter(d => d.unlocked).length || 0,
            totalStats: this.gameState?.stats || {}
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