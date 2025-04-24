# backend/asr/service.py

from fastapi import WebSocket, WebSocketDisconnect, APIRouter
import numpy as np

from backend.asr.model_manager import model_manager
from backend.asr.schemas import ModelRegister
from backend.db.database import delete_model_from_db, get_models_from_db

router = APIRouter()

@router.post("/models/register")
def register_model(model: ModelRegister):
    model_id = model_manager.register(model)

    model_manager.models[model_id] = {
        "info": model,
        "instance": None,
        "loaded": False,
        "latency": None,
    }

    return {"status": "registered", "model_id": model_id}

@router.post("/models/load/{model_id}")
def load_model(model_id: str):
    model_manager.load_model(model_id)
    return {"status": "loaded", "model_id": model_id}

@router.post("/models/unload/{model_id}")
def unload_model(model_id: str):
    if model_id in model_manager.models:
        result = model_manager.unload_model(model_id)

        return {
            "status": "success" if result else "skipped",
            "message": "모델 언로드 완료" if result else "이미 언로드 상태 또는 오류 발생",
            "model_id": model_id
        }
    return {
        "status": "error",
        "message": "존재하지 않는 모델입니다.",
        "model_id": model_id
    }

@router.get("/models")
def list_models():
    models = get_models_from_db()

    for model in models:
        if "logo" in model:
            model["logo"] = f"{model['logo']}"  # 경로 자동 설정
        else:
            model["logo"] = "/static/icons/default.svg"  # 기본 로고 설정

    return models

@router.websocket("/ws/inference/{model_id}")
async def websocket_inference(websocket: WebSocket, model_id: str):
    origin = websocket.headers.get("Origin")
    
    print(f"[INFO] WebSocket 연결 요청: {model_id} (Origin: {origin})")
    await websocket.accept()

    if model_id not in model_manager.models:
        await websocket.send_text("error: 모델이 존재하지 않습니다.")
        await websocket.close()
        return
    
    model_entry = model_manager.models[model_id]
    if not model_entry.get("loaded") or model_entry["instance"] is None:
        await websocket.send_text("error: 모델이 로드되지 않았습니다.")
        await websocket.close()
        return
    
    model = model_entry["instance"]

    print(f"[INFO] WebSocket 연결 승인: {model_id}")

    try:
        while True:
            audio_chunk = await websocket.receive_bytes()
            np_audio = np.frombuffer(audio_chunk, dtype=np.float32)

            result_text = model.generate(np_audio, language="<|ko|>")
            await websocket.send_text(result_text)
    except WebSocketDisconnect:
        print(f"[INFO] WebSocket 연결 종료: {model_id}")

@router.delete("/models/{model_id}")
def delete_model(model_id: str):
    if model_id in model_manager.models:
        del model_manager.models[model_id]

    delete_model_from_db(model_id)

    return {"status": "deleted", "model_id": model_id}
