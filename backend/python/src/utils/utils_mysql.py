"""
MySQL 데이터베이스 작업을 위한 기본 래퍼 모듈입니다.
환경 설정 관리, 연결 관리, 기본적인 CRUD 작업을 제공합니다.
"""

import os
import sys
import re
import pymysql
from pymysql import cursors
from dotenv import load_dotenv

# .env 파일의 경로 설정 (상위 디렉토리에 있는 .env 파일을 로드)
# dotenv_path = os.path.join(
#     os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
# print(f"ENV 파일 경로: {dotenv_path}")
# .env 파일 로드
# load_dotenv(dotenv_path)

load_dotenv('/exposed/.env')

def get_mysql_config():
  """
  MySQL 연결 설정을 환경 변수에서 가져옵니다.

  Returns:
      dict: MySQL 연결에 필요한 설정값들
  """
  return dict(host=os.environ.get('MYSQL_HOST', '1.2.3.4'),
              port=int(os.environ.get('MYSQL_PORT', 2306)),
              user=os.environ.get('MYSQL_USER', 'root'),
              passwd=os.environ.get('MYSQL_PASSWORD', 'mysqlIlmac1!'),
              db=os.environ.get('MYSQL_DATABASE', 'ilmac_bid_db'),
              charset='utf8')


MYSQL_CONFIG = get_mysql_config()

# ** sub functions(sql)


def _keyStr(key):
  """키 이름을 MySQL 쿼리에서 사용할 수 있는 형식으로 변환"""
  return "`" + key + "`"


def _valStr(val):
  """값을 MySQL 쿼리에서 사용할 수 있는 형식으로 변환"""
  return "'" + val.replace("'", "\\'").replace(
      '"', '\\"') + "'" if type(val) is str else val


def _keyValStr(key, val):
  """키-값 쌍을 MySQL 쿼리에서 사용할 수 있는 형식으로 변환"""
  return f"{_keyStr(key)} = {_valStr(val)}"


def _join_keys(keys):
  """키 목록을 쉼표로 구분된 문자열로 변환"""
  return ", ".join([_keyStr(k) for k in keys])


def _join_vals(vals):
  """값 목록을 쉼표로 구분된 문자열로 변환"""
  return ", ".join([str(_valStr(v)) for v in vals])


def _join_keyVals(keys, vals):
  """키-값 쌍 목록을 쉼표로 구분된 문자열로 변환"""
  return ", ".join([_keyValStr(k, v) for (k, v) in zip(keys, vals)])


# ** sub functions(where)


def _where_like_unit(values, field, joiner="or"):
  """
  LIKE 검색을 위한 WHERE 절을 생성합니다.

  Args:
      values (list): 검색할 값 목록
      field (str): 검색할 필드명
      joiner (str): 조건 결합자 (기본값: "or")

  Returns:
      str: WHERE 절 문자열
  """
  if not values:
    return ""

  where_str = ""
  for value in values:
    if where_str:
      where_str += f" {joiner} "
    where_str += f"`{field}` like '%{value}%'"
  return where_str


def _where_eq_unit(values, field, joiner="or"):
  """
  정확한 일치 검색을 위한 WHERE 절을 생성합니다.

  Args:
      values (list): 검색할 값 목록
      field (str): 검색할 필드명
      joiner (str): 조건 결합자 (기본값: "or")

  Returns:
      str: WHERE 절 문자열
  """
  if not values:
    return ""

  where_str = ""
  for value in values:
    if where_str:
      where_str += f" {joiner} "
    where_str += f"`{field}` = '{value}'"
  return where_str


# ** Mysql Wraper


