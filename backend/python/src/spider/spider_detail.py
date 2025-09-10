import os
import time
import codecs
import html
import re
import urllib
from utils.utils_data import valid_str, fix_encoding, decode_html_text, _now
from utils.utils_mysql import Mysql, _where_like_unit, _where_eq_unit
# Import from separated mysql modules
from mysql.mysql_settings import (SEPERATOR, SETTINGS_NOTICE_DETAIL_FIELDS,
                            find_settings_notice_list,
                            _find_settings_notice_detail_by_org_name,
                            find_settings_notice_detail_by_org_name,
                            unpack_settings_elements)
from mysql.mysql_notice import upsert_notice_list
from utils.utils_lxml import _get_outerhtml, get_val, get_dict, download_by_url, download_by_url_with_headers
from utils.utils_nas import get_notice_nas_folder

import requests
from playwright.sync_api import Playwright, sync_playwright
from utils.utils_data import fix_encoding_response
import urllib3
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# DATAFOLER = "../../../data/"
SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS = ["title", "body_html", "file_name", "file_url", "notice_div", "notice_num", "org_dept", "org_man", "org_tel"]

# * populate
# -----------------------------------------------------------
def get_sample_url():
  pass


def populate_settings_notice_detail():
  orgs = find_settings_notice_list(fields=["org_name", "use"],
                                   addStr="WHERE 1=1",
                                   out_type="dicts")
  for org in orgs:
    # old detail
    old = _find_settings_notice_detail_by_org_name(
        org["org_name"],
        fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS,
        table_name="settings_notice_detail_old",
        out_type="dict")
    if not old:
      org |= {key: "" for key in SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS}
    else:
      org |= old

  mysql = Mysql()  # 로컬 MySQL 객체 생성
  mysql.upsert("settings_notice_detail", orgs, inType="dicts")
  mysql.close()
  return orgs


def update_all_sample_urls(org_names=[]):
  data = []
  if not org_names:
    org_names = [
        org[0] for org in find_settings_notice_list(
            fields=["org_name"], addStr="WHERE 1=1", out_type="tuples")
    ]
  mysql = Mysql()  # 로컬 MySQL 객체 생성
  for org_name in org_names:
    sample_url = ""
    find1 = mysql.find(
        "notice_list", ["detail_url"],
        addStr=f"WHERE `org_name` = '{org_name}' ORDER BY nid DESC LIMIT 1")
    if find1:
      sample_url = find1[0][0]
    data.append({"org_name": org_name, "sample_url": sample_url})

  mysql.upsert("settings_notice_detail", data, inType="dicts")
  mysql.close()


def get_nid_by_sample_url(sample_url="https://notexist.com"):
  mysql = Mysql()  # 로컬 MySQL 객체 생성

  nid = 0
  find1 = mysql.find(
      "notice_list", ["nid"],
      addStr=f"WHERE `detail_url` = '{sample_url}' ORDER BY nid DESC LIMIT 1")
  mysql.close()
  if find1:
    nid = find1[0][0]
  return nid


def get_all_nids():
  orgs = find_settings_notice_list(fields=["org_name", "use"],
                                   addStr="WHERE `use` = 1",
                                   out_type="dicts")
  nids = []
  error_orgs = []
  mysql = Mysql()  # 로컬 MySQL 객체 생성
  for org in orgs:
    # old detail
    settings = _find_settings_notice_detail_by_org_name(
        org["org_name"],
        fields=["sample_url"],
        table_name="settings_notice_detail",
        out_type="dict")
    sample_url = settings["sample_url"]
    nid = 0
    find1 = mysql.find(
        "notice_list", ["nid"],
        addStr=f"WHERE `detail_url` = '{sample_url}' ORDER BY nid DESC LIMIT 1"
    )
    if find1:
      nid = find1[0][0]
      nids.append(nid)
    if not nid:  # sample_url에 해당하는 nid가 없는 경우
      error_orgs.append(org["org_name"])
    else:
      pass
  mysql.close()
  return {"nids": nids, "error_orgs": error_orgs}


