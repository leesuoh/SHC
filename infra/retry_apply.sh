#!/bin/bash
# A1.Flex 용량이 생길 때까지 자동 재시도
# Oracle Cloud는 용량이 간헐적으로 풀림 (보통 새벽 또는 수 시간 후)

INTERVAL=60  # 60초마다 재시도
COUNT=0

echo "🔄 A1.Flex 용량 대기 중... (Ctrl+C로 중지)"
echo "   60초마다 자동 재시도합니다."
echo ""

while true; do
  COUNT=$((COUNT + 1))
  TIMESTAMP=$(date '+%H:%M:%S')
  echo "[$TIMESTAMP] 시도 #$COUNT..."

  OUTPUT=$(terraform apply -auto-approve 2>&1)

  if echo "$OUTPUT" | grep -q "Out of host capacity"; then
    echo "[$TIMESTAMP] ❌ 용량 부족 — ${INTERVAL}초 후 재시도"
    sleep $INTERVAL
  elif echo "$OUTPUT" | grep -q "Apply complete"; then
    echo ""
    echo "✅ 서버 생성 완료!"
    terraform output
    exit 0
  else
    echo "$OUTPUT"
    echo ""
    echo "❌ 다른 오류 발생 — 스크립트 종료"
    exit 1
  fi
done
