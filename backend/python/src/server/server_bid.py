# nohup uvicorn server_bid:app --reload --host=0.0.0.0 --port=11303 >
# output.log 2>&1 &

from typing import Optional, List, Dict
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, Query
import uvicorn
import os
from dotenv import load_dotenv
from utils.utils_mysql import Mysql
# Import from separated mysql modules
from mysql.mysql_settings import (
    find_settings_notice_list, find_settings_notice_list_by_org_name,
    _upsert_settings_notice_list_by_org_name, upsert_settings_notice_list_by_org_name,
    find_settings_notice_list_by_oid, upsert_settings_notice_list_by_oid,
    find_settings_notice_detail, find_settings_notice_detail_by_org_name,
    find_settings_notice_detail_by_oid, upsert_settings_notice_detail_by_oid,
    detail_config_by_org_name, get_detail_elements, add_settings_to_notice,
    find_all_settings_notice_category, find_settings_notice_category,
    get_keyword_weight_list, get_search_weight, filter_by_not)

from mysql.mysql_notice import (find_notice_list_with_category, find_last_notice,
                          find_notice_list_by_category,
                          find_notice_list_for_statistics, search_notice_list,
                          upsert_notice_list, find_my_bids, find_my_bids_by_status, find_my_bid_by_nid, update_all_category,
                          update_notice_category_by_nids, exclude_notices_by_nids, restore_notices_by_nids)

from mysql.mysql_logs import (find_logs_notice_scraping, find_errors_notice_scraping)
from spider.spider_list import scrape_list, ERROR_CODES
from spider.spider_detail import notice_to_progress
import json
from fastapi.middleware.cors import CORSMiddleware
import time

# 환경 변수 로드
load_dotenv('/exposed/.env')

DAY_GAP = os.getenv("DAY_GAP")
BE_PORT_BID_NOTICE_BID = int(os.getenv("BE_PORT_BID_NOTICE_BID", 1303))

# ** Global Variables(scraping)
# ------------------------------------------------------------


class CSVRequest(BaseModel):
  csv: str


class ListPageSettings(BaseModel):
  use: str
  org_name: str
  url: str
  iframe: str
  rowXpath: str
  title: str
  detail_url: str
  posted_date: str
  posted_by: str
  exception_row: str
  paging: str
  startPage: str
  endPage: str
  login: str
  org_region: str
  _비고: str


class DetailPageSettings(BaseModel):
  use: str
  org_name: str
  title: str
  body_html: str
  file_name: str
  file_url: str
  preview: str
  notice_div: str
  notice_num: str
  org_dept: str
  org_man: str
  org_tel: str


class Nids(BaseModel):
  nids_str: str


class NoticeToProgressRequest(BaseModel):
  nids: List[int]


class UpdateCategoryRequest(BaseModel):
  nids: List[int]
  category: str


class ExcludeNoticesRequest(BaseModel):
  nids: List[int]


class RestoreNoticesRequest(BaseModel):
  nids: List[int]


class NasPathSetting(BaseModel):
  name: str
  area: str
  depth: int
  folder: str
  remark: Optional[str] = None


class UpdateNasPathSetting(BaseModel):
  name: Optional[str] = None
  area: Optional[str] = None
  depth: Optional[int] = None
  folder: Optional[str] = None
  remark: Optional[str] = None


class CheckResult(BaseModel):
  org_name: str
  success: bool
  error_code: int
  error_message: str
  data_count: int
  first_page_data: Optional[List[Dict]] = None


# ** Global Variables(mysql)
# ------------------------------------------------------------
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


# ** MYSQL
# ------------------------------------------------------------
# mysql = Mysql()

# ** 공통
# ------------------------------------------------------------

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청 처리 시간 로깅을 위한 미들웨어


@app.middleware("http")
async def log_requests(request, call_next):
  start_time = time.time()
  response = await call_next(request)
  end_time = time.time()
  print(
      f"Request to {request.url.path} took {end_time - start_time:.2f} seconds"
  )
  return response


