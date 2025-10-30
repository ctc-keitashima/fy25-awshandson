# AWSハンズオン: AI画面生成ツール

このプロジェクトは、AWSの主要サービスを使用したAIチャット形式の画面生成ツールです。
参加者が各自のAWS環境でLambdaとS3をデプロイし、フロントエンドからAI（Bedrock）経由で画面デザインを生成することができます。

## アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   AWS Lambda    │    │  Amazon Bedrock │
│   (Next.js)     │───▶│   (Function     │───▶│   (Claude AI)   │
│   S3 Hosting    │    │    URL)         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## プロジェクト構成

```
fy25-awshandson-sandbox/
├── frontend/          # Next.js フロントエンド
├── backend/           # AWS Lambda バックエンド
├── CLAUDE.md          # プロジェクト仕様
└── README.md          # このファイル
```

## ハンズオン手順

### ステップ1: バックエンドのデプロイ（Lambda）

```bash
cd backend

# 依存関係のインストール
npm install

# SAMテンプレートのビルド
sam build

# AWS環境へのデプロイ
sam deploy --guided --profile xxx
```

デプロイ完了後、LambdaのFunction URLをメモしておいてください。

### ステップ2: フロントエンドの環境設定

```bash
cd frontend

# 依存関係のインストール
npm install

# 環境変数ファイルの作成
cp .env.example .env

# LambdaのFunction URLを設定
# .env を編集して以下のように設定
NEXT_PUBLIC_LAMBDA_URL=https://your-lambda-function-url.amazonaws.com
```

### ステップ3: フロントエンドのビルドとデプロイ

```bash
cd frontend

# ビルド（環境変数がバンドルに埋め込まれる）
npm run build

# S3バケットへのデプロイ
aws s3 sync out/ s3://your-s3-bucket-name --delete

# S3バケットを静的ウェブサイトホスティングとして設定
aws s3 website s3://your-s3-bucket-name --index-document index.html
```

### ステップ4: 動作確認

1. S3のウェブサイトURLにアクセス
2. 画面の目的、項目、デザインリクエストを入力
3. 「AIで画面生成」ボタンをクリック
4. AIが生成したReactコードとCSSが表示されることを確認

## 技術仕様

### フロントエンド（Next.js）
- **フレームワーク**: Next.js 15.5.2
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **デプロイ**: S3 静的ホスティング
- **特徴**: 静的エクスポート対応、環境変数埋め込み

### バックエンド（AWS Lambda）
- **ランタイム**: Node.js 20.x
- **API**: Function URL（公開アクセス）
- **AIサービス**: Amazon Bedrock (Claude 3.5 Haiku)
- **CORS**: 対応済み

### AI機能
- **モデル**: anthropic.claude-3-5-haiku
- **機能**: Reactコンポーネント自動生成
- **出力**: JSXコード + CSSスタイルシート

## 参加者ごとのカスタマイズ

各参加者は以下の点をカスタマイズできます：

1. **Lambda URL**: `.env` で各自のLambda Function URLを設定
2. **S3バケット**: 各自のS3バケットにデプロイ
3. **Bedrockモデル**: `template.yaml` の `BEDROCK_MODEL_ID` を変更
4. **UIデザイン**: `frontend/src/app/page.tsx` をカスタマイズ

## トラブルシューティング

### Lambda URLが設定されていない場合
```
Lambda URLが設定されていません。frontend/.envファイルにNEXT_PUBLIC_LAMBDA_URLを設定してください。
```

**解決方法**: `.env` ファイルを作成し、LambdaのFunction URLを設定してください。

### CORSエラーが発生する場合
LambdaのFunction URL設定でCORSが正しく設定されているか確認してください。

### ビルド時に環境変数が反映されない場合
`.env` ファイルがビルド時に存在することを確認してください。

## 詳細ドキュメント

- [フロントエンド詳細](./frontend/README.md)
- [バックエンド詳細](./backend/README.md)
- [プロジェクト仕様](./CLAUDE.md)

## ライセンス

このプロジェクトはAWSハンズオン用サンプルアプリケーションです。
