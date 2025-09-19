# nohup uvicorn server_docs:app --reload --host=0.0.0.0 --port=11308 > output.log 2>&1 &

from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query, File, UploadFile
import uvicorn
import os
import sys
from dotenv import load_dotenv
import json
from datetime import datetime

# Add the parent directory to sys.path to enable imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from fastapi.middleware.cors import CORSMiddleware

# 환경 변수 로드
load_dotenv('/exposed/.env')

BE_PORT_BID_NOTICE_DOCS = int(os.getenv("BE_PORT_BID_NOTICE_DOCS", 11308))

# 문서 관련 함수
from pymysql import cursors
from datetime import datetime, timezone, timedelta
from utils.utils_mysql import Mysql, _where_like_unit, _where_eq_unit
from utils.utils_data import arr_from_csv, dict_from_tuple, dicts_from_tuples, csv_from_dicts, csv_added_defaults

app = FastAPI(
    title="Bid Notice Docs API",
    description="문서 매뉴얼 관리 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 파일 백업 디렉토리 설정
BACKUP_DIR = "/exposed/projects/bid-notice-web/manuals"
os.makedirs(BACKUP_DIR, exist_ok=True)

# ========== 헬퍼 함수 ==========

def save_to_file(title: str, content: str, category: str, format_type: str = "markdown") -> str:
    """매뉴얼을 파일로 백업"""
    try:
        # 카테고리별 디렉토리 생성
        category_dir = os.path.join(BACKUP_DIR, category)
        os.makedirs(category_dir, exist_ok=True)

        # 파일명 생성 (특수문자 제거)
        safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        if format_type == "markdown":
            filename = f"{safe_title}_{timestamp}.md"
        else:
            filename = f"{safe_title}_{timestamp}.txt"

        file_path = os.path.join(category_dir, filename)

        # 파일 저장
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"# {title}\n\n")
            f.write(f"**카테고리**: {category}\n")
            f.write(f"**생성일**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write("---\n\n")
            f.write(content)

        return file_path
    except Exception as e:
        print(f"파일 저장 오류: {e}")
        return ""

def get_all_manuals(category: Optional[str] = None, limit: int = 100, offset: int = 0):
    """매뉴얼 목록 조회"""
    try:
        mysql = Mysql()

        where_clause = "WHERE is_visible = 1"
        params = []

        if category:
            where_clause += " AND category = %s"
            params.append(category)

        query = f"""
            SELECT id, email, title, content, markdown_source, format, category,
                   file_path, writer, created_at, updated_at, is_visible, is_notice, is_private
            FROM docs_manual
            {where_clause}
            ORDER BY is_notice DESC, created_at DESC
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])

        result = mysql.execute_query(query, params)
        manuals = dicts_from_tuples(result)

        # 총 개수 조회
        count_query = f"SELECT COUNT(*) FROM docs_manual {where_clause}"
        count_result = mysql.execute_query(count_query, params[:-2])  # LIMIT, OFFSET 제외
        total_count = count_result[0][0] if count_result else 0

        return {
            "manuals": manuals,
            "total_count": total_count,
            "page": offset // limit + 1,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"매뉴얼 목록 조회 오류: {str(e)}")

def get_manual_by_id(manual_id: int):
    """매뉴얼 상세 조회"""
    try:
        mysql = Mysql()
        query = """
            SELECT id, email, title, content, markdown_source, format, category,
                   file_path, writer, created_at, updated_at, is_visible, is_notice, is_private
            FROM docs_manual
            WHERE id = %s AND is_visible = 1
        """
        result = mysql.execute_query(query, [manual_id])

        if not result:
            raise HTTPException(status_code=404, detail="매뉴얼을 찾을 수 없습니다")

        return dict_from_tuple(result[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"매뉴얼 조회 오류: {str(e)}")

# ========== API 엔드포인트 ==========

@app.get("/")
async def read_root():
    return {"message": "Bid Notice Docs API Server", "port": BE_PORT_BID_NOTICE_DOCS}

@app.get("/docs/manual")
async def get_manuals(
    category: Optional[str] = Query(None, description="카테고리 필터"),
    limit: int = Query(100, ge=1, le=1000, description="페이지당 항목 수"),
    offset: int = Query(0, ge=0, description="건너뛸 항목 수")
):
    """매뉴얼 목록 조회"""
    return get_all_manuals(category, limit, offset)

@app.get("/docs/manual/{manual_id}")
async def get_manual(manual_id: int):
    """매뉴얼 상세 조회"""
    return get_manual_by_id(manual_id)

@app.post("/docs/manual")
async def create_manual(
    title: str,
    content: str,
    category: str,
    writer: str,
    email: str = "",
    format_type: str = "markdown",
    is_notice: bool = False,
    is_private: bool = False
):
    """매뉴얼 생성"""
    try:
        mysql = Mysql()

        # 파일 백업
        file_path = save_to_file(title, content, category, format_type)

        # 데이터베이스 저장
        query = """
            INSERT INTO docs_manual (email, title, content, format, category, file_path, writer, is_notice, is_private)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = [email, title, content, format_type, category, file_path, writer, is_notice, is_private]

        mysql.execute_insert(query, params)

        # 생성된 매뉴얼 ID 조회
        new_id = mysql.execute_query("SELECT LAST_INSERT_ID()")[0][0]

        return {"id": new_id, "message": "매뉴얼이 생성되었습니다", "file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"매뉴얼 생성 오류: {str(e)}")

@app.put("/docs/manual/{manual_id}")
async def update_manual(
    manual_id: int,
    title: Optional[str] = None,
    content: Optional[str] = None,
    category: Optional[str] = None,
    writer: Optional[str] = None,
    email: Optional[str] = None,
    format_type: Optional[str] = None,
    is_notice: Optional[bool] = None,
    is_private: Optional[bool] = None
):
    """매뉴얼 수정"""
    try:
        # 기존 매뉴얼 조회
        existing_manual = get_manual_by_id(manual_id)

        mysql = Mysql()

        # 업데이트할 필드 준비
        update_fields = []
        params = []

        if title is not None:
            update_fields.append("title = %s")
            params.append(title)

        if content is not None:
            update_fields.append("content = %s")
            params.append(content)

        if category is not None:
            update_fields.append("category = %s")
            params.append(category)

        if writer is not None:
            update_fields.append("writer = %s")
            params.append(writer)

        if email is not None:
            update_fields.append("email = %s")
            params.append(email)

        if format_type is not None:
            update_fields.append("format = %s")
            params.append(format_type)

        if is_notice is not None:
            update_fields.append("is_notice = %s")
            params.append(is_notice)

        if is_private is not None:
            update_fields.append("is_private = %s")
            params.append(is_private)

        # 파일 백업 (내용이나 제목이 변경된 경우)
        file_path = existing_manual.get('file_path', '')
        if content is not None or title is not None:
            new_title = title or existing_manual['title']
            new_content = content or existing_manual['content']
            new_category = category or existing_manual['category']
            new_format = format_type or existing_manual['format']

            file_path = save_to_file(new_title, new_content, new_category, new_format)
            update_fields.append("file_path = %s")
            params.append(file_path)

        if not update_fields:
            raise HTTPException(status_code=400, detail="업데이트할 필드가 없습니다")

        # 데이터베이스 업데이트
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        params.append(manual_id)

        query = f"UPDATE docs_manual SET {', '.join(update_fields)} WHERE id = %s"
        mysql.execute_update(query, params)

        return {"message": "매뉴얼이 수정되었습니다", "file_path": file_path}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"매뉴얼 수정 오류: {str(e)}")

@app.delete("/docs/manual/{manual_id}")
async def delete_manual(manual_id: int):
    """매뉴얼 삭제 (소프트 삭제)"""
    try:
        mysql = Mysql()

        # 존재 여부 확인
        get_manual_by_id(manual_id)

        # 소프트 삭제
        query = "UPDATE docs_manual SET is_visible = 0, updated_at = CURRENT_TIMESTAMP WHERE id = %s"
        mysql.execute_update(query, [manual_id])

        return {"message": "매뉴얼이 삭제되었습니다"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"매뉴얼 삭제 오류: {str(e)}")

@app.get("/docs/categories")
async def get_categories():
    """사용 가능한 카테고리 목록 조회"""
    try:
        mysql = Mysql()
        query = "SHOW COLUMNS FROM docs_manual LIKE 'category'"
        result = mysql.execute_query(query)

        if result:
            # ENUM 값 파싱
            type_info = result[0][1]  # Type 컬럼
            # enum('사용자매뉴얼','개발자매뉴얼','운영매뉴얼','운영가이드','시스템가이드')
            enum_values = type_info.replace("enum(", "").replace(")", "").replace("'", "").split(",")
            return {"categories": enum_values}
        else:
            return {"categories": ["사용자매뉴얼", "개발자매뉴얼", "운영매뉴얼", "운영가이드", "시스템가이드"]}
    except Exception as e:
        return {"categories": ["사용자매뉴얼", "개발자매뉴얼", "운영매뉴얼", "운영가이드", "시스템가이드"]}

@app.get("/docs/search")
async def search_manuals(
    q: str = Query(..., description="검색어"),
    category: Optional[str] = Query(None, description="카테고리 필터"),
    limit: int = Query(100, ge=1, le=1000, description="페이지당 항목 수"),
    offset: int = Query(0, ge=0, description="건너뛸 항목 수")
):
    """매뉴얼 검색"""
    try:
        mysql = Mysql()

        where_clause = "WHERE is_visible = 1 AND (title LIKE %s OR content LIKE %s)"
        params = [f"%{q}%", f"%{q}%"]

        if category:
            where_clause += " AND category = %s"
            params.append(category)

        query = f"""
            SELECT id, email, title, content, markdown_source, format, category,
                   file_path, writer, created_at, updated_at, is_visible, is_notice, is_private
            FROM docs_manual
            {where_clause}
            ORDER BY is_notice DESC, created_at DESC
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])

        result = mysql.execute_query(query, params)
        manuals = dicts_from_tuples(result)

        # 총 개수 조회
        count_query = f"SELECT COUNT(*) FROM docs_manual {where_clause}"
        count_result = mysql.execute_query(count_query, params[:-2])  # LIMIT, OFFSET 제외
        total_count = count_result[0][0] if count_result else 0

        return {
            "manuals": manuals,
            "total_count": total_count,
            "page": offset // limit + 1,
            "limit": limit,
            "query": q
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"매뉴얼 검색 오류: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=BE_PORT_BID_NOTICE_DOCS)