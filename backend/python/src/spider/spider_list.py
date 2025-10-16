# -*- coding: utf-8 -*-

# 1~3페이지 목록 스크랩 후, 'detail_url'가 일치하는 항목 제외로 수정

from utils.utils_search import find_nids_for_fetch_notice_details
from utils.utils_data import save_html, load_html, valid_str, arr_from_csv, dict_from_tuple, dicts_from_tuples, csv_from_dict, csv_from_dicts, csv_added_defaults, fix_encoding_response, _now
from mysql.mysql_logs import insert_all_logs, insert_all_errors
from mysql.mysql_notice import find_last_notice, update_all_category
from mysql.mysql_settings import (find_settings_notice_list, find_settings_notice_list_by_org_name,
                                  CATEGORIES, get_categories_by_priority, find_settings_notice_category,
                                  get_search_weight, filter_by_not)
from utils.utils_mysql import Mysql
from utils.utils_lxml import get_rows, get_dict, get_val, remove_scripts_from_html, remove_els_from_html
from playwright.sync_api import Playwright, sync_playwright
import pytz
import time
import json
import requests
from datetime import datetime
import re
import os
import urllib
import ssl
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 경고 메시지 비활성화 (상단으로 이동)
from urllib3.exceptions import InsecureRequestWarning

requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# Import from separated mysql modules

# import ssl

# ssl._create_default_https_context = ssl._create_unverified_context

# from urllib import disable_warnings

# disable_warnings(InsecureRequestWarning)

# ** Global Variables
HEADLESS = True

DATAFOLER = "../../../data/"
SEPERATOR = "|-"  # 스크랩 요소(key,target,callback), file_name, file_url 분리자
KST = pytz.timezone('Asia/Seoul')
TABLE_NOTICES = "notice_list"
TABLE_DETAILS = "notice_details"
TABLE_FILES = "notice_files"
MAX_RETRY = 20

STOP_KEY = "title"

# 결과통보 키워드 상수
DONE_NOTICE_KEYWORDS = ["결과"]

mysql = Mysql()

# ** 에러 코드 정의
ERROR_CODES = {
    "SUCCESS": 0,  # 성공
    "SETTINGS_NOT_FOUND": 100,  # 설정을 찾을 수 없음
    "PAGE_ACCESS_ERROR": 200,  # 페이지 접속 오류
    "IFRAME_ERROR": 210,  # iframe 접근 오류
    "SELECTOR_ERROR": 220,  # 선택자를 찾을 수 없음
    "ROW_PARSING_ERROR": 300,  # 행 파싱 오류
    "NEXT_PAGE_ERROR": 400,  # 다음 페이지 이동 오류
    "DATA_PROCESSING_ERROR": 500,  # 데이터 처리 오류
    "TITLE_ERROR": 301,  # title 파싱 오류
    "URL_ERROR": 302,  # 상세페이지 주소 파싱 오류
    "DATE_ERROR": 303,  # posted_date 파싱 오류
    "UNKNOWN_ERROR": 900,  # 알 수 없는 오류
    "SELENIUM_ERROR": 999  # Selenium 오류
}


# ** 유틸리티 함수들
def get_start_end_page(name):
  """
  기관명을 입력받아 해당 기관의 시작 페이지와 종료 페이지를 반환하는 함수

  Args:
    name (str): 기관명
  """
  settings = find_settings_notice_list_by_org_name(name, out_type="dict")
  if settings:
    return (settings['startPage'], settings['endPage'])
  else:
    return (1, 3)


def insertListData(csv):
  """
  스크래핑된 데이터를 데이터베이스에 저장하는 함수

  Args:
    csv (list): [['title', 'scraped_at', 'detail_url', 'posted_date', 'posted_by', 'org_name'], [...데이터...]]

  Returns:
    list: [{'org_name': 'org_name', 'inserted_count': 삽입된 데이터 수}, ...]
  """
  # print(f"##CSV: {csv}")  # !! 디버그시 사용
  if (len(csv) < 2):
    print("!!!게시글이 없습니다.")
    return []

  data0 = csv[0]
  data0.append('sn')
  data = [csv[0]]

  # 필요한 인덱스 찾기
  org_name_idx = csv[0].index('org_name')
  detail_url_idx = csv[0].index('detail_url')

  # 기관별 데이터 그룹화
  org_data = {}
  for row in csv[1:]:
    org_name = row[org_name_idx]
    if org_name not in org_data:
      org_data[org_name] = []
    org_data[org_name].append(row)

  # 기관별 insert 개수를 저장할 딕셔너리
  org_insert_counts = {}

  # 기관별로 데이터 처리
  for org_name, rows in org_data.items():
    # print(f"### 처리 중인 기관: {org_name}")  # 디버깅 로그 추가
    # print(f"### 기관의 전체 데이터 수: {len(rows)}")  # 디버깅 로그 추가

    org_insert_counts[org_name] = 0

    # 해당 기관의 마지막 sn과 기존 URL 목록 가져오기
    last_sn, _ = find_last_notice(org_name, field="title")
    last_sn = last_sn if last_sn is not None else 0

    limit = max(100, len(csv))  # 이전 게시물 find 최소 개수: 100
    detail_urls = mysql.find(
        TABLE_NOTICES,
        fields=['detail_url'],
        addStr=f"WHERE `org_name`='{org_name}' order by sn DESC limit {limit}")
    detail_urls = [url[0] for url in detail_urls]
    # print(f"##URLS: {detail_urls}")
    # print(f"### 기존 URL 개수: {len(detail_urls)}")  # 디버깅 로그 추가

    # 중복 URL 체크를 위한 세트
    processed_urls = set()

    # 해당 기관의 새로운 데이터 처리
    for row in rows:
      url = row[detail_url_idx]
      # 기존 URL에 없고, 현재 처리 중인 데이터에서도 중복되지 않은 경우만 처리
      if url not in detail_urls and url not in processed_urls:
        last_sn += 1
        row.append(last_sn)
        data.append(row)
        org_insert_counts[org_name] += 1
        processed_urls.add(url)
        # print(f"### 새로운 URL 추가: {url}")  # 디버깅 로그 추가

    # print(f"### 기관 {org_name}의 실제 추가된 데이터 수: {org_insert_counts[org_name]}")
    # # 디버깅 로그 추가

  if len(data) > 1:  # 내용이 있는 경우
    # print(f"+++++추가 게시물: {len(data)-1}")
    # error_code와 error_message 필드 제거
    fields_to_remove = ['error_code', 'error_message']
    for field in fields_to_remove:
      if field in data0:
        field_index = data0.index(field)
        data0.pop(field_index)
        for row in data[1:]:
          row.pop(field_index)
    mysql.upsert(TABLE_NOTICES, data, ['detail_url'], inType="csv")
  else:
    pass
    # print("****추가된 게시글이 없습니다.")

  # 결과 반환
  return [{
      'org_name': org_name,
      'inserted_count': count
  } for org_name, count in org_insert_counts.items()]


