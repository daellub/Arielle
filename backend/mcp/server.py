# backend/mcp/server.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.mcp.routes.servers import router as servers_router
from backend.mcp.routes.llm_routes import router as llm_router
from backend.mcp.routes.data_routes import router as data_router
from backend.mcp.routes.prompt_routes import router as prompt_router

app = FastAPI(title="Arielle MCP Control Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(servers_router, prefix="/mcp", tags=["MCP"])
app.include_router(llm_router, prefix="/mcp", tags=["LLM"])
app.include_router(data_router, prefix="/mcp", tags=["Data"])
app.include_router(prompt_router, prefix="/mcp", tags=["Prompt"])
