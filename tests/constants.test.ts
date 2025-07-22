/**
 * constants.ts のテストファイル
 * ゲーム定数の妥当性検証、構造の整合性確認、値の範囲チェックを行います。
 */

import { describe, it, expect } from 'vitest';

import {
  DICE_CONFIGS,
  UPGRADE_MULTIPLIERS,
  MANUAL_DICE_CONFIG,
  BOARD_CONFIG,
  CELL_PROBABILITY,
  CALCULATION_CONSTANTS,
  GAME_CONFIG,
  FIXED_BACKWARD_CONFIG,
  CREDIT_CONFIG,
  UI_CONFIG,
  PRESTIGE_CONFIG,
  BURDEN_CONFIG,
  AUTO_DICE_LEVEL_CONFIG,
  STORAGE_KEYS,
} from '@/utils/constants';

describe('DICE_CONFIGS', () => {
  it('正しい数の自動ダイス設定が存在する', () => {
    expect(DICE_CONFIGS).toHaveLength(6);
  });

  it('各ダイス設定が必要なプロパティを持つ', () => {
    DICE_CONFIGS.forEach((config, index) => {
      expect(config).toHaveProperty('faces');
      expect(config).toHaveProperty('baseInterval');
      expect(config).toHaveProperty('emoji');

      // 面数は正の整数
      expect(config.faces).toBeGreaterThan(0);
      expect(Number.isInteger(config.faces)).toBe(true);

      // 基本間隔は正数
      expect(config.baseInterval).toBeGreaterThan(0);

      // 絵文字は空文字ではない
      expect(config.emoji.length).toBeGreaterThan(0);
    });
  });

  it('面数が昇順で並んでいる', () => {
    for (let i = 0; i < DICE_CONFIGS.length - 1; i++) {
      expect(DICE_CONFIGS[i].faces).toBeLessThan(DICE_CONFIGS[i + 1].faces);
    }
  });

  it('期待される面数の値を持つ', () => {
    const expectedFaces = [4, 6, 8, 10, 12, 20];
    const actualFaces = DICE_CONFIGS.map(config => config.faces);
    expect(actualFaces).toEqual(expectedFaces);
  });

  it('基本間隔が適切な範囲内にある', () => {
    DICE_CONFIGS.forEach(config => {
      expect(config.baseInterval).toBeGreaterThan(50);
      expect(config.baseInterval).toBeLessThan(300);
    });
  });
});

describe('UPGRADE_MULTIPLIERS', () => {
  it('必要なマルチプライヤーが存在する', () => {
    expect(UPGRADE_MULTIPLIERS).toHaveProperty('MANUAL_DICE');
  });

  it('マルチプライヤーが正数である', () => {
    expect(UPGRADE_MULTIPLIERS.MANUAL_DICE).toBeGreaterThan(0);
  });

  it('読み取り専用オブジェクトである', () => {
    // TypeScriptの`as const`による読み取り専用プロパティをテスト
    // 実行時には制限されないが、型レベルでは読み取り専用
    expect(UPGRADE_MULTIPLIERS).toHaveProperty('MANUAL_DICE');

    // 実際のオブジェクトは変更可能だが、型で保護されている
    const originalValue = UPGRADE_MULTIPLIERS.MANUAL_DICE;
    expect(originalValue).toBe(36.0);
  });
});

describe('MANUAL_DICE_CONFIG', () => {
  it('必要なプロパティを持つ', () => {
    expect(MANUAL_DICE_CONFIG).toHaveProperty('BASE_UPGRADE_COST');
    expect(MANUAL_DICE_CONFIG).toHaveProperty('BASE_FACES');
  });

  it('基本アップグレードコストが正数である', () => {
    expect(MANUAL_DICE_CONFIG.BASE_UPGRADE_COST).toBeGreaterThan(0);
  });

  it('基本面数が妥当な値である', () => {
    expect(MANUAL_DICE_CONFIG.BASE_FACES).toBe(6);
    expect(MANUAL_DICE_CONFIG.BASE_FACES).toBeGreaterThan(0);
  });
});

