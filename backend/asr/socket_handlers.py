# backend/asr/socket_handlers.py

import asyncio
import azure.cognitiveservices.speech as speechsdk
import numpy as np

from backend.sio import sio
from backend.asr.model_manager import model_manager
from backend.utils.encryption import decrypt

# sid별 SpeechRecognizer 저장
recognizers = {}

# Whisper / HuggingFace용 로컬 모델 처리 메커니즘
@sio.on('start_transcribe')
async def start_transcribe(sid, data):
    print(f"[DEBUG] ▶ start_transcribe called: sid={sid}, data={data}")
    model_id = data.get("model_id")

    if model_id not in model_manager.models:
        return await sio.emit('transcript', {'text': '❌ 모델을 찾을 수 없습니다.'}, room=sid)
    
    model = model_manager.models[model_id]["instance"]
    if model is None:
        await sio.emit('transcript', {'text': '❌ 모델이 로드되지 않았습니다.'}, to=sid)
        return
    
    await sio.save_session(sid, {'model_id': model_id})

    await sio.emit('transcript', {'text': '🎙 전사 준비 완료'}, to=sid)

# Azure API용 모델 메커니즘
@sio.on('start_azure_mic')
async def start_azure_mic(sid, data):
    print(f'[SOCKET] start_azure_mic 요청 받음 from {sid}')
    model_id = data.get('model_id')

    if not model_id or model_id not in model_manager.models:
        await sio.emit('transcript', {'text': '❌ 모델을 찾을 수 없습니다.'}, to=sid)
        return

    entry = model_manager.models[model_id]
    instance = entry["instance"]
    info = entry["info"]
    framework = info.framework.lower()

    if instance is None and framework != 'azure':
        await sio.emit('transcript', {'text': '❌ 모델이 로드되지 않아 사용할 수 없습니다.'}, to=sid)
        return  
    
    try:
        info.apiKey = decrypt(info.apiKey)
    except Exception as e:
        await sio.emit('transcript', {'text': f'❌ API Key 복호화 실패: {e}'}, to=sid)
        return
    
    await recognized_from_microphone(sid, info)

async def recognized_from_microphone(sid: str, model_info):
    apiKey = model_info.apiKey
    endpoint = model_info.endpoint
    region = model_info.region

    if not apiKey:
        raise ValueError('❌ API Key가 없습니다.')
    
    if endpoint:
        speech_config = speechsdk.SpeechConfig(subscription=apiKey, endpoint=endpoint)
    elif region:
        speech_config = speechsdk.SpeechConfig(subscription=apiKey, region=region)
    else:
        raise ValueError("❌ 엔드포인트와 리전이 모두 없습니다.")
    
    speech_config.speech_recognition_language = 'ko-KR'

    audio_config = speechsdk.audio.AudioConfig(use_default_microphone=True)
    speech_recognizer = speechsdk.SpeechRecognizer(
        speech_config=speech_config,
        audio_config=audio_config
    )

    loop = asyncio.get_running_loop()
    done_future = loop.create_future()

    recognizers[sid] = speech_recognizer

    def recognizing_cb(evt):
        text = evt.result.text
        if text:
            print(f'[Recognizing] {text}')
    
    def recognized_cb(evt):
        text = evt.result.text
        if text:
            print(f'[Recognized] {text}')
            asyncio.run_coroutine_threadsafe(
                sio.emit('transcript', {'text': text}, to=sid),
                loop
            )

    def session_stopped_cb(evt):
        print('[Session Stopped]')
        if not done_future.done():
            loop.call_soon_threadsafe(done_future.set_result, True)

    def canceled_cb(evt):
        print('[Canceled]', evt)
        if not done_future.done():
            loop.call_soon_threadsafe(done_future.set_result, True)
    
    speech_recognizer.recognizing.connect(recognizing_cb)
    speech_recognizer.recognized.connect(recognized_cb)
    speech_recognizer.session_stopped.connect(session_stopped_cb)
    speech_recognizer.canceled.connect(canceled_cb)

    print("🎙 Azure 마이크 인식 시작")
    await sio.emit('transcript', {'text': '🎙 Azure STT 스트리밍 준비 완료'}, to=sid)

    speech_recognizer.start_continuous_recognition()
    await done_future
    speech_recognizer.stop_continuous_recognition()
    print("🎙 Azure 마이크 인식 종료")

    if sid in recognizers:
        del recognizers[sid]

@sio.on('audio_chunk')
async def audio_chunk(sid, data):
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

@sio.on('stop_transcribe')
async def stop_transcribe(sid):
    print(f'[SOCKET] stop_transcribe 요청 받음 from {sid}')

# Azure 전사 중단
@sio.on('stop_azure_mic')
async def stop_azure_mic(sid, data):
    print(f'[SOCKET] stop_azure_mic 요청 받음 from {sid}')
    recognizer = recognizers.get(sid)
    if recognizer:
        recognizer.stop_continuous_recognition()
        print(f"[INFO] SpeechRecognizer 중지 완료 for {sid}")
        del recognizers[sid]
    else:
        print(f"[WARN] stop_azure_mic: recognizer 없음 for {sid}")