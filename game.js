// すごろくインクリメンタルゲーム メインロジック

class SugorokuGame {
    constructor() {
        // ゲーム状態の初期化
        this.gameState = {
            credits: 0,                 // クレジット
            position: 0,                // 現在位置
            prestigePoints: 0,          // プレステージポイント
            totalMoves: 0,              // 総移動数
            
            // サイコロ関連
            dice: [
                { faces: 6, count: 1, unlocked: true }  // 6面ダイス x1個
            ],
            
            // アップグレード状態
            upgrades: {
                autoSpeed: 0,           // 自動化速度レベル
                diceUpgrades: {         // サイコロアップグレード
                    d2: 0, d4: 0, d6: 1, d8: 0, d10: 0, d12: 0, d20: 0
                }
            },
            
            // 自動化設定
            autoRoll: false,
            autoRollInterval: 3000,     // ミリ秒
            
            // ゲーム設定
            settings: {
                tickRate: 1000 / 60     // 60fps (16.67ms per tick)
            }
        };
        
        // 内部状態
        this.isRunning = false;
        this.lastAutoRoll = 0;
        this.animationId = null;
        
        // DOM要素の参照
        this.elements = {};
        
        // ゲーム初期化
        this.init();
    }
    
    // ゲーム初期化
    init() {
        this.loadGameState();
        this.bindDOMElements();
        this.setupEventListeners();
        this.generateGameBoard();
        this.updateUI();
        this.startGameLoop();
        
        console.log('すごろくインクリメンタルゲームが開始されました！');
    }
    
    // DOM要素のバインド
    bindDOMElements() {
        this.elements = {
            // ゲーム情報
            credits: document.getElementById('credits'),
            position: document.getElementById('position'),
            prestigePoints: document.getElementById('prestige-points'),
            
            // サイコロ
            diceResult: document.getElementById('dice-result'),
            rollDiceBtn: document.getElementById('roll-dice'),
            autoRollCheck: document.getElementById('auto-roll'),
            
            // ゲームボード
            gameBoard: document.getElementById('game-board'),
            
            // アップグレード
            upgradeAutoSpeed: document.getElementById('upgrade-auto-speed'),
            autoSpeedCost: document.getElementById('auto-speed-cost'),
            autoInterval: document.getElementById('auto-interval'),
            diceUpgrades: document.getElementById('dice-upgrades'),
            
            // プレステージ
            prestigeBtn: document.getElementById('prestige-btn')
        };
    }
    
    // イベントリスナーの設定
    setupEventListeners() {
        // サイコロを振るボタン
        this.elements.rollDiceBtn.addEventListener('click', () => {
            if (!this.isRunning) return;
            this.rollDice();
        });
        
        // 自動サイコロチェックボックス
        this.elements.autoRollCheck.addEventListener('change', (e) => {
            this.gameState.autoRoll = e.target.checked;
            this.saveGameState();
            
            if (this.gameState.autoRoll) {
                document.body.classList.add('auto-rolling');
            } else {
                document.body.classList.remove('auto-rolling');
            }
        });
        
        // 自動化速度アップグレード
        this.elements.upgradeAutoSpeed.addEventListener('click', () => {
            this.purchaseAutoSpeedUpgrade();
        });
        
        // プレステージボタン
        this.elements.prestigeBtn.addEventListener('click', () => {
            this.prestige();
        });
        
        // 定期保存（30秒ごと）
        setInterval(() => {
            this.saveGameState();
        }, 30000);
        
        // ページ離脱時の保存
        window.addEventListener('beforeunload', () => {
            this.saveGameState();
        });
    }
    
    // ゲームボードの生成
    generateGameBoard() {
        const board = this.elements.gameBoard;
        board.innerHTML = '';
        
        // 100マスのゲームボードを生成
        for (let i = 0; i < 100; i++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.position = i;
            
            // マス番号
            const cellNumber = document.createElement('div');
            cellNumber.className = 'cell-number';
            cellNumber.textContent = i;
            cell.appendChild(cellNumber);
            
            // マスの種類を決定（現在は全てクレジットマス）
            const effectDiv = document.createElement('div');
            effectDiv.className = 'cell-effect';
            effectDiv.textContent = '💰+' + Math.max(1, Math.floor(i / 10) + 1);
            cell.appendChild(effectDiv);
            
            cell.classList.add('credit');
            
            board.appendChild(cell);
        }
        
        this.updatePlayerPosition();
    }
    