def populate_notice_details_by_sample_url(nids=[]):
  if not nids:
    data = get_all_nids()
    nids = data["nids"]
  for nid in nids:
    upsert_detail_by_nid(nid)

  print(nids)


def update_all_orgs_url():
  data = get_all_nids()
  nids = data["nids"]
  mysql = Mysql()  # 로컬 MySQL 객체 생성
  for nid in nids:
    find1 = mysql.find(
        "notice_list", ["detail_url", "org_name"],
        addStr=f"WHERE `nid` = '{nid}' ORDER BY nid DESC LIMIT 1")
    if find1:
      data = {"nid": nid, "detail_url": find1[0][0], "org_name": find1[0][1]}
      print(data)
      mysql.upsert("notice_details", [data], inType="dicts")
  mysql.close()
  print(nids)


# * sub function
# -----------------------------------------------------------


def url_quote(url):
  return urllib.parse.quote(url).replace("%3F",
                                         "?").replace("%3D",
                                                      "=").replace("%26", "&")


def encode_down_url(base_url, user_file_name, sys_file_nm, file_path):
  # base_url = "https://eminwon.asan.go.kr/emwp/jsp/ofr/FileDownNew.jsp"
  url = urllib.parse.quote(user_file_name)
  url += "&sys_file_nm=" + urllib.parse.quote(sys_file_nm)
  url += "&file_path=" + urllib.parse.quote(file_path)
  return base_url + url.replace("%20", "+").replace("/", "%2F")


def encode_down_url2(base_url, atchFileId, orignlFileNm, atchDirId):
  # base_url = "https://eminwon.asan.go.kr/emwp/jsp/ofr/FileDownNew.jsp"
  url = urllib.parse.quote(atchFileId)
  url += "&orignlFileNm=" + urllib.parse.quote(orignlFileNm)
  url += "&atchDirId=" + urllib.parse.quote(atchDirId)
  return base_url + url.replace("%20", "+").replace("/", "%2F")


def encode_down_url3(base_url, orifileName, subPath):
  # base_url = "https://eminwon.asan.go.kr/emwp/jsp/ofr/FileDownNew.jsp"
  url = urllib.parse.quote(orifileName)
  url += "&subPath=" + urllib.parse.quote(subPath)
  return base_url + url.replace("%20", "+").replace("/", "%2F")


def _file_url_href(rst):
  """파일 주소 반환
  """
  print(f"rst: {rst}")
  return rst
  # # keys = ["?user_file_nm", "&sys_file_nm", "&file_path"]

  # # URL 파싱
  # parsed_url = urllib.parse.urlparse(rst)
  # print(f"rst: {rst}")
  # print(f"parse url: {parsed_url}")
  # # parsed_url = rst

  # # 쿼리 문자열에서 매개변수 추출
  # query_params = urllib.parse.parse_qs(parsed_url.query)

  # # 필요한 매개변수 값 추출
  # user_file_nm = query_params.get('user_file_nm', [''])[0]
  # sys_file_nm = query_params.get('sys_file_nm', [''])[0]
  # file_path = query_params.get('file_path', [''])[0]
  # # user_file_nm = urllib.parse.unquote(query_params.get('user_file_nm', [''])[0])
  # # sys_file_nm = urllib.parse.unquote(query_params.get('sys_file_nm', [''])[0])
  # # file_path = urllib.parse.unquote(query_params.get('file_path', [''])[0])

  [user_file_nm, sys_file_nm, file_path]

  return rst.split("?")[0] + "?user_file_nm=" + user_file_nm + \
      "&sys_file_nm=" + sys_file_nm + "&file_path" + file_path


def _file_url_js(rst, base_url):
  """파일 주소 반환
  """
  return f"{base_url}/emwp/jsp/ofr/FileDown.jsp?user_file_nm=" + rst.split(
      "'")[1] + "&sys_file_nm=" + rst.split(
          "'")[3] + "&file_path=" + rst.split("'")[5]


