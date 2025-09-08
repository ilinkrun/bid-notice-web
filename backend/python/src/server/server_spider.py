# https://fastapi.tiangolo.com/tutorial/query-params-str-validations/#query-parameter-list-multiple-values
# uvicorn server_spider:app --reload --host=0.0.0.0 --port=11301
# curl -X POST "http://localhost:11301/check_fetch_list/" -H
# "Content-Type: application/json" -d '{"org_name": "가평군청"}'
from typing import Optional, List, Dict
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
import uvicorn
import os
from dotenv import load_dotenv

from spider.spider_list import scrape_list, ERROR_CODES
import json

# 환경 변수 로드
load_dotenv('/exposed/.env')

BE_PORT_BID_NOTICE_SPIDER = int(os.getenv("BE_PORT_BID_NOTICE_SPIDER", 1301))


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
