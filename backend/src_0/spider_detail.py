import re
import urllib
from utils_data import valid_str, fix_encoding, decode_html_text
from utils_mysql import Mysql, _where_like_unit, _where_eq_unit
from mysql_bid import SEPERATOR, SETTINGS_NOTICE_DETAIL_FIELDS, SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS, find_settings_list, _find_settings_detail_by_name, find_settings_detail_by_name, unpack_settings_elements, upsert_notices
from utils_lxml import _get_outerhtml, get_val, get_dict, download_by_url, download_by_url_with_headers
from utils_nas import get_notice_nas_folder

import requests
from playwright.sync_api import Playwright, sync_playwright
from utils_data import fix_encoding_response
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
import html
import codecs
import time
import os


# DATAFOLER = "../../../data/"

# * populate
# -----------------------------------------------------------
def get_sample_url():
    pass

def populate_settings_detail():
    orgs = find_settings_list(fields=["기관명", "use"], addStr="WHERE 1=1", out_type="dicts")
    for org in orgs:
        # old detail
        old = _find_settings_detail_by_name(org["기관명"], fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS, table_name="settings_detail_old", out_type="dict")
        if not old:
            org |= {key: "" for key in SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS}
        else:
            org |= old
    
    mysql = Mysql()  # 로컬 MySQL 객체 생성
    mysql.upsert("settings_detail", orgs, inType="dicts")
    mysql.close()
    return orgs

def update_all_sample_urls(org_names=[]):
    data = []
    if not org_names:
        org_names = [org[0] for org in find_settings_list(fields=["기관명"], addStr="WHERE 1=1", out_type="tuples")]
    mysql = Mysql()  # 로컬 MySQL 객체 생성
    for org_name in org_names:
        sample_url = ""
        find1 = mysql.find("notices", ["상세페이지주소"], addStr=f"WHERE `기관명` = '{org_name}' ORDER BY nid DESC LIMIT 1")
        if find1:
            sample_url = find1[0][0]
        data.append({"기관명": org_name, "sample_url": sample_url})

    mysql.upsert("settings_detail", data, inType="dicts")
    mysql.close()

def get_nid_by_sample_url(sample_url="https://notexist.com"):
    mysql = Mysql()  # 로컬 MySQL 객체 생성

    nid = 0
    find1 = mysql.find("notices", ["nid"], addStr=f"WHERE `상세페이지주소` = '{sample_url}' ORDER BY nid DESC LIMIT 1")
    mysql.close()
    if find1:
        nid = find1[0][0]
    return nid

def get_all_nids():
    orgs = find_settings_list(fields=["기관명", "use"], addStr="WHERE `use` = 1", out_type="dicts")
    nids = []
    error_orgs = []
    mysql = Mysql()  # 로컬 MySQL 객체 생성
    for org in orgs:
        # old detail
        settings = _find_settings_detail_by_name(org["기관명"], fields=["sample_url"], table_name="settings_detail", out_type="dict")
        sample_url = settings["sample_url"]
        nid = 0
        find1 = mysql.find("notices", ["nid"], addStr=f"WHERE `상세페이지주소` = '{sample_url}' ORDER BY nid DESC LIMIT 1")
        if find1:
            nid = find1[0][0]
            nids.append(nid)
        if not nid:  # sample_url에 해당하는 nid가 없는 경우
            error_orgs.append(org["기관명"])
        else:
            pass
    mysql.close()
    return {"nids": nids, "error_orgs": error_orgs}

def populate_details_by_sample_url(nids=[]):
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
        find1 = mysql.find("notices", ["상세페이지주소", "기관명"], addStr=f"WHERE `nid` = '{nid}' ORDER BY nid DESC LIMIT 1")
        if find1:
            data = {"nid": nid, "상세페이지주소": find1[0][0], "기관명": find1[0][1]}
            print(data)
            mysql.upsert("details", [data], inType="dicts")
    mysql.close()
    print(nids)

# * sub function
# -----------------------------------------------------------
def url_quote(url):
    return urllib.parse.quote(url).replace("%3F", "?").replace("%3D", "=").replace("%26", "&")


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

    return rst.split("?")[0] + "?user_file_nm=" + user_file_nm + "&sys_file_nm=" + sys_file_nm + "&file_path" + file_path


