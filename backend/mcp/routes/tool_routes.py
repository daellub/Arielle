# backend/mcp/routes/tool_routes.py
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List
from backend.db.database import get_connection

import subprocess
import shlex
import urllib.parse

router = APIRouter(prefix="/api")

# ──────── Pydantic Models ────────

class ToolIn(BaseModel):
    name: str
    type: str
    command: str
    status: str
    enabled: bool

class ToolOut(ToolIn):
    id: int

# ──────── CRUD Endpoints ────────

@router.get("/tools", response_model=List[ToolOut])
async def get_tools():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM mcp_tools")
            rows = cursor.fetchall()
            return [ToolOut(
                id=row[0],
                name=row[1],
                type=row[2],
                command=row[3],
                status=row[4],
                enabled=row[5]
            ) for row in rows]
    finally:
        conn.close()

@router.post("/tools", response_model=ToolOut)
async def create_tool(tool: ToolIn):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO mcp_tools (name, type, command, status, enabled)
                VALUES (%s, %s, %s, %s, %s)
            """, (tool.name, tool.type, tool.command, tool.status, tool.enabled))
            conn.commit()
            return ToolOut(id=cur.lastrowid, **tool.dict())
    finally:
        conn.close()

@router.patch("/tools/{tool_id}", response_model=ToolOut)
async def update_tool(tool_id: int, tool: ToolIn):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE mcp_tools
                SET name=%s, type=%s, command=%s, status=%s, enabled=%s
                WHERE id=%s
            """, (tool.name, tool.type, tool.command, tool.status, tool.enabled, tool_id))
            conn.commit()
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Tool not found")
            return ToolOut(id=tool_id, **tool.dict())
    finally:
        conn.close()

@router.delete("/tools/{tool_id}", status_code=204)
async def delete_tool(tool_id: int):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM mcp_tools WHERE id = %s", (tool_id,))
            conn.commit()
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Tool not found")
    finally:
        conn.close()

# ──────── Tools ────────
@router.get("/tools/python")
async def execute_python_script(command: str = Query(..., description="Python command to execute")):
    try:
        # URL 디코딩
        decoded_command = urllib.parse.unquote(command)

        result = subprocess.run(
            ['python', '-c', decoded_command],
            text=True, capture_output=True, check=True
        )
        return {"result": result.stdout.strip()}
    except subprocess.CalledProcessError as e:
        return {"error": f"Execution failed: {e.stderr}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}

@router.get("/tools/powershell")
async def execute_powershell_script(command: str = Query(..., description="PowerShell command to execute")):
    try:
        result = subprocess.run(
            ['powershell', '-Command', command],
            text=True, capture_output=True, check=True
        )
        return {"result": result.stdout}
    except subprocess.CalledProcessError as e:
        return {"error": f"Execution failed: {e.stderr}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}