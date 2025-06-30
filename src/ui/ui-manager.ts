// UI管理・DOM操作・イベント処理

import { formatNumberWithType } from '../utils/math-utils.js';
import { DICE_CONFIGS } from '../utils/constants.js';
import type { GameState } from '../types/game-state.js';
import type { DiceSystem } from '../systems/dice-system.js';
import type { BoardSystem } from '../systems/board-system.js';
import type { UpgradeSystem } from '../systems/upgrade-system.js';
import type { PrestigeSystem } from '../systems/prestige-system.js';
import type { AnimationManager } from './animation-manager.js';

// DOM要素の型定義
interface DOMElements {
    // ゲーム情報
    credits?: HTMLElement;
    position?: HTMLElement;
    level?: HTMLElement;
    prestigeEarned?: HTMLElement;
    prestigeAvailable?: HTMLElement;
    burdenDisplay?: HTMLElement;
    burdenLevel?: HTMLElement;
    burdenEffects?: HTMLElement;
    
    // 手動ダイス
    manualDiceResult?: HTMLElement;
    rollManualDiceBtn?: HTMLButtonElement;
    upgradeManualCountBtn?: HTMLButtonElement;
    manualDiceCount?: HTMLElement;
    manualUpgradeCost?: HTMLElement;
    
    // 自動ダイス
    autoDiceContainer?: HTMLElement;
    
    // ゲームボード
    gameBoard?: HTMLElement;
    
    // プレステージ
    prestigeBtn?: HTMLButtonElement;
    availablePrestigePoints?: HTMLElement;
    prestigeUpgradeCredit?: HTMLButtonElement;
    prestigeUpgradeSpeed?: HTMLButtonElement;
    creditMultiplierCost?: HTMLElement;
    creditMultiplierLevel?: HTMLElement;
    creditMultiplierEffect?: HTMLElement;
    diceSpeedCost?: HTMLElement;
    diceSpeedLevel?: HTMLElement;
    diceSpeedEffect?: HTMLElement;
    
    // 統計
    statsBtn?: HTMLButtonElement;
    statDiceRolls?: HTMLElement;
    statTotalMoves?: HTMLElement;
    statTotalCredits?: HTMLElement;
    statRebirths?: HTMLElement;
    statTotalPrestige?: HTMLElement;
    statCurrentLevel?: HTMLElement;
    
    // デバッグパネル
    debugPanel?: HTMLElement;
    debugToggle?: HTMLButtonElement;
    debugContent?: HTMLElement;
    debugPause?: HTMLButtonElement;
    debugResume?: HTMLButtonElement;
    debugStep?: HTMLButtonElement;
    debugShowData?: HTMLButtonElement;
    debugClearData?: HTMLButtonElement;
    debugEnableSave?: HTMLButtonElement;
    debugGameStatus?: HTMLElement;
    debugFps?: HTMLElement;
    debugLastUpdate?: HTMLElement;
    debugAutoDice?: HTMLElement;
    debugLog?: HTMLElement;
}

// システムの型定義
interface Systems {
    dice: DiceSystem;
    board: BoardSystem;
    upgrade: UpgradeSystem;
    prestige: PrestigeSystem;
    storage?: {
        saveGameState: () => boolean;
        clearSaveData: (createBackup?: boolean) => any;
        debugShowStorageData: () => any;
        enableAutoSave: () => boolean;
        gameState: GameState;
    };
    gameLoop?: {  // GameLoopは初期化時に存在しない可能性がある
        pause: () => void;
        resume: () => void;
        step: () => void;
        isPaused: () => boolean;
        getDebugInfo: () => { currentTick: number; [key: string]: any };
    };
}

// ダイス結果の型定義
interface RollResult {
    total: number;
    results: number[];
    quality: number;
}

// 移動結果の型定義
interface MoveResult {
    oldPosition: number;
    newPosition: number;
    levelChanged: boolean;
    prestigeEarned: number;
}

// マス効果の型定義
interface SquareEffect {
    type: string;
    position: number;
    moveResult?: MoveResult;
}


export class UIManager {
    private gameState: GameState;
    private systems: Systems;
    private animationManager: AnimationManager;
    private elements: DOMElements;

    constructor(gameState: GameState, systems: Systems, animationManager: AnimationManager) {
        this.gameState = gameState;
        this.systems = systems;
        this.animationManager = animationManager;
        this.elements = {};
    }

    // フォーマット済み数値を取得（設定に応じて）
    private formatNumberBySetting(num: number): string {
        return formatNumberWithType(num, this.gameState.settings.numberFormat);
    }

