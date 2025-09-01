# -*- coding: utf-8 -*-

# 1~3페이지 목록 스크랩 후, 'detail_url'가 일치하는 항목 제외로 수정

import time
import json
import requests
from datetime import datetime
import re
import os
import urllib
import ssl

# 경고 메시지 비활성화 (상단으로 이동)
from urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

import pytz
from playwright.sync_api import Playwright, sync_playwright

from utils_lxml import get_rows, get_dict, get_val, remove_scripts_from_html, remove_els_from_html
from utils_mysql import Mysql
from mysql_bid import find_settings_notice_list, find_settings_notice_list_by_name, find_last_notice, update_all_category, insert_all_logs, insert_all_errors
from utils_data import save_html, load_html, valid_str, arr_from_csv, dict_from_tuple, dicts_from_tuples, csv_from_dict, csv_from_dicts, csv_added_defaults, fix_encoding_response, _now

from utils_search import find_nids_for_fetch_notice_details

# import ssl

# ssl._create_default_https_context = ssl._create_unverified_context

from urllib3.exceptions import InsecureRequestWarning
# from urllib import disable_warnings

# disable_warnings(InsecureRequestWarning)


# ** Global Variables
HEADLESS = True

DATAFOLER = "../../../data/"
SEPERATOR = "|-"  # 스크랩 요소(key,target,callback), file_name, file_url 분리자
KST = pytz.timezone('Asia/Seoul')
TABLE_NOTICES = "notice_list"
TABLE_DETAILS = "notice_notice_details"
TABLE_FILES = "notice_files"
MAX_RETRY = 20

STOP_KEY = "title"

mysql = Mysql()


# ** 에러 코드 정의
ERROR_CODES = {
  "SUCCESS": 0,         # 성공
  "SETTINGS_NOT_FOUND": 100,  # 설정을 찾을 수 없음
  "PAGE_ACCESS_ERROR": 200,   # 페이지 접속 오류
  "IFRAME_ERROR": 210,      # iframe 접근 오류
  "SELECTOR_ERROR": 220,    # 선택자를 찾을 수 없음
  "ROW_PARSING_ERROR": 300,   # 행 파싱 오류
  "NEXT_PAGE_ERROR": 400,     # 다음 페이지 이동 오류
  "DATA_PROCESSING_ERROR": 500, # 데이터 처리 오류
  "TITLE_ERROR": 301,       # title 파싱 오류
  "URL_ERROR": 302,       # 상세페이지 주소 파싱 오류
  "DATE_ERROR": 303,      # posted_date 파싱 오류
  "UNKNOWN_ERROR": 900,     # 알 수 없는 오류
  "SELENIUM_ERROR": 999     # Selenium 오류
}



# ** 유틸리티 함수들
def get_start_end_page(name):
  """
  기관명을 입력받아 해당 기관의 시작 페이지와 종료 페이지를 반환하는 함수
  
  Args:
    name (str): 기관명
  """
  settings = find_settings_notice_list_by_name(name, out_type="dict")
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
      addStr=f"WHERE `org_name`='{org_name}' order by sn DESC limit {limit}"
    )
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

    # print(f"### 기관 {org_name}의 실제 추가된 데이터 수: {org_insert_counts[org_name]}")  # 디버깅 로그 추가

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
  return [{'org_name': org_name, 'inserted_count': count} 
          for org_name, count in org_insert_counts.items()]



# ** 스크래핑 설정 관련 함수들
def find_org_names():
  """사용 가능한 기관명 목록을 반환"""
  return arr_from_csv(find_settings_notice_list(fields=["org_name"], addStr="WHERE `use`=1", out_type="csv"), index=0, has_header=False)

def get_scrapping_settings(org_name):
  """기관명을 입력받아 해당 기관의 스크래핑 설정을 반환"""
  return find_settings_notice_list_by_name(org_name)

def set_list_page(url, paging, pageNum):
  """페이징 URL 설정"""
  return (url.replace("${i}", str(pageNum)), "") if "${i}" in url else (url, paging.replace("${i}", str(pageNum+1)))

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

  is_exclusion = row.get("exception_path", None)

  if is_exclusion is None:
    rows.append(row)
  elif not is_exclusion:
    row.pop("exception_path", None)
    rows.append(row)
  else:
    pass
    # print(f"!!! exception_path: {is_exclusion}")

