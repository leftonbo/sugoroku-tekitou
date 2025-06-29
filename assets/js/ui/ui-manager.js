// UI管理・DOM操作・イベント処理

import { formatNumber } from '../utils/math-utils.js';
import { DICE_CONFIGS } from '../utils/constants.js';

export class UIManager {
    constructor(gameState, systems, animationManager) {
        this.gameState = gameState;
        this.systems = systems;
        this.animationManager = animationManager;
        this.elements = {};
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
            burdenDisplay: document.getElementById('burden-display'),
            burdenLevel: document.getElementById('burden-level'),
            burdenEffects: document.getElementById('burden-effects'),
            
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
            statCurrentLevel: document.getElementById('stat-current-level'),
            
            // デバッグパネル
            debugPanel: document.getElementById('debug-panel'),
            debugToggle: document.getElementById('debug-toggle'),
            debugContent: document.getElementById('debug-content'),
            debugPause: document.getElementById('debug-pause'),
            debugResume: document.getElementById('debug-resume'),
            debugStep: document.getElementById('debug-step'),
            debugShowData: document.getElementById('debug-show-data'),
            debugClearData: document.getElementById('debug-clear-data'),
            debugEnableSave: document.getElementById('debug-enable-save'),
            debugGameStatus: document.getElementById('debug-game-status'),
            debugFps: document.getElementById('debug-fps'),
            debugLastUpdate: document.getElementById('debug-last-update'),
            debugAutoDice: document.getElementById('debug-auto-dice'),
            debugLog: document.getElementById('debug-log')
        };
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // 手動ダイスを振るボタン
        this.elements.rollManualDiceBtn?.addEventListener('click', () => {
            const rollResult = this.systems.dice.rollManualDice();
            this.updateManualDiceDisplay(rollResult);
            
            // プレイヤーを移動
            const moveResult = this.systems.board.movePlayer(rollResult.total);
            this.handlePlayerMove(moveResult);
        });
        
        // 手動ダイス個数アップグレード
        this.elements.upgradeManualCountBtn?.addEventListener('click', () => {
            if (this.systems.upgrade.upgradeManualDiceCount()) {
                this.updateUI();
            }
        });
        
        // プレステージボタン
        this.elements.prestigeBtn?.addEventListener('click', () => {
            const result = this.systems.prestige.prestige();
            if (result.success) {
                this.generateGameBoard();
                this.updateUI();
                this.systems.storage.saveGameState(this.gameState);
            }
        });
        
        // 統計ボタン
        this.elements.statsBtn?.addEventListener('click', () => {
            this.showStats();
        });
        