# ** 스크래핑 설정 관련 함수들
def find_org_names():
  """사용 가능한 기관명 목록을 반환"""
  return arr_from_csv(find_settings_notice_list(fields=["org_name"],
                                                addStr="WHERE `use`=1",
                                                out_type="csv"),
                      index=0,
                      has_header=False)


def get_scrapping_settings(org_name):
  """기관명을 입력받아 해당 기관의 스크래핑 설정을 반환"""
  return find_settings_notice_list_by_org_name(org_name)


def find_settings_by_org_name(org_name, output_format='dict'):
  """
  기관명을 입력받아 해당 기관의 스크래핑 설정을 반환하는 헬퍼 함수

  Args:
    org_name (str): 기관명
    output_format (str): 반환 형식 ('dict' 또는 'tuple')

  Returns:
    dict or tuple: 스크래핑 설정 또는 None
  """
  tuple_settings = find_settings_notice_list_by_org_name(org_name)

  if not tuple_settings:
    return None

  if output_format == 'tuple':
    return tuple_settings

  # dict 형식으로 변환
  field_names = [
    'oid', 'org_name', 'url', 'iframe', 'rowXpath', 'paging',
    'startPage', 'endPage', 'login', 'org_region', 'registration',
    'use', 'company_in_charge', 'org_man', 'exception_row', 'elements'
  ]

  settings_dict = {}
  for i, value in enumerate(tuple_settings):
    if i < len(field_names):
      settings_dict[field_names[i]] = value

  return settings_dict


def set_list_page(url, paging, pageNum):
  """페이징 URL 설정"""
  return (url.replace("${i}", str(pageNum)),
          "") if "${i}" in url else (url,
                                     paging.replace("${i}", str(pageNum + 1)))


# * 스크래핑 콜백 함수들


def get_format_date(date_str):
  """
  다양한 형식의 날짜 문자열을 'YYYY-MM-DD' 형식으로 변환

  Args:
    date_str (str): 변환할 날짜 문자열

  Returns:
    str: 'YYYY-MM-DD' 형식의 날짜 문자열, 변환 불가능한 경우 오늘 날짜 반환
  """
  try:
    # 빈 문자열이거나 None인 경우 오늘 날짜 반환
    if not date_str or len(date_str) < 5:
      return _now(format="%Y-%m-%d")

    # 범위가 있는 경우 첫 번째 날짜만 사용 (예: 2024/08/23 ~ 2024/09/03)
    if "~" in date_str:
      date_str = date_str.split("~")[0].strip()

    # 날짜 길이가 10자를 초과하는 경우 처음 10자만 사용
    if len(date_str) > 10:
      date_str = date_str[:10]

    # 포맷 변환: 점(.) 또는 슬래시(/)를 하이픈(-)으로 변환
    if "." in date_str or "/" in date_str:
      date_str = date_str.replace(".", "-").replace("/", "-")

      # 공백 제거 및 한 자리 숫자 앞에 0 추가 (예: "2023- 7-13" -> "2023-07-13")
      parts = date_str.split("-")
      if len(parts) == 3:
        year = parts[0].strip()
        month = parts[1].strip().zfill(2)
        day = parts[2].strip().zfill(2)

        # 년도가 두 자리인 경우 20xx로 변환 (예: "23-07-13" -> "2023-07-13")
        if len(year) == 2:
          year = "20" + year

        date_str = f"{year}-{month}-{day}"

    # 숫자로만 구성된 경우 (예: "20230713")
    elif date_str.isdigit() and len(date_str) == 8:
      date_str = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:8]}"

    # # 유효한 날짜인지 확인
    # datetime.strptime(date_str, "%Y-%m-%d")
    # return date_str
    # 날짜 객체로 변환하여 유효성 검사
    formatted_date = datetime.strptime(date_str, "%Y-%m-%d").date()

    # 오늘 날짜와 비교
    today = datetime.strptime(_now("%Y-%m-%d"), "%Y-%m-%d").date()
    if formatted_date > today:
      return today.strftime("%Y-%m-%d")

    return date_str

  except Exception as e:
    # 변환할 수 없는 경우 오늘 날짜 반환
    return _now(format="%Y-%m-%d")


def _get_rows_after_row(row, key, rst):
  """행 데이터 처리 후 콜백"""
  try:
    if key == "posted_date":
      row[key] = get_format_date(rst)
  except Exception as e:
    # 에러 발생 시 오늘 날짜를 넣어줌
    row[key] = _now(format="%Y-%m-%d")

  row["scraped_at"] = _now()


def _get_rows_after_rows(rows, row, key, rst):
  """전체 행 처리 후 콜백"""
  if "title" not in row or not row["title"]:
    row["error_code"] = ERROR_CODES["TITLE_ERROR"]
    row["error_message"] = "제목이 없습니다."

  if "detail_url" not in row or not row["detail_url"]:
    row["error_code"] = ERROR_CODES["URL_ERROR"]
    row["error_message"] = "상세페이지 주소가 없습니다."

  is_exclusion = row.get("exception_row", None)

  if is_exclusion is None:
    rows.append(row)
  elif not is_exclusion:
    row.pop("exception_row", None)
    rows.append(row)
  else:
    pass
    # print(f"!!! exception_row: {is_exclusion}")


# ** 메인 스크래핑 함수


