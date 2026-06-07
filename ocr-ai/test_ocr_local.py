"""
SHC OCR 로컬 테스트 — EasyOCR (완전 무료, API 키 불필요)
"""
import sys
import easyocr
import re
from pathlib import Path

print("\n🔧 OCR 엔진 초기화 중... (처음 실행 시 모델 다운로드 1~2분)\n")
reader = easyocr.Reader(['ko', 'en'], gpu=False)


def ocr_raw(image_path):
    results = reader.readtext(image_path)
    return results


def test_plate(image_path):
    print(f"🔍 [번호판] 인식 중... ({Path(image_path).name})\n")
    results = ocr_raw(image_path)

    print("📋 인식된 텍스트 전체:")
    for (_, text, conf) in results:
        print(f"  [{conf:.2f}] {text}")

    plate_pattern = re.compile(r'(\d{2,3})\s*([가-힣])\s*(\d{4})')
    candidates = []
    for (_, text, conf) in results:
        m = plate_pattern.search(text.replace(' ', ''))
        if m:
            plate = f"{m.group(1)}{m.group(2)} {m.group(3)}"
            candidates.append((plate, conf))

    print()
    if candidates:
        best = max(candidates, key=lambda x: x[1])
        print(f"✅ 번호판: {best[0]}  (신뢰도: {best[1]:.2f})")
    else:
        print("⚠️  번호판 패턴 못 찾음 — 위 텍스트 목록 확인")


def test_odometer(image_path):
    print(f"🔍 [주행거리] 인식 중... ({Path(image_path).name})\n")
    results = ocr_raw(image_path)

    print("📋 인식된 텍스트 전체:")
    for (_, text, conf) in results:
        print(f"  [{conf:.2f}] {text}")

    # 숫자만 추출 (4~6자리 = km 수치)
    candidates = []
    for (_, text, conf) in results:
        clean = re.sub(r'[^\d]', '', text)
        if 4 <= len(clean) <= 6:
            candidates.append((int(clean), conf))

    print()
    if candidates:
        best = max(candidates, key=lambda x: x[1])
        print(f"✅ 주행거리: {best[0]:,} km  (신뢰도: {best[1]:.2f})")
    else:
        print("⚠️  주행거리 숫자 못 찾음 — 위 텍스트 목록 확인")


def test_vin(image_path):
    print(f"🔍 [차대번호] 인식 중... ({Path(image_path).name})\n")
    results = ocr_raw(image_path)

    print("📋 인식된 텍스트 전체:")
    for (_, text, conf) in results:
        print(f"  [{conf:.2f}] {text}")

    # VIN: 17자리 영문+숫자
    vin_pattern = re.compile(r'[A-HJ-NPR-Z0-9]{17}')
    candidates = []
    for (_, text, conf) in results:
        clean = text.replace(' ', '').upper()
        m = vin_pattern.search(clean)
        if m:
            candidates.append((m.group(), conf))

    print()
    if candidates:
        best = max(candidates, key=lambda x: x[1])
        print(f"✅ 차대번호(VIN): {best[0]}  (신뢰도: {best[1]:.2f})")
    else:
        print("⚠️  VIN 패턴(17자리) 못 찾음 — 위 텍스트 목록 확인")


if __name__ == "__main__":
    tests = [
        ("/Users/isuo/Downloads/IMG_5720.jpg", "plate"),
        ("/Users/isuo/Downloads/IMG_5721.jpg", "odometer"),
        ("/Users/isuo/Downloads/IMG_5722.jpg", "vin"),
    ]

    for path, t in tests:
        print("\n" + "="*50)
        if t == "plate":
            test_plate(path)
        elif t == "odometer":
            test_odometer(path)
        elif t == "vin":
            test_vin(path)
        print()