class Mysql(object):
  """
  MySQL 데이터베이스 작업을 위한 래퍼 클래스입니다.
  연결 관리와 기본적인 CRUD 작업을 제공합니다.
  """

  def __init__(self, config=None):
    """
    MySQL 연결을 초기화합니다.

    Args:
        config (dict, optional): MySQL 연결 설정
    """
    config = config or get_mysql_config()
    self.set_conn(config)

  # * sub functions
  def _ping(self):
    """연결 상태를 확인하고 필요한 경우 재연결합니다."""
    try:
      self.conn.ping()
    except BaseException:
      self.set_conn(get_mysql_config())

  # * get, set functions
  def set_conn(self, config):
    """MySQL 연결을 설정합니다."""
    self.conn = pymysql.connect(**config)

  def get_conn(self):
    """현재 MySQL 연결을 반환합니다."""
    return self.conn

  def get_ping(self):
    """연결 상태를 확인하고 현재 연결을 반환합니다."""
    self._ping()
    return self.conn

  # * query functions(basic)
  def fetch(self, sql, limit=0, close=False):
    """
    SQL 쿼리를 실행하고 결과를 반환합니다.

    Args:
        sql (str): 실행할 SQL 쿼리
        limit (int): 반환할 결과 수 (0: 전체, 1: 단일 행)
        close (bool): 쿼리 실행 후 연결 종료 여부

    Returns:
        list/tuple: 쿼리 결과
    """
    curs = self.conn.cursor()
    curs.execute(sql)
    if close:
      self.conn.close()
    return curs.fetchall() if limit == 0 else curs.fetchone(
    ) if limit == 1 else curs.fetchmany(limit)

  def exec(self, sql, params=None, close=False):
    """
    SQL 쿼리를 실행합니다.

    Args:
        sql (str): 실행할 SQL 쿼리
        params (tuple/list): SQL 매개변수 (선택사항)
        close (bool): 쿼리 실행 후 연결 종료 여부
    """
    cursor = self.conn.cursor()
    if params:
      cursor.execute(sql, params)
    else:
      cursor.execute(sql)
    self.conn.commit()
    if close:
      self.conn.close()

  # * query functions
  def find(self, table_name, fields=None, addStr="", limit=0, close=False):
    """
    테이블에서 데이터를 조회합니다.

    Args:
        table_name (str): 테이블명
        fields (list): 조회할 필드 목록
        addStr (str): 추가 SQL 조건
        limit (int): 반환할 결과 수
        close (bool): 쿼리 실행 후 연결 종료 여부

    Returns:
        list: 조회 결과
    """
    fields = "*" if not fields else _join_keys(fields)
    sql = f"SELECT {fields} FROM {table_name} {addStr};"
    return self.fetch(sql, limit, close)

  def insert_one_by_dict(self, table_name, dic, close=False):
    """
    딕셔너리 데이터를 테이블에 삽입합니다.

    Args:
        dic (dict): 삽입할 데이터
        table_name (str): 테이블명
        close (bool): 쿼리 실행 후 연결 종료 여부
    """
    keys_str = _join_keys(dic.keys())
    vals_str = _join_vals(dic.values())
    sql = f"INSERT IGNORE INTO {table_name} ({keys_str}) VALUES ({vals_str});"
    self.exec(sql, close)

  def insert_one(self, table_name, csv, close=False):
    """
    CSV 형식의 단일 데이터를 테이블에 삽입합니다.

    Args:
        csv (list): [필드명 목록, 값 목록]
        table_name (str): 테이블명
        close (bool): 쿼리 실행 후 연결 종료 여부
    """
    keys_str = _join_keys(csv[0])
    vals_str = _join_vals(csv[1])
    sql = f"INSERT IGNORE INTO {table_name} ({keys_str}) VALUES ({vals_str});"
    self.exec(sql, close)

  def insert(self, table_name, data, close=False, inType="csv"):
    """
    CSV 형식의 여러 데이터를 테이블에 삽입합니다.

    Args:
        csv (list): [필드명 목록, 값 목록1, 값 목록2, ...]
        table_name (str): 테이블명
        close (bool): 쿼리 실행 후 연결 종료 여부
    """
    if inType == "csv":
      csv = data
    elif inType == "dicts":
      from utils.utils_data import csv_from_dicts
      csv = csv_from_dicts(data)

    values = ",".join(
        ["(" + _join_vals(csv[i]) + ")" for i in range(1, len(csv))])
    keys_str = _join_keys(csv[0])
    sql = f"INSERT IGNORE INTO {table_name} ({keys_str}) VALUES {values};"
    self.exec(sql, close)

  def upsert(self, table_name, data, updKeys=[], close=False, inType="csv"):
    """
    데이터가 존재하면 업데이트하고, 없으면 삽입합니다.

    Args:
        csv (list): [필드명 목록, 값 목록1, 값 목록2, ...]
        table_name (str): 테이블명
        updKeys (list): 업데이트할 키 목록
        close (bool): 쿼리 실행 후 연결 종료 여부
    """
    if inType == "csv":
      csv = data
    elif inType == "dicts":
      from utils.utils_data import csv_from_dicts
      csv = csv_from_dicts(data)

    fields = csv[0]
    updKeys = fields if len(updKeys) == 0 else updKeys
    keyStr = _join_keys(fields)

    for i in range(1, len(csv)):
      valStr = _join_vals(csv[i])
      updVals = [csv[i][j] for j in [fields.index(k) for k in updKeys]]
      updStr = _join_keyVals(updKeys, updVals)
      sql = f"INSERT IGNORE INTO {table_name} ({keyStr}) VALUES ({valStr}) ON DUPLICATE KEY UPDATE {updStr};"
      self.exec(sql, close)

  def delete(self, table_name, condition=None):
    """
    조건에 맞는 데이터를 삭제합니다.

    Args:
        table_name (str): 테이블명
        condition (str): 삭제 조건
    """
    sql = f"SHOW TABLES LIKE '{table_name}'"
    with self.conn.cursor() as cursor:
      result = cursor.execute(sql)
      if result != 0:
        sql = f"DELETE FROM {table_name} WHERE {condition};"
        cursor.execute(sql)
        self.conn.commit()

  def create_table(self, table_name, query=None):
    """
    테이블을 생성합니다.

    Args:
        table_name (str): 테이블명
        query (str, optional): 테이블 생성 쿼리
    """
    sql = f"SHOW TABLES LIKE '{table_name}'"
    with self.conn.cursor() as cursor:
      result = cursor.execute(sql)
      if result == 0:
        sql = query or self._sql_create(table_name)
        cursor.execute(sql)
        self.conn.commit()

  def distinct_field(self, table_name, field):
    """
    특정 필드의 고유값 목록을 반환합니다.

    Args:
        table_name (str): 테이블명
        field (str): 필드명

    Returns:
        list: 고유값 목록
    """
    return [
        d[field]
        for d in self.query(f"select distinct({field}) from {table_name}")
    ]

  def create_db(self, MYSQL_DB_NAME):
    """
    데이터베이스를 생성합니다.

    Args:
        MYSQL_DB_NAME (str): 데이터베이스명
    """
    sql = f"SHOW DATABASES LIKE '{MYSQL_DB_NAME}';"
    with self.conn.cursor() as cursor:
      result = cursor.execute(sql)
      if result == 0:
        sql = f'CREATE DATABASE {MYSQL_DB_NAME};'
        cursor.execute(sql)
        self.conn.commit()

  def list_tables(self, like=""):
    """
    테이블 목록을 반환합니다.

    Args:
        like (str): 테이블명 패턴

    Returns:
        list: 테이블명 목록
    """
    sql = f"SHOW TABLES LIKE '{like}'" if like else "SHOW TABLES"
    with self.conn.cursor() as cursor:
      cursor.execute(sql)
      self.conn.commit()
      return [list(d.values())[0] for d in cursor.fetchall()]

  def close(self):
    """데이터베이스 연결을 종료합니다."""
    self.conn.close()

  def update(self, table_name, update_data, where_condition=None, close=False):
    """
    데이터를 업데이트합니다.

    Args:
        table_name (str): 테이블명
        update_data (dict): 업데이트할 데이터
        where_condition (str): 업데이트 조건
        close (bool): 쿼리 실행 후 연결 종료 여부
    """
    set_clause = ", ".join(
        [f"{_keyStr(k)} = {_valStr(v)}" for k, v in update_data.items()])
    where_clause = f" WHERE {where_condition}" if where_condition else ""
    sql = f"UPDATE {table_name} SET {set_clause}{where_clause};"
    self.exec(sql, close)


