# backend/asr/model_manager.py

import gc
import numpy as np
import openvino_genai
import time
import uuid

from backend.asr.schemas import ModelRegister
from backend.db.database import save_model_to_db, update_model_loaded_status, update_model_status

class ModelManager:
    def __init__(self):
        self.models = {}
        self._initialize_models()

    def _initialize_models(self):
        from backend.db.database import get_models_from_db
        models = get_models_from_db()
        for m in models:
            model_id = m['id']
            self.models[model_id] = {
                "info": ModelRegister(**m),
                "instance": None,
                "loaded": False,
                "latency": None
            }

            if m.get("loaded", False):
                try:
                    self.load_model(model_id)
                except Exception as e:
                    print(f"[ERROR] 서버 시작 시 모델 자동 로드 실패: {e}")

    def register(self, info):
        model_id = str(uuid.uuid4())
        self.models[model_id] = {
            "info": info,
            "instance": None,
            "loaded": False,
            "latency": None
        }

        save_model_to_db(model_id, info)
        return model_id
    
    def load_model(self, model_id):
        model = self.models.get(model_id)

        if not model:
            raise ValueError(f"모델 ID {model_id}에 해당하는 정보가 존재하지 않습니다.")
        
        print(f"[DEBUG] 모델 요청 ID: {model_id}")
        print(f"[DEBUG] 현재 등록된 모델들: {list(self.models.keys())}")

        fw = model["info"].framework
        path = model["info"].path
        device = model["info"].device

        try:
            if fw.lower() == "openvino":
                model["instance"] = openvino_genai.WhisperPipeline(path, device=device)
                print("모델이 로드되었습니다.")
            else:
                raise ValueError(f"현재 지원하지 않는 프레임워크입니다: {fw}")

            model["loaded"] = True
            model["latency"] = self._test_latency(model["instance"])

            update_model_loaded_status(model_id, True, model["latency"])

            update_model_status(model_id, "active")
        except Exception as e:
            model["loaded"] = False
            model["latency"] = None
            print(f"[ERROR] 모델 로딩 실패: {e}")

    def unload_model(self, model_id):
        model = self.models.get(model_id)

        if not model or not model["loaded"]:
            print(f"[INFO] 모델 {model_id}은 로드되어 있지 않거나 존재하지 않습니다.")
            return False

        try:
            fw = model["info"].framework

            if fw.lower() == "openvino":
                openvino_genai.openvino.shutdown()
                gc.collect()

                model["instance"] = None
                model["loaded"] = False
                model["latency"] = None

                update_model_loaded_status(model_id, False, None)

                update_model_status(model_id, "idle")

                print(f"[INFO] 요청한 모델 {model["info"].name}을 언로드 했습니다.")
                return True
            else:
                raise ValueError(f"허용되지 않은 접근입니다: {fw}")
        except Exception as e:
            print(f"[ERROR] 모델 언로딩 실패: {e}")
            return False

    def _test_latency(self, model):
        dummy = np.zeros((16000,), dtype=np.float32)
        start = time.perf_counter()
        model.generate(dummy, language="<|ko|>")
        end = time.perf_counter()
        return round((end - start) * 1000, 2)

    def get_status(self):
        return [
            {
                "id": k,
                "name": v["info"].name,
                "main": v["info"].main,
                "language": v["info"].language,
                "framework": v["info"].framework,
                "device": v["info"].device,
                "loaded": v["loaded"],
                "latency": v["latency"],
                "logo": v["info"].logo,
                "status": self._get_status(v)
            }
            for k, v in self.models.items()
        ]

    
    def _get_status(self, model):
        if not model["loaded"]:
            return "loading"
        if model["latency"] is None:
            return "error"
        return "idle"
    
    def infer(self, model_id, audio, language):
        model = self.models[model_id]["instance"]
        np_audio = np.array(audio, dtype=np.float32)
        result = model.generate(np_audio, language=language)
        return result.texts
    
model_manager = ModelManager()