# ** settings(list)
# ------------------------------------------------------------
@app.get("/settings_notice_list")
def get_settings_notice_list():
  """
  모든 스크래핑 설정 목록을 반환합니다.
  """
  try:
    result = find_settings_notice_list(addStr="")  # use = 0 도 포함
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/settings_notice_list/{org_name}")
def get_settings_notice_list_by_org_name(org_name: str):
  """
  특정 기관의 스크래핑 설정을 반환합니다.
  """
  try:
    result = find_settings_notice_list_by_org_name(org_name, out_type="dict")
    if not result:
      raise HTTPException(status_code=404, detail=f"설정을 찾을 수 없습니다: {org_name}")
    return result
  except HTTPException as he:
    raise he
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


# @app.post("/settings_notice_list1/{org_name}")
# def _upsert_settings_notice_list_by_org_name1(org_name: str, data: Dict):
#     """
#     특정 기관의 스크래핑 설정을 반환합니다.
#     """
#     try:
#         result = _upsert_settings_notice_list_by_org_name(org_name, data)
#         if not result:
#             raise HTTPException(status_code=404, detail=f"설정을 찾을 수 없습니다: {org_name}")
#         return result
#     except HTTPException as he:
#         raise he
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


@app.post("/settings_notice_list/{org_name}")
def upsert_settings_notice_list_by_org_name2(org_name: str, data: Dict):
  """
  특정 기관의 스크래핑 설정을 반환합니다.
  """
  result = upsert_settings_notice_list_by_org_name(org_name, data)
  return result
  # try:
  #     result = _upsert_settings_notice_list_by_org_name(org_name, data)
  #     if not result:
  #         raise HTTPException(status_code=404, detail=f"설정을 찾을 수 없습니다: {org_name}")
  #     return result
  # except HTTPException as he:
  #     raise he
  # except Exception as e:
  #     raise HTTPException(status_code=500, detail=str(e))


@app.get("/settings_notice_list_by_oid/{oid}")
def get_settings_notice_list_by_oid(oid: int):
  """
  특정 OID의 스크래핑 설정을 반환합니다.
  """
  try:
    result = find_settings_notice_list_by_oid(oid, out_type="dict")
    if not result:
      raise HTTPException(status_code=404, detail=f"설정을 찾을 수 없습니다: {oid}")
    return result
  except HTTPException as he:
    raise he
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.post("/settings_notice_list_by_oid/{oid}")
def upsert_settings_notice_list_by_oid_endpoint(oid: int, data: Dict):
  """
  특정 OID의 스크래핑 설정을 업데이트합니다.
  """
  try:
    result = upsert_settings_notice_list_by_oid(oid, data)
    if not result:
      raise HTTPException(status_code=500, detail=f"설정 업데이트에 실패했습니다: {oid}")
    return {"success": True, "message": "설정이 성공적으로 업데이트되었습니다."}
  except HTTPException as he:
    raise he
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


# ** settings(detail)
# ------------------------------------------------------------


@app.get("/settings_notice_detail")
def get_all_settings_notice_detail():
  """
  특정 기관의 상세 페이지 스크래핑 설정을 반환합니다.
  """
  try:
    result = find_settings_notice_detail(addStr="", out_type="dicts")
    if not result:
      raise HTTPException(status_code=404, detail=f"상세 설정을 찾을 수 없습니다")
    return result
  except HTTPException as he:
    raise he
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/settings_notice_detail/{org_name}")
def get_settings_notice_detail(org_name: str):
  """
  특정 기관의 상세 페이지 스크래핑 설정을 반환합니다.
  """
  try:
    result = find_settings_notice_detail_by_org_name(org_name)
    if not result:
      raise HTTPException(status_code=404,
                          detail=f"상세 설정을 찾을 수 없습니다: {org_name}")
    return result
  except Exception as e:
    return {}
    # raise HTTPException(status_code=500, detail=str(e))
  # print(result)
  # try:
  #     # result = find_settings_notice_detail_by_org_name(org_name, fields=["org_name", "title", "body_html", "file_name", "file_url", "notice_div", "notice_num", "org_dept", "org_man", "org_tel"], out_type="dict")
  #     # result = find_settings_notice_list_by_org_name(org_name, out_type="dict")
  #     result = find_settings_notice_detail_by_org_name(org_name)
  #     if not result:
  #         raise HTTPException(status_code=404, detail=f"상세 설정을 찾을 수 없습니다: {org_name}")
  #     return result
  # except HTTPException as he:
  #     raise he
  # except Exception as e:
  #     raise HTTPException(status_code=500, detail=str(e))