def scrape_list_by_settings(settings, debug=False):
  """
  스크래핑 설정을 직접 받아서 게시판 목록을 스크래핑

  Args:
    settings (dict): 스크래핑 설정 딕셔너리 (settings_notice_list 테이블의 필드들)
                    필수 필드: org_name, url, rowXpath, startPage, endPage, elements
                    선택 필드: iframe, paging, login, exception_row 등
    debug (bool): 디버그 모드

  Returns:
    dict: {
      'error_code': 에러 코드 (0은 성공),
      'error_message': 에러 메시지,
      'data': 스크래핑된 결과 dictionary 리스트
    }
  """
  # 설정에서 필요한 값들 추출
  org_name = settings.get('org_name', '')
  url = settings.get('url', '')
  iframe = settings.get('iframe', '')
  rowXpath = settings.get('rowXpath', '')
  paging = settings.get('paging', '')
  config_start_page = settings.get('startPage', 1)
  config_end_page = settings.get('endPage', 1)
  login = settings.get('login', '')
  org_region = settings.get('org_region', '')
  registration = settings.get('registration', '')
  use = settings.get('use', 1)
  company_in_charge = settings.get('company_in_charge', '')
  org_man = settings.get('org_man', '')
  exception_row = settings.get('exception_row', '')
  elements = settings.get('elements', '')

  # 반환 객체 초기화
  result = {
      'org_name': org_name,
      'error_code': ERROR_CODES["SUCCESS"],
      'error_message': '',
      'data': []
  }

  # 필수 설정 확인
  if not org_name or not url or not rowXpath:
    error_msg = f"필수 설정이 누락되었습니다. org_name: {org_name}, url: {url}, rowXpath: {rowXpath}"
    result['error_code'] = ERROR_CODES["SETTINGS_NOT_FOUND"]
    result['error_message'] = error_msg
    return result

  results_data = []  # 스크랩 결과를 저장할 배열

  # URL 도메인 추출하여 Referer 생성
  domain = ""
  try:
    from urllib.parse import urlparse
    parsed_url = urlparse(url)
    domain = f"{parsed_url.scheme}://{parsed_url.netloc}"
  except Exception as e:
    domain = "https://www.google.com"  # 기본값

  # HTTP 헤더 설정
  headers = {
      "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "Connection": "keep-alive",
      "Cache-Control": "max-age=0",
      "Referer": domain
  }

  # 병렬 처리를 위한 페이지 URL 목록 생성
  import concurrent.futures

  page_urls = []
  for i in range(config_start_page, config_end_page + 1):
    if "${i}" in url:
      page_url = url.replace("${i}", str(i))
      page_urls.append((i, page_url, None))
    else:
      if i == config_start_page:
        page_urls.append((i, url, None))
      else:
        # 페이징을 위한 URL 또는 버튼 정보 저장
        page_urls.append((i, url, paging.replace("${i}", str(i))))

  # print(f"### page_urls: {page_urls}")
  # 페이지 처리 함수
  def process_page(page_info):
    page_num, page_url, page_selector = page_info
    try:
      start_page_time = time.time()

      # 페이지 GET 요청
      session = requests.Session()
      response = session.get(page_url,
                             headers=headers,
                             timeout=30,
                             verify=False)

      # print(f"### {org_name} 페이지 {page_num}: {page_url}")

      if response.status_code != 200:
        return []

      html = fix_encoding_response(response)
      html = remove_scripts_from_html(html)  # script, comment 제거
      # print(f"### response html: {html}")  # !!! 디버그시 사용

      #   html = response.text
      if debug:
        print(f"### {org_name} 페이지 {page_num}: {page_url}")
        save_html(html, f"{org_name}_{page_num}.html")

      # 페이징 처리 (두 번째 페이지부터, paging 정보가 있는 경우만)
      if page_num > config_start_page and page_selector and "${i}" not in url:
        try:
          from lxml import html as lxml_html
          tree = lxml_html.fromstring(html)

          # 페이지 버튼을 XPath로 찾기
          page_xpath = page_selector
          if page_xpath.startswith("xpath="):
            page_xpath = page_xpath.replace("xpath=", "")

          page_elements = tree.xpath(page_xpath)
          if page_elements and len(page_elements) > 0:
            next_url = None
            # href 속성 확인
            for attr in ['href', 'onclick']:
              if attr in page_elements[0].attrib:
                if attr == 'href':
                  next_url = page_elements[0].get('href')
                  break
                elif attr == 'onclick':
                  # onclick 속성에서 URL 추출 (페이지마다 다를 수 있음)
                  onclick = page_elements[0].get('onclick')
                  import re
                  url_match = re.search(r"location\.href=['\"]([^'\"]+)['\"]",
                                        onclick)
                  if url_match:
                    next_url = url_match.group(1)
                    break

            if next_url:
              if not next_url.startswith('http'):
                next_url = f"{domain}{next_url if next_url.startswith('/') else '/' + next_url}"

              # 다음 페이지 로드
              next_response = session.get(next_url,
                                          headers=headers,
                                          timeout=30,
                                          verify=False)
              if next_response.status_code == 200:
                html = next_response.text
        except Exception as e:
          pass

      # HTML 파싱 및 데이터 추출
      try:
        # 테이블 확인을 위해 lxml로 파싱
        from lxml import html as lxml_html
        tree = lxml_html.fromstring(html)
        # print(f"### tree: {tree}")
        # print(f"### tree: {tree} {html}")
        # save_html(html, f"{org_name}_{page_num}.html")
        # rowXpath = '//div[@class="table_list02"]/table//tr[position() > 1]'
        rows = tree.xpath(rowXpath)
        # print(f"### rows: {rows} {rowXpath} len: {len(rows)}")
        # 일반 처리
        page_data = get_rows(html, rowXpath, elements, _get_rows_after_row,
                             _get_rows_after_rows)
        # print(f"### page_data: {page_data} len: {len(page_data)}")
        # org_name 추가
        for item in page_data:
          item["org_name"] = org_name

        return page_data
      except Exception as e:
        return []

    except Exception as e:
      return []

  try:
    # 병렬 처리 실행
    all_data = []
    max_workers = min(len(page_urls), 4)  # 최대 4개 스레드 사용

    with concurrent.futures.ThreadPoolExecutor(
            max_workers=max_workers) as executor:
      futures = [
          executor.submit(process_page, page_info) for page_info in page_urls
      ]

      for future in concurrent.futures.as_completed(futures):
        page_data = future.result()
        if page_data:
          all_data.extend(page_data)

    # requests로 데이터를 가져오지 못한 경우 playwright으로 재시도
    if not all_data or len(all_data) < 5:
      print(f"################# playwright 재시도")
      playwright_result = scrape_list_with_playwright(org_name, config_start_page,
                                                      config_end_page, url, rowXpath,
                                                      paging, elements)
      all_data = playwright_result['data']

    if all_data:
      try:
        all_data.reverse()  # 최신 데이터가 먼저 오도록 역순 정렬
        # 빈 title 제거
        filtered_data = [item for item in all_data if item.get("title", "")]

        result['data'] = filtered_data
      except Exception as e:
        error_msg = f"데이터 처리 오류: {str(e)}"
        result['error_code'] = ERROR_CODES["DATA_PROCESSING_ERROR"]
        result['error_message'] = error_msg
        result['data'] = []
        return result

  except Exception as e:
    error_msg = f"스크래핑 과정 중 오류: {str(e)}"
    result['error_code'] = ERROR_CODES["UNKNOWN_ERROR"]
    result['error_message'] = error_msg

  return result


