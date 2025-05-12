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
                INSERT INTO asr_models (id, name, type, framework, device, language, path, endpoint, region, apiKey, status, loaded, latency, created_at, logo)
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
            sql = "DELETE FROM asr_models WHERE id = %s"
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
                UPDATE asr_models
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
                UPDATE asr_models
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
                SELECT id, name, type, framework, device, language, path, endpoint, region, apiKey, status, loaded, latency, created_at, logo FROM asr_models
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

def save_log_to_db(log_type: str, message: str, source: str = 'SYSTEM'):
    conn = None
    try:
        print(f'[DEBUG] log_type={log_type}, source={source} ({len(source)}), message={message}')
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = "INSERT INTO asr_logs (type, source, message) VALUES (%s, %s, %s)"
            cursor.execute(sql, (log_type, source, message))
        conn.commit()
        print(f'[LOG] {log_type} | {source} | {message}')
    except Exception as e:
        print(f'[ERROR] 로그 저장 실패: {e}')
    finally:
        if conn:
            conn.close()

def save_translation_result(client_id: str, original: str, translated: str, target_lang: str, source_type: str):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO translation_results (client_id, original, translated, target_lang, source_type, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
            """
            cursor.execute(sql, (client_id, original, translated, target_lang, source_type))
        conn.commit()
        print("\033[94m" + "[DB] 번역 결과가 저장되었습니다.\n")
    except Exception as e:
        print("\033[91m" + f"[ERROR] 번역 결과 저장 실패: {e}" + "\033[0m")
    finally:
        if conn:
            conn.close()

def save_llm_interaction(
    model_name: str,
    request: str,
    response: str,
    translate_response: str,
    ja_translate_response: str
) -> int:
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO llm_interactions 
                (model_name, request, response, translate_response, ja_translate_response)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                model_name,
                request,
                response,
                translate_response,
                ja_translate_response
            ))
            interaction_id = cursor.lastrowid
        conn.commit()
        print("\033[94m" + "[DB] LLM interaction이 저장되었습니다.\n")
        return interaction_id
    except Exception as e:
        print("\033[91m" + f"[ERROR] LLM 저장 실패: {e}" + "\033[0m")
        return None
    finally:
        if conn:
            conn.close()

def save_llm_feedback(interaction_id: int, rating: str | None, tone_score: float):
    """
    LLM 피드백 저장 (up/down/null + tone_score)
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO llm_feedback (interaction_id, rating, tone_score)
                VALUES (%s, %s, %s)
            """
            cursor.execute(sql, (interaction_id, rating, tone_score))
        conn.commit()
        print("\033[94m" + "[DB] LLM 피드백이 저장되었습니다.\n")
    except Exception as e:
        print("\033[91m" + f"[ERROR] 피드백 저장 실패: {e}" + "\033[0m")
    finally:
        if conn:
            conn.close()


def get_llm_interactions(limit: int = 100):
    """
    최근 대화 이력(limit 개) 조회
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            sql = """
                SELECT id, model_name, request, response, created_at
                FROM llm_interactions
                ORDER BY created_at DESC
                LIMIT %s
            """
            cursor.execute(sql, (limit,))
            return cursor.fetchall()
    except Exception as e:
        print("\033[91m" + f"[ERROR] LLM 이력 조회 실패: {e}" + "\033[0m")
        return []
    finally:
        if conn:
            conn.close()