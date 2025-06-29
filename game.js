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
            level: document.getElementById('level'),
            prestigeEarned: document.getElementById('prestige-earned'),
            prestigeAvailable: document.getElementById('prestige-available'),
            
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
        
        // 盤面の後半ほど戻るマスが多くなる
        const backwardRatio = Math.min(0.25, 0.1 + (position / 100) * 0.15);
        const forwardRatio = 0.15;
        const creditRatio = 0.45;
        const emptyRatio = 1 - backwardRatio - forwardRatio - creditRatio;
        
        if (rand < emptyRatio) {
            return { type: 'empty', effect: null };
        } else if (rand < emptyRatio + creditRatio) {
            // レベルと位置に応じてクレジット量を決定
            const baseAmount = Math.max(1, Math.floor(position / 10) + 1);
            const levelBonus = Math.floor(level / 2);
            const randomBonus = Math.floor(this.seededRandom(seed + 1000) * 3); // 0-2の追加ランダム
            return { 
                type: 'credit', 
                effect: baseAmount + levelBonus + randomBonus 
            };
        } else if (rand < emptyRatio + creditRatio + forwardRatio) {
            // 進むマス（1-3マス）
            const steps = Math.floor(this.seededRandom(seed + 2000) * 3) + 1;
            return { type: 'forward', effect: steps };
        } else {
            // 戻るマス（1-4マス、レベルに応じて強化）
            const baseSteps = Math.floor(this.seededRandom(seed + 3000) * 4) + 1;
            const levelPenalty = Math.floor(level / 3); // レベルが高いほど戻る距離増加
            return { type: 'backward', effect: baseSteps + levelPenalty };
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
        
        // 統計を更新
        this.gameState.stats.totalDiceRolls++;
        
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
        
        // サイコロとアップグレードをリセット
        this.gameState.dice = [{ faces: 6, count: 1, unlocked: true }];
        this.gameState.upgrades = {
            autoSpeed: 0,
            diceUpgrades: { d2: 0, d4: 0, d6: 1, d8: 0, d10: 0, d12: 0, d20: 0 }
        };
        
        // 自動化設定をリセット
        this.gameState.autoRoll = false;
        this.gameState.autoRollInterval = 3000;
        
        // 保持する値を復元
        this.gameState.rebirthCount = preservedRebirthCount;
        this.gameState.prestigePoints.available = preservedAvailablePP;
        this.gameState.stats = preservedStats;
    }
    
    // UI更新
    updateUI() {
        // ゲーム情報の更新
        this.elements.credits.textContent = this.formatNumber(this.gameState.credits);
        this.elements.position.textContent = this.gameState.position;
        this.elements.level.textContent = this.gameState.level;
        this.elements.prestigeEarned.textContent = this.gameState.prestigePoints.earned;
        this.elements.prestigeAvailable.textContent = this.gameState.prestigePoints.available;
        
        // 自動化チェックボックス
        this.elements.autoRollCheck.checked = this.gameState.autoRoll;
        
        // アップグレード情報の更新
        const autoSpeedCost = this.getAutoSpeedUpgradeCost();
        this.elements.autoSpeedCost.textContent = this.formatNumber(autoSpeedCost);
        this.elements.autoInterval.textContent = (this.gameState.autoRollInterval / 1000).toFixed(1);
        
        // アップグレードボタンの状態
        this.elements.upgradeAutoSpeed.disabled = this.gameState.credits < autoSpeedCost;
        
        // サイコロアップグレードUIの更新
        this.updateDiceUpgradeUI();
        
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
    
    // サイコロアップグレードUIの更新
    updateDiceUpgradeUI() {
        const container = this.elements.diceUpgrades;
        container.innerHTML = '';
        
        const diceTypes = [
            { key: 'd2', faces: 2, name: '2面', basePrice: 50, emoji: '🎯' },
            { key: 'd4', faces: 4, name: '4面', basePrice: 200, emoji: '🔹' },
            { key: 'd6', faces: 6, name: '6面', basePrice: 100, emoji: '🎲' },
            { key: 'd8', faces: 8, name: '8面', basePrice: 800, emoji: '🔸' },
            { key: 'd10', faces: 10, name: '10面', basePrice: 2000, emoji: '🔟' },
            { key: 'd12', faces: 12, name: '12面', basePrice: 5000, emoji: '🔵' },
            { key: 'd20', faces: 20, name: '20面', basePrice: 20000, emoji: '⭐' }
        ];
        
        diceTypes.forEach(diceType => {
            const currentCount = this.getDiceCount(diceType.faces);
            const isUnlocked = this.isDiceUnlocked(diceType.faces);
            const cost = this.getDiceUpgradeCost(diceType.key, diceType.basePrice);
            
            const diceDiv = document.createElement('div');
            diceDiv.className = 'upgrade-item mb-2';
            
            let buttonText, buttonClass, isDisabled;
            
            if (!isUnlocked && diceType.key !== 'd6') {
                buttonText = `${diceType.emoji} ${diceType.name}ダイス解放<br><small>コスト: ${this.formatNumber(cost)}💰</small>`;
                buttonClass = 'btn btn-outline-success btn-sm w-100';
                isDisabled = this.gameState.credits < cost;
            } else {
                buttonText = `${diceType.emoji} ${diceType.name}ダイス追加<br><small>現在: ${currentCount}個 | コスト: ${this.formatNumber(cost)}💰</small>`;
                buttonClass = 'btn btn-outline-primary btn-sm w-100';
                isDisabled = this.gameState.credits < cost;
            }
            
            const button = document.createElement('button');
            button.className = buttonClass;
            button.innerHTML = buttonText;
            button.disabled = isDisabled;
            
            button.addEventListener('click', () => {
                this.purchaseDiceUpgrade(diceType.key, diceType.faces, diceType.basePrice);
            });
            
            diceDiv.appendChild(button);
            container.appendChild(diceDiv);
        });
    }
    
    // サイコロの所持数を取得
    getDiceCount(faces) {
        const dice = this.gameState.dice.find(d => d.faces === faces);
        return dice ? dice.count : 0;
    }
    
    // サイコロが解放されているかチェック
    isDiceUnlocked(faces) {
        const dice = this.gameState.dice.find(d => d.faces === faces);
        return dice ? dice.unlocked : false;
    }
    
    // サイコロアップグレードのコスト計算
    getDiceUpgradeCost(diceKey, basePrice) {
        const currentLevel = this.gameState.upgrades.diceUpgrades[diceKey] || 0;
        
        // 6面ダイスは最初から解放済みなので、追加購入のコスト計算
        if (diceKey === 'd6') {
            return Math.floor(basePrice * Math.pow(1.5, currentLevel - 1));
        }
        
        // 初回解放コストは固定、その後は段階的に上昇
        const dice = this.gameState.dice.find(d => d.faces === parseInt(diceKey.slice(1)));
        if (!dice || !dice.unlocked) {
            return basePrice; // 解放コスト
        } else {
            return Math.floor(basePrice * Math.pow(2, currentLevel - 1)); // 追加コスト
        }
    }
    
    // サイコロアップグレードの購入
    purchaseDiceUpgrade(diceKey, faces, basePrice) {
        const cost = this.getDiceUpgradeCost(diceKey, basePrice);
        
        if (this.gameState.credits >= cost) {
            this.gameState.credits -= cost;
            
            // サイコロデータを更新
            let dice = this.gameState.dice.find(d => d.faces === faces);
            
            if (!dice) {
                // 新しいサイコロタイプを追加
                dice = { faces: faces, count: 0, unlocked: false };
                this.gameState.dice.push(dice);
            }
            
            if (!dice.unlocked) {
                // サイコロタイプを解放
                dice.unlocked = true;
                dice.count = 1;
                console.log(`${faces}面ダイスを解放しました！`);
            } else {
                // サイコロ数を増加
                dice.count++;
                console.log(`${faces}面ダイスを追加しました！現在: ${dice.count}個`);
            }
            
            // アップグレードレベルを増加
            this.gameState.upgrades.diceUpgrades[diceKey]++;
            
            this.updateUI();
            this.saveGameState();
        }
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