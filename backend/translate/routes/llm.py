# backend/translate/routes/llm.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import AzureOpenAI
import os

router = APIRouter()

AZURE_OPENAI_URI = os.getenv("AZURE_OPENAI_URI")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_DEPLOYMENT = "gpt-35-turbo-instruct"
AZURE_OPENAI_VERSION = "2024-12-01-preview"

client = AzureOpenAI(
    api_version=AZURE_OPENAI_VERSION,
    azure_endpoint=AZURE_OPENAI_URI,
    api_key=AZURE_OPENAI_KEY,
)

class InterpretRequest(BaseModel):
    text: str

@router.post("/llm/paraphrase")
async def interpret_text(req: InterpretRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text는 비어 있을 수 없습니다")

    prompt = f'다음 문장을 감성적으로 자연스럽게 의역해줘:\n"{req.text}"'

    try:
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "다음 문장을 감성적으로 자연스럽게 의역해줘.",
                },
                {
                    "role": "user",
                    "content": req.text,
                }
            ],
            max_tokens=4096,
            temperature=1.0,
            top_p=1.0,
            model=AZURE_OPENAI_DEPLOYMENT
        )
        interpreted = response.choices[0].text.strip()
        return { "interpreted": interpreted }

    except Exception as e:
        print("[ERROR] LLM interpret failed:", e)
        raise HTTPException(status_code=500, detail="LLM 의역 실패")