@app.get("/settings_notice_detail_by_oid/{oid}")
def get_settings_notice_detail_by_oid(oid: int):
  """
  특정 OID의 상세 페이지 스크래핑 설정을 반환합니다.
  """
  try:
    result = find_settings_notice_detail_by_oid(oid, out_type="dict")
    if not result:
      raise HTTPException(status_code=404, detail=f"상세 설정을 찾을 수 없습니다: {oid}")
    return result
  except HTTPException as he:
    raise he
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.post("/settings_notice_detail_by_oid/{oid}")
def upsert_settings_notice_detail_by_oid_endpoint(oid: int, data: Dict):
  """
  특정 OID의 상세 페이지 스크래핑 설정을 업데이트합니다.
  """
  try:
    result = upsert_settings_notice_detail_by_oid(oid, data)
    if not result:
      raise HTTPException(status_code=500, detail=f"상세 설정 업데이트에 실패했습니다: {oid}")
    return {"success": True, "message": "상세 설정이 성공적으로 업데이트되었습니다."}
  except HTTPException as he:
    raise he
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/detail_config/{org_name}")
def get_detail_config(org_name: str):
  """
  특정 기관의 상세 페이지 설정을 반환합니다.
  """
  try:
    result = detail_config_by_org_name(org_name)
    if not result:
      raise HTTPException(status_code=404,
                          detail=f"상세 설정을 찾을 수 없습니다: {org_name}")
    return result
  except HTTPException as he:
    raise he
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


# ** notices
# ------------------------------------------------------------


@app.get("/notice_list")
def get_notice_list_gap(
    gap: int = Query(
        None,
        description="몇 일 전까지의 공고를 가져올지 지정합니다. 지정하지 않으면 DAY_GAP 값을 사용합니다.")):
  """
  특정 카테고리의 공고 목록을 반환합니다.
  """
  try:
    # gap이 None이면 DAY_GAP 사용
    if gap is None:
      gap = int(DAY_GAP)
    result = find_notice_list_with_category(
        add_where=f"`posted_date` >= DATE_SUB(NOW(), INTERVAL {gap} DAY)")

    # 각 row의 org_name에 해당하는 'org_region', 'registration' 필드값을 가져오기
    for item in result:
      add_settings_to_notice(item)

    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/notice_list/{category}")
def get_notice_list_gap_category(
    category: str,
    gap: int = Query(
        None,
        description="몇 일 전까지의 공고를 가져올지 지정합니다. 지정하지 않으면 DAY_GAP 값을 사용합니다.")):
  """
  특정 카테고리의 공고 목록을 반환합니다.
  """
  try:
    # gap이 None이면 DAY_GAP 사용
    if gap is None:
      gap = int(DAY_GAP)
    result = find_notice_list_by_category(category, day_gap=gap)

    # 각 row의 org_name에 해당하는 'org_region', 'registration' 필드값을 가져오기
    for item in result:
      add_settings_to_notice(item)

    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/notice_list_statistics")
def get_notice_list_for_statistics(
    gap: int = Query(
        None,
        description="몇 일 전까지의 공고를 가져올지 지정합니다. 지정하지 않으면 DAY_GAP 값을 사용합니다.")):
  """
  특정 카테고리의 공고 목록을 반환합니다.
  """
  try:
    # gap이 None이면 DAY_GAP 사용
    if gap is None:
      gap = int(DAY_GAP)
    result = find_notice_list_for_statistics(
        fields=["org_name", "posted_date", "category"], day_gap=gap)

    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/last_notice/{org_name}")
