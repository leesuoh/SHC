"""
SHC OCR Service — FastAPI + OpenAI GPT-4o-mini
2-pass 교차검증으로 정확도 향상
"""
import os, base64, json, asyncio
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SHC OCR Service", version="2.0.0")

_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:4173",
    "http://172.17.129.18:5174",
    os.getenv("FRONTEND_URL", ""),
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in _origins if o],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class PlateResult(BaseModel):
    plate_number: str
    confidence: float

class VinResult(BaseModel):
    model: str | None = None
    year: int | None = None
    vin: str | None = None
    last_6: str | None = None
    fuel_type: str | None = None
    confidence: float

class OdometerResult(BaseModel):
    mileage: int
    confidence: float


async def image_to_b64(file: UploadFile) -> tuple[str, str]:
    data = await file.read()
    b64 = base64.b64encode(data).decode()
    mime = file.content_type or "image/jpeg"
    return b64, mime


async def ask_once(prompt: str, b64: str, mime: str) -> dict:
    r = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}
        ]}],
        max_tokens=400,
        temperature=0,
    )
    raw = r.choices[0].message.content.strip()
    raw = raw.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(raw)


async def ask_with_verification(prompt: str, b64: str, mime: str, key: str) -> dict:
    r1, r2 = await asyncio.gather(
        ask_once(prompt, b64, mime),
        ask_once(prompt, b64, mime),
    )
    v1, v2 = r1.get(key), r2.get(key)
    if v1 == v2:
        return r1
    r3 = await ask_once(prompt, b64, mime)
    v3 = r3.get(key)
    votes = [v1, v2, v3]
    winner = max(set(votes), key=votes.count)
    for r, v in [(r1, v1), (r2, v2), (r3, v3)]:
        if v == winner:
            return r
    return r3


@app.get("/health")
async def health():
    return {"status": "ok", "service": "SHC OCR v2"}


@app.post("/ocr/plate", response_model=PlateResult)
async def ocr_plate(file: UploadFile = File(...)):
    b64, mime = await image_to_b64(file)
    prompt = """이 이미지는 한국 자동차 번호판입니다.
번호판에 적힌 번호를 정확하게 읽어주세요.
- 숫자와 한글 사이에 공백 1개 (예: "340다 1211")
- 이미지에 실제로 보이는 번호만 — 예시 번호를 절대 쓰지 말 것
JSON만 응답: {"plate_number": "실제번호", "confidence": 0.97}"""
    try:
        result = await ask_with_verification(prompt, b64, mime, "plate_number")
        return PlateResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR 실패: {e}")


@app.post("/ocr/vin", response_model=VinResult)
async def ocr_vin(file: UploadFile = File(...)):
    b64, mime = await image_to_b64(file)
    prompt = """이 이미지는 자동차 VIN(차대번호) 스티커입니다.
스티커에 실제로 인쇄된 정보를 읽어주세요.
⚠️ VIN은 반드시 17자리 (영문+숫자, I·O·Q 제외)
⚠️ 숫자 0과 O, 숫자 1과 I/L 혼동 금지
⚠️ 마지막 6자리(일련번호)가 가장 중요
⚠️ 이미지에 실제로 보이는 내용만 — 예시를 절대 쓰지 말 것
⚠️ 읽을 수 없는 항목은 null
JSON만 응답: {"model": "차명", "year": 연식숫자, "vin": "17자리VIN", "last_6": "마지막6자리", "fuel_type": "gasoline|diesel|lpg|ev|hybrid", "confidence": 0.95}"""
    try:
        result = await ask_with_verification(prompt, b64, mime, "vin")
        return VinResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR 실패: {e}")


@app.post("/ocr/odometer", response_model=OdometerResult)
async def ocr_odometer(file: UploadFile = File(...)):
    b64, mime = await image_to_b64(file)
    prompt = """이 이미지는 자동차 계기판입니다.
주행거리(km) 숫자를 정확하게 읽어주세요.
- 숫자만 읽을 것 (단위 km 제외)
- 이미지에 실제로 보이는 숫자만 — 예시 숫자를 절대 쓰지 말 것
- 읽을 수 없으면 mileage: 0, confidence: 0.0
JSON만 응답: {"mileage": 실제숫자, "confidence": 0.95}"""
    try:
        result = await ask_with_verification(prompt, b64, mime, "mileage")
        return OdometerResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR 실패: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
