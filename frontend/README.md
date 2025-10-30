# AWSハンズオン用 AI画面生成ツール（フロントエンド）

AIチャット形式のUIを使って画面デザイン案を生成するWebアプリケーションです。
画面の目的や仕様を入力すると、Amazon Bedrock（Claude）を使ってReactコンポーネントとCSSを自動生成します。

## システム構成

- **フロントエンド**: Next.js（S3静的ホスティング）
- **バックエンド**: AWS Lambda（Function URL使用）
- **AIサービス**: Amazon Bedrock

## 環境設定

### 1. 依存関係のインストール

```bash
cd frontend
npm install
```

### 2. 環境変数の設定

LambdaのFunction URLを設定するために、`.env.local`ファイルを作成してください：

```bash
# frontend/.env.local
NEXT_PUBLIC_LAMBDA_URL=https://your-lambda-function-url.amazonaws.com
```

**Lambda URLの取得方法:**
1. SAMでバックエンドをデプロイ
2. AWSマネジメントコンソールからLambda関数を選択
3. 「Configuration」タブ → 「Function URL」を確認
4. URLを上記の環境変数に設定

## 開発サーバーの起動

```bash
cd frontend
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## ビルドとデプロイ

### ローカルビルド

```bash
cd frontend
npm run build
```

ビルド結果は `out/` ディレクトリに出力されます。

### S3へのデプロイ

```bash
# AWS CLIがインストールされている前提
aws s3 sync out/ s3://your-bucket-name --delete

# S3バケットを静的ウェブサイトホスティングとして設定
aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html
```

## 使用方法

1. **画面の目的や仕様**を入力
2. **必要な画面項目**を入力
3. **デザインのリクエスト**を入力
4. **「AIで画面生成」ボタン**をクリック
5. AIが生成したReactコードとCSSが表示されます
6. **プレビュー**で実際の画面を確認できます

## 注意事項

- 環境変数 `NEXT_PUBLIC_LAMBDA_URL` が設定されていない場合、エラーメッセージが表示されます
- CORSエラーが発生した場合は、LambdaのFunction URL設定を確認してください
- ビルド時に環境変数が存在しないと、Lambda URLが未定義になります

## CORSエラーの解決方法

ローカル開発時にCORSエラーが発生する場合：

### 方法1: ブラウザ拡張機能を使用（推奨）
1. Chrome拡張機能「CORS Unblock」または「Allow CORS」をインストール
2. 拡張機能を有効にしてページをリロード
3. 開発時のみ使用し、本番では無効化

### 方法2: LambdaのCORS設定を確認
Lambda Function URLのCORS設定が正しいことを確認：
- Allow Origins: `*`
- Allow Methods: `POST`, `OPTIONS`
- Allow Headers: `Content-Type`

### 方法3: プロキシサーバーを使用
別途プロキシサーバーを立ててCORSを回避
