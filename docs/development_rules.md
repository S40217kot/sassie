
# Sassie Development Rules

## 1. 基本技術

- Next.js
- App Router
- TypeScript
- React
- Tailwind CSS
- Vercel

MVPでは次を使用しません。

- Firebase
- Supabase
- 外部データベース
- AI API
- 認証
- Server Actionによる投稿処理
- Route Handlerによる本文処理

## 2. TypeScript

- `strict`を有効にする
- `any`を原則使用しない
- 外部入力は型を信用せず検証する
- Union Typeを優先する
- Domain型を明示する
- UIコンポーネント内にデータ変換ロジックを詰め込まない

禁止：

```ts
const data: any = {};
```

例外的に使用する場合は、理由をコメントで残します。

## 3. 推奨ディレクトリ構成

```text
src/
  app/
    page.tsx
    compose/
      page.tsx
    posts/
      [id]/
        page.tsx

  components/
    layout/
    ui/

  features/
    timeline/
    compose/
    post-detail/
    reactions/

  domain/
    post/
    reaction/
    compose/

  repositories/
    post-repository.ts
    local-post-repository.ts

  lib/
    storage/
    validation/
    text/

  styles/
```

## 4. Client Component

`"use client"`は必要なファイルにだけ付けてください。

Client Componentが必要な例：

- テキスト入力
- localStorageアクセス
- 余韻リアクション操作
- アニメーション
- ブラウザAPI

静的な表示コンポーネントまで無条件にClient Componentへしないでください。

## 5. 本文の取り扱い

最重要ルールです。

投稿本文は、Compose画面の入力中だけ存在できます。

本文を次の場所へ保存してはいけません。

- localStorage
- sessionStorage
- IndexedDB
- Cookie
- URL
- Zustand
- Redux
- React Contextの永続状態
- Repository
- Postモデル
- API
- データベース
- Server Action
- Route Handler
- ログ
- Analytics
- Error Tracking

本文を次の形式で保持する型を作ってはいけません。

```ts
type Post = {
  originalText: string;
};
```

```ts
type Draft = {
  text: string;
};
```

## 6. Compose入力

本文は、Composeコンポーネント内のローカルstateまたはtextareaの値としてのみ扱います。

「手放す」操作時の順番：

1. 本文から文字数を算出
2. ComposeMetricsを確定
3. Postを生成
4. 本文stateを空文字へ変更
5. textareaをクリア
6. 完了表示へ移行
7. PostだけをRepositoryへ保存

Post生成関数は本文文字列を受け取らない設計を優先します。

推奨：

```ts
createPostFromMetrics(metrics: ComposeMetrics): Post
```

避ける：

```ts
createPost(text: string): Post
```

どうしても文字数算出のために本文を受け取る場合、その関数内で保持せず即座に数値化します。

## 7. ログ出力

本文をログへ出してはいけません。

禁止：

```ts
console.log(text);
console.debug(text);
console.error(text);
```

許可：

```ts
console.log({
  originalLength,
  rewriteCount,
  typingDurationMs,
});
```

本番コードでは不要なconsole出力を残さないでください。

## 8. エラー処理

- localStorageが使用できなくてもアプリ全体を停止させない
- JSONが壊れていても安全に初期状態へ戻す
- 不正なPostを表示しない
- UIに技術的なスタックトレースを表示しない
- エラー時にも本文をログへ出さない

## 9. Repository

UIからlocalStorageを直接操作しないでください。

Repositoryを経由します。

```ts
export interface PostRepository {
  getPosts(): Post[];
  getPostById(id: string): Post | null;
  addPost(post: Post): void;
  toggleReaction(
    postId: string,
    reaction: ReactionType
  ): void;
}
```

将来バックエンドへ移行しやすい構造にします。

ただし、MVP段階で過剰な抽象化はしません。

## 10. React State

- 入力中本文はCompose画面だけに置く
- 投稿一覧はRepository経由で取得する
- Derived Stateを重複保存しない
- 痕跡文はPostから都度生成する
- マスク文字列は決めた方針に従い生成する
- 選択済み余韻は投稿IDごとのSetとして扱う

## 11. 余韻リアクション

仕様：

- 1投稿に複数種類を置ける
- 同じ種類は同じ端末から1回まで
- 再タップで取り消す
- カウントは0未満にしない

推奨状態：

```ts
Record<string, Set<ReactionType>>
```

localStorageへ保存するときは配列へ変換します。

```ts
Record<string, ReactionType[]>
```

「いいね」という文言を使用しないでください。

## 12. アイコン

Webで安定して表示できるSVGアイコンを使います。

