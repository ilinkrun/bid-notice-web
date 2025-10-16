# nohup uvicorn server_board:app --reload --host=0.0.0.0 --port=11307 >
# output.log 2>&1 &

from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
import uvicorn
import os
import sys
from dotenv import load_dotenv

# Add the parent directory to sys.path to enable imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from fastapi.middleware.cors import CORSMiddleware

# 환경 변수 로드
load_dotenv('/exposed/.env')

BE_PORT_BID_NOTICE_BOARD = int(os.getenv("BE_PORT_BID_NOTICE_BOARD", 1307))

# 게시판 관련 함수
from pymysql import cursors
from datetime import datetime, timezone, timedelta
from utils.utils_mysql import Mysql, _where_like_unit, _where_eq_unit
from utils.utils_data import arr_from_csv, dict_from_tuple, dicts_from_tuples, csv_from_dicts, csv_added_defaults
"""
CREATE TABLE board_dev (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '글 제목',
    content TEXT NOT NULL COMMENT '글 내용',
    format ENUM('text', 'markdown', 'html') NOT NULL DEFAULT 'text' COMMENT '내용 형식',
    writer VARCHAR(50) NOT NULL COMMENT '글쓴이 이름',
    email VARCHAR(255) NOT NULL COMMENT '작성자 이메일',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 날짜/시간',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 날짜/시간',
    is_visible BOOLEAN NOT NULL DEFAULT TRUE COMMENT '글 노출 여부',

    -- 인덱스 추가
    INDEX idx_created_at (created_at),
    INDEX idx_writer (writer),
    INDEX idx_email (email),
    INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='개발 채널 게시판';

CREATE TABLE comments_board (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    board VARCHAR(50) NOT NULL COMMENT '게시판 이름',
    post_id BIGINT UNSIGNED NOT NULL COMMENT '게시글 ID',
    content TEXT NOT NULL COMMENT '댓글 내용',
    writer VARCHAR(50) NOT NULL COMMENT '댓글 작성자 이름',
    password CHAR(4) NOT NULL COMMENT '숫자 4자리 비밀번호',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 날짜/시간',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 날짜/시간',
    is_visible BOOLEAN NOT NULL DEFAULT TRUE COMMENT '댓글 노출 여부',

    -- 인덱스 추가
    INDEX idx_board_post (board, post_id),
    INDEX idx_created_at (created_at),
    INDEX idx_writer (writer),
    INDEX idx_is_visible (is_visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='게시판 댓글';

"""
"""
!! 주의 !!
비밀번호는 따로 backend에서 확인하도록 수정 필요
is_valid_password 함수 추가 필요
"""

# 게시판 CRUD 함수들을 추가합니다


def create_post(data: dict, table_name: str = 'board_dev'):
  """
  새로운 게시글을 생성합니다.

  Args:
      data (dict): 게시글 데이터
          {
              'title': str,        # 필수: 글 title
              'content': str,      # 필수: 글 내용
              'writer': str,       # 필수: 글쓴이 이름
              'email': str,        # 필수: 작성자 이메일
              'format': str,       # 선택: 내용 형식 ('text', 'markdown', 'html'). 기본값 'text'
              'markdown_source': str, # 선택: 마크다운 원본 소스
              'is_visible': bool   # 선택: 글 노출 여부. 기본값 True
          }
      table_name (str, optional): 테이블명. 기본값 'board_dev'

  Returns:
      int: 생성된 게시글의 ID

  Raises:
      ValueError: 필수 필드가 없거나 유효하지 않은 데이터인 경우
  """
  mysql = Mysql()
  try:
    # 필수 필드 검사
    required_fields = ['title', 'content', 'writer', 'email']
    for field in required_fields:
      if field not in data:
        raise ValueError(f"필수 필드가 누락되었습니다: {field}")

    # 이메일 유효성 검사 (기본적인 형식 검사)
    import re
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, data['email']):
      raise ValueError("유효하지 않은 이메일 형식입니다.")

    # 기본값 설정 및 데이터 정제
    insert_data = {
        'title': data['title'],
        'content': data['content'],
        'writer': data['writer'],
        'email': data['email'],
        'format': data.get('format', 'text'),
        'is_visible': 1 if data.get('is_visible', True) else 0,
        'is_notice': 1 if data.get('is_notice', False) else 0,
        'is_private': 1 if data.get('is_private', False) else 0
    }
    
    # 마크다운 원본 소스 추가
    if 'markdown_source' in data:
      print(f"Backend received markdown_source: {data['markdown_source']}")
      insert_data['markdown_source'] = data['markdown_source']
    else:
      print("Backend did not receive markdown_source field")

    # format 유효성 검사
    if insert_data['format'] not in ['text', 'markdown', 'html']:
      raise ValueError(
          "올바르지 않은 format입니다. 'text', 'markdown', 'html' 중 하나여야 합니다.")

    try:
      # 파라미터화된 쿼리 사용으로 SQL 인젝션 방지 및 문자 이스케이프 문제 해결
      fields = ', '.join(insert_data.keys())
      placeholders = ', '.join(['%s'] * len(insert_data))
      sql = f"INSERT INTO {table_name} ({fields}) VALUES ({placeholders})"
      values = list(insert_data.values())

      print(f"Executing SQL: {sql}")  # 디버깅용
      print(f"With values: {values}")  # 디버깅용

      mysql.exec(sql, values)

      # 마지막 삽입된 ID 가져오기
      result = mysql.fetch("SELECT LAST_INSERT_ID()")
      post_id = result[0][0]

      return post_id

    except Exception as e:
      print(f"Database error: {str(e)}")
      raise Exception(f"데이터베이스 오류: {str(e)}")

  except Exception as e:
    raise e
  finally:
    mysql.close()


