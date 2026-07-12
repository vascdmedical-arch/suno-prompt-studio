#!/bin/bash
cd "$(dirname "$0")" || exit 1

echo "Suno Prompt Studio を起動します..."
echo "ブラウザは http://127.0.0.1:4173/ を開きます。"
echo "このターミナル画面は閉じずに置いてください。"
echo

(sleep 1.2 && open "http://127.0.0.1:4173/") &
/Users/kondohkeisuke/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.js
