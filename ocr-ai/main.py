import os
import base64
import json
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SHC OCR Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080",
                   os.getenv("FRONTEND_URL", "")],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# ── 응답 모델 ──

class PlateResult(BaseModel):
    plate_number: str
    confidence: float

class VinResult(BaseModel):
    model: str | None = None
    year: int | None = None
    vin: str | None = None
    fuel_type: str | None = None
    confidence: float

class OdometerResult(BaseModel):
    mileage: int
    confidence: float


# ── 공통: 이미지 → base64 ──

async def image_to_base64(file: UploadFile) -> str:
    content = await file.read()
    return base64.b64encode(content).decode("utf-8")


async def ask_vision(prompt: str, image_b64: str, media_type: str = "image/jpeg") -> str:
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {
                    "url": f"data:{media_type};base64,{image_b64}"
                }}
            ]
        }],
        max_tokens=300,
    )
    return response.choices[0].message.content


# ── 엔드포인트 ──

@app.get("/health")
async def health():
    return {"status": "ok", "service": "SHC OCR"}


@app.post("/ocr/plate", response_model=PlateResult)
async def ocr_plate(file: UploadFile = File(...)):
    """
    번호판 이미지 → 차량 번호 추출
    반환: { "plate_number": "12가 3456", "confidence": 0.95 }
    """
    image_b64 = await image_to_base64(file)

    prompt = """이 이미지는 한국 자동차 번호판입니다.
번호판에 적힌 차량 번호를 정확히 읽어주세요.

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"plate_number": "12가 3456", "confidence": 0.95}

- plate_number: 번호판 숫자와 한글을 공백으로 구분 (예: "12가 3456", "서울 12가 3456")
- confidence: 인식 신뢰도 0.0~1.0
- 번호판을 읽을 수 없으면: {"plate_number": "", "confidence": 0.0}"""

    try:
        raw = await ask_vision(prompt, image_b64, file.content_type or "image/jpeg")
        # JSON 파싱 (마크다운 코드블록 제거)
        raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(raw)
        return PlateResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR 처리 실패: {str(e)}")


@app.post("/ocr/vin", response_model=VinResult)
async def ocr_vin(file: UploadFile = File(...)):
    """
    VIN 스티커 이미지 → 차종/연식/차대번호 추출
    반환: { "model": "현대 아반떼", "year": 2021, "vin": "KMHD...", "fuel_type": "gasoline" }
    """
    image_b64 = await image_to_base64(file)

    prompt = """이 이미지는 자동차 VIN(차대번호) 스티커입니다.
스티커에서 다음 정보를 추출해주세요.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "model": "현대 아반떼 CN7",
  "year": 2021,
  "vin": "KMHD241ABNU123456",
  "fuel_type": "gasoline",
  "confidence": 0.9
}

- model: 제조사 + 차종명 (한국어)
- year: 연식 (숫자)
- vin: 17자리 차대번호 (영문+숫자)
- fuel_type: "gasoline" | "diesel" | "lpg" | "ev" | "hybrid" 중 하나
- 읽을 수 없는 항목은 null로 설정
- confidence: 전체 인식 신뢰도 0.0~1.0"""

    try:
        raw = await ask_vision(prompt, image_b64, file.content_type or "image/jpeg")
        raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(raw)
        return VinResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR 처리 실패: {str(e)}")


@app.post("/ocr/odometer", response_model=OdometerResult)
async def ocr_odometer(file: UploadFile = File(...)):
    """
    계기판 이미지 → 주행거리(km) 추출
    반환: { "mileage": 42180, "confidence": 0.92 }
    """
    image_b64 = await image_to_base64(file)

    prompt = """이 이미지는 자동차 계기판(odometer)입니다.
주행거리(km)를 정확히 읽어주세요.

반드시 아래 JSON 형식으로만 응답하세요:
{"mileage": 42180, "confidence": 0.92}

- mileage: 주행거리 숫자만 (단위 제외, 정수)
- confidence: 인식 신뢰도 0.0~1.0
- 읽을 수 없으면: {"mileage": 0, "confidence": 0.0}"""

    try:
        raw = await ask_vision(prompt, image_b64, file.content_type or "image/jpeg")
        raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result = json.loads(raw)
        return OdometerResult(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR 처리 실패: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
