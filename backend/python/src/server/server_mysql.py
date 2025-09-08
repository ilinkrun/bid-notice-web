# uvicorn server_mysql:app --reload --host=0.0.0.0 --port=11302
from pydantic import BaseModel
from typing import Optional, List

from fastapi import FastAPI, HTTPException
import uvicorn
import os
import sys
from dotenv import load_dotenv

# Add the parent directory to sys.path to enable imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from utils.utils_mysql import Mysql
from mysql.mysql_database import delete_old_notice_list, backup_db_sql, schema_backup

# 환경 변수 로드
load_dotenv('/exposed/.env')

BE_PORT_BID_NOTICE_MYSQL = int(os.getenv("BE_PORT_BID_NOTICE_MYSQL", 1302))

#    ** Global Variables
# MYSQL_CONFIG = dict(host='172.17.0.3', port=3306, user='root', passwd='mysqlIlmac1!', db='ilmac_bid_db', charset='utf8')

TABLE_NOTICES = "notice_list"
TABLE_DETAILS = "notice_details"
TABLE_FILES = "notice_files"
KEY_FIELD_NOTICES = "nid"
KEY_FIELD_FOR_SEARCH = "title"
SEARCH_DOMAINS = ["공사점검", "성능평가", "기타"]

# ** BASE_SQL
# notices, details
BASE_SQL_NOTICE_LIST_1 = "SELECT notices.nid, notices.posted_date, notices.org_name, notices.title, notices.detail_url, details.notice_num, details.file_name, details.created_at FROM notices LEFT JOIN details ON notices.nid = details.nid"

# notices, details, files
BASE_SQL_NOTICE_LIST_2 = "SELECT notices.nid, notices.posted_date, notices.org_name, details.notice_num, notices.title, notices.detail_url, files.file_name, details.created_at FROM notices LEFT JOIN details ON notices.nid = details.nid LEFT JOIN files ON notices.nid = files.nid"

# ** ADD_SQL
ADD_SQL_NOTICE_LIST_1 = "ORDER BY notices.nid DESC"
ADD_SQL_NOTICE_LIST_2 = "ORDER BY notices.nid DESC, files.sn ASC"

app = FastAPI()
mysql = Mysql()


class Sql(BaseModel):
  sql: str


class Search(BaseModel):
  keywords: str
  nots: str
  min_point: int
  add_where: Optional[str] = ""
  base_sql: Optional[str] = ""
  add_sql: Optional[str] = ""


class Upsert(BaseModel):
  table_name: str
  data: str


class UpdateNoticeCategory(BaseModel):
  nids: List[int]
  category: str


# ** fastapi functions


@app.post("/fetch_by_sql/")
def get_fetch(sql: Sql):
  mysql = Mysql()
  rs = mysql.fetch(sql.sql)
  mysql.close()
  return rs


# search by weight keywords and not filters