def get_last_notice(org_name: str, field: str = "title"):
  """
  특정 기관의 마지막 공고를 반환합니다.
  """
  try:
    result = find_last_notice(org_name, field)
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.post("/search_notice_list")
def search_notice_list_endpoint(search: Search):
  """
  키워드 기반으로 공고를 검색합니다.
  """
  try:
    result = search_notice_list(
        search.keywords,
        search.nots,
        search.min_point,
        add_fields=["detail_url", "posted_date", "posted_by", "org_name"],
        add_where=search.add_where)
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.post("/notice_list")
def upsert_notice_list_endpoint(data: List[Dict]):
  """
  공고의 카테고리 관계를 업데이트합니다.
  """
  try:
    upsert_notice_list(data)
    return {"success": True, "message": f"notices updated"}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.post("/notice_to_progress")
def notice_to_progress_endpoint(request: NoticeToProgressRequest):
  """
  체크된 입찰 공고들을 진행 상태로 변경합니다.
  각 nid에 대해 spider_detail.py의 notice_to_progress 함수를 실행합니다.
  """
  try:
    success_count = 0
    failed_nids = []
    
    for nid in request.nids:
      try:
        notice_to_progress(nid)
        success_count += 1
      except Exception as e:
        print(f"Error processing nid {nid}: {str(e)}")
        failed_nids.append(nid)
    
    if failed_nids:
      return {
        "success": False if success_count == 0 else True,
        "message": f"{success_count}개의 공고가 성공적으로 처리되었습니다. 실패한 공고: {failed_nids}",
        "success_count": success_count,
        "failed_nids": failed_nids
      }
    else:
      return {
        "success": True,
        "message": f"모든 {success_count}개의 공고가 성공적으로 진행 상태로 변경되었습니다.",
        "success_count": success_count,
        "failed_nids": []
      }
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


# !!! 수정중
# @app.post("/notice_list/status")
# def _update_notice_status(data: Dict):
#   """
#   공고의 status를 업데이트합니다.
#   data: {nid: 1234, from: "제외", to: "진행"}
#   """
#   try:
#     update_notice_status(data)
#     return {"success": True, "message": f"notice status updated"}
#   except Exception as e:
#     raise HTTPException(status_code=500, detail=str(e))


# @app.put("/update_category/{nid}/{category}")
# def update_notice_relation(nid: str, category: str):
#     """
#     공고의 카테고리 관계를 업데이트합니다.
#     """
#     try:
#         update_category(nid, category)
#         return {"success": True, "message": f"관계가 업데이트되었습니다: {nid} -> {category}"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


@app.post("/update_notice_category")
def update_notice_category_endpoint(request: UpdateCategoryRequest):
  """
  여러 공고의 카테고리를 업데이트합니다.
  """
  try:
    updated_count = update_notice_category_by_nids(request.nids, request.category)
    
    if updated_count > 0:
      return {
        "success": True,
        "message": f"{updated_count}개의 공고 유형이 '{request.category}'로 변경되었습니다.",
        "updated_count": updated_count
      }
    else:
      return {
        "success": False,
        "message": "업데이트된 공고가 없습니다. 해당 nid들이 존재하지 않을 수 있습니다."
      }
  except Exception as e:
    print(f"Error in update_notice_category_endpoint: {str(e)}")
    raise HTTPException(status_code=500, detail=f"카테고리 업데이트 중 오류가 발생했습니다: {str(e)}")


@app.post("/exclude_notices")
def exclude_notices_endpoint(request: ExcludeNoticesRequest):
  """
  여러 공고를 업무에서 제외합니다 (is_selected=-1로 설정).
  """
  try:
    updated_count = exclude_notices_by_nids(request.nids)
    
    if updated_count > 0:
      return {
        "success": True,
        "message": f"{updated_count}개의 공고가 업무에서 제외되었습니다.",
        "updated_count": updated_count
      }
    else:
      return {
        "success": False,
        "message": "제외된 공고가 없습니다. 해당 nid들이 존재하지 않을 수 있습니다."
      }
  except Exception as e:
    print(f"Error in exclude_notices_endpoint: {str(e)}")
    raise HTTPException(status_code=500, detail=f"공고 제외 처리 중 오류가 발생했습니다: {str(e)}")


