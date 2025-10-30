# SAMの実行方法

## 概要

このディレクトリにはAWS SAM (Serverless Application Model) を使用してBedrock APIと連携するLambda関数をデプロイするための設定ファイルが含まれています。

## 前提条件

### 1. SAM CLIのインストール
```bash
# macOS (Homebrew)
brew install aws-sam-cli

# Windows (Chocolatey)
choco install aws-sam-cli

# その他
# https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html
```

### 2. AWS CLI設定
```bash
aws configure
# またはプロファイルを使用する場合
aws configure --profile your-profile-name
```

### 3. 依存関係のインストール
```bash
cd lambda
npm install
```

## ディレクトリ構造

```
backend/
├── template.yaml          # SAMテンプレート
├── lambda/
│   ├── index.ts          # Lambda関数本体
│   ├── package.json      # 依存関係
│   ├── tsconfig.json     # TypeScript設定
│   └── .env              # ローカル環境変数
└── README.md             # このファイル
```

## 実行手順

### 1. ローカルテスト（推奨）

#### Lambda関数単体のテスト
```bash
cd lambda

# ビルドしてからテスト
npm run test:build

# または環境変数を指定してテスト
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0 npm run test:build
```

#### SAM CLIを使用したテスト
```bash
# 現在のディレクトリ: backend/

# 関数をビルド
sam build

# ローカルで関数を実行（イベントファイル使用）
sam local invoke BedrockUIGeneratorFunction --event test-event.json

# またはプロファイル指定
sam local invoke BedrockUIGeneratorFunction --event test-event.json --profile xxx
```

### 2. デプロイ

#### 初回デプロイ
```bash
# 現在のディレクトリ: backend/

# ビルド
sam build

# デプロイ（対話式）
sam deploy --guided --profile xxx

# プロンプトに答えて設定を完了
```

#### 2回目以降のデプロイ
```bash
# ビルドしてデプロイ
sam build && sam deploy --profile xxx
```

### 3. 環境変数の設定

#### デプロイスクリプト使用
```bash
# モデルIDを指定してデプロイ
sam deploy --parameter-overrides BedrockModelId=anthropic.claude-3-sonnet-20240229-v1:0

# 複数パラメータ
sam deploy --parameter-overrides BedrockModelId=anthropic.claude-3-haiku-20240307-v1:0 AwsRegion=us-west-2
```

#### samconfig.tomlファイル使用
```toml
# samconfig.toml
version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
parameter_overrides = "BedrockModelId=anthropic.claude-3-haiku-20240307-v1:0"
```

## 設定パラメータ

### 環境変数

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `BEDROCK_MODEL_ID` | 使用するBedrockモデルID | `anthropic.claude-3-sonnet-20240229-v1:0` |
| `AWS_REGION` | AWSリージョン | `us-east-1` |


## トラブルシューティング

### 1. ビルドエラー
```bash
# キャッシュクリア
sam build --no-cached

# 詳細ログ
sam build --debug
```

### 2. デプロイエラー
```bash
# スタック削除してから再デプロイ
aws cloudformation delete-stack --stack-name your-stack-name
sam deploy --guided
```

### 3. 権限エラー
```bash
# Bedrockアクセス権限を確認
aws iam list-attached-user-policies --user-name your-user-name
```

### 4. Function URLが動作しない
```bash
# Function URLを確認
aws lambda get-function-url-config --function-name your-function-name

# CORS設定を確認
aws lambda get-function-url-config --function-name your-function-name --query Cors
```

## ログ確認

### CloudWatch Logs
```bash
# 最新のログストリームを取得
aws logs describe-log-streams --log-group-name /aws/lambda/your-function-name --order-by LastEventTime --descending

# ログを表示
aws logs get-log-events --log-group-name /aws/lambda/your-function-name --log-stream-name your-stream-name
```

### SAM CLIでのログ確認
```bash
# デプロイ中のログ
sam deploy --debug

# ローカル実行時のログ
sam local invoke --log-file local-log.txt
```

## クリーンアップ

### スタック削除
```bash
# すべてのリソースを削除
sam delete

# またはCloudFormationで直接削除
aws cloudformation delete-stack --stack-name your-stack-name
```

## 参考リンク

- [AWS SAM CLI ドキュメント](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [AWS Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html)
- [Amazon Bedrock モデルID](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html)

## サポート

不明点があれば、以下の情報を提供してください：
- SAM CLIバージョン: `sam --version`
- AWS CLIバージョン: `aws --version`
- Node.jsバージョン: `node --version`
- エラーメッセージ全文