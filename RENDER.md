# RenderをAPIサーバーとして使う

Renderを間に挟む構成はおすすめです。

- GitHub Pages: ブラウザーで見るUI
- Render Web Service: ChatGPT API通信
- OpenAI APIキー: Renderの環境変数に保存
- Suno: アプリの `Sunoだけコピー` から手動で貼り付け

## 手順

1. `outputs/suno-prompt-studio` の中身をGitHubリポジトリのルートに置きます。
2. Renderで `New` -> `Blueprint` または `Web Service` を選び、このリポジトリを接続します。
3. Blueprintを使う場合、`render.yaml` が読み込まれます。
4. `OPENAI_API_KEY` をRenderの環境変数に設定します。
5. デプロイ完了後、RenderのURLをコピーします。例: `https://suno-prompt-studio-api.onrender.com`
6. GitHub Pagesで開いたアプリの `API URL` にRender URLを入れます。
7. `接続テスト` を押して成功すればOKです。

## Render Web Serviceで手入力する場合

- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variable:
  - `OPENAI_API_KEY`: 自分のOpenAI APIキー
  - `OPENAI_MODEL`: `gpt-5.6-luna`

RenderではWeb Serviceが `PORT` 環境変数にバインドする必要があります。このアプリはRender上では自動で `0.0.0.0` と `PORT` を使います。
