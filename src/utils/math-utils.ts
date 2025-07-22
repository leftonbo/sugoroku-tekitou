// 数値計算・フォーマット関連ユーティリティ

import { PRESTIGE_CONFIG, CALCULATION_CONSTANTS, AUTO_DICE_LEVEL_CONFIG } from './constants.js';
import type { NumberFormatType } from '../types/game-state.js';

/**
 * 与えられた数値を英語形式でフォーマットして文字列として返します。
 * 後方互換性のために保持されています。
 *
 * @param num フォーマットする数値
 * @returns 英語形式でフォーマットされた数値の文字列
 * @deprecated この関数は将来的に削除される予定です。代わりに formatNumberWithType を使用してください。
 */
export function formatNumber(num: number): string {
  return formatNumberWithType(num, 'english');
}

/**
 * 指定された命数法に従って数値を文字列に変換します。
 *
 * @param num - 変換する数値
 * @param formatType - 命数法のタイプ（'japanese', 'english', 'scientific' のいずれか）
 * @returns フォーマットされた数値の文字列
 */
export function formatNumberWithType(num: number, formatType: NumberFormatType): string {
  if (num === 0) return '0';

  switch (formatType) {
    case 'japanese':
      return formatNumberJapanese(num);
    case 'english':
      return formatNumberEnglish(num);
    case 'scientific':
      return formatNumberScientific(num);
    default:
      return formatNumberEnglish(num);
  }
}

// 日本語数詞の定義（八十華厳の数詞を含む）
interface JapaneseUnit {
  readonly threshold: number;
  readonly divisor: number;
  readonly name: string;
}

