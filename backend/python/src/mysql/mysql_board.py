import os
import sys
import re
import pymysql
import json
from pymysql import cursors
from datetime import datetime, timezone, timedelta
from utils.utils_mysql import Mysql, _where_like_unit, _where_eq_unit
from utils.utils_data import arr_from_csv, dict_from_tuple, dicts_from_tuples, csv_from_dicts, csv_added_defaults
"""
CREATE TABLE board_dev (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '글 제목',
    content TEXT NOT NULL COMMENT '글 내용',
    markdown_source TEXT COMMENT '마크다운 원본 소스',
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

    post_id = mysql.insert(table_name, insert_data)
    return post_id
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
    result = mysql.find(table_name,
                        fields=[
                            "id", "title", "content", "markdown_source", "format",
                            "writer", "email", "created_at", "updated_at", "is_visible",
                            "is_notice", "is_private"
                        ],
                        addStr=f"WHERE id = {post_id}")
    if not result:
      return None

    fields = [
        "id", "title", "content", "markdown_source", "format", "writer", "email", "created_at",
        "updated_at", "is_visible", "is_notice", "is_private"
    ]
    return dict_from_tuple(fields, result[0])
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
      update_data['markdown_source'] = data['markdown_source']

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
      bool: 삭제 성곴 여부
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

    # 전체 게시글 수 조회
    count_sql = f"SELECT COUNT(*) FROM {table_name} {where_clause};"
    total_count = mysql.fetch(count_sql)[0][0]

    # 페이지네이션 적용하여 게시글 조회
    offset = (page - 1) * per_page
    fields = [
        "id", "title", "writer", "email", "created_at", "updated_at", "is_visible",
        "is_notice", "is_private"
    ]
    result = mysql.find(
        table_name,
        fields=fields,
        addStr=f"{where_clause} ORDER BY is_notice DESC, created_at DESC LIMIT {per_page} OFFSET {offset}"
    )

    posts = [dict_from_tuple(fields, row) for row in result]
    return total_count, posts
  finally:
    mysql.close()


if __name__ == "__main__":
  pass
#   print(list_posts())
  print(get_post(1, "board_dev"))
