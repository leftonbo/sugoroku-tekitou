// ゲームループ管理

import { GAME_CONFIG } from '../utils/constants.js';

export class GameLoop {
    constructor(gameState, systems, uiManager) {
        this.gameState = gameState;
        this.systems = systems;
        this.uiManager = uiManager;
        this.isRunning = false;
        this.animationId = null;
        this.lastUpdateTime = 0;
    }

    // ゲームループの開始
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastUpdateTime = performance.now();
        
        // 全自動ダイスのlastRollを初期化
        this.systems.dice.initializeAutoDiceTimers(this.lastUpdateTime);
        
        console.log('ゲームループを開始しました');
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    // ゲームループの停止
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        console.log('ゲームループを停止しました');
    }

    // メインゲームループ
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // デルタタイム計算
        const deltaTime = currentTime - this.lastUpdateTime;
        
        // 更新頻度制御（60FPSを目標）
        if (deltaTime >= GAME_CONFIG.TICK_RATE) {
            this.update(currentTime, deltaTime);
            this.lastUpdateTime = currentTime;
        }
        
        // 次のフレームをスケジュール
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    // ゲーム状態の更新
    update(currentTime, deltaTime) {
        // 自動ダイスのタイマーチェック
        const rolledDice = this.systems.dice.checkAutoDiceTimers(currentTime);
        
        // 自動ダイスが振られた場合の処理
        if (rolledDice.length > 0) {
            this.handleAutoDiceRolls(rolledDice);
        }
        
        // UI更新（クールダウンゲージ用）
        this.uiManager.updateAutoDiceCooldowns();
    }

    // 自動ダイスの結果処理
    handleAutoDiceRolls(rolledDice) {
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
                console.log(`自動ダイス: ${rolledDice[0].faces}面 = ${rolledDice[0].result}`);
            } else {
                const rollDetails = rolledDice.map(r => `${r.faces}面=${r.result}`).join(', ');
                console.log(`自動ダイス複数: ${rollDetails} 合計=${totalSteps}`);
            }
        }
    }

    // ゲームの一時停止
    pause() {
        if (this.isRunning) {
            this.stop();
            console.log('ゲームを一時停止しました');
        }
    }

    // ゲームの再開
    resume() {
        if (!this.isRunning) {
            this.start();
            console.log('ゲームを再開しました');
        }
    }

    // ゲームループの状態取得
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastUpdateTime: this.lastUpdateTime,
            animationId: this.animationId
        };
    }

    // デバッグ情報の取得
    getDebugInfo() {
        const status = this.getStatus();
        return {
            ...status,
            fps: this.isRunning ? Math.round(1000 / GAME_CONFIG.TICK_RATE) : 0,
            targetFrameTime: GAME_CONFIG.TICK_RATE,
            gameState: {
                position: this.gameState.position,
                level: this.gameState.level,
                credits: this.gameState.credits,
                autoDiceCount: this.gameState.autoDice.filter(d => d.unlocked).length
            }
        };
    }

    // 強制的なUI更新
    forceUIUpdate() {
        this.uiManager.updateUI();
    }

    // ゲームループのリセット
    reset() {
        this.stop();
        this.lastUpdateTime = 0;
        console.log('ゲームループをリセットしました');
    }
}