        // デバッグパネルのイベントリスナー
        this.setupDebugEventListeners();
    }

    // プレイヤー移動の処理
    handlePlayerMove(moveResult) {
        // 盤面再生成が必要かチェック
        if (moveResult.levelChanged) {
            this.generateGameBoard();
        } else {
            this.updatePlayerPosition();
        }
        
        // 基本情報のみ更新
        this.updateGameInfo();
        this.updatePrestigeButton();
        
        // マス目の効果を適用
        const effect = this.systems.board.applySquareEffect(this.gameState.position);
        this.animateSquareEffect(effect);
    }

    // マス目効果のアニメーション処理
    animateSquareEffect(effect) {
        const cell = this.elements.gameBoard?.querySelector(`[data-position="${effect.position}"]`);
        if (!cell) return;
        
        switch (effect.type) {
            case 'credit':
                this.animationManager.animateCreditGain(cell);
                break;
            case 'forward':
                this.animationManager.animateForwardEffect(cell);
                if (effect.moveResult) {
                    this.animationManager.animatePlayerMove(
                        effect.moveResult.oldPosition,
                        effect.moveResult.newPosition,
                        this.elements.gameBoard
                    );
                }
                break;
            case 'backward':
                this.animationManager.animateBackwardEffect(cell);
                if (effect.moveResult) {
                    this.animationManager.animatePlayerMove(
                        effect.moveResult.oldPosition,
                        effect.moveResult.newPosition,
                        this.elements.gameBoard
                    );
                }
                break;
        }
    }

    // 手動ダイス表示の更新
    updateManualDiceDisplay(rollResult) {
        if (!this.elements.manualDiceResult) return;
        
        this.animationManager.animateManualDiceResult(
            this.elements.manualDiceResult,
            rollResult.quality,
            this.gameState.manualDice.count,
            rollResult.results,
            rollResult.total
        );
    }

    // ゲームボードの生成
    generateGameBoard() {
        const board = this.elements.gameBoard;
        if (!board) return;
        
        board.innerHTML = '';
        
        const boardData = this.systems.board.getBoardData();
        
        boardData.forEach(cellData => {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.position = cellData.position;
            cell.dataset.cellType = cellData.type;
            cell.dataset.cellEffect = cellData.effect || '';
            
            // マス番号
            const cellNumber = document.createElement('div');
            cellNumber.className = 'cell-number';
            cellNumber.textContent = cellData.position;
            cell.appendChild(cellNumber);
            
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
        });
        
        this.updatePlayerPosition();
    }

    // プレイヤー位置の更新
    updatePlayerPosition() {
        if (!this.elements.gameBoard) return;
        
        // 既存のプレイヤー位置をクリア
        this.elements.gameBoard.querySelectorAll('.player-position').forEach(cell => {
            cell.classList.remove('player-position');
            const icon = cell.querySelector('.player-icon');
            if (icon) icon.remove();
        });
        
        // 新しい位置にプレイヤーアイコンを配置
        const currentCell = this.elements.gameBoard.querySelector(`[data-position="${this.gameState.position}"]`);
        if (currentCell) {
            currentCell.classList.add('player-position');
            
            const playerIcon = document.createElement('div');
            playerIcon.className = 'player-icon';
            playerIcon.textContent = '🚀';
            currentCell.appendChild(playerIcon);
        }
    }

    // UI更新
    updateUI() {
        this.updateGameInfo();
        this.updateManualDiceUI();
        this.updateAutoDiceUI();
        this.updatePrestigeButton();
    }

    // ゲーム情報の更新
    updateGameInfo() {
        if (this.elements.credits) {
            this.elements.credits.textContent = formatNumber(this.gameState.credits);
        }
        if (this.elements.position) {
            this.elements.position.textContent = this.gameState.position;
        }
        if (this.elements.level) {
            this.elements.level.textContent = this.gameState.level;
        }
        if (this.elements.prestigeEarned) {
            this.elements.prestigeEarned.textContent = this.gameState.prestigePoints.earned;
        }
        if (this.elements.prestigeAvailable) {
            this.elements.prestigeAvailable.textContent = this.gameState.prestigePoints.available;
        }
        
        this.updateBurdenInfo();
    }

    // 負荷レベル情報の更新
    updateBurdenInfo() {
        const burdenInfo = this.systems.dice.getBurdenInfo();
        
        if (burdenInfo.level > 0) {
            // 負荷レベルが発生している場合は表示
            if (this.elements.burdenDisplay) {
                this.elements.burdenDisplay.style.display = 'block';
            }
            if (this.elements.burdenLevel) {
                this.elements.burdenLevel.textContent = burdenInfo.level;
            }
            if (this.elements.burdenEffects) {
                let effectsText = '';
                if (burdenInfo.diceReduction > 0) {
                    effectsText += `出目-${burdenInfo.diceReduction}`;
                }
                if (burdenInfo.totalHalving) {
                    if (effectsText) effectsText += ', ';
                    effectsText += '総計半減';
                }
                this.elements.burdenEffects.textContent = effectsText;
            }
        } else {
            // 負荷レベルが0の場合は非表示
            if (this.elements.burdenDisplay) {
                this.elements.burdenDisplay.style.display = 'none';
            }
        }
    }

    // 手動ダイスUIの更新
    updateManualDiceUI() {
        const upgradeInfo = this.systems.upgrade.getAllUpgradeInfo();
        
        if (this.elements.manualDiceCount) {
            this.elements.manualDiceCount.textContent = upgradeInfo.manual.currentCount;
        }
        if (this.elements.manualUpgradeCost) {
            this.elements.manualUpgradeCost.textContent = formatNumber(upgradeInfo.manual.cost);
        }
        if (this.elements.upgradeManualCountBtn) {
            this.elements.upgradeManualCountBtn.disabled = !upgradeInfo.manual.canAfford;
            this.animationManager.updateButtonAffordability(
                this.elements.upgradeManualCountBtn,
                upgradeInfo.manual.canAfford,
                upgradeInfo.manual.cost,
                this.gameState.credits
            );
        }
    }

    // 自動ダイスUIの更新
    updateAutoDiceUI() {
        const container = this.elements.autoDiceContainer;
        if (!container) return;
        
        container.innerHTML = '';
        
        const upgradeInfo = this.systems.upgrade.getAllUpgradeInfo();
        
        upgradeInfo.auto.forEach((diceInfo, index) => {
            const dicePanel = this.createAutoDicePanel(diceInfo, index);
            container.appendChild(dicePanel);
        });
    }

    // 自動ダイスパネルの作成
    createAutoDicePanel(diceInfo, index) {
        const dicePanel = document.createElement('div');
        let panelClasses = 'auto-dice-panel mb-3 p-2 border rounded';
        panelClasses += diceInfo.unlocked ? ' unlocked' : ' locked';
        dicePanel.className = panelClasses;
        
        dicePanel.setAttribute('data-dice-index', index);
        dicePanel.setAttribute('data-dice-faces', diceInfo.faces);
        dicePanel.setAttribute('data-unlocked', diceInfo.unlocked);
        
        // ダイスタイトル
        const title = document.createElement('h6');
        title.className = 'text-center mb-2';
        const statusIndicator = diceInfo.unlocked ? '✅' : '🔒';
        const emoji = DICE_CONFIGS[index]?.emoji || '🎲';
        title.innerHTML = `${statusIndicator} ${emoji} ${diceInfo.faces}面ダイス`;
        dicePanel.appendChild(title);
        
        if (!diceInfo.unlocked) {
            this.addUnlockButton(dicePanel, diceInfo, index);
        } else {
            this.addUnlockedDiceContent(dicePanel, diceInfo, index);
        }
        
        return dicePanel;
    }

    // 解禁ボタンの追加
    addUnlockButton(panel, diceInfo, index) {
        const unlockBtn = document.createElement('button');
        let buttonClass = 'btn btn-outline-success btn-sm w-100';
        if (diceInfo.canUnlock) {
            buttonClass += ' btn-ripple';
        }
        unlockBtn.className = buttonClass;
        unlockBtn.innerHTML = `🔓 解禁<br><small>コスト: ${formatNumber(diceInfo.unlockCost)}💰</small>`;
        unlockBtn.disabled = !diceInfo.canUnlock;
        
        unlockBtn.addEventListener('click', () => {
            if (this.systems.upgrade.unlockAutoDice(index)) {
                this.updateUI();
            }
        });
        
        this.animationManager.updateButtonAffordability(
            unlockBtn,
            diceInfo.canUnlock,
            diceInfo.unlockCost,
            this.gameState.credits
        );
        
        panel.appendChild(unlockBtn);
    }

    // 解禁済みダイスのコンテンツ追加
    addUnlockedDiceContent(panel, diceInfo, index) {
        // クールダウンゲージ
        this.addCooldownGauge(panel, index);
        
        // アップグレードボタン群
        this.addUpgradeButtons(panel, diceInfo, index);
        
        // ステータス表示
        this.addStatusDisplay(panel, diceInfo, index);
    }

    // クールダウンゲージの追加
    addCooldownGauge(panel, index) {
        const cooldownContainer = document.createElement('div');
        cooldownContainer.className = 'cooldown-container mb-2';
        
        const cooldownLabel = document.createElement('small');
        cooldownLabel.className = 'd-block text-center text-muted';
        const interval = this.systems.dice.getAutoDiceInterval(index);
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
        panel.appendChild(cooldownContainer);
    }

    // アップグレードボタンの追加
    addUpgradeButtons(panel, diceInfo, index) {
        const upgradeRow = document.createElement('div');
        upgradeRow.className = 'row g-1';
        
        // 速度アップグレード
        const speedCol = document.createElement('div');
        speedCol.className = 'col-6';
        const speedBtn = this.createUpgradeButton(
            '⚡ 速度',
            diceInfo.speedUpgradeCost,
            diceInfo.canUpgradeSpeed,
            'btn-outline-primary',
            () => {
                if (this.systems.upgrade.upgradeAutoDiceSpeed(index)) {
                    this.updateUI();
                }
            }
        );
        speedCol.appendChild(speedBtn);
        
        // 個数アップグレード
        const countCol = document.createElement('div');
        countCol.className = 'col-6';
        const countBtn = this.createUpgradeButton(
            '🎯 個数',
            diceInfo.countUpgradeCost,
            diceInfo.canUpgradeCount,
            'btn-outline-warning',
            () => {
                if (this.systems.upgrade.upgradeAutoDiceCount(index)) {
                    this.updateUI();
                }
            }
        );
        countCol.appendChild(countBtn);
        
        upgradeRow.appendChild(speedCol);
        upgradeRow.appendChild(countCol);
        panel.appendChild(upgradeRow);
    }

    // アップグレードボタンの作成
    createUpgradeButton(text, cost, canAfford, buttonClass, clickHandler) {
        const button = document.createElement('button');
        button.className = `btn ${buttonClass} btn-sm w-100` + (canAfford ? ' btn-ripple' : '');
        button.innerHTML = `${text}<br><small>${formatNumber(cost)}💰</small>`;
        button.disabled = !canAfford;
        button.addEventListener('click', clickHandler);
        
        this.animationManager.updateButtonAffordability(
            button,
            canAfford,
            cost,
            this.gameState.credits
        );
        
        return button;
    }

    // ステータス表示の追加
    addStatusDisplay(panel, diceInfo, index) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'text-center mt-2 p-2 bg-light rounded';
        
        const diceDetails = this.systems.dice.getAutoDiceInfo(index);
        const statusInfo = document.createElement('small');
        statusInfo.className = 'text-muted d-block';
        
        statusInfo.innerHTML = `
            📊 <strong>ステータス</strong><br>
            🎯 個数: <span class="text-primary fw-bold">${diceInfo.count}</span> | 
            ⚡ 速度Lv: <span class="text-info fw-bold">${diceInfo.speedLevel}</span><br>
            ⏱️ 間隔: <span class="text-success">${(diceDetails.interval / 1000).toFixed(1)}秒</span> | 
            📈 毎分: <span class="text-warning fw-bold">${diceDetails.rollsPerMinute}回</span>
        `;
        statusDiv.appendChild(statusInfo);
        
        // パフォーマンス指標
        const performanceDiv = document.createElement('div');
        performanceDiv.className = 'mt-1';
        
        let performanceClass = '';
        let performanceText = '';
        if (diceDetails.rollsPerMinute >= 30) {
            performanceClass = 'badge bg-success';
            performanceText = '🚀 高性能';
        } else if (diceDetails.rollsPerMinute >= 15) {
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
        panel.appendChild(statusDiv);
    }

    // プレステージボタンの更新
    updatePrestigeButton() {
        if (!this.elements.prestigeBtn) return;
        
        const prestigeInfo = this.systems.prestige.getPrestigeInfo();
        this.elements.prestigeBtn.disabled = !prestigeInfo.canPrestige;
        
        if (prestigeInfo.canPrestige) {
            this.elements.prestigeBtn.innerHTML = `✨ 転生する<br><small>獲得PP: ${prestigeInfo.earned}</small>`;
        } else {
            this.elements.prestigeBtn.innerHTML = `転生する<br><small>レベルアップで解放</small>`;
        }
    }

    // クールダウンゲージの更新
    updateAutoDiceCooldowns() {
        const currentTime = performance.now();
        
        this.gameState.autoDice.forEach((dice, index) => {
            if (!dice.unlocked) return;
            
            const progressBar = document.getElementById(`cooldown-${index}`);
            if (!progressBar) return;
            
            const interval = this.systems.dice.getAutoDiceInterval(index);
            const elapsed = currentTime - dice.lastRoll;
            const progress = Math.min(100, (elapsed / interval) * 100);
            
            this.animationManager.updateCooldownProgress(progressBar, progress);
        });
    }

    // 統計表示
    showStats() {
        const stats = this.systems.prestige.getDetailedStats();
        
        // 統計データを更新
        if (this.elements.statDiceRolls) {
            this.elements.statDiceRolls.textContent = formatNumber(stats.current.diceRolls);
        }
        if (this.elements.statTotalMoves) {
            this.elements.statTotalMoves.textContent = formatNumber(stats.current.totalMoves);
        }
        if (this.elements.statTotalCredits) {
            this.elements.statTotalCredits.textContent = formatNumber(stats.current.creditsEarned);
        }
        if (this.elements.statRebirths) {
            this.elements.statRebirths.textContent = stats.current.rebirths;
        }
        if (this.elements.statTotalPrestige) {
            this.elements.statTotalPrestige.textContent = stats.current.totalPrestigePoints;
        }
        if (this.elements.statCurrentLevel) {
            this.elements.statCurrentLevel.textContent = stats.current.currentLevel;
        }
        
        // モーダルを表示
        const modal = new bootstrap.Modal(document.getElementById('statsModal'));
        modal.show();
    }

    // デバッグ機能のイベントリスナー設定
    setupDebugEventListeners() {
        // デバッグモードの判定（localhost または debug=true パラメータ）
        const isDebugMode = this.isDebugMode();
        if (isDebugMode) {
            document.body.classList.add('debug-mode');
            this.initializeDebugPanel();
        }
    }

    // デバッグモードの判定
    isDebugMode() {
        const urlParams = new URLSearchParams(window.location.search);
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const debugParam = urlParams.get('debug') === 'true';
        
        return isLocalhost || debugParam;
    }

    // デバッグパネルの初期化
    initializeDebugPanel() {
        // デバッグログ配列
        this.debugLogs = [];
        this.maxLogEntries = 20;

        // デバッグトグルボタン
        this.elements.debugToggle?.addEventListener('click', () => {
            this.toggleDebugPanel();
        });

        // ゲーム制御ボタン
        this.elements.debugPause?.addEventListener('click', () => {
            this.debugPauseGame();
        });

        this.elements.debugResume?.addEventListener('click', () => {
            this.debugResumeGame();
        });

        this.elements.debugStep?.addEventListener('click', () => {
            this.debugStepOneTick();
        });

        // データ管理ボタン
        this.elements.debugShowData?.addEventListener('click', () => {
            this.debugShowData();
        });

        this.elements.debugClearData?.addEventListener('click', () => {
            this.debugClearData();
        });

        this.elements.debugEnableSave?.addEventListener('click', () => {
            this.debugEnableSave();
        });

        // デバッグステータスの定期更新
        this.debugUpdateInterval = setInterval(() => {
            this.updateDebugStatus();
        }, 1000);

        this.addDebugLog('デバッグモードが有効になりました');
    }

    // デバッグパネルの表示切り替え
    toggleDebugPanel() {
        const content = this.elements.debugContent;
        if (!content) return;

        const isVisible = content.style.display !== 'none';
        content.style.display = isVisible ? 'none' : 'block';
        
        this.addDebugLog(`デバッグパネル: ${isVisible ? '非表示' : '表示'}`);
    }

    // ゲーム一時停止
    debugPauseGame() {
        if (this.systems.gameLoop && this.systems.gameLoop.pause) {
            this.systems.gameLoop.pause();
            this.addDebugLog('ゲームを一時停止しました');
        }
    }

    // ゲーム再開
    debugResumeGame() {
        if (this.systems.gameLoop && this.systems.gameLoop.resume) {
            this.systems.gameLoop.resume();
            this.addDebugLog('ゲームを再開しました');
        }
    }

    // 1Tick進める
    debugStepOneTick() {
        if (this.systems.gameLoop && this.systems.gameLoop.stepOneTick) {
            const result = this.systems.gameLoop.stepOneTick();
            if (result) {
                this.addDebugLog('1Tick実行しました');
                this.updateUI(); // UI更新
            } else {
                this.addDebugLog('1Tick実行失敗（ゲームが実行中）');
            }
        }
    }

    // データ表示
    debugShowData() {
        if (this.systems.storage && this.systems.storage.debugShowStorageData) {
            const data = this.systems.storage.debugShowStorageData();
            this.addDebugLog(`データ表示: ${data.exists ? 'あり' : 'なし'}`);
            if (data.exists) {
                this.addDebugLog(`サイズ: ${(data.size / 1024).toFixed(2)} KB`);
            }
        }
    }

    // セーブデータ削除
    debugClearData() {
        if (confirm('セーブデータを削除しますか？\n※バックアップがコンソールに出力されます\n※リロード後は初期状態から開始されます')) {
            if (this.systems.storage && this.systems.storage.clearSaveData) {
                const result = this.systems.storage.clearSaveData(true);
                if (result.success) {
                    this.addDebugLog('セーブデータを削除しました');
                    if (result.backup) {
                        this.addDebugLog('バックアップをコンソールに出力しました');
                    }
                    // ページリロードを提案
                    if (confirm('削除完了。ページをリロードして初期状態から開始しますか？')) {
                        window.location.reload();
                    }
                } else {
                    this.addDebugLog(`削除失敗: ${result.error}`);
                }
            }
        }
    }

    // 保存機能再有効化
    debugEnableSave() {
        if (this.systems.storage && this.systems.storage.enableAutoSave) {
            const result = this.systems.storage.enableAutoSave();
            if (result) {
                this.addDebugLog('自動保存機能を再有効化しました');
            }
        }
    }

    // デバッグステータス更新
    updateDebugStatus() {
        if (!this.systems.gameLoop) return;

        const status = this.systems.gameLoop.getStatus();
        const debugInfo = this.systems.gameLoop.getDebugInfo();

        if (this.elements.debugGameStatus) {
            this.elements.debugGameStatus.textContent = status.isRunning ? '実行中' : '停止中';
        }

        if (this.elements.debugFps) {
            this.elements.debugFps.textContent = debugInfo.fps || 0;
        }

        if (this.elements.debugLastUpdate) {
            this.elements.debugLastUpdate.textContent = new Date(status.lastUpdateTime).toLocaleTimeString();
        }

        if (this.elements.debugAutoDice) {
            const unlockedCount = this.gameState.autoDice.filter(d => d.unlocked).length;
            this.elements.debugAutoDice.textContent = `${unlockedCount}/7`;
        }
    }

    // デバッグログ追加
    addDebugLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        
        this.debugLogs.push(logEntry);
        
        // ログ数制限
        if (this.debugLogs.length > this.maxLogEntries) {
            this.debugLogs.shift();
        }

        // ログ表示更新
        if (this.elements.debugLog) {
            this.elements.debugLog.textContent = this.debugLogs.join('\n');
            this.elements.debugLog.scrollTop = this.elements.debugLog.scrollHeight;
        }

        // コンソールにも出力
        console.log(`[DEBUG] ${message}`);
    }

    // デバッグパネルのクリーンアップ
    cleanupDebugPanel() {
        if (this.debugUpdateInterval) {
            clearInterval(this.debugUpdateInterval);
        }
    }
}