def get_post(post_id: int, table_name: str = 'board_dev'):
  """
  특정 ID의 게시글을 조회합니다.

  Args:
      post_id (int): 게시글 ID
      table_name (str, optional): 테이블명. 기본값 'board_dev'

  Returns:
      dict: 게시글 정보 또는 None
  """
  mysql = Mysql()
  try:
    fields = [
        "id", "title", "content", "markdown_source", "format", "writer", "email", "created_at",
        "updated_at", "is_visible", "is_notice", "is_private"
    ]
    # fields = ["id", "title", "content", "format", "writer", "password", "created_at", "updated_at", "is_visible"]
    fields_str = ", ".join(fields)

    sql = f"SELECT {fields_str} FROM {table_name} WHERE id = {post_id}"
    result = mysql.fetch(sql)

    if not result:
      return None

    # 결과를 딕셔너리로 변환하고 datetime을 문자열로 변환
    post = {}
    row = result[0]
    for i, field in enumerate(fields):
      if isinstance(row[i], datetime):
        # datetime 객체를 문자열로 변환
        post[field] = row[i].strftime('%Y-%m-%d %H:%M:%S')
      else:
        post[field] = row[i]

    return post
  finally:
    mysql.close()


def update_post(post_id: int,
                data: dict,
                email: str,
                table_name: str = 'board_dev'):
  """
  게시글을 수정합니다. 이메일이 일치하는 경우에만 수정이 가능합니다.

  Args:
      post_id (int): 게시글 ID
      data (dict): 수정할 게시글 데이터
          {
              'title': str,        # 선택: 글 title
              'content': str,      # 선택: 글 내용
              'format': str,       # 선택: 내용 형식 ('text', 'markdown', 'html')
              'is_visible': bool   # 선택: 글 노출 여부
          }
      email (str): 작성자 이메일
      table_name (str, optional): 테이블명. 기본값 'board_dev'

  Returns:
      bool: 수정 성공 여부

  Raises:
      ValueError: 유효하지 않은 데이터인 경우
  """
  mysql = Mysql()
  try:
    # 이메일 확인
    if not email:
      raise ValueError("이메일을 입력해주세요.")

    stored_email = mysql.find(table_name,
                              fields=["email"],
                              addStr=f"WHERE id = {post_id}")
    if not stored_email or stored_email[0][0] != email:
      return False

    # 수정할 데이터 구성
    update_data = {}

    # title 업데이트
    if 'title' in data:
      update_data['title'] = data['title']

    # 내용 업데이트
    if 'content' in data:
      update_data['content'] = data['content']

    # 마크다운 원본 업데이트
    if 'markdown_source' in data:
      print(f"Backend received markdown_source: {data['markdown_source']}")
      update_data['markdown_source'] = data['markdown_source']
    else:
      print("Backend did not receive markdown_source field")

    # 형식 업데이트
    if 'format' in data:
      if data['format'] not in ['text', 'markdown', 'html']:
        raise ValueError("올바르지 않은 format입니다.")
      update_data['format'] = data['format']

    # 노출 여부 업데이트
    if 'is_visible' in data:
      update_data['is_visible'] = 1 if data['is_visible'] else 0

    # 공지 여부 업데이트
    if 'is_notice' in data:
      update_data['is_notice'] = 1 if data['is_notice'] else 0

    # 비공개 여부 업데이트
    if 'is_private' in data:
      update_data['is_private'] = 1 if data['is_private'] else 0

    if update_data:
      mysql.update(table_name, update_data, f"id = {post_id}")
      return True
    return False
  finally:
    mysql.close()


