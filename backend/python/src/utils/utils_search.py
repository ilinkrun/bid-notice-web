"""
검색 관련 유틸리티 함수들을 제공하는 모듈입니다.
데이터베이스에서 키워드 검색, 필터링, 가중치 검색 등의 기능을 제공합니다.
"""

import os
import sys
import re
import pymysql
from pymysql import cursors

from utils.utils_mysql import Mysql, _where_like_unit, _where_eq_unit
from utils.utils_data import arr_from_csv, dict_from_tuple, dicts_from_tuples, csv_from_dicts, csv_added_defaults

# TODO: 설정 상수는 globals.py 또는 config.json 등에 일괄 저장

TABLE_NOTICES = "notice_list"
TABLE_DETAILS = "notice_details"
TABLE_FILES = "notice_files"
KEY_FIELD_NOTICES = "nid"
KEY_FIELD_FOR_SEARCH = "title"
SEARCH_DOMAINS = ["공사점검", "성능평가", "기타"]

# ** BASE_SQL
# notices, details
BASE_SQL_NOTICE_LIST_1 = "SELECT notices.nid, notices.posted_date, notices.org_name, notices.title, notices.detail_url, details.notice_num, details.file_name, details.file_url, details.created_at FROM notices LEFT JOIN details ON notices.nid = details.nid"

# notices, details, files
BASE_SQL_NOTICE_LIST_2 = "SELECT notices.nid, notices.posted_date, notices.org_name, details.notice_num, notices.title, notices.detail_url, files.file_name, details.created_at FROM notices LEFT JOIN details ON notices.nid = details.nid LEFT JOIN files ON notices.nid = files.nid"

# ** ADD_SQL
ADD_SQL_NOTICE_LIST_1 = "ORDER BY notices.nid DESC"
ADD_SQL_NOTICE_LIST_2 = "ORDER BY notices.nid DESC, files.sn ASC"

# 테스트후 'hasUrl=False' 삭제

# ## ** Global Variables
# SEPERATOR = "|-"  # 스크랩 요소(key,target,callback), file_name, file_url 분리자

# SETTINGS_NOTICE_LIST_FIELDS = ["org_name", "url", "iframe", "rowXpath", "paging", "startPage", "endPage", "login", "title", "detail_url", "posted_date"]
# SETTINGS_NOTICE_LIST_CONFIG_FIELDS = ["url", "iframe", "rowXpath", "paging", "startPage", "endPage", "login"]
# SETTINGS_NOTICE_LIST_ELEMENT_FIELDS = ["title", "detail_url", "posted_date", "posted_by", "exception_row"]
# SETTINGS_NOTICE_DETAIL_FIELDS = ["org_name", "title", "body_html", "file_name", "file_url", "notice_div", "notice_num", "org_dept", "org_man", "org_tel"]
# settings_notice_category_FIELDS = []

# ELEMENT_KEYS = ["key", "xpath", "callback"]

mysql = Mysql()


def find_default_keyword(domain="공사점검"):
  """
  특정 도메인의 기본 검색 설정을 조회합니다.

  Args:
      domain (str): 검색 도메인 (기본값: "공사점검")

  Returns:
      tuple: (검색어, 배제어, 최소점수) 형태의 튜플
  """
  sql = f"SELECT `검색어`, `배제어`, `최소점수` FROM settings_notice_category WHERE `use`=true AND `적용분야`='{domain}' ORDER BY `updated_at` DESC LIMIT 1"
  return mysql.fetch(sql, 1)


def find_default_keywords(domains=SEARCH_DOMAINS):
  """
  여러 도메인의 기본 검색 설정을 조회합니다.

  Args:
      domains (list): 검색할 도메인 목록

  Returns:
      dict: {"도메인명": (검색어, 배제어, 최소점수)} 형태의 딕셔너리
  """
  return {domain: find_default_keyword(domain) for domain in domains}


# ** sub functions
# * 가중치 검색어 문자열 -> 가중치 검색어 배열


def get_keyword_weight_list(keyword_weight_str):
  """
  가중치가 포함된 검색어 문자열을 파싱하여 리스트로 변환합니다.

  Args:
      keyword_weight_str (str): "키워드*가중치,키워드*가중치,..." 형식의 문자열

  Returns:
      list: [(키워드, 가중치), ...] 형태의 리스트
  """
  keyword_weights = []
  for kw in keyword_weight_str.strip().split(","):
    kws = kw.split("*")
    k = kws[0].strip()
    if k == "":
      continue
    w = 1 if len(kws) < 2 else int(kws[1].strip())
    keyword_weights.append((k, w))

  return keyword_weights