def scrape_list(org_name, start_page=1, end_page=1, debug=False):
  """
  특정 기관의 게시판 목록을 스크래핑

  Args:
    org_name (str): 스크래핑할 기관명
    start_page (int): 시작 페이지 번호
    end_page (int): 종료 페이지 번호
    debug (bool): 디버그 모드

  Returns:
    dict: {
      'error_code': 에러 코드 (0은 성공),
      'error_message': 에러 메시지,
      'data': 스크래핑된 결과 dictionary 리스트
    }
  """
  # 반환 객체 초기화
  result = {
      'org_name': org_name,
      'error_code': ERROR_CODES["SUCCESS"],
      'error_message': '',
      'data': []
  }

  # 설정 가져오기 (dict 형식으로)
  settings = find_settings_by_org_name(org_name, output_format='dict')
  if not settings:
    error_msg = f"{org_name}에 대한 설정을 찾을 수 없습니다."
    result['error_code'] = ERROR_CODES["SETTINGS_NOT_FOUND"]
    result['error_message'] = error_msg
    return result

  # 사용자 지정 페이지 범위가 있으면 설정에 오버라이드
  if start_page > 0:
    settings['startPage'] = start_page
  if end_page > 0 and end_page >= start_page:
    settings['endPage'] = end_page

  # scrape_list_by_settings 함수를 사용하여 실제 스크래핑 수행
  return scrape_list_by_settings(settings, debug)


def scrape_list_with_playwright(org_name, start_page, end_page, url, rowXpath,
                                paging, elements):
  """Selenium을 사용하여 페이지 스크래핑"""
  result = {
      'org_name': org_name,
      'error_code': ERROR_CODES["SUCCESS"],
      'error_message': '',
      'data': []
  }

  try:
    with sync_playwright() as playwright:
      try:
        chromium_path = os.getenv('CHROMIUM_EXECUTABLE_PATH')
        browser = playwright.chromium.launch(
            headless=HEADLESS,
            executable_path=chromium_path if chromium_path else None
        )
        # print(f"[2] browser launch 후: {org_name} 페이지 {start_page}: page 처리 시작")
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={
                "width": 1920,
                "height": 1080
            })
        page = context.new_page()
        # 나머지 코드...
      except Exception as e:
        import traceback
        print(f"브라우저 실행 중 오류 발생: {e}")
        print(f"상세 오류: {traceback.format_exc()}")
      page = context.new_page()

      all_data = []

      for page_num in range(start_page, end_page + 1):
        print(f"### {org_name} 페이지 {page_num}: page 처리 시작")
        try:
          target_url = url
          if "${i}" in url:
            target_url = url.replace("${i}", str(page_num))

          # 페이지 로드
          page.goto(target_url, wait_until="domcontentloaded", timeout=60000)
          page.wait_for_load_state("networkidle", timeout=30000)

          #   print(f"### {org_name} 페이지 {page_num}: page 처리 시작")
          # rowXpath 대기
          try:
            # XPath 형식으로 변환
            xpath_selector = rowXpath
            if not xpath_selector.startswith(
                    "xpath=") and not xpath_selector.startswith("//"):
              xpath_selector = "xpath=" + xpath_selector

            # print(f"### {org_name} 페이지 {page_num}: rowXpath 로딩 대기 중
            # ({xpath_selector})")
            page.wait_for_selector(xpath_selector, timeout=120000)
            print(f"### {org_name} 페이지 {page_num}: rowXpath 로딩 완료")

            # HTML 저장
            html_content = page.content()
          except Exception as e:
            print(f"### {org_name} 페이지 {page_num}: rowXpath 로딩 실패 - {str(e)}")
            continue

          # 추가 대기 시간 (동적 콘텐츠 로드를 위해)
          time.sleep(3)

          # utils_lxml을 사용하여 데이터 추출
          try:
            page_data = get_rows(html_content, rowXpath, elements,
                                 _get_rows_after_row, _get_rows_after_rows)

            # org_name 추가
            for item in page_data:
              item["org_name"] = org_name

            all_data.extend(page_data)

          except Exception as e:
            print(f"### {org_name} 페이지 {page_num}: 데이터 추출 실패 - {str(e)}")
            continue

          # 다음 페이지로 이동 (페이징이 존재하는 경우)
          if paging and "${i}" in paging and page_num < end_page:
            try:
              next_page_num = page_num + 1
              next_page_selector = paging.replace("${i}", str(next_page_num))

              # XPath 형식으로 변환
              if not next_page_selector.startswith(
                      "xpath=") and not next_page_selector.startswith("//"):
                next_page_selector = "xpath=" + next_page_selector

              # 다음 페이지 버튼이 존재하는지 확인
              if page.locator(next_page_selector).count() > 0:
                # 클릭 및 페이지 로드 대기
                page.click(next_page_selector)
                page.wait_for_load_state("networkidle", timeout=30000)
              else:
                break  # 다음 페이지 버튼이 없으면 종료
            except Exception as e:
              break  # 페이징 처리 중 오류 발생 시 종료
        except Exception as e:
          continue

      # 브라우저 종료
      browser.close()

      # 결과 저장
      result['data'] = all_data

  except Exception as e:
    result['error_code'] = ERROR_CODES["SELENIUM_ERROR"]
    result['error_message'] = f"Selenium 오류: {str(e)}"

  return result