if __name__ == "__main__":
  # * fetch
  mysql = Mysql()
  print(get_mysql_config())
  sql = "select `org_name`, `title`, `detail_url`, `posted_date` from notice_list where `posted_date` > '2023-03-28'"
  print(mysql.fetch(sql))
  # sql = "select `org_name`, `title`, `detail_url`, `posted_date` from notices where `posted_date` > '2023-03-28'"
  # print(mysql.fetch(sql))

  # table_name = "settings_notice_list"
  # # data = [
  # #     ["org_name", "org_region", "registration", "use", "company_in_charge", "org_man"],
  # #     ["가평군청", "경기", 1, 1, "일맥", "전영서"],
  # #     ["강남구", "서울", 1, 1, "일맥", "전영서"],
  # #     ["강동구", "서울", 1, 1, "일맥", "전영서"],
  # #     ["강북구", "서울", 1, 1, "일맥", "전영서"],
  # # ]

  # data = [
  #     ["org_name", "url", "rowXpath", "title", "detail_url", "posted_by", "posted_date", "startPage", "endPage"],
  #     ["수원시청", "https://www.suwon.go.kr/web/saeallOfr/BD_ofrList.do", '//*[@id="contents"]/div[1]/div/table/tbody/tr', "td[3]/a", "td[3]/a|-href|-", "td[4]", "td[5]", 1, 3],
  #     ["울릉군청", "https://www.ulleung.go.kr/ko/page.do?mnu_uid=571&boardType=notice", '//*[@id="content"]/div[1]/div/div[3]/table/tbody/tr', "td[2]/a", "td[2]/a|-href|-", "td[3]", "td[4]", 1, 3],
  #     ["제주지방항공청", "https://www.molit.go.kr/USR/I0204/m_45/lst.jsp?gubun=4", '//*[@id="cont-body"]/table/tbody/tr', "td[2]/a", "td[2]/a|-href|-", "td[3]", "td[4]", 1, 3],
  #     ["인천해사고등학교", "https://inm.icehs.kr/boardCnts/list.do?boardID=220209&m=0601&s=inm", '//*[@id="subContent"]/div[2]/form/table/tbody/tr[1]', "td[2]/a", "td[2]/a|-href|-", "td[3]", "td[4]", 1, 3],
  #     ["인천광역시 종합건설본부", "https://www.incheon.go.kr/jonggeon/JO020101", '//*[@id="datatable-default"]/tbody/tr', "td[2]/a", "td[2]/a|-href|-", "td[3]", "td[4]", 1, 3],
  #     ["서울중부교육지원청", "https://jbedu.sen.go.kr/CMS/school/school07/school0701/index.html", '//*[@id="contents"]/div[4]/table/tbody/tr[position() >= 2]', "td[3]/a", "td[2]/a|-href|-", "td[3]", "td[4]", 1, 3],
  #     ["인천해양경찰서", "https://www.kcg.go.kr/inchoncgs/na/ntt/selectNttList.do?mi=2083&bbsId=28", '//*[@id="subContent"]/div[2]/div[2]/table/tbody/tr', "td[3]/a", "td[2]/a|-href|-", "td[3]", "td[4]", 1, 3],
  #     ["인천경제자유구역청", "https://www.ifez.go.kr/main/pst/list.do?pst_id=noti02", '//*[@id="real_contents"]/div[2]/div[4]/table/tbody/tr', "td[3]/a", "td[2]/a|-href|-", "td[4]", "td[5]", 1, 3],
  #     ["인천 상수도", "https://www.incheon.go.kr/water/WA020201", '//*[@id="datatable-default"]/tbody/tr', "td[3]/a", "td[2]/a|-href|-", "td[4]", "td[5]", 1, 3],
  # ]

  # mysql.upsert(table_name, data, close=False, inType="csv")
  # # comma separated values