def _file_url_js(rst, base_url):
    """파일 주소 반환
    """
    return f"{base_url}/emwp/jsp/ofr/FileDown.jsp?user_file_nm=" + rst.split("'")[1] + "&sys_file_nm=" + rst.split("'")[3] + "&file_path=" + rst.split("'")[5]

def _file_new_js(rst, base_url):
    """파일 주소 반환
    """
    return encode_down_url(f"{base_url}/emwp/jsp/ofr/FileDownNew.jsp?user_file_nm=", rst.split("'")[1], rst.split("'")[3], rst.split("'")[5])

def _file_new_js2(rst, base_url):
    """파일 주소 반환
    국가철도공단 !! 다운로드시 파일 이름 한글 깨짐
    """
    return encode_down_url2(f"{base_url}/common/FileDown.do?atchFileId=", rst.split("'")[1], rst.split("'")[3], rst.split("'")[5])

def _file_new_js3(rst, base_url):
    """파일 주소 반환
    서울특별시강남서초교육지원청 
    """
    return encode_down_url3(f"{base_url}/CMS/fileDownload.do?orifileName=", rst.split("'")[3], rst.split("'")[5])

# http://gnscedu.sen.go.kr/CMS/fileDownload.do

# fileName: 학교시설사업 시행계획 변경승인에 대한 의견조회 공고 전문(중대부고).pdf
# orifileName: 학교시설사업 시행계획 변경승인에 대한 의견조회 공고 전문(중대부고).pdf
# subPath: /CMS/openedu/openedu02/openedu0201/__icsFiles/afieldfile/2025/04/21/

def _file_name_jodal(el_str):
    # alt 속성에서 파일 이름 추출
    import re
    file_name = re.search(r'alt="([^"]*)"', el_str).group(1) if re.search(r'alt="([^"]*)"', el_str) else 'nonamed'
    src_pattern = re.search(r'/([^/]*?)\.jpg', el_str).group(1)  if re.search(r'/([^/]*?)\.jpg', el_str) else 'hwpx'
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
            # print(f"**파일주소 callback: |{callback}|, rst: |{rst}|")
            rst = eval(callback)
        # file_urls.append(unquote(rst.strip()))
        # print(f"!!!!!!!!!!!!!!!!file_url {rst}")
        file_urls.append(rst.strip())
    # print(f"!!!!!!!!!!!!!!!!file_urls {file_urls}")
    return SEPERATOR.join(file_urls)


def _cb_on_key_file_name(root, xpath, target, callback):
    print(f"root, xpath, target, callback: |{root}|, |{xpath}|, |{target}|, |{callback}|")
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
            # print(f"**파일이름 callback: |{callback}|, rst: |{rst}|")
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
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