# ** 배치 스크래핑 함수 (기존 fetch_list_pages 기능)


def _fetch_list_pages(names, debug=False):
  """
  여러 기관의 게시판 목록 페이지 스크래핑

  Args:
    names (list): 스크래핑할 기관명 리스트
    start_page (int): 시작 페이지 번호
    end_page (int): 종료 페이지 번호

  Returns:
    dict: {
      org_name: {
        'error_code': 에러 코드,
        'error_message': 에러 메시지,
        'data': 스크래핑된 결과
      }
    }
  """
  all_results = {}

  for (nth, name) in enumerate(names):
    try:
      # print(f"### 스크래핑 시작: {name}")  # 디버깅 로그 추가
      (start_page, end_page) = get_start_end_page(name)
      result = scrape_list(name, start_page, end_page, debug)
      # print(f"### 스크래핑 결과: {name}")  # 디버깅 로그 추가
      # print(f"### - error_code: {result['error_code']}")
      # print(f"### - error_message: {result['error_message']}")
      # print(f"### - data count: {len(result['data'])}")

      if result['error_code'] == ERROR_CODES["SUCCESS"] and not result['data']:
        pass
      all_results[name] = result
    except Exception as e:
      print(f"### 스크래핑 실패: {name} - {str(e)}")  # 디버깅 로그 추가
      error_msg = f"{name} 스크래핑 중 예상치 못한 오류 발생: {str(e)}"
      all_results[name] = {
          'error_code': ERROR_CODES["UNKNOWN_ERROR"],
          'error_message': error_msg,
          'data': []
      }

  return all_results


def _save_results(results):
  """
  스크래핑 결과를 MySQL에 저장하고 에러를 처리하는 함수

  Args:
    results (dict): 스크래핑 결과 딕셔너리
  """

  # 타임스탬프 생성
  timestamp = _now("%Y%m%d_%H%M%S")

  # 에러 데이터와 빈 데이터 기관 목록 준비
  logs = []
  error_orgs = []
  results_data = []

  count = 0
  count_error = 0
  for org_name, result in results.items():
    # print(f"### 결과 처리 중: {org_name}")  # 디버깅 로그 추가
    log = {
        "org_name": org_name,
        "error": None,
        "scraped_count": len(result['data']),
        "inserted_count": 0,
        "time": _now()
    }
    count += 1
    # 데이터가 비어있거나 에러가 있는 경우 처리
    if len(result['data']) < 2:
      count_error += 1
      log["error"] = {
          "error_code": result['error_code'],
          "error_message": result['error_message'],
      }
      error_orgs.append(org_name)
      print(f"### 에러 발생: {org_name} - {result['error_message']}")  # 디버깅 로그 추가
    else:
      # MySQL에 데이터 저장
      try:
        print(f"@@@@@ 기관명: {org_name}, 데이터 개수: {len(result['data'])}")
        # 각 데이터 항목에 error_code와 error_message 키가 있는지 확인하고 없으면 추가
        for item in result['data']:
          if 'error_code' not in item:
            item['error_code'] = None
          if 'error_message' not in item:
            item['error_message'] = None
        results_data.extend(result['data'])
      except Exception as e:
        count_error += 1
        log["error"] = {
            "error_code": ERROR_CODES["DATA_PROCESSING_ERROR"],
            "error_message": f"MySQL 저장 오류: {str(e)}",
        }
        error_orgs.append(org_name)
        print(f"### MySQL 저장 오류: {org_name} - {str(e)}")  # 디버깅 로그 추가

    logs.append(log)

  # * 사후 처리
  results_data.reverse()  # 배열 역순

  # 필수 키 추가
  required_keys = {
      "title": "",
      "posted_date": "",
      "posted_by": "",
      "detail_url": "",
      "org_name": "",
      "scraped_at": _now(),
      "error_code": None,
      "error_message": None
  }

  for rst in results_data:
    for key, default_value in required_keys.items():
      rst[key] = rst.get(key, default_value)

  csv_data = csv_from_dicts(results_data)

  try:
    if csv_data and len(csv_data) > 1:  # 헤더와 데이터가 있는 경우
      print("-" * 60)
      print(f"@@@ 기관수: {count}, 에러 기관수: {count_error}")
      #   print(f"@@@ 저장할 데이터 개수: {len(csv_data) - 1}")  # 헤더 행 제외
      #   print("="*60)
      inserted_data = insertListData(csv_data)

      # inserted_data의 내용을 logs에 반영
      for inserted in inserted_data:
        for log in logs:
          if log["org_name"] == inserted["org_name"]:
            log["inserted_count"] = inserted["inserted_count"]
            break

      # print(f"@@@ 저장할 로그: {logs}")
    #   print(f"@@@ 저장된 데이터: {inserted_data}")
    time.sleep(1)
    return {"logs": logs, "error_orgs": error_orgs}
  except Exception as e:
    print("mysql upsert 실패")
    print(e)
    return {"logs": logs, "error_orgs": error_orgs}


# ** 스크래핑 결과 저장


def fetch_list_pages(names, save=True):
  """
  기관명 리스트를 2개씩 끊어서 스크래핑하는 함수

  Args:
      names (list): 기관명 리스트
      save (bool): 결과를 저장할지 여부

  Returns:
      list: 스크래핑 결과 리스트
  """
  print(f"@@@ Scrape Notices At: {_now()}")
  print("=" * 100)
  all_results = []
  all_logs = []
  error_orgs = []
  all_errors = []

  # names를 2개씩 끊어서 처리
  for i in range(0, len(names), 2):
    batch_names = names[i:i + 2]
    # print(f"배치 처리 중: {batch_names}")

    # 배치 스크래핑 실행
    batch_results = _fetch_list_pages(batch_names)
    all_results.extend(batch_results)

    # print(f"### batch_results: {batch_results}")

    # 결과 저장
    if save and batch_results:
      result = _save_results(batch_results)
      #   print(f"#### result: {result}")
      all_logs.extend(result["logs"])
      error_orgs.extend(result["error_orgs"])
    #   print(f"#### error_orgs: {error_orgs}")

    # result: {'logs': [{'org_name': '양천구', 'error': {'error_code': 0, 'error_message': ''}, 'scraped_count': 0, 'inserted_count': 0, 'time': '2025-05-16 06:38:13'}], 'error_orgs': ['양천구']}
    # result: {'logs': [{'org_name': '양천구', 'error': {'error_code': 0, 'error_message': ''}, 'scraped_count': 0, 'inserted_count': 0, 'time': '2025-05-16 06:43:50'}, {'org_name': '광진구', 'error': None, 'scraped_count': 30, 'inserted_count': 0, 'time': '2025-05-16 06:43:50'}], 'error_orgs': ['양천구']}
  all_errors = {"orgs": ','.join(error_orgs), "time": _now()}

  if save:
    print(f"#### all_errors: {all_errors}")
    pass
    update_all_category()
    insert_all_errors(all_errors)
    insert_all_logs(all_logs)

  return all_results