def _file_new_js(rst, base_url):
  """파일 주소 반환
  """
  return encode_down_url(
      f"{base_url}/emwp/jsp/ofr/FileDownNew.jsp?user_file_nm=",
      rst.split("'")[1],
      rst.split("'")[3],
      rst.split("'")[5])


def _file_new_js2(rst, base_url):
  """파일 주소 반환
  국가철도공단 !! 다운로드시 파일 이름 한글 깨짐
  """
  return encode_down_url2(f"{base_url}/common/FileDown.do?atchFileId=",
                          rst.split("'")[1],
                          rst.split("'")[3],
                          rst.split("'")[5])


def _file_new_js3(rst, base_url):
  """파일 주소 반환
  서울특별시강남서초교육지원청
  """
  return encode_down_url3(f"{base_url}/CMS/fileDownload.do?orifileName=",
                          rst.split("'")[3],
                          rst.split("'")[5])


# http://gnscedu.sen.go.kr/CMS/fileDownload.do

# fileName: 학교시설사업 시행계획 변경승인에 대한 의견조회 공고 전문(중대부고).pdf
# orifileName: 학교시설사업 시행계획 변경승인에 대한 의견조회 공고 전문(중대부고).pdf
# subPath: /CMS/openedu/openedu02/openedu0201/__icsFiles/afieldfile/2025/04/21/


def _file_name_jodal(el_str):
  # alt 속성에서 파일 이름 추출
  import re
  file_name = re.search(r'alt="([^"]*)"', el_str).group(1) if re.search(
      r'alt="([^"]*)"', el_str) else 'nonamed'
  src_pattern = re.search(r'/([^/]*?)\.jpg', el_str).group(1) if re.search(
      r'/([^/]*?)\.jpg', el_str) else 'hwpx'
  src_pattern = 'hwpx' if src_pattern == 'file' else src_pattern

  return f"{file_name}.{src_pattern}"


def _cb_on_key_file_url(root, xpath, target, callback):
  from urllib.parse import unquote
  file_urls = []
  els = root.xpath(xpath)
  # print(f"els: {len(els)}, target: {target}")
  for el in els:
    # rst = get_val(root, xpath, target, joiner=SEPERATOR)
    if target is None:
      rst = el.text
    elif target == "outerhtml":
      rst = _get_outerhtml(el)
    else:
      rst = el.get(target)
      # print(f"!!!!!!!!!!!!!!!!!!rst {rst}")
    if not rst:
      rst = ""
      continue
    if callback:
      # print(f"**file_url callback: |{callback}|, rst: |{rst}|")
      rst = eval(callback)
    # file_urls.append(unquote(rst.strip()))
    # print(f"!!!!!!!!!!!!!!!!file_url {rst}")
    file_urls.append(rst.strip())
  # print(f"!!!!!!!!!!!!!!!!file_urls {file_urls}")
  return SEPERATOR.join(file_urls)


def _cb_on_key_file_name(root, xpath, target, callback):
  print(
      f"root, xpath, target, callback: |{root}|, |{xpath}|, |{target}|, |{callback}|"
  )
  # print(f"!!!!!!!!!!!!!!!!!!@@@@@@@@@_cb_on_key_file_name {xpath}")
  file_urls = []
  els = root.xpath(xpath)
  for el in els:
    # rst = get_val(root, xpath, target, joiner=SEPERATOR)
    if target is None:
      rst = el.text
    elif target == "content":
      rst = str(el.text_content().strip())
    elif target == "outerhtml":
      rst = _get_outerhtml(el)
    else:
      rst = el.get(target)
    if not rst:
      rst = ""
      continue
    if callback:
      # print(f"**file_name callback: |{callback}|, rst: |{rst}|")
      rst = eval(callback)
    file_urls.append(rst.strip().split('\n')[0].strip())
    # first_line = rst.strip().split('\n')[0].strip()
    # print(f"!!!!!! rst: {first_line}")
    # # file_urls.append(rst.split("\n")[0].strip())

  return SEPERATOR.join(file_urls)