# * 가중치 검색어 배열 -> 가중치 검색 조건에 맞는 dict 반환 {"<nid>": {<rst>}, ...}
# TODO: 직접 SQL(LEFT JOIN 등 가능) parameter 버전 추가, 'field' -> 'key'


def get_search_weight(keyword_weight_str,
                      min_point=4,
                      add_where="`posted_date` > '2023-03-31'"):
  """
  가중치 검색어를 사용하여 데이터를 검색합니다.

  Args:
      keyword_weight_str (str): "키워드*가중치,..." 형식의 검색어 문자열
      min_point (int): 최소 가중치 점수 (기본값: 4)
      add_where (str): 추가 WHERE 조건

  Returns:
      list: [{nid: {title: str, matched: str, point: int}}, ...] 형태의 리스트
  """
  keyword_weights = get_keyword_weight_list(keyword_weight_str)
  rsts = {}

  for (keyword, weight) in keyword_weights:
    addStr = f"where `{KEY_FIELD_FOR_SEARCH}` like '%{keyword}%'"
    addStr = addStr if add_where.strip() == "" else f"{addStr} AND {add_where}"
    fields = [KEY_FIELD_NOTICES, KEY_FIELD_FOR_SEARCH]
    _rs = mysql.find(TABLE_NOTICES, fields, addStr)

    rs = []
    for r in _rs:
      rs.append([keyword, weight] + list(r))

    for r in rs:
      nid = r[2]
      if nid not in rsts:
        rsts[nid] = {
            KEY_FIELD_FOR_SEARCH: r[3],
            "matched": r[0],
            "point": r[1]
        }
      else:
        rsts[nid]["matched"] += f",{r[0]}"
        rsts[nid]["point"] += int(r[1])

  return [{
      nid: rst
  } for (nid, rst) in rsts.items() if rst["point"] >= int(min_point)]


# *
def is_not_ins(not_str="", data=""):
  # print(f"~~~utils_search.py is_not_ins: not_str: |{not_str}|, data: |{data}|")
  for n_str in not_str.split(","):
    if n_str == "":
      continue
    if str(n_str).strip() in data:
      return True
  return False


def filter_by_not(not_str="", dicts=[], field="title"):
  if (not_str.strip() == ""):
    return dicts

  rsts = []
  for data in dicts:
    for (nid, row) in data.items():
      if not is_not_ins(not_str, row[field]):
        rsts.append(data)

  # print("filter_by_not", rsts)
  return rsts
  # return dicts


# * 검색어 설정 -> nid 배열


def find_nids_by_search_setting(keyword_weight_str,
                                nots_str,
                                min_point,
                                add_where=""):
  # print(f"$$$find_nids_by_search_setting: keyword_weight_str: {keyword_weight_str}, nots_str: {nots_str}, min_point: {min_point}, add_where: {add_where}")
  dicts = get_search_weight(keyword_weight_str,
                            min_point=min_point,
                            add_where=add_where)

  if dicts == []:
    return []
  rsts = filter_by_not(nots_str, dicts)

  return [list(rst.keys())[0] for rst in rsts]


# *


def get_search_results(keyword_weight_str, nots_str, min_point, add_where=""):
  dicts = get_search_weight(keyword_weight_str,
                            min_point=min_point,
                            add_where=add_where)
  rsts = filter_by_not(nots_str, dicts)
  response = [["일치어", "점수"] + ["nid", KEY_FIELD_FOR_SEARCH]]

  for rst in rsts:
    for (nid, row) in rst.items():
      response.append(
          [row["matched"], row["point"], nid, row[KEY_FIELD_FOR_SEARCH]])

  return response


# TABLE_NOTICES = "notice_list"
# TABLE_DETAILS = "notice_details"
# TABLE_FILES = "notice_files"
# KEY_FIELD_NOTICES = "nid"
# KEY_FIELD_FOR_SEARCH = "title"
# search by weight keywords and not filters

# * nids 중 특정 테이블에 있는 nid, 없는 nid 반환