# ** 새로운 워크플로우 함수들

def filter_new_notices(scraped_data, org_name):
  """
  스크래핑된 데이터 중 신규 공고만 필터링하는 함수

  Args:
    scraped_data (list): 스크래핑된 공고 데이터 리스트
    org_name (str): 기관명

  Returns:
    list: 신규 공고 데이터 리스트
  """
  if not scraped_data:
    return []

  # 기존 URL 목록 가져오기
  limit = max(100, len(scraped_data))  # 이전 게시물 find 최소 개수: 100
  detail_urls = mysql.find(
      TABLE_NOTICES,
      fields=['detail_url'],
      addStr=f"WHERE `org_name`='{org_name}' order by sn DESC limit {limit}")
  existing_urls = set([url[0] for url in detail_urls])

  # 신규 공고만 필터링
  new_notices = []
  processed_urls = set()

  for notice in scraped_data:
    url = notice.get('detail_url', '')
    if url and url not in existing_urls and url not in processed_urls:
      new_notices.append(notice)
      processed_urls.add(url)

  return new_notices


def classify_notices_by_category(notices):
  """
  공고 리스트에 대해 카테고리 분류를 수행하는 함수

  Args:
    notices (list): 분류할 공고 데이터 리스트

  Returns:
    list: 카테고리가 추가된 공고 데이터 리스트
  """
  from mysql.mysql_settings import find_all_settings_notice_category
  from mysql.mysql_notice import search_notice_list

  if not notices:
    return []

  # 모든 카테고리 설정 가져오기
  category_settings = find_all_settings_notice_category()

  # 각 공고에 기본 카테고리 설정
  for notice in notices:
    notice['category'] = '무관'

  # 각 카테고리에 대해 매칭 검사
  for setting in category_settings:
    category = setting['category']
    keywords = setting['keywords']
    nots = setting['nots']
    min_point = setting['min_point']

    # 임시로 공고들을 CSV 형태로 변환하여 검색
    # 실제로는 각 공고의 제목을 직접 검사하는 방식으로 최적화할 수 있음
    for notice in notices:
      if notice['category'] == '무관':  # 아직 분류되지 않은 공고만 검사
        title = notice.get('title', '')
        if title and _matches_category_criteria(title, keywords, nots, min_point):
          notice['category'] = category

  return notices


def _matches_category_criteria(title, keywords, nots, min_point):
  """
  제목이 카테고리 기준에 맞는지 확인하는 함수

  Args:
    title (str): 공고 제목
    keywords (str): 키워드*가중치,키워드*가중치... 형식
    nots (str): 제외어1,제외어2... 형식
    min_point (int): 최소 점수

  Returns:
    bool: 기준에 맞으면 True
  """
  # 제외어 검사
  if nots:
    not_words = [word.strip() for word in nots.split(',') if word.strip()]
    for not_word in not_words:
      if not_word in title:
        return False

  # 키워드 점수 계산
  if not keywords:
    return False

  total_score = 0
  keyword_items = [item.strip() for item in keywords.split(',') if item.strip()]

  for item in keyword_items:
    if '*' in item:
      parts = item.split('*')
      if len(parts) == 2:
        keyword = parts[0].strip()
        try:
          weight = int(parts[1].strip())
          if keyword in title:
            total_score += weight
        except ValueError:
          continue
    else:
      # 가중치가 없는 경우 기본 1점
      if item in title:
        total_score += 1

  return total_score >= min_point


def is_done_notice(title):
  """
  공고 제목을 확인하여 결과통보 공고인지 판단하는 함수

  Args:
    title (str): 공고 제목

  Returns:
    bool: 결과통보 공고이면 True, 아니면 False
  """
  if not title:
    return False

  for keyword in DONE_NOTICE_KEYWORDS:
    if keyword in title:
      return True

  return False


def filter_valid_category_notices(notices):
  """
  유효한 카테고리를 가진 공고만 필터링하는 함수
  '무관' 카테고리는 제외하여 의미있는 카테고리가 분류된 공고만 DB에 저장

  Args:
    notices (list): 카테고리가 분류된 공고 리스트

  Returns:
    list: 유효한 카테고리를 가진 공고 리스트 ('무관' 제외)
  """
  from mysql.mysql_settings import CATEGORIES

  valid_categories = set(CATEGORIES)  # '무관'은 제외, 실제 업무 카테고리만 포함

  return [notice for notice in notices if notice.get('category', '') in valid_categories]


def save_agency_scraping_info(org_name, scraped_count, new_count, inserted_count, error_info=None):
  """
  기관별 스크래핑 정보를 저장하는 함수

  Args:
    org_name (str): 기관명
    scraped_count (int): 스크래핑된 공고 수
    new_count (int): 신규 공고 수
    inserted_count (int): 실제 삽입된 공고 수
    error_info (dict): 에러 정보 (optional)
  """
  log = {
    "org_name": org_name,
    "error": error_info,
    "scraped_count": scraped_count,
    "new_count": new_count,
    "inserted_count": inserted_count,
    "time": _now()
  }
  return log