# * scraping
# -----------------------------------------------------------
def _fetch_html_by_requests(url):
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
  # 페이지 GET 요청
  session = requests.Session()
  response = session.get(url, headers=headers, timeout=30, verify=False)

  # print(f"### {org_name} 페이지 {page_num}: {page_url}")

  if response.status_code != 200:
    return ""

  html = fix_encoding_response(response)
  return html


def _fetch_html_by_playwright(url,
                              timeout=30000,
                              wait_for_selector=None,
                              scroll=True):
  """
  Playwright를 사용하여 HTML 페이지를 가져오는 함수

  Args:
      url (str): 가져올 페이지 URL
      timeout (int): 페이지 로딩 타임아웃 (밀리초 단위, 기본값: 30초)
      wait_for_selector (str, optional): 특정 셀렉터가 로드될 때까지 대기 (기본값: None)
      scroll (bool): 페이지 스크롤 여부 (기본값: True)

  Returns:
      str: 페이지 HTML 내용
  """
  html_content = ""

  with sync_playwright() as playwright:
    try:
      # 브라우저 실행 (헤드리스 모드)
      chromium_path = os.getenv('CHROMIUM_EXECUTABLE_PATH')
      browser = playwright.chromium.launch(
          headless=True,
          executable_path=chromium_path if chromium_path else None
      )

      # 새 페이지 컨텍스트 생성
      context = browser.new_context(
          viewport={
              "width": 1280,
              "height": 800
          },
          user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      )

      # 새 페이지 열기
      page = context.new_page()

      # 페이지 로딩
      page.goto(url, timeout=timeout, wait_until="networkidle")

      # 특정 셀렉터가 로드될 때까지 대기 (지정된 경우)
      if wait_for_selector:
        page.wait_for_selector(wait_for_selector, timeout=timeout)

      # 페이지가 완전히 로드될 때까지 잠시 대기
      page.wait_for_timeout(2000)  # 2초 대기

      # 스크롤 동작 수행 (옵션)
      if scroll:
        # 페이지 전체 스크롤 (동적 컨텐츠 로드를 위해)
        page.evaluate("""
                    () => {
                        return new Promise((resolve) => {
                            let totalHeight = 0;
                            const distance = 300;
                            const timer = setInterval(() => {
                                const scrollHeight = document.body.scrollHeight;
                                window.scrollBy(0, distance);
                                totalHeight += distance;

                                if(totalHeight >= scrollHeight){
                                    clearInterval(timer);
                                    resolve();
                                }
                            }, 100);
                        });
                    }
                """)

        # 페이지 맨 위로 스크롤 복귀
        page.evaluate("window.scrollTo(0, 0)")

        # 추가 대기
        page.wait_for_timeout(1000)

      # HTML 내용 가져오기
      html_content = page.content()

      # 브라우저 닫기
      browser.close()

    except Exception as e:
      print(f"Playwright로 페이지 로딩 중 오류 발생: {str(e)}")

  return html_content


def _fetch_detail_by_org_name_requests(url, name, save_html=False):
  settings = _find_settings_notice_detail_by_org_name(
      name,
      fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS,
      table_name="settings_notice_detail",
      out_type="dict")
  print(f"======settings: {settings}")

  html = _fetch_html_by_requests(url)


  if len(html) < 10:
    return {}

  # print(html)
  if save_html:
    with open(f"./downloads/{name}.html", 'w', encoding='utf-8') as file:
      file.write(html)
  # cb_on_key = {"file_url": _cb_on_key_file_url}
  cb_on_key = {
      "file_url": _cb_on_key_file_url,
      "file_name": _cb_on_key_file_name
  }

  unpack = unpack_settings_elements(settings)
  print(f"{unpack=}")

  return get_dict(html, unpack_settings_elements(settings), cb_on_key)