    // プレイヤー位置の更新
    updatePlayerPosition() {
        // 既存のプレイヤー位置をクリア
        document.querySelectorAll('.player-position').forEach(cell => {
            cell.classList.remove('player-position');
            const icon = cell.querySelector('.player-icon');
            if (icon) icon.remove();
        });
        
        // 新しい位置にプレイヤーアイコンを配置
        const currentCell = document.querySelector(`[data-position="${this.gameState.position}"]`);
        if (currentCell) {
            currentCell.classList.add('player-position');
            
            const playerIcon = document.createElement('div');
            playerIcon.className = 'player-icon';
            playerIcon.textContent = '🚀';
            currentCell.appendChild(playerIcon);
        }
    }
    
    // サイコロを振る
    rollDice() {
        let totalRoll = 0;
        
        // 各サイコロを振る
        this.gameState.dice.forEach(diceType => {
            if (diceType.unlocked && diceType.count > 0) {
                for (let i = 0; i < diceType.count; i++) {
                    totalRoll += Math.floor(Math.random() * diceType.faces) + 1;
                }
            }
        });
        
        // サイコロ結果を表示
        this.elements.diceResult.textContent = totalRoll;
        this.elements.diceResult.style.animation = 'none';
        setTimeout(() => {
            this.elements.diceResult.style.animation = 'diceRoll 0.5s ease-in-out';
        }, 10);
        
        // プレイヤーを移動
        this.movePlayer(totalRoll);
        
        console.log(`サイコロの目: ${totalRoll}`);
    }
    
    // プレイヤーの移動
    movePlayer(steps) {
        const oldPosition = this.gameState.position;
        this.gameState.position = (this.gameState.position + steps) % 100;
        this.gameState.totalMoves += steps;
        
        // マス目の効果を適用
        this.applySquareEffect(this.gameState.position);
        
        // 100マス到達でプレステージポイント獲得
        if (oldPosition + steps >= 100) {
            const lapsCompleted = Math.floor((oldPosition + steps) / 100);
            this.gameState.prestigePoints += lapsCompleted;
            console.log(`${lapsCompleted}周完了！プレステージポイント +${lapsCompleted}`);
        }
        
        // UI更新
        this.updatePlayerPosition();
        this.updateUI();
    }
    
    // マス目の効果を適用
    applySquareEffect(position) {
        // 現在は全てクレジットマス
        const creditGain = Math.max(1, Math.floor(position / 10) + 1);
        this.gameState.credits += creditGain;
        
        // マス目にアニメーション効果
        const cell = document.querySelector(`[data-position="${position}"]`);
        if (cell) {
            cell.classList.add('credit-gain');
            setTimeout(() => {
                cell.classList.remove('credit-gain');
            }, 800);
        }
        
        console.log(`クレジット +${creditGain} (位置: ${position})`);
    }
    
    // 自動化速度アップグレードの購入
    purchaseAutoSpeedUpgrade() {
        const cost = this.getAutoSpeedUpgradeCost();
        
        if (this.gameState.credits >= cost) {
            this.gameState.credits -= cost;
            this.gameState.upgrades.autoSpeed++;
            
            // 自動化間隔を短縮
            this.updateAutoRollInterval();
            this.updateUI();
            this.saveGameState();
            
            console.log(`自動化速度アップグレード購入！レベル: ${this.gameState.upgrades.autoSpeed}`);
        }
    }
    
    // 自動化速度アップグレードのコスト計算
    getAutoSpeedUpgradeCost() {
        const basePrice = 100;
        const level = this.gameState.upgrades.autoSpeed;
        return Math.floor(basePrice * Math.pow(1.5, level));
    }
    
    // 自動サイコロの間隔更新
    updateAutoRollInterval() {
        const baseInterval = 3000; // 3秒
        const reduction = this.gameState.upgrades.autoSpeed * 200; // レベル毎に0.2秒短縮
        this.gameState.autoRollInterval = Math.max(200, baseInterval - reduction); // 最小0.2秒
    }
    
