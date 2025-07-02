# GitHub Copilot 指示書

これはすごろくテーマのインクリメンタル・放置ブラウザゲームです。GitHub Copilotでコード生成・補完を行う際は、以下の指針に従ってください。

## プロジェクト概要

TypeScriptベースのブラウザゲームで、プレイヤーはサイコロを振って100マスの盤面を進み、クレジットを獲得してアップグレードを購入し、効率化を図ります。

## コーディング規約

### 言語とスタイル
- **TypeScript**: ES6+ Modules使用
- **日本語コメント**: すべてのコメントは日本語で記述
- **型安全性**: 厳密な型定義、null安全性を重視
- **関数型プログラミング**: 可能な限り純粋関数を使用

### 命名規則
- **関数**: camelCase
- **クラス**: PascalCase
- **定数**: UPPER_SNAKE_CASE
- **ファイル**: kebab-case
- **型**: PascalCase (interface/type)

### アーキテクチャ
- **モジュラー設計**: 関心の分離を重視
- **システム分割**: Core/Systems/Data/UI/Utils層に分離
- **部分更新**: DOM操作は最小限に、既存要素の更新を優先

## ディレクトリ構造

```
src/
├── core/          # ゲームループ、メインクラス
├── systems/       # ゲームシステム（ダイス、盤面、アップグレード等）
├── data/          # データ管理（状態、保存）
├── ui/            # UI管理、アニメーション
├── utils/         # ユーティリティ、定数
└── types/         # 型定義
```

## 重要なシステム

### XorShift128乱数システム
- 高品質疑似乱数生成器を使用
- 独立したシードで異なる乱数ストリームを管理
- `src/utils/xorshift-random.ts`を参照

### 累積コストシステム
- アセンション累積投資を考慮した価格計算
- `calculateCumulativeCost()`関数を使用

### ボーナスマスシステム
- 1%確率でボーナスクレジットマス生成
- 状態管理と差分保存による効率化

## コード生成時の注意点

### 型定義
```typescript
// 良い例: 明確な型定義
interface DiceConfig {
    sides: number;
    speed: number;
    unlockCost: number;
}

// 悪い例: any型の使用
let config: any = { ... };
```

### null安全性
```typescript
// 良い例: optional chaining
const value = gameState.autoDice?.[index]?.level ?? 0;

// 悪い例: null/undefinedチェック不備
const value = gameState.autoDice[index].level;
```

### UI更新
```typescript
// 良い例: 部分更新
updateExistingAutoDice();

// 悪い例: 全体再生成
regenerateAllUI();
```

### 乱数生成
```typescript
// 良い例: XorShift128使用
const random = gameRng.next();

// 悪い例: Math.random()使用
const random = Math.random();
```

## パフォーマンス考慮

- **DOM操作最小化**: HTML再生成を避ける
- **メモリ効率**: 差分保存、イベントリスナークリーンアップ
- **バッチ処理**: 複数の状態変更をまとめて処理
- **型最適化**: 適切な型定義でパフォーマンス向上

## デバッグ支援

- **TypeScriptコンパイル**: `npm run build`で型チェック
- **デバッグパネル**: localhost環境または`?debug=true`で有効化
- **コンソールログ**: 重要な処理にはデバッグログ追加
- **エラーハンドリング**: try-catch文で適切なエラー処理

## 拡張時の考慮点

1. **型定義更新**: 新機能追加時は対応する型定義を必ず追加
2. **後方互換性**: `gameState`への新プロパティ追加時は`mergeGameState()`で対応
3. **システム拡張**: 既存Systemクラスの拡張または新規System作成
4. **状態保存**: 新しい状態は差分保存を考慮

## Bootstrap 5.3対応

- レスポンシブデザイン
- カスタムCSS併用
- アクセシビリティ考慮

GitHub Copilotはこれらの指針に従って、型安全で保守性の高いコードを生成してください。