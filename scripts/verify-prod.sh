#!/bin/bash
# ============================================================
# Dev Prep — single-call production verification
# Runs the standalone server IN THIS CALL (background processes
# are reaped between tool calls), drives agent-browser through
# the golden paths, then shuts down.
# ============================================================
set -u
cd /home/z/my-project/.next/standalone
PORT=3000 HOSTNAME=127.0.0.1 node server.js > /home/z/my-project/scripts/prod-server.log 2>&1 &
SRV=$!

# wait for readiness
for i in $(seq 1 20); do
  sleep 1
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  [ "$code" = "200" ] && break
done
echo "== server ready (code=$code, pid=$SRV) =="

B=agent-browser
err_count() { $B errors 2>/dev/null | grep -c "Error\|error" || true; }

echo "== 1. HOME =="
$B open "http://localhost:3000/" 2>&1 | tail -1
$B wait --load networkidle > /dev/null 2>&1
sleep 1
echo "h1: $($B get text h1 2>/dev/null | head -1)"
echo "js-errors: $(err_count)"
$B screenshot /home/z/my-project/scripts/prod-1-home.png > /dev/null 2>&1

echo "== 2. TECHNOLOGIES HUB (expect 110) =="
$B open "http://localhost:3000/#/technologies" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 2
echo "tech cards: $($B get count "a[href*='/technologies/']" 2>/dev/null | tail -1)"
echo "h1: $($B get text h1 2>/dev/null | head -1)"
echo "js-errors: $(err_count)"
$B screenshot /home/z/my-project/scripts/prod-2-technologies.png > /dev/null 2>&1

echo "== 3. NEW TECH PAGE (vue, expect articles) =="
$B open "http://localhost:3000/#/technologies/vue" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 2
echo "h1: $($B get text h1 2>/dev/null | head -1)"
echo "article links: $($B get count "a[href*='/articles/']" 2>/dev/null | tail -1)"
echo "js-errors: $(err_count)"

echo "== 4. LEARNING PATHS (expect ~171) =="
$B open "http://localhost:3000/#/learning-paths" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 2
echo "path links: $($B get count "a[href*='/learning-paths/']" 2>/dev/null | tail -1)"
echo "js-errors: $(err_count)"
$B screenshot /home/z/my-project/scripts/prod-3-paths.png > /dev/null 2>&1

echo "== 5. GENERATED PATH DETAIL (redis-essentials) =="
$B open "http://localhost:3000/#/learning-paths/redis-essentials" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 2
echo "h1: $($B get text h1 2>/dev/null | head -1)"
echo "article links: $($B get count "a[href*='/articles/']" 2>/dev/null | tail -1)"

echo "== 6. GUEST INTERVIEW GATE =="
$B cookies clear > /dev/null 2>&1
$B open "http://localhost:3000/#/interview" > /dev/null 2>&1
$B wait --load networkidle > /dev/null 2>&1
sleep 2
echo "h1: $($B get text h1 2>/dev/null | head -1)"
echo "js-errors: $(err_count)"
$B snapshot -i 2>/dev/null | grep -iE "button|Start" | head -8

echo "== shutdown =="
kill $SRV 2>/dev/null
echo "done"
