# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio

from backend.asr.service import router as asr_router

sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=['http://localhost:3000'],
    allow_upgrades=True
)

fastapi_app = FastAPI(title="Arielle AI Backend Server")

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fastapi_app.mount("/static", StaticFiles(directory="backend/static"), name="static")
fastapi_app.include_router(asr_router, prefix="/asr", tags=["ASR"])

app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)

@sio.event
async def connect(sid, environ):
    print(f"[SOCKET.IO] 클라이언트 연결됨: {sid}")

@sio.event
async def disconnect(sid):
    print(f"[SOCKET.IO] 클라이언트 연결 해제됨: {sid}")

# 서버에 이벤트 추가
@sio.event
async def hello(sid, data):
    print('[SOCKET] hello 수신:', data)
    await sio.emit('hello_response', {'message': '안녕 클라이언트야'}, to=sid)


@fastapi_app.get("/")
def root():
    return {"message": "Arielle Backend Running!"}