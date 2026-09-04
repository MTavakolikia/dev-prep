#!/bin/bash
# ============================================================
# Dev Prep — part 4: demo login (dynamic refs) -> dashboard
# ============================================================
set -u
cd /home/z/my-project/.next/standalone
PORT=3000 HOSTNAME=127.0.0.1 node server.js > /home/z/my-project/scripts/prod-server.log 2>&1 &
SRV=$!
for i in $(seq 1 20); do sleep 1; code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null); [ "$code" = "200" ] && break; done
echo "== server ready (pid=$SRV) =="
B=agent-browser

ref_of() { # $1 = grep pattern in interactive snapshot
  $B snapshot -i 2>/dev/null | grep "$1" | head -1 | sed -E 's/.*\[ref=([e0-9]+)\].*/\1/'
}

$B open "http://localhost:3000/#/login" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 2

DEMO_BTN=$(ref_of "reader")
echo "demo-fill button ref: $DEMO_BTN"
$B click "$DEMO_BTN" > /dev/null 2>&1
sleep 1
SIGNIN_BTN=$(ref_of 'button "Sign in"')
echo "sign-in button ref: $SIGNIN_BTN"
$B click "$SIGNIN_BTN" > /dev/null 2>&1
sleep 4
echo "url after login: $($B get url 2>/dev/null)"

echo "== DASHBOARD =="
$B open "http://localhost:3000/#/dashboard" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 3
echo "h1: $($B get text h1 2>/dev/null | head -1)"
echo "js-errors: $($B errors 2>/dev/null | grep -ci error || true)"
BODY=$($B get text body 2>/dev/null)
echo "mentions achievements: $(echo "$BODY" | grep -ci "achievement" || true)"
echo "has readiness/stat blocks: $(echo "$BODY" | grep -ciE "readiness|skill graph|streak" || true)"
$B screenshot /home/z/my-project/scripts/prod-7-dashboard.png > /dev/null 2>&1

echo "== INTERVIEW SESSION (logged in): start a quick session =="
$B open "http://localhost:3000/#/interview" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 2
QUICK=$(ref_of "Quick Practice")
echo "quick ref: $QUICK"
$B click "$QUICK" > /dev/null 2>&1
sleep 4
echo "url: $($B get url 2>/dev/null)"
echo "js-errors: $($B errors 2>/dev/null | grep -ci error || true)"
$B screenshot /home/z/my-project/scripts/prod-9-session.png > /dev/null 2>&1

kill $SRV 2>/dev/null
echo "done"