@app.post("/restore_notices")
def restore_notices_endpoint(request: RestoreNoticesRequest):
  """
  여러 공고를 업무에 복원합니다 (is_selected=0으로 설정).
  """
  try:
    updated_count = restore_notices_by_nids(request.nids)
    
    if updated_count > 0:
      return {
        "success": True,
        "message": f"{updated_count}개의 공고가 업무에 복원되었습니다.",
        "updated_count": updated_count
      }
    else:
      return {
        "success": False,
        "message": "복원된 공고가 없습니다. 해당 nid들이 존재하지 않을 수 있습니다."
      }
  except Exception as e:
    print(f"Error in restore_notices_endpoint: {str(e)}")
    raise HTTPException(status_code=500, detail=f"공고 복원 처리 중 오류가 발생했습니다: {str(e)}")


# ** bids
# ------------------------------------------------------------
@app.get("/my_bids")
def get_bids():
  """
  모든 공고 목록을 반환합니다.
  """
  try:
    result = find_my_bids()
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/my_bids/{status}")
def get_bids_by_status(status: str):
  """
  특정 상태의 공고 목록을 반환합니다.
  """
  try:
    result = find_my_bids_by_status(status)
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/my_bids/detail/{nid}")
def get_bid_by_nid(nid: str):
  """
  특정 nid의 입찰 정보를 반환합니다.
  """
  try:
    result = find_my_bid_by_nid(nid)
    if not result:
      raise HTTPException(status_code=404, detail=f"입찰 정보를 찾을 수 없습니다: {nid}")
    return result
  except HTTPException as he:
    raise he
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


# ** logs, errors
# ------------------------------------------------------------


@app.get("/logs_notice_scraping")
def get_logs(gap: int = Query(None, description="DAY_GAP")):
  """
  특정 기간 동안의 로그 목록을 반환합니다.
  """
  try:
    if gap is None:
      gap = int(DAY_GAP)
    result = find_logs_notice_scraping(gap)
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/errors_notice_scraping")
def get_errors(gap: int = Query(None, description="DAY_GAP")):
  """
  특정 기간 동안의 에러 목록을 반환합니다.
  """
  try:
    if gap is None:
      gap = int(DAY_GAP)
    result = find_errors_notice_scraping(gap)
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


# ** SCRAPING
# ------------------------------------------------------------


@app.get("/check_fetch_list")
def check_fetch_list(org_name: str):
  """
  특정 기관의 게시판 목록을 스크래핑하여 결과를 반환합니다.

  Args:
    org_name (str): 스크래핑할 기관명

  Returns:
    dict: {
      'org_name': org_name,
      'error_code': 에러 코드 (0은 성공),
      'error_message': 에러 메시지,
      'data': 스크래핑된 결과 dictionary 리스트
    }
  """
  try:
    result = scrape_list(org_name, start_page=1, end_page=2)
    return result
  except Exception as e:
    return {
        'org_name': org_name,
        'error_code': ERROR_CODES["UNKNOWN_ERROR"],
        'error_message': f"스크래핑 중 예상치 못한 오류 발생: {str(e)}",
        'data': []
    }


# ** fastapi functions


@app.get("/hello")
def hello():
  return {"message": "Hello, World!"}