def _fetch_html_by_playwright(url, timeout=30000, wait_for_selector=None, scroll=True):
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
            browser = playwright.chromium.launch(headless=True)
            
            # 새 페이지 컨텍스트 생성
            context = browser.new_context(
                viewport={"width": 1280, "height": 800},
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


def _fetch_detail_by_name_requests(url, name, save_html=False):
    settings = _find_settings_detail_by_name(name, fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS, table_name="settings_detail", out_type="dict")
    # print(f"======settings: {settings}")
    html = _fetch_html_by_requests(url)

    if len(html) < 10:
        return {}
    
    # print(html)
    if save_html:
        with open(f"./downloads/{name}.html", 'w', encoding='utf-8') as file:
            file.write(html)
    # cb_on_key = {"파일주소": _cb_on_key_file_url}
    cb_on_key = {"파일주소": _cb_on_key_file_url, "파일이름": _cb_on_key_file_name}

    return get_dict(html, unpack_settings_elements(settings), cb_on_key)


# def _fetch_detail_by_name_playwright(url, name, wait_for_selector=None):
def _fetch_detail_by_name_playwright(url, name, required_keys=["제목"], save_html=False):
    """
    Playwright를 사용하여 상세 페이지 정보를 스크래핑하는 함수
    
    Args:
        url (str): 스크래핑할 URL
        name (str): 기관명
        wait_for_selector (str, optional): 기다릴 셀렉터
        
    Returns:
        dict: 스크래핑된 상세 정보
    """
    settings = _find_settings_detail_by_name(name, fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS, table_name="settings_detail", out_type="dict")
    # print(f"======settings: {settings}")
    wait_for_selector = None
    if len(required_keys) > 0:
        wait_for_selector = settings[required_keys[-1]].split(SEPERATOR)[0]

    # Playwright를 사용하여 HTML 가져오기
    html = _fetch_html_by_playwright(url, wait_for_selector=wait_for_selector)

    if save_html:
        # 다운로드 디렉토리 생성
        os.makedirs("./downloads", exist_ok=True)    
        # HTML 저장 (디버깅용)
        with open(f"./downloads/{name}_playwright.html", 'w', encoding='utf-8') as file:
            file.write(html)
    
    # # 콜백 함수 설정
    # cb_on_key = {"파일주소": _cb_on_key_file_url, "파일이름": _cb_on_key_file_name}
    cb_on_key = {"파일주소": _cb_on_key_file_url, "파일이름": _cb_on_key_file_name}

    return get_dict(html, unpack_settings_elements(settings), cb_on_key)
    
    # # HTML 파싱하여 데이터 추출
    # return get_dict(html, unpack_settings_elements(settings), cb_on_key)


def _fetch_detail_by_name(url, name, required_keys=["제목"]):
    # !! wait_for_selector 추가 필요
    data = _fetch_detail_by_name_requests(url, name)
    for key in required_keys:
        if not key in data or len(data[key]) < 4:
            print(f"@@@ =[{name}]= fetch by PLAYWRIGHT")
            return _fetch_detail_by_name_playwright(url, name, required_keys)
    print(f"@@@ =[{name}]= fetch by REQUESTS")

    # 상세페이지주소, 기관명
    data["상세페이지주소"] = url
    data["기관명"] = name
    return data


def _fetch_detail_by_nid(nid, required_keys=["제목"]):
    # 417236
    mysql = Mysql()  # 로컬 MySQL 객체 생성
    fields = ["상세페이지주소", "기관명", "created_at", "작성일", "작성자", "category", "status"]
    # fields = ["상세페이지주소", "기관명", "created_at", "작성일", "작성자", "category", "status"]
    # fields = ["상세페이지주소", "기관명"]
    find1 = mysql.find("notices", fields, addStr=f"WHERE `nid` = '{nid}'")
    mysql.close()
    if find1:
        url = find1[0][0]
        name = find1[0][1]
        
        # find1[0]의 값을 dict로 생성
        db_data = {
            "created_at": find1[0][2] if len(find1[0]) > 2 else None,
            "작성일": find1[0][3] if len(find1[0]) > 3 else None,
            "작성자": find1[0][4] if len(find1[0]) > 4 else None,
            "category": find1[0][5] if len(find1[0]) > 5 else None,
            "status": find1[0][6] if len(find1[0]) > 6 else None
        }
        
        # _fetch_detail_by_name의 결과를 가져와서 db_data와 합침
        detail_result = _fetch_detail_by_name(url, name, required_keys)
        
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
        if data.get("작성일") and hasattr(data["작성일"], "strftime"):
            data["작성일"] = data["작성일"].strftime("%Y-%m-%d")
            
        # None 값들을 빈 문자열로 변환 (필요한 경우)
        for key in ["category", "status", "작성자"]:
            if data.get(key) is None:
                data[key] = ""
        
        mysql = Mysql()  # 로컬 MySQL 객체 생성
        mysql.upsert("details", [data], inType="dicts")
        mysql.close()
        
    return data


def download_by_nid(nid, folder=""):
    if not folder:
        folder = get_notice_nas_folder(nid)
    
    # print(folder)

    mysql = Mysql()  # 로컬 MySQL 객체 생성
    # !! details에 "상세페이지주소" 추가, Referer로 사용
    find1 = mysql.find("details", ["파일주소", "파일이름"], addStr=f"WHERE `nid` = '{nid}'")
    find2 = mysql.find("notices", ["상세페이지주소"], addStr=f"WHERE `nid` = '{nid}'")
    mysql.close()

    print(f"{find1=} {find2=}")

    if not find1:
        return

    (urlStr, nameStr) = find1[0]
    referer = find2[0][0]
    urls = urlStr.split(SEPERATOR)
    names = nameStr.split(SEPERATOR)
    # print(urls, names, referer)

    for (index, url) in enumerate(urls):
        print(f"index, url name: {index}, {url}, {names[index]}")
        print(f"{folder=}")
        # download_by_url(url, folder, names[index])
        download_by_url_with_headers(url, folder, names[index], headers={"Referer": referer})


# !!업데이트 공고 (제외 -> 진행)
def notice_status_to_progress(nid):
    # update_notice_bid(nid)  # notices status 변경
    upsert_detail_by_nid(nid)
    # create_notice_bid(nid)
    download_by_nid(nid)

# !!업데이트 공고 상태 (제외 -> 진행)
def update_notice_status(data):
    # notices status 변경
    upsert_notices([{'nid': data['nid'], 'status': data['to']}])
    if data['to'] == "진행" or data['to'] == "포함" or data['to'] == "준비":
        # insert info to details 
        upsert_detail_by_nid(data['nid'])
        # insert info to notices_progress
        # insert_progress_notice()
        download_by_nid(data['nid'])
    elif data['to'] == "낙찰":
        pass

# TEST
def test_save_file(nid=536548, file_name="test.txt"):
    dir_name = get_notice_nas_folder(nid)
    os.makedirs(dir_name, exist_ok=True)
    with open(f"{dir_name}/{file_name}", "w") as file:
        file.write("testing....")

if __name__ == "__main__":
    pass
    # test_save_file()
    # nid = 537939 # 537950
    # data = {'nid': nid, 'from': '제외', 'to': '진행'}
    # update_notice_status(data)
    data = {
        "nid": 537943, 
        "from": "제외", 
        "to": "진행"
    }
    update_notice_status(data)

    # upsert_detail_by_nid(nid)

    # upsert_detail_by_nid(nid)
    # print(_fetch_detail_by_nid(nid, required_keys=["제목"]))
    # download_by_nid(nid, folder="")
    # test_download_file()
    # 테스트 코드
    # url = "https://seobu.ice.go.kr/bseobu/read.aspx?board_idx=150901&board_code=4644&g1="
    # name = "인천광역시서부교육지원청"
    
    # requests 버전 테스트
    # result = _fetch_detail_by_name_requests(url, name)
    # print("Requests 결과:", result)
    
    # # playwright 버전 테스트
    # # url = "https://www.kamco.or.kr/portal/bbs/view.do?mId=0701020000&ptIdx=480&bIdx=22206"
    # # name = "한국자산관리공사"
    # url = "https://www.pps.go.kr/kor/bbs/view.do?key=00641&bbsSn=2504210033"
    # name = "조달청"
    # # url = "https://seobu.ice.go.kr/bseobu/read.aspx?board_idx=150901&board_code=4644&g1="
    # # name = "인천광역시서부교육지원청"
    # # @@@ =[한국공항공사]= fetch by PLAYWRIGHT
    # # Playwright 결과: {'제목': '"전방향표지시설(VOR/DME) 현대화사업 감리용역" 업무여유도 자료', '본문': '<p class="view_txt"/>', '파일이름': '업무여유도 평가 관련 자료.hwp [64KB]', '파일주소': '<a href="#;" title="" data-boardseq="110" data-siteno="2" data-bbsseq="3553674" data-fileseq="1" onclick="fileDown(this);">업무여유도 평가 관련 자료.hwp [64KB]</a>', '담당부서': '작성자 자산계약부'}
    
    # # url = "https://www.kogas.or.kr/site/koGas/bbs/View.do?cbIdx=6&Key=1010201000000&pageOffset=0&boardIdx=46402"
    # # name = "한국가스공사"
    # result_pw = _fetch_detail_by_name(url, name)
    # # result_pw = _fetch_detail_by_name_playwright(url, name)
    # print("fetch 결과:", result_pw)

    # * download 테스트
    # nid = 417362  # 서대문구(한글 파일이름)
    # nid = 411701  # 파일 여러개
    # download_by_nid(nid, folder="/nas/homes/24_공사점검/3 . 용역 입찰공고/[일맥] 04. 우정사업본부/1.서울가락본동우체국 건립공사 정기안전점검 수행기관 지정 공고 (38 마감)/01 입찰자료/")

    # * 기타
    # settings = _find_settings_detail_by_name("가평군청", fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS, table_name="settings_detail", out_type="dict")
    # print(settings)

    # print(get_nid_by_sample_url(sample_url="https://www.gp.go.kr/portal/selectGosiData.do?key=2148&not_ancmt_mgt_no=50107&not_ancmt_se_code=01"))
    # print(get_all_nids())

    # # 인천광역시동부교육지원청: settings_detail 설정 맞는지 확인
    # # 정부청사관리본부: 스크랩되고 있는지 확인, 상세페이지주소 맞는지 확인
    # # 한국가스공사: 스크랩 되고 있는지 확인

    # ** details 샘플 채우기
    # nids = []
    # nids = [417973, 417989, 417522, 413711, 415404, 409677, 416263]
    # populate_details_by_sample_url(nids)

    # [417236, 417973, 417980, 417977, 417988, 417981, 417989, 417267, 412579, 417999, 418008, 418000, 419901, 415985, 417291, 417290, 418058, 418054, 366205, 418060, 418065, 418064, 418076, 418071, 418091, 418082, 417351, 417343, 418101, 417362, 418103, 418102, 418104, 414840, 413690, 365679, 416136, 365639, 410342, 412802, 417417, 418114, 418120, 418119, 418544, 418126, 417440, 418129, 418133, 417449, 418142, 418139, 417475, 418143, 417508, 418162, 418514, 418164, 418166, 364717, 409333, 417522, 417524, 416260, 416264, 416263, 418171, 416267, 417565, 417562, 416320, 417576, 417595, 418175, 418178, 418930, 418478, 413711, 417905, 417903, 409597, 418480, 418485, 418483, 418486, 411684, 417931, 413700, 418498, 418488, 418501, 411701, 409677, 412382, 417962, 418504, 417968]

    # 파일 다운로드 = 0 : 광주시청, 남양주시청, 서대문구, 인천광역시서부교육지원청, 중랑구, 충청남도개발공사, 한국가스공사, 한국자산관리공사

    # !!! detail 파일이름/파일주소 에러 수정 필요(settings_detail)
    # 417973 강남구: 에러 수정
    # 417989 계룡시청: 파일이름 '다운로드' 제거 rst.replace('다운로드','').strip()
    # 417522 인천광역시교육청: 파일이름 '다운로드' 제거 rst.replace('다운로드','').strip()
    # 인천광역시남부교육지원청 417524: [평생교육건강과-5371 (첨부) 경기도고양교육지원청 평생교육건강과] 과태료 체납자 재산 압류 사실 통지 공시송달 공고문_2025. 4. 23..pdf
    # 413711 정부청사관리본부: |-정부세종청사 3단계 구내식당 신규 관리위탁업체 선정 결과 알림.pdf
    # 중구 409597: 토지거래계약  허가사항(2025.4.14.)-등재.hwp

    # !!!!
    # 조달청: 기간제근로자(설계적정성검토-건축) 채용 서류전형 합격자 및 면접시험 안내 공고(제2025-160호)  !! 'file.jpg' => 'hwpx', 'pdf.jpg' => 'pdf'
    # 415404 조달청 조달품질원 공무직근로자 (비서) 공개경쟁 채용 최종 합격자 및 채용후보자 등록 안내(조달품질원 공고 제2025-12호)
    # https://www.pps.go.kr/kor/bbs/view.do?key=00641&bbsSn=2504230004

    # 409677 한국공항공사: <a href="#;" title="" data-boardseq="110" data-siteno="2" data-bbsseq="3553674" data-fileseq="1" onclick="fileDown(this);">업무여유도 평가 관련 자료.hwp [64KB]</a>
    # 416263 !! 인천광역시서부교육지원청: 공유재산 대부료(연체료 포함) 및 변상금 미납금 납부 독촉 공시송달 공고문.hwp (69.5 Kbyte) "(".join(rst.split("(")[:-1])
    # '파일주소': "javascript:__doPostBack('ctl00$ctl00$cpmain$cpsub$uc_basic_read$ListViewFile$ctrl0$LinkButtonFile','')", '상세페이지주소': 'https://seobu.ice.go.kr/bseobu/read.aspx?board_idx=150901&board_code=4644&g1='

    # update_all_orgs_url()
