// アニメーション効果管理

import { UI_CONFIG } from '../utils/constants.js';

export class AnimationManager {
    constructor() {
        this.activeAnimations = new Map();
    }

    // 手動ダイス表示のアニメーション（強化版）
    animateManualDiceResult(element, rollQuality = 0.5, diceCount = 1, results = [], total = 0) {
        if (!element) return;
        
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
            displayContent = `<div class="${resultClass} fs-4">${total}</div>`;
        } else {
            displayContent = `<div class="small text-muted">${results.join(' + ')}</div>`;
            displayContent += `<div class="${resultClass} fs-4">${total}</div>`;
        }
        
        if (resultText) {
            displayContent += `<div class="small text-muted fw-normal" style="font-size: 0.7rem;">${resultText}</div>`;
        }
        
        element.innerHTML = displayContent;
        
        // 品質に応じたアニメーション効果
        this.stopAnimation(element);
        
        setTimeout(() => {
            const animationType = rollQuality >= 0.8 ? 'diceRolling' : 'diceRoll';
            this.startAnimation(element, animationType, UI_CONFIG.DICE_ANIMATION_DURATION);
            
            // 特別演出（優秀な結果の場合）
            if (rollQuality >= 0.9) {
                this.addGlowEffect(element, 'gold', UI_CONFIG.GLOW_EFFECT_DURATION);
            }
        }, 10);
    }

    // マス目効果のアニメーション
    animateCellEffect(cellElement, effectType) {
        if (!cellElement) return;
        
        const animationClass = `${effectType}-effect`;
        
        cellElement.classList.add(animationClass);
        
        setTimeout(() => {
            cellElement.classList.remove(animationClass);
        }, UI_CONFIG.ANIMATION_DURATION);
    }

    // クレジット獲得アニメーション
    animateCreditGain(cellElement) {
        this.animateCellEffect(cellElement, 'credit-gain');
    }

    // 進むマスのアニメーション
    animateForwardEffect(cellElement) {
        this.animateCellEffect(cellElement, 'forward');
    }

    // 戻るマスのアニメーション
    animateBackwardEffect(cellElement) {
        this.animateCellEffect(cellElement, 'backward');
    }

    // プレイヤー位置移動のアニメーション
    animatePlayerMove(fromPosition, toPosition, gameBoard) {
        // 既存のプレイヤー位置をクリア
        const oldPlayerCells = gameBoard.querySelectorAll('.player-position');
        oldPlayerCells.forEach(cell => {
            cell.classList.remove('player-position');
            const icon = cell.querySelector('.player-icon');
            if (icon) icon.remove();
        });
        
        // 新しい位置にプレイヤーアイコンを配置
        const newCell = gameBoard.querySelector(`[data-position="${toPosition}"]`);
        if (newCell) {
            newCell.classList.add('player-position');
            
            const playerIcon = document.createElement('div');
            playerIcon.className = 'player-icon';
            playerIcon.textContent = '🚀';
            
            // 移動アニメーション
            playerIcon.style.animation = 'playerMove 0.5s ease-in-out';
            
            newCell.appendChild(playerIcon);
        }
    }

    // 汎用アニメーション開始
    startAnimation(element, animationName, duration = UI_CONFIG.ANIMATION_DURATION) {
        if (!element) return;
        
        // 既存のアニメーションを停止
        this.stopAnimation(element);
        
        element.style.animation = `${animationName} ${duration}ms ease-in-out`;
        
        // アニメーション終了後のクリーンアップ
        const timeoutId = setTimeout(() => {
            element.style.animation = '';
            this.activeAnimations.delete(element);
        }, duration);
        
        this.activeAnimations.set(element, timeoutId);
    }

    // アニメーション停止
    stopAnimation(element) {
        if (!element) return;
        
        const timeoutId = this.activeAnimations.get(element);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.activeAnimations.delete(element);
        }
        
        element.style.animation = '';
    }

    // 光るエフェクト
    addGlowEffect(element, color = 'gold', duration = UI_CONFIG.GLOW_EFFECT_DURATION) {
        if (!element) return;
        
        element.style.textShadow = `0 0 20px ${color}`;
        element.style.transition = `text-shadow ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.textShadow = '';
            element.style.transition = '';
        }, duration);
    }

    // パルスエフェクト（購入可能ボタンなど）
    addPulseEffect(element) {
        if (!element) return;
        
        element.style.animation = 'pulse 2s infinite';
        return () => {
            element.style.animation = '';
        };
    }

    // ボタンの有効性に応じた視覚効果
    updateButtonAffordability(button, canAfford, cost, currentCredits) {
        if (!button) return;
        
        if (canAfford) {
            button.classList.add('btn-ripple');
            button.title = 'アップグレード可能！';
            // ボーダーカラーを強調
            if (button.classList.contains('btn-outline-primary')) {
                button.style.borderColor = '#0056b3';
            } else if (button.classList.contains('btn-outline-warning')) {
                button.style.borderColor = '#e0a800';
            } else if (button.classList.contains('btn-outline-success')) {
                button.style.borderColor = '#157347';
            }
        } else {
            button.classList.remove('btn-ripple');
            button.style.borderColor = '';
            const shortage = cost - currentCredits;
            button.title = `アップグレードには ${shortage} 💰 不足`;
        }
    }

    // クールダウンゲージのアニメーション
    updateCooldownProgress(progressBar, progress) {
        if (!progressBar) return;
        
        progressBar.style.width = `${Math.min(100, progress)}%`;
        
        // 満タンになったら色を変更
        if (progress >= 100) {
            progressBar.className = 'progress-bar bg-success';
        } else {
            progressBar.className = 'progress-bar bg-info';
        }
    }

    // 全アニメーションのクリーンアップ
    cleanupAllAnimations() {
        this.activeAnimations.forEach((timeoutId, element) => {
            clearTimeout(timeoutId);
            if (element) {
                element.style.animation = '';
                element.style.textShadow = '';
                element.style.transition = '';
            }
        });
        this.activeAnimations.clear();
    }
}