# def _fetch_detail_by_org_name_playwright(url, name, wait_for_selector=None):
def _fetch_detail_by_org_name_playwright(url,
                                         name,
                                         required_keys=["title"],
                                         save_html=False):
  """
  Playwright를 사용하여 상세 페이지 정보를 스크래핑하는 함수

  Args:
      url (str): 스크래핑할 URL
      name (str): 기관명
      wait_for_selector (str, optional): 기다릴 셀렉터

  Returns:
      dict: 스크래핑된 상세 정보
  """
  settings = _find_settings_notice_detail_by_org_name(
      name,
      fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS,
      table_name="settings_notice_detail",
      out_type="dict")
  # print(f"======settings: {settings}")
  wait_for_selector = None
  if len(required_keys) > 0:
    key = required_keys[-1]
    if key in settings and settings[key]:
      wait_for_selector = settings[key].split(SEPERATOR)[0]

  # Playwright를 사용하여 HTML 가져오기
  html = _fetch_html_by_playwright(url, wait_for_selector=wait_for_selector)

  if save_html:
    # 다운로드 디렉토리 생성
    os.makedirs("./downloads", exist_ok=True)
    # HTML 저장 (디버깅용)
    with open(f"./downloads/{name}_playwright.html", 'w',
              encoding='utf-8') as file:
      file.write(html)

  # # 콜백 함수 설정
  # cb_on_key = {"file_url": _cb_on_key_file_url, "file_name": _cb_on_key_file_name}
  cb_on_key = {
      "file_url": _cb_on_key_file_url,
      "file_name": _cb_on_key_file_name
  }

  return get_dict(html, unpack_settings_elements(settings), cb_on_key)

  # # HTML 파싱하여 데이터 추출
  # return get_dict(html, unpack_settings_elements(settings), cb_on_key)


def _fetch_detail_by_org_name(url, name, required_keys=["title"]):
  # !! wait_for_selector 추가 필요
  data = _fetch_detail_by_org_name_requests(url, name)
  for key in required_keys:
    if key not in data or len(data[key]) < 4:
      print(f"@@@ =[{name}]= fetch by PLAYWRIGHT")
      return _fetch_detail_by_org_name_playwright(url, name, required_keys)
  print(f"@@@ =[{name}]= fetch by REQUESTS")

  # detail_url, org_name
  data["detail_url"] = url
  data["org_name"] = name
  return data


def _fetch_detail_by_nid(nid, required_keys=["title"]):
  # 417236
  mysql = Mysql()  # 로컬 MySQL 객체 생성
  fields = [
      "detail_url", "org_name", "created_at", "posted_date", "posted_by",
      "category"
  ]
  find1 = mysql.find("notice_list", fields, addStr=f"WHERE `nid` = '{nid}'")
  mysql.close()
  if find1:
    url = find1[0][0]
    name = find1[0][1]

    # find1[0]의 값을 dict로 생성
    db_data = {
        "created_at":
        find1[0][2] if len(find1[0]) > 2 else _now(format="%Y-%m-%d %H:%M:%S"),
        "posted_date":
        find1[0][3] if len(find1[0]) > 3 else _now(format="%Y-%m-%d"),
        "posted_by":
        find1[0][4] if len(find1[0]) > 4 else "",
        "category":
        find1[0][5] if len(find1[0]) > 5 else "공사점검",
    }


    print(f"{db_data=}")
    print(url, name, required_keys)

    # _fetch_detail_by_org_name의 결과를 가져와서 db_data와 합침
    detail_result = _fetch_detail_by_org_name(url, name, required_keys)

    print(f"{detail_result=}")

    # dict인 경우 merge, 아닌 경우 새로운 키로 추가
    if isinstance(detail_result, dict):
      result = {**detail_result, **db_data}
    else:
      result = {"detail": detail_result, **db_data}

    return result
  # return url
  return None


