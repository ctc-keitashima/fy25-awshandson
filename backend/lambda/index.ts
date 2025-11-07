import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { config as dotenvConfig } from "dotenv";

// ローカル実行時のみ.envファイルを読み込む
if (process.env.NODE_ENV !== "production") {
  dotenvConfig();
}

// TypeScript型定義
interface RequestBody {
  purpose: string;
  items: string;
  designRequest: string;
  passphrase?: string;
}

interface ResponseBody {
  generatedCode: string;
  generatedCSS: string;
}

interface LambdaEvent {
  requestContext?: {
    http?: {
      method: string;
    };
  };
  body: string;
}

interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

// Bedrockクライアント初期化
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || "us-east-1",
});

console.log("BEDROCK_REGION:", process.env.BEDROCK_REGION);
console.log("BEDROCK_MODEL_ID:", process.env.BEDROCK_MODEL_ID);

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // リクエストボディの存在チェック
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Bad Request",
          message: "Request body is required",
        }),
      };
    }

    // リクエストボディのパース
    const { purpose, items, designRequest, passphrase }: RequestBody =
      JSON.parse(event.body);

    if (process.env.PASS_PHRASE && passphrase !== process.env.PASS_PHRASE) {
      return {
        statusCode: 401,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Unauthorized",
          message: "not matched passphrase",
        }),
      };
    }

    // Bedrock API呼び出し
    const prompt = createPrompt(purpose, items, designRequest);
    const response = await invokeBedrock(prompt);
    const result = parseBedrockResponse(response);

    // 成功レスポンス
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Error:", error);

    // エラーレスポンス
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

// Bedrockへのプロンプト作成
function createPrompt(
  purpose: string,
  items: string,
  designRequest: string
): string {
  return `あなたはReactコンポーネント生成の専門家です。
以下の要件に基づいて、機能的なReactコンポーネントとCSSを作成してください。

画面の目的: ${purpose}
必要な項目: ${items}
デザイン要求: ${designRequest}

出力形式:
1. Reactコンポーネント（関数コンポーネント、ES6構文）
2. 対応するCSS（モダンなデザイン）

注意事項:
- React hooksを使用
- レスポンシブデザイン
- アクセシビリティを考慮
- エラーハンドリングを含む

JSON形式で返却:
{
  "generatedCode": "Reactコンポーネントのコード",
  "generatedCSS": "CSSのコード"
}

"Reactコンポーネントのコード" については以下のような形式のようにimportとかしない完結したコードにしてください。また、functionの名前はAppWindowにしてください。
function AppWindow() {
  var _React = React;
  var useState = _React.useState;

  var _useState = useState([]), todos = _useState[0], setTodos = _useState[1];
  var _useState2 = useState(''), inputValue = _useState2[0], setInputValue = _useState2[1];

  function addTodo() {
    if (inputValue.trim()) {
      setTodos(todos.concat([{ id: Date.now(), text: inputValue, completed: false }]));
      setInputValue('');
    }
  }

  function toggleTodo(id) {
    setTodos(todos.map(function(todo){
      return todo.id === id ? { id: todo.id, text: todo.text, completed: !todo.completed } : todo;
    }));
  }

  function removeTodo(id) {
    setTodos(todos.filter(function(t){ return t.id !== id; }));
  }

  return React.createElement('div', { className: 'container' },
    React.createElement('h1', null, 'Modern TODO'),
    React.createElement('div', { className: 'input-section' },
      React.createElement('input', {
        type: 'text',
        value: inputValue,
        onChange: function(e) { setInputValue(e.target.value); },
        placeholder: '新しいタスクを入力してください...',
        className: 'todo-input'
      }),
      React.createElement('button', { onClick: addTodo, className: 'add-btn' }, 'Add')
    ),
    todos.length === 0
      ? React.createElement('div', { style: { textAlign: 'center', padding: '40px 20px', color: '#cccccc', fontSize: '18px' } }, '最初のタスクを追加してみましょう')
      : React.createElement('ul', { className: 'todo-list' },
          todos.map(function(todo, index){
            return React.createElement('li', {
              key: String(todo.id),
              className: todo.completed ? 'todo-item completed' : 'todo-item',
              style: { animationDelay: (index * 0.1) + 's' }
            },
              React.createElement('input', { type: 'checkbox', checked: todo.completed, onChange: function(){ toggleTodo(todo.id); } }),
              React.createElement('span', { className: 'todo-text' }, todo.text),
              React.createElement('button', {
                onClick: function(){ removeTodo(todo.id); },
                style: { background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', fontSize: '14px', marginLeft: 'auto' }
              }, 'Delete')
            );
          })
        )
  );
}

ちゃんとJSONをパースできる形式で返すように注意してください。具体的には文字列をダブルクオーテーションで囲むようにしてください。
あなたからの返却結果を機械的にパースして利用するので、余計なコメントや説明文は不要です。
`;
}

// Bedrock API呼び出し
async function invokeBedrock(prompt: string): Promise<any> {
  const modelId = process.env.BEDROCK_MODEL_ID;

  console.log("Using Bedrock model:", modelId); // デバッグログ

  const command = new ConverseCommand({
    modelId,
    messages: [{ role: "user", content: [{ text: prompt }] }],
    inferenceConfig: {
      maxTokens: 8192, // 生成トークン上限
    },
  });

  const response = await bedrockClient.send(command);
  return response;
}

// Bedrockレスポンスのパース
function parseBedrockResponse(response: any): ResponseBody {
  // Converse の返却取り出し
  const generatedText = response.output?.message?.content?.[0]?.text ?? "";

  // 以降は既存ロジックを流用（JSON抽出 → 成功/失敗の分岐）
  try {
    const parsed = JSON.parse(generatedText);
    return {
      generatedCode: parsed.generatedCode || generatedText,
      generatedCSS:
        parsed.generatedCSS ||
        "AIからの応答がおかしかったのでもう一回トライしてください。",
    };
  } catch {
    return {
      generatedCode: generatedText,
      generatedCSS:
        "AIからの応答がおかしかったのでもう一回トライしてください。",
    };
  }
}
