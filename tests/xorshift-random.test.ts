/**
 * xorshift-random.ts のテストファイル
 * XorShift128疑似乱数生成器の動作検証、品質テスト、統計的検定を行います。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { XorShiftRandom } from '@/utils/xorshift-random';

describe('XorShiftRandom コンストラクタ', () => {
  it('デフォルトシードで初期化される', () => {
    const rng = new XorShiftRandom();
    const states = rng.getStates();
    
    // 状態が設定されていることを確認（符号付き32bit整数の場合も考慮）
    expect(states[0]).not.toBe(0);
    expect(states[1]).not.toBe(0);
    expect(states[2]).not.toBe(0);
    expect(states[3]).not.toBe(0);
    
    // 配列の長さと型の確認
    expect(states).toHaveLength(4);
    states.forEach(state => {
      expect(typeof state).toBe('number');
      expect(Number.isInteger(state)).toBe(true);
    });
  });

  it('指定したシードで初期化される', () => {
    const seed = 12345;
    const rng = new XorShiftRandom(seed);
    const states = rng.getStates();
    
    // 同じシードでは同じ初期状態になる
    const rng2 = new XorShiftRandom(seed);
    const states2 = rng2.getStates();
    
    expect(states).toEqual(states2);
  });

  it('シード0でも正常に初期化される', () => {
    const rng = new XorShiftRandom(0);
    const states = rng.getStates();
    
    // ゼロシードでも0以外の状態が設定される
    expect(states[0]).not.toBe(0);
    expect(states[1]).not.toBe(0);
    expect(states[2]).not.toBe(0);
    expect(states[3]).not.toBe(0);
  });

  it('異なるシードから異なる初期状態が生成される', () => {
    const rng1 = new XorShiftRandom(12345);
    const rng2 = new XorShiftRandom(54321);
    
    const states1 = rng1.getStates();
    const states2 = rng2.getStates();
    
    expect(states1).not.toEqual(states2);
  });
});

describe('状態管理メソッド', () => {
  let rng: XorShiftRandom;

  beforeEach(() => {
    rng = new XorShiftRandom(12345);
  });

  it('getStatesで内部状態を取得できる', () => {
    const states = rng.getStates();
    
    expect(Array.isArray(states)).toBe(true);
    expect(states).toHaveLength(4);
    states.forEach(state => {
      expect(typeof state).toBe('number');
      expect(Number.isInteger(state)).toBe(true);
      expect(state).not.toBe(0);
    });
  });

  it('setStatesで内部状態を設定できる', () => {
    const newStates: [number, number, number, number] = [100, 200, 300, 400];
    rng.setStates(newStates);
    
    const retrievedStates = rng.getStates();
    expect(retrievedStates).toEqual(newStates);
  });

  it('setStatesで0を含む状態を設定すると1に変換される', () => {
    const statesWithZero: [number, number, number, number] = [0, 200, 0, 400];
    rng.setStates(statesWithZero);
    
    const retrievedStates = rng.getStates();
    expect(retrievedStates).toEqual([1, 200, 1, 400]);
  });

  it('setStateBySeedで状態を再設定できる', () => {
    const initialStates = rng.getStates();
    rng.setStateBySeed(54321);
    const newStates = rng.getStates();
    
    expect(newStates).not.toEqual(initialStates);
  });

  it('同じシードでsetStateBySeedすると同じ状態になる', () => {
    const seed = 98765;
    rng.setStateBySeed(seed);
    const states1 = rng.getStates();
    
    rng.setStateBySeed(seed);
    const states2 = rng.getStates();
    
    expect(states1).toEqual(states2);
  });
});

describe('基本乱数生成メソッド', () => {
  let rng: XorShiftRandom;

  beforeEach(() => {
    rng = new XorShiftRandom(12345);
  });

  it('next()が32bit符号なし整数を返す', () => {
    for (let i = 0; i < 100; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(0x100000000); // 2^32
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('nextFloat()が[0.0, 1.0)の範囲の浮動小数点数を返す', () => {
    for (let i = 0; i < 100; i++) {
      const value = rng.nextFloat();
      expect(value).toBeGreaterThanOrEqual(0.0);
      expect(value).toBeLessThan(1.0);
      expect(typeof value).toBe('number');
    }
  });

  it('nextInt(max)が[0, max)の範囲の整数を返す', () => {
    const max = 10;
    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(max);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(max);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('nextIntRange(min, max)が[min, max)の範囲の整数を返す', () => {
    const min = 5;
    const max = 15;
    for (let i = 0; i < 100; i++) {
      const value = rng.nextIntRange(min, max);
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThan(max);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('nextFloatRange(min, max)が[min, max)の範囲の浮動小数点数を返す', () => {
    const min = 1.5;
    const max = 3.5;
    for (let i = 0; i < 100; i++) {
      const value = rng.nextFloatRange(min, max);
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThan(max);
      expect(typeof value).toBe('number');
    }
  });
});

describe('決定性・再現性テスト', () => {
  it('同じシードから同じ乱数列を生成する', () => {
    const seed = 12345;
    const rng1 = new XorShiftRandom(seed);
    const rng2 = new XorShiftRandom(seed);
    
    const sequence1: number[] = [];
    const sequence2: number[] = [];
    
    for (let i = 0; i < 50; i++) {
      sequence1.push(rng1.next());
      sequence2.push(rng2.next());
    }
    
    expect(sequence1).toEqual(sequence2);
  });

  it('異なるシードから異なる乱数列を生成する', () => {
    const rng1 = new XorShiftRandom(12345);
    const rng2 = new XorShiftRandom(54321);
    
    const sequence1: number[] = [];
    const sequence2: number[] = [];
    
    for (let i = 0; i < 50; i++) {
      sequence1.push(rng1.next());
      sequence2.push(rng2.next());
    }
    
    expect(sequence1).not.toEqual(sequence2);
  });

  it('状態をリセットすると同じ乱数列を再生成する', () => {
    const seed = 98765;
    const rng = new XorShiftRandom(seed);
    
    const sequence1: number[] = [];
    for (let i = 0; i < 20; i++) {
      sequence1.push(rng.next());
    }
    
    // 状態をリセット
    rng.setStateBySeed(seed);
    
    const sequence2: number[] = [];
    for (let i = 0; i < 20; i++) {
      sequence2.push(rng.next());
    }
    
    expect(sequence1).toEqual(sequence2);
  });

  it('状態の保存・復元が正しく動作する', () => {
    const rng = new XorShiftRandom(12345);
    
    // いくつか乱数を生成
    for (let i = 0; i < 10; i++) {
      rng.next();
    }
    
    // 状態を保存
    const savedStates = rng.getStates();
    
    // さらに乱数を生成
    const sequence1: number[] = [];
    for (let i = 0; i < 10; i++) {
      sequence1.push(rng.next());
    }
    
    // 状態を復元
    rng.setStates(savedStates);
    
    // 同じ乱数列が生成されることを確認
    const sequence2: number[] = [];
    for (let i = 0; i < 10; i++) {
      sequence2.push(rng.next());
    }
    
    expect(sequence1).toEqual(sequence2);
  });
});

describe('統計的品質テスト', () => {
  let rng: XorShiftRandom;

  beforeEach(() => {
    rng = new XorShiftRandom(12345);
  });

  it('nextFloat()の分布が概ね均等である', () => {
    const sampleSize = 10000;
    const buckets = 10;
    const counts = new Array(buckets).fill(0);
    
    for (let i = 0; i < sampleSize; i++) {
      const value = rng.nextFloat();
      const bucket = Math.floor(value * buckets);
      counts[bucket === buckets ? buckets - 1 : bucket]++;
    }
    
    const expectedCount = sampleSize / buckets;
    const tolerance = expectedCount * 0.2; // 20%の許容範囲
    
    counts.forEach(count => {
      expect(count).toBeGreaterThan(expectedCount - tolerance);
      expect(count).toBeLessThan(expectedCount + tolerance);
    });
  });

  it('nextInt()の分布が概ね均等である', () => {
    const max = 6;
    const sampleSize = 6000;
    const counts = new Array(max).fill(0);
    
    for (let i = 0; i < sampleSize; i++) {
      const value = rng.nextInt(max);
      counts[value]++;
    }
    
    const expectedCount = sampleSize / max;
    const tolerance = expectedCount * 0.2; // 20%の許容範囲
    
    counts.forEach(count => {
      expect(count).toBeGreaterThan(expectedCount - tolerance);
      expect(count).toBeLessThan(expectedCount + tolerance);
    });
  });

  it('連続する値に明らかな相関がない', () => {
    const sampleSize = 1000;
    let correlationSum = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      const value1 = rng.nextFloat();
      const value2 = rng.nextFloat();
      correlationSum += value1 * value2;
    }
    
    const averageCorrelation = correlationSum / sampleSize;
    
    // 理想的には0.25（独立の場合の期待値）に近い値になる
    expect(averageCorrelation).toBeGreaterThan(0.2);
    expect(averageCorrelation).toBeLessThan(0.3);
  });

  it('各桁のビットがランダムに分布する', () => {
    const sampleSize = 10000;
    const bitCounts = new Array(32).fill(0);
    
    for (let i = 0; i < sampleSize; i++) {
      const value = rng.next();
      for (let bit = 0; bit < 32; bit++) {
        if ((value >>> bit) & 1) {
          bitCounts[bit]++;
        }
      }
    }
    
    const expectedCount = sampleSize / 2;
    const tolerance = expectedCount * 0.1; // 10%の許容範囲
    
    bitCounts.forEach(count => {
      expect(count).toBeGreaterThan(expectedCount - tolerance);
      expect(count).toBeLessThan(expectedCount + tolerance);
    });
  });
});

describe('エッジケース・エラーハンドリング', () => {
  it('nextInt(1)が常に0を返す', () => {
    const rng = new XorShiftRandom(12345);
    for (let i = 0; i < 10; i++) {
      expect(rng.nextInt(1)).toBe(0);
    }
  });

  it('nextIntRangeで同じmin, maxを指定すると常にminを返す', () => {
    const rng = new XorShiftRandom(12345);
    for (let i = 0; i < 10; i++) {
      expect(rng.nextIntRange(5, 5)).toBe(5);
    }
  });

  it('nextFloatRangeで同じmin, maxを指定すると常にminを返す', () => {
    const rng = new XorShiftRandom(12345);
    for (let i = 0; i < 10; i++) {
      expect(rng.nextFloatRange(3.14, 3.14)).toBe(3.14);
    }
  });

  it('大きなmax値でも正常に動作する', () => {
    const rng = new XorShiftRandom(12345);
    const max = 1000000;
    
    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(max);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(max);
    }
  });

  it('負のmin値でも正常に動作する', () => {
    const rng = new XorShiftRandom(12345);
    const min = -10;
    const max = 10;
    
    for (let i = 0; i < 100; i++) {
      const value = rng.nextIntRange(min, max);
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThan(max);
    }
  });
});

describe('パフォーマンステスト', () => {
  it('大量の乱数生成が適切な時間で完了する', () => {
    const rng = new XorShiftRandom(12345);
    const iterations = 100000;
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      rng.next();
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // 10万回の乱数生成が100ms以内で完了することを期待
    expect(duration).toBeLessThan(100);
  });

  it('各メソッドの実行時間が合理的である', () => {
    const rng = new XorShiftRandom(12345);
    const iterations = 10000;
    
    // next()のテスト
    let startTime = performance.now();
    for (let i = 0; i < iterations; i++) {
      rng.next();
    }
    let endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(50);
    
    // nextFloat()のテスト
    startTime = performance.now();
    for (let i = 0; i < iterations; i++) {
      rng.nextFloat();
    }
    endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(50);
    
    // nextInt()のテスト
    startTime = performance.now();
    for (let i = 0; i < iterations; i++) {
      rng.nextInt(100);
    }
    endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(50);
  });
});

describe('アルゴリズム特性テスト', () => {
  it('XorShift128の特性を満たす', () => {
    const rng = new XorShiftRandom(1);
    
    // 初期状態が全て0でないことを確認
    const states = rng.getStates();
    const hasNonZero = states.some(state => state !== 0);
    expect(hasNonZero).toBe(true);
    
    // 長期間実行しても0状態にならないことを確認
    for (let i = 0; i < 10000; i++) {
      rng.next();
    }
    
    const laterStates = rng.getStates();
    const stillHasNonZero = laterStates.some(state => state !== 0);
    expect(stillHasNonZero).toBe(true);
  });

  it('周期性が十分に長い', () => {
    const rng = new XorShiftRandom(12345);
    const initialStates = rng.getStates();
    
    // 大量の乱数を生成（現実的な範囲で）
    for (let i = 0; i < 1000000; i++) {
      rng.next();
    }
    
    const laterStates = rng.getStates();
    
    // 初期状態に戻っていないことを確認（短い周期でないことの確認）
    expect(laterStates).not.toEqual(initialStates);
  });

  it('シード品質の改善が機能している', () => {
    // 連続するシードから異なる初期状態が生成されることを確認
    const rng1 = new XorShiftRandom(100);
    const rng2 = new XorShiftRandom(101);
    
    const states1 = rng1.getStates();
    const states2 = rng2.getStates();
    
    // 少なくとも一つの状態は異なる必要がある
    const hasDifference = states1.some((state, index) => state !== states2[index]);
    expect(hasDifference).toBe(true);
  });
});

describe('ゲーム用途での実用性テスト', () => {
  it('ダイスロールのシミュレーション', () => {
    const rng = new XorShiftRandom(12345);
    const diceFaces = 6;
    const rolls = new Array(diceFaces).fill(0);
    const totalRolls = 6000;
    
    for (let i = 0; i < totalRolls; i++) {
      const roll = rng.nextIntRange(1, diceFaces + 1);
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(diceFaces);
      rolls[roll - 1]++;
    }
    
    // 各目がほぼ同等に出ることを確認
    const expectedRollsPerFace = totalRolls / diceFaces;
    const tolerance = expectedRollsPerFace * 0.15; // 15%の許容範囲
    
    rolls.forEach(count => {
      expect(count).toBeGreaterThan(expectedRollsPerFace - tolerance);
      expect(count).toBeLessThan(expectedRollsPerFace + tolerance);
    });
  });

  it('確率イベントのシミュレーション', () => {
    const rng = new XorShiftRandom(12345);
    const probability = 0.1; // 10%の確率
    const trials = 10000;
    let successes = 0;
    
    for (let i = 0; i < trials; i++) {
      if (rng.nextFloat() < probability) {
        successes++;
      }
    }
    
    const actualRate = successes / trials;
    const tolerance = 0.02; // 2%の許容範囲
    
    expect(actualRate).toBeGreaterThan(probability - tolerance);
    expect(actualRate).toBeLessThan(probability + tolerance);
  });

  it('範囲指定での値生成がゲーム用途に適している', () => {
    const rng = new XorShiftRandom(12345);
    
    // クレジット量のランダム化（800-1200の範囲）
    for (let i = 0; i < 100; i++) {
      const credit = rng.nextIntRange(800, 1201);
      expect(credit).toBeGreaterThanOrEqual(800);
      expect(credit).toBeLessThanOrEqual(1200);
    }
    
    // ダメージ倍率のランダム化（0.8-1.2の範囲）
    for (let i = 0; i < 100; i++) {
      const multiplier = rng.nextFloatRange(0.8, 1.2);
      expect(multiplier).toBeGreaterThanOrEqual(0.8);
      expect(multiplier).toBeLessThan(1.2);
    }
  });
});