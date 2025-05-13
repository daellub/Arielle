# backend/mcp/routes/llm_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, model_validator
from typing import Optional

router = APIRouter()

class LLMModelIn(BaseModel):
    name: str
    endpoint: str
    type: str
    framework: Optional[str] = None
    status: str = 'inactive'
    enabled: bool = True
    apiKey: Optional[str] = None
    token: Optional[str] = None

    class Config:
        from_attributes = True

    @model_validator(mode='before')
    def check_status(cls, values):
        status = values.get('status')
        if status not in ['active', 'inactive']:
            raise ValueError('status must be either "active" or "inactive"')
        return values
    
class LLMModelOut(LLMModelIn):
    id: int

@router.get("/llm/models")
async def get_llm_models():
    try:
        from backend.db.database import get_llm_models_from_db
        models = get_llm_models_from_db()
        return {"models": [LLMModelOut(**m) for m in models]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"모델 조회 실패: {str(e)}")

@router.post("/llm/model")
async def register_llm_model(model_info: LLMModelIn):
    try:
        from backend.db.database import save_llm_model_to_db
        model_id = save_llm_model_to_db(model_info)
        return {"message": "LLM 모델 등록 성공", "model_id": model_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM 모델 등록 실패: {str(e)}")

@router.patch("/llm/model/{model_id}")
async def update_llm_model(model_id: str, model_info: LLMModelIn):
    try:
        print(f"Received model info: {model_info}")
        from backend.db.database import update_llm_model_in_db
        update_llm_model_in_db(model_id, model_info)
        return {"message": "LLM 모델 업데이트 성공"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM 모델 업데이트 실패: {str(e)}")
    
@router.delete("/llm/model/{model_id}")
async def delete_llm_model(model_id: int):
    try:
        from backend.db.database import delete_llm_model_from_db
        delete_llm_model_from_db(model_id)
        return {"message": "LLM 모델 삭제 성공"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM 모델 삭제 실패: {str(e)}")