const JAPANESE_UNITS: readonly JapaneseUnit[] = [
  { threshold: 1e4, divisor: 1e4, name: '万' },
  { threshold: 1e8, divisor: 1e8, name: '億' },
  { threshold: 1e12, divisor: 1e12, name: '兆' },
  { threshold: 1e16, divisor: 1e16, name: '京' },
  { threshold: 1e20, divisor: 1e20, name: '垓' },
  { threshold: 1e24, divisor: 1e24, name: '秭' },
  { threshold: 1e28, divisor: 1e28, name: '穣' },
  { threshold: 1e32, divisor: 1e32, name: '溝' },
  { threshold: 1e36, divisor: 1e36, name: '澗' },
  { threshold: 1e40, divisor: 1e40, name: '正' },
  { threshold: 1e44, divisor: 1e44, name: '載' },
  { threshold: 1e48, divisor: 1e48, name: '極' },
  { threshold: 1e52, divisor: 1e52, name: '恒河沙' },
  { threshold: 1e56, divisor: 1e56, name: '阿僧祇' },
  { threshold: 1e60, divisor: 1e60, name: '那由他' },
  { threshold: 1e64, divisor: 1e64, name: '不可思議' },
  { threshold: 1e68, divisor: 1e68, name: '無量大数' },
  // 一般的な数詞はここまで
  // 以降はAIが出してくれた謎の数詞をそのまま使用 (TODO: なんとかする)
  { threshold: 1e72, divisor: 1e72, name: '頻波羅' },
  { threshold: 1e76, divisor: 1e76, name: '矜羯羅' },
  { threshold: 1e80, divisor: 1e80, name: '阿伽羅' },
  { threshold: 1e84, divisor: 1e84, name: '最勝' },
  { threshold: 1e88, divisor: 1e88, name: '摩婆羅' },
  { threshold: 1e92, divisor: 1e92, name: '婆嚕吒' },
  { threshold: 1e96, divisor: 1e96, name: '伽羅毘' },
  { threshold: 1e100, divisor: 1e100, name: '鉢羅麼怛羅' },
  { threshold: 1e104, divisor: 1e104, name: '薩陀夜' },
  { threshold: 1e108, divisor: 1e108, name: '尸婆歩雲' },
  { threshold: 1e112, divisor: 1e112, name: '薄佉羅' },
  { threshold: 1e116, divisor: 1e116, name: '跋嚕那' },
  { threshold: 1e120, divisor: 1e120, name: '娑伽羅龍王' },
  { threshold: 1e124, divisor: 1e124, name: '阿波波' },
  { threshold: 1e128, divisor: 1e128, name: '嚴浮' },
  { threshold: 1e132, divisor: 1e132, name: '掘蒲' },
  { threshold: 1e136, divisor: 1e136, name: '鍮波羅' },
  { threshold: 1e140, divisor: 1e140, name: '驢分那' },
  { threshold: 1e144, divisor: 1e144, name: '質多羅' },
  { threshold: 1e148, divisor: 1e148, name: '阿波羅' },
  { threshold: 1e152, divisor: 1e152, name: '界分' },
  { threshold: 1e156, divisor: 1e156, name: '普摩' },
  { threshold: 1e160, divisor: 1e160, name: '祇婆羅' },
  { threshold: 1e164, divisor: 1e164, name: '毘伽婆' },
  { threshold: 1e168, divisor: 1e168, name: '嗢蹭伽' },
  { threshold: 1e172, divisor: 1e172, name: '娑攞荼' },
  { threshold: 1e176, divisor: 1e176, name: '謎嚧陀' },
  { threshold: 1e180, divisor: 1e180, name: '者麼' },
  { threshold: 1e184, divisor: 1e184, name: '驢波' },
  { threshold: 1e188, divisor: 1e188, name: '伽攞麼' },
  { threshold: 1e192, divisor: 1e192, name: '調伏' },
  { threshold: 1e196, divisor: 1e196, name: '離畔' },
  { threshold: 1e200, divisor: 1e200, name: '印' },
  { threshold: 1e204, divisor: 1e204, name: '世間' },
  { threshold: 1e208, divisor: 1e208, name: '毘盧遮那' },
  { threshold: 1e212, divisor: 1e212, name: '皤伽婆' },
  { threshold: 1e216, divisor: 1e216, name: '僧伽胝' },
  { threshold: 1e220, divisor: 1e220, name: '趣' },
  { threshold: 1e224, divisor: 1e224, name: '至' },
  { threshold: 1e228, divisor: 1e228, name: '阿僧祇品' },
  { threshold: 1e232, divisor: 1e232, name: '歩' },
  { threshold: 1e236, divisor: 1e236, name: '路' },
  { threshold: 1e240, divisor: 1e240, name: '由旬' },
  { threshold: 1e244, divisor: 1e244, name: '俱胝' },
  { threshold: 1e248, divisor: 1e248, name: '阿庾多' },
  { threshold: 1e252, divisor: 1e252, name: '那由他轉' },
  { threshold: 1e256, divisor: 1e256, name: '鉢羅慕陀' },
  { threshold: 1e260, divisor: 1e260, name: '矜羯羅轉' },
  { threshold: 1e264, divisor: 1e264, name: '普賢行' },
  { threshold: 1e268, divisor: 1e268, name: '妙覺' },
  { threshold: 1e272, divisor: 1e272, name: '白蓮華' },
  { threshold: 1e276, divisor: 1e276, name: '微塵' },
  { threshold: 1e280, divisor: 1e280, name: '怛羅歩' },
  { threshold: 1e284, divisor: 1e284, name: '善覺' },
  { threshold: 1e288, divisor: 1e288, name: '一持' },
  { threshold: 1e292, divisor: 1e292, name: '異路' },
  { threshold: 1e296, divisor: 1e296, name: '十方' },
  { threshold: 1e300, divisor: 1e300, name: '無邊' },
  { threshold: 1e304, divisor: 1e304, name: '法界' },
  { threshold: 1e308, divisor: 1e308, name: '不可説不可説' },
];

/**
 * 与えられた数値を日本語の命数法（万、億、兆、...）でフォーマットして文字列として返します。
 * 八十華厳の数詞を含み、e308（JavaScript の Number.MAX_VALUE）まで対応しています。
 *
 * - 1 万未満の場合はそのまま整数値を返します。
 * - 1 万以上の場合は適切な単位を付与し、小数点 1 桁で表現します。
 * - 負の値の場合は先頭に「-」が付きます。
 * - e308を超える場合は科学的記数法で返します。
 * - O(log n)の二分探索とメモ化により高速化されています。
 *
 * @param num フォーマットする数値
 * @returns 日本語の命数法でフォーマットされた文字列
 */