推奨：

```text
lucide-react
```

絵文字を操作アイコンとして使用しないでください。

アイコンには次を付けます。

- `aria-label`
- 選択時の`aria-pressed`
- キーボードフォーカス
- 最低限のタップ領域

## 13. CSS・Tailwind

- 余白を優先する
- 色数を増やさない
- arbitrary valueを乱用しない
- 同じ値はトークン化する
- 大きな影を使わない
- 過剰な角丸を使わない
- animationを増やしすぎない
- モバイルファーストで書く
- hoverだけに情報を依存させない

## 14. アニメーション

使用可能：

- opacity
- 小さなtranslate
- 控えめなbackground transition

避ける：

- bounce
- pulse
- 大きなscale
- confetti
- 派手なspring

`prefers-reduced-motion`を尊重します。

## 15. アクセシビリティ

- セマンティックHTMLを使う
- `button`をdivで代用しない
- フォーカスリングを消さない
- アイコンにラベルを付ける
- 選択状態を色だけで表さない
- コントラストを確保する
- textareaにlabelを付ける
- エラーをテキストでも表示する
- キーボードだけで操作できるようにする

## 16. UI文言

使用する文言：

- 手放す
- 送信されませんでした
- この投稿に残っていた痕跡
- 余韻
- 余韻はまだありません
- 言葉は残さず、痕跡だけを残します

避ける文言：

- 投稿する
- 公開する
- 拡散する
- いいね
- 人気
- バズ
- 閲覧数
- 反応がありません
- 誰も見ていません
- AIが見つけた痕跡

## 17. 痕跡文

痕跡文は、行動ログからルールベースで生成します。

感情、性格、意図、心理状態を推定してはいけません。

許可：

```text
何度も言葉を選び直しました
途中で一度、すべて消しました
最後の入力から26秒間、画面は静かでした
```

禁止：

```text
悲しかったようです
怒っていたようです
助けを求めています
本当は伝えたかったようです
```

## 18. 外部ライブラリ

新しい依存関係を追加する前に確認します。

追加してよい可能性が高いもの：

- アイコン
- テスト
- アクセシビリティ補助
- データ検証

追加しないもの：

- 大規模な状態管理
- UIコンポーネント一式
- SNS機能パッケージ
- Analytics
- Session Replay
- AI SDK

既存機能で十分な場合は追加しません。

## 19. テスト

最低限テストするもの：

- マスク生成
- 痕跡文生成
- 入力ログ
- 全消し判定
- 書き直し回数
- 余韻の追加
- 余韻の取り消し
- 複数余韻
- カウント下限
- 本文非表示
- 本文非保存

テストコードにも実在しそうなセンシティブな本文を入れないでください。

ダミー文字列を使用します。

```ts
"テスト用の入力"
```

## 20. 実行コマンド

変更後は、利用可能な範囲で次を実行します。

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

スクリプトが存在しない場合は、勝手に成功扱いせず報告してください。

## 21. Vercel

- Production Buildが成功することを確認する
- Clientへ秘密情報を露出しない
- `NEXT_PUBLIC_`へ秘密鍵を置かない
- 本文をServer Functionへ送らない
- Preview Deploymentでも本文非保存を維持する
- エラーログへ本文を送らない

## 22. Git

- `.env.local`をCommitしない
- ビルド生成物をCommitしない
- 意味のない大量フォーマット変更を避ける
- 1つの変更目的に関係するファイルだけを変更する
- 既存の未コミット変更を勝手に破棄しない
- `git reset --hard`を勝手に実行しない

## 23. AIエージェント向け禁止事項

AIエージェントは、明示的な指示なしに次を行ってはいけません。

- 新規機能追加
- データモデルの本文フィールド追加
- バックエンド導入
- 認証導入
- Analytics導入
- AI機能導入
- UIテーマの全面変更
- 普通のSNS風への変更
- コメント機能追加
- いいね機能追加
- フォロー機能追加
- 既存ファイルの大量削除
- プロジェクト外ファイルの編集

## 24. 完了報告

実装後は次を報告してください。

1. 変更したファイル
2. 変更理由
3. 実装した挙動
4. 実行したコマンド
5. コマンド結果
6. 本文非保存が維持されていること
7. 未確認事項
8. 次に必要な作業

## 最終判断基準

実装が正しいか迷った場合は、次の問いを使います。

> この変更は、受け取る人が少し立ち止まる体験を守っているか。

> この変更は、本文を守っているか。

> この変更は、普通のSNSに近づいていないか。

> この変更は、余白を減らしていないか。
