# backend/db/database.py

import pymysql
from .config import DB_CONFIG
from datetime import datetime

from backend.utils.encryption import encrypt

def get_connection():
    return pymysql.connect(**DB_CONFIG)

def save_result_to_db(model_name: str, text: str, language: str = 'ko'):
    conn = None
    try:
        conn = pymysql.connect(**DB_CONFIG)
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO asr_records (model, transcription, language, created_at)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(sql, (model_name, text, language, datetime.now()))
        conn.commit()
        print("\033[94m" + "[DB] 결과가 저장되었습니다.\n")
    except Exception as e:
        print("\033[91m" + f"[ERROR] {e}" + "\033[0m")
    finally:
        if conn:
            conn.close()

def _get_logo_by_model_name(model_name: str):
    """ 모델 이름을 기반으로 자동으로 로고 설정 """
    logo_map = {
        "OpenAI": "OpenAI.svg",
        "PyTorch": "PyTorch.svg",
        "Meta": "Meta.svg",
        "TensorFlow": "Tensorflow.svg",
        "Google": "Transformer.svg"
    }
    return f"/static/icons/{logo_map.get(model_name, 'default.svg')}"  # 백엔드 이미지 URL 반환


def save_model_to_db(model_id, model_info, latency=None):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO models (id, name, type, framework, device, language, path, endpoint, region, apiKey, status, loaded, latency, created_at, logo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            encrypted_apiKey = encrypt(model_info.apiKey) if model_info.apiKey else None
            cursor.execute(sql, (
                model_id,
                model_info.name,
                model_info.type,
                model_info.framework,
                model_info.device,
                model_info.language,
                model_info.path,
                model_info.endpoint,
                model_info.region,
                encrypted_apiKey,
                model_info.status,
                0,  # loaded

                latency if latency else None,
                datetime.now(),
                _get_logo_by_model_name(model_info.type)
            ))
        conn.commit()
        print("\033[94m" + "[DB] 모델 정보가 저장되었습니다.\n")
    except Exception as e:
        print("\033[91m" + f"[ERROR] {e}" + "\033[0m")
    finally:
        if conn:
            conn.close()

def delete_model_from_db(model_id: str):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = "DELETE FROM models WHERE id = %s"
            cursor.execute(sql, (model_id,))
        conn.commit()
        print("\033[94m" + "[DB] 모델이 삭제되었습니다.\n")
    except Exception as e:
        print("\033[91m" + f"[ERROR] {e}" + "\033[0m")
    finally:
        if conn:
            conn.close()

def update_model_loaded_status(model_id: str, loaded: bool, latency: float = None):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = """
                UPDATE models
                SET loaded = %s, latency = %s
                WHERE id = %s
            """
            cursor.execute(sql, (int(loaded), latency, model_id))
        conn.commit()
        print("\033[94m" + "[DB] 모델 상태가 업데이트 되었습니다.\n")
    except Exception as e:
        print("\033[91m" + f"[ERROR] {e}" + "\033[0m")
    finally:
        if conn:
            conn.close()

def update_model_status(model_id: str, status: str):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = """
                UPDATE models
                SET status = %s
                WHERE id = %s
            """
            cursor.execute(sql, (status, model_id))
        conn.commit()
        print("\033[94m" + f"[DB] 모델 상태가 '{status}로 변경되었습니다.")
    except Exception as e:
        print("\033[91m" + f"[ERROR] {e}" + "\033[0m")
    finally:
        if conn:
            conn.close()

def get_models_from_db():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT id, name, type, framework, device, language, path, endpoint, region, apiKey, status, loaded, latency, created_at, logo FROM models
            """
            cursor.execute(sql)
            models = cursor.fetchall()
        return models  # 최신 모델 리스트 반환
    except Exception as e:
        print("\033[91m" + f"[ERROR] {e}" + "\033[0m")
        return []
    finally:
        if conn:
            conn.close()