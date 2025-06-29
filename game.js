// すごろくインクリメンタルゲーム メインロジック

class SugorokuGame {
    constructor() {
        // ゲーム状態の初期化
        this.gameState = {
            credits: 0,                 // クレジット
            position: 0,                // 現在位置
            level: 1,                   // 現在のレベル
            rebirthCount: 0,            // 転生回数
            
            // プレステージポイント（分離）
            prestigePoints: {
                earned: 0,              // 転生時に獲得予定
                available: 0            // 使用可能ポイント
            },
            
            // 統計情報
            stats: {
                totalDiceRolls: 0,      // サイコロを振った総回数
                totalMoves: 0,          // 進んだマスの総計
                totalCreditsEarned: 0,  // 総獲得クレジット
                totalRebirths: 0,       // 転生回数
                totalPrestigePoints: 0  // 総獲得プレステージポイント
            },
            
            // 手動ダイス（プレイヤーが操作）
            manualDice: {
                count: 1,               // 6面ダイスの個数
                upgradeLevel: 0         // アップグレードレベル
            },
            
            // 自動ダイス（7種類独立）
            autoDice: [
                { faces: 2,  count: 1, unlocked: false, speedLevel: 0, countLevel: 0, baseInterval: 1500,  lastRoll: 0 },
                { faces: 4,  count: 1, unlocked: false, speedLevel: 0, countLevel: 0, baseInterval: 2500,  lastRoll: 0 },
                { faces: 6,  count: 1, unlocked: false, speedLevel: 0, countLevel: 0, baseInterval: 3500,  lastRoll: 0 },
                { faces: 8,  count: 1, unlocked: false, speedLevel: 0, countLevel: 0, baseInterval: 5000,  lastRoll: 0 },
                { faces: 10, count: 1, unlocked: false, speedLevel: 0, countLevel: 0, baseInterval: 6500,  lastRoll: 0 },
                { faces: 12, count: 1, unlocked: false, speedLevel: 0, countLevel: 0, baseInterval: 8000,  lastRoll: 0 },
                { faces: 20, count: 1, unlocked: false, speedLevel: 0, countLevel: 0, baseInterval: 12000, lastRoll: 0 }
            ],
            
            // ゲーム設定
            settings: {
                tickRate: 1000 / 60     // 60fps (16.67ms per tick)
            }
        };
        
        // 内部状態
        this.isRunning = false;
        this.animationId = null;
        this.manualDiceResults = [];    // 手動ダイスの結果表示用
        
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
            level: document.getElementById('level'),
            prestigeEarned: document.getElementById('prestige-earned'),
            prestigeAvailable: document.getElementById('prestige-available'),
            
            // 手動ダイス
            manualDiceResult: document.getElementById('manual-dice-result'),
            rollManualDiceBtn: document.getElementById('roll-manual-dice'),
            upgradeManualCountBtn: document.getElementById('upgrade-manual-count'),
            manualDiceCount: document.getElementById('manual-dice-count'),
            manualUpgradeCost: document.getElementById('manual-upgrade-cost'),
            
            // 自動ダイス
            autoDiceContainer: document.getElementById('auto-dice-container'),
            
            // ゲームボード
            gameBoard: document.getElementById('game-board'),
            
            // プレステージ
            prestigeBtn: document.getElementById('prestige-btn'),
            
            // 統計
            statsBtn: document.getElementById('stats-btn'),
            statDiceRolls: document.getElementById('stat-dice-rolls'),
            statTotalMoves: document.getElementById('stat-total-moves'),
            statTotalCredits: document.getElementById('stat-total-credits'),
            statRebirths: document.getElementById('stat-rebirths'),
            statTotalPrestige: document.getElementById('stat-total-prestige'),
            statCurrentLevel: document.getElementById('stat-current-level')
        };
    }
    
    // イベントリスナーの設定
    setupEventListeners() {
        // 手動ダイスを振るボタン
        this.elements.rollManualDiceBtn.addEventListener('click', () => {
            if (!this.isRunning) return;
            this.rollManualDice();
        });
        
        // 手動ダイス個数アップグレード
        this.elements.upgradeManualCountBtn.addEventListener('click', () => {
            this.upgradeManualDiceCount();
        });
        
        // プレステージボタン
        this.elements.prestigeBtn.addEventListener('click', () => {
            this.prestige();
        });
        
        // 統計ボタン
        this.elements.statsBtn.addEventListener('click', () => {
            this.showStats();
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
    
    // ランダム値生成（シード対応）
    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }
    
    // 盤面用シード生成
    getBoardSeed() {
        return this.gameState.rebirthCount * 1000 + this.gameState.level;
    }
    
    // マス種類の決定
    getCellType(position, level) {
        const seed = this.getBoardSeed() + position;
        const rand = this.seededRandom(seed);
        
        // 盤面の後半ほど戻るマスが多くなる（バランス調整済み）
        const backwardRatio = Math.min(0.2, 0.08 + (position / 100) * 0.12);
        const forwardRatio = 0.18;
        const creditRatio = 0.55;
        const emptyRatio = 1 - backwardRatio - forwardRatio - creditRatio;
        
        if (rand < emptyRatio) {
            return { type: 'empty', effect: null };
        } else if (rand < emptyRatio + creditRatio) {
            // レベルと位置に応じてクレジット量を決定（バランス調整済み）
            const baseAmount = Math.max(2, Math.floor(position / 8) + 2);
            const levelBonus = Math.floor(level * 0.8);
            const randomBonus = Math.floor(this.seededRandom(seed + 1000) * 4) + 1; // 1-4の追加ランダム
            return { 
                type: 'credit', 
                effect: baseAmount + levelBonus + randomBonus 
            };
        } else if (rand < emptyRatio + creditRatio + forwardRatio) {
            // 進むマス（1-3マス）
            const steps = Math.floor(this.seededRandom(seed + 2000) * 3) + 1;
            return { type: 'forward', effect: steps };
        } else {
            // 戻るマス（1-3マス、レベルペナルティ軽減）
            const baseSteps = Math.floor(this.seededRandom(seed + 3000) * 3) + 1;
            const levelPenalty = Math.floor(level / 5); // レベルペナルティを軽減
            return { type: 'backward', effect: Math.min(baseSteps + levelPenalty, 5) }; // 最大5マス戻り制限
        }
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
            
            // マスの種類を決定
            const cellData = this.getCellType(i, this.gameState.level);
            cell.dataset.cellType = cellData.type;
            cell.dataset.cellEffect = cellData.effect;
            
            // マスの効果表示
            const effectDiv = document.createElement('div');
            effectDiv.className = 'cell-effect';
            
            switch (cellData.type) {
                case 'empty':
                    effectDiv.textContent = '　';
                    cell.classList.add('normal');
                    break;
                case 'credit':
                    effectDiv.textContent = `💰+${cellData.effect}`;
                    cell.classList.add('credit');
                    break;
                case 'forward':
                    effectDiv.textContent = `⬆️+${cellData.effect}`;
                    cell.classList.add('forward');
                    break;
                case 'backward':
                    effectDiv.textContent = `⬇️-${cellData.effect}`;
                    cell.classList.add('backward');
                    break;
            }
            
            cell.appendChild(effectDiv);
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
    
    // 手動ダイスを振る
    rollManualDice() {
        const diceCount = this.gameState.manualDice.count;
        let totalRoll = 0;
        this.manualDiceResults = [];
        
        // 6面ダイスを指定個数振る
        for (let i = 0; i < diceCount; i++) {
            const roll = Math.floor(Math.random() * 6) + 1;
            this.manualDiceResults.push(roll);
            totalRoll += roll;
        }
        
        // 統計を更新
        this.gameState.stats.totalDiceRolls++;
        
        // 結果を表示
        this.updateManualDiceDisplay();
        
        // プレイヤーを移動
        this.movePlayer(totalRoll);
        
        console.log(`手動ダイス: ${this.manualDiceResults.join(', ')} = ${totalRoll}`);
    }
    
    // 自動ダイスを振る（種類別）
    rollAutoDice(diceIndex) {
        const dice = this.gameState.autoDice[diceIndex];
        if (!dice.unlocked) return;
        
        let totalRoll = 0;
        
        // 指定個数分振る
        for (let i = 0; i < dice.count; i++) {
            totalRoll += Math.floor(Math.random() * dice.faces) + 1;
        }
        
        // 統計を更新
        this.gameState.stats.totalDiceRolls++;
        
        // プレイヤーを移動
        this.movePlayer(totalRoll);
        
        // lastRollを更新
        dice.lastRoll = performance.now();
        
        console.log(`自動${dice.faces}面ダイス: ${totalRoll}`);
    }
    
    // 手動ダイス表示の更新（アニメーション強化版）
    updateManualDiceDisplay(rollQuality = 0.5) {
        if (!this.elements.manualDiceResult) return;
        
        const diceCount = this.gameState.manualDice.count;
        const total = this.manualDiceResults.reduce((sum, roll) => sum + roll, 0);
        
        // 結果品質に応じた表示色とアニメーション
        let resultClass = '';
        let resultText = '';
        
        if (rollQuality >= 0.9) {
            resultClass = 'text-warning fw-bold';
            resultText = '✨ EXCELLENT! ✨';
        } else if (rollQuality >= 0.75) {
            resultClass = 'text-success fw-bold';
            resultText = '🎯 GREAT!';
        } else if (rollQuality >= 0.5) {
            resultClass = 'text-primary';
            resultText = '👍 GOOD';
        } else {
            resultClass = 'text-muted';
            resultText = '';
        }
        
        // 結果表示の構築
        let displayContent = '';
        if (diceCount === 1) {
            displayContent = `<div class="${resultClass}">${total}</div>`;
        } else {
            displayContent = `<div class="small text-muted">${this.manualDiceResults.join(' + ')}</div>`;
            displayContent += `<div class="${resultClass} fs-3">${total}</div>`;
        }
        
        if (resultText) {
            displayContent += `<div class="small ${resultClass}">${resultText}</div>`;
        }
        
        this.elements.manualDiceResult.innerHTML = displayContent;
        
        // 品質に応じたアニメーション効果
        this.elements.manualDiceResult.style.animation = 'none';
        setTimeout(() => {
            const animationType = rollQuality >= 0.8 ? 'diceRolling' : 'diceRoll';
            this.elements.manualDiceResult.style.animation = `${animationType} 0.6s ease-in-out`;
            
            // 特別演出（優秀な結果の場合）
            if (rollQuality >= 0.9) {
                this.elements.manualDiceResult.style.textShadow = '0 0 20px gold';
                setTimeout(() => {
                    this.elements.manualDiceResult.style.textShadow = '';
                }, 1500);
            }
        }, 10);
    }
    
    // 自動ダイスの間隔計算
    getAutoDiceInterval(diceIndex) {
        const dice = this.gameState.autoDice[diceIndex];
        const speedMultiplier = Math.pow(1.2, dice.speedLevel);  // 1.2^レベル倍の速度
        const maxSpeedMultiplier = 10; // 最大10倍速
        const actualMultiplier = Math.min(speedMultiplier, maxSpeedMultiplier);
        return dice.baseInterval / actualMultiplier;
    }
    
    // 自動ダイスのタイマーチェック
    checkAutoDiceTimers(currentTime) {
        this.gameState.autoDice.forEach((dice, index) => {
            if (!dice.unlocked) return;
            
            const interval = this.getAutoDiceInterval(index);
            if (currentTime - dice.lastRoll >= interval) {
                this.rollAutoDice(index);
            }
        });
    }
    
    // プレイヤーの移動
    movePlayer(steps) {
        const oldPosition = this.gameState.position;
        const newPosition = oldPosition + steps;
        
        // 統計を更新
        this.gameState.stats.totalMoves += steps;
        
        // レベルアップの処理
        if (newPosition >= 100) {
            const levelsCompleted = Math.floor(newPosition / 100);
            this.gameState.level += levelsCompleted;
            
            // プレステージポイント獲得
            this.gameState.prestigePoints.earned += levelsCompleted;
            this.gameState.stats.totalPrestigePoints += levelsCompleted;
            
            console.log(`レベル ${this.gameState.level} に到達！プレステージポイント +${levelsCompleted}`);
            
            // 位置をリセット（新しいレベルの盤面）
            this.gameState.position = newPosition % 100;
            
            // 新しい盤面を生成
            this.generateGameBoard();
        } else {
            this.gameState.position = newPosition;
        }
        
        // マス目の効果を適用
        this.applySquareEffect(this.gameState.position);
        
        // UI更新
        this.updatePlayerPosition();
        this.updateUI();
    }
    
    // マス目の効果を適用
    applySquareEffect(position) {
        const cell = document.querySelector(`[data-position="${position}"]`);
        if (!cell) return;
        
        const cellType = cell.dataset.cellType;
        const cellEffect = parseInt(cell.dataset.cellEffect);
        
        switch (cellType) {
            case 'empty':
                // 何も起こらない
                console.log(`何もなし (位置: ${position})`);
                break;
                
            case 'credit':
                this.gameState.credits += cellEffect;
                this.gameState.stats.totalCreditsEarned += cellEffect;
                
                // アニメーション効果
                cell.classList.add('credit-gain');
                setTimeout(() => {
                    cell.classList.remove('credit-gain');
                }, 800);
                
                console.log(`クレジット +${cellEffect} (位置: ${position})`);
                break;
                
            case 'forward':
                // 進むマス（無限ループ防止のため、移動先の進む・戻るマスは無視）
                console.log(`${cellEffect}マス進む! (位置: ${position})`);
                
                // アニメーション効果
                cell.classList.add('forward-effect');
                setTimeout(() => {
                    cell.classList.remove('forward-effect');
                }, 800);
                
                // 移動を実行（再帰的な効果は無視）
                this.movePlayerDirect(cellEffect);
                break;
                
            case 'backward':
                // 戻るマス（無限ループ防止のため、移動先の進む・戻るマスは無視）
                console.log(`${cellEffect}マス戻る... (位置: ${position})`);
                
                // アニメーション効果
                cell.classList.add('backward-effect');
                setTimeout(() => {
                    cell.classList.remove('backward-effect');
                }, 800);
                
                // 移動を実行（再帰的な効果は無視）
                this.movePlayerDirect(-cellEffect);
                break;
        }
    }
    
    // 直接移動（マス効果を適用しない）
    movePlayerDirect(steps) {
        const oldPosition = this.gameState.position;
        let newPosition = oldPosition + steps;
        
        // 範囲チェック
        if (newPosition < 0) {
            newPosition = 0;
        } else if (newPosition >= 100) {
            // レベルアップの処理
            const levelsCompleted = Math.floor(newPosition / 100);
            this.gameState.level += levelsCompleted;
            
            // プレステージポイント獲得
            this.gameState.prestigePoints.earned += levelsCompleted;
            this.gameState.stats.totalPrestigePoints += levelsCompleted;
            
            console.log(`レベル ${this.gameState.level} に到達！プレステージポイント +${levelsCompleted}`);
            
            // 位置をリセット（新しいレベルの盤面）
            newPosition = newPosition % 100;
            
            // 新しい盤面を生成
            this.generateGameBoard();
        }
        
        this.gameState.position = newPosition;
        
        // 統計を更新
        this.gameState.stats.totalMoves += Math.abs(steps);
        
        // UI更新
        this.updatePlayerPosition();
        this.updateUI();
    }
    
    // 手動ダイス個数アップグレード
    upgradeManualDiceCount() {
        const cost = this.getManualDiceUpgradeCost();
        
        if (this.gameState.credits >= cost) {
            this.gameState.credits -= cost;
            this.gameState.manualDice.count++;
            this.gameState.manualDice.upgradeLevel++;
            
            this.updateUI();
            this.saveGameState();
            
            console.log(`手動ダイス個数アップグレード！現在: ${this.gameState.manualDice.count}個`);
        }
    }
    
    // 自動ダイス解禁
    unlockAutoDice(diceIndex) {
        const cost = this.getAutoDiceUnlockCost(diceIndex);
        
        if (this.gameState.credits >= cost) {
            this.gameState.credits -= cost;
            this.gameState.autoDice[diceIndex].unlocked = true;
            this.gameState.autoDice[diceIndex].lastRoll = performance.now();
            
            this.updateUI();
            this.saveGameState();
            
            const faces = this.gameState.autoDice[diceIndex].faces;
            console.log(`${faces}面自動ダイス解禁！`);
        }
    }
    
    // 自動ダイス速度アップグレード
    upgradeAutoDiceSpeed(diceIndex) {
        const cost = this.getAutoDiceSpeedUpgradeCost(diceIndex);
        
        if (this.gameState.credits >= cost) {
            this.gameState.credits -= cost;
            this.gameState.autoDice[diceIndex].speedLevel++;
            
            this.updateUI();
            this.saveGameState();
            
            const faces = this.gameState.autoDice[diceIndex].faces;
            const level = this.gameState.autoDice[diceIndex].speedLevel;
            console.log(`${faces}面ダイス速度アップグレード！レベル: ${level}`);
        }
    }
    
    // 自動ダイス個数アップグレード
    upgradeAutoDiceCount(diceIndex) {
        const cost = this.getAutoDiceCountUpgradeCost(diceIndex);
        
        if (this.gameState.credits >= cost) {
            this.gameState.credits -= cost;
            this.gameState.autoDice[diceIndex].count++;
            this.gameState.autoDice[diceIndex].countLevel++;
            
            this.updateUI();
            this.saveGameState();
            
            const faces = this.gameState.autoDice[diceIndex].faces;
            const count = this.gameState.autoDice[diceIndex].count;
            console.log(`${faces}面ダイス個数アップグレード！現在: ${count}個`);
        }
    }
    
    // 手動ダイスアップグレードのコスト計算
    getManualDiceUpgradeCost() {
        const basePrice = 75;
        const level = this.gameState.manualDice.upgradeLevel;
        return Math.floor(basePrice * Math.pow(1.6, level));
    }
    
    // 自動ダイス解禁のコスト計算
    getAutoDiceUnlockCost(diceIndex) {
        const basePrices = [30, 120, 300, 750, 1800, 4500, 12000]; // 2,4,6,8,10,12,20面
        return basePrices[diceIndex];
    }
    
    // 自動ダイス速度アップグレードのコスト計算
    getAutoDiceSpeedUpgradeCost(diceIndex) {
        const dice = this.gameState.autoDice[diceIndex];
        const basePrices = [15, 60, 150, 375, 900, 2250, 6000]; // 2,4,6,8,10,12,20面
        return Math.floor(basePrices[diceIndex] * Math.pow(1.5, dice.speedLevel));
    }
    
    // 自動ダイス個数アップグレードのコスト計算
    getAutoDiceCountUpgradeCost(diceIndex) {
        const dice = this.gameState.autoDice[diceIndex];
        const basePrices = [60, 240, 600, 1500, 3600, 9000, 24000]; // 2,4,6,8,10,12,20面
        return Math.floor(basePrices[diceIndex] * Math.pow(2.5, dice.countLevel));
    }
    
    
    // プレステージ（転生）
    prestige() {
        if (this.gameState.prestigePoints.earned === 0) return;
        
        const confirmText = `転生しますか？\n\n` +
            `現在の統計:\n` +
            `・獲得予定プレステージポイント: ${this.gameState.prestigePoints.earned}\n` +
            `・総クレジット獲得: ${this.formatNumber(this.gameState.credits)}\n` +
            `・現在レベル: ${this.gameState.level}\n` +
            `・サイコロ振り回数: ${this.gameState.stats.totalDiceRolls}\n\n` +
            `注意: 現在の進行状況はリセットされますが、\n` +
            `プレステージポイントは使用可能になります。`;
        
        const confirmed = confirm(confirmText);
        
        if (confirmed) {
            // プレステージポイントを使用可能に移動
            const earnedPrestige = this.gameState.prestigePoints.earned;
            this.gameState.prestigePoints.available += earnedPrestige;
            
            // 転生統計を更新
            this.gameState.rebirthCount++;
            this.gameState.stats.totalRebirths++;
            
            // ゲーム状態をリセット
            this.resetGameState();
            
            // UI更新
            this.generateGameBoard();
            this.updateUI();
            this.saveGameState();
            
            console.log(`転生完了！プレステージポイント: ${earnedPrestige} 獲得`);
            
            const resultText = `転生しました！\n\n` +
                `獲得プレステージポイント: ${earnedPrestige}\n` +
                `使用可能PP: ${this.gameState.prestigePoints.available}\n` +
                `新しい冒険が始まります！`;
            alert(resultText);
        }
    }
    
    // ゲーム統計の取得
    getGameStats() {
        const completedLaps = Math.floor(this.gameState.totalMoves / 100);
        return {
            totalCredits: this.gameState.credits,
            totalDistance: this.gameState.totalMoves,
            completedLaps: completedLaps,
            currentPosition: this.gameState.position,
            diceTypes: this.gameState.dice.filter(d => d.unlocked).length,
            upgradesPurchased: this.getTotalUpgradesPurchased()
        };
    }
    
    // 購入したアップグレードの総数を取得
    getTotalUpgradesPurchased() {
        let total = this.gameState.upgrades.autoSpeed;
        Object.values(this.gameState.upgrades.diceUpgrades).forEach(level => {
            total += level;
        });
        return total;
    }
    
    // プレステージ統計の更新
    updatePrestigeStats(stats) {
        if (!this.gameState.prestigeStats) {
            this.gameState.prestigeStats = {
                totalRuns: 0,
                totalCreditsEarned: 0,
                totalDistanceTraveled: 0,
                totalLapsCompleted: 0,
                bestSingleRun: {
                    credits: 0,
                    distance: 0,
                    laps: 0
                }
            };
        }
        
        const prestigeStats = this.gameState.prestigeStats;
        
        // 総計を更新
        prestigeStats.totalRuns++;
        prestigeStats.totalCreditsEarned += stats.totalCredits;
        prestigeStats.totalDistanceTraveled += stats.totalDistance;
        prestigeStats.totalLapsCompleted += stats.completedLaps;
        
        // 最高記録を更新
        if (stats.totalCredits > prestigeStats.bestSingleRun.credits) {
            prestigeStats.bestSingleRun.credits = stats.totalCredits;
        }
        if (stats.totalDistance > prestigeStats.bestSingleRun.distance) {
            prestigeStats.bestSingleRun.distance = stats.totalDistance;
        }
        if (stats.completedLaps > prestigeStats.bestSingleRun.laps) {
            prestigeStats.bestSingleRun.laps = stats.completedLaps;
        }
    }
    
    // ゲーム状態のリセット
    resetGameState() {
        // 転生回数と使用可能PPは保持
        const preservedRebirthCount = this.gameState.rebirthCount;
        const preservedAvailablePP = this.gameState.prestigePoints.available;
        const preservedStats = { ...this.gameState.stats };
        
        // 基本状態をリセット
        this.gameState.credits = 0;
        this.gameState.position = 0;
        this.gameState.level = 1;
        this.gameState.prestigePoints.earned = 0;
        
        // 手動ダイスをリセット
        this.gameState.manualDice = {
            count: 1,
            upgradeLevel: 0
        };
        
        // 自動ダイスをリセット
        this.gameState.autoDice.forEach(dice => {
            dice.unlocked = false;
            dice.count = 1;
            dice.speedLevel = 0;
            dice.countLevel = 0;
            dice.lastRoll = 0;
        });
        
        // 保持する値を復元
        this.gameState.rebirthCount = preservedRebirthCount;
        this.gameState.prestigePoints.available = preservedAvailablePP;
        this.gameState.stats = preservedStats;
        
        // 手動ダイス結果をリセット
        this.manualDiceResults = [];
    }
    
    // UI更新
    updateUI() {
        // ゲーム情報の更新
        this.elements.credits.textContent = this.formatNumber(this.gameState.credits);
        this.elements.position.textContent = this.gameState.position;
        this.elements.level.textContent = this.gameState.level;
        this.elements.prestigeEarned.textContent = this.gameState.prestigePoints.earned;
        this.elements.prestigeAvailable.textContent = this.gameState.prestigePoints.available;
        
        // 手動ダイス情報の更新
        this.elements.manualDiceCount.textContent = this.gameState.manualDice.count;
        const manualUpgradeCost = this.getManualDiceUpgradeCost();
        this.elements.manualUpgradeCost.textContent = this.formatNumber(manualUpgradeCost);
        this.elements.upgradeManualCountBtn.disabled = this.gameState.credits < manualUpgradeCost;
        
        // 自動ダイスUIの更新
        this.updateAutoDiceUI();
        
        // プレステージボタンの状態
        this.elements.prestigeBtn.disabled = this.gameState.prestigePoints.earned === 0;
        
        // プレステージボタンのテキスト更新
        if (this.gameState.prestigePoints.earned > 0) {
            this.elements.prestigeBtn.innerHTML = `✨ 転生する<br><small>獲得PP: ${this.gameState.prestigePoints.earned}</small>`;
        } else {
            this.elements.prestigeBtn.innerHTML = `転生する<br><small>レベルアップで解放</small>`;
        }
    }
    
    // 統計表示
    showStats() {
        // 統計データを更新
        this.elements.statDiceRolls.textContent = this.formatNumber(this.gameState.stats.totalDiceRolls);
        this.elements.statTotalMoves.textContent = this.formatNumber(this.gameState.stats.totalMoves);
        this.elements.statTotalCredits.textContent = this.formatNumber(this.gameState.stats.totalCreditsEarned);
        this.elements.statRebirths.textContent = this.gameState.stats.totalRebirths;
        this.elements.statTotalPrestige.textContent = this.gameState.stats.totalPrestigePoints;
        this.elements.statCurrentLevel.textContent = this.gameState.level;
        
        // モーダルを表示
        const modal = new bootstrap.Modal(document.getElementById('statsModal'));
        modal.show();
    }
    
    // 自動ダイスUIの更新
    updateAutoDiceUI() {
        const container = this.elements.autoDiceContainer;
        container.innerHTML = '';
        
        const diceEmojis = ['🎯', '🔹', '🎲', '🔸', '🔟', '🔵', '⭐'];
        
        this.gameState.autoDice.forEach((dice, index) => {
            const dicePanel = document.createElement('div');
            // CSS class management for locked/unlocked states
            let panelClasses = 'auto-dice-panel mb-3 p-2 border rounded';
            if (dice.unlocked) {
                panelClasses += ' unlocked';
            } else {
                panelClasses += ' locked';
            }
            dicePanel.className = panelClasses;
            
            // Add visual feedback data attributes
            dicePanel.setAttribute('data-dice-index', index);
            dicePanel.setAttribute('data-dice-faces', dice.faces);
            dicePanel.setAttribute('data-unlocked', dice.unlocked);
            
            // ダイスタイトル
            const title = document.createElement('h6');
            title.className = 'text-center mb-2';
            // Enhanced title with status indicator
            const statusIndicator = dice.unlocked ? '✅' : '🔒';
            title.innerHTML = `${statusIndicator} ${diceEmojis[index]} ${dice.faces}面ダイス`;
            dicePanel.appendChild(title);
            
            if (!dice.unlocked) {
                // 未解禁状態
                const unlockCost = this.getAutoDiceUnlockCost(index);
                const unlockBtn = document.createElement('button');
                // Enhanced button styling with visual feedback
                let buttonClass = 'btn btn-outline-success btn-sm w-100';
                if (this.gameState.credits >= unlockCost) {
                    buttonClass += ' btn-ripple'; // Add ripple effect for affordable upgrades
                }
                unlockBtn.className = buttonClass;
                unlockBtn.innerHTML = `🔓 解禁<br><small>コスト: ${this.formatNumber(unlockCost)}💰</small>`;
                unlockBtn.disabled = this.gameState.credits < unlockCost;
                unlockBtn.addEventListener('click', () => this.unlockAutoDice(index));
                
                // Add affordability indicator
                if (this.gameState.credits >= unlockCost) {
                    unlockBtn.title = '解禁可能！クリックして解禁してください';
                    unlockBtn.style.animation = 'pulse 2s infinite';
                } else {
                    unlockBtn.title = `解禁には ${this.formatNumber(unlockCost - this.gameState.credits)} 💰 不足`;
                }
                
                dicePanel.appendChild(unlockBtn);
            } else {
                // 解禁済み状態
                
                // クールダウンゲージ
                const cooldownContainer = document.createElement('div');
                cooldownContainer.className = 'cooldown-container mb-2';
                
                const cooldownLabel = document.createElement('small');
                cooldownLabel.className = 'd-block text-center text-muted';
                const interval = this.getAutoDiceInterval(index);
                cooldownLabel.textContent = `間隔: ${(interval / 1000).toFixed(1)}秒`;
                cooldownContainer.appendChild(cooldownLabel);
                
                const progressBar = document.createElement('div');
                progressBar.className = 'progress';
                progressBar.style.height = '8px';
                
                const progressFill = document.createElement('div');
                progressFill.className = 'progress-bar bg-info';
                progressFill.id = `cooldown-${index}`;
                progressBar.appendChild(progressFill);
                
                cooldownContainer.appendChild(progressBar);
                dicePanel.appendChild(cooldownContainer);
                
                // アップグレードボタン群
                const upgradeRow = document.createElement('div');
                upgradeRow.className = 'row g-1';
                
                // 速度アップグレード
                const speedCol = document.createElement('div');
                speedCol.className = 'col-6';
                const speedCost = this.getAutoDiceSpeedUpgradeCost(index);
                const speedBtn = document.createElement('button');
                // Enhanced button styling with visual feedback
                let speedButtonClass = 'btn btn-outline-primary btn-sm w-100';
                if (this.gameState.credits >= speedCost) {
                    speedButtonClass += ' btn-ripple';
                }
                speedBtn.className = speedButtonClass;
                speedBtn.innerHTML = `⚡ 速度<br><small>${this.formatNumber(speedCost)}💰</small>`;
                speedBtn.disabled = this.gameState.credits < speedCost;
                speedBtn.addEventListener('click', () => this.upgradeAutoDiceSpeed(index));
                
                // Add affordability indicator
                if (this.gameState.credits >= speedCost) {
                    speedBtn.title = 'アップグレード可能！';
                    speedBtn.style.borderColor = '#0056b3';
                } else {
                    speedBtn.title = `アップグレードには ${this.formatNumber(speedCost - this.gameState.credits)} 💰 不足`;
                }
                
                speedCol.appendChild(speedBtn);
                
                // 個数アップグレード
                const countCol = document.createElement('div');
                countCol.className = 'col-6';
                const countCost = this.getAutoDiceCountUpgradeCost(index);
                const countBtn = document.createElement('button');
                // Enhanced button styling with visual feedback
                let countButtonClass = 'btn btn-outline-warning btn-sm w-100';
                if (this.gameState.credits >= countCost) {
                    countButtonClass += ' btn-ripple';
                }
                countBtn.className = countButtonClass;
                countBtn.innerHTML = `🎯 個数<br><small>${this.formatNumber(countCost)}💰</small>`;
                countBtn.disabled = this.gameState.credits < countCost;
                countBtn.addEventListener('click', () => this.upgradeAutoDiceCount(index));
                
                // Add affordability indicator
                if (this.gameState.credits >= countCost) {
                    countBtn.title = 'アップグレード可能！';
                    countBtn.style.borderColor = '#e0a800';
                } else {
                    countBtn.title = `アップグレードには ${this.formatNumber(countCost - this.gameState.credits)} 💰 不足`;
                }
                
                countCol.appendChild(countBtn);
                
                upgradeRow.appendChild(speedCol);
                upgradeRow.appendChild(countCol);
                dicePanel.appendChild(upgradeRow);
                
                // 現在のステータス表示（強化版）
                const statusDiv = document.createElement('div');
                statusDiv.className = 'text-center mt-2 p-2 bg-light rounded';
                
                // Status information with enhanced visual feedback
                const statusInfo = document.createElement('small');
                statusInfo.className = 'text-muted d-block';
                const currentInterval = this.getAutoDiceInterval(index);
                const rollsPerMinute = Math.round(60000 / currentInterval);
                
                statusInfo.innerHTML = `
                    📊 <strong>ステータス</strong><br>
                    🎯 個数: <span class="text-primary fw-bold">${dice.count}</span> | 
                    ⚡ 速度Lv: <span class="text-info fw-bold">${dice.speedLevel}</span><br>
                    ⏱️ 間隔: <span class="text-success">${(currentInterval / 1000).toFixed(1)}秒</span> | 
                    📈 毎分: <span class="text-warning fw-bold">${rollsPerMinute}回</span>
                `;
                statusDiv.appendChild(statusInfo);
                
                // Performance indicator
                const performanceDiv = document.createElement('div');
                performanceDiv.className = 'mt-1';
                
                let performanceClass = '';
                let performanceText = '';
                if (rollsPerMinute >= 30) {
                    performanceClass = 'badge bg-success';
                    performanceText = '🚀 高性能';
                } else if (rollsPerMinute >= 15) {
                    performanceClass = 'badge bg-warning';
                    performanceText = '⚡ 標準';
                } else {
                    performanceClass = 'badge bg-secondary';
                    performanceText = '🐌 低速';
                }
                
                const performanceBadge = document.createElement('span');
                performanceBadge.className = performanceClass;
                performanceBadge.textContent = performanceText;
                performanceDiv.appendChild(performanceBadge);
                
                statusDiv.appendChild(performanceDiv);
                dicePanel.appendChild(statusDiv);
            }
            
            container.appendChild(dicePanel);
        });
    }
    
    // クールダウンゲージの更新
    updateAutoDiceCooldowns() {
        const currentTime = performance.now();
        
        this.gameState.autoDice.forEach((dice, index) => {
            if (!dice.unlocked) return;
            
            const progressBar = document.getElementById(`cooldown-${index}`);
            if (!progressBar) return;
            
            const interval = this.getAutoDiceInterval(index);
            const elapsed = currentTime - dice.lastRoll;
            const progress = Math.min(100, (elapsed / interval) * 100);
            
            progressBar.style.width = `${progress}%`;
            
            // 満タンになったら色を変更
            if (progress >= 100) {
                progressBar.className = 'progress-bar bg-success';
            } else {
                progressBar.className = 'progress-bar bg-info';
            }
        });
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
        
        // 自動ダイスのタイマーチェック
        this.checkAutoDiceTimers(currentTime);
        
        // UI更新（クールダウンゲージ用）
        this.updateAutoDiceCooldowns();
        
        // 次のフレームをスケジュール
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    // ゲームループの開始
    startGameLoop() {
        this.isRunning = true;
        const currentTime = performance.now();
        
        // 全自動ダイスのlastRollを初期化
        this.gameState.autoDice.forEach(dice => {
            if (dice.lastRoll === 0) {
                dice.lastRoll = currentTime;
            }
        });
        
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
        
        // 新システム対応：古いデータ構造を検出した場合は初期化
        if (savedState.dice || savedState.upgrades) {
            console.log('古いダイスシステムのデータを検出。新システムで初期化します。');
            return merged; // デフォルト状態を返す
        }
        
        // トップレベルプロパティのマージ
        Object.keys(savedState).forEach(key => {
            if (typeof defaultState[key] === 'object' && !Array.isArray(defaultState[key]) && !Array.isArray(savedState[key])) {
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