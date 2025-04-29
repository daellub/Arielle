# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import socketio

from backend.sio import sio
from backend.asr.service import router as asr_router
import backend.asr.socket_handlers

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

app = socketio.ASGIApp(
    socketio_server=sio, 
    other_asgi_app=fastapi_app,
    socketio_path="/socket.io"    
)

@sio.event
async def connect(sid, environ):
    print(f"[SOCKET.IO] 클라이언트 연결됨: {sid}")

@sio.event
async def disconnect(sid):
    print(f"[SOCKET.IO] 클라이언트 연결 해제됨: {sid}")

@fastapi_app.get("/")
def root():
    return {"message": "Arielle Backend Running!"}