#!/usr/bin/env bash
PORT=${1:-8080}
echo "Server běží na http://localhost:$PORT"
echo "Stiskni Ctrl+C pro zastavení."
python3 -m http.server $PORT