def delete_post(post_id: int, email: str, table_name: str = 'board_dev'):
  """
  게시글을 삭제합니다. 이메일이 일치하는 경우에만 삭제가 가능합니다.

  Args:
      post_id (int): 게시글 ID
      email (str): 작성자 이메일
      table_name (str, optional): 테이블명. 기본값 'board_dev'

  Returns:
      bool: 삭제 성공 여부
  """
  mysql = Mysql()
  try:
    # 이메일 확인
    stored_email = mysql.find(table_name,
                              fields=["email"],
                              addStr=f"WHERE id = {post_id}")
    if not stored_email or stored_email[0][0] != email:
      return False

    mysql.delete(table_name, f"id = {post_id}")
    return True
  finally:
    mysql.close()


def list_posts(page: int = 1,
               per_page: int = 20,
               only_visible: bool = True,
               table_name: str = 'board_dev',
               user_email: str = None):
  """
  게시글 목록을 조회합니다.

  Args:
      page (int, optional): 페이지 번호. 기본값 1
      per_page (int, optional): 페이지당 게시글 수. 기본값 20
      only_visible (bool, optional): 노출된 게시글만 조회할지 여부. 기본값 True
      table_name (str, optional): 테이블명. 기본값 'board_dev'

  Returns:
      tuple: (전체 게시글 수, 현재 페이지 게시글 목록)
  """
  mysql = Mysql()
  try:
    # 조건 구성
    conditions = []
    if only_visible:
      conditions.append("is_visible = 1")
    
    # 비공개 게시글 필터링: 작성자 본인이거나 비공개가 아닌 경우만 보여줌
    if user_email:
      conditions.append(f"(is_private = 0 OR email = '{user_email}')")
    else:
      conditions.append("is_private = 0")
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

    # 전체 게시글 수 조회 수정
    count_sql = f"SELECT COUNT(*) FROM {table_name} {where_clause}"
    total_count = mysql.fetch(count_sql)[0][0]

    # 페이지네이션 적용하여 게시글 조회
    offset = (page - 1) * per_page
    fields = [
        "id", "title", "writer", "email", "created_at", "updated_at",
        "is_visible", "is_notice", "is_private"
    ]
    fields_str = ", ".join(fields)

    list_sql = f"SELECT {fields_str} FROM {table_name} {where_clause} ORDER BY is_notice DESC, created_at DESC LIMIT {per_page} OFFSET {offset}"
    result = mysql.fetch(list_sql)

    # 결과를 딕셔너리 리스트로 변환
    posts = []
    for row in result:
      post = {}
      for i, field in enumerate(fields):
        # datetime 객체를 문자열로 변환
        if isinstance(row[i], datetime):
          post[field] = row[i].strftime('%Y-%m-%d %H:%M:%S')
        else:
          post[field] = row[i]
      posts.append(post)

    return total_count, posts
  finally:
    mysql.close()


def check_table_exists(table_name: str) -> bool:
  mysql = Mysql()
  try:
    result = mysql.fetch(f"SHOW TABLES LIKE '{table_name}'")
    return len(result) > 0
  finally:
    mysql.close()


# 댓글 관련 CRUD 함수들