# ** MYSQL
# ------------------------------------------------------------
@app.get("/check_settings_notice_list")
def check_settings_notice_list(org_name: str):
  """
  기관명을 받아 해당 기관의 스크래핑 설정을 반환하는 API
  find_settings_notice_list_by_org_name 함수를 사용하여 설정을 가져옵니다.
  """
  try:
    # mysql_settings.py에서 가져온 find_settings_notice_list_by_org_name 함수를 사용
    # 이 함수는 이미 내부적으로 MySQL 연결을 생성하고 닫음
    result = find_settings_notice_list_by_org_name(org_name, out_type="dict")

    # 예외 처리: 결과가 비어있을 경우
    if not result:
      return {"error": "기관명에 해당하는 설정을 찾을 수 없습니다"}

    return result

  except Exception as e:
    # 로그를 출력하여 디버깅에 도움이 되도록 합니다
    import sys
    print(f"Error in check_settings_notice_list: {str(e)}", file=sys.stderr)
    return {"error": str(e)}


# 키워드 관련 요청 모델 추가
class KeywordSearch(BaseModel):
  keywords: str
  min_point: int = 4
  field: str = "title"
  table_name: str = "notice_list"
  add_fields: List[str] = []
  add_where: str = ""


class KeywordFilter(BaseModel):
  not_str: str
  dicts: List[Dict]
  field: str = "title"


# ** KEYWORDS
# ------------------------------------------------------------


@app.get("/settings_notice_categorys")
def get_all_categorys():
  """
  모든 키워드 설정을 반환합니다.
  """
  try:
    result = find_all_settings_notice_category(addStr="")  # use = 0 도 포함
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/settings_notice_categorys/{category}")
def get_categorys_by_category(category: str):
  """
  특정 카테고리의 키워드 설정을 반환합니다.

  Args:
      category (str): 카테고리명 (예: "공사점검", "성능평가", "기타")
  """
  try:
    result = find_settings_notice_category(category,
                                           fields=[
                                               "sn", "keywords", "nots",
                                               "min_point", "category",
                                               "creator", "memo"
                                           ])
    if not result:
      raise HTTPException(status_code=404,
                          detail=f"카테고리에 대한 키워드 설정을 찾을 수 없습니다: {category}")
    return result
  except HTTPException as he:
    raise he
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.post("/category_weight_search")
def search_by_keyword_weight(search: KeywordSearch):
  """
  키워드 가중치를 기반으로 공고를 검색합니다.

  Request Body:
      keywords (str): "키워드*가중치,키워드*가중치,..." 형식의 문자열
      min_point (int): 최소 가중치 점수 (기본값: 4)
      field (str): 검색할 필드명 (기본값: "title")
      table_name (str): 검색할 테이블명 (기본값: "notice_list")
      add_fields (list): 추가로 가져올 필드명 리스트
      add_where (str): 추가 WHERE 조건
  """
  try:
    result = get_search_weight(search.keywords, search.min_point, search.field,
                               search.table_name, search.add_fields,
                               search.add_where)
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.post("/filter_notice_list")
def filter_notice_list(filter_params: KeywordFilter):
  """
  제외 문자열을 기준으로 공고 목록을 필터링합니다.

  Request Body:
      not_str (str): 제외할 문자열들 (쉼표로 구분)
      dicts (list): 필터링할 딕셔너리 리스트
      field (str): 필터링 기준이 되는 필드명 (기본값: "title")
  """
  try:
    result = filter_by_not(filter_params.not_str, filter_params.dicts,
                           filter_params.field)
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/parse_keyword_weights")
def parse_keyword_weights(keyword_weight_str: str):
  """
  키워드 가중치 문자열을 파싱하여 리스트로 변환합니다.

  Args:
      keyword_weight_str (str): "키워드*가중치,키워드*가중치,..." 형식의 문자열

  Returns:
      list: [(키워드, 가중치), ...] 형식의 리스트
  """
  try:
    result = get_keyword_weight_list(keyword_weight_str)
    return result
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


# ** NAS PATH SETTINGS
# ------------------------------------------------------------

