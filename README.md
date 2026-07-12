# Suno Prompt Studio

このアプリのAPIはChatGPTとの通信にだけ使います。Sunoへ直接送信する機能はなく、アプリ上で作成したプロンプトを手動でSunoへコピーして使う設計です。

ChatGPT連携ありで使う場合:

1. `.env.example` を参考に `.env` を作り、`OPENAI_API_KEY` を入れます。

```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.6-luna
```

2. 起動します。

```bash
cd /Users/kondohkeisuke/Documents/Codex/2026-07-08/s/outputs/suno-prompt-studio
/Users/kondohkeisuke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.js
```

または `start.command` を開きます。

ブラウザで開く:

```text
http://127.0.0.1:4173/
```

`cannot reach` になる場合:

- `start.command` を開いて、ターミナル画面を閉じずに置いてください。
- ブラウザは `file://.../index.html` ではなく `http://127.0.0.1:4173/` を開いてください。
- ターミナルに `Permission denied` が出る場合は、Finderから `start.command` を開くか、通常のTerminalで上の起動コマンドを実行してください。
- ターミナルに `already in use` が出る場合は、前に起動したサーバーを閉じてからもう一度起動してください。

任意でモデルを変える場合:

```bash
OPENAI_MODEL="gpt-5.6-terra" /Users/kondohkeisuke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.js
```

APIキーなしでも画面は開けますが、「ChatGPTで考える」は使えません。

## 使い方メモ

- `案数` を 3案または5案にすると、ChatGPTが方向違いの候補を複数出します。
- `AIを反映` を押すと、AIが作ったSuno用プロンプトだけをSunoタブへ反映します。
- `Sunoだけコピー` を押すと、Sunoに貼る本文だけをコピーします。
- `AI履歴` から直近12件まで戻せます。
- 参考曲は方向性として扱い、メロディ・歌詞・フックのコピーを避ける指示を自動で入れます。

## GitHubでブラウザー公開する場合

[GITHUB_PAGES.md](./GITHUB_PAGES.md) を見てください。GitHub PagesはUI公開用、ChatGPT API通信はVercelなどのバックエンドURLを `API URL` に設定して使います。

RenderをAPIサーバーとして挟む場合は [RENDER.md](./RENDER.md) を見てください。
