"use client";

import type { History, HistoryList } from "@/types/History";
import { useEffect, useState } from "react";

export default function Home() {
  const [purpose, setPurpose] = useState("");
  const [items, setItems] = useState("");
  const [designRequest, setDesignRequest] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [generatedCSS, setGeneratedCSS] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // 履歴データ（モックデータ、後で実装予定）
  const [history, setHistory] = useState<HistoryList>([]);

  // TODO: 画面描画時に履歴データを取得する
  useEffect(() => {
    const fetchHistory = async () => {
      //const history = await getHistory();
      //setHistory(history);
    };
    fetchHistory();
  }, []);

  const handleHistoryClick = (history: History) => {
    setPurpose(history.purpose);
    setItems(history.items);
    setDesignRequest(history.designRequest);
    setGeneratedCode(history.generatedCode);
    setGeneratedCSS(history.generatedCSS);
  };

  const handleExecute = async () => {
    setIsLoading(true);

    try {
      // Lambda URLが設定されているか確認
      const lambdaUrl = process.env.NEXT_PUBLIC_LAMBDA_URL;
      if (!lambdaUrl || lambdaUrl.includes("your-lambda-function-url")) {
        alert(
          "Lambda URLが設定されていません。\n\nfrontend/.env.localファイルを作成し、実際のLambda Function URLを設定してください。\n\n例:\nNEXT_PUBLIC_LAMBDA_URL=https://abcdefghijk.execute-api.us-east-1.amazonaws.com/Prod/"
        );
        setIsLoading(false);
        return;
      }

      console.log("Calling Lambda URL:", lambdaUrl);

      // Lambdaを直接コール（CORS対策としてmode: 'cors'を追加）
      const response = await fetch(lambdaUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purpose,
          items,
          designRequest,
          passphrase: process.env.NEXT_PUBLIC_LAMBDA_PASS_PHRASE,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(
          `HTTP ${response.status}: ${response.statusText}\n${errorText}`
        );
      }

      const data = await response.json();
      console.log("Lambda response:", data);

      setGeneratedCode(data.generatedCode || "// 生成されたコードが空です");
      setGeneratedCSS(data.generatedCSS || "/* 生成されたCSSが空です */");

      // 履歴に追加
      const newHistoryItem = {
        title: purpose.length > 30 ? purpose.substring(0, 30) + "..." : purpose,
        date: new Date(),
        purpose,
        items,
        designRequest,
        generatedCode: data.generatedCode || "// 生成されたコードが空です",
        generatedCSS: data.generatedCSS || "/* 生成されたCSSが空です */",
      };
      setHistory((prev) => [newHistoryItem, ...prev]);
    } catch (error) {
      console.error("Error calling Lambda:", error);

      let errorMessage = "Lambda呼び出し中にエラーが発生しました。\n\n";

      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        errorMessage += "🚫 ネットワークエラーが発生しました。\n\n";
        errorMessage += "対処方法:\n";
        errorMessage += "1. Lambda Function URLが正しいか確認\n";
        errorMessage += "2. インターネット接続を確認\n";
        errorMessage += "3. ブラウザの開発者ツールで詳細なエラーを確認\n";
        errorMessage += "4. CORS拡張機能を有効化（開発時のみ）\n";
      } else {
        errorMessage += `エラー詳細: ${
          error instanceof Error ? error.message : String(error)
        }`;
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generatePreviewHTML = (code: string, css: string) => {
    // iframe向けにUMD + 非Babelで安全に実行するHTMLを生成
    const escapedCode = JSON.stringify(code);
    const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>モダンTODOアプリ - プレビュー</title>
    <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
    <style>
      html, body { margin: 0; padding: 0; }
      ${css}
      /* エラー表示用 */
      #error { color: #ef4444; background: #1a1a1a; padding: 12px; border-radius: 8px; font-family: monospace; }
    </style>
</head>
<body>
  <div id="root"></div>
  <div id="error" style="display:none"></div>
  <script>
    (function () {
      try {
        // ユーザー生成コード（React 依存）を安全に評価
        var userCode = ${escapedCode};
        (function(React){
          eval(userCode);
          var container = document.getElementById('root');
          if (ReactDOM && typeof ReactDOM.createRoot === 'function') {
            var root = ReactDOM.createRoot(container);
            root.render(React.createElement(AppWindow));
          } else {
            ReactDOM.render(React.createElement(AppWindow), container);
          }
        })(window.React);
      } catch (err) {
        var e = document.getElementById('error');
        e.style.display = 'block';
        e.textContent = 'Render Error: ' + (err && err.message ? err.message : String(err));
        console.error(err);
      }
    })();
  </script>
</body>
</html>`;
    return htmlContent;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 relative">
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-6 right-6 z-50 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
        aria-label="メニューを開く"
      >
        <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
          <span
            className={`block h-0.5 w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ${
              isMenuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          ></span>
          <span
            className={`block h-0.5 w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ${
              isMenuOpen ? "opacity-0" : ""
            }`}
          ></span>
          <span
            className={`block h-0.5 w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ${
              isMenuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          ></span>
        </div>
      </button>

      {/* オーバーレイ（メニューが開いているときの背景） */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* サイドメニュー */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-md shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* メニューヘッダー */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    ></path>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">履歴</h2>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors duration-200"
                aria-label="メニューを閉じる"
              >
                <svg
                  className="w-5 h-5 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            <p className="text-sm text-slate-500">
              過去に生成した画面の履歴を表示します
            </p>
          </div>

          {/* 履歴一覧 */}
          <div className="flex-1 overflow-y-auto p-4">
            {history.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  ></path>
                </svg>
                <p>履歴がありません</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item: History, index: number) => (
                  <div
                    key={index}
                    onClick={() => {
                      handleHistoryClick(item);
                      setIsMenuOpen(false); // メニューを閉じる
                    }}
                    className="group p-4 bg-slate-50/50 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          ></path>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 line-clamp-2 break-words">
                          {item.purpose}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {item.date.toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* タイトル領域 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
              ></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI 画面生成ツール
          </h1>
        </div>
        <p className="text-slate-600 text-lg">
          あなたのアイデアを美しいWeb画面に
        </p>
      </div>

      {/* 入力領域 */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8 mx-auto max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              ></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">画面仕様入力</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* 目的入力 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              作成する画面の目的や仕様
            </label>
            <div className="relative">
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full h-32 p-4 border-2 border-slate-200 rounded-xl resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 bg-slate-50/50"
                placeholder="例: TODOの入力および確認画面で、ユーザーはこの画面でTODOを入力し、入力したものを閲覧することができる。SPAとして入力、確認、状態の更新を一つの画面で遷移なく行えるようにしたい。"
              />
            </div>
          </div>

          {/* 画面項目入力 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                ></path>
              </svg>
              画面の項目
            </label>
            <textarea
              value={items}
              onChange={(e) => setItems(e.target.value)}
              className="w-full h-24 p-4 border-2 border-slate-200 rounded-xl resize-none focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all duration-200 bg-slate-50/50"
              placeholder="例: TODO入力欄、TODO追加ボタン、TODO完了ボタン、TODO一覧"
            />
          </div>

          {/* デザインリクエスト入力 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                ></path>
              </svg>
              デザインのリクエスト
            </label>
            <textarea
              value={designRequest}
              onChange={(e) => setDesignRequest(e.target.value)}
              className="w-full h-24 p-4 border-2 border-slate-200 rounded-xl resize-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200 bg-slate-50/50"
              placeholder="例: モダンなデザインで、使いやすいUIにしてほしい"
            />
          </div>
        </div>

        {/* 実行ボタン */}
        <div className="flex justify-center">
          <button
            onClick={handleExecute}
            disabled={isLoading || !purpose || !items || !designRequest}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <div className="flex items-center gap-3">
              {isLoading ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  生成中...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    ></path>
                  </svg>
                  AIで画面生成
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* 出力領域 */}
      {generatedCode && generatedCSS && (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mx-auto max-w-6xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                ></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">生成結果</h2>
          </div>

          {/* 画面サンプル */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
              <label className="text-lg font-semibold text-slate-700">
                画面サンプル
              </label>
            </div>
            <div className="bg-slate-50/50 border-2 border-slate-200 rounded-xl p-4 min-h-[600px] shadow-inner">
              <iframe
                srcDoc={generatePreviewHTML(generatedCode, generatedCSS)}
                className="w-full h-[600px] border-0 rounded-lg bg-white shadow-sm"
                title="画面プレビュー"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              />
            </div>
          </div>

          {/* コード表示エリア */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* 画面ソースコード */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      ></path>
                    </svg>
                  </div>
                  <label className="text-lg font-semibold text-slate-700">
                    React ソースコード
                  </label>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedCode)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    ></path>
                  </svg>
                  コピー
                </button>
              </div>
              <div className="relative">
                <textarea
                  value={generatedCode}
                  readOnly
                  className="w-full h-80 p-4 border-2 border-slate-200 rounded-xl font-mono text-sm resize-none bg-slate-50/50 focus:border-blue-400 transition-colors duration-200"
                  placeholder="生成されたReactコードがここに表示されます"
                />
                <div className="absolute top-3 right-3 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            {/* スタイルシート */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                      ></path>
                    </svg>
                  </div>
                  <label className="text-lg font-semibold text-slate-700">
                    CSS スタイルシート
                  </label>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedCSS)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    ></path>
                  </svg>
                  コピー
                </button>
              </div>
              <div className="relative">
                <textarea
                  value={generatedCSS}
                  readOnly
                  className="w-full h-80 p-4 border-2 border-slate-200 rounded-xl font-mono text-sm resize-none bg-slate-50/50 focus:border-purple-400 transition-colors duration-200"
                  placeholder="生成されたCSSがここに表示されます"
                />
                <div className="absolute top-3 right-3 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
