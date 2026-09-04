#!/bin/bash
# ============================================================
# Dev Prep — part 3: guest question bank + demo dashboard
# ============================================================
set -u
cd /home/z/my-project/.next/standalone
PORT=3000 HOSTNAME=127.0.0.1 node server.js > /home/z/my-project/scripts/prod-server.log 2>&1 &
SRV=$!
for i in $(seq 1 20); do sleep 1; code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null); [ "$code" = "200" ] && break; done
echo "== server ready (pid=$SRV) =="
B=agent-browser

echo "== 1. GUEST: question bank content =="
$B cookies clear > /dev/null 2>&1
$B open "http://localhost:3000/#/questions" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 2.5
echo "h1: $($B get text h1 2>/dev/null | head -1)"
echo "total text mentions: $($B get text body 2>/dev/null | grep -c "What is\|Explain\|How would" || true)"
echo "js-errors: $($B errors 2>/dev/null | grep -ci error || true)"
$B screenshot /home/z/my-project/scripts/prod-5-guest-questions.png > /dev/null 2>&1

echo "== 2. DEMO LOGIN -> DASHBOARD =="
$B open "http://localhost:3000/#/login" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 1.5
$B fill @e41 "alex@devprep.dev" > /dev/null 2>&1
$B fill @e42 "Demo-2026!" > /dev/null 2>&1
$B snapshot -i 2>/dev/null | grep -E "button \"Sign in\"" | head -1
$B click @e27 > /dev/null 2>&1
sleep 3
echo "url: $($B get url 2>/dev/null)"
$B open "http://localhost:3000/#/dashboard" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 2.5
echo "h1: $($B get text h1 2>/dev/null | head -1)"
echo "js-errors: $($B errors 2>/dev/null | grep -ci error || true)"
echo "--- achievement area ---"
$B get text body 2>/dev/null | grep -o "Achievements" | head -1
$B screenshot /home/z/my-project/scripts/prod-7-dashboard.png > /dev/null 2>&1
echo "--- dashboard timing check: server log tail ---"
grep -E "GET / |POST " /home/z/my-project/scripts/prod-server.log 2>/dev/null | tail -4

echo "== 3. INTERVIEW HUB AS LOGGED-IN USER (110 techs) =="
$B open "http://localhost:3000/#/interview" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 2
echo "js-errors: $($B errors 2>/dev/null | grep -ci error || true)"
$B screenshot /home/z/my-project/scripts/prod-8-interview.png > /dev/null 2>&1

kill $SRV 2>/dev/null
echo "done"
