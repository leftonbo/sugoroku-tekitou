// アニメーション効果管理

import { UI_CONFIG } from '../utils/constants.js';

// アニメーション関連の型定義
type EffectType = 'credit-gain' | 'credit-bonus' | 'forward' | 'backward';

export class AnimationManager {
    private activeAnimations: Map<HTMLElement, number>;

    constructor() {
        this.activeAnimations = new Map();
    }

    // 手動ダイス表示のアニメーション（強化版）
    animateManualDiceResult(
        element: HTMLElement | null,
        diceCount: number = 1, 
        results: number[] = [], 
        total: number = 0
    ): void {
        if (!element) return;
        
        // 結果表示の構築（ダイスアイコンと数値を分離）
        let displayContent = '';
        
        // ダイスアイコン（回転するダイスアイコン）
        displayContent += `<div class="dice-icon">🎲</div>`;
        
        // 結果表示部分（回転しない）
        if (diceCount === 1) {
            displayContent += `<div class="text-muted fs-4 mt-2">${total}</div>`;
        } else {
            displayContent += `<div class="small text-muted mt-2">${results.join(' + ')}</div>`;
            displayContent += `<div class="text-primary fs-4">${total}</div>`;
        }
        
        element.innerHTML = displayContent;
        
        // ダイスアイコンのアニメーション制御
        const diceIcon = element.querySelector('.dice-icon') as HTMLElement;
        if (diceIcon) {
            // 回転アニメーションを適用
            diceIcon.classList.add('spinning');
            
            // アニメーション終了後にspinningクラスを削除
            setTimeout(() => {
                diceIcon.classList.remove('spinning');
            }, UI_CONFIG.DICE_ANIMATION_DURATION);
        }
    }

    // マス目効果のアニメーション
    animateCellEffect(cellElement: HTMLElement | null, effectType: EffectType): void {
        if (!cellElement) return;
        
        const animationClass = `${effectType}-effect`;
        
        cellElement.classList.add(animationClass);
        
        setTimeout(() => {
            cellElement.classList.remove(animationClass);
        }, UI_CONFIG.ANIMATION_DURATION);
    }

    // クレジット獲得アニメーション
    animateCreditGain(cellElement: HTMLElement | null): void {
        this.animateCellEffect(cellElement, 'credit-gain');
    }

    // クレジットボーナス獲得アニメーション（特別版）
    animateCreditBonusGain(cellElement: HTMLElement | null): void {
        if (!cellElement) return;
        
        // 基本のボーナスマス用アニメーション
        this.animateCellEffect(cellElement, 'credit-bonus');
        
        // 追加の光るエフェクト（ゴールド色）
        this.addGlowEffect(cellElement, '#FFD700', 1500);
        
        // パルスエフェクトの一時的な適用
        const stopPulse = this.addPulseEffect(cellElement);
        if (stopPulse) {
            setTimeout(() => {
                stopPulse();
            }, 2000);
        }
        
        // 星のパーティクルエフェクト（疑似的）
        this.addStarburstEffect(cellElement);
    }

    // 進むマスのアニメーション
    animateForwardEffect(cellElement: HTMLElement | null): void {
        this.animateCellEffect(cellElement, 'forward');
    }

    // 戻るマスのアニメーション
    animateBackwardEffect(cellElement: HTMLElement | null): void {
        this.animateCellEffect(cellElement, 'backward');
    }

