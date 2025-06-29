// ゲーム状態の保存・読み込み管理

import { STORAGE_KEYS } from '../utils/constants.js';
import { createDefaultGameState, mergeGameState } from './game-state.js';

// ゲーム状態の保存
export function saveGameState(gameState) {
    try {
        localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(gameState));
        console.log('ゲーム状態を保存しました');
        return true;
    } catch (error) {
        console.error('ゲーム状態の保存に失敗しました:', error);
        return false;
    }
}

// ゲーム状態の読み込み
export function loadGameState() {
    try {
        const savedState = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
        if (savedState) {
            const parsed = JSON.parse(savedState);
            const defaultState = createDefaultGameState();
            
            // 既存の構造と新しい構造をマージ
            const mergedState = mergeGameState(defaultState, parsed);
            
            console.log('ゲーム状態を読み込みました');
            return mergedState;
        } else {
            console.log('保存されたゲーム状態が見つかりません。新しいゲームを開始します。');
            return createDefaultGameState();
        }
    } catch (error) {
        console.error('ゲーム状態の読み込みに失敗しました:', error);
        console.log('デフォルト状態で新しいゲームを開始します。');
        return createDefaultGameState();
    }
}

// 自動保存の設定
export function setupAutoSave(gameStateGetter, interval = 30000) {
    // 定期保存（30秒ごと）
    const autoSaveTimer = setInterval(() => {
        const currentState = gameStateGetter();
        saveGameState(currentState);
    }, interval);

    // ページ離脱時の保存
    const beforeUnloadHandler = () => {
        const currentState = gameStateGetter();
        saveGameState(currentState);
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);

    // クリーンアップ関数を返す
    return () => {
        clearInterval(autoSaveTimer);
        window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
}

// LocalStorageの容量チェック
export function checkStorageSpace() {
    try {
        const testKey = 'storage-test';
        const testData = 'x'.repeat(1024); // 1KB のテストデータ
        localStorage.setItem(testKey, testData);
        localStorage.removeItem(testKey);
        return true;
    } catch (error) {
        console.warn('LocalStorageの容量が不足している可能性があります:', error);
        return false;
    }
}

// 保存データのバックアップ作成
export function createBackup() {
    try {
        const gameState = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
        if (gameState) {
            const backup = {
                timestamp: Date.now(),
                data: gameState
            };
            return JSON.stringify(backup);
        }
        return null;
    } catch (error) {
        console.error('バックアップの作成に失敗しました:', error);
        return null;
    }
}

// バックアップからの復元
export function restoreFromBackup(backupData) {
    try {
        const backup = JSON.parse(backupData);
        localStorage.setItem(STORAGE_KEYS.GAME_STATE, backup.data);
        console.log('バックアップから復元しました');
        return true;
    } catch (error) {
        console.error('バックアップからの復元に失敗しました:', error);
        return false;
    }
}