def process_single_agency(org_name, debug=False):
  """
  단일 기관에 대한 새로운 워크플로우 처리 함수

  Args:
    org_name (str): 처리할 기관명
    debug (bool): 디버그 모드

  Returns:
    dict: {
      'success': bool,
      'error_code': int,
      'error_message': str,
      'scraped_count': int,
      'new_count': int,
      'inserted_count': int,
      'log': dict
    }
  """
  result = {
    'success': False,
    'error_code': ERROR_CODES["SUCCESS"],
    'error_message': '',
    'scraped_count': 0,
    'new_count': 0,
    'inserted_count': 0,
    'log': None
  }

  try:
    # 1) 게시판 스크래핑
    (start_page, end_page) = get_start_end_page(org_name)
    scrape_result = scrape_list(org_name, start_page, end_page, debug)

    if scrape_result['error_code'] != ERROR_CODES["SUCCESS"]:
      result['error_code'] = scrape_result['error_code']
      result['error_message'] = scrape_result['error_message']
      error_info = {
        "error_code": result['error_code'],
        "error_message": result['error_message']
      }
      result['log'] = save_agency_scraping_info(org_name, 0, 0, 0, error_info)
      return result

    scraped_data = scrape_result['data']
    result['scraped_count'] = len(scraped_data)

    # 스크래핑된 데이터가 2개 미만인 경우 에러로 처리 (기존 로직과 동일)
    if len(scraped_data) < 2:
      result['success'] = False
      result['error_code'] = scrape_result['error_code'] if scrape_result['error_code'] != 0 else ERROR_CODES["DATA_PROCESSING_ERROR"]
      result['error_message'] = scrape_result['error_message'] if scrape_result['error_message'] else "스크래핑된 데이터가 부족합니다."
      error_info = {
        "error_code": result['error_code'],
        "error_message": result['error_message']
      }
      result['log'] = save_agency_scraping_info(org_name, result['scraped_count'], 0, 0, error_info)
      return result

    # 2) 스크래핑된 공고들 중에 신규 공고만 필터링
    new_notices = filter_new_notices(scraped_data, org_name)
    result['new_count'] = len(new_notices)

    if not new_notices:
      result['success'] = True
      result['log'] = save_agency_scraping_info(org_name, result['scraped_count'], 0, 0)
      return result

    # 3) 신규 공고들에 대해 공고별 카테고리 분류
    classified_notices = classify_notices_by_category(new_notices)

    # 4) 분류된 업무 카테고리가 유효한 공고만 필터링
    valid_notices = filter_valid_category_notices(classified_notices)

    # 5) 결과통보 공고 처리 - is_selected = 9로 업데이트
    done_notices = []
    for notice in valid_notices:
      if is_done_notice(notice.get('title', '')):
        notice['is_selected'] = 9
        done_notices.append(notice)

    if not valid_notices:
      result['success'] = True
      result['log'] = save_agency_scraping_info(org_name, result['scraped_count'], result['new_count'], 0)
      return result

    # 4) 유효한 공고들을 데이터베이스에 insert
    # 기존 insertListData 함수를 활용하여 데이터 저장
    # CSV 형식으로 변환
    if valid_notices:
      # 필수 키 추가
      required_keys = {
        "title": "",
        "posted_date": "",
        "posted_by": "",
        "detail_url": "",
        "org_name": org_name,
        "scraped_at": _now(),
        "error_code": None,
        "error_message": None,
        "category": "무관"
      }

      for notice in valid_notices:
        for key, default_value in required_keys.items():
          notice[key] = notice.get(key, default_value)

      csv_data = csv_from_dicts(valid_notices)

      if csv_data and len(csv_data) > 1:  # 헤더와 데이터가 있는 경우
        inserted_data = insertListData(csv_data)

        # 삽입된 데이터 개수 계산
        for inserted in inserted_data:
          if inserted['org_name'] == org_name:
            result['inserted_count'] = inserted['inserted_count']
            break

    # 성공적인 경우 로그 저장
    result['success'] = True
    result['log'] = save_agency_scraping_info(
      org_name,
      result['scraped_count'],
      result['new_count'],
      result['inserted_count']
    )

  except Exception as e:
    result['error_code'] = ERROR_CODES["UNKNOWN_ERROR"]
    result['error_message'] = f"기관 {org_name} 처리 중 오류: {str(e)}"
    error_info = {
      "error_code": result['error_code'],
      "error_message": result['error_message']
    }
    result['log'] = save_agency_scraping_info(org_name, result['scraped_count'], result['new_count'], result['inserted_count'], error_info)

  return result


def fetch_list_pages_new_workflow(names, save=True):
  """
  새로운 워크플로우를 사용하여 기관명 리스트를 처리하는 함수

  Args:
    names (list): 기관명 리스트
    save (bool): 결과를 저장할지 여부

  Returns:
    dict: 처리 결과
  """
  print(f"@@@ Scrape Notices (New Workflow) At: {_now()}")
  print("=" * 100)

  all_logs = []
  all_errors = []
  error_orgs = []

  total_scraped = 0
  total_new = 0
  total_inserted = 0

  for org_name in names:
    print(f"Processing agency: {org_name}")

    # 단일 기관 처리
    result = process_single_agency(org_name)

    total_scraped += result['scraped_count']
    total_new += result['new_count']
    total_inserted += result['inserted_count']

    if result['log']:
      all_logs.append(result['log'])

    if not result['success']:
      error_orgs.append(org_name)
      all_errors.append({
        "org_name": org_name,
        "error_code": result['error_code'],
        "error_message": result['error_message']
      })

    print(f"  - Scraped: {result['scraped_count']}, New: {result['new_count']}, Inserted: {result['inserted_count']}")
    if not result['success']:
      print(f"  - Error: {result['error_message']}")

  # 결과 저장
  if save:
    # 에러 정보는 항상 저장 (에러가 없어도)
    error_summary = {"orgs": ','.join(error_orgs), "time": _now()}
    insert_all_errors(error_summary)

    # 카테고리 업데이트
    update_all_category()

    # 로그 저장
    if all_logs:
      insert_all_logs(all_logs)

  print("-" * 60)
  print(f"@@@ Summary: Agencies: {len(names)}, Errors: {len(error_orgs)}")
  print(f"@@@ Total - Scraped: {total_scraped}, New: {total_new}, Inserted: {total_inserted}")
  print("=" * 100)

  return {
    "total_agencies": len(names),
    "error_agencies": len(error_orgs),
    "total_scraped": total_scraped,
    "total_new": total_new,
    "total_inserted": total_inserted,
    "logs": all_logs,
    "errors": all_errors
  }