@app.post("/notice_list_by_search/")
def post_notice_list_by_search(search: Search):
  # ? 초기화
  keyword_str = search.keywords.strip()
  not_str = search.nots.strip()
  min_point = search.min_point
  add_where = search.add_where.strip()
  base_sql = search.base_sql.strip()
  add_sql = search.add_sql.strip()

  mysql = Mysql()

  # ? 검색(keyword_str) 조건 적용

  # * 검색어 문자열 -> 배열(keyword_str => keyword_arr)
  keyword_arr = []
  for kw in keyword_str.split(","):
    kws = kw.split("*")
    k = kws[0].strip()
    if k == "":
      continue
    w = 1 if len(kws) < 2 else int(kws[1].strip())
    keyword_arr.append((k, w))

  # return keyword_arr
  # * 검색어 적용(keyword_str => searched_by_keyword_arr)
  rst = {}

  for (keyword, weight) in keyword_arr:
    addStr = f"where `{KEY_FIELD_FOR_SEARCH}` like '%{keyword}%'"
    addStr = addStr if add_where.strip() == "" else f"{addStr} AND {add_where}"
    fields = [KEY_FIELD_NOTICES, KEY_FIELD_FOR_SEARCH]
    # print(f"+++get_search_weight TABLE_NOTICES: {TABLE_NOTICES}, fields: {fields}, addStr: {addStr}")
    _rs = mysql.find(TABLE_NOTICES, fields, addStr)

    if len(_rs) == 0:
      continue

    rs = []
    for r in _rs:
      rs.append([keyword, weight] + list(r))

    for r in rs:
      nid = r[2]
      if nid not in rst:
        rst[nid] = {KEY_FIELD_FOR_SEARCH: r[3], "matched": r[0], "point": r[1]}
      else:
        rst[nid]["matched"] += f",{r[0]}"
        rst[nid]["point"] += int(r[1])

  searched_by_keyword_arr = [{
      nid: row
  } for (nid, row) in rst.items() if row["point"] >= int(min_point)]

  # * 배제어 적용 nid 배열(nids_after_not_arr)
  nids_in_not_arr = []

  for data in searched_by_keyword_arr:
    found = False
    for (nid, row) in data.items():
      for nt in not_str.split(","):
        if nt in row[KEY_FIELD_FOR_SEARCH]:
          nids_in_not_arr.append(nid)
          break

  nids_after_keyword_arr = [
      list(row.keys())[0] for row in searched_by_keyword_arr
  ]
  nids_after_not_arr = [
      nid for nid in nids_after_keyword_arr if nid not in nids_in_not_arr
  ]  # ? 검색 최종 결과 nids

  # return nids_after_not_arr
  if len(nids_after_not_arr) == 0:
    response = []
  else:
    nids_str = ", ".join([str(nid) for nid in nids_after_not_arr])
    sql = base_sql + f" WHERE notices.nid IN ({nids_str})"
    sql = sql + f" {add_sql};" if len(add_sql) > 5 else sql + ";"
    # print(sql)

    response = mysql.fetch(sql)

  mysql.close()  # ? mysql 접속 종료
  # print(len(response))

  return response


# @app.post("/upsert_table/{table_name}")
# def upsert_table(upsert):
#     upsert(self, csv, table_name, updKeys=[], close=False)
#     return find_notice_list(names, keywords)

# ** database 관리
# ------------------------------------------------------------


@app.delete("/delete_old_notice_list")
def delete_old_notice_list_endpoint(day_gap: int = 15):
  """
  오래된 공고들을 삭제합니다.
  """
  try:
    result = delete_old_notice_list(day_gap)
    return {"success": True, "message": f"{result}개의 오래된 공고가 삭제되었습니다"}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.post("/backup_db")
def backup_database():
  """
  데이터베이스를 백업합니다.
  """
  try:
    result = backup_db_sql()
    return {"success": True, "message": "데이터베이스 백업이 완료되었습니다", "data": result}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.post("/schema_backup")
def backup_schema(filename: str = None):
  """
  데이터베이스 스키마를 백업합니다.
  """
  try:
    result = schema_backup(filename)
    if result:
      return {
          "success": True,
          "message": "스키마 백업이 완료되었습니다",
          "filename": result
      }
    else:
      return {"success": False, "message": "스키마 백업에 실패했습니다"}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.post("/update_notice_category")
def update_notice_category(update_data: UpdateNoticeCategory):
  """
  공고의 카테고리를 업데이트합니다.
  """
  try:
    mysql = Mysql()
    
    # 각 nid에 대해 카테고리 업데이트
    updated_count = 0
    for nid in update_data.nids:
      try:
        # 공고가 존재하는지 확인
        existing_notice = mysql.find(TABLE_NOTICES, ["nid"], f"WHERE nid = {nid}")
        if not existing_notice:
          print(f"Warning: Notice with nid {nid} not found")
          continue
        
        # 카테고리 업데이트
        update_sql = f"UPDATE {TABLE_NOTICES} SET category = '{update_data.category}' WHERE nid = {nid}"
        mysql.execute(update_sql)
        updated_count += 1
        
      except Exception as e:
        print(f"Error updating nid {nid}: {str(e)}")
        continue
    
    mysql.close()
    
    if updated_count > 0:
      return {
        "success": True,
        "message": f"{updated_count}개의 공고 유형이 '{update_data.category}'로 변경되었습니다.",
        "updated_count": updated_count
      }
    else:
      return {
        "success": False,
        "message": "업데이트된 공고가 없습니다."
      }
    
  except Exception as e:
    print(f"Error in update_notice_category: {str(e)}")
    raise HTTPException(status_code=500, detail=f"카테고리 업데이트 중 오류가 발생했습니다: {str(e)}")


if __name__ == "__main__":
  uvicorn.run("server_mysql:app", host="0.0.0.0", reload=False, port=BE_PORT_BID_NOTICE_MYSQL)
