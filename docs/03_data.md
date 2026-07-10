
# Sassie Data Specification

## 基本方針

Sassieでは、投稿本文を保存しません。

保存するのは、本文から算出した入力の痕跡だけです。

投稿本文は、Compose画面内の一時的な入力状態としてのみ存在します。

## MVPの保存方式

MVPではバックエンドを使用しません。

保存先：

- 投稿データ：localStorage
- 自分が置いた余韻：localStorage
- 投稿本文：保存禁止

MVPのlocalStorageは、デモとUI検証のためのものです。

将来バックエンドへ移行しても、本文非保存の原則を維持します。

## Post

```ts
export type Post = {
  id: string;
  maskedText: string;
  originalLength: number;
  rewriteCount: number;
  deletedCharacterCount: number;
  typingDurationMs: number;
  lastPauseMs: number;
  clearedAll: boolean;
  createdAt: string;
  reactions: ReactionCounts;
};
```

### `id`

投稿を識別するIDです。

`crypto.randomUUID()`の使用を推奨します。

### `maskedText`

UIへ表示するマスク文字列です。

```text
□□□□□□□□□□□□
```

本文の文字数が多くても、マスク文字列は一定数で打ち切ります。

推奨最大表示数：

```ts
24
```

正確な文字数は`originalLength`で表示します。

### `originalLength`

手放された本文の文字数です。

日本語や絵文字を正しく数えるため、単純な`string.length`だけに依存しないでください。

推奨：

```ts
Array.from(text).length
```

必要に応じて`Intl.Segmenter`を使用します。

### `rewriteCount`

削除後に再入力したまとまりの回数です。

単純なBackspace回数ではありません。

連続削除を1つの削除まとまりとして扱い、その後再入力が行われた場合に1回と数えます。

### `deletedCharacterCount`

入力中に削除された文字数の累計です。

### `typingDurationMs`

最初の入力から「手放す」操作までの時間です。

### `lastPauseMs`

最後の入力変更から「手放す」操作までの時間です。

### `clearedAll`

一度1文字以上入力した後、入力欄を空にしたことがあるかを表します。

### `createdAt`

ISO 8601形式の日時です。

```ts
new Date().toISOString()
```

### `reactions`

余韻ごとの現在数です。

## ReactionType

```ts
export type ReactionType =
  | "moon"
  | "coffee"
  | "sprout"
  | "book"
  | "candle";
```

## ReactionCounts

```ts
export type ReactionCounts = Record<ReactionType, number>;
```

初期値：

```ts
export const emptyReactionCounts: ReactionCounts = {
  moon: 0,
  coffee: 0,
  sprout: 0,
  book: 0,
  candle: 0,
};
```

## DeviceReactionState

MVPでは認証がないため、同じブラウザ内での選択状態だけを管理します。

```ts
export type DeviceReactionState = Record<
  string,
  ReactionType[]
>;
```

キーは`postId`です。

値は、その端末が置いている余韻の配列です。

例：

```json
{
  "post-1": ["moon", "coffee"],
  "post-2": ["book"]
}
```

## 余韻の仕様

1つの投稿に複数種類の余韻を置けます。

ただし、同じ端末から同じ種類の余韻は1回までです。

### 未選択の余韻を押す

```text
選択状態へ追加
カウント +1
```

### 選択済みの余韻を押す

```text
選択状態から削除
カウント -1
```

カウントは0未満にしません。

```ts
Math.max(0, currentCount - 1)
```

## ComposeMetrics

入力中だけ存在する一時データです。

```ts
export type ComposeMetrics = {
  startedAt: number | null;
  lastInputAt: number | null;
  submittedAt: number | null;
  currentLength: number;
  finalLength: number;
  deletedCharacterCount: number;
  rewriteCount: number;
  clearedAll: boolean;
};
```

このオブジェクトにも本文を含めません。

禁止：

```ts
type ComposeMetrics = {
  originalText: string;
};
```

## ComposeTrackerの一時状態

書き直し判定のため、次の状態を内部で持つことは可能です。

```ts
type ComposeTrackerInternalState = {
  previousLength: number;
  isDeleting: boolean;
  deletionWasDetected: boolean;
};
```

本文そのものを内部フィールドに保持しないでください。

入力変更時の本文は、関数引数として一時的に受け取るだけにします。

```ts
recordChange(text: string): void
```

関数内では次の処理だけを行います。

1. 文字数を算出
2. 前回文字数との差分を算出
3. ログを更新
4. 本文を保持せず関数を終了

## 痕跡文

痕跡文そのものは保存せず、Postの数値データから表示時に生成します。

理由：

- 文言を後から改善できる
- データ構造を変えずに表現を調整できる
- 感情推定表現が保存されるのを防げる
- 多言語対応しやすい

### 生成例

```ts
rewriteCount >= 3
```

```text
何度も言葉を選び直しました
```

```ts
rewriteCount === 1
```

```text
一度、言葉を選び直しました
```

```ts
rewriteCount === 2
```

```text
2回、言葉を選び直しました
```

```ts
clearedAll === true
```

```text
途中で一度、すべて消しました
```

```ts
lastPauseMs >= 20_000
```

```text
最後の入力から26秒間、画面は静かでした
```

```ts
typingDurationMs >= 120_000
```

```text
手放すまで少し時間がかかりました
```

```ts
deletedCharacterCount >= 10
```

```text
18文字ぶん、送られずに消えました
```

## 痕跡文で禁止する表現

- 悲しかったようです
- 怒っていたようです
- 寂しかったようです
- 本当は伝えたかったようです
- 助けを求めています
- 好きだったようです
- 嫌いだったようです
- 深刻な状態です
- 短い時間で書かれました

Sassieは、感情や意図を推測しません。

## localStorageキー

推奨：

```ts
const STORAGE_KEYS = {
  posts: "sassie.posts.v1",
  deviceReactions: "sassie.deviceReactions.v1",
};
```

投稿本文に関するキーを作らないでください。

禁止例：

```ts
"sassie.drafts"
"sassie.originalTexts"
"sassie.composeText"
```

## localStorage読み込み時の安全性

- JSON.parseの失敗を処理する
- 不正な型をそのまま信用しない
- 古いバージョンを安全に無視する
- 投稿が壊れていてもアプリ全体を停止させない
- 数値は0以上へ正規化する
- 日付が不正なら除外する

## 将来のバックエンド移行

将来的にグループ共有を実装する場合、次のような構成を想定します。

```text
groups
posts
reactions
members
```

ただし、バックエンドAPIは投稿本文を受け取ってはいけません。

クライアント側で痕跡へ変換してから、Postデータだけを送ります。

### 将来の投稿API例

```ts
type CreatePostPayload = {
  groupId: string;
  maskedText: string;
  originalLength: number;
  rewriteCount: number;
  deletedCharacterCount: number;
  typingDurationMs: number;
  lastPauseMs: number;
  clearedAll: boolean;
};
```

禁止：

```ts
type CreatePostPayload = {
  originalText: string;
};
```

## プライバシー要件

本文を次の場所へ送らないでください。

- Vercel Server Functions
- Server Actions
- Route Handlers
- 外部API
- Analytics
- Error Tracking
- Session Replay
- コンソールログ
- ネットワークリクエスト
- URL
- Cookie

Compose画面にAnalyticsやSession Replayを導入する場合は、入力欄を必ずマスク対象にします。

MVPでは、Compose画面の入力内容に関するAnalyticsを実装しません。