def update_all_category_selected():
  """
  notice_list 테이블의 모든 공고에 대해:
  1. 수정된 유형 분류 로직을 적용하여 새로 유형 분류
  2. 결과통보에 해당하는 공고는 is_selected = 9로 설정
  """
  mysql = Mysql()

  try:
    print("=" * 80)
    print("전체 공고 카테고리 재분류 및 결과통보 처리 시작")
    print("=" * 80)

    # 1. 모든 공고 조회
    print("\n1. 전체 공고 데이터 조회 중...")
    all_notices = mysql.find("notice_list",
                            fields=["nid", "title", "category", "is_selected"],
                            addStr="ORDER BY nid")

    if not all_notices:
      print("처리할 공고가 없습니다.")
      return

    print(f"총 {len(all_notices)}개 공고 발견")

    # 2. Priority 순서로 카테고리 목록 가져오기
    print("\n2. Priority 순서로 카테고리 목록 가져오기...")
    categories = get_categories_by_priority()
    print(f"처리할 카테고리 (priority 순): {categories}")

    # 3. 모든 공고를 먼저 '무관'으로 초기화
    print("\n3. 모든 공고 카테고리를 '무관'으로 초기화...")
    mysql.exec("UPDATE notice_list SET category = '무관'")

    # 4. Priority 순서로 카테고리 분류
    print("\n4. Priority 순서로 카테고리 분류 시작...")
    total_classified = 0
    classification_results = {}

    for category in categories:
      print(f"\n4-{categories.index(category)+1}. 카테고리 '{category}' 분류 중...")

      # 카테고리별 키워드 설정 가져오기
      keywords = find_settings_notice_category(category)
      if keywords is None:
        print(f"  카테고리 '{category}'에 대한 키워드 설정이 없습니다.")
        continue

      # 키워드 매칭으로 해당 공고 검색
      matched_notices = get_search_weight(
        keywords["keywords"],
        min_point=keywords["min_point"],
        add_fields=["nid", "title"],
        add_where=""
      )

      # 제외어 필터링
      if keywords["nots"]:
        matched_notices = filter_by_not(keywords["nots"], matched_notices, "title")

      if not matched_notices:
        print(f"  카테고리 '{category}'에 해당하는 공고가 없습니다.")
        classification_results[category] = 0
        continue

      # 분류 결과 업데이트
      updated_count = 0
      overwritten_count = 0

      for notice_dict in matched_notices:
        for nid, data in notice_dict.items():
          # 기존 카테고리 확인
          existing = mysql.find("notice_list", ["category"], f"WHERE nid = {nid}")
          old_category = existing[0][0] if existing and existing[0] else None

          # 카테고리 업데이트
          mysql.update("notice_list", {"category": category}, f"nid = {nid}")
          updated_count += 1

          # 덮어쓰기 감지
          if old_category and old_category != '무관' and old_category != category:
            overwritten_count += 1
            title = data.get('title', '')[:50] + '...' if len(data.get('title', '')) > 50 else data.get('title', '')
            print(f"    [덮어쓰기] nid {nid}: '{old_category}' → '{category}' | {title}")

      print(f"  완료: {updated_count}개 분류 (덮어쓰기: {overwritten_count}개)")
      classification_results[category] = updated_count
      total_classified += updated_count

    # 5. 결과통보 공고 처리
    print("\n5. 결과통보 공고 처리 중...")

    # 제목에 '결과' 키워드가 포함된 공고 검색
    done_notices = mysql.find("notice_list",
                             fields=["nid", "title", "is_selected"],
                             addStr="WHERE title LIKE '%결과%'")

    done_count = 0
    updated_done_count = 0

    for notice in done_notices:
      nid, title, current_is_selected = notice

      # is_done_notice 함수로 결과통보 여부 확인
      if is_done_notice(title):
        done_count += 1

        # is_selected가 9가 아닌 경우에만 업데이트
        if current_is_selected != 9:
          mysql.update("notice_list", {"is_selected": 9}, f"nid = {nid}")
          updated_done_count += 1
          short_title = title[:50] + '...' if len(title) > 50 else title
          print(f"  [결과통보] nid {nid}: is_selected = 9 | {short_title}")

    print(f"결과통보 공고 처리 완료: 총 {done_count}개 발견, {updated_done_count}개 업데이트")

    # 6. 최종 결과 요약
    print("\n" + "=" * 80)
    print("전체 공고 재분류 완료")
    print("=" * 80)
    print(f"총 처리 공고 수: {len(all_notices)}개")
    print(f"카테고리별 분류 결과:")
    for category, count in classification_results.items():
      print(f"  - {category}: {count}개")
    print(f"총 분류된 공고: {total_classified}개")
    print(f"결과통보 공고: {done_count}개 (업데이트: {updated_done_count}개)")

    # 7. 분류 상태 확인
    print(f"\n최종 분류 상태:")
    final_stats = mysql.find("notice_list",
                           fields=["category", "COUNT(*) as count"],
                           addStr="GROUP BY category ORDER BY COUNT(*) DESC")

    for category, count in final_stats:
      print(f"  - {category}: {count}개")

  except Exception as e:
    print(f"전체 재분류 중 오류 발생: {str(e)}")
    raise e
  finally:
    mysql.close()


if __name__ == "__main__":
  import sys

  # 실행 인수 확인
  if len(sys.argv) > 1 and sys.argv[1] == "update_categories":
    # 전체 공고 카테고리 재분류 실행
    print("[BATCH] 전체 공고 카테고리 재분류 및 결과통보 처리")
    update_all_category_selected()
  else:
    # 기본 스크래핑 작업
    # cd /exposed/projects/bid-notice-web/backend/python && PYTHONPATH=src uv run src/spider/spider_list.py
    print("[SCARPING] 공고 고시 게시판(spider_list)")
    names = find_org_names()
    # names = names[:10]
    # names = ["한국공항공사", "가평군청", "광진구"]
    # names = ['정부24 지자체소식', "가평군청", '용인시청']

    # 새로운 워크플로우 사용
    fetch_list_pages_new_workflow(names)

    update_all_category_selected()