def create_comment(data: dict):
  """
  새로운 댓글을 생성합니다.

  Args:
      data (dict): 댓글 데이터
          {
              'board': str,       # 필수: 게시판 이름
              'post_id': int,     # 필수: 게시글 ID
              'content': str,     # 필수: 댓글 내용
              'writer': str,      # 필수: 댓글 posted_by 이름
              'password': str,    # 필수: 숫자 4자리 비밀번호
              'is_visible': bool  # 선택: 댓글 노출 여부. 기본값 True
          }

  Returns:
      int: 생성된 댓글의 ID

  Raises:
      ValueError: 필수 필드가 없거나 유효하지 않은 데이터인 경우
  """
  mysql = Mysql()
  try:
    # 필수 필드 검사
    required_fields = ['board', 'post_id', 'content', 'writer', 'email']
    for field in required_fields:
      if field not in data:
        raise ValueError(f"필수 필드가 누락되었습니다: {field}")

    # 이메일 형식 간단 검증
    if '@' not in data['email']:
      raise ValueError("올바른 이메일 형식이 아닙니다.")

    # 기본값 설정 및 데이터 정제
    insert_data = {
        'board': data['board'],
        'post_id': int(data['post_id']),
        'content': data['content'],
        'writer': data['writer'],
        'email': data['email'],
        'is_visible': 1 if data.get('is_visible', True) else 0
    }

    try:
      # 안전한 파라미터화된 쿼리 사용
      fields = ', '.join(insert_data.keys())
      placeholders = ', '.join(['%s'] * len(insert_data))
      sql = f"INSERT INTO comments_board ({fields}) VALUES ({placeholders})"
      params = tuple(insert_data.values())

      print(f"Executing SQL: {sql}")  # 디버깅용
      print(f"With params: {params}")  # 디버깅용

      mysql.exec(sql, params)

      # 마지막 삽입된 ID 가져오기
      result = mysql.fetch("SELECT LAST_INSERT_ID()")
      comment_id = result[0][0]

      return comment_id

    except Exception as e:
      print(f"Database error: {str(e)}")
      raise Exception(f"데이터베이스 오류: {str(e)}")

  except Exception as e:
    raise e
  finally:
    mysql.close()


def get_comments(board: str,
                 post_id: int,
                 page: int = 1,
                 per_page: int = 50,
                 only_visible: bool = True):
  """
  특정 게시글의 댓글 목록을 조회합니다.

  Args:
      board (str): 게시판 이름
      post_id (int): 게시글 ID
      page (int, optional): 페이지 번호. 기본값 1
      per_page (int, optional): 페이지당 댓글 수. 기본값 50
      only_visible (bool, optional): 노출된 댓글만 조회할지 여부. 기본값 True

  Returns:
      tuple: (전체 댓글 수, 현재 페이지 댓글 목록)
  """
  mysql = Mysql()
  try:
    # 조건 구성
    where_clause = f"WHERE board = '{board}' AND post_id = {post_id}"
    if only_visible:
      where_clause += " AND is_visible = 1"

    # 전체 댓글 수 조회
    count_sql = f"SELECT COUNT(*) FROM comments_board {where_clause}"
    total_count = mysql.fetch(count_sql)[0][0]

    # 페이지네이션 적용하여 댓글 조회
    offset = (page - 1) * per_page
    fields = [
        "id", "board", "post_id", "content", "writer", "email", "created_at",
        "updated_at", "is_visible"
    ]
    fields_str = ", ".join(fields)

    list_sql = f"SELECT {fields_str} FROM comments_board {where_clause} ORDER BY created_at ASC LIMIT {per_page} OFFSET {offset}"
    result = mysql.fetch(list_sql)

    # 결과를 딕셔너리 리스트로 변환
    comments = []
    for row in result:
      comment = {}
      for i, field in enumerate(fields):
        # datetime 객체를 문자열로 변환
        if isinstance(row[i], datetime):
          comment[field] = row[i].strftime('%Y-%m-%d %H:%M:%S')
        else:
          comment[field] = row[i]
      comments.append(comment)

    return total_count, comments
  finally:
    mysql.close()


def get_comment(comment_id: int):
  """
  특정 ID의 댓글을 조회합니다.

  Args:
      comment_id (int): 댓글 ID

  Returns:
      dict: 댓글 정보 또는 None
  """
  mysql = Mysql()
  try:
    fields = [
        "id", "board", "post_id", "content", "writer", "email", "created_at",
        "updated_at", "is_visible"
    ]
    fields_str = ", ".join(fields)

    sql = f"SELECT {fields_str} FROM comments_board WHERE id = {comment_id}"
    result = mysql.fetch(sql)

    if not result:
      return None

    # 결과를 딕셔너리로 변환하고 datetime을 문자열로 변환
    comment = {}
    row = result[0]
    for i, field in enumerate(fields):
      if isinstance(row[i], datetime):
        # datetime 객체를 문자열로 변환
        comment[field] = row[i].strftime('%Y-%m-%d %H:%M:%S')
      else:
        comment[field] = row[i]

    return comment
  finally:
    mysql.close()