def upsert_detail_by_nid(nid):
    """
    공지사항 ID로 상세 정보를 가져와 데이터베이스에 저장하는 함수
    
    Args:
        nid (int): 공지사항 ID
        use_playwright (bool): Playwright 사용 여부 (기본값: False)
        wait_for_selector (str, optional): Playwright에서 기다릴 셀렉터
        
    Returns:
        dict: 저장된 상세 정보
    """
    data = _fetch_detail_by_nid(nid)
    print(f"{data=}")
    if data:
        data["nid"] = nid
        
        # datetime 객체를 문자열로 변환
        if data.get("created_at") and hasattr(data["created_at"], "strftime"):
            data["created_at"] = data["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        if data.get("posted_date") and hasattr(data["posted_date"], "strftime"):
            data["posted_date"] = data["posted_date"].strftime("%Y-%m-%d")
            
        # # None 값들을 빈 문자열로 변환 (필요한 경우)
        # for key in ["category", "status", "posted_by"]:
        #     if data.get(key) is None:
        #         data[key] = ""
        
        # print("#"*80)
        # print(f"{data}")
        
        mysql = Mysql()  # 로컬 MySQL 객체 생성
        mysql.upsert("notice_details", [data], inType="dicts")
        mysql.close()
        
    return data


def download_files_by_nid(nid, folder=""):
  if not folder:
    folder = get_notice_nas_folder(nid)

  mysql = Mysql()  # 로컬 MySQL 객체 생성
  # !! details에 "detail_url" 추가, Referer로 사용
  find1 = mysql.find("notice_details", ["file_url", "file_name"],
                     addStr=f"WHERE `nid` = '{nid}'")
  find2 = mysql.find("notice_list", ["detail_url"],
                     addStr=f"WHERE `nid` = '{nid}'")
  mysql.close()

  print(f"{find1=} {find2=}")

  if not find1:
    return

  (urlStr, nameStr) = find1[0]
  referer = find2[0][0]
  urls = urlStr.split(SEPERATOR)
  names = nameStr.split(SEPERATOR)
  # print(urls, names, referer)
  downloads = []

  for (index, url) in enumerate(urls):
    print(f"index, url name: {index}, {url}, {names[index]}")
    print(f"{folder=}")
    # download_files_by_url(url, folder, names[index])
    start = _now()
    file_path = download_by_url_with_headers(url,
                                             folder,
                                             names[index],
                                             headers={"Referer": referer})
    end = _now()
    downloads.append((names[index], url, file_path or '', start, end))

  return downloads


# !!업데이트 공고 (-> 진행)

def notice_to_progress(nid):
  # update notices is_selected = 1
  mysql = Mysql()  # 로컬 MySQL 객체 생성
  mysql.upsert("notice_list", [{"nid": nid, "is_selected": 1}], inType="dicts")

  data = upsert_detail_by_nid(nid)

  # download files
  downs = []
  downloads = download_files_by_nid(nid)

  for i, down in enumerate(downloads):
    downs.append({
      "nid": nid,
      "sn": i,
      "file_name": down[0], 
      "file_url": down[1], 
      "down_folder": down[2].replace(down[0], '')[:-1],
      "down_start": down[3],
      "down_end": down[4],
    })

  mysql.upsert("notice_files", downs, inType="dicts")

  # Get notice info including detail_url from notice_list
  notice_info = mysql.find("notice_list", ["title", "detail_url"], f"WHERE nid = {nid}")
  if notice_info:
    title = notice_info[0][0]
    detail_url = notice_info[0][1] or ""
  else:
    title = data.get("title", f"Notice {nid}")
    detail_url = ""
  
  # upsert_my_bid_by_nid(nid)
  # !! nid가 있는 경우 update, nid가 없는 경우 insert
  mysql.upsert("my_bids", [{
    "nid": nid, 
    "title": title,
    "detail_url": detail_url,
    'status': "진행"
  }], inType="dicts")
  mysql.close()

  return 


if __name__ == "__main__":
  pass
  nid = 2392
  nid = 3229
  nid = 6224
  # _fetch_detail_by_nid(nid)
  # upsert_detail_by_nid(nid)
  notice_to_progress(nid)


  # url = 'https://www.gangnam.go.kr/notice/view.do?not_ancmt_mgt_no=60240'
  # name = '강남구'
  # required_keys = ['title']
  # _fetch_detail_by_org_name(url, name, required_keys)


  # _fetch_detail_by_org_name_requests(url, name, save_html=False)
