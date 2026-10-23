#!/bin/bash
cd "$(dirname "$0")"
PORT=8765
if ! lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  python3 -m http.server "$PORT" >/tmp/kabinet-regik.log 2>&1 &
  sleep 0.6
fi
open "http://127.0.0.1:${PORT}/"
