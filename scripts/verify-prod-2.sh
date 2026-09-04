#!/bin/bash
# ============================================================
# Dev Prep — part 2: interactive guest gate + demo dashboard
# ============================================================
set -u
cd /home/z/my-project/.next/standalone
PORT=3000 HOSTNAME=127.0.0.1 node server.js > /home/z/my-project/scripts/prod-server.log 2>&1 &
SRV=$!
for i in $(seq 1 20); do sleep 1; code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null); [ "$code" = "200" ] && break; done
echo "== server ready (pid=$SRV) =="
B=agent-browser

echo "== 1. GUEST: open interview, click Standard Start =="
$B cookies clear > /dev/null 2>&1
$B open "http://localhost:3000/#/interview" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 2
$B snapshot -i 2>/dev/null | grep -E "Standard Interview" | head -2
$B find text "Start" click > /dev/null 2>&1 || $B click @e16 > /dev/null 2>&1
sleep 1.5
echo "--- dialog content ---"
$B get text "[role=dialog]" 2>/dev/null | head -6
echo "dialog visible: $($B is visible "[role=dialog]" 2>/dev/null | tail -1)"
echo "js-errors: $($B errors 2>/dev/null | grep -ci error || true)"
$B screenshot /home/z/my-project/scripts/prod-4-guest-gate.png > /dev/null 2>&1

echo "== 2. GUEST: questions bank browsing + bookmark gate =="
$B open "http://localhost:3000/#/questions" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 2
echo "h1: $($B get text h1 2>/dev/null | head -1)"
echo "question cards: $($B get count "[data-slot=card]" 2>/dev/null | tail -1)"
$B screenshot /home/z/my-project/scripts/prod-5-guest-questions.png > /dev/null 2>&1

echo "== 3. DEMO LOGIN -> DASHBOARD =="
$B open "http://localhost:3000/#/login" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 1.5
EMAIL_REF=$($B snapshot -i --json 2>/dev/null | python3 -c "import json,sys; d=json.load(sys.stdin); print([e['ref'] for e in d if 'textbox' in (e.get('type','')) and 'mail' in (e.get('name','').lower())][0])" 2>/dev/null)
$B snapshot -i 2>/dev/null | grep -E "textbox" | head -3
$B screenshot /home/z/my-project/scripts/prod-6-login.png > /dev/null 2>&1
echo "(use one-click demo fill button if present)"
$B snapshot -i 2>/dev/null | grep -iE "alex@|demo" | head -2

kill $SRV 2>/dev/null
echo "done"