function formatNumberJapanese(num: number): string {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum < 10000) {
    return sign + Math.floor(absNum).toString();
  }

  // e308を超える場合は科学的記数法にフォールバック
  if (absNum > Number.MAX_VALUE) {
    return formatNumberScientific(num);
  }

  // キャッシュをチェック（メモ化による高速化）
  const cachedResult = JAPANESE_FORMAT_CACHE.get(num);
  if (cachedResult !== undefined) {
    return cachedResult;
  }

  // 二分探索で適切な単位を検索（O(log n)で高速化）
  const unit = findJapaneseUnitBinarySearch(absNum);

  let result: string;
  if (unit) {
    result = sign + (absNum / unit.divisor).toFixed(1) + unit.name;
  } else {
    // ここに到達することはないが、安全のため
    result = sign + Math.floor(absNum).toString();
  }

  // 結果をキャッシュに保存（メモリ制限：最大100エントリ）
  if (JAPANESE_FORMAT_CACHE.size < 100) {
    JAPANESE_FORMAT_CACHE.set(num, result);
  } else {
    // キャッシュサイズ制限に達した場合、最も古いエントリを削除
    const firstKey = JAPANESE_FORMAT_CACHE.keys().next().value;
    if (firstKey !== undefined) {
      JAPANESE_FORMAT_CACHE.delete(firstKey);
      JAPANESE_FORMAT_CACHE.set(num, result);
    }
  }

  return result;
}

// 英語略式命数法の配列定義（AAS方式）
const ENGLISH_ONES: readonly string[] = ['', 'Un', 'Du', 'Tr', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
const ENGLISH_TENS: readonly string[] = ['', 'Dc', 'Vg', 'Tg', 'Qg', 'Qq', 'Sg', 'Su', 'Og', 'Ng'];
const ENGLISH_HUNDREDS: readonly string[] = [
  '',
  'Ce',
  'Dc',
  'Tc',
  'Qe',
  'Qu',
  'Se',
  'St',
  'Oe',
  'Ne',
];

// 基本略記法のマッピング（1e3〜1e33の範囲）
interface BasicAbbreviation {
  readonly threshold: number;
  readonly divisor: number;
  readonly suffix: string;
}

const BASIC_ABBREVIATIONS: readonly BasicAbbreviation[] = [
  { threshold: 1e3, divisor: 1e3, suffix: 'K' },
  { threshold: 1e6, divisor: 1e6, suffix: 'M' },
  { threshold: 1e9, divisor: 1e9, suffix: 'B' },
  { threshold: 1e12, divisor: 1e12, suffix: 'T' },
  { threshold: 1e15, divisor: 1e15, suffix: 'Qa' },
  { threshold: 1e18, divisor: 1e18, suffix: 'Qi' },
  { threshold: 1e21, divisor: 1e21, suffix: 'Sx' },
  { threshold: 1e24, divisor: 1e24, suffix: 'Sp' },
  { threshold: 1e27, divisor: 1e27, suffix: 'Oc' },
  { threshold: 1e30, divisor: 1e30, suffix: 'No' },
  { threshold: 1e33, divisor: 1e33, suffix: 'Dc' },
];

// 略記生成結果のキャッシュ（パフォーマンス最適化）
const ABBREVIATION_CACHE = new Map<number, string>();

// 日本語数値フォーマット結果のキャッシュ（パフォーマンス最適化）
const JAPANESE_FORMAT_CACHE = new Map<number, string>();

/**
 * 二分探索で日本語単位を検索
 * ソート済みのJAPANESE_UNITS配列から、指定された数値に適用する単位を効率的に検索します。
 * O(log n)の時間計算量でO(n)の線形探索を改善します。
 *
 * @param absNum 検索対象の数値（絶対値）
 * @returns 適用する単位オブジェクト、見つからない場合はnull
 */
function findJapaneseUnitBinarySearch(absNum: number): JapaneseUnit | null {
  let left = 0;
  let right = JAPANESE_UNITS.length - 1;
  let result: JapaneseUnit | null = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const unit = JAPANESE_UNITS[mid];

    if (unit && absNum >= unit.threshold) {
      result = unit; // 条件を満たす単位を記録
      left = mid + 1; // より大きな単位を探す
    } else {
      right = mid - 1; // より小さな単位を探す
    }
  }

  return result;
}