    // プレイヤー位置移動のアニメーション
    animatePlayerMove(_fromPosition: number, toPosition: number, gameBoard: HTMLElement): void {
        // 既存のプレイヤー位置をクリア
        const oldPlayerCells = gameBoard.querySelectorAll('.player-position');
        oldPlayerCells.forEach(cell => {
            cell.classList.remove('player-position');
            const icon = cell.querySelector('.player-icon');
            if (icon) icon.remove();
        });
        
        // 新しい位置にプレイヤーアイコンを配置
        const newCell = gameBoard.querySelector(`[data-position="${toPosition}"]`) as HTMLElement;
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
    startAnimation(
        element: HTMLElement, 
        animationName: string, 
        duration: number = UI_CONFIG.ANIMATION_DURATION
    ): void {
        if (!element) return;
        
        // 既存のアニメーションを停止
        this.stopAnimation(element);
        
        element.style.animation = `${animationName} ${duration}ms ease-in-out`;
        
        // アニメーション終了後のクリーンアップ
        const timeoutId = window.setTimeout(() => {
            element.style.animation = '';
            this.activeAnimations.delete(element);
        }, duration);
        
        this.activeAnimations.set(element, timeoutId);
    }

    // アニメーション停止
    stopAnimation(element: HTMLElement): void {
        if (!element) return;
        
        const timeoutId = this.activeAnimations.get(element);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.activeAnimations.delete(element);
        }
        
        element.style.animation = '';
    }

    // 光るエフェクト
    addGlowEffect(
        element: HTMLElement | null, 
        color: string = 'gold', 
        duration: number = UI_CONFIG.GLOW_EFFECT_DURATION
    ): void {
        if (!element) return;
        
        element.style.textShadow = `0 0 20px ${color}`;
        element.style.transition = `text-shadow ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.textShadow = '';
            element.style.transition = '';
        }, duration);
    }

    // パルスエフェクト（購入可能ボタンなど）
    addPulseEffect(element: HTMLElement | null): (() => void) | null {
        if (!element) return null;
        
        element.style.animation = 'pulse 2s infinite';
        return () => {
            element.style.animation = '';
        };
    }

    // ボタンの有効性に応じた視覚効果
    updateButtonAffordability(
        button: HTMLElement | null, 
        canAfford: boolean, 
        cost: number, 
        currentCredits: number
    ): void {
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
    updateCooldownProgress(progressBar: HTMLElement | null, progress: number): void {
        if (!progressBar) return;
        
        progressBar.style.width = `${Math.min(100, progress)}%`;
        
        // 満タンになったら色を変更
        if (progress >= 100) {
            progressBar.className = 'progress-bar bg-success';
        } else {
            progressBar.className = 'progress-bar bg-info';
        }
    }

    // 星のパーティクルエフェクト（ボーナスマス用）
    addStarburstEffect(element: HTMLElement | null): void {
        if (!element) return;
        
        const particles = ['✨', '🌟', '💫', '⭐'];
        const particleCount = 6;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.textContent = particles[Math.floor(Math.random() * particles.length)] || '✨';
            particle.className = 'bonus-particle';
            
            // 位置とアニメーションの設定
            const angle = (360 / particleCount) * i;
            const distance = 40;
            const x = Math.cos((angle * Math.PI) / 180) * distance;
            const y = Math.sin((angle * Math.PI) / 180) * distance;
            
            particle.style.cssText = `
                position: absolute;
                font-size: 16px;
                pointer-events: none;
                z-index: 1000;
                transform: translate(-50%, -50%);
                animation: starburst-${i} 1.5s ease-out forwards;
            `;
            
            // カスタムアニメーションをインラインで定義
            const style = document.createElement('style');
            style.textContent = `
                @keyframes starburst-${i} {
                    0% {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(0.5);
                    }
                    50% {
                        opacity: 1;
                        transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1.2);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(calc(-50% + ${x * 1.5}px), calc(-50% + ${y * 1.5}px)) scale(0.3);
                    }
                }
            `;
            
            document.head.appendChild(style);
            element.appendChild(particle);
            
            // パーティクルとスタイルのクリーンアップ
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style);
                }
            }, 1500);
        }
    }

    // 全アニメーションのクリーンアップ
    cleanupAllAnimations(): void {
        this.activeAnimations.forEach((timeoutId, element) => {
            clearTimeout(timeoutId);
            if (element) {
                element.style.animation = '';
                element.style.textShadow = '';
                element.style.transition = '';
            }
        });
        this.activeAnimations.clear();
        
        // ボーナスパーティクルもクリーンアップ
        const particles = document.querySelectorAll('.bonus-particle');
        particles.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
    }
}