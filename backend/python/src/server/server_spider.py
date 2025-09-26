# https://fastapi.tiangolo.com/tutorial/query-params-str-validations/#query-parameter-list-multiple-values
# uvicorn server_spider:app --reload --host=0.0.0.0 --port=11301
# curl -X POST "http://localhost:11301/check_fetch_list/" -H
# "Content-Type: application/json" -d '{"org_name": "가평군청"}'
from typing import Optional, List, Dict
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
import uvicorn
import os
import sys
from dotenv import load_dotenv

# Add the parent directory to sys.path to enable imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from spider.spider_list import scrape_list, scrape_list_by_settings, ERROR_CODES
from spider.spider_detail import scrape_detail_by_settings, _fetch_detail_by_nid
import json

# 환경 변수 로드
load_dotenv('/exposed/.env')

BE_PORT_BID_NOTICE_SPIDER = int(os.getenv("BE_PORT_BID_NOTICE_SPIDER", 1301))


class CSVRequest(BaseModel):
  csv: str


class ListPageSettings(BaseModel):
  org_name: str
  url: str
  rowXpath: str
  elements: str
  iframe: Optional[str] = None
  paging: Optional[str] = None
  startPage: Optional[int] = 1
  endPage: Optional[int] = 1
  login: Optional[str] = None
  org_region: Optional[str] = None
  registration: Optional[str] = None
  use: Optional[int] = 1
  company_in_charge: Optional[str] = None
  org_man: Optional[str] = None
  exception_row: Optional[str] = None


class DetailPageSettings(BaseModel):
  org_name: str
  title: str
  body_html: str
  file_name: str
  file_url: str
  preview: Optional[str] = None
  notice_div: Optional[str] = None
  notice_num: Optional[str] = None
  org_dept: Optional[str] = None
  org_man: Optional[str] = None
  org_tel: Optional[str] = None


class Nids(BaseModel):
  nids_str: str


class CheckResult(BaseModel):
  org_name: str
  success: bool
  error_code: int
  error_message: str
  data_count: int
  first_page_data: Optional[List[Dict]] = None


app = FastAPI()


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


@app.post("/scrape_list_by_settings")
def scrape_list_by_settings_endpoint(settings: ListPageSettings):
  """
  스크래핑 설정을 받아서 게시판 목록을 스크래핑합니다.

  Args:
    settings (ListPageSettings): 스크래핑 설정

  Returns:
    dict: {
      'org_name': org_name,
      'error_code': 에러 코드 (0은 성공),
      'error_message': 에러 메시지,
      'data': 스크래핑된 결과 dictionary 리스트
    }
  """
  try:
    # Pydantic 모델을 dict로 변환
    settings_dict = settings.model_dump()
    result = scrape_list_by_settings(settings_dict)
    return result
  except Exception as e:
    return {
        'org_name': settings.org_name,
        'error_code': ERROR_CODES["UNKNOWN_ERROR"],
        'error_message': f"스크래핑 중 예상치 못한 오류 발생: {str(e)}",
        'data': []
    }


@app.post("/scrape_detail_by_settings")
def scrape_detail_by_settings_endpoint(
    url: str,
    settings: DetailPageSettings,
    debug: bool = False
):
  """
  스크래핑 설정을 받아서 상세 페이지를 스크래핑합니다.

  Args:
    url (str): 상세 페이지 URL
    settings (DetailPageSettings): 스크래핑 설정
    debug (bool): 디버그 모드

  Returns:
    dict: {
      'org_name': org_name,
      'error_code': 에러 코드 (0은 성공),
      'error_message': 에러 메시지,
      'data': 스크래핑된 결과 dictionary
    }
  """
  try:
    # Pydantic 모델을 dict로 변환
    settings_dict = settings.model_dump()
    result = scrape_detail_by_settings(url, settings.org_name, settings_dict, debug)
    return result
  except Exception as e:
    return {
        'org_name': settings.org_name,
        'error_code': 900,  # UNKNOWN_ERROR
        'error_message': f"상세 페이지 스크래핑 중 예상치 못한 오류 발생: {str(e)}",
        'data': {}
    }


@app.get("/fetch_detail_by_nid")
def fetch_detail_by_nid_endpoint(
    nid: int,
    debug: bool = False
):
  """
  NID를 받아서 상세 페이지를 스크래핑합니다.

  Args:
    nid (int): Notice ID
    debug (bool): 디버그 모드

  Returns:
    dict: 스크래핑된 결과
  """
  try:
    result = _fetch_detail_by_nid(nid, required_keys=["title"], debug=debug)
    if result is None:
      return {
          'error_code': 404,
          'error_message': f"NID {nid}에 해당하는 공고를 찾을 수 없습니다.",
          'data': None
      }
    return {
        'error_code': 0,
        'error_message': '',
        'data': result
    }
  except Exception as e:
    return {
        'error_code': 900,  # UNKNOWN_ERROR
        'error_message': f"상세 페이지 스크래핑 중 예상치 못한 오류 발생: {str(e)}",
        'data': None
    }


# ** fastapi functions
# * test post csv


@app.post("/test_csv/")
def check_list_page(request: CSVRequest):
  return request.csv


@app.get("/hello")
def hello():
  return {"message": "Hello, World!"}


# # * check downloadable for detail page
# @app.post("/check_detail_page/")
# def check_detail_pages(settings: ListPageSettings):
#   return fetch_list_pages(names, save=False)

# # * fetch list pages
# @app.get("/scrape_list_pages/")
# def scrape_list_pages(names):
#   return fetch_list_pages(names, save=False)

# # * fetch detail page
# @app.get("/scrape_pages/")
# def scrape_detail_pages(nids):
#   return fetch_detail_page_by_url(names, save=False)

# # * download files
# @app.get("/download/")
# def download_files(nids):
#   return download_files(names, save=False)

if __name__ == "__main__":
  uvicorn.run(
      "server_spider:app",
      host="0.0.0.0",
      reload=False,
      port=BE_PORT_BID_NOTICE_SPIDER
  )