    // プレステージ（転生）
    prestige() {
        if (this.gameState.prestigePoints === 0) return;
        
        const confirmed = confirm(`転生しますか？\n\n獲得プレステージポイント: ${this.gameState.prestigePoints}\n\n注意: 現在の進行状況はリセットされます。`);
        
        if (confirmed) {
            // プレステージポイントを保存
            const earnedPrestige = this.gameState.prestigePoints;
            
            // ゲーム状態をリセット
            this.resetGameState();
            this.gameState.prestigePoints = earnedPrestige;
            
            // UI更新
            this.generateGameBoard();
            this.updateUI();
            this.saveGameState();
            
            console.log(`転生完了！プレステージポイント: ${earnedPrestige}`);
            alert(`転生しました！\nプレステージポイント: ${earnedPrestige}`);
        }
    }
    
    // ゲーム状態のリセット
    resetGameState() {
        this.gameState.credits = 0;
        this.gameState.position = 0;
        this.gameState.totalMoves = 0;
        this.gameState.dice = [{ faces: 6, count: 1, unlocked: true }];
        this.gameState.upgrades = {
            autoSpeed: 0,
            diceUpgrades: { d2: 0, d4: 0, d6: 1, d8: 0, d10: 0, d12: 0, d20: 0 }
        };
        this.gameState.autoRoll = false;
        this.gameState.autoRollInterval = 3000;
    }
    
    // UI更新
    updateUI() {
        // ゲーム情報の更新
        this.elements.credits.textContent = this.formatNumber(this.gameState.credits);
        this.elements.position.textContent = this.gameState.position;
        this.elements.prestigePoints.textContent = this.gameState.prestigePoints;
        
        // 自動化チェックボックス
        this.elements.autoRollCheck.checked = this.gameState.autoRoll;
        
        // アップグレード情報の更新
        const autoSpeedCost = this.getAutoSpeedUpgradeCost();
        this.elements.autoSpeedCost.textContent = this.formatNumber(autoSpeedCost);
        this.elements.autoInterval.textContent = (this.gameState.autoRollInterval / 1000).toFixed(1);
        
        // アップグレードボタンの状態
        this.elements.upgradeAutoSpeed.disabled = this.gameState.credits < autoSpeedCost;
        
        // プレステージボタンの状態
        this.elements.prestigeBtn.disabled = this.gameState.prestigePoints === 0;
    }
    
    // 数値のフォーマット
    formatNumber(num) {
        if (num < 1000) return num.toString();
        if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
        return (num / 1000000000).toFixed(1) + 'B';
    }
    
    // ゲームループ
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // 自動サイコロの処理
        if (this.gameState.autoRoll && 
            currentTime - this.lastAutoRoll >= this.gameState.autoRollInterval) {
            this.rollDice();
            this.lastAutoRoll = currentTime;
        }
        
        // 次のフレームをスケジュール
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // ゲームループの開始
    startGameLoop() {
        this.isRunning = true;
        this.lastAutoRoll = performance.now();
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // ゲームループの停止
    stopGameLoop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    // ゲーム状態の保存
    saveGameState() {
        try {
            localStorage.setItem('sugoroku-game-state', JSON.stringify(this.gameState));
            console.log('ゲーム状態を保存しました');
        } catch (error) {
            console.error('ゲーム状態の保存に失敗しました:', error);
        }
    }
    
    // ゲーム状態の読み込み
    loadGameState() {
        try {
            const savedState = localStorage.getItem('sugoroku-game-state');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                
                // 既存の構造と新しい構造をマージ
                this.gameState = this.mergeGameState(this.gameState, parsed);
                
                console.log('ゲーム状態を読み込みました');
            }
        } catch (error) {
            console.error('ゲーム状態の読み込みに失敗しました:', error);
        }
    }
    
    // ゲーム状態のマージ（新しいプロパティの追加に対応）
    mergeGameState(defaultState, savedState) {
        const merged = { ...defaultState };
        
        // トップレベルプロパティのマージ
        Object.keys(savedState).forEach(key => {
            if (typeof defaultState[key] === 'object' && !Array.isArray(defaultState[key])) {
                merged[key] = { ...defaultState[key], ...savedState[key] };
            } else {
                merged[key] = savedState[key];
            }
        });
        
        return merged;
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    window.sugorokuGame = new SugorokuGame();
});