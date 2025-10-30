# 仕様

## このリポジトリは？

AWSハンズオン用サンプルアプリケーション。

## アプリの概要
* AIチャット形式のUI
* UI上で、以下の指示をすることで画面デザイン案をAIが生成して表示する
    * 画面の目的や仕様などをざっくり
    * わかっている範囲で画面の項目
    * デザインのリクエスト

## 全体システム構成
- **フロントエンド**: Next.js (S3ホスティング)
- **バックエンド**: AWS Lambda (Function URL使用)
- **AIサービス**: Amazon Bedrock

## フロントエンド
AIチャット形式のUIを使って画面デザイン案を生成するアプリのフロントエンドです。

### 開発環境
* Node.js
* Next.js
* TypeScript

## バックエンド
AWS Lambda (Function URL使用)

### 開発環境
* SAM
* AWS CLI
* TypeScript