def update_comment(comment_id: int, data: dict, email: str):
  """
  댓글을 수정합니다. 이메일이 일치하는 경우에만 수정이 가능합니다.

  Args:
      comment_id (int): 댓글 ID
      data (dict): 수정할 댓글 데이터
          {
              'content': str,      # 선택: 댓글 내용
              'is_visible': bool   # 선택: 댓글 노출 여부
          }
      email (str): 댓글 작성자 이메일

  Returns:
      bool: 수정 성공 여부

  Raises:
      ValueError: 유효하지 않은 데이터인 경우
  """
  mysql = Mysql()
  try:
    # 이메일 확인
    if not email:
      raise ValueError("이메일을 입력해주세요.")

    stored_email = mysql.find("comments_board",
                              fields=["email"],
                              addStr=f"WHERE id = {comment_id}")
    print(
        f"댓글 수정 이메일 검증 - ID: {comment_id}, 입력: '{email}', 저장된: '{stored_email[0][0] if stored_email else None}'")

    if not stored_email:
      print(f"댓글 ID {comment_id}를 찾을 수 없습니다.")
      return False

    stored_mail = str(stored_email[0][0]).strip()
    input_mail = str(email).strip()

    if stored_mail != input_mail:
      print(f"이메일 불일치: 저장된='{stored_mail}', 입력='{input_mail}'")
      return False

    print(f"이메일 일치 확인됨")

    # 수정할 데이터 구성
    update_data = {}

    # 내용 업데이트
    if 'content' in data:
      update_data['content'] = data['content']

    # 노출 여부 업데이트
    if 'is_visible' in data:
      update_data['is_visible'] = 1 if data['is_visible'] else 0

    if update_data:
      mysql.update("comments_board", update_data, f"id = {comment_id}")
      return True
    return False
  finally:
    mysql.close()


def delete_comment(comment_id: int, email: str):
  """
  댓글을 삭제합니다. 이메일이 일치하는 경우에만 삭제가 가능합니다.

  Args:
      comment_id (int): 댓글 ID
      email (str): 댓글 작성자 이메일

  Returns:
      bool: 삭제 성공 여부
  """
  mysql = Mysql()
  try:
    # 이메일 확인
    stored_email = mysql.find("comments_board",
                              fields=["email"],
                              addStr=f"WHERE id = {comment_id}")
    print(f"댓글 삭제 이메일 검증 - ID: {comment_id}, 입력: '{email}', 저장된: '{stored_email[0][0] if stored_email else None}'")

    if not stored_email:
      print(f"댓글 ID {comment_id}를 찾을 수 없습니다.")
      return False

    stored_mail = str(stored_email[0][0]).strip()
    input_mail = str(email).strip()

    if stored_mail != input_mail:
      print(f"이메일 불일치: 저장된='{stored_mail}', 입력='{input_mail}'")
      return False

    print(f"이메일 일치 확인됨")

    mysql.delete("comments_board", f"id = {comment_id}")
    return True
  finally:
    mysql.close()


# FastAPI 앱 생성
app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/posts/{table_name}")
def create_post_endpoint(table_name: str, post_data: Dict[str, Any]):
  """게시글을 생성합니다."""
  try:
    # 테이블 존재 여부 확인
    if not check_table_exists(table_name):
      raise HTTPException(status_code=404,
                          detail=f"테이블을 찾을 수 없습니다: {table_name}")

    post_id = create_post(post_data, table_name)
    return {"id": post_id}
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except HTTPException as e:
    raise e
  except Exception as e:
    import traceback
    error_detail = f"Error creating post: {str(e)}\n{traceback.format_exc()}"
    print(error_detail)
    raise HTTPException(status_code=500, detail=error_detail)


@app.get("/posts/{table_name}/{post_id}")
def get_post_endpoint(table_name: str, post_id: int):
  """특정 게시글을 조회합니다."""
  try:
    post = get_post(post_id, table_name)
    if not post:
      raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    return post
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.put("/posts/{table_name}/{post_id}")
def update_post_endpoint(table_name: str, post_id: int,
                         update_data: Dict[str, Any]):
  """게시글을 수정합니다."""
  try:
    print(f"Backend API received data: {update_data}")
    email = update_data.pop("email", None)
    if not email:
      raise HTTPException(status_code=400, detail="이메일이 필요합니다.")

    success = update_post(post_id, update_data, email, table_name)
    if not success:
      raise HTTPException(status_code=401, detail="작성자만 수정할 수 있습니다.")
    return {"success": True}
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.delete("/posts/{table_name}/{post_id}")
def delete_post_endpoint(table_name: str, post_id: int,
                         delete_data: Dict[str, str]):
  """게시글을 삭제합니다."""
  try:
    email = delete_data.get("email")
    if not email:
      raise HTTPException(status_code=400, detail="이메일이 필요합니다.")

    success = delete_post(post_id, email, table_name)
    if not success:
      raise HTTPException(status_code=401, detail="작성자만 삭제할 수 있습니다.")
    return {"success": True}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/posts/{table_name}")
