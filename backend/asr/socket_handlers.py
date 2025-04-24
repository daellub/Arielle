# backend/asr/socket_handlers.py

from backend.asr.model_manager import model_manager
import numpy as np
import socketio

sio = socketio.AsyncServer()

@sio.event
async def start_transcribe(sid, data):
    model_id = data.get('model_id')
    print(f"[SOCKET] 트랜스크라이브 시작 요청: {model_id}")

    if model_id not in model_manager.models:
        await sio.emit('transcript', {'text': '❌ 모델을 찾을 수 없습니다.'}, to=sid)
        return

    model = model_manager.models[model_id]['instance']
    if model is None:
        await sio.emit('transcript', {'text': '❌ 모델이 로드되지 않았습니다.'}, to=sid)
        return

    # 💡 여기에 오디오 데이터 처리 및 transcript emit 로직 추가 예정
    await sio.emit('transcript', {'text': '🧪 테스트용 트랜스크립트입니다.'}, to=sid)