/**
 * 指数から英語略記を生成します（AAS方式）
 * 指数を3で割った値から一の位、十の位、百の位、千の位を計算し、
 * 対応する配列から略記を合成します。
 *
 * @param exponent 指数（3の倍数）
 * @returns 生成された略記文字列
 * @throws エラーが発生した場合は科学的記数法にフォールバック
 */
export function generateAbbreviation(exponent: number): string {
  try {
    // 入力検証
    if (!isFinite(exponent) || exponent < 0) {
      throw new Error(`無効な指数: ${exponent}`);
    }

    // キャッシュから結果を取得
    const cachedResult = ABBREVIATION_CACHE.get(exponent);
    if (cachedResult !== undefined) {
      return cachedResult;
    }

    // 指数を3で割って基本単位を取得
    const unit = Math.floor(exponent / 3);

    let result: string;

    // 基本略記法の範囲（1-11）の場合
    if (unit <= 11) {
      const abbreviation = BASIC_ABBREVIATIONS[unit - 1];
      if (!abbreviation) {
        throw new Error(`基本略記法の範囲外: unit=${unit}`);
      }
      result = abbreviation.suffix;
    } else {
      // AAS方式での略記生成（unit >= 12）
      const adjustedUnit = unit - 12; // Dcから始まるので12を引く

      // 桁分解
      const onesDigit = adjustedUnit % 10;
      const tensDigit = Math.floor(adjustedUnit / 10) % 10;
      const hundredsDigit = Math.floor(adjustedUnit / 100) % 10;
      const thousandsDigit = Math.floor(adjustedUnit / 1000);

      // 配列の範囲チェック
      if (
        onesDigit >= ENGLISH_ONES.length ||
        tensDigit >= ENGLISH_TENS.length ||
        hundredsDigit >= ENGLISH_HUNDREDS.length
      ) {
        throw new Error(
          `配列の範囲外: ones=${onesDigit}, tens=${tensDigit}, hundreds=${hundredsDigit}`
        );
      }

      // 千の位以上は再帰的に処理
      result = '';

      if (thousandsDigit > 0) {
        result += generateAbbreviation((thousandsDigit + 11) * 3); // 千の位は11を足してから処理
      }

      // 百の位、十の位、一の位を順番に追加
      result +=
        (ENGLISH_HUNDREDS[hundredsDigit] || '') +
        (ENGLISH_TENS[tensDigit] || '') +
        (ENGLISH_ONES[onesDigit] || '');
    }

    // キャッシュに結果を保存（メモリ制限：最大1000エントリ）
    if (ABBREVIATION_CACHE.size < 1000) {
      ABBREVIATION_CACHE.set(exponent, result);
    }

    return result;
  } catch (error) {
    // エラーが発生した場合は科学的記数法にフォールバック
    console.warn(`略記生成エラー (exponent=${exponent}):`, error);
    return `e${exponent}`;
  }
}

/**
 * 与えられた数値を英語の略記命数法（K, M, B, T など）でフォーマットして文字列として返します。
 * 例えば、1500 は "1.5K"、2500000 は "2.5M" のように変換されます。
 * 負の値の場合は先頭に '-' が付きます。
 *
 * @param num フォーマットする数値
 * @returns 英語略記でフォーマットされた文字列
 */