def find_nids_in_table(nids, table_name, exist=True):
  nids_str = ", ".join([str(nid) for nid in nids])
  if nids_str.strip() == "":
    return []
  sql = f"SELECT `nid` FROM {table_name} WHERE nid IN ({nids_str});"
  # print(f"@@@@@@@@@@@ find_nids_in_table sql: {sql}")
  rs = mysql.fetch(sql)
  # print(f"####### find_nids_in_table rs: {rs}")
  dones = [] if rs is None or len(rs) == 0 else [
      r[0] for r in mysql.fetch(sql)
  ]
  # dones = [r[0] for r in mysql.fetch(sql)]

  if exist:  # 존재하는 경우
    return dones
  else:  # table_name에는 존재하지 않는 경우
    return [nid for nid in nids if nid not in dones]


# ** 스크래핑 관련
def find_nids_for_fetch_notice_details(last_date=None):
  # 디폴트 검색어
  nids = []
  for domain in SEARCH_DOMAINS:
    (keyword_weight_str, nots_str, min_point) = find_default_keyword(domain)
    # print(keywords, nots, min_point)
    # 스크래핑한 최종 posted_date 날짜: details에서 최종 nid => nid에 해당하는 notices의
    # `posted_date`
    if last_date is None:
      last_date = mysql.fetch(
          "SELECT `posted_date`  FROM notices  WHERE nid=(SELECT MAX(`nid`) FROM details)",
          1)[0]

    add_where = f"`posted_date` > '{last_date}'"
    nids.extend(
        find_nids_by_search_setting(keyword_weight_str, nots_str, min_point,
                                    add_where))

  nids = list(set(nids))
  nids.sort()

  # ? details에 이미 있는 nid 제외
  return find_nids_in_table(nids, "notice_details", exist=False)

  # return [list(dct.keys())[0] for dct in dicts]


# ** server 요청 관련


def find_notice_list_by_nids(nids, base_sql="", add_sql=""):
  nids_str = ", ".join([str(nid) for nid in nids])
  if base_sql == "":
    base_sql = BASE_SQL_NOTICE_LIST_1
  if add_sql == "":
    add_sql = ADD_SQL_NOTICE_LIST_1
  sql = base_sql + f" WHERE notices.nid IN ({nids_str})"
  sql = sql + f" {add_sql};" if len(add_sql) > 5 else sql + ";"

  return mysql.fetch(sql)


# *


def find_notice_list_by_search(keyword_weight_str,
                               nots_str,
                               min_point,
                               add_where="",
                               base_sql="",
                               add_sql=""):
  print(
      f"@@@ find_notice_list_by_search:: keyword_weight_str: {keyword_weight_str}, nots_str: {nots_str}, min_point: {min_point}, add_where: {add_where}, base_sql: {base_sql}, add_sql: {add_sql}"
  )
  nids = find_nids_by_search_setting(keyword_weight_str, nots_str, min_point,
                                     add_where)
  if nids == []:
    return []
  return find_notice_list_by_nids(nids, base_sql, add_sql)


if __name__ == "__main__":
  # # ** 검색 관련
  rs = find_default_keywords(domains=["공사점검", "성능평가", "기타"])
  # print(f"find_default_keywords {rs}")

  (keyword_weight_str, nots_str, min_point) = rs["공사점검"]
  # # rs = find_nids_by_search_setting(keyword_weight_str, nots_str, min_point, add_where="")
  # rs = search_notice_list(keyword_weight_str, nots_str, min_point, add_where="")

  # print(rs)

  # # print(find_default_keywords())
  # nids = [167, 598, 239, 479]
  # add_sql = "ORDER BY notices.nid DESC, files.sn ASC"
  # find_notice_list_by_nids(nids, add_sql=add_sql)

  rs = find_notice_list_by_search(keyword_weight_str,
                                  nots_str,
                                  min_point,
                                  add_where="",
                                  base_sql="",
                                  add_sql="")
  print(rs)

  # # ** 스크래핑 관련
  # print(find_nids_for_fetch_notice_details("2023-03-01"))

  # # *
  # keywords = "내진*3,성능,평가,설계,보강,검증"
  # # add_where = "`posted_date` > '2023-03-31'"
  # add_where = ""
  # add_fields = []
  # get_search_weight(keywords, min_point=4, field="title", table_name="notice_list", add_fields=add_fields, add_where=add_where)
  # # print(rs)