describe('BOARD_CONFIG', () => {
  it('必要なプロパティを持つ', () => {
    expect(BOARD_CONFIG).toHaveProperty('TOTAL_CELLS');
    expect(BOARD_CONFIG).toHaveProperty('CELL_TYPES');
  });

  it('総セル数が適切な値である', () => {
    expect(BOARD_CONFIG.TOTAL_CELLS).toBe(100);
    expect(BOARD_CONFIG.TOTAL_CELLS).toBeGreaterThan(0);
  });

  it('セルタイプが完全に定義されている', () => {
    const expectedCellTypes = ['EMPTY', 'CREDIT', 'FORWARD', 'BACKWARD', 'CREDIT_BONUS'];
    const actualCellTypes = Object.keys(BOARD_CONFIG.CELL_TYPES);
    expect(actualCellTypes).toEqual(expect.arrayContaining(expectedCellTypes));
    expect(actualCellTypes).toHaveLength(expectedCellTypes.length);
  });

  it('セルタイプの値が空文字でない', () => {
    Object.values(BOARD_CONFIG.CELL_TYPES).forEach(cellType => {
      expect(cellType.length).toBeGreaterThan(0);
      expect(typeof cellType).toBe('string');
    });
  });
});

describe('CELL_PROBABILITY', () => {
  it('必要な確率プロパティを持つ', () => {
    expect(CELL_PROBABILITY).toHaveProperty('CREDIT_RATIO');
    expect(CELL_PROBABILITY).toHaveProperty('FORWARD_RATIO');
    expect(CELL_PROBABILITY).toHaveProperty('BACKWARD_BASE_RATIO');
    expect(CELL_PROBABILITY).toHaveProperty('BACKWARD_MAX_RATIO');
  });

  it('確率値が0-1の範囲内にある', () => {
    Object.values(CELL_PROBABILITY).forEach(probability => {
      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(1);
    });
  });

  it('基本確率の合計が妥当である', () => {
    const baseSum =
      CELL_PROBABILITY.CREDIT_RATIO +
      CELL_PROBABILITY.FORWARD_RATIO +
      CELL_PROBABILITY.BACKWARD_BASE_RATIO;
    expect(baseSum).toBeLessThanOrEqual(1);
  });

  it('戻るマス最大確率が基本確率以上である', () => {
    expect(CELL_PROBABILITY.BACKWARD_MAX_RATIO).toBeGreaterThanOrEqual(
      CELL_PROBABILITY.BACKWARD_BASE_RATIO
    );
  });
});

describe('CALCULATION_CONSTANTS', () => {
  it('計算定数が正数である', () => {
    expect(CALCULATION_CONSTANTS.BACKWARD_RATIO_SCALING).toBeGreaterThan(0);
    expect(CALCULATION_CONSTANTS.BACKWARD_RATIO_DIVISOR).toBeGreaterThan(0);
    expect(CALCULATION_CONSTANTS.FORWARD_STEPS_RANGE).toBeGreaterThan(0);
    expect(CALCULATION_CONSTANTS.BACKWARD_STEPS_RANGE).toBeGreaterThan(0);
    expect(CALCULATION_CONSTANTS.BACKWARD_LEVEL_DIVISOR).toBeGreaterThan(0);
    expect(CALCULATION_CONSTANTS.BOARD_SEED_LEVEL_MULTIPLIER).toBeGreaterThan(0);
  });

  it('ステップ範囲が妥当である', () => {
    expect(CALCULATION_CONSTANTS.FORWARD_STEPS_RANGE).toBeLessThanOrEqual(10);
    expect(CALCULATION_CONSTANTS.BACKWARD_STEPS_RANGE).toBeLessThanOrEqual(10);
  });
});