export function formatNumberEnglish(num: number): string {
  try {
    // 入力検証
    if (!isFinite(num) || isNaN(num)) {
      return num.toString();
    }

    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (absNum < 1000) {
      return sign + Math.floor(absNum).toString();
    }

    // 指数を計算（log10を使用）
    const exponent = Math.floor(Math.log10(absNum));

    // 3の倍数に調整（例：10^85 → 10^84）
    const adjustedExponent = Math.floor(exponent / 3) * 3;

    // 除数を計算
    const divisor = Math.pow(10, adjustedExponent);

    // 値を計算
    const value = (absNum / divisor).toFixed(1);

    // 略記を生成
    const abbreviation = generateAbbreviation(adjustedExponent);

    return sign + value + abbreviation;
  } catch (error) {
    // エラーが発生した場合は科学的記数法にフォールバック
    console.warn(`英語数値フォーマットエラー (num=${num}):`, error);
    return formatNumberScientific(num);
  }
}

/**
 * 与えられた数値を科学的記数法または通常の整数表記でフォーマットします。
 *
 * 数値の絶対値が1000未満の場合は、整数に切り捨てて文字列として返します。
 * 1000以上の場合は、指数表記（有効数字2桁）で返します。
 *
 * @param num フォーマットする数値
 * @returns 科学的記数法または整数表記の文字列
 */
function formatNumberScientific(num: number): string {
  if (Math.abs(num) < 1000) {
    return Math.floor(num).toString();
  }
  return num.toExponential(2);
}

/**
 * 盤面用シード生成（改善版：ハッシュ関数的アプローチ）
 * 転生回数とレベルから盤面生成用のシード値を計算します。
 *
 * より複雑なハッシュ計算により、レベル間のシード分散を改善し、
 * 同じ転生・レベルでは同じ盤面を生成できる再現性を保証します。
 *
 * @param rebirthCount 転生回数
 * @param level 現在のレベル
 * @returns ハッシュ化されたシード値（32bit符号なし整数）
 */
export function getBoardSeed(rebirthCount: number, level: number): number {
  // より複雑なハッシュ計算でレベル間のシード分散を改善
  let seed = rebirthCount * 12345 + level * 67890;

  // ハッシュ関数的な変換を複数回適用
  seed = ((seed ^ (seed >>> 16)) * 0x85ebca6b) >>> 0;
  seed = ((seed ^ (seed >>> 13)) * 0xc2b2ae35) >>> 0;
  seed = (seed ^ (seed >>> 16)) >>> 0;

  // 最終的に大きな素数を掛けて分散を向上
  return (seed * 2654435761) >>> 0;
}

/**
 * 手動ダイスアップグレードのコスト計算
 * 指定されたレベルでの手動ダイスアップグレードコストを計算します。
 *
 * @param level 現在のアップグレードレベル
 * @param baseCost 基本コスト
 * @param multiplier レベルごとのコスト倍率
 * @returns 計算されたアップグレードコスト（整数値）
 */
export function calculateManualDiceUpgradeCost(
  level: number,
  baseCost: number,
  multiplier: number
): number {
  return Math.floor(baseCost * Math.pow(multiplier, level));
}

/**
 * 戻るマスの確率計算（位置に応じて変動）
 * プレイヤーの現在位置に応じて戻るマスの出現確率を計算します。
 * 位置が進むほど戻るマスの確率が上昇し、最大値でキャップされます。
 *
 * @param position プレイヤーの現在位置
 * @param baseRatio 基本の戻るマス確率
 * @param maxRatio 戻るマス確率の最大値
 * @returns 計算された戻るマス確率（0.0〜1.0の範囲）
 */
export function calculateBackwardRatio(
  position: number,
  baseRatio: number,
  maxRatio: number
): number {
  return Math.min(
    maxRatio,
    baseRatio +
      (position / CALCULATION_CONSTANTS.BACKWARD_RATIO_DIVISOR) *
        CALCULATION_CONSTANTS.BACKWARD_RATIO_SCALING
  );
}

/**
 * プレステージポイント計算（レベル50以降、べき乗算的増加）
 * 指定されたレベルで獲得できるプレステージポイント数を計算します。
 * 開始レベル未満では0ポイント、以降はべき乗的に増加します。
 *
 * @param level 現在のレベル
 * @param startLevel プレステージポイント獲得開始レベル
 * @param basePoints 基本ポイント数
 * @returns 計算されたプレステージポイント数（整数値）
 */
