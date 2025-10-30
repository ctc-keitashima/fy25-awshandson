import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // デバッグ用の設定（Next.js 15.5.2対応）
  devIndicators: {
    position: "bottom-right",
  },
  // S3静的ホスティング用に静的エクスポートを有効化
  output: "export",
  // 静的エクスポート時の画像最適化を無効化
  images: {
    unoptimized: true,
  },
  // 開発時のCORS問題回避用プロキシ設定（本番環境では無効）
  // 注意: 静的エクスポート時はrewritesが動作しないため、API Routesを使用
  // trailingSlash: true, // S3でリダイレクトが必要な場合に有効化
};

export default nextConfig;
