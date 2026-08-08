# Vercel + Turso 公開手順

## 1. 公開前の確認

- GitHubリポジトリ名: `sassie`
- Tursoデータベース名: `sassie_DB`
- Tursoデータベースは東京（AWS `ap-northeast-1`）に配置する
- `.env.local`、`data/sassie.db`、`data/app-data.json`をGitHubへ公開しない

`data/app-data.json`は過去にGit管理されているため、公開前に次を一度実行します。ファイルはPCに残り、Gitの追跡だけが解除されます。

```powershell
git rm --cached data/app-data.json
```

## 2. Turso接続情報

`.env.example`をコピーして`.env.local`を作り、Tursoダッシュボードの値を設定します。

```env
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

トークンはデータベース用トークンを使用し、GitHub、画面、チャットへ貼り付けません。

## 3. 既存データの移行

ローカルの`data/sassie.db`から、ユーザー・投稿・リアクション・感情・権限をコピーします。

```powershell
npm run db:migrate:turso
```

同じIDのデータは上書きしないため、再実行できます。ログインセッションは安全のためコピーしないので、公開後は全員再ログインします。

## 4. Vercel設定

GitHubの`sassie`リポジトリをVercelへImportし、Environment VariablesのProductionとPreviewに次を登録します。

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

`vercel.json`により、Vercel Functionsは東京の`hnd1`で実行されます。

## 5. デプロイ後の確認

1. ログインできる
2. アカウントを切り替えられる
3. 投稿でき、再読み込み後も残る
4. 他人の投稿へリアクションできる
5. 自分の投稿にはリアクションできない
6. 管理者・システム管理者機能が動く
7. 再デプロイ後もデータが残る