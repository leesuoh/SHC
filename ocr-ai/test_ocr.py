"""
SHC OCR 테스트 스크립트 — Google Gemini (무료)
사용법: python3 test_ocr.py [이미지경로] [타입]
타입: plate | vin | odometer
예시: python3 test_ocr.py /path/to/car.jpg plate
"""

import sys
import json
import base64
from pathlib import Path
from google import genai
from google.genai import types

# ── API Key ───────────────────────────────────────────────────
GEMINI_API_KEY = ""   # ← 여기에 키 입력 (또는 아래서 입력)
# ─────────────────────────────────────────────────────────────

PROMPTS = {
    "plate": """이 이미지는 한국 자동차 번호판입니다.
번호판에 적힌 차량 번호를 정확히 읽어주세요.
반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"plate_number": "12가 3456", "confidence": 0.95}
- plate_number: 번호판 숫자와 한글 (예: "12가 3456", "서울 12가 3456")
- confidence: 인식 신뢰도 0.0~1.0
- 읽을 수 없으면: {"plate_number": "", "confidence": 0.0}""",

    "vin": """이 이미지는 자동차 VIN(차대번호) 스티커입니다.
반드시 아래 JSON 형식으로만 응답하세요:
{"model": "현대 아반떼 CN7", "year": 2021, "vin": "KMHD241ABNU123456", "fuel_type": "gasoline", "confidence": 0.9}
- model: 제조사 + 차종명 (한국어)
- year: 연식 숫자
- vin: 17자리 차대번호
- fuel_type: "gasoline"|"diesel"|"lpg"|"ev"|"hybrid"
- 읽을 수 없는 항목은 null""",

    "odometer": """이 이미지는 자동차 계기판(odometer)입니다.
주행거리(km)를 읽어주세요.
반드시 아래 JSON 형식으로만 응답하세요:
{"mileage": 42180, "confidence": 0.92}
- mileage: 주행거리 정수
- 읽을 수 없으면: {"mileage": 0, "confidence": 0.0}""",
}


def test_ocr(image_path: str, ocr_type: str, api_key: str):
    client = genai.Client(api_key=api_key)

    img_bytes = Path(image_path).read_bytes()
    ext = Path(image_path).suffix.lower()
    mime = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "heic": "image/heic", "heif": "image/heif"}.get(ext.lstrip("."), "image/jpeg")

    prompt = PROMPTS.get(ocr_type)
    if not prompt:
        print(f"❌ 타입 오류: {ocr_type} (plate | vin | odometer 중 선택)")
        return

    print(f"\n🔍 OCR 분석 중... ({ocr_type} / {Path(image_path).name})\n")

    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=[
            types.Part.from_bytes(data=img_bytes, mime_type=mime),
            prompt,
        ],
    )

    raw = response.text.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

    result = json.loads(raw)
    print("✅ 결과:")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


if __name__ == "__main__":
    # API Key 처리
    key = GEMINI_API_KEY
    if not key:
        key = input("Gemini API Key 입력: ").strip()

    if len(sys.argv) < 3:
        print("\n사용법: python3 test_ocr.py [이미지경로] [타입]")
        print("타입: plate | vin | odometer\n")
        # 인터랙티브 모드
        path = input("이미지 경로: ").strip().strip("'\"")
        ocr_type = input("타입 (plate/vin/odometer): ").strip()
    else:
        path = sys.argv[1]
        ocr_type = sys.argv[2]

    test_ocr(path, ocr_type, key)
