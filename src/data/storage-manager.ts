/**
 * ゲーム状態の保存・読み込み管理
 *
 * このシステムは以下の機能を提供します：
 * - セーブデータ管理：ローカルストレージへの保存・読み込み
 * - インポート・エクスポート：データの入出力機能
 * - バックアップ管理：データのバックアップと復元
 * - データ暗号化：セキュリティ強化
 * - 自動保存：定期的な自動バックアップ
 */

import { createDefaultGameState, mergeGameState } from './game-state.js';
import type { GameState } from '../types/game-state.js';
import { STORAGE_KEYS } from '../utils/constants.js';
import {
  encryptSaveData,
  decryptSaveData,
  validateImportData,
  generateSaveFileName,
  createSaveBlob,
  type ImportResult,
  type ValidationResult,
} from '../utils/crypto-utils.js';

/**
 * バックアップデータの型定義
 * バックアップデータの構造を定義します。
 */
interface BackupData {
  timestamp: number;
  data: string;
}

/**
 * 削除結果の型定義
 * データ削除操作の結果を表します。
 */
interface ClearResult {
  success: boolean;
  backup?: string | null;
  message?: string;
  error?: string;
}

/**
 * ストレージデータ情報の型定義
 * ストレージ内のデータ情報を提供します。
 */
interface StorageInfo {
  exists: boolean;
  data?: GameState;
  size?: number;
  lastModified?: string;
  error?: string;
}

/**
 * ゲーム状態の保存
 * ゲーム状態をローカルストレージに保存します。
 *
 * @param gameState 保存するゲーム状態
 * @returns 保存成功時はtrue、失敗時はfalse
 */
export function saveGameState(gameState: GameState): boolean {
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
export function loadGameState(): GameState {
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
      const parsed = JSON.parse(savedState) as Partial<GameState>;
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
export function setupAutoSave(
  gameStateGetter: () => GameState,
  interval: number = 30000
): () => void {
  // 定期保存（30秒ごと）
  const autoSaveTimer = setInterval(() => {
    const currentState = gameStateGetter();
    saveGameState(currentState);
  }, interval);

  // ページ離脱時の保存
  const beforeUnloadHandler = (): void => {
    const currentState = gameStateGetter();
    saveGameState(currentState);
  };

  window.addEventListener('beforeunload', beforeUnloadHandler);

  // クリーンアップ関数を返す
  return (): void => {
    clearInterval(autoSaveTimer);
    window.removeEventListener('beforeunload', beforeUnloadHandler);
  };
}

// LocalStorageの容量チェック
export function checkStorageSpace(): boolean {
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
export function createBackup(): string | null {
  try {
    const gameState = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
    if (gameState) {
      const backup: BackupData = {
        timestamp: Date.now(),
        data: gameState,
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
export function restoreFromBackup(backupData: string): boolean {
  try {
    const backup = JSON.parse(backupData) as BackupData;
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, backup.data);
    console.log('バックアップから復元しました');
    return true;
  } catch (error) {
    console.error('バックアップからの復元に失敗しました:', error);
    return false;
  }
}

// デバッグ: コンソールからのバックアップ復元用ヘルパー
export function debugRestoreFromConsole(): void {
  console.log('使用方法:');
  console.log('1. 削除時にコンソールに出力されたバックアップデータをコピー');
  console.log('2. debugRestoreBackup("バックアップデータ") を実行');
  console.log('3. ページをリロード');
}

// デバッグ: バックアップデータからの復元（コンソール用）
declare global {
  interface Window {
    debugRestoreBackup: (backupData: string) => boolean;
  }
}

window.debugRestoreBackup = function (backupData: string): boolean {
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
export function enableAutoSave(): boolean {
  sessionStorage.removeItem('game-data-cleared');
  console.log('自動保存機能を再有効化しました');
  return true;
}

// デバッグ: セーブデータの削除
export function clearSaveData(shouldCreateBackup: boolean = true): ClearResult {
  try {
    let backupData: string | null = null;

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
      message: '削除完了。リロード後は初期状態から開始されます。',
    };
  } catch (error) {
    console.error('セーブデータの削除に失敗しました:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// デバッグ: LocalStorage内のすべてのゲーム関連データを表示
export function debugShowStorageData(): StorageInfo {
  try {
    const gameData = localStorage.getItem(STORAGE_KEYS.GAME_STATE);

    if (gameData) {
      const parsed = JSON.parse(gameData) as GameState;
      console.log('現在のセーブデータ:', parsed);

      // データサイズの計算
      const dataSize = new Blob([gameData]).size;
      console.log(`データサイズ: ${dataSize} bytes (${(dataSize / 1024).toFixed(2)} KB)`);

      return {
        exists: true,
        data: parsed,
        size: dataSize,
        lastModified: new Date((parsed as any).timestamp || 0).toLocaleString(),
      };
    } else {
      console.log('セーブデータが存在しません');
      return {
        exists: false,
      };
    }
  } catch (error) {
    console.error('セーブデータの取得に失敗しました:', error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ゲームデータのエクスポート（暗号化済み）
export function exportGameData(gameState: GameState): string | null {
  try {
    const encryptedData = encryptSaveData(gameState);
    console.log('ゲームデータのエクスポートに成功しました');
    return encryptedData;
  } catch (error) {
    console.error('ゲームデータのエクスポートに失敗しました:', error);
    return null;
  }
}

// ゲームデータのインポート（復号化）
export function importGameData(encryptedData: string): ImportResult {
  try {
    // まずバリデーションを実行
    const validation = validateImportData(encryptedData);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error || '不明なエラー',
        message: 'インポートデータの検証に失敗しました',
      };
    }

    // 復号化を実行
    const result = decryptSaveData(encryptedData);
    if (result.success && result.gameState) {
      console.log('ゲームデータのインポートに成功しました');
      return result;
    } else {
      return {
        success: false,
        error: result.error || '復号化に失敗',
        message: result.message || 'インポートに失敗しました',
      };
    }
  } catch (error) {
    console.error('ゲームデータのインポートに失敗しました:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー',
      message: 'インポート処理中にエラーが発生しました',
    };
  }
}

// インポートデータのバリデーション
export function validateGameDataImport(data: string): ValidationResult {
  return validateImportData(data);
}

// エクスポート用ファイル名の生成
export function getExportFileName(): string {
  return generateSaveFileName();
}

// エクスポートデータからBlobを作成
export function createExportBlob(encryptedData: string): Blob {
  return createSaveBlob(encryptedData);
}

// インポート前のバックアップ作成
export function createBackupBeforeImport(gameState: GameState): string | null {
  try {
    const backup = {
      timestamp: Date.now(),
      data: JSON.stringify(gameState),
    };
    const backupString = JSON.stringify(backup);
    console.log('インポート前のバックアップを作成しました');
    return backupString;
  } catch (error) {
    console.error('インポート前のバックアップ作成に失敗しました:', error);
    return null;
  }
}
