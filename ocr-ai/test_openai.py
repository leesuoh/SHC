"""
SHC OCR 테스트 — OpenAI GPT-4o-mini (2회 교차검증)
"""
import base64, json, os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

PLATE_PROMPT = """한국 자동차 번호판 이미지입니다. 번호를 읽어주세요.
JSON만 응답: {"plate_number": "340다 1211", "confidence": 0.97}"""

VIN_PROMPT = """자동차 VIN(차대번호) 스티커 이미지입니다.
⚠️ VIN은 정확히 17자리입니다. 한 글자씩 천천히 읽어주세요.
특히 마지막 6자리 일련번호가 가장 중요합니다.
숫자 0과 알파벳 O, 숫자 1과 알파벳 I/L을 혼동하지 마세요.
JSON만 응답: {"model": "차명", "year": 2015, "vin": "KMFZS77KAGU237850", "last_6": "237850", "confidence": 0.95}
읽을 수 없는 항목은 null"""

def ask(prompt, image_path):
    img = base64.b64encode(Path(image_path).read_bytes()).decode()
    ext = Path(image_path).suffix.lower().lstrip(".")
    mime = {"jpg":"image/jpeg","jpeg":"image/jpeg","png":"image/png","heic":"image/heic","heif":"image/heif"}.get(ext,"image/jpeg")
    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role":"user","content":[
            {"type":"text","text":prompt},
            {"type":"image_url","image_url":{"url":f"data:{mime};base64,{img}"}}
        ]}],
        max_tokens=300,
    )
    raw = r.choices[0].message.content.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)

def run(label, image_path, prompt, truth, key_field):
    print(f"\n{'='*55}")
    print(f"🔍 [{label}]  ({Path(image_path).name})")
    r1 = ask(prompt, image_path)
    r2 = ask(prompt, image_path)
    v1, v2 = r1.get(key_field,""), r2.get(key_field,"")
    print(f"  1회: {v1}")
    print(f"  2회: {v2}")
    if v1 == v2:
        final = v1
        print(f"✅ 확정 (2회 일치): {final}")
    else:
        print(f"⚠️  불일치 → 3회째...")
        r3 = ask(prompt, image_path)
        v3 = r3.get(key_field,"")
        print(f"  3회: {v3}")
        votes = [v1, v2, v3]
        final = max(set(votes), key=votes.count)
        print(f"✅ 확정 (다수결): {final}")
    match = "✅" if final == truth else f"❌ (실제: {truth})"
    print(f"   정답 비교: {match}")

# ── 테스트 목록 ──────────────────────────────────────────────
tests = [
    ("번호판 — 제네시스 GV80",   "/Users/isuo/Downloads/IMG_5728.jpg", PLATE_PROMPT, "340다 1211",         "plate_number"),
    ("VIN — 현대 포터 II",       "/Users/isuo/Downloads/IMG_5726.jpg", VIN_PROMPT,   "KMFZS77KAGU237850", "vin"),
    ("VIN — 혼다 어코드",         "/Users/isuo/Downloads/IMG_5727.jpg", VIN_PROMPT,   "JHMCM66504C200147", "vin"),
    ("VIN — 기아 (기울어진 사진)", "/Users/isuo/Downloads/IMG_5729.jpg", VIN_PROMPT,   "KNAPC813BCK239837", "vin"),
]

for args in tests:
    run(*args)

print(f"\n{'='*55}")
print("✔ 테스트 완료")
