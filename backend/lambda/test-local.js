// ローカルテスト用スクリプト
const { handler } = require("./dist/index");

// テスト用のイベントデータ
const testEvent = {
  requestContext: {
    http: {
      method: "POST",
    },
  },
  body: JSON.stringify({
    purpose: "シンプルなTODOアプリ",
    items: "タスク入力欄、追加ボタン、タスクリスト",
    designRequest: "モダンで使いやすいデザイン",
  }),
};

async function testHandler() {
  try {
    console.log("=== Lambda関数ローカルテスト ===");
    console.log("テストイベント:", JSON.stringify(testEvent, null, 2));

    const result = await handler(testEvent);

    console.log("=== レスポンス ===");
    console.log("ステータス:", result.statusCode);
    console.log("ヘッダー:", result.headers);
    console.log("ボディ:", result.body);
  } catch (error) {
    console.error("テストエラー:", error);
  }
}

// スクリプト実行
if (require.main === module) {
  testHandler();
}