def list_posts_endpoint(table_name: str,
                        page: int = Query(1, description="페이지 번호"),
                        per_page: int = Query(20, description="페이지당 게시글 수"),
                        only_visible: bool = Query(True,
                                                   description="노출된 게시글만 표시"),
                        user_email: str = Query(None, description="사용자 이메일")):
  """게시글 목록을 조회합니다."""
  try:
    total_count, posts = list_posts(page, per_page, only_visible, table_name, user_email)
    return {
        "total_count": total_count,
        "page": page,
        "per_page": per_page,
        "posts": posts
    }
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


# 댓글 관련 API 엔드포인트들


@app.post("/comments")
def create_comment_endpoint(comment_data: Dict[str, Any]):
  """댓글을 생성합니다."""
  try:
    comment_id = create_comment(comment_data)
    return {"id": comment_id}
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except Exception as e:
    import traceback
    error_detail = f"Error creating comment: {str(e)}\n{traceback.format_exc()}"
    print(error_detail)
    raise HTTPException(status_code=500, detail=error_detail)


@app.get("/comments/{board}/{post_id}")
def get_comments_endpoint(board: str,
                          post_id: int,
                          page: int = Query(1, description="페이지 번호"),
                          per_page: int = Query(50, description="페이지당 댓글 수"),
                          only_visible: bool = Query(
                              True, description="노출된 댓글만 표시")):
  """특정 게시글의 댓글 목록을 조회합니다."""
  try:
    total_count, comments = get_comments(board, post_id, page, per_page,
                                         only_visible)
    return {
        "total_count": total_count,
        "page": page,
        "per_page": per_page,
        "comments": comments
    }
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/comments/{comment_id}")
def get_comment_endpoint(comment_id: int):
  """특정 댓글을 조회합니다."""
  try:
    comment = get_comment(comment_id)
    if not comment:
      raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    return comment
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.put("/comments/{comment_id}")
def update_comment_endpoint(comment_id: int, update_data: Dict[str, Any]):
  """댓글을 수정합니다."""
  try:
    email = update_data.pop("email", None)
    if not email:
      raise HTTPException(status_code=400, detail="이메일이 필요합니다.")

    success = update_comment(comment_id, update_data, email)
    if not success:
      raise HTTPException(status_code=401, detail="작성자만 수정할 수 있습니다.")
    return {"success": True}
  except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.delete("/comments/{comment_id}")
def delete_comment_endpoint(comment_id: int, delete_data: Dict[str, str]):
  """댓글을 삭제합니다."""
  try:
    email = delete_data.get("email")
    if not email:
      raise HTTPException(status_code=400, detail="이메일이 필요합니다.")

    success = delete_comment(comment_id, email)
    if not success:
      raise HTTPException(status_code=401, detail="작성자만 삭제할 수 있습니다.")
    return {"success": True}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


# 서버 실행 코드 (직접 실행 시)
if __name__ == "__main__":
  uvicorn.run(app, host="0.0.0.0", port=BE_PORT_BID_NOTICE_BOARD)

# * CREATE
# POST http://{{ip}}:{{board_port}}/posts/{{board_name}}

# {
#     "title": "첫 번째 게시글입니다",
#     "content": "안녕하세요. 게시판 테스트 중입니다.",
#     "writer": "테스터",
#     "password": "1234"
# }

# # * LIST
# GET http://{{ip}}:{{board_port}}/posts/{{board_name}}

# {
#     "total_count": 1,
#     "page": 1,
#     "per_page": 20,
#     "posts": [
#         {
#             "id": 1,
#             "title": "첫 번째 게시글입니다",
#             "writer": "테스터",
#             "created_at": "2025-04-16 11:55:05",
#             "updated_at": "2025-04-16 11:55:05",
#             "is_visible": 1
#         }
#     ]
# }

# * READ
# GET http://{{ip}}:{{board_port}}/posts/{{board_name}}/{{post_id}}

# * UPDATE
# PUT http://{{ip}}:{{board_port}}/posts/{{board_name}}/{{post_id}}

# {
#     "title": "수정된 게시글입니다",
#     "content": "수정된 게시글 내용입니다.",
#     "writer": "테스터",
#     "password": "1234"
# }
