# backend/asr/socket_handlers.py

from backend.asr.model_manager import model_manager
import numpy as np
import socketio

from backend.sio import sio

print("[DEBUG] socket_handlers.sio id:", id(sio))

@sio.on("start_transcribe")
async def start_transcribe(sid, data):
    model_id = data.get('model_id')
    print("[SOCKET] 트랜스크라이브 요청 들어옴")
    print("모델 ID:", model_id)

    if model_id not in model_manager.models:
        await sio.emit('transcript', {'text': '❌ 모델을 찾을 수 없습니다.'}, to=sid)
        return

    model = model_manager.models[model_id]['instance']
    if model is None:
        await sio.emit('transcript', {'text': '❌ 모델이 로드되지 않았습니다.'}, to=sid)
        return

    await sio.save_session(sid, {'model_id': model_id})

    await sio.emit('transcript', {'text': '🎙 전사 준비 완료'}, to=sid)

@sio.on('audio_chunk')
async def handle_audio_chunk(sid, data):
    print(f"[DEBUG] 오디오 수신 길이: {len(data)}")
    session = await sio.get_session(sid)
    model_id = session.get("model_id")

    if not model_id or model_id not in model_manager.models:
        await sio.emit('transcript', {'text': '⚠️ 유효하지 않은 모델입니다.'},  to=sid)
        return
    
    try:
        audio_np = np.array(data, dtype=np.float32)

        texts = model_manager.infer(model_id, audio_np, language="<|ko|>")
        print("[DEBUG] 전사 결과: ", texts)
        if texts:
            await sio.emit('transcript', {'text': texts[0]}, to=sid)
    except Exception as e:
        print(f"[ERROR] audio_chunk 처리 중 오류: {e}")
        await sio.emit('transcript', {'text': '❌ 전사 실패'}, to=sid)