# ** 메인 스크래핑 함수
def scrape_list(org_name, start_page=1, end_page=1, debug=False):
  """
  특정 기관의 게시판 목록을 스크래핑
  
  Args:
    org_name (str): 스크래핑할 기관명
    start_page (int): 시작 페이지 번호
    end_page (int): 종료 페이지 번호
    
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
  
  # 설정 가져오기
  settings = get_scrapping_settings(org_name)
  if not settings:
    error_msg = f"{org_name}에 대한 설정을 찾을 수 없습니다."
    result['error_code'] = ERROR_CODES["SETTINGS_NOT_FOUND"]
    result['error_message'] = error_msg
    return result
  
  # print(f"### settings: {settings}")
  
  (url, _, rowXpath, paging, config_start_page, config_end_page, login, _, _, _, elements) = settings
  # (url, iframe, rowXpath, paging, config_start_page, config_end_page, login, org_region, registration, use, elements) = settings

  # 사용자 지정 페이지 범위가 있으면 우선 적용
  if start_page > 0:
    config_start_page = start_page
  if end_page > 0 and end_page >= config_start_page:
    config_end_page = end_page
  
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
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
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
      response = session.get(page_url, headers=headers, timeout=30, verify=False)

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
                  url_match = re.search(r"location\.href=['\"]([^'\"]+)['\"]", onclick)
                  if url_match:
                    next_url = url_match.group(1)
                    break
          
            if next_url:
              if not next_url.startswith('http'):
                next_url = f"{domain}{next_url if next_url.startswith('/') else '/' + next_url}"
              
              # 다음 페이지 로드
              next_response = session.get(next_url, headers=headers, timeout=30, verify=False)
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
        page_data = get_rows(html, rowXpath, elements, _get_rows_after_row, _get_rows_after_rows)
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
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
      futures = [executor.submit(process_page, page_info) for page_info in page_urls]
      
      for future in concurrent.futures.as_completed(futures):
        page_data = future.result()
        if page_data:
          all_data.extend(page_data)
    
    # requests로 데이터를 가져오지 못한 경우 playwright으로 재시도
    if not all_data or len(all_data) < 5:
      print(f"################# playwright 재시도")
      playwright_result = scrape_list_with_playwright(org_name, start_page, end_page, url, rowXpath, paging, elements)
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

def scrape_list_with_playwright(org_name, start_page, end_page, url, rowXpath, paging, elements):
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
        browser = playwright.chromium.launch(headless=HEADLESS)
        # print(f"[2] browser launch 후: {org_name} 페이지 {start_page}: page 처리 시작")
        context = browser.new_context(
          user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          viewport={"width": 1920, "height": 1080}
        )
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
            if not xpath_selector.startswith("xpath=") and not xpath_selector.startswith("//"):
              xpath_selector = "xpath=" + xpath_selector
            
            # print(f"### {org_name} 페이지 {page_num}: rowXpath 로딩 대기 중 ({xpath_selector})")
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
            page_data = get_rows(html_content, rowXpath, elements, _get_rows_after_row, _get_rows_after_rows)
            
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
              if not next_page_selector.startswith("xpath=") and not next_page_selector.startswith("//"):
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
            "error_message":  f"MySQL 저장 오류: {str(e)}",
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
      print("-"*60)
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
    return {
      "logs": logs,
      "error_orgs": error_orgs
    }
  except Exception as e:
    print("mysql upsert 실패")
    print(e)
    return {
      "logs": logs,
      "error_orgs": error_orgs
    }

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
  print("="*100)
  all_results = []
  all_logs = []
  error_orgs = []
  all_errors = []
  
  # names를 2개씩 끊어서 처리
  for i in range(0, len(names), 2):
    batch_names = names[i:i+2]
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

      ### result: {'logs': [{'org_name': '양천구', 'error': {'error_code': 0, 'error_message': ''}, 'scraped_count': 0, 'inserted_count': 0, 'time': '2025-05-16 06:38:13'}], 'error_orgs': ['양천구']}
      ### result: {'logs': [{'org_name': '양천구', 'error': {'error_code': 0, 'error_message': ''}, 'scraped_count': 0, 'inserted_count': 0, 'time': '2025-05-16 06:43:50'}, {'org_name': '광진구', 'error': None, 'scraped_count': 30, 'inserted_count': 0, 'time': '2025-05-16 06:43:50'}], 'error_orgs': ['양천구']}
  all_errors = {
    "orgs": ','.join(error_orgs),
    "time": _now()
  }

  if save:
    print(f"#### all_errors: {all_errors}")
    pass
    update_all_category()
    insert_all_errors(all_errors)
    insert_all_logs(all_logs)

  return all_results

if __name__ == "__main__":
    # print(find_settings_notice_list(fields=["org_name"], addStr="WHERE `use`=1"))
    # ** fetch list
    print("[SCARPING] 공고 고시 게시판(spider_list)")
    names = find_org_names()
    # names = ["서울시", "양천구", "용인시청", "인천광역시남부교육지원청", "인천도시공사", "한국공항공사"]
    # names = ["새만금개발청"]
    # names = ["광진구", "넥스트레인", "도봉구", "동작구", "서초구", "용인시청", "인천도시공사", "인천시청", "인천연수구청", "인천중구청", "조달청"]
    # names = ["서울특별시강서양천교육지원청", "서울특별시남부교육지원청", "서울특별시서부교육지원청", "인천광역시남부교육지원청", "양주시청"]
    # names = ["서울중부교육지원청"] # !!! error: "서울중부교육지원청"
    # names = ["성동구", "성북구"] # error: "서울중부교육지원청"
    # names = ["울릉군청", "제주지방항공청", "인천해사고등학교", "인천광역시 종합건설본부", "인천경제자유구역청", "인천해양경찰서", "인천 상수도"]
    # 부여군청: https://www.buyeo.go.kr/html/kr/news/news_040202.html !!! 한글 깨짐
    # names = ["서울특별시강동송파교육지원청"] # 강서구청 url 변경 필요, https://www.gangseo.seoul.kr/gs040301 !! url 추출 불가(javascript) / 부여군청 최근 게시물 2024-05-31 / !!! "인천본부세관", "정부청사관리본부", "충청남도개발공사" 실패
    # names = ["강서구", "군포시청", "동대문구", "부여군청", "서울특별시강서양천교육지원청", "서울특별시동부교육지원청", "서울특별시서부교육지원청", "인천공항공사", "인천광역시동부교육지원청", "인천본부세관", "정부청사관리본부", "충청남도개발공사", "한국가스공사", "한국자산관리공사"]
    #   names = ["양주시청"]
    #   names = ["하남시청", "금산군청", "인천동구"]
      # names = ["성북구", "아산시청"]  # !!! "서울특별시강동송파교육지원청" url 변경

    # print(scrape_list("부여군청", start_page=1, end_page=1, debug=True))
    # print(_fetch_list_pages(names, debug=False))

    # ** save list
    fetch_list_pages(names)

    # fetch_list_pages(names, save=False)

    # print(scrape_list("새만금개발청"))
    # print(get_start_end_page("양주시청"))

# * 부여군청
# ##CSV: [['title', 'scraped_at', 'detail_url', 'posted_date', 'posted_by', 'org_name', 'error_code', 'error_message'], ['êµ\xadë\x82´ê²°í\x98¼ì¤\x91ê°\x9cì\x97\x85 ë\x93±ë¡\x9dí\x98\x84í\x99©', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=r7F-f-rYc0UIwCgfForfWA&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2025-03-28', 'ê°\x80ì¡±í\x96\x89ë³µê³¼', '부여군청', None, None], ['ã\x80\x8c2024ë\x85\x84 ì\xa0\x9c22í\x9a\x8c ë¶\x80ì\x97¬ì\x84\x9cë\x8f\x99ì\x97°ê½\x83ì¶\x95ì\xa0\x9cã\x80\x8d ì¶\x95ì\xa0\x9cì\x9e¥ ë\x82´ ì\x9e\x84ì\x8b\x9c í\x8e¸ì\x9d\x98ì\xa0\x90 ì\x98\x81ì\x97\x85ì\x9e\x90 ê³µëª¨ ì\x84\xa0ì\xa0\x95 ê²°ê³¼ ì\x95\x88ë\x82´', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=sKSXJGgHe_rH8GcBPMS4CQ&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-05-31', 'ë¬¸í\x99\x94ì²´ì\x9c¡ê´\x80ê´\x91ê³¼', '부여군청', None, None], ['ì\xa0\x9c22í\x9a\x8c ë¶\x80ì\x97¬ì\x84\x9cë\x8f\x99ì\x97°ê½\x83ì¶\x95ì\xa0\x9c ì²´í\x97\x98í\x94\x84ë¡\x9cê·¸ë\x9e¨ ê³µëª¨ ì\x84\xa0ì\xa0\x95 ê²°ê³¼(ì\x88\x98ì\xa0\x95)', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=vndq5UqoQLoxv-92oITtfg&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-05-31', 'ë¬¸í\x99\x94ì²´ì\x9c¡ê´\x80ê´\x91ê³¼', '부여군청', None, None], ['ã\x80\x8c2024ë\x85\x84 ì\xa0\x9c22í\x9a\x8c ë¶\x80ì\x97¬ì\x84\x9cë\x8f\x99ì\x97°ê½\x83ì¶\x95ì\xa0\x9cã\x80\x8d ì¶\x95ì\xa0\x9cì\x9e¥ ì\x9d\x8cì\x8b\x9dí\x8c\x90ë§¤ì\x9e\x90ë\x8f\x99ì°¨(í\x91¸ë\x93\x9cí\x8a¸ë\x9f\xad) ê³µëª¨ ì\x84\xa0ì\xa0\x95 ê²°ê³¼ ì\x95\x88ë\x82´', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=ULmkDwOGrMSl7TfbHAbQjA&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-05-31', 'ë¬¸í\x99\x94ì²´ì\x9c¡ê´\x80ê´\x91ê³¼', '부여군청', None, None], ['ì\x9e¥ì\x95\xa0ì\x9d¸ì\xa0\x84ì\x9a©ì£¼ì°¨êµ¬ì\x97\xad ì£¼ì°¨ì\x9c\x84ë°\x98 ê³¼í\x83\x9cë£\x8c ë¶\x80ê³¼í\x86µì§\x80 ë°\x98ì\x86¡ë¶\x84ì\x97\x90 ë\x8c\x80í\x95\x9c ê³µì\x8b\x9cì\x86¡ë\x8b¬ ê³µê³', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=q7xUctS4IFTO9ETbIaRzWA&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-05-31', 'ì\x82¬í\x9a\x8cë³µì§\x80ê³¼', '부여군청', None, None], ['2024ë\x85\x84 ì\xa0\x9c22í\x9a\x8c ë¶\x80ì\x97¬ì\x84\x9cë\x8f\x99ì\x97°ê½\x83ì¶\x95ì\xa0\x9c ì²´í\x97\x98 í\x94\x84ë¡\x9cê·¸ë\x9e¨ ê³µëª¨', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=9nF473eKInw4xAG7noTK1g&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-05-20', 'ë¬¸í\x99\x94ì²´ì\x9c¡ê´\x80ê´\x91ê³¼', '부여군청', None, None], ['ã\x80\x8c2024ë\x85\x84 ì\xa0\x9c22í\x9a\x8c ë¶\x80ì\x97¬ì\x84\x9cë\x8f\x99ì\x97°ê½\x83ì¶\x95ì\xa0\x9cã\x80\x8d ì¶\x95ì\xa0\x9cì\x9e¥ ë\x82´ ì\x9e\x84ì\x8b\x9c í\x8e¸ì\x9d\x98ì\xa0\x90 ì\x98\x81ì\x97\x85ì\x9e\x90 ëª¨ì§\x91 ì\x95\x88ë\x82´', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=oiw5z4Hs52MEpCSVPrhn_g&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-05-20', 'ë¬¸í\x99\x94ì²´ì\x9c¡ê´\x80ê´\x91ê³¼', '부여군청', None, None], ['ã\x80\x8c2024ë\x85\x84 ì\xa0\x9c22í\x9a\x8c ë¶\x80ì\x97¬ì\x84\x9cë\x8f\x99ì\x97°ê½\x83ì¶\x95ì\xa0\x9cã\x80\x8d ì¶\x95ì\xa0\x9cì\x9e¥ ì\x9d\x8cì\x8b\x9dí\x8c\x90ë§¤ì\x9e\x90ë\x8f\x99ì°¨(í\x91¸ë\x93\x9cí\x8a¸ë\x9f\xad) ì\x98\x81ì\x97\x85ì\x9e\x90 ëª¨ì§\x91 ì\x95\x88ë\x82´', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=r5yTNYIaFCbEogGFHlMF2Q&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-05-20', 'ë¬¸í\x99\x94ì²´ì\x9c¡ê´\x80ê´\x91ê³¼', '부여군청', None, None], ['2024ë\x85\x84 ì\x9e¬ë\x82\x9cë\x8c\x80ì\x9d\x91 ì\x95\x88ì\xa0\x84í\x95\x9cêµ\xadí\x9b\x88ë\xa0¨ êµ\xadë¯¼ì²´í\x97\x98ë\x8b¨ ëª¨ì§\x91', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=CRt4vJDvryraZxFaTt7XWw&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-05-17', 'ì\x95\x88ì\xa0\x84ì´\x9dê´\x84ê³¼', '부여군청', None, None], ['ë¶\x80ì\x97¬êµ° ê³µë¦½ì§\x80ì\x97\xadì\x95\x84ë\x8f\x99ì\x84¼í\x84° ì\x9c\x84í\x83\x81ì\x9a´ì\x98\x81ì\x9e\x90 ëª¨ì§\x91ê³µê³', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=naR8YfyLGBlsBPDDqh8Pww&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-05-16', 'ê°\x80ì¡±í\x96\x89ë³µê³¼', '부여군청', None, None], ['ã\x80\x8cë¶\x80ì\x97¬êµ° ë§¤ì\x9e¥ë¬¸í\x99\x94ì\x9e¬ ì\x9c\xa0ì¡´ì§\x80ì\x97\xad ì\xa0\x95ë³´ê³\xa0ë\x8f\x84í\x99\x94 ì\x82¬ì\x97\x85 ì§\x80ë\x8f\x84 ì\xa0\x9cì\x9e\x91 ë°\x8f DB êµ¬ì¶\x95 ì\x9a©ì\x97\xadã\x80\x8d ì\xa0\x9cì\x95\x88ì\x84\x9c í\x8f\x89ê°\x80ì\x9c\x84ì\x9b\x90(í\x9b\x84ë³´ì\x9e\x90) ëª¨ì§\x91 ê³µê³', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=UyPzWyiUgedjSx5hHmxZaA&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-04-17', 'ë¬¸í\x99\x94ì\x9e¬ê³¼', '부여군청', None, None], ['2024ë\x85\x84 ì\x83\x9dì\x82°ë\x8b¨ê³\x84 ì¶\x95ì\x82°ë¬¼ HACCP(ë\x86\x8dì\x97\x85ì\x9d¸ê³¼ì\xa0\x95) êµ\x90ì\x9c¡ê³\x84í\x9a\x8d ë³\x80ê²½ ì\x95\x8cë¦¼', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=7M0b3EBg1hb8ZVv65raQOA&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-04-12', 'ì¶\x95ì\x88\x98ì\x82°ê³¼', '부여군청', None, None], ['(ì\x9e¬)ë¶\x80ì\x97¬êµ°ì§\x80ì\x97\xadê³µë\x8f\x99ì²´í\x99\x9cì\x84±í\x99\x94ì\x9e¬ë\x8b¨ ë¹\x84ì\x83\x81ì\x9e\x84ì\x9d´ì\x82¬ ê³µê°\x9cëª¨ì§\x91 ê³µê³', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=ERy8TXNoDDn2W4QinAhnkA&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-04-03', 'ê²½ì\xa0\x9cêµ\x90í\x86µê³¼', '부여군청', None, None], ['2024 í\x95\x98ë°\x98ê¸° ë\x82´êµ\xadì\x9d¸ êµ¬ì\x9d¸ê³µê³', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=4q9vOPZRg7m-eoAPaLvFqQ&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-04-02', 'ë\x86\x8dì\x97\x85ì\xa0\x95ì±\x85ê³¼', '부여군청', None, None], ['ì\x9e¥ì\x95\xa0ì\x9d¸ì\xa0\x84ì\x9a©ì£¼ì°¨êµ¬ì\x97\xad ì£¼ì°¨ì\x9c\x84ë°\x98 ê³¼í\x83\x9cë£\x8c ë¶\x80ê³¼í\x86µì§\x80 ë°\x98ì\x86¡ë¶\x84ì\x97\x90 ë\x8c\x80í\x95\x9c ê³µì\x8b\x9cì\x86¡ë\x8b¬ ê³µê³', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=9TK626GWmfiBtM8jngtCtQ&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-03-28', 'ì\x82¬í\x9a\x8cë³µì§\x80ê³¼', '부여군청', None, None], ['ë\x8f\x84ë¡\x9cëª\x85ì£¼ì\x86\x8c ê°\x9cë³\x84ê³\xa0ì\x8b\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=TpleXePD8L6lrmS-ETczyg&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-03-28', 'ì¢\x85í\x95©ë¯¼ì\x9b\x90ì§\x80ì\xa0\x81ê³¼', '부여군청', None, None], ['2024ë\x85\x84 ë¶\x80ì\x97¬êµ° ì\x9d¼ì\x9e\x90ë¦¬ë\x8c\x80ì±\x85 ì\x84¸ë¶\x80ê³\x84í\x9a\x8d ê³µì\x8b\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=OJ8SUhxD4gKzIlOhap46_Q&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-03-26', 'ê²½ì\xa0\x9cêµ\x90í\x86µê³¼', '부여군청', None, None], ['ë\x8f\x84ë¡\x9cëª\x85ì£¼ì\x86\x8c ê°\x9cë³\x84ê³\xa0ì\x8b\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=eFhorApxHnG3n36HMRoS3g&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-03-22', 'ì¢\x85í\x95©ë¯¼ì\x9b\x90ì§\x80ì\xa0\x81ê³¼', '부여군청', None, None], ['ë³´ì\xa0\x84ì\x82°ì§\x80 ì§\x80ì\xa0\x95í\x95´ì\xa0\x9c ê³\xa0ì\x8b\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=-aWVnpBNOgOtrYeA7ifW0w&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-03-21', 'ì\x82°ë¦¼ë\x85¹ì§\x80ê³¼', '부여군청', None, None], ['(ì\x9e¬)ë¶\x80ì\x97¬êµ°ì§\x80ì\x97\xadê³µë\x8f\x99ì²´í\x99\x9cì\x84±í\x99\x94ì\x9e¬ë\x8b¨ ì\x83\x81ì\x9e\x84ì\x9d´ì\x82¬ ê³µê°\x9cëª¨ì§\x91 ì\x9e¬ê³µê³', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=qCUNV0k_a-TjssqfCFOnlA&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-03-20', 'ê²½ì\xa0\x9cêµ\x90í\x86µê³¼', '부여군청', None, None], ['2024ë\x85\x84 ë\x86\x8dì\x9e\x91ì\x97\x85 í\x98\x84ì\x9e¥ ì¹\x9cí\x99\x98ê²½ í\x99\x94ì\x9e¥ì\x8b¤ ì\x84¤ì¹\x98 ì\x8b\xa0ì²\xad ì\x95\x8cë¦¼', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=HZ1IKDXzn_pAW4dHqoiutw&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-03-15', 'ë\x86\x8dì\x97\x85ì\xa0\x95ì±\x85ê³¼', '부여군청', None, None], ['ë\x8f\x84ë¡\x9cëª\x85ì£¼ì\x86\x8c ê°\x9cë³\x84ê³\xa0ì\x8b\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=wnx9DwKz_jayRJOI3r682Q&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-03-15', 'ì¢\x85í\x95©ë¯¼ì\x9b\x90ì§\x80ì\xa0\x81ê³¼', '부여군청', None, None], ['2024ë\x85\x84 ì²\xadë\x85\x84ë\x86\x8dì°½ì\x97\x85í\x88¬ì\x9e\x90ì\x8b¬ì¸µì»¨ì\x84¤í\x8c\x85 ì\x88\x98ì\x9a\x94ì\x9e\x90 ëª¨ì§\x91 í\x99\x8dë³´', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=vI8ey_a_lj4YsHNAsiVhpQ&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-03-14', 'ë\x86\x8dì\x97\x85ì\xa0\x95ì±\x85ê³¼', '부여군청', None, None], ['2024ë\x85\x84 ë¶\x80ì\x97¬êµ° ì·¨ì\x97\x85ì\x9e\x90ê²©ì¦\x9d ì·¨ë\x93\x9dì§\x80ì\x9b\x90 ì\x82¬ì\x97\x85 ì°¸ê°\x80ì\x9e\x90 ëª¨ì§\x91 ê³µê³', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=fleqfSC1P-NlesuzwpVurg&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-03-11', 'ê²½ì\xa0\x9cêµ\x90í\x86µê³¼', '부여군청', None, None], ['ë\x8f\x84ë¡\x9cëª\x85ì£¼ì\x86\x8c ê°\x9cë³\x84ê³\xa0ì\x8b\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=pIQ1owSqu1fBZRfzKW83OQ&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-03-08', 'ì¢\x85í\x95©ë¯¼ì\x9b\x90ì§\x80ì\xa0\x81ê³¼', '부여군청', None, None], ['2024 ì\x83\x81ë°\x98ê¸° ì\x8b\xa0ê·\x9cë\x86\x8dì\x97\x85ì\x9d¸(ê·\x80ë\x86\x8dê·\x80ì´\x8c) ê¸°ì´\x88ì\x98\x81ë\x86\x8dê¸°ì\x88\xa0êµ\x90ì\x9c¡ì\x83\x9d ëª¨ì§\x91ê³µê³', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=ZWOQnf5gZOLdhii_CHlubg&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-03-07', 'ë\x86\x8dì\x97\x85ê¸°ì\x88\xa0ì\x84¼í\x84°', '부여군청', None, None], ['ë¶\x80ì\x97¬ êµ°ê³\x84í\x9a\x8dì\x8b\x9cì\x84¤(ë°\x95ë¬¼ê´\x80) ì\x82¬ì\x97\x85ì\x8b\x9cí\x96\x89ì\x9e\x90 ì§\x80ì\xa0\x95 ë°\x8f ì\x8b¤ì\x8b\x9cê³\x84í\x9a\x8d(ë³\x80ê²½) ì\x9d¸ê°\x80 ê³\xa0ì\x8b\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=5OsRZ2ukQGVNLKPQwo4CSQ&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-03-06', 'ë\x8f\x84ì\x8b\x9cê±´ì¶\x95ê³¼', '부여군청', None, None], ['ë\x8f\x84ë¡\x9cëª\x85ì£¼ì\x86\x8c ê°\x9cë³\x84ê³\xa0ì\x8b\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=kFHbdYXwyezkryJLhE8-Hw&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-02-29', 'ì¢\x85í\x95©ë¯¼ì\x9b\x90ì§\x80ì\xa0\x81ê³¼', '부여군청', None, None], ['ë¶\x80ì\x97¬ êµ°ê´\x80ë¦¬ê³\x84í\x9a\x8d(í\x95\x99êµ\x90 ì¡°ì\x84±ê³\x84í\x9a\x8d) ê²°ì\xa0\x95(ë³\x80ê²½) ë°\x8f êµ°ê³\x84í\x9a\x8dì\x8b\x9cì\x84¤(í\x95\x99êµ\x90)ì\x82¬ì\x97\x85 ì\x8b¤ì\x8b\x9cê³\x84í\x9a\x8d(ë³\x80ê²½) ì\x9d¸ê°\x80 ê³\xa0ì\x8b\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=xvUhQsqoPu6_xeAsenkWbQ&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-02-29', 'ë\x8f\x84ì\x8b\x9cê±´ì¶\x95ê³¼', '부여군청', None, None], ['ë¶\x80ì\x97¬ êµ°ê´\x80ë¦¬ê³\x84í\x9a\x8d(ì\x8c\x8dë¶\x81ì§\x80êµ¬ ì§\x80êµ¬ë\x8b¨ì\x9c\x84ê³\x84í\x9a\x8d) ê²°ì\xa0\x95(ë³\x80ê²½) ë°\x8f ì§\x80í\x98\x95ë\x8f\x84ë©´ ê³\xa0ì\x8b\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=85PynxOPvksqlYdEvp2jGQ&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-02-29', 'ë\x8f\x84ì\x8b\x9cê±´ì¶\x95ê³¼', '부여군청', None, None], ['2024ë\x85\x84 ì\x83\x81ë°\x98ê¸° ì\x83\x81ì\x88\x98ë\x8f\x84 ê¸\x89ì\x88\x98ê³µì\x82¬ ì\x82°ì\xa0\x95ê¸°ì¤\x80 ë°\x8f ë§\x88ì\x9d\x84ë\x8b¨ì\x9c\x84 ê¸\x89ì\x88\x98ê³µì\x82¬ ë\x8b¨ê°\x80 ê³\xa0ì\x8b\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=6whcFZfRC7oKq_BX8M2_Kw&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-02-28', 'ì\x83\x81í\x95\x98ì\x88\x98ë\x8f\x84ì\x82¬ì\x97\x85ì\x86\x8c', '부여군청', None, None], ['(ì\x9e¬)ë¶\x80ì\x97¬êµ° ì§\x80ì\x97\xadê³µë\x8f\x99ì²´í\x99\x9cì\x84±í\x99\x94ì\x9e¬ë\x8b¨ ì\x83\x81ì\x9e\x84ì\x9d´ì\x82¬ ê³µê°\x9cëª¨ì§\x91 ìµ\x9cì¢\x85 í\x95©ê²©ì\x9e\x90 ë°\x9cí\x91\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=3A1cNdhcOGWZbOBIgcnVeg&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-02-27', 'ê²½ì\xa0\x9cêµ\x90í\x86µê³¼', '부여군청', None, None], ['(ì\x9e¬)ë¶\x80ì\x97¬êµ° ì§\x80ì\x97\xadê³µë\x8f\x99ì²´í\x99\x9cì\x84±í\x99\x94 ì\x9e¬ë\x8b¨ ì\x83\x81ì\x9e\x84ì\x9d´ì\x82¬ ê³µê°\x9cëª¨ì§\x91 ë©´ì\xa0\x91ì\x8b¬ì\x82¬ í\x95©ê²©ì\x9e\x90 ë°\x9cí\x91\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=QLEbZvpIxjgP6a1A23QFNQ&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-02-23', 'ê²½ì\xa0\x9cêµ\x90í\x86µê³¼', '부여군청', None, None], ['ë\x8f\x84ë¡\x9cëª\x85ì£¼ì\x86\x8c ê°\x9cë³\x84ê³\xa0ì\x8b\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=jGCp8iaP8VfXzQwq-Y1-5g&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-02-23', 'ì¢\x85í\x95©ë¯¼ì\x9b\x90ì§\x80ì\xa0\x81ê³¼', '부여군청', None, None], ['(ì\x9e¬)ë¶\x80ì\x97¬êµ° ì§\x80ì\x97\xadê³µë\x8f\x99ì²´í\x99\x9cì\x84±í\x99\x94 ì\x9e¬ë\x8b¨ ì\x83\x81ì\x9e\x84ì\x9d´ì\x82¬ ê³µê°\x9cëª¨ì§\x91 ì\x84\x9cë¥\x98ì\x8b¬ì\x82¬ í\x95©ê²©ì\x9e\x90 ë°\x9cí\x91\x9c', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=ScDUzdiNL-bJKirmDnezqg&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-02-20', 'ê²½ì\xa0\x9cêµ\x90í\x86µê³¼', '부여군청', None, None], ['2024ë\x85\x84 ë°±ì\xa0\x9cê¸°ì\x99\x80ë¬¸í\x99\x94ê´\x80 ê¸°ê°\x84ì\xa0\x9cê·¼ë¡\x9cì\x9e\x90(ì\x8b\x9cì\x84¤ê´\x80ë¦¬ì\x9b\x90, ë¬¸í\x99\x94ì\x9c\xa0ì\x82°í\x99\x9cì\x9a©ì\xa0\x84ë¬¸ì\x9d¸ë\xa0¥) ìµ\x9cì¢\x85í\x95©ê²©ì\x9e\x90 ê³µê³', '2025-04-18 07:03:24', 'https://www.buyeo.go.kr/_prog/_board/?mode=V&no=mqDd8fKbfxJaX0vzcRrh2A&code=news_02&site_dvs_cd=kr&menu_dvs_cd=040205', '2024-02-19', 'ì\x82¬ì\xa0\x81ê´\x80ë¦¬ì\x86\x8c', '부여군청', None, None]]