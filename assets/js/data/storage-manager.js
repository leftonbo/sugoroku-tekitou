// ゲーム状態の保存・読み込み管理

import { STORAGE_KEYS } from '../utils/constants.js';
import { createDefaultGameState, mergeGameState } from './game-state.js';

// ゲーム状態の保存
export function saveGameState(gameState) {
    try {
        // データ削除フラグをチェック
        if (sessionStorage.getItem('game-data-cleared') === 'true') {
            console.log('データ削除後のため保存をスキップしました');
            return false;
        }
        
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
        // 削除フラグをチェック
        const wasCleared = sessionStorage.getItem('game-data-cleared') === 'true';
        if (wasCleared) {
            // 削除フラグをクリア
            sessionStorage.removeItem('game-data-cleared');
            console.log('データ削除後の初回読み込み。初期状態から開始します。');
            return createDefaultGameState();
        }
        
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

// デバッグ: コンソールからのバックアップ復元用ヘルパー
export function debugRestoreFromConsole() {
    console.log('使用方法:');
    console.log('1. 削除時にコンソールに出力されたバックアップデータをコピー');
    console.log('2. debugRestoreBackup("バックアップデータ") を実行');
    console.log('3. ページをリロード');
}

// デバッグ: バックアップデータからの復元（コンソール用）
window.debugRestoreBackup = function(backupData) {
    try {
        const result = restoreFromBackup(backupData);
        if (result) {
            // 削除フラグもクリア
            sessionStorage.removeItem('game-data-cleared');
            console.log('復元完了！ページをリロードしてください。');
            return true;
        } else {
            console.log('復元に失敗しました。');
            return false;
        }
    } catch (error) {
        console.error('復元エラー:', error);
        return false;
    }
};

// デバッグ: 保存機能の再有効化
export function enableAutoSave() {
    sessionStorage.removeItem('game-data-cleared');
    console.log('自動保存機能を再有効化しました');
    return true;
}

// デバッグ: セーブデータの削除
export function clearSaveData(shouldCreateBackup = true) {
    try {
        let backupData = null;
        
        // バックアップを作成（削除前に実行）
        if (shouldCreateBackup) {
            backupData = createBackup();
            if (backupData) {
                console.log('削除前のバックアップを作成しました');
                // バックアップをコンソールに出力（手動復元用）
                console.log('バックアップデータ（手動復元用）:', backupData);
            }
        }
        
        // セーブデータを削除
        localStorage.removeItem(STORAGE_KEYS.GAME_STATE);
        
        // 削除フラグを設定（ページ離脱時の自動保存を防ぐ）
        sessionStorage.setItem('game-data-cleared', 'true');
        console.log('セーブデータを削除しました - 次回読み込み時は初期状態から開始されます');
        
        return {
            success: true,
            backup: backupData,
            message: '削除完了。リロード後は初期状態から開始されます。'
        };
    } catch (error) {
        console.error('セーブデータの削除に失敗しました:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// デバッグ: LocalStorage内のすべてのゲーム関連データを表示
export function debugShowStorageData() {
    try {
        const gameData = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
        
        if (gameData) {
            const parsed = JSON.parse(gameData);
            console.log('現在のセーブデータ:', parsed);
            
            // データサイズの計算
            const dataSize = new Blob([gameData]).size;
            console.log(`データサイズ: ${dataSize} bytes (${(dataSize / 1024).toFixed(2)} KB)`);
            
            return {
                exists: true,
                data: parsed,
                size: dataSize,
                lastModified: new Date(parsed.timestamp || 0).toLocaleString()
            };
        } else {
            console.log('セーブデータが存在しません');
            return {
                exists: false
            };
        }
    } catch (error) {
        console.error('セーブデータの取得に失敗しました:', error);
        return {
            exists: false,
            error: error.message
        };
    }
}