    // DOM要素のバインド
    bindDOMElements(): void {
        this.elements = {
            // ゲーム情報
            credits: document.getElementById('credits') as HTMLElement,
            position: document.getElementById('position') as HTMLElement,
            level: document.getElementById('level') as HTMLElement,
            prestigeEarned: document.getElementById('prestige-earned') as HTMLElement,
            prestigeAvailable: document.getElementById('prestige-available') as HTMLElement,
            burdenDisplay: document.getElementById('burden-display') as HTMLElement,
            burdenLevel: document.getElementById('burden-level') as HTMLElement,
            burdenEffects: document.getElementById('burden-effects') as HTMLElement,
            
            // 手動ダイス
            manualDiceResult: document.getElementById('manual-dice-result') as HTMLElement,
            rollManualDiceBtn: document.getElementById('roll-manual-dice') as HTMLButtonElement,
            upgradeManualCountBtn: document.getElementById('upgrade-manual-count') as HTMLButtonElement,
            manualDiceCount: document.getElementById('manual-dice-count') as HTMLElement,
            manualUpgradeCost: document.getElementById('manual-upgrade-cost') as HTMLElement,
            
            // 自動ダイス
            autoDiceContainer: document.getElementById('auto-dice-container') as HTMLElement,
            
            // ゲームボード
            gameBoard: document.getElementById('game-board') as HTMLElement,
            
            // プレステージ
            prestigeBtn: document.getElementById('prestige-btn') as HTMLButtonElement,
            availablePrestigePoints: document.getElementById('available-prestige-points') as HTMLElement,
            prestigeUpgradeCredit: document.getElementById('prestige-upgrade-credit') as HTMLButtonElement,
            prestigeUpgradeSpeed: document.getElementById('prestige-upgrade-speed') as HTMLButtonElement,
            creditMultiplierCost: document.getElementById('credit-multiplier-cost') as HTMLElement,
            creditMultiplierLevel: document.getElementById('credit-multiplier-level') as HTMLElement,
            creditMultiplierEffect: document.getElementById('credit-multiplier-effect') as HTMLElement,
            diceSpeedCost: document.getElementById('dice-speed-cost') as HTMLElement,
            diceSpeedLevel: document.getElementById('dice-speed-level') as HTMLElement,
            diceSpeedEffect: document.getElementById('dice-speed-effect') as HTMLElement,
            
            // 統計
            statsBtn: document.getElementById('stats-btn') as HTMLButtonElement,
            statDiceRolls: document.getElementById('stat-dice-rolls') as HTMLElement,
            statTotalMoves: document.getElementById('stat-total-moves') as HTMLElement,
            statTotalCredits: document.getElementById('stat-total-credits') as HTMLElement,
            statRebirths: document.getElementById('stat-rebirths') as HTMLElement,
            statTotalPrestige: document.getElementById('stat-total-prestige') as HTMLElement,
            statCurrentLevel: document.getElementById('stat-current-level') as HTMLElement,
            
            // デバッグパネル
            debugPanel: document.getElementById('debug-panel') as HTMLElement,
            debugToggle: document.getElementById('debug-toggle') as HTMLButtonElement,
            debugContent: document.getElementById('debug-content') as HTMLElement,
            debugPause: document.getElementById('debug-pause') as HTMLButtonElement,
            debugResume: document.getElementById('debug-resume') as HTMLButtonElement,
            debugStep: document.getElementById('debug-step') as HTMLButtonElement,
            debugShowData: document.getElementById('debug-show-data') as HTMLButtonElement,
            debugClearData: document.getElementById('debug-clear-data') as HTMLButtonElement,
            debugEnableSave: document.getElementById('debug-enable-save') as HTMLButtonElement,
            debugGameStatus: document.getElementById('debug-game-status') as HTMLElement,
            debugFps: document.getElementById('debug-fps') as HTMLElement,
            debugLastUpdate: document.getElementById('debug-last-update') as HTMLElement,
            debugAutoDice: document.getElementById('debug-auto-dice') as HTMLElement,
            debugLog: document.getElementById('debug-log') as HTMLElement
        };
    }

