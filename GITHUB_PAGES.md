# GitHub Pagesで公開する手順

このアプリは、GitHub PagesではUIだけを公開します。OpenAI APIキーはブラウザに置けないため、ChatGPT通信は別のバックエンドURLを `API URL` 欄に設定して使います。

## 公開手順

1. `outputs/suno-prompt-studio` の中身をGitHubリポジトリのルートに置く
2. GitHubで `Settings` -> `Pages` -> `Build and deployment` を `GitHub Actions` にする
3. `main` ブランチへpushする
4. Actionsの `Deploy GitHub Pages` が完了したらPages URLを開く
5. アプリ内の `API URL` に、ChatGPT APIバックエンドのURLを入れる
6. `接続テスト` を押す

## ChatGPT APIバックエンド

同じGitHubリポジトリをVercelに接続すると、`api/` フォルダのサーバーレス関数が動きます。

1. VercelでこのGitHubリポジトリをImportする
2. Environment Variablesに `OPENAI_API_KEY` を設定する
3. 必要なら `OPENAI_MODEL` を設定する
4. Deployする
5. VercelのURL、例 `https://your-project.vercel.app` をGitHub Pages側の `API URL` に入れる

GitHub PagesのURLを開く時に、次のようにクエリでAPI URLを渡すこともできます。

```text
https://your-name.github.io/your-repo/?api=https://your-project.vercel.app
```

## Renderを使う場合

RenderをAPIサーバーとして使う場合は、[RENDER.md](./RENDER.md) を見てください。Render URLをGitHub Pages側の `API URL` に入れれば、GitHub PagesのUIからRender経由でChatGPT APIを呼び出せます。

## 注意

- GitHub Pagesだけでは `OPENAI_API_KEY` を安全に扱えません。
- `server.js` はローカルまたは別ホスティング用のバックエンドです。GitHub Pages上では実行されません。
- Sunoへは自動送信しません。`Sunoだけコピー` で手動コピーします。
