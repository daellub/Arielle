# backend/llm/service.py

import requests
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import List, Literal

import httpx
import json
from pathlib import Path
import re

from backend.db.database import save_llm_interaction, save_llm_feedback
from backend.llm.emotion.service import analyze_emotion

router = APIRouter()

def load_system_prompt() -> str:
    return Path("backend/llm/prompt/arielle_prompt.txt").read_text(encoding="utf-8")

def clean_text(text: str) -> str:
    return re.sub(r'\*.*?\*', '', text).strip()

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    max_tokens: int = Field(96, ge=1, le=1024)
    temperature: float = Field(0.85, ge=0.0, le=2.0)
    top_k: int = Field(40, ge=0)
    top_p: float = Field(0.9, ge=0.0, le=1.0)
    repeat_penalty: float = Field(1.1, ge=1.0, le=2.0)

@router.post("/chat")
async def chat(req: ChatRequest):
    user_messages = [
        {"role": m.role, "content": m.content}
        for m in req.messages
    ]
    
    payload = {
        "model": "arielle-q6",
        "messages": [
            {"role": "system", "content": load_system_prompt()}
        ] + user_messages,
        "max_tokens": req.max_tokens,
        "temperature": req.temperature,
        "top_k": req.top_k,
        "top_p": req.top_p,
        "repeat_penalty": req.repeat_penalty,
        "stop": ["User:"],
        "stream": False
    }

    try:
        res = requests.post("http://localhost:8080/v1/chat/completions", json=payload)
        res.raise_for_status()
        data = res.json()
        content = data["choices"][0]["message"]["content"]
        return {"content": clean_text(content)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM 서버 요청 실패: {e}")

@router.websocket('/ws/chat')
async def websocket_chat(ws: WebSocket):
    await ws.accept()

    try:
        while True:
            data = await ws.receive_json()
            msgs = data.get('messages', [])
            opts = {
                "max_tokens": data.get("max_tokens", 96),
                "temperature": data.get("temperature", 0.85),
                "top_k": data.get("top_k", 40),
                "top_p": data.get("top_p", 0.9),
                "repeat_penalty": data.get("repeat_penalty", 1.1),
            }

            prompt = [{"role": "system", "content": load_system_prompt()}] + msgs
            payload = {
                "model": "arielle-q6",
                "messages": prompt,
                "stream": True,
                **opts
            }

            stream_text = ""
            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream("POST", "http://localhost:8080/v1/chat/completions", json=payload) as res:
                    async for line in res.aiter_lines():
                        if line.startswith("data: "):
                            content = line.removeprefix("data: ")
                            if content.strip() == "[DONE]":
                                break
                            try:
                                chunk = json.loads(content)
                                delta = chunk["choices"][0]["delta"].get("content", "")
                                stream_text += delta
                                await ws.send_text(delta)
                            except Exception as e:
                                print(f"[ERROR] JSON decode 실패: {e}")
                                continue

            try:
                async with httpx.AsyncClient() as client:
                    ko_res = await client.post("http://localhost:8000/api/translate", json={
                        "text": stream_text,
                        "from_lang": "en",
                        "to": "ko"
                    })
                    ko_translation = ko_res.json().get("translated", "")

                    ja_res = await client.post("http://localhost:8000/api/translate", json={
                        "text": stream_text,
                        "from_lang": "en",
                        "to": "ja"
                    })
                    ja_translation = ja_res.json().get("translated", "")

                emo_data = await analyze_emotion(stream_text)
                emotion = emo_data.get("emotion", "neutral")
                tone = emo_data.get("tone", "neutral")

                interaction_id = save_llm_interaction(
                    model_name="arielle-q6",
                    request=msgs[-1]["content"],
                    response=stream_text.strip(),
                    translate_response=ko_translation,
                    ja_translate_response=ja_translation,
                    emotion=emotion,
                    tone=tone
                )

                print("[✅ WebSocket 번역 결과]", {
                    "id": interaction_id,
                    "ko": ko_translation,
                    "ja": ja_translation
                })
                await ws.send_json({
                    "type": "interaction_id",
                    "id": interaction_id,
                    "translated": ko_translation,
                    "ja_translated": ja_translation,
                    "emotion": emotion,
                    "tone": tone
                })

            except Exception as e:
                print(f"[ERROR] 번역 또는 DB 저장 실패: {e}")
        
    except WebSocketDisconnect:
        print("[WS] 클라이언트 연결 종료")
    except Exception as e:
        print(f"[WS ERROR]: {e}")
        await ws.close()

class FeedbackRequest(BaseModel):
    interaction_id: int
    rating: Literal['up', 'down'] | None = None
    tone_score: float = Field(..., ge=0.0, le=1.0)

@router.post("/feedback")
async def save_feedback(req: FeedbackRequest):
    try:
        save_llm_feedback(
            interaction_id=req.interaction_id,
            rating=req.rating,
            tone_score=req.tone_score
        )
        return {"message": "피드백 저장 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"피드백 저장 실패: {e}")