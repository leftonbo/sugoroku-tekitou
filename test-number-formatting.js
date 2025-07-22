// 英語略式命数法の動作テスト
import { formatNumberWithType } from './dist/utils/math-utils.js';

// テスト用のケース
const testCases = [
  999, // 基本数値
  1000, // 1K
  1500, // 1.5K
  999999, // 999.9K
  1000000, // 1M
  1e9, // 1B
  1e12, // 1T
  1e15, // 1Qa
  1e18, // 1Qi
  1e21, // 1Sx
  1e24, // 1Sp
  1e27, // 1Oc
  1e30, // 1No
  1e33, // 1Dc
  1e36, // 1UDc
  1e39, // 1DDc
  1e42, // 1TDc
  1e45, // 1QaDc
  1e48, // 1QiDc
  1e51, // 1SxDc
  1e54, // 1SpDc
  1e57, // 1OcDc
  1e60, // 1NoDc
  1e63, // 1DeDc
  1e66, // 1VgDc
  1e69, // 1UVgDc
  1e72, // 1DVgDc
  1e84, // 1TgDc
  1e90, // 1QaVgDc
  1e120, // 1Vg
  1e123, // 1UVg
  1e180, // 1Tg
  1e240, // 1Qg
  1e300, // 1CeDc
  1e1000, // 非常に大きな数値
  -1500, // 負の数値
  0, // ゼロ
];

console.log('=== 英語略式命数法の動作テスト ===');
testCases.forEach(num => {
  const formatted = formatNumberWithType(num, 'english');
  console.log(`${num.toExponential()} → ${formatted}`);
});
