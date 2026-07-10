メイン

コンテンツへ
Gmail でのスクリーン リーダーの使用

1 / 881
Sassie（web）のたたき台をAntigravityに作らせる
受信トレイ

Maki OKUMURA
添付ファイル
9:15 (12 時間前)
To 自分

STEP0として、プロジェクト一式をGitHubに置いてからAntigravityへ渡す

例えば、

AI_README.md

/docs
  01_concept.md
  02_ui.md
  03_data.md
  04_tasks.md
  design_manifesto.md
　development_rules.md


/mockups
  01_timeline.png
01_timeline.png

  02_create.png
02_create.png
  03_detail.png
03_detail.png
  04_detail_scroll.png
04_detail_scroll.png
という構成にしておくと、Antigravityは「単発の画像生成」ではなく、「既存プロジェクトに参加した開発メンバー」として振る舞いやすくなる。

このプロジェクトは世界観が命だから、コードを書く前に世界観を共有する時間を惜しまない方が、結果的に完成まで早くたどり着けると思うよ。

Step0　GitHubリポジトリとともに「 AI_README.md」を読ませる

STEP1　プロジェクトを理解させる（画像はまだ送らない）
まずは画像なし。

あなたはこのプロジェクトのフロントエンドエンジニアです。

まずコードは書かず、このアプリの思想を理解してください。

# プロジェクト名

Sassie（仮）

# コンセプト

Sassieは「伝える」ためのSNSではありません。

「受け取ること」を主役にしたコミュニケーションアプリです。

投稿内容は表示されません。

表示されるのは

・□□□□□□
・35文字
・送信されませんでした
・4回書き直しました
・送信までに2分14秒かかりました
・最後の入力から26秒、画面は静かでした

などの「痕跡」だけです。

受け取る人は、その痕跡から自由に想像します。

AIも感情を解釈しません。

答えを出さないことが、このアプリの価値です。

# デザイン方針

・SNSらしくしない
・情報を増やさない
・余白を大切にする
・静かなUI
・白を恐れない
・説明しすぎない

# やってはいけないこと

・いいね
・コメント
・フォロー
・DM
・通知
・派手な色
・派手なアニメーション

まずはこの思想を理解し、

・理解した内容
・UI実装時に気を付ける点

だけをまとめてください。

コードはまだ書かないでください。
STEP2　ここで初めて画像を送る
ここでAI実装用UIモックを添付。

プロンプトはこれ。

ChatGPT Image 2026年7月10日 08_51_49.png
添付した画像はUIデザイン案です。

この画像は

「4つの独立した画面」

を横に並べた一覧です。

1枚の画面ではありません。

左から順番に

01 タイムライン

02 投稿画面

03 投稿詳細（通常表示）

04 投稿詳細（スクロール後）

です。

画像内の番号やタイトルは説明用です。

実装対象ではありません。

実装するのはスマートフォン画面部分だけです。

まずは画像を分析し、

・各画面の役割
・デザインの特徴
・共通コンポーネント

を整理してください。

コードはまだ書かないでください。
STEP3　技術スタックを伝える
採用する技術スタックです。

・Next.js（App Router）
・TypeScript
・Tailwind CSS
・shadcn/ui
・Framer Motion
・Supabase

設計方針

・Atomic Designは採用しません
・初心者でも理解できるコード
・過度な抽象化は禁止
・保守しやすさ重視

推奨ディレクトリ構成だけ提案してください。

コードは不要です。
STEP4　実装ルールを決める
これが結構重要。

今後の実装ルールです。

・1回の指示につき1画面だけ実装してください。

・他画面は変更しないでください。

・勝手に新しい機能を追加しないでください。

・迷ったらUIも機能も削ってください。

・画像の再現を最優先してください。

・実装後は

①変更したファイル

②実装内容

③改善案

だけを書いて終了してください。
STEP5　Landingだけ作る
Landingだけは画像が無いので文章で。

まずLanding画面だけ実装してください。

内容

Sassie

Still Here（仮）

「言葉にならなかった気持ちにも、
居場所がある。」

「体験する」ボタン

背景は白

中央寄せ

余白を大きく

フェードインのみ

他画面には触らないでください。
STEP6　Timeline
01 タイムライン画面だけ実装してください。

添付画像の01を忠実に再現してください。

ダミーデータで構いません。

Supabaseには接続しません。

レスポンシブ対応してください。

他画面には触らないでください。
以降は

投稿画面
投稿詳細
投稿詳細（スクロール後）
を1画面ずつ。

毎回最後に付ける一文
これ絶対効く（笑）

画像を参考にしてください。

デザインを改善しようとしないでください。

まずは忠実に再現してください。

迷ったら新しい要素を追加するのではなく削ってください。
そして一番最後に、Antigravityに「役割」を固定する
実はこれが一番大事かもしれない。

このプロジェクトにおけるあなたの役割は

「UIデザイナー」

ではありません。

「デザインを忠実にReactへ落とし込むフロントエンドエンジニア」

です。

デザインの判断は人間が行います。

あなたはその意図を正確に再現してください。

 7 個の添付ファイル
  •  Gmail によってスキャン済み
# Development Tasks

## Phase 1

- Project setup

- Next.js

- Tailwind

- shadcn/ui

- Framer Motion

- Supabase

---

## Phase 2

Landing page

Timeline page

Create page

Detail page

---

## Phase 3

Authentication

Groups

Database

Realtime updates

---

## Phase 4

Writing traces

Rewrite count

Delete count

Typing duration

Silent duration

---

## Phase 5

Animations

Responsive adjustments

Accessibility

Deployment
04_tasks.md
02_ui.md を表示しています。
