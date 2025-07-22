// XorShift128ベースの疑似乱数生成器

/**
 * XorShift128疑似乱数生成器クラス
 * 128bit状態による高品質な疑似乱数を生成し、状態を内部で管理する
 * 周期: 2^128 - 1（約3.4 × 10^38）
 */
export class XorShiftRandom {
  private x: number;
  private y: number;
  private z: number;
  private w: number;

  /**
   * コンストラクタ
   * @param seed 初期シード値（0の場合は現在時刻を使用）
   */
  constructor(seed: number = 0) {
    // シードが0の場合は現在時刻を使用
    const baseSeed = seed || Date.now();
    this.x = 1;
    this.y = 2;
    this.z = 3;
    this.w = 4;

    // シードから状態を設定
    this.setStateBySeed(baseSeed);
  }

  /**
   * 全ての内部状態を取得
   * @returns [x, y, z, w] の配列
   */
  getStates(): [number, number, number, number] {
    return [this.x, this.y, this.z, this.w];
  }

  /**
   * 全ての内部状態を設定
   * @param states \[x, y, z, w\] の配列
   */
  setStates(states: [number, number, number, number]): void {
    this.x = states[0] === 0 ? 1 : states[0];
    this.y = states[1] === 0 ? 1 : states[1];
    this.z = states[2] === 0 ? 1 : states[2];
    this.w = states[3] === 0 ? 1 : states[3];
  }

  /**
   * シードから内部状態を設定
   * @param seed 初期シード値
   */
  setStateBySeed(seed: number): void {
    // 単一シードから4つの異なる32bit状態を生成
    // シードから状態値を生成し、内部状態を設定
    this.x = this.seedToState(seed, 1);
    this.y = this.seedToState(seed, 2);
    this.z = this.seedToState(seed, 3);
    this.w = this.seedToState(seed, 4);

    // シードの品質を向上させるため、初期化時に数回実行
    for (let i = 0; i < 20; i++) {
      this.next();
    }
  }

  /**
   * シードから状態値を生成（0を避ける）
   * @param seed 基本シード
   * @param multiplier 乗数（状態ごとに異なる値）
   * @returns 0以外の32bit状態値
   */
  private seedToState(seed: number, multiplier: number): number {
    // 簡単なハッシュ関数でシードを変換
    let state = (seed * (multiplier * 1664525 + 1013904223)) >>> 0;

    // Linear Congruential Generatorで更に混合
    state = (state * 1103515245 + 12345) >>> 0;
    state = (state / 65536) % 32768 >>> 0;

    // 0の場合は1に設定（XorShift128では全状態が0だと動作しない）
    return state === 0 ? 1 : state;
  }

  /**
   * 次の32bit整数値を生成（XorShift128アルゴリズム）
   * @returns 0以上2^32未満の整数
   */
  next(): number {
    // XorShift128の標準的なアルゴリズム
    const t = this.x ^ (this.x << 11);

    this.x = this.y;
    this.y = this.z;
    this.z = this.w;
    this.w = this.w ^ (this.w >>> 19) ^ (t ^ (t >>> 8));

    // 符号なし32bit整数として扱う
    return this.w >>> 0;
  }

  /**
   * 0.0以上1.0未満の浮動小数点数を生成
   * @returns [0.0, 1.0) の範囲の浮動小数点数
   */
  nextFloat(): number {
    return this.next() / 0x100000000; // 2^32で割る
  }

  /**
   * 0以上max未満の整数を生成
   * @param max 最大値（この値は含まない）
   * @returns [0, max) の範囲の整数
   */
  nextInt(max: number): number {
    return Math.floor(this.nextFloat() * max);
  }

  /**
   * min以上max未満の整数を生成
   * @param min 最小値（この値を含む）
   * @param max 最大値（この値は含まない）
   * @returns [min, max) の範囲の整数
   */
  nextIntRange(min: number, max: number): number {
    return min + this.nextInt(max - min);
  }

  /**
   * min以上max未満の浮動小数点数を生成
   * @param min 最小値
   * @param max 最大値
   * @returns [min, max) の範囲の浮動小数点数
   */
  nextFloatRange(min: number, max: number): number {
    return min + this.nextFloat() * (max - min);
  }
}