    // イベントリスナーの設定
    setupEventListeners(): void {
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
                this.systems.storage?.saveGameState();
            }
        });
        
        // プレステージアップグレードボタン
        this.elements.prestigeUpgradeCredit?.addEventListener('click', () => {
            if (this.systems.prestige.buyPrestigeUpgrade('creditMultiplier')) {
                this.updateUI();
                this.systems.storage?.saveGameState();
            }
        });
        
        this.elements.prestigeUpgradeSpeed?.addEventListener('click', () => {
            if (this.systems.prestige.buyPrestigeUpgrade('diceSpeedBoost')) {
                this.updateUI();
                this.systems.storage?.saveGameState();
            }
        });
        
        // 統計ボタン
        this.elements.statsBtn?.addEventListener('click', () => {
            this.showStats();
        });
        
        // 設定変更のイベントリスナー
        this.setupSettingsEventListeners();
        
        // デバッグパネルのイベントリスナー
        this.setupDebugEventListeners();
    }

    // プレイヤー移動の処理
    handlePlayerMove(moveResult: MoveResult): void {
        // 盤面再生成が必要かチェック
        if (moveResult.levelChanged) {
            this.generateGameBoard();
        } else {
            this.updatePlayerPosition();
        }
        
        // 基本情報とボタン状態の軽量更新
        this.updateGameInfo();
        this.updateUILight();
        
        // マス目の効果を適用
        const effect = this.systems.board.applySquareEffect(this.gameState.position);
        this.animateSquareEffect(effect);
    }

    // マス目効果のアニメーション処理
    animateSquareEffect(effect: SquareEffect): void {
        const cell = this.elements.gameBoard?.querySelector(`[data-position="${effect.position}"]`) as HTMLElement;
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
                        this.elements.gameBoard as HTMLElement
                    );
                }
                break;
            case 'backward':
                this.animationManager.animateBackwardEffect(cell);
                if (effect.moveResult) {
                    this.animationManager.animatePlayerMove(
                        effect.moveResult.oldPosition,
                        effect.moveResult.newPosition,
                        this.elements.gameBoard as HTMLElement
                    );
                }
                break;
        }
    }

    // 手動ダイス表示の更新
    updateManualDiceDisplay(rollResult: RollResult): void {
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
    generateGameBoard(): void {
        const board = this.elements.gameBoard;
        if (!board) return;
        
        board.innerHTML = '';
        
        const boardData = this.systems.board.getBoardData();
        
        boardData.forEach(cellData => {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.dataset.position = cellData.position.toString();
            cell.dataset.cellType = cellData.type;
            cell.dataset.cellEffect = cellData.effect?.toString() || '';
            
            // マス番号
            const cellNumber = document.createElement('div');
            cellNumber.className = 'cell-number';
            cellNumber.textContent = cellData.position.toString();
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
                    effectDiv.innerHTML = `💰<br><small>${cellData.effect}</small>`;
                    cell.classList.add('credit');
                    break;
                case 'forward':
                    effectDiv.innerHTML = `➡️<br><small>+${cellData.effect}</small>`;
                    cell.classList.add('forward');
                    break;
                case 'backward':
                    effectDiv.innerHTML = `⬅️<br><small>-${cellData.effect}</small>`;
                    cell.classList.add('backward');
                    break;
            }
            
            cell.appendChild(effectDiv);
            
            // プレイヤー位置のマーク
            if (cellData.isPlayerPosition) {
                cell.classList.add('player-position');
                const playerIcon = document.createElement('div');
                playerIcon.className = 'player-icon';
                playerIcon.textContent = '🚀';
                cell.appendChild(playerIcon);
            }
            
            board.appendChild(cell);
        });
    }

    // プレイヤー位置の更新
    updatePlayerPosition(): void {
        const board = this.elements.gameBoard;
        if (!board) return;
        
        // 既存のプレイヤー位置をクリア
        const oldPlayerCells = board.querySelectorAll('.player-position');
        oldPlayerCells.forEach(cell => {
            cell.classList.remove('player-position');
            const icon = cell.querySelector('.player-icon');
            if (icon) icon.remove();
        });
        
        // 新しい位置にプレイヤーアイコンを配置
        const newCell = board.querySelector(`[data-position="${this.gameState.position}"]`) as HTMLElement;
        if (newCell) {
            newCell.classList.add('player-position');
            
            const playerIcon = document.createElement('div');
            playerIcon.className = 'player-icon';
            playerIcon.textContent = '🚀';
            newCell.appendChild(playerIcon);
        }
    }

    // ゲーム情報の更新
    updateGameInfo(): void {
        if (this.elements.credits) {
            this.elements.credits.textContent = this.formatNumberBySetting(this.gameState.credits);
        }
        if (this.elements.position) {
            this.elements.position.textContent = this.gameState.position.toString();
        }
        if (this.elements.level) {
            this.elements.level.textContent = this.gameState.level.toString();
        }
        if (this.elements.prestigeEarned) {
            this.elements.prestigeEarned.textContent = this.formatNumberBySetting(this.gameState.prestigePoints.earned);
        }
        if (this.elements.prestigeAvailable) {
            this.elements.prestigeAvailable.textContent = this.formatNumberBySetting(this.gameState.prestigePoints.available);
        }
        
        // 負荷システムの表示
        this.updateBurdenDisplay();
    }

    // 負荷システム表示の更新
    updateBurdenDisplay(): void {
        const burdenInfo = this.systems.dice.getBurdenInfo();
        
        if (burdenInfo.level > 0) {
            if (this.elements.burdenDisplay) {
                this.elements.burdenDisplay.style.display = 'block';
            }
            if (this.elements.burdenLevel) {
                this.elements.burdenLevel.textContent = burdenInfo.level.toString();
            }
            if (this.elements.burdenEffects) {
                let effectText = '';
                if (burdenInfo.diceReduction > 0) {
                    effectText += `出目-${burdenInfo.diceReduction}`;
                }
                if (burdenInfo.totalHalving) {
                    effectText += effectText ? ', 総計半減' : '総計半減';
                }
                this.elements.burdenEffects.textContent = effectText;
            }
        } else {
            if (this.elements.burdenDisplay) {
                this.elements.burdenDisplay.style.display = 'none';
            }
        }
    }

    // UI全体の更新
    updateUI(): void {
        this.updateGameInfo();
        this.updateManualDiceUI();
        this.updateAutoDiceUI();
        this.updatePrestigeButton();
        this.updatePrestigeUpgrades();
        this.updateStats();
    }

    // 軽量版UI更新（ボタン状態のみ）
    updateUILight(): void {
        this.updateManualDiceUI();
        this.updatePrestigeButton();
        this.updatePrestigeUpgrades();
        
        // 自動ダイスの軽量更新
        if (this.shouldRegenerateAutoDice()) {
            this.updateAutoDiceUI();
        } else {
            this.updateExistingAutoDice();
        }
    }

    // 手動ダイスUIの更新
    updateManualDiceUI(): void {
        const upgradeInfo = this.systems.upgrade.getAllUpgradeInfo();
        
        if (this.elements.manualDiceCount) {
            this.elements.manualDiceCount.textContent = upgradeInfo.manual.currentCount.toString();
        }
        if (this.elements.manualUpgradeCost) {
            this.elements.manualUpgradeCost.textContent = this.formatNumberBySetting(upgradeInfo.manual.cost);
        }
        
        // ボタンの有効性更新
        if (this.elements.upgradeManualCountBtn) {
            this.elements.upgradeManualCountBtn.disabled = !upgradeInfo.manual.canAfford;
            this.animationManager.updateButtonAffordability(
                this.elements.upgradeManualCountBtn,
                upgradeInfo.manual.canAfford,
                upgradeInfo.manual.cost,
                upgradeInfo.totalCredits
            );
        }
    }

    // 自動ダイス全体更新が必要かチェック
    shouldRegenerateAutoDice(): boolean {
        const container = this.elements.autoDiceContainer;
        if (!container) return true;
        
        const currentPanels = container.querySelectorAll('[data-dice-index]');
        const upgradeInfo = this.systems.upgrade.getAllUpgradeInfo();
        
        // パネル数が異なる場合は再生成
        if (currentPanels.length !== upgradeInfo.auto.length) {
            return true;
        }
        
        // 解禁状態またはアセンション可能状態が変わった場合は再生成
        for (let i = 0; i < upgradeInfo.auto.length; i++) {
            const panel = currentPanels[i] as HTMLElement;
            const diceInfo = upgradeInfo.auto[i];
            if (!diceInfo) continue;
            
            const wasUnlocked = panel.dataset.unlocked === 'true';
            const isUnlocked = diceInfo.unlocked;
            
            // 解禁状態の変更
            if (wasUnlocked !== isUnlocked) {
                return true;
            }
            
            // アセンション可能状態の変更（解禁済みダイスのみ）
            if (isUnlocked) {
                const wasCanAscend = panel.dataset.canAscend === 'true';
                const canAscend = diceInfo.level >= diceInfo.maxLevel;
                
                if (wasCanAscend !== canAscend) {
                    return true;
                }
            }
        }
        
        return false;
    }

    // 自動ダイスUIの更新
    updateAutoDiceUI(): void {
        if (this.shouldRegenerateAutoDice()) {
            this.generateAutoDiceUI();
        } else {
            this.updateExistingAutoDice();
        }
    }
    
    // 自動ダイスUIの強制再生成（レベルアップ・アセンション後に使用）
    forceRegenerateAutoDiceUI(): void {
        this.generateAutoDiceUI();
    }

    // 自動ダイスUIの生成
    generateAutoDiceUI(): void {
        const container = this.elements.autoDiceContainer;
        if (!container) return;
        
        container.innerHTML = '';
        
        const upgradeInfo = this.systems.upgrade.getAllUpgradeInfo();
        
        upgradeInfo.auto.forEach((diceInfo) => {
            const panel = this.createAutoDicePanel(diceInfo);
            container.appendChild(panel);
        });
    }

    // 自動ダイスパネルの作成
    createAutoDicePanel(diceInfo: any): HTMLElement {
        const config = DICE_CONFIGS[diceInfo.index];
        if (!config) {
            return document.createElement('div');
        }
        
        const panel = document.createElement('div');
        panel.className = 'upgrade-section mb-3';
        panel.dataset.diceIndex = diceInfo.index.toString();
        panel.dataset.unlocked = diceInfo.unlocked.toString();
        
        // アセンション可能状態も記録
        if (diceInfo.unlocked) {
            panel.dataset.canAscend = (diceInfo.level >= diceInfo.maxLevel).toString();
        }
        
        if (!diceInfo.unlocked) {
            // 未解禁状態
            panel.innerHTML = `
                <h6 class="text-muted">${config.emoji} ${diceInfo.faces}面ダイス</h6>
                <button class="btn btn-outline-warning btn-sm w-100" 
                        data-action="unlock" data-index="${diceInfo.index}">
                    解禁する（レベル1）
                    <br><small>コスト: ${this.formatNumberBySetting(diceInfo.levelUpCost)}💰</small>
                </button>
            `;
        } else {
            // 解禁済み状態 - レベル・アセンション情報を表示
            const autoDiceInfo = this.systems.dice.getAutoDiceInfo(diceInfo.index);
            const intervalSeconds = autoDiceInfo ? this.ticksToSeconds(autoDiceInfo.interval) : 0;
            const progressInfo = this.calculateAutoDiceProgress(diceInfo.index);
            
            // アセンション可能かチェック
            const canAscend = diceInfo.level >= diceInfo.maxLevel;
            
            panel.innerHTML = `
                <h6 class="text-success">${config.emoji} ${diceInfo.faces}面ダイス</h6>
                <div class="mb-2">
                    <small class="text-muted dice-level-info">レベル: ${diceInfo.level}/${diceInfo.maxLevel} | アセンション: ${diceInfo.ascensionLevel}</small>
                    <br><small class="text-muted dice-count-info">個数: ${autoDiceInfo?.count || 1}</small>
                    <br><small class="text-info">間隔: ${intervalSeconds.toFixed(1)}秒 | 毎分: ${autoDiceInfo?.rollsPerMinute || 0}回</small>
                </div>
                <div class="mb-2">
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar progress-bar-striped" 
                             role="progressbar" 
                             style="width: ${(progressInfo.progress * 100).toFixed(1)}%"
                             data-dice-progress="${diceInfo.index}">
                        </div>
                    </div>
                    <small class="text-muted">残り: <span data-dice-timer="${diceInfo.index}">${this.ticksToSeconds(progressInfo.timeLeft).toFixed(1)}s</span></small>
                </div>
                <div class="d-grid gap-1">
                    ${canAscend ? `
                        <button class="btn btn-outline-danger btn-sm" 
                                data-action="ascend" data-index="${diceInfo.index}">
                            アセンション
                            <br><small>コスト: ${this.formatNumberBySetting(diceInfo.ascensionCost)}💰</small>
                        </button>
                    ` : `
                        <button class="btn btn-outline-primary btn-sm" 
                                data-action="levelup" data-index="${diceInfo.index}">
                            レベルアップ
                            <br><small>コスト: ${this.formatNumberBySetting(diceInfo.levelUpCost)}💰</small>
                        </button>
                    `}
                </div>
            `;
        }
        
        // ボタンイベントの設定
        panel.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const button = target.closest('button') as HTMLButtonElement;
            if (!button) return;
            
            const action = button.dataset.action;
            const index = parseInt(button.dataset.index || '0');
            
            switch (action) {
                case 'unlock':
                    if (this.systems.upgrade.unlockAutoDice(index)) {
                        // 解禁時は自動ダイスUIを強制再生成
                        this.forceRegenerateAutoDiceUI();
                        this.updateUI();
                    }
                    break;
                case 'levelup':
                    if (this.systems.upgrade.levelUpAutoDice(index)) {
                        // レベルアップ時は自動ダイスUIを強制再生成
                        this.forceRegenerateAutoDiceUI();
                        this.updateUI();
                    }
                    break;
                case 'ascend':
                    if (this.systems.upgrade.ascendAutoDice(index)) {
                        // アセンション時は自動ダイスUIを強制再生成
                        this.forceRegenerateAutoDiceUI();
                        this.updateUI();
                    }
                    break;
            }
        });
        
        return panel;
    }

    // 既存自動ダイスの更新
    updateExistingAutoDice(): void {
        const container = this.elements.autoDiceContainer;
        if (!container) return;
        
        const upgradeInfo = this.systems.upgrade.getAllUpgradeInfo();
        const panels = container.querySelectorAll('[data-dice-index]');
        
        panels.forEach((panel, index) => {
            const diceInfo = upgradeInfo.auto[index];
            if (!diceInfo) return;
            
            // ボタンの更新
            const buttons = panel.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
            buttons.forEach(button => {
                const action = button.dataset.action;
                let canAfford = false;
                let cost = 0;
                
                switch (action) {
                    case 'unlock':
                        canAfford = diceInfo.canUnlock;
                        cost = diceInfo.levelUpCost;
                        break;
                    case 'levelup':
                        canAfford = diceInfo.canLevelUp;
                        cost = diceInfo.levelUpCost;
                        break;
                    case 'ascend':
                        canAfford = diceInfo.canAscend;
                        cost = diceInfo.ascensionCost;
                        break;
                }
                
                button.disabled = !canAfford;
                this.animationManager.updateButtonAffordability(
                    button,
                    canAfford,
                    cost,
                    upgradeInfo.totalCredits
                );
            });
            
            // 進捗ゲージとタイマーの更新（解禁済みダイスのみ）
            if (diceInfo.unlocked) {
                this.updateAutoDiceProgress(diceInfo.index, panel as HTMLElement);
                
                // レベル情報の更新
                this.updateAutoDiceLevelInfo(diceInfo, panel as HTMLElement);
            }
        });
    }

    // 自動ダイスのレベル情報更新
    updateAutoDiceLevelInfo(diceInfo: any, panel: HTMLElement): void {
        const autoDiceInfo = this.systems.dice.getAutoDiceInfo(diceInfo.index);
        
        // レベル情報のテキスト更新
        const levelInfoElement = panel.querySelector('.dice-level-info');
        if (levelInfoElement) {
            levelInfoElement.textContent = `レベル: ${diceInfo.level}/${diceInfo.maxLevel} | アセンション: ${diceInfo.ascensionLevel}`;
        }
        
        // ダイス個数の更新
        const countInfoElement = panel.querySelector('.dice-count-info');
        if (countInfoElement && autoDiceInfo) {
            countInfoElement.textContent = `個数: ${autoDiceInfo.count}`;
        }
        
        // ボタンテキストとコストの更新
        const buttons = panel.querySelectorAll('button[data-action]') as NodeListOf<HTMLButtonElement>;
        buttons.forEach(button => {
            const action = button.dataset.action;
            if (action === 'levelup') {
                const costElement = button.querySelector('small');
                if (costElement) {
                    costElement.textContent = `コスト: ${this.formatNumberBySetting(diceInfo.levelUpCost)}💰`;
                }
            } else if (action === 'ascend') {
                const costElement = button.querySelector('small');
                if (costElement) {
                    costElement.textContent = `コスト: ${this.formatNumberBySetting(diceInfo.ascensionCost)}💰`;
                }
            }
        });
    }

    // 自動ダイスの進捗ゲージ・タイマー更新（public）
    updateAutoDiceProgress(diceIndex: number, panel: HTMLElement): void {
        const progressInfo = this.calculateAutoDiceProgress(diceIndex);
        
        // 進捗バーの更新
        const progressBar = panel.querySelector(`[data-dice-progress="${diceIndex}"]`) as HTMLElement;
        if (progressBar) {
            progressBar.style.width = `${(progressInfo.progress * 100).toFixed(1)}%`;
        }
        
        // タイマーの更新
        const timerElement = panel.querySelector(`[data-dice-timer="${diceIndex}"]`) as HTMLElement;
        if (timerElement) {
            timerElement.textContent = `${this.ticksToSeconds(progressInfo.timeLeft).toFixed(1)}s`;
        }
    }

    // プレステージボタンの更新
    updatePrestigeButton(): void {
        const prestigeInfo = this.systems.prestige.getPrestigeInfo();
        const button = this.elements.prestigeBtn;
        
        if (!button) return;
        
        if (prestigeInfo.canPrestige) {
            button.disabled = false;
            button.innerHTML = `転生する<br><small>${prestigeInfo.earned}PP獲得</small>`;
        } else {
            button.disabled = true;
            button.innerHTML = `転生する<br><small>レベルアップで解放</small>`;
        }
    }

    // 統計の更新
    updateStats(): void {
        const stats = this.gameState.stats;
        
        if (this.elements.statDiceRolls) {
            this.elements.statDiceRolls.textContent = this.formatNumberBySetting(stats.totalDiceRolls);
        }
        if (this.elements.statTotalMoves) {
            this.elements.statTotalMoves.textContent = this.formatNumberBySetting(stats.totalMoves);
        }
        if (this.elements.statTotalCredits) {
            this.elements.statTotalCredits.textContent = this.formatNumberBySetting(stats.totalCreditsEarned);
        }
        if (this.elements.statRebirths) {
            this.elements.statRebirths.textContent = stats.totalRebirths.toString();
        }
        if (this.elements.statTotalPrestige) {
            this.elements.statTotalPrestige.textContent = this.formatNumberBySetting(stats.totalPrestigePoints);
        }
        if (this.elements.statCurrentLevel) {
            this.elements.statCurrentLevel.textContent = this.gameState.level.toString();
        }
    }

    // プレステージアップグレードUIの更新
    updatePrestigeUpgrades(): void {
        // 使用可能プレステージポイントの表示
        if (this.elements.availablePrestigePoints) {
            this.elements.availablePrestigePoints.textContent = this.gameState.prestigePoints.available.toString();
        }
        
        // クレジット獲得倍率アップグレード
        const creditUpgradeInfo = this.systems.prestige.getPrestigeUpgradeInfo('creditMultiplier');
        const creditMultiplier = this.systems.prestige.getCreditMultiplier();
        
        if (this.elements.creditMultiplierCost) {
            this.elements.creditMultiplierCost.textContent = `${creditUpgradeInfo.cost}PP`;
        }
        if (this.elements.creditMultiplierLevel) {
            this.elements.creditMultiplierLevel.textContent = this.gameState.prestigeUpgrades.creditMultiplier.level.toString();
        }
        if (this.elements.creditMultiplierEffect) {
            this.elements.creditMultiplierEffect.textContent = `${creditMultiplier.toFixed(1)}倍`;
        }
        
        // ボタンの有効/無効状態
        if (this.elements.prestigeUpgradeCredit) {
            this.elements.prestigeUpgradeCredit.disabled = !creditUpgradeInfo.canAfford;
            this.elements.prestigeUpgradeCredit.className = creditUpgradeInfo.canAfford 
                ? 'btn btn-success btn-sm w-100' 
                : 'btn btn-outline-success btn-sm w-100';
        }
        
        // 自動ダイス速度向上アップグレード
        const speedUpgradeInfo = this.systems.prestige.getPrestigeUpgradeInfo('diceSpeedBoost');
        const speedMultiplier = this.systems.prestige.getDiceSpeedMultiplier();
        
        if (this.elements.diceSpeedCost) {
            this.elements.diceSpeedCost.textContent = `${speedUpgradeInfo.cost}PP`;
        }
        if (this.elements.diceSpeedLevel) {
            const maxLevel = speedUpgradeInfo.maxLevel || 40;
            this.elements.diceSpeedLevel.textContent = `${this.gameState.prestigeUpgrades.diceSpeedBoost.level}/${maxLevel}`;
        }
        if (this.elements.diceSpeedEffect) {
            this.elements.diceSpeedEffect.textContent = `${speedMultiplier.toFixed(1)}倍`;
        }
        
        // ボタンの有効/無効状態
        if (this.elements.prestigeUpgradeSpeed) {
            const isMaxLevel = speedUpgradeInfo.maxLevel && 
                this.gameState.prestigeUpgrades.diceSpeedBoost.level >= speedUpgradeInfo.maxLevel;
            
            this.elements.prestigeUpgradeSpeed.disabled = !speedUpgradeInfo.canAfford || !!isMaxLevel;
            this.elements.prestigeUpgradeSpeed.className = (speedUpgradeInfo.canAfford && !isMaxLevel)
                ? 'btn btn-primary btn-sm w-100' 
                : 'btn btn-outline-primary btn-sm w-100';
        }
    }

    // 統計モーダルの表示
    showStats(): void {
        // Bootstrap modalを使用
        const modal = document.getElementById('statsModal');
        if (modal) {
            // 設定UIを初期化
            this.initializeSettingsUI();
            
            // TypeScript用のBootstrap modal呼び出し
            const modalInstance = new (window as any).bootstrap.Modal(modal);
            modalInstance.show();
        }
    }

    // 設定変更のイベントリスナー
    setupSettingsEventListeners(): void {
        // 数値フォーマット変更
        const formatRadios = document.querySelectorAll('input[name="numberFormat"]');
        formatRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                if (target.checked) {
                    this.gameState.settings.numberFormat = target.value as any;
                    this.updateUI(); // 全UI更新で新しいフォーマットを反映
                    this.systems.storage?.saveGameState(); // 設定を保存
                }
            });
        });

        // 手動セーブボタン
        const manualSaveBtn = document.getElementById('manual-save');
        manualSaveBtn?.addEventListener('click', () => {
            if (this.systems.storage?.saveGameState()) {
                // セーブ成功のフィードバック
                const originalText = manualSaveBtn.textContent;
                manualSaveBtn.textContent = '✓ 保存完了';
                manualSaveBtn.classList.add('btn-success');
                manualSaveBtn.classList.remove('btn-outline-primary');
                
                setTimeout(() => {
                    manualSaveBtn.textContent = originalText;
                    manualSaveBtn.classList.remove('btn-success');
                    manualSaveBtn.classList.add('btn-outline-primary');
                }, 1500);
            }
        });
    }

    // 設定UIの初期化（モーダル表示時に呼ばれる）
    private initializeSettingsUI(): void {
        // 現在の設定に応じてラジオボタンを更新
        const currentFormat = this.gameState.settings.numberFormat;
        const formatRadio = document.getElementById(`format-${currentFormat}`) as HTMLInputElement;
        if (formatRadio) {
            formatRadio.checked = true;
        }
    }

    // デバッグ機能の設定
    setupDebugEventListeners(): void {
        if (!this.isDebugMode()) return;
        
        // デバッグパネルの表示/非表示
        this.elements.debugToggle?.addEventListener('click', () => {
            const content = this.elements.debugContent;
            if (content) {
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
            }
        });
        
        // ゲーム制御
        this.elements.debugPause?.addEventListener('click', () => {
            this.systems.gameLoop?.pause();
        });
        
        this.elements.debugResume?.addEventListener('click', () => {
            this.systems.gameLoop?.resume();
        });
        
        this.elements.debugStep?.addEventListener('click', () => {
            this.systems.gameLoop?.step();
        });
        
        // データ管理
        this.elements.debugShowData?.addEventListener('click', () => {
            const data = this.systems.storage?.debugShowStorageData();
            if (data) {
                console.log('ストレージデータ:', data);
                this.updateDebugLog('ストレージデータをコンソールに出力しました');
            }
        });
        
        this.elements.debugClearData?.addEventListener('click', () => {
            if (confirm('セーブデータを削除しますか？この操作は取り消せません。')) {
                const result = this.systems.storage?.clearSaveData(true);
                if (result) {
                    this.updateDebugLog('セーブデータを削除しました（バックアップ作成済み）');
                    setTimeout(() => location.reload(), 1000);
                }
            }
        });
        
        this.elements.debugEnableSave?.addEventListener('click', () => {
            const result = this.systems.storage?.enableAutoSave();
            if (result) {
                this.updateDebugLog('自動保存を再有効化しました');
            } else {
                this.updateDebugLog('自動保存の再有効化に失敗しました');
            }
        });
        
        // デバッグ情報の定期更新を開始
        this.startDebugInfoUpdates();
    }

    // 現在のTickを取得
    getCurrentTick(): number {
        if (!this.systems.gameLoop?.getDebugInfo) {
            return 0; // GameLoop未初期化時は0を返す
        }
        return this.systems.gameLoop.getDebugInfo().currentTick;
    }

    // 自動ダイスの進捗を計算
    calculateAutoDiceProgress(diceIndex: number): { progress: number; timeLeft: number; interval: number } {
        const currentTick = this.getCurrentTick();
        const autoDiceInfo = this.systems.dice.getAutoDiceInfo(diceIndex);
        
        if (!autoDiceInfo || !autoDiceInfo.unlocked) {
            return { progress: 0, timeLeft: 0, interval: 0 };
        }
        
        // GameLoop未初期化時は進捗0として扱う
        if (currentTick === 0) {
            return { 
                progress: 0, 
                timeLeft: autoDiceInfo.interval,
                interval: autoDiceInfo.interval
            };
        }
        
        const ticksSinceLastRoll = currentTick - autoDiceInfo.lastRoll;
        const progress = Math.min(ticksSinceLastRoll / autoDiceInfo.interval, 1);
        const timeLeft = Math.max(autoDiceInfo.interval - ticksSinceLastRoll, 0);
        
        return { 
            progress, 
            timeLeft,
            interval: autoDiceInfo.interval
        };
    }

    // Tick数を秒数に変換（60fps基準）
    ticksToSeconds(ticks: number): number {
        return ticks / 60;
    }

    // デバッグモードの判定
    isDebugMode(): boolean {
        const params = new URLSearchParams(window.location.search);
        return params.get('debug') === 'true' || window.location.hostname === 'localhost';
    }

    // 初期化
    initialize(): void {
        this.bindDOMElements();
        this.setupEventListeners();
        this.initializeDebugMode();
        this.generateGameBoard();
        this.updateUI();
    }

    // デバッグモードの初期化
    private initializeDebugMode(): void {
        if (this.isDebugMode()) {
            document.body.classList.add('debug-mode');
            console.log('デバッグモードが有効になりました');
        } else {
            document.body.classList.remove('debug-mode');
        }
    }

    // デバッグログの更新
    private updateDebugLog(message: string): void {
        if (!this.elements.debugLog) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}\n`;
        
        // 既存のログに追加
        this.elements.debugLog.textContent = logEntry + (this.elements.debugLog.textContent || '');
        
        // ログが長くなりすぎた場合は古いエントリを削除
        const lines = this.elements.debugLog.textContent.split('\n');
        if (lines.length > 20) {
            this.elements.debugLog.textContent = lines.slice(0, 20).join('\n');
        }
        
        // 最新のログが見えるようにスクロール
        this.elements.debugLog.scrollTop = 0;
    }

    // デバッグ情報の定期更新
    private startDebugInfoUpdates(): void {
        if (!this.isDebugMode()) return;
        
        const updateDebugInfo = () => {
            this.updateDebugStatus();
        };
        
        // 1秒ごとに更新
        setInterval(updateDebugInfo, 1000);
        
        // 初回実行
        updateDebugInfo();
    }

    // デバッグステータスの更新
    private updateDebugStatus(): void {
        if (!this.isDebugMode()) return;
        
        const debugInfo = this.systems.gameLoop?.getDebugInfo();
        const isPaused = this.systems.gameLoop?.isPaused() || false;
        const autoDiceCount = this.gameState.autoDice.filter(d => d.level > 0).length;
        
        // ゲーム状態
        if (this.elements.debugGameStatus) {
            this.elements.debugGameStatus.textContent = isPaused ? '一時停止中' : '実行中';
        }
        
        // FPS
        if (this.elements.debugFps && debugInfo) {
            this.elements.debugFps.textContent = Math.round(debugInfo.fps || 0).toString();
        }
        
        // 最終更新時刻
        if (this.elements.debugLastUpdate) {
            this.elements.debugLastUpdate.textContent = new Date().toLocaleTimeString();
        }
        
        // 自動ダイス情報
        if (this.elements.debugAutoDice) {
            this.elements.debugAutoDice.textContent = `${autoDiceCount}/7`;
        }
    }
}