@app.get("/settings_nas_path")
def get_nas_path_settings():
  """
  모든 NAS 경로 설정을 반환합니다.
  """
  try:
    mysql = Mysql()
    result = mysql.find("settings_nas_path",
                       fields=['id', 'name', 'area', 'depth', 'folder', 'remark'],
                       addStr="ORDER BY depth, id")
    mysql.close()
    
    # 딕셔너리 형태로 변환
    nas_settings = []
    for row in result:
      nas_settings.append({
        'id': row[0],
        'name': row[1],
        'area': row[2],
        'depth': row[3],
        'folder': row[4],
        'remark': row[5]
      })
    
    return nas_settings
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.get("/settings_nas_path/{nas_id}")
def get_nas_path_setting(nas_id: int):
  """
  특정 ID의 NAS 경로 설정을 반환합니다.
  """
  try:
    mysql = Mysql()
    result = mysql.find("settings_nas_path",
                       fields=['id', 'name', 'area', 'depth', 'folder', 'remark'],
                       addStr=f"WHERE id = {nas_id}")
    mysql.close()
    
    if not result:
      raise HTTPException(status_code=404, detail="NAS 경로 설정을 찾을 수 없습니다")
    
    row = result[0]
    return {
      'id': row[0],
      'name': row[1],
      'area': row[2],
      'depth': row[3],
      'folder': row[4],
      'remark': row[5]
    }
  except HTTPException as he:
    raise he
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.post("/settings_nas_path")
def create_nas_path_setting(setting: NasPathSetting):
  """
  새로운 NAS 경로 설정을 생성합니다.
  """
  try:
    mysql = Mysql()
    
    # 데이터 삽입
    data = {
      'name': setting.name,
      'area': setting.area,
      'depth': setting.depth,
      'folder': setting.folder,
      'remark': setting.remark
    }
    
    result = mysql.upsert("settings_nas_path", data)
    mysql.close()
    
    return {
      "success": True,
      "message": "NAS 경로 설정이 성공적으로 생성되었습니다.",
      "id": result
    }
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.put("/settings_nas_path/{nas_id}")
def update_nas_path_setting(nas_id: int, setting: UpdateNasPathSetting):
  """
  기존 NAS 경로 설정을 업데이트합니다.
  """
  try:
    mysql = Mysql()
    
    # 기존 데이터 확인
    existing = mysql.find("settings_nas_path",
                         fields=['id'],
                         addStr=f"WHERE id = {nas_id}")
    if not existing:
      mysql.close()
      raise HTTPException(status_code=404, detail="NAS 경로 설정을 찾을 수 없습니다")
    
    # 업데이트할 데이터만 포함
    update_data = {'id': nas_id}
    if setting.name is not None:
      update_data['name'] = setting.name
    if setting.area is not None:
      update_data['area'] = setting.area
    if setting.depth is not None:
      update_data['depth'] = setting.depth
    if setting.folder is not None:
      update_data['folder'] = setting.folder
    if setting.remark is not None:
      update_data['remark'] = setting.remark
    
    mysql.upsert("settings_nas_path", update_data)
    mysql.close()
    
    return {
      "success": True,
      "message": "NAS 경로 설정이 성공적으로 업데이트되었습니다."
    }
  except HTTPException as he:
    raise he
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


@app.delete("/settings_nas_path/{nas_id}")
def delete_nas_path_setting(nas_id: int):
  """
  NAS 경로 설정을 삭제합니다.
  """
  try:
    mysql = Mysql()
    
    # 기존 데이터 확인
    existing = mysql.find("settings_nas_path",
                         fields=['id'],
                         addStr=f"WHERE id = {nas_id}")
    if not existing:
      mysql.close()
      raise HTTPException(status_code=404, detail="NAS 경로 설정을 찾을 수 없습니다")
    
    # 삭제 실행
    mysql.remove("settings_nas_path", f"WHERE id = {nas_id}")
    mysql.close()
    
    return {
      "success": True,
      "message": "NAS 경로 설정이 성공적으로 삭제되었습니다."
    }
  except HTTPException as he:
    raise he
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
  uvicorn.run(
      "server_bid:app",
      host="0.0.0.0",
      port=BE_PORT_BID_NOTICE_BID,
      workers=4,  # CPU 코어 수에 따라 조정
      reload=True  # 개발 환경에서만 사용
  )

  # print(find_settings_notice_detail_by_org_name("금산군청"))