export function calculatePrestigePointsForLevel(
  level: number,
  startLevel: number,
  basePoints: number
): number {
  if (level < startLevel) return 0;

  // scalingPowerパラメータは互換性のために保持、実際の計算はPRESTIGE_CONFIGを使用
  const points =
    basePoints *
    Math.pow(
      PRESTIGE_CONFIG.SCALING_BASE,
      (level - startLevel) / PRESTIGE_CONFIG.SCALING_LEVEL_DIVISOR
    );
  return Math.round(points);
}

// === 新しいレベルシステム用計算関数 ===

/**
 * 自動ダイスの最大レベル計算
 * アセンションレベルに応じた自動ダイスの最大レベルを計算します。
 *
 * @param ascensionLevel 現在のアセンションレベル
 * @param baseMaxLevel 基本最大レベル
 * @param increment アセンションごとの最大レベル増加量
 * @returns 計算された最大レベル
 */
export function calculateMaxLevel(
  ascensionLevel: number,
  baseMaxLevel: number,
  increment: number
): number {
  return baseMaxLevel + ascensionLevel * increment;
}

/**
 * 自動ダイスレベルアップのコスト計算（累積レベルベース）
 * 累積投資レベルを考慮した公正なレベルアップコストを計算します。
 * 過去のアセンションでの投資も含めた総投資量に基づいてコストが決定されます。
 *
 * @param diceIndex ダイスのインデックス（0〜5: 4/6/8/10/12/20面ダイス）
 * @param currentLevel 現在のレベル
 * @param ascensionLevel 現在のアセンションレベル
 * @param baseCost 基本コスト
 * @param multiplier レベルごとのコスト倍率
 * @param ascensionCostMultiplier アセンションごとの基本コスト倍率
 * @returns 計算されたレベルアップコスト（整数値）
 */
export function calculateLevelUpCost(
  diceIndex: number,
  currentLevel: number,
  ascensionLevel: number,
  baseCost: number,
  multiplier: number,
  ascensionCostMultiplier: number
): number {
  // 基本コスト = ダイス種類別の基本コスト * アセンションレベルによる基本コスト倍率
  const baseForDice = baseCost * Math.pow(ascensionCostMultiplier, ascensionLevel);

  // ダイス種類別の基本コスト調整（高面数ダイスほど高コスト）
  const diceMultiplier = Math.pow(2, diceIndex);

  // 累積投資レベル計算（各アセンションの実際の最大レベルを考慮）
  let totalInvestedLevels = 0;

  // 過去のアセンションで投資したレベル数を累積
  for (let i = 0; i < ascensionLevel; i++) {
    const maxLevelForThisAscension = calculateMaxLevel(
      i,
      AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE,
      AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT
    );
    totalInvestedLevels += maxLevelForThisAscension;
  }

  // 現在のアセンションでのレベルを追加
  totalInvestedLevels += currentLevel;

  // 累積レベルによる乗数（現在レベルではなく総投資レベルを使用）
  const levelMultiplier = Math.pow(multiplier, totalInvestedLevels);

  return Math.floor(baseForDice * diceMultiplier * levelMultiplier);
}

/**
 * アセンションコスト計算
 * 自動ダイスのアセンションに必要なコストを計算します。
 * レベルアップコストにアセンションペナルティを適用した値になります。
 *
 * @param diceIndex ダイスのインデックス（0〜5: 4/6/8/10/12/20面ダイス）
 * @param currentLevel 現在のレベル
 * @param ascensionLevel 現在のアセンションレベル
 * @param baseCost 基本コスト
 * @param multiplier レベルごとのコスト倍率
 * @param ascensionCostMultiplier アセンションごとの基本コスト倍率
 * @param ascensionPenalty アセンションペナルティ倍率
 * @returns 計算されたアセンションコスト（整数値）
 */
export function calculateAscensionCost(
  diceIndex: number,
  currentLevel: number,
  ascensionLevel: number,
  baseCost: number,
  multiplier: number,
  ascensionCostMultiplier: number,
  ascensionPenalty: number
): number {
  const levelUpCost = calculateLevelUpCost(
    diceIndex,
    currentLevel,
    ascensionLevel,
    baseCost,
    multiplier,
    ascensionCostMultiplier
  );
  return Math.floor(levelUpCost * ascensionPenalty);
}

