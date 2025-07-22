/**
 * crypto-utils.ts のテストファイル
 * セーブデータ暗号化・復号化、バリデーション、ユーティリティ関数のテストを行います。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { GameState } from '@/types/game-state';
import {
  SAVE_FORMAT_PREFIX,
  SAVE_FORMAT_VERSION,
  generateSaveKey,
  encryptSaveData,
  decryptSaveData,
  validateImportData,
  generateSaveFileName,
  createSaveBlob,
  type ExportData,
  type ImportResult,
  type ValidationResult,
} from '@/utils/crypto-utils';

// テスト用のモックGameState
const createMockGameState = (): GameState => ({
  credits: 1000,
  position: 25,
  level: 5,
  rebirthCount: 2,
  boardRandomSeed: 12345,
  manualDice: {
    count: 3,
    faces: 6,
    level: 10,
    totalLevelCost: 500,
  },
  autoDice: [
    {
      faces: 4,
      level: 5,
      isUnlocked: true,
      ascensionLevel: 1,
      totalLevelCost: 200,
      totalAscensionCost: 100,
    },
  ],
  prestigePoints: {
    available: 10,
    earned: 15,
    total: 25,
  },
  prestigeUpgrades: {
    creditMultiplier: 2,
    speedBoost: 1,
    bonusChance: 0,
    bonusMultiplier: 1,
  },
  stats: {
    totalCreditsEarned: 50000,
    totalDiceRolled: 1000,
    totalCellsMoved: 2500,
    gameStartTime: Date.now() - 3600000,
    currentSessionTime: 3600,
    totalPlayTime: 7200,
    maxLevel: 5,
    maxCredits: 10000,
    maxPosition: 80,
  },
  boardStates: {},
  lastSaved: Date.now(),
  debug: {
    enabled: false,
    ticksSinceLastSave: 0,
    totalTicks: 10000,
    averageTickTime: 16.67,
  },
});

describe('定数', () => {
  it('SAVE_FORMAT_PREFIXが正しく定義されている', () => {
    expect(SAVE_FORMAT_PREFIX).toBe('SGKT_v1_');
    expect(typeof SAVE_FORMAT_PREFIX).toBe('string');
  });

  it('SAVE_FORMAT_VERSIONが正しく定義されている', () => {
    expect(SAVE_FORMAT_VERSION).toBe('1.0.0');
    expect(typeof SAVE_FORMAT_VERSION).toBe('string');
  });
});

describe('generateSaveKey', () => {
  it('GameStateから一貫したキーを生成する', () => {
    const gameState = createMockGameState();
    const key1 = generateSaveKey(gameState);
    const key2 = generateSaveKey(gameState);

    expect(key1).toBe(key2);
    expect(typeof key1).toBe('string');
    expect(key1).toMatch(/^SUGOROKU_[0-9a-f]{8}$/);
  });

  it('keyDataオブジェクトから一貫したキーを生成する', () => {
    const keyData = {
      level: 5,
      rebirthCount: 2,
      boardRandomSeed: 12345,
    };

    const key1 = generateSaveKey(keyData);
    const key2 = generateSaveKey(keyData);

    expect(key1).toBe(key2);
    expect(key1).toMatch(/^SUGOROKU_[0-9a-f]{8}$/);
  });

  it('異なるデータから異なるキーを生成する', () => {
    const gameState1 = createMockGameState();
    const gameState2 = { ...gameState1, level: 10 };

    const key1 = generateSaveKey(gameState1);
    const key2 = generateSaveKey(gameState2);

    expect(key1).not.toBe(key2);
  });

  it('同じデータからは常に同じキーを生成する', () => {
    const keyData = {
      level: 100,
      rebirthCount: 5,
      boardRandomSeed: 54321,
    };

    const keys = Array.from({ length: 10 }, () => generateSaveKey(keyData));
    const uniqueKeys = new Set(keys);

    expect(uniqueKeys.size).toBe(1);
  });
});

describe('encryptSaveData', () => {
  it('有効なGameStateを暗号化できる', () => {
    const gameState = createMockGameState();
    const encrypted = encryptSaveData(gameState);

    expect(typeof encrypted).toBe('string');
    expect(encrypted).toMatch(new RegExp(`^${SAVE_FORMAT_PREFIX}`));
    expect(encrypted.length).toBeGreaterThan(SAVE_FORMAT_PREFIX.length);
  });

  it('暗号化された文字列がbase64形式を含む', () => {
    const gameState = createMockGameState();
    const encrypted = encryptSaveData(gameState);
    const base64Part = encrypted.substring(SAVE_FORMAT_PREFIX.length);

    // Base64文字列の基本的なフォーマットチェック
    expect(() => atob(base64Part)).not.toThrow();
  });

  it('不正なGameStateでエラーをスローする', () => {
    const invalidGameState = null as any;
    expect(() => encryptSaveData(invalidGameState)).toThrow('セーブデータの暗号化に失敗しました');
  });

  it('循環参照を含むオブジェクトでエラーをスローする', () => {
    const gameState = createMockGameState();
    // 循環参照を作成
    (gameState as any).circular = gameState;

    expect(() => encryptSaveData(gameState)).toThrow('セーブデータの暗号化に失敗しました');
  });
});

describe('decryptSaveData', () => {
  it('暗号化されたデータを正しく復号化する', () => {
    const gameState = createMockGameState();
    const encrypted = encryptSaveData(gameState);
    const result = decryptSaveData(encrypted);

    expect(result.success).toBe(true);
    expect(result.gameState).toBeDefined();
    expect(result.gameState?.level).toBe(gameState.level);
    expect(result.gameState?.credits).toBe(gameState.credits);
  });

  it('不正なプレフィックスでエラーを返す', () => {
    const invalidData = `INVALID_PREFIX_${btoa('test')}`;
    const result = decryptSaveData(invalidData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('不正なセーブデータフォーマット');
  });

  it('破損したbase64データでエラーを返す', () => {
    const invalidData = `${SAVE_FORMAT_PREFIX}invalid-base64!!!`;
    const result = decryptSaveData(invalidData);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('不正なJSONでエラーを返す', () => {
    const invalidJson = SAVE_FORMAT_PREFIX + btoa('invalid json');
    const result = decryptSaveData(invalidJson);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('サポートされていないフォーマットでエラーを返す', () => {
    const mockExportData = {
      format: 'INVALID_FORMAT',
      version: '1.0.0',
      timestamp: Date.now(),
      gameData: 'encrypted',
      checksum: 'checksum',
      keyData: { level: 1, rebirthCount: 0, boardRandomSeed: 123 },
    };

    const invalidData = SAVE_FORMAT_PREFIX + btoa(JSON.stringify(mockExportData));
    const result = decryptSaveData(invalidData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('サポートされていないセーブデータフォーマット');
  });
});

describe('暗号化・復号化の完全性', () => {
  it('暗号化→復号化でデータが完全に復元される', () => {
    const originalGameState = createMockGameState();

    const encrypted = encryptSaveData(originalGameState);
    const result = decryptSaveData(encrypted);

    expect(result.success).toBe(true);
    expect(result.gameState).toEqual(originalGameState);
  });

  it('複数回の暗号化→復号化でも整合性が保たれる', () => {
    const originalGameState = createMockGameState();

    for (let i = 0; i < 5; i++) {
      const encrypted = encryptSaveData(originalGameState);
      const result = decryptSaveData(encrypted);

      expect(result.success).toBe(true);
      expect(result.gameState).toEqual(originalGameState);
    }
  });

  it('異なるGameStateからは異なる暗号化データが生成される', () => {
    const gameState1 = createMockGameState();
    const gameState2 = { ...gameState1, credits: 2000 };

    const encrypted1 = encryptSaveData(gameState1);
    const encrypted2 = encryptSaveData(gameState2);

    expect(encrypted1).not.toBe(encrypted2);
  });
});

describe('validateImportData', () => {
  it('有効なセーブデータを正しく検証する', () => {
    const gameState = createMockGameState();
    const encrypted = encryptSaveData(gameState);
    const result = validateImportData(encrypted);

    expect(result.isValid).toBe(true);
    expect(result.format).toBe('SGKT_v1');
    expect(result.version).toBe(SAVE_FORMAT_VERSION);
  });

  it('不正なプレフィックスを正しく検出する', () => {
    const invalidData = `INVALID_${btoa('test')}`;
    const result = validateImportData(invalidData);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('不正なセーブデータフォーマット');
  });

  it('破損したデータを正しく検出する', () => {
    const invalidData = `${SAVE_FORMAT_PREFIX}invalid!!!`;
    const result = validateImportData(invalidData);

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('不完全な構造を正しく検出する', () => {
    const incompleteData = {
      format: 'SGKT_v1',
      // version, gameData等が不足
    };

    const invalidData = SAVE_FORMAT_PREFIX + btoa(JSON.stringify(incompleteData));
    const result = validateImportData(invalidData);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('構造が不正');
  });
});

describe('generateSaveFileName', () => {
  beforeEach(() => {
    // 時刻を固定
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-15 14:30:45'));
  });

  it('正しいフォーマットのファイル名を生成する', () => {
    const fileName = generateSaveFileName();
    expect(fileName).toBe('sugoroku-save-2024-03-15-143045.txt');
  });

  it('一意のファイル名を生成する', () => {
    const fileName1 = generateSaveFileName();

    // 1秒進める
    vi.advanceTimersByTime(1000);
    const fileName2 = generateSaveFileName();

    expect(fileName1).not.toBe(fileName2);
  });

  it('ファイル名が期待される形式に一致する', () => {
    const fileName = generateSaveFileName();
    expect(fileName).toMatch(/^sugoroku-save-\d{4}-\d{2}-\d{2}-\d{6}\.txt$/);
  });
});

describe('createSaveBlob', () => {
  it('正しいBlobオブジェクトを作成する', () => {
    const testData = 'test save data';
    const blob = createSaveBlob(testData);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/plain;charset=utf-8');
    expect(blob.size).toBe(testData.length);
  });

  it('空文字列からも有効なBlobを作成する', () => {
    const blob = createSaveBlob('');

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBe(0);
  });

  it('日本語文字列を正しく処理する', () => {
    const japaneseText = 'すごろくゲーム';
    const blob = createSaveBlob(japaneseText);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(japaneseText.length); // UTF-8でエンコードされるため
  });
});

describe('エラーハンドリング', () => {
  it('チェックサム検証失敗を正しく処理する', () => {
    const gameState = createMockGameState();
    const encrypted = encryptSaveData(gameState);

    // チェックサムを破損させる
    const base64Data = encrypted.substring(SAVE_FORMAT_PREFIX.length);
    const exportJson = decodeURIComponent(escape(atob(base64Data)));
    const exportData = JSON.parse(exportJson);
    exportData.checksum = 'invalid_checksum';

    const corruptedData =
      SAVE_FORMAT_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(exportData))));
    const result = decryptSaveData(corruptedData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('破損');
  });

  it('大きなGameStateオブジェクトも処理できる', () => {
    const largeGameState = createMockGameState();

    // 大きなautoDice配列を作成
    largeGameState.autoDice = Array.from({ length: 100 }, (_, i) => ({
      faces: 4 + (i % 4) * 2,
      level: i + 1,
      isUnlocked: true,
      ascensionLevel: Math.floor(i / 10) + 1,
      totalLevelCost: (i + 1) * 100,
      totalAscensionCost: Math.floor(i / 10) * 1000,
    }));

    expect(() => {
      const encrypted = encryptSaveData(largeGameState);
      const result = decryptSaveData(encrypted);
      expect(result.success).toBe(true);
    }).not.toThrow();
  });
});