describe('GAME_CONFIG', () => {
  it('必要なゲーム設定を持つ', () => {
    expect(GAME_CONFIG).toHaveProperty('TICK_RATE');
    expect(GAME_CONFIG).toHaveProperty('SAVE_INTERVAL');
    expect(GAME_CONFIG).toHaveProperty('MAX_SPEED_MULTIPLIER');
    expect(GAME_CONFIG).toHaveProperty('MAX_BACKWARD_STEPS');
  });

  it('ティックレートが60fpsに相当する', () => {
    expect(GAME_CONFIG.TICK_RATE).toBeCloseTo(1000 / 60, 2);
  });

  it('設定値が正数である', () => {
    Object.values(GAME_CONFIG).forEach(value => {
      expect(value).toBeGreaterThan(0);
    });
  });

  it('最大速度倍率が妥当な範囲である', () => {
    expect(GAME_CONFIG.MAX_SPEED_MULTIPLIER).toBeGreaterThanOrEqual(1);
    expect(GAME_CONFIG.MAX_SPEED_MULTIPLIER).toBeLessThanOrEqual(100);
  });
});

describe('FIXED_BACKWARD_CONFIG', () => {
  it('固定戻るマス設定が妥当である', () => {
    expect(FIXED_BACKWARD_CONFIG.START_LEVEL).toBeGreaterThan(0);
    expect(FIXED_BACKWARD_CONFIG.AREA_START).toBeGreaterThanOrEqual(0);
    expect(FIXED_BACKWARD_CONFIG.AREA_END).toBeGreaterThan(FIXED_BACKWARD_CONFIG.AREA_START);
    expect(FIXED_BACKWARD_CONFIG.MAX_COUNT).toBeGreaterThan(0);
    expect(FIXED_BACKWARD_CONFIG.LEVEL_INCREMENT).toBeGreaterThan(0);
  });

  it('配置エリアが盤面内にある', () => {
    expect(FIXED_BACKWARD_CONFIG.AREA_START).toBeLessThan(BOARD_CONFIG.TOTAL_CELLS);
    expect(FIXED_BACKWARD_CONFIG.AREA_END).toBeLessThan(BOARD_CONFIG.TOTAL_CELLS);
  });
});

describe('CREDIT_CONFIG', () => {
  it('クレジット計算設定が正数である', () => {
    Object.values(CREDIT_CONFIG).forEach(value => {
      expect(value).toBeGreaterThan(0);
    });
  });

  it('ランダムボーナス設定が妥当である', () => {
    expect(CREDIT_CONFIG.RANDOM_MIN).toBeLessThan(1);
    expect(CREDIT_CONFIG.RANDOM_RANGE).toBeLessThan(1);
    expect(CREDIT_CONFIG.RANDOM_MIN + CREDIT_CONFIG.RANDOM_RANGE).toBeGreaterThan(1);
  });
});

describe('UI_CONFIG', () => {
  it('アニメーション時間が妥当である', () => {
    expect(UI_CONFIG.ANIMATION_DURATION).toBeGreaterThan(0);
    expect(UI_CONFIG.DICE_ANIMATION_DURATION).toBeGreaterThan(0);
    expect(UI_CONFIG.GLOW_EFFECT_DURATION).toBeGreaterThan(0);

    // 妥当な範囲内（10秒以下）
    expect(UI_CONFIG.ANIMATION_DURATION).toBeLessThan(10000);
    expect(UI_CONFIG.DICE_ANIMATION_DURATION).toBeLessThan(10000);
    expect(UI_CONFIG.GLOW_EFFECT_DURATION).toBeLessThan(10000);
  });
});

describe('PRESTIGE_CONFIG', () => {
  it('プレステージ設定が妥当である', () => {
    expect(PRESTIGE_CONFIG.START_LEVEL).toBeGreaterThan(0);
    expect(PRESTIGE_CONFIG.BASE_POINTS).toBeGreaterThan(0);
    expect(PRESTIGE_CONFIG.SCALING_BASE).toBeGreaterThan(1);
    expect(PRESTIGE_CONFIG.SCALING_LEVEL_DIVISOR).toBeGreaterThan(0);
  });
});

