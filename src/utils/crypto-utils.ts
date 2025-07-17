// セーブデータの暗号化・復号化ユーティリティ

import type { GameState } from '../types/game-state.js';

// セーブデータフォーマットの識別子
export const SAVE_FORMAT_PREFIX = 'SGKT_v1_';
export const SAVE_FORMAT_VERSION = '1.0.0';

// エクスポートデータの型定義
export interface ExportData {
    format: string;
    version: string;
    timestamp: number;
    gameData: string; // 暗号化済みGameState
    checksum: string; // 整合性チェック用
    keyData: {
        level: number;
        rebirthCount: number;
        boardRandomSeed: number;
    }; // キー生成用データ
}

// インポート結果の型定義
export interface ImportResult {
    success: boolean;
    message: string;
    error?: string;
    gameState?: GameState;
}

// バリデーション結果の型定義
export interface ValidationResult {
    isValid: boolean;
    error?: string;
    format?: string;
    version?: string;
}

// ゲーム固有のキーを生成
export function generateSaveKey(gameState: GameState): string;
export function generateSaveKey(keyData: { level: number; rebirthCount: number; boardRandomSeed: number }): string;
export function generateSaveKey(input: GameState | { level: number; rebirthCount: number; boardRandomSeed: number }): string {
    // GameStateまたはkeyDataからキー生成用の値を取得
    const level = input.level;
    const rebirthCount = input.rebirthCount;
    const boardRandomSeed = input.boardRandomSeed;
    
    // ゲーム固有の値を組み合わせてキーを生成
    const keyBase = `${level}_${rebirthCount}_${boardRandomSeed}`;
    
    // 簡易ハッシュ関数でキーを生成
    let hash = 0;
    for (let i = 0; i < keyBase.length; i++) {
        const char = keyBase.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32bit整数に変換
    }
    
    // 固定長の文字列に変換（16進数）
    const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
    
    // ゲーム名接頭辞を追加してキーの強化
    return `SUGOROKU_${hexHash}`;
}

// XOR暗号化
function xorEncrypt(data: string, key: string): string {
    let encrypted = '';
    
    for (let i = 0; i < data.length; i++) {
        const dataChar = data.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        const encryptedChar = dataChar ^ keyChar;
        encrypted += String.fromCharCode(encryptedChar);
    }
    
    return encrypted;
}

// XOR復号化（暗号化と同じ処理）
function xorDecrypt(encryptedData: string, key: string): string {
    return xorEncrypt(encryptedData, key); // XORは対称暗号
}

// チェックサムの生成（簡易）
function generateChecksum(data: string): string {
    let checksum = 0;
    for (let i = 0; i < data.length; i++) {
        checksum = ((checksum << 5) - checksum + data.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(checksum).toString(16);
}

// チェックサムの検証
function validateChecksum(data: string, expectedChecksum: string): boolean {
    const actualChecksum = generateChecksum(data);
    return actualChecksum === expectedChecksum;
}

// ゲームデータの暗号化（GameState → 暗号化文字列）
export function encryptSaveData(gameState: GameState): string {
    try {
        // 1. GameStateをJSON文字列化
        const jsonData = JSON.stringify(gameState);
        
        // 2. ゲーム固有キーを生成
        const key = generateSaveKey(gameState);
        
        // 3. XOR暗号化
        const encryptedData = xorEncrypt(jsonData, key);
        
        // 4. エクスポートデータ構造を作成
        const exportData: ExportData = {
            format: 'SGKT_v1',
            version: SAVE_FORMAT_VERSION,
            timestamp: Date.now(),
            gameData: encryptedData,
            checksum: generateChecksum(encryptedData),
            keyData: {
                level: gameState.level,
                rebirthCount: gameState.rebirthCount,
                boardRandomSeed: gameState.boardRandomSeed
            }
        };
        
        // 5. エクスポートデータをJSON化
        const exportJson = JSON.stringify(exportData);
        
        // 6. BASE64エンコード
        const base64Data = btoa(unescape(encodeURIComponent(exportJson)));
        
        // 7. プレフィックス付きの最終文字列を生成
        return SAVE_FORMAT_PREFIX + base64Data;
        
    } catch (error) {
        console.error('セーブデータの暗号化に失敗しました:', error);
        throw new Error('セーブデータの暗号化に失敗しました');
    }
}

// ゲームデータの復号化（暗号化文字列 → GameState）
export function decryptSaveData(encryptedString: string): ImportResult {
    try {
        // 1. プレフィックスの確認
        if (!encryptedString.startsWith(SAVE_FORMAT_PREFIX)) {
            return {
                success: false,
                error: '不正なセーブデータフォーマットです',
                message: 'セーブデータの形式が正しくありません'
            };
        }
        
        // 2. プレフィックスを除去してBASE64データを取得
        const base64Data = encryptedString.substring(SAVE_FORMAT_PREFIX.length);
        
        // 3. BASE64デコード
        const exportJson = decodeURIComponent(escape(atob(base64Data)));
        
        // 4. エクスポートデータをパース
        const exportData: ExportData = JSON.parse(exportJson);
        
        // 5. フォーマット・バージョンの検証
        if (exportData.format !== 'SGKT_v1') {
            return {
                success: false,
                error: 'サポートされていないセーブデータフォーマットです',
                message: `フォーマット: ${exportData.format}はサポートされていません`
            };
        }
        
        // 6. チェックサムの検証
        if (!validateChecksum(exportData.gameData, exportData.checksum)) {
            return {
                success: false,
                error: 'セーブデータが破損している可能性があります',
                message: 'チェックサム検証に失敗しました'
            };
        }
        
        // 7. 復号化キーを生成（エクスポート時のkeyDataから）
        const key = generateSaveKey(exportData.keyData);
        
        // 8. XOR復号化
        const decryptedJson = xorDecrypt(exportData.gameData, key);
        
        // 9. GameStateにパース
        const gameState: GameState = JSON.parse(decryptedJson);
        
        return {
            success: true,
            message: 'セーブデータのインポートに成功しました',
            gameState: gameState
        };
        
    } catch (error) {
        console.error('セーブデータの復号化に失敗しました:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '不明なエラー',
            message: 'セーブデータの復号化に失敗しました'
        };
    }
}

// セーブデータの形式検証
export function validateImportData(data: string): ValidationResult {
    try {
        // プレフィックスの確認
        if (!data.startsWith(SAVE_FORMAT_PREFIX)) {
            return {
                isValid: false,
                error: '不正なセーブデータフォーマットです'
            };
        }
        
        // BASE64データの取得とデコード
        const base64Data = data.substring(SAVE_FORMAT_PREFIX.length);
        const exportJson = decodeURIComponent(escape(atob(base64Data)));
        
        // エクスポートデータのパース
        const exportData: ExportData = JSON.parse(exportJson);
        
        // 必要なフィールドの存在確認
        if (!exportData.format || !exportData.version || !exportData.gameData || !exportData.checksum || !exportData.keyData) {
            return {
                isValid: false,
                error: 'セーブデータの構造が不正です'
            };
        }
        
        return {
            isValid: true,
            format: exportData.format,
            version: exportData.version
        };
        
    } catch (error) {
        return {
            isValid: false,
            error: 'セーブデータの解析に失敗しました'
        };
    }
}

// セーブファイル名の生成
export function generateSaveFileName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `sugoroku-save-${year}-${month}-${day}-${hours}${minutes}${seconds}.txt`;
}

// ファイルダウンロード用のBlobを作成
export function createSaveBlob(saveData: string): Blob {
    return new Blob([saveData], { type: 'text/plain;charset=utf-8' });
}