/**
 * 自動ダイスの速度計算（レベルベース）
 * ダイスレベルに応じた実行間隔を計算します。
 * レベルが高いほど間隔が短くなり（高速化）、レベル0では未解禁状態を表します。
 *
 * @param level ダイスのレベル（0=未解禁、1〜20=有効レベル）
 * @param baseInterval 基本実行間隔（ミリ秒）
 * @param maxSpeedMultiplier 最大速度倍率
 * @returns 計算された実行間隔（ミリ秒）
 */
export function calculateDiceSpeedFromLevel(
  level: number,
  baseInterval: number,
  maxSpeedMultiplier: number
): number {
  if (level === 0) return baseInterval; // 未解禁

  const speedMultiplier = 1.0 + maxSpeedMultiplier * ((level - 1.0) / 19.0);
  return baseInterval / speedMultiplier;
}

/**
 * 自動ダイスの個数計算（アセンションベース）
 * アセンションレベルに応じた自動ダイスの個数を計算します。
 * アセンションレベルが上がるほど同時実行できるダイス数が増加します。
 *
 * @param ascensionLevel 現在のアセンションレベル
 * @param baseCount 基本個数
 * @param multiplier アセンションごとの個数倍率
 * @returns 計算されたダイス個数
 */
export function calculateDiceCountFromAscension(
  ascensionLevel: number,
  baseCount: number,
  multiplier: number
): number {
  return baseCount * Math.pow(multiplier, ascensionLevel);
}

// === まとめ買い関連の計算関数 ===

/**
 * まとめ買い時の総コスト計算（アセンション境界考慮）
 * 指定された個数のレベルアップ・アセンションの総コストと実際の購入数を計算します。
 * アセンション境界を跨ぐ場合のコスト変動も正確に考慮します。
 *
 * @param diceIndex ダイスのインデックス（0〜5: 4/6/8/10/12/20面ダイス）
 * @param currentLevel 現在のレベル
 * @param ascensionLevel 現在のアセンションレベル
 * @param targetCount 購入したい個数
 * @param baseCost 基本コスト
 * @param multiplier レベルごとのコスト倍率
 * @param ascensionCostMultiplier アセンションごとの基本コスト倍率
 * @param ascensionPenalty アセンションペナルティ倍率
 * @returns 総コスト、実際の購入数、含まれるアセンション数のオブジェクト
 */
export function calculateBulkLevelUpCost(
  diceIndex: number,
  currentLevel: number,
  ascensionLevel: number,
  targetCount: number,
  baseCost: number,
  multiplier: number,
  ascensionCostMultiplier: number,
  ascensionPenalty: number
): {
  totalCost: number;
  actualCount: number;
  ascensionsIncluded: number;
} {
  let totalCost = 0;
  let actualCount = 0;
  let ascensionsIncluded = 0;
  let tempLevel = currentLevel;
  let tempAscension = ascensionLevel;

  for (let i = 0; i < targetCount; i++) {
    const maxLevel = calculateMaxLevel(
      tempAscension,
      AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE,
      AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT
    );

    if (tempLevel < maxLevel) {
      // 通常のレベルアップ
      const levelUpCost = calculateLevelUpCost(
        diceIndex,
        tempLevel,
        tempAscension,
        baseCost,
        multiplier,
        ascensionCostMultiplier
      );
      totalCost += levelUpCost;
      tempLevel++;
      actualCount++;
    } else {
      // アセンションが必要
      const ascensionCost = calculateAscensionCost(
        diceIndex,
        tempLevel,
        tempAscension,
        baseCost,
        multiplier,
        ascensionCostMultiplier,
        ascensionPenalty
      );
      totalCost += ascensionCost;
      tempLevel = 1; // アセンション後はレベル1
      tempAscension++;
      ascensionsIncluded++;
      actualCount++; // アセンションもカウントに含める
    }
  }

  return {
    totalCost,
    actualCount,
    ascensionsIncluded,
  };
}