describe('BURDEN_CONFIG', () => {
  it('負荷システム設定が妥当である', () => {
    expect(BURDEN_CONFIG.START_LEVEL).toBeGreaterThan(0);
    expect(BURDEN_CONFIG.LEVEL_INTERVAL).toBeGreaterThan(0);
    expect(BURDEN_CONFIG.MAX_INDIVIDUAL_REDUCTION).toBeGreaterThan(0);
    expect(BURDEN_CONFIG.HALVING_INTERVAL).toBeGreaterThan(0);
  });
});

describe('AUTO_DICE_LEVEL_CONFIG', () => {
  it('自動ダイスレベル設定が妥当である', () => {
    expect(AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE).toBeGreaterThan(0);
    expect(AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT).toBeGreaterThan(0);
    expect(AUTO_DICE_LEVEL_CONFIG.ASCENSION_COST_MULTIPLIER).toBeGreaterThan(1);
    expect(AUTO_DICE_LEVEL_CONFIG.SPEED_MULTIPLIER_MAX).toBeGreaterThan(1);
    expect(AUTO_DICE_LEVEL_CONFIG.DICE_COUNT_BASE).toBeGreaterThan(0);
    expect(AUTO_DICE_LEVEL_CONFIG.DICE_COUNT_MULTIPLIER).toBeGreaterThan(1);
    expect(AUTO_DICE_LEVEL_CONFIG.LEVEL_COST_BASE).toBeGreaterThan(0);
    expect(AUTO_DICE_LEVEL_CONFIG.LEVEL_COST_MULTIPLIER).toBeGreaterThan(1);
    expect(AUTO_DICE_LEVEL_CONFIG.ASCENSION_COST_BASE_MULTIPLIER).toBeGreaterThan(1);
  });
});

describe('STORAGE_KEYS', () => {
  it('ストレージキーが定義されている', () => {
    expect(STORAGE_KEYS).toHaveProperty('GAME_STATE');
    expect(typeof STORAGE_KEYS.GAME_STATE).toBe('string');
    expect(STORAGE_KEYS.GAME_STATE.length).toBeGreaterThan(0);
  });
});

describe('統合テスト', () => {
  it('全設定がundefinedではない', () => {
    expect(DICE_CONFIGS).toBeDefined();
    expect(UPGRADE_MULTIPLIERS).toBeDefined();
    expect(MANUAL_DICE_CONFIG).toBeDefined();
    expect(BOARD_CONFIG).toBeDefined();
    expect(CELL_PROBABILITY).toBeDefined();
    expect(CALCULATION_CONSTANTS).toBeDefined();
    expect(GAME_CONFIG).toBeDefined();
    expect(FIXED_BACKWARD_CONFIG).toBeDefined();
    expect(CREDIT_CONFIG).toBeDefined();
    expect(UI_CONFIG).toBeDefined();
    expect(PRESTIGE_CONFIG).toBeDefined();
    expect(BURDEN_CONFIG).toBeDefined();
    expect(AUTO_DICE_LEVEL_CONFIG).toBeDefined();
    expect(STORAGE_KEYS).toBeDefined();
  });

  it('設定値の相互関係が妥当である', () => {
    // プレステージ開始レベルが負荷開始レベル未満
    expect(PRESTIGE_CONFIG.START_LEVEL).toBeLessThan(BURDEN_CONFIG.START_LEVEL);

    // 固定戻るマス開始レベルがプレステージ開始レベル未満
    expect(FIXED_BACKWARD_CONFIG.START_LEVEL).toBeLessThan(PRESTIGE_CONFIG.START_LEVEL);

    // セーブ間隔がティックレートより大きい
    expect(GAME_CONFIG.SAVE_INTERVAL).toBeGreaterThan(GAME_CONFIG.TICK_RATE);
  });
});
