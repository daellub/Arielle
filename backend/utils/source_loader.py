# backend/utils/source_loader.py
from pathlib import Path
from backend.db.database import get_connection

def load_text_from_local_sources(source_ids: list[int]) -> list[str]:
    texts = []
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                SELECT path FROM local_sources WHERE id IN (%s)
            """ % ','.join(['%s'] * len(source_ids))
            cursor.execute(sql, source_ids)
            rows = cursor.fetchall()

            for (path_str,) in rows:
                path = Path(path_str)
                if path.exists() and path.is_dir():
                    for file in path.glob("*"):
                        if file.suffix in [".txt", ".md", ".csv", ".json"]:
                            try:
                                content = file.read_text(encoding="utf-8")
                                snippet = content.strip()[:1000]
                                texts.append(f"[{file.name}]\n{snippet}")
                            except Exception as e:
                                print(f"[파일 로딩 실패] {file}: {e}")
    finally:
        conn.close()
    return texts