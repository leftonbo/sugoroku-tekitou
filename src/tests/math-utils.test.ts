// 数値計算・フォーマット関連のテストファイル

import { formatNumberEnglish, generateAbbreviation } from '../utils/math-utils.js';

// === 英語略式命数法のテスト・検証用関数 ===

/**
 * 英語略式命数法の動作検証用関数
 * 開発・デバッグ用の関数で、各種数値の変換結果を確認できます。
 * 
 * @returns 検証結果のオブジェクト
 */
export function testEnglishNumberFormatting(): { [key: string]: string } {
    const testCases = [
        999,          // 基本数値
        1000,         // 1K
        1500,         // 1.5K
        999999,       // 999.9K
        1000000,      // 1M
        1e9,          // 1B
        1e12,         // 1T
        1e15,         // 1Qa
        1e18,         // 1Qi
        1e21,         // 1Sx
        1e24,         // 1Sp
        1e27,         // 1Oc
        1e30,         // 1No
        1e33,         // 1Dc
        1e36,         // 1UnDc
        1e39,         // 1DuDc
        1e42,         // 1TrDc
        1e45,         // 1QaDc
        1e48,         // 1QiDc
        1e51,         // 1SxDc
        1e54,         // 1SpDc
        1e57,         // 1OcDc
        1e60,         // 1NoDc
        1e63,         // 1DeDc
        1e66,         // 1Vg
        1e69,         // 1UnVg
        1e72,         // 1DuVg
        1e84,         //
        1e90,         //
        1e120,        //
        1e123,        //
        1e180,        //
        1e240,        //
        1e300,        // 1Ce
        1e1000,       // 非常に大きな数値
        -1500,        // 負の数値
        0,            // ゼロ
        Infinity,     // 無限大
        -Infinity,    // 負の無限大
        NaN           // NaN
    ];
    
    const results: { [key: string]: string } = {};
    
    testCases.forEach(num => {
        const formatted = formatNumberEnglish(num);
        results[num.toString()] = formatted;
    });
    
    return results;
}

/**
 * 略記生成の動作検証用関数
 * 指数から略記への変換結果を確認できます。
 * 
 * @returns 検証結果のオブジェクト
 */
export function testAbbreviationGeneration(): { [key: string]: string } {
    const testExponents = [
        3,    // K
        6,    // M
        9,    // B
        12,   // T
        15,   // Qa
        18,   // Qi
        21,   // Sx
        24,   // Sp
        27,   // Oc
        30,   // No
        33,   // Dc
        36,   // UDc
        39,   // DuDc
        42,   // TrDc
        45,   // QaDc
        48,   // QiDc
        51,   // SxDc
        54,   // SpDc
        57,   // OcDc
        60,   // NoDc
        63,   // DeDc
        66,   // Vg
        69,   // UnVg
        72,   // DuVg
        84,   //
        90,   //
        120,  //
        123,  //
        180,  //
        240,  //
        300,  // CeDc
        1000, // 非常に大きな指数
        -1,   // 負の指数（エラーケース）
        2.5,  // 非整数（エラーケース）
        Infinity, // 無限大（エラーケース）
        NaN   // NaN（エラーケース）
    ];
    
    const results: { [key: string]: string } = {};
    
    testExponents.forEach(exp => {
        const abbreviation = generateAbbreviation(exp);
        results[exp.toString()] = abbreviation;
    });
    
    return results;
}

/**
 * 後方互換性の検証用関数
 * 旧実装と新実装の結果を比較します。
 * 
 * @returns 比較結果のオブジェクト
 */
export function testBackwardCompatibility(): { [key: string]: { old: string, new: string, match: boolean } } {
    // 旧実装での期待値（1e48まで）
    const expectedResults: { [key: number]: string } = {
        1000: "1.0K",
        1500: "1.5K",
        1000000: "1.0M",
        1000000000: "1.0B",
        1e12: "1.0T",
        1e15: "1.0Qa",
        1e18: "1.0Qi",
        1e21: "1.0Sx",
        1e24: "1.0Sp",
        1e27: "1.0Oc",
        1e30: "1.0No",
        1e33: "1.0Dc",
        1e36: "1.0UDc",
        1e39: "1.0DDc",
        1e42: "1.0TDc",
        1e45: "1.0QaDc",
        1e48: "1.0QiDc"
    };
    
    const results: { [key: string]: { old: string, new: string, match: boolean } } = {};
    
    Object.entries(expectedResults).forEach(([numStr, expected]) => {
        const num = parseFloat(numStr);
        const newResult = formatNumberEnglish(num);
        const match = newResult === expected;
        
        results[numStr] = {
            old: expected,
            new: newResult,
            match
        };
    });
    
    return results;
}