/**
 * 指定したクレジット内で購入可能な最大個数を計算
 * 利用可能なクレジット内でレベルアップ・アセンション可能な最大回数を計算します。
 * アセンション境界を跨ぐ場合のコスト変動も考慮します。
 *
 * @param diceIndex ダイスのインデックス（0〜5: 4/6/8/10/12/20面ダイス）
 * @param currentLevel 現在のレベル
 * @param ascensionLevel 現在のアセンションレベル
 * @param availableCredits 利用可能なクレジット数
 * @param baseCost 基本コスト
 * @param multiplier レベルごとのコスト倍率
 * @param ascensionCostMultiplier アセンションごとの基本コスト倍率
 * @param ascensionPenalty アセンションペナルティ倍率
 * @returns 購入可能な最大個数
 */
export function calculateMaxPurchasableCount(
  diceIndex: number,
  currentLevel: number,
  ascensionLevel: number,
  availableCredits: number,
  baseCost: number,
  multiplier: number,
  ascensionCostMultiplier: number,
  ascensionPenalty: number
): number {
  let maxCount = 0;
  let totalCost = 0;
  let tempLevel = currentLevel;
  let tempAscension = ascensionLevel;

  // 最大1000回まで試行（無限ループ防止）
  for (let i = 0; i < 1000; i++) {
    const maxLevel = calculateMaxLevel(
      tempAscension,
      AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE,
      AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT
    );

    let nextCost = 0;
    if (tempLevel < maxLevel) {
      // 通常のレベルアップコスト
      nextCost = calculateLevelUpCost(
        diceIndex,
        tempLevel,
        tempAscension,
        baseCost,
        multiplier,
        ascensionCostMultiplier
      );
    } else {
      // アセンションコスト
      nextCost = calculateAscensionCost(
        diceIndex,
        tempLevel,
        tempAscension,
        baseCost,
        multiplier,
        ascensionCostMultiplier,
        ascensionPenalty
      );
    }

    if (totalCost + nextCost <= availableCredits) {
      totalCost += nextCost;
      maxCount++;

      if (tempLevel < maxLevel) {
        tempLevel++;
      } else {
        tempLevel = 1;
        tempAscension++;
      }
    } else {
      break;
    }
  }

  return maxCount;
}

/**
 * アセンション前で停止する最大購入可能個数を計算
 * 現在のアセンションレベル内でのみレベルアップ可能な最大回数を計算します。
 * アセンションは行わず、最大レベルに到達した時点で停止します。
 *
 * @param diceIndex ダイスのインデックス（0〜5: 4/6/8/10/12/20面ダイス）
 * @param currentLevel 現在のレベル
 * @param ascensionLevel 現在のアセンションレベル
 * @param availableCredits 利用可能なクレジット数
 * @param baseCost 基本コスト
 * @param multiplier レベルごとのコスト倍率
 * @param ascensionCostMultiplier アセンションごとの基本コスト倍率
 * @returns アセンション前までの購入可能な最大個数
 */
export function calculateMaxPurchasableCountNoAscension(
  diceIndex: number,
  currentLevel: number,
  ascensionLevel: number,
  availableCredits: number,
  baseCost: number,
  multiplier: number,
  ascensionCostMultiplier: number
): number {
  let maxCount = 0;
  let totalCost = 0;
  let tempLevel = currentLevel;

  const maxLevel = calculateMaxLevel(
    ascensionLevel,
    AUTO_DICE_LEVEL_CONFIG.MAX_LEVEL_BASE,
    AUTO_DICE_LEVEL_CONFIG.ASCENSION_LEVEL_INCREMENT
  );

  // 最大レベルに到達するまでの購入可能数を計算
  while (tempLevel < maxLevel && maxCount < 1000) {
    // 無限ループ防止
    const nextCost = calculateLevelUpCost(
      diceIndex,
      tempLevel,
      ascensionLevel,
      baseCost,
      multiplier,
      ascensionCostMultiplier
    );

    if (totalCost + nextCost <= availableCredits) {
      totalCost += nextCost;
      maxCount++;
      tempLevel++;
    } else {
      break;
    }
  }

  return maxCount;
}
