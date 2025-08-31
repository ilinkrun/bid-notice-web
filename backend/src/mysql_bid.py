import os, sys
import re
import pymysql
import json
from pymysql import cursors
from datetime import datetime, timezone, timedelta
from utils_mysql import Mysql, _where_like_unit, _where_eq_unit
from utils_data import arr_from_csv, dict_from_tuple, dicts_from_tuples, csv_from_dicts, csv_added_defaults, _now


## ** Global Variables
CATEGORIES = ["공사점검", "성능평가", "기타"]
SEPERATOR = "|-"  # 스크랩 요소(key,target,callback), file_name, file_url 분리자

SETTINGS_NOTICE_LIST_FIELDS = [
    "org_name", "url", "iframe", "rowXpath", "paging", "startPage", "endPage", 
    "login", "use", "org_region", "registration", "title", "detail_url", "posted_date", "posted_by"
]

SETTINGS_NOTICE_LIST_CONFIG_FIELDS = ["url", "iframe", "rowXpath", "paging", "startPage", "endPage", "login", "org_region", "registration", "use"]
SETTINGS_NOTICE_LIST_BRIEF_FIELDS = ["org_name", "url", "org_region", "registration", "use"]
SETTINGS_NOTICE_LIST_ELEMENT_FIELDS = ["title", "detail_url", "posted_date", "posted_by", "exception_path"]
SETTINGS_NOTICE_DETAIL_FIELDS = ["org_name", "title", "body_html", "file_name", "file_url", "notice_div", "notice_num", "org_dept", "org_man", "org_tel"]
SETTINGS_NOTICE_DETAIL_ELEMENT_FIELDS = ["title", "body_html", "file_name", "file_url", "notice_div", "notice_num", "org_dept", "org_man", "org_tel"]
SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS = ["title", "body_html", "file_name", "file_url", "notice_div", "notice_num", "org_dept", "org_man", "org_tel"]
SETTINGS_NOTICE_CATEGORY_FIELDS = ["sn", "keywords", "nots", "min_point", "category", "creator", "memo"]

ELEMENT_KEYS = ["key", "xpath", "callback"]

# settings_notice_list 데이터를 저장할 JSON 파일 경로
SETTINGS_NOTICE_LIST_JSON_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'settings_notice_list.json')


## SUB FUNCTIONS
def get_gap_date(day_gap=10, format='%Y-%m-%d'):
    from datetime import timezone, timedelta as td
    kst = timezone(td(hours=9))
    return (datetime.now(kst) - timedelta(days=day_gap)).strftime(format)

## ** SETTINGS(category)
#--------------------------------------------------------------------
def find_all_settings_notice_category(fields=SETTINGS_NOTICE_CATEGORY_FIELDS, addStr="WHERE `use` = 1"):
    """
    모든 키워드 설정을 가져오는 함수
    
    Returns:
        list: [{"sn": "", "keywords": "", "nots": "", "min_point": 0, "category": ""}, ...]
    """
    mysql = Mysql()  # 로컬 MySQL 객체 생성
    result = mysql.find("settings_notice_category", fields=fields, addStr=addStr)
    mysql.close()
    return dicts_from_tuples(fields, result)
    # return [{"sn": r[0], "keywords": r[1], "nots": r[2], "min_point": r[3], "category": r[4]} for r in result]


def find_settings_notice_category(category, fields=["keywords", "nots", "min_point"]):
    """
    특정 카테고리의 키워드 설정을 가져오는 함수
    
    Args:
        category (str): 카테고리명
        
    Returns:
        dict: {"keywords": "", "nots": "", "min_point": 0} 또는 None
    """
    mysql = Mysql()  # 로컬 MySQL 객체 생성
    result = mysql.find("settings_notice_category", fields=fields, addStr=f"WHERE `category`='{category}'")
    mysql.close()
    if len(result) == 0:
        return None
    r = result[0]
    return dict_from_tuple(fields, r)
    # return {"keywords": r[1], "nots": r[2], "min_point": r[3]}


def get_keyword_weight_list(keyword_weight_str):
    """
    키워드 가중치 문자열을 파싱하여 리스트로 변환하는 함수
    
    Args:
        keyword_weight_str (str): "키워드*가중치,키워드*가중치,..." 형식의 문자열
        
    Returns:
        list: [(키워드, 가중치), ...]
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


def get_search_weight(keywords, min_point=4, field="title", table_name="notice_list", add_fields=[], add_where=""):
    """
    키워드 가중치를 기반으로 notices를 검색하는 함수
    
    Args:
        keywords (str): "키워드*가중치,키워드*가중치,..." 형식의 문자열
        min_point (int): 최소 가중치 점수
        field (str): 검색할 필드명
        table_name (str): 검색할 테이블명
        add_fields (list): 추가로 가져올 필드명 리스트
        
    Returns:
        list: [{"nid": {"sn": "", "matched": "", "point": 0, ...}}, ...]
    """
    # print("get_search_weight: keywords, min_point", keywords, min_point)
    # print("get_search_weight:  add_fields, add_where", add_fields, add_where)
    mysql = Mysql()  # 로컬 MySQL 객체 생성
    
    keyword_weights = get_keyword_weight_list(keywords)
    rsts = {}
    for (keyword, weight) in keyword_weights:
        # select and append weight
        addStr = f"where `{field}` like '%{keyword}%'"
        if add_where != "":
            addStr += f" and {add_where}"
        fields = ["nid", "title"] + add_fields
        rs = []
        for r in mysql.find(table_name, fields, addStr):
            rs.append([keyword, weight] + list(r))

        for r in rs:
            nid = r[2]
            if not nid in rsts:
                rsts[nid] = {field: r[3], "matched": r[0], "point": r[1]}
                for (i, add_field) in enumerate(add_fields):
                    rsts[nid][add_field] = r[i+4]
            else:
                rsts[nid]["matched"] += f",{r[0]}"
                rsts[nid]["point"] += int(r[1])
                for (i, add_field) in enumerate(add_fields):
                    rsts[nid][add_field] = r[i+4]
    
    mysql.close()  # MySQL 연결 종료
    return [{nid: rst} for (nid, rst) in rsts.items() if rst["point"] >= int(min_point)]


def is_not_ins(not_str="", data=""):
    """
    제외 문자열이 데이터에 포함되어 있는지 확인하는 함수
    
    Args:
        not_str (str): 제외할 문자열들 (쉼표로 구분)
        data (str): 확인할 데이터
        
    Returns:
        bool: 제외 문자열이 포함되어 있으면 True, 아니면 False
    """
    for n_str in not_str.split(","):
        if n_str == "":
            continue
        if n_str.strip() in data:
            return True
    return False


def filter_by_not(not_str="", dicts=[], field="sn"):
    """
    제외 문자열을 기준으로 딕셔너리 리스트를 필터링하는 함수
    
    Args:
        not_str (str): 제외할 문자열들 (쉼표로 구분)
        dicts (list): 필터링할 딕셔너리 리스트
        field (str): 필터링 기준이 되는 필드명
        
    Returns:
        list: 필터링된 딕셔너리 리스트
    """
    # print("filter_by_not", not_str, dicts, field)
    if (not_str.strip() == ""):
        return dicts

    rsts = []
    for data in dicts:
        # for (nid, row) in data.items():
        for (nid, row) in data.items():
            if not is_not_ins(not_str, row[field]):
                rsts.append(data)

    # print("filter_by_not", rsts)
    return rsts


## ** SETTINGS(list, detail)
#--------------------------------------------------------------------
def unpack_settings_elements(settings={}):
  """
  설정 요소를 설정하는 함수
  
  Args:
    settings (dict): 설정 요소 
      syntax) {[key]: "[xpath][SEPERATOR][target][SEPERATOR][callback]"}
      ex) {"title": "td[4]/a", "detail_url": "td[4]/a|-href|-"https://www.gp.go.kr/portal/" + rst.split("/")[1]", ...}
    
  Returns:
  """
  elements = []
  for (k, v) in settings.items():
    if (v is None or v.strip() == ""):
      continue
    vs = v.split(SEPERATOR)
    xpath = vs[0].strip()
    if (xpath == ""):
      continue

    element = {"key": k, "xpath": xpath}

    if (len(vs) == 2 and vs[1].strip() != ""):
      element = {"key": k, "xpath": xpath, "target": vs[1].strip()}
    elif (len(vs) == 3 and vs[1].strip() == ""):
      element = {"key": k, "xpath": xpath, "callback": vs[2].strip()}
    elif (len(vs) == 3 and vs[1].strip() != ""):
      element = {"key": k, "xpath": xpath, "target": vs[1].strip(), "callback": vs[2].strip()}
    elements.append(element)

  return elements

def pack_settings_elements(elements):
    """
    설정 요소 리스트를 딕셔너리로 변환하는 함수
    
    Args:
        elements (list): 설정 요소 리스트
            [{'key': '키', 'xpath': 'xpath', 'target': 'target', 'callback': 'callback'}, ...]
    
    Returns:
        dict: {"키": "xpath|-target|-callback", ...}
    """
    result = {}
    for element in elements:
        key = element["key"]
        xpath = element["xpath"]
        target = element.get("target", "")
        callback = element.get("callback", "")
        
        value = xpath
        if target:
            value += f"{SEPERATOR}{target}"
        if callback:
            value += f"{SEPERATOR}{callback}"
            
        result[key] = value
        
    return result



## ** SETTINGS(list)
#--------------------------------------------------------------------
def find_settings_notice_list(fields=SETTINGS_NOTICE_LIST_BRIEF_FIELDS, addStr="WHERE `use`=1", out_type="dicts"):
  mysql = Mysql()  # 로컬 MySQL 객체 생성
  result = mysql.find("settings_notice_list", fields=fields, addStr=addStr)
  mysql.close()
  if out_type == "dicts":
    dicts = dicts_from_tuples(fields, result)
    return dicts
  elif out_type == "tuples":
    return result
  else:
    return result

def _find_settings_notice_list_by_name(name, fields=SETTINGS_NOTICE_LIST_CONFIG_FIELDS):
# def _find_settings_notice_list_by_name(name, fields=SETTINGS_NOTICE_LIST_FIELDS):
  """
  기관명으로 설정 목록을 검색하는 함수
  
  Args:
      name (str): 기관명
      fields (list): 검색할 필드명 리스트
      
  Returns:
      list: 설정 목록 리스트
  """
  try:
    mysql = Mysql()  # 로컬 MySQL 객체 생성
    result = mysql.find("settings_notice_list", fields=fields, addStr=f"WHERE `org_name`='{name}'")
    return result
  except Exception as e:
    print(f"기관명 '{name}' 설정 검색 중 오류 발생: {str(e)}")
    return []


def find_settings_notice_list_by_name(name, fields=SETTINGS_NOTICE_LIST_CONFIG_FIELDS, out_type="tuple"):
# def find_settings_notice_list_by_name(name, fields=SETTINGS_NOTICE_LIST_FIELDS, out_type="tuple"):
  # print("@@@mysql_bid: find_settings_notice_list_by_name", name, fields)
  site_config = _find_settings_notice_list_by_name(name, fields)[0]
  config = dict_from_tuple(fields, site_config)
  elements_config = {SETTINGS_NOTICE_LIST_ELEMENT_FIELDS[i]:v for (i, v) in enumerate(_find_settings_notice_list_by_name(name, fields=SETTINGS_NOTICE_LIST_ELEMENT_FIELDS)[0])}
  config["elements"] = unpack_settings_elements(elements_config)
  
  # use, org_region, registration 필드 추가
  config["use"] = site_config[fields.index("use")] if "use" in fields else None
  config["org_region"] = site_config[fields.index("org_region")] if "org_region" in fields else None
  config["registration"] = site_config[fields.index("registration")] if "registration" in fields else None
  
  if out_type == "dict":
    return config
  elif out_type == "tuple":
    return tuple([config.get(field, None) for field in fields + ["elements"]])

def add_settings_to_notice(notice, keys=['org_region', 'registration']):
    """
    공고에 해당 기관의 설정값을 추가합니다.
    
    Args:
        notice (dict): 공고 정보
        keys (list): 추가할 설정 키 리스트 (기본값: ['org_region', 'registration'])
    
    Returns:
        dict: 설정값이 추가된 공고 정보
    """
    org_name = notice.get("org_name")
    
    if org_name:
        # settings 리스트에서 org_name과 일치하는 항목 찾기
        fields=["org_name"]
        fields.extend(keys)
        # keys.append("org_name")
        settings = find_settings_notice_list(fields=fields, out_type="dicts")
        # settings = find_settings_notice_list(fields=["org_name", "org_region", "registration"], out_type="dicts")
        for setting in settings:
            if setting.get("org_name") == org_name:  # org_name이 일치하면
                # 결과에 설정 키 추가
                for key in keys:
                    notice[key] = setting.get(key, "")
                break
        else:  # 일치하는 org_name이 없으면 빈 문자열로 설정
            for key in keys:
                notice[key] = ""
    else:
        # org_name이 없으면 빈 문자열로 설정
        for key in keys:
            notice[key] = ""
    
    return notice


def _upsert_settings_notice_list(name, data):
    """
    기관명으로 설정 목록을 업데이트하는 함수
  
    Args:
        name (str): 기관명
        data (dict): 설정 데이터
      
    Returns:
        bool: 성공 여부
    """
    mysql = None
    try:
        # data에 'org_name' 키가 없으면 추가
        if 'org_name' not in data:
            data['org_name'] = name
          
        # None 값을 빈 문자열로 변환
        for key, value in data.items():
            if value is None:
                data[key] = ""
        
        # 딕셔너리를 CSV 형식으로 변환
        csv_data = csv_from_dicts([data])
        
        mysql = Mysql()
        
        # 기존 데이터가 있는지 확인
        existing_data = mysql.find("settings_notice_list", ["org_name"], f"WHERE org_name = '{name}'")
        
        if existing_data:
            # 기존 데이터가 있으면 UPDATE 실행
            update_data = {}
            for key, value in data.items():
                if key != 'org_name':  # org_name은 WHERE 조건으로 사용하므로 제외
                    update_data[key] = value
          
            # UPDATE 쿼리 실행
            mysql.update("settings_notice_list", update_data, f"org_name = '{name}'")
        else:
            # 기존 데이터가 없으면 INSERT 실행
            mysql.insert("settings_notice_list", csv_data)
        
        return True
    except Exception as e:
        print(f"설정 업데이트 중 오류 발생: {str(e)}")
        return False
    finally:
        if mysql:
            mysql.close()


def upsert_settings_notice_list(name, data):
  """
  기관명으로 설정 목록을 업데이트하는 함수 (elements 요소 포함)

  Args:
      name (str): 기관명
      data (dict): 설정 데이터 (elements 요소 포함)
      
  Returns:
      bool: 성공 여부
  """
  try:
    # data 복사본 생성
    data_copy = data.copy()
    
    # elements 요소가 있으면 처리
    if 'elements' in data_copy:
      # elements 요소 추출
      elements = data_copy.pop('elements')
      # pack_settings_elements 함수를 사용하여 elements를 딕셔너리로 변환
      elements_dict = pack_settings_elements(elements)
      
      # 변환된 elements 딕셔너리를 data_copy에 병합
      data_copy.update(elements_dict)
    
    # _upsert_settings_notice_list 함수 호출
    return _upsert_settings_notice_list(name, data_copy)
  except Exception as e:
    print(f"설정 업데이트 중 오류 발생: {str(e)}")
    return False

## ** SETTINGS(detail)
#--------------------------------------------------------------------
def find_settings_notice_detail(fields=SETTINGS_NOTICE_DETAIL_FIELDS, addStr="WHERE `use`=1", out_type="dicts"):
  mysql = Mysql()  # 로컬 MySQL 객체 생성
  result = mysql.find("settings_notice_detail", fields=fields, addStr=addStr)
  mysql.close()
  if out_type == "dicts":
    dicts = dicts_from_tuples(fields, result)
    return dicts
  elif out_type == "tuples":
    return result
  else:
    return result

def _find_settings_notice_detail_by_name(name, fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS, table_name="settings_notice_detail", out_type="tuple"):
# def _find_settings_notice_detail_by_name(name, fields=SETTINGS_NOTICE_DETAIL_FIELDS):
  """
  기관명으로 설정 목록을 검색하는 함수
  
  Args:
      name (str): 기관명
      fields (detail): 검색할 필드명 리스트
      
  Returns:
      detail: 설정 목록 리스트
  """
  try:
    mysql = Mysql()  # 로컬 MySQL 객체 생성
    result = mysql.find(table_name, fields=fields, addStr=f"WHERE `org_name`='{name}'")
    mysql.close()
    if out_type == "dict":
        if result:
            dicts = dict_from_tuple(fields, result[0])
            return dicts
        return {}
    elif out_type == "tuple":
        return result  # 전체 결과 반환 (빈 리스트일 수 있음)
  except Exception as e:
    print(f"기관명 '{name}' 설정 검색 중 오류 발생: {str(e)}")
    return []


# def find_settings_notice_detail_by_name(name, fields=SETTINGS_NOTICE_DETAIL_FIELDS, out_type="tuple"):
def find_settings_notice_detail_by_name(name, fields=SETTINGS_NOTICE_DETAIL_FIELDS, table_name="settings_notice_detail", out_type="dicts"):
  """
  기관명으로 설정 상세를 조회하는 함수 - find_settings_notice_detail 패턴 따름
  """
  mysql = Mysql()  # 로컬 MySQL 객체 생성
  result = mysql.find(table_name, fields=fields, addStr=f"WHERE `org_name`='{name}' AND `use`=1")
  mysql.close()
  
  if out_type == "dicts":
    if result:
      dicts = dicts_from_tuples(fields, result)
      return dicts
    else:
      return []  # 데이터가 없으면 빈 리스트 반환
  elif out_type == "tuples":
    return result
  else:
    return result

def detail_config_by_name(name, fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS, table_name="settings_notice_detail"):
    """
    기관명으로 상세 페이지 설정을 가져오는 함수
    
    Args:
        name (str): 기관명
        fields (list): 가져올 필드 목록
        table_name (str): 테이블 이름
        
    Returns:
        dict: 설정 정보
    """
    return find_settings_notice_detail_by_name(name, fields, table_name)

def get_detail_elements(settings):
    """
    설정에서 상세 페이지 요소를 추출하는 함수
    
    Args:
        settings (dict): 설정 정보
        
    Returns:
        dict: 상세 페이지 요소
    """
    return unpack_settings_elements(settings)

## ** NOTICES
#--------------------------------------------------------------------
def find_last_notice(name, field="title"):
  # fields = ["sn", field] if field != None else ["sn", "title"]
  mysql = Mysql()  # 로컬 MySQL 객체 생성
  rs = mysql.find("notice_list", fields=["sn", field], addStr=f"WHERE `org_name`='{name}' ORDER BY `sn` desc", limit=1)
  mysql.close()
  return rs if rs != None else (0, "제목없음")

# ** main functions
def find_notices(names, keywords):
    """
    기관명과 키워드로 notices를 검색하는 함수
    
    Args:
        names (list): 기관명 리스트
        keywords (list): 키워드 리스트
        
    Returns:
        list: 검색된 notices 리스트
    """
    mysql = Mysql()  # 로컬 MySQL 객체 생성
    nameStr = _where_like_unit(names, field="org_name", joiner="or")
    searchStr = _where_like_unit(keywords, field="title", joiner="and")

    addStr = "where "
    if nameStr == "" and searchStr == "":
        addStr = ""
    elif nameStr != "" and searchStr == "":
        addStr += nameStr
    elif nameStr == "" and searchStr != "":
        addStr += searchStr
    else:
        addStr += f"({nameStr}) and ({searchStr})"

    result = mysql.find("notice_list", ["org_region", "org_name", "title", "posted_date"], addStr)
    mysql.close()
    return result


def find_notices_for_statistics(fields=["org_name", "posted_date", "category", "created_at", "status"], renames=["orgName", "postedAt", "category", "createdAt", "status"], day_gap=5):
    """
    통계를 위한 공고 목록을 조회하고 지역 정보를 추가하는 함수
    
    Args:
        fields (list): 조회할 필드 목록
        renames (list): 반환할 때 사용할 필드명 목록
        day_gap (int): 현재 시간으로부터 몇 일 전까지의 데이터를 조회할지
        
    Returns:
        list: [{"orgName": "org_name", "region": "org_region", "postedAt": "YYYY-MM-DD", "createdAt": "YYYY-MM-DD", "category": "", "status": ""}, ...]
    """
    mysql = Mysql()
    try:
        # 기준 날짜 계산 (day_gap일 전)
        result = mysql.find("notice_list", fields=fields, 
            addStr=f"WHERE STR_TO_DATE(`posted_date`, '%Y-%m-%d') >= '{get_gap_date(day_gap)}' ORDER BY `posted_date` DESC")
        
        # settings_notice_list에서 기관별 org_region 정보 조회
        settings = dicts_from_tuples(
            ["orgName", "region"], 
            find_settings_notice_list(fields=["org_name", "org_region"], out_type="tuples")
        )
        
        # settings를 딕셔너리로 변환하여 검색 효율성 향상
        region_map = {s["orgName"]: s["region"] for s in settings}
        
        # notices 결과를 딕셔너리로 변환하고 org_region 정보 추가
        notices = []
        for row in result:
            notice = dict(zip(renames, row))
            
            # 날짜 형식 변환
            if notice.get("postedAt"):
                notice["postedAt"] = notice["postedAt"].strftime('%Y-%m-%d')
            if notice.get("createdAt"):
                notice["createdAt"] = notice["createdAt"].strftime('%Y-%m-%d')
                
            # None 값을 빈 문자열로 변환
            notice["category"] = notice.get("category", "") or ""
            if notice.get("status"):
                notice["status"] = notice["status"] or ""
                
            # orgName에 해당하는 region 정보 추가
            notice["region"] = region_map.get(notice["orgName"], "")
            notices.append(notice)
            
        return notices
        
    except Exception as e:
        print(f"통계 데이터 조회 중 오류 발생: {str(e)}")
        return []
    finally:
        mysql.close()

def search_notices(keywords, nots, min_point, field="title", add_fields=[], add_where=""):
    """
    키워드 가중치와 제외어를 사용하여 notices를 검색하는 함수
    
    Args:
        keywords (str): "키워드*가중치,키워드*가중치,..." 형식의 문자열
        nots (str): 제외할 문자열들 (쉼표로 구분)
        min_point (int): 최소 가중치 점수
        field (str): 검색할 필드명
        add_fields (list): 추가로 가져올 필드명 리스트
    Returns:
        list: 검색된 notices 리스트
    """
    dicts = get_search_weight(keywords, min_point=min_point, add_fields=add_fields, add_where=add_where)
    # print(f"search_notices keywords: {keywords} / nots: {nots} / min_point: {min_point} / field: {field} / add_fields: {add_fields} / add_where: {add_where}")
    # print(f"search_notices dicts: {dicts}")
    return filter_by_not(nots, dicts, field)


def find_notices_with_category(fields=["nid", "title", "detail_url", "posted_date", "posted_by", "org_name", "category"], add_where=""):
    """
    notices를 검색하는 함수
    
    Args:
        fields (list): 검색할 필드명 리스트
        add_where (str): 추가 WHERE 조건
        
    Returns:
        list: [{"nid": "", "title": "", "detail_url": "", "posted_date": "YYYY-mm-dd", "posted_by": "", "org_name": "", "category": ""}, ...]
    """
    mysql = Mysql()
    try:
           
        # WHERE 조건 구성
        search_str = "WHERE 1=1"
        if add_where:
            search_str += f" AND {add_where}"
            
        notices = mysql.find("notice_list", fields=fields, addStr=search_str)
        
        # 튜플 리스트를 딕셔너리 리스트로 변환
        result = []
        for notice in notices:
            notice_dict = dict(zip(fields, notice))
            
            # posted_date 형식 변환
            if notice_dict.get("posted_date"):
                try:
                    notice_dict["posted_date"] = notice_dict["posted_date"].strftime('%Y-%m-%d')
                except (AttributeError, ValueError):
                    pass
                
            result.append(notice_dict)
            
        return result
        
    except Exception as e:
        print(f"notices 검색 중 오류 발생: {str(e)}")
        return []


def find_notices_by_category(category, day_gap=2):
    """
    카테고리별로 notices를 검색하는 함수
    
    Args:
        category (str): 카테고리명('무관' 또는 카테고리명)
        day_gap (int): 현재 시간으로부터 몇 일 전까지의 notices를 검색할지 (기본값: 2일)
        
    Returns:
        list: [{"nid": "", "title": "", "detail_url": "", "posted_date": "YYYY-mm-dd", "posted_by": "", "org_name": "", "org_region": "", "registration": ""}, ...]
    """   
    mysql = Mysql()
    try:
        # 카테고리별 notices 검색
        # if category == "무관":
        #     search_str = "WHERE category IS NULL "
        # else:
        #     search_str = f"WHERE category = '{category}'"
        search_str = f"WHERE category = '{category}'"
        if day_gap > 0:
            # search_str += f" AND scraped_at >= '{datetime.now(timezone.utc) - timedelta(days=day_gap)}'"
            search_str += f" AND STR_TO_DATE(`posted_date`, '%Y-%m-%d') >= '{get_gap_date(day_gap)}' ORDER BY `posted_date` DESC"
            
        fields = ["nid", "title", "detail_url", "posted_date", "posted_by", "org_name", "category"]
        notices = mysql.find("notice_list", fields=fields, addStr=search_str)
        
        # 튜플 리스트를 딕셔너리 리스트로 변환하고 posted_date 형식 변환
        result = []
        for notice in notices:
            notice_dict = dict(zip(fields, notice))
            if notice_dict["posted_date"]:
                try:
                    # datetime.date 객체를 'YYYY-mm-dd' 형식으로 변환
                    notice_dict["posted_date"] = notice_dict["posted_date"].strftime('%Y-%m-%d')
                except (AttributeError, ValueError):
                    # 날짜 형식이 다른 경우 원본 유지
                    pass
            
            # 'org_region'과 'registration' 값 추가
            add_settings_to_notice(notice_dict)
            
            result.append(notice_dict)
            
        return result
        
    except Exception as e:
        print(f"카테고리 '{category}' notices 검색 중 오류 발생: {str(e)}")
        return []

def update_category_batch(category, delta_hours=23, start_time=None):
    """
    카테고리별로 notices를 검색하고 category 필드를 업데이트하는 함수
    
    Args:
        category (str): 카테고리명
        delta_hours (int): 현재 시간으로부터 몇 시간 전까지 검색할지 (기본값: 1시간)
        start_time (str, optional): 검색 시작 시간 (UTC). 기본값: 현재 시간 - delta_hours
    """
    # 시작 시간이 지정되지 않은 경우, 현재 시간 - delta_hours를 기본값으로 설정
    if start_time is None:
        kst = timezone(timedelta(hours=9))
        start_time = (datetime.now(kst) - timedelta(hours=delta_hours)).strftime('%Y-%m-%d %H:%M:%S')
    
    # 카테고리별 키워드 설정 가져오기
    keywords = find_settings_notice_category(category)
    if keywords is None:
        print(f"카테고리 '{category}'에 대한 키워드 설정이 없습니다.")
        return
        
    # notices 검색
    mysql = Mysql()
    try:
        # scraped_at이 start_time 이후인 notices 검색
        search_str = f"WHERE scraped_at >= '{start_time}' AND category IS NULL"
        notices = mysql.find("notice_list", fields=["nid", "title"], addStr=search_str)
        print(f"해당 {category} notices: {len(notices)}")
        
        if not notices:
            print(f"'{start_time}' 이후의 notices가 없습니다.")
            return
            
        # 카테고리에 해당하는 notices 검색
        matched_notices = search_notices(
            keywords["keywords"],
            keywords["nots"],
            keywords["min_point"],
            add_fields=["nid"],
            add_where=f"scraped_at >= '{start_time}' AND category IS NULL"
        )
        
        if not matched_notices:
            print(f"카테고리 '{category}'에 해당하는 notices가 없습니다.")
            return
            
        # 검색된 notices에 대해 category 업데이트
        for notice in matched_notices:
            for nid, data in notice.items():
                mysql.update("notice_list", {"category": category, "status": "준비"}, f"nid = {nid}")

        print(f"카테고리 '{category}'에 대한 category 업데이트 완료: {len(matched_notices)}개")

    except Exception as e:
        print(f"category 업데이트 중 오류 발생: {str(e)}")


def update_all_category(delta_hours=23, start_time=None):
    """
    모든 카테고리에 대해 category 업데이트를 수행하는 함수

    Args:
        categories (list): 카테고리명 리스트 (사용하지 않음, 모든 카테고리에 대해 업데이트)
        delta_hours (int): 현재 시간으로부터 몇 시간 전까지 검색할지 (기본값: 23시간)
        start_time (str, optional): 검색 시작 시간 (UTC). 기본값: 현재 시간 - delta_hours
    """
    # categories = CATEGORIES
    # categories = ["공사점검", "성능평가"]
    mysql = Mysql()
    try:
        for category in CATEGORIES:
            print(f"\n카테고리 '{category}' 업데이트 시작...")
            update_category_batch(category, delta_hours=delta_hours, start_time=start_time)
     
    except Exception as e:
        print(f"전체 category 업데이트 중 오류 발생: {str(e)}")


def upsert_notices(data):
    """
    여러 공고를 업데이트하는 함수
    
    Args:
        data (list): 업데이트할 데이터 리스트 [{nid: xxx, ...}, ...]
    """
    mysql = Mysql()
    try:
        print(f'upsert_notices data: {data}')
        # 전체 데이터를 한 번에 업데이트
        mysql.upsert("notice_list", data, inType="dicts")
        print(f"{len(data)}개의 공고가 업데이트되었습니다.")
    except Exception as e:
        print(f"공고 업데이트 중 오류 발생: {str(e)}")
    finally:
        mysql.close()

def update_notices_status(data):
    # data = [{"nid": 406810, "status": "준비", "title": "테스트 공고"}, ...]
    mysql = Mysql()
    for item in data:
        # status가 변경되었는지 확인( 변경되지 않았다면 continue)
        # if mysql.find("notice_list", {"status": item["status"]}, f"WHERE nid = {item['nid']}"):
        #     continue
        # rs = mysql.find("notice_list", ["status"], f"WHERE nid = {item['nid']}")[0][0]
        # print(f"rs: {rs}")
        # if rs == item["status"]:
        #     continue

        mysql.update("notice_list", {"status": item["status"]}, f"nid = {item['nid']}")
        if item["status"] == "관심":
            pass
            # mysql.update("notice_list", {"status": item["status"]}, f"nid = {item['nid']}")
        else:
            data = {}
            data["nid"] = item["nid"]
            data["status"] = item["status"]
            data["title"] = item["title"] or "공고 제목"
            data["created_at"] = _now()
            data["started_at"] = _now()
            data["memo"] = "테스트 중입니다."
            print(f"upsert_bids: {data}")
            upsert_bids([data])
    mysql.close()

# details
def find_details_by_status(status, fields=["nid", "status", "title", "scraped_at"], addStr=""):
    mysql = Mysql()
    details = mysql.find("notice_details", fields=fields, addStr=f"WHERE status = '{status}' {addStr}")
    mysql.close()
    return dicts_from_tuples(fields, details)

## ** bids
#--------------------------------------------------------------------
def find_notice_by_nid(nid, fields=["org_name", "category", "status", "posted_date"], out_type="dict"):
    mysql = Mysql()
    rs = mysql.find("notice_list", fields, f"WHERE nid = {nid}")
    mysql.close()
    if not rs:
        return None
    if out_type == "dict":
        return dict(zip(fields, rs[0]))
    else:
        return rs[0]

def find_bids(fields=["bid", "nid", "status", "title", "started_at", "ended_at", "detail", "memo"], addStr=""):
    mysql = Mysql()
    bids = mysql.find("bids", fields=fields, addStr=addStr)
    mysql.close()
    dicts = [dict(zip(fields, bid)) for bid in bids]
    settings = find_settings_notice_list(fields=["org_name", "org_region"], out_type="dicts")
    for bid in dicts:
        notice = find_notice_by_nid(bid["nid"])
        if notice:
            bid.update(notice)
            bid["org_region"] = ""
            for setting in settings:
                if setting.get("org_name") == bid["org_name"]:  # org_name이 일치하면
                    bid["org_region"] = setting.get("org_region", "")
                    break
    return dicts


def find_bids_by_status(status, fields=["bid", "nid", "status", "title", "started_at", "ended_at", "detail", "memo"], addStr=""):
    dicts = find_bids(fields=fields, addStr=f"WHERE status = '{status}' {addStr}")
    return dicts


def upsert_bids(data):
    mysql = Mysql()
    mysql.upsert("bids", data, inType="dicts")
    mysql.close()




## ** logs, errors
#--------------------------------------------------------------------
def insert_all_logs(logs):
  """
  여러 로그를 한 번에 데이터베이스에 삽입
  
  Args:
    logs (list): 로그 객체 리스트
  """
  if not logs:
    return
    
  mysql = Mysql()
  try:
    for log in logs:
      error_code = None
      error_message = None
      
      if log.get("error"):
        error_code = log["error"].get("error_code")
        error_message = log["error"].get("error_message")
      
      # SQL 쿼리 문자열 직접 구성
      sql = f"""
      INSERT INTO logs_notice_scraping (org_name, error_code, error_message, scraped_count, inserted_count, time)
      VALUES ('{log["org_name"]}', {error_code if error_code is not None else 'NULL'}, 
      '{error_message.replace("'", "''") if error_message else ''}', 
      {log["scraped_count"]}, {log["inserted_count"]}, '{log["time"]}')
      """
      
      mysql.exec(sql)
      
    print(f"{len(logs)}개의 로그가 저장되었습니다.")
  except Exception as e:
    print(f"로그 저장 중 오류 발생: {e}")
  finally:
    mysql.close()


def insert_all_errors(errors):
  """
  에러 정보를 데이터베이스에 삽입
  
  Args:
    errors (dict): 에러 정보 객체
  """
#   if not errors or not errors["orgs"]:
  if not errors:
    return

  mysql = Mysql()
  try:
    # SQL 쿼리 문자열 직접 구성
    sql = f"""
    INSERT INTO errors_notice_scraping (orgs, time)
    VALUES ('{errors["orgs"]}', '{errors["time"]}')
    """
    
    mysql.exec(sql)
    print("에러 정보가 저장되었습니다.")
  except Exception as e:
    print(f"에러 정보 저장 중 오류 발생: {e}")
  finally:
    mysql.close()


def find_logs_notice_scraping(day_gap=15, out_type="dicts"):
  """
  day_gap일 전부터 현재까지의 로그를 조회하는 함수
  """
  mysql = Mysql()
  fields=["org_name", "error_code", "error_message", "scraped_count", "inserted_count", "time"]
  kst = timezone(timedelta(hours=9))
  logs = mysql.find("logs_notice_scraping", fields=fields, addStr=f"WHERE time >= '{datetime.now(kst) - timedelta(days=day_gap)}' ORDER BY time DESC")
  mysql.close()
  if out_type == "dicts":
    return [dict(zip(fields, log)) for log in logs]
  else:
    return logs

def find_errors_notice_scraping(day_gap=15, out_type="dicts"):
  """
  day_gap일 전부터 현재까지의 에러를 조회하는 함수
  """
  mysql = Mysql()
  fields=["orgs", "time"]
  kst = timezone(timedelta(hours=9))
  errors = mysql.find("errors_notice_scraping", fields=fields, addStr=f"WHERE time >= '{datetime.now(kst) - timedelta(days=day_gap)}' ORDER BY time DESC")
  mysql.close()
  if out_type == "dicts":
    return [dict(zip(fields, error)) for error in errors]
  else:
    return errors

## ** settings_nas_folder
#--------------------------------------------------------------------


## ** DATABASE
#--------------------------------------------------------------------
def delete_old_notices(day_gap=15, condition="category IS NULL"):
    """
    오래된 notices를 삭제하는 함수(category가 NULL이고 scraped_at이 day_gap일 전인 notices)
    
    Args:
        day_gap (int): 현재 시간으로부터 몇 일 전까지의 notices를 삭제할지 (기본값: 15일)
    """
    mysql = Mysql()
    kst = timezone(timedelta(hours=9))
    mysql.delete("notice_list", f"{condition} AND scraped_at < '{datetime.now(kst) - timedelta(days=day_gap)}'")
    mysql.close()


def backup_db():
    """
    MySQL Bid 데이터베이스 전체를 백업하는 함수
    
    백업 파일은 /home/MoonDev/backup.sql에 저장됩니다.
    """
    # 백업 파일 경로 설정
    backup_dir = "/home/MoonDev/backups/data"
    backup_file = os.path.join(backup_dir, "backup.sql")

    # MySQL 연결
    mysql = Mysql()
    try:
        # 백업할 테이블 목록
        tables = ["notice_list", "settings_notice_list", "settings_notice_detail", "settings_notice_category", "logs_notice_scraping", "errors_notice_scraping"]
        
        with open(backup_file, 'w', encoding='utf-8') as f:
            # 헤더 추가
            f.write(f"-- MySQL Backup\n")
            f.write(f"-- Date: {_now()}\n")
            f.write(f"-- Database: Bid\n\n")
            
            # 각 테이블별로 백업
            for table in tables:
                # 테이블 구조 백업
                f.write(f"\n-- Table structure for table `{table}`\n")
                create_table = mysql.find("SHOW CREATE TABLE " + table)[0][1]
                f.write(f"{create_table};\n\n")
                
                # 테이블 데이터 백업
                f.write(f"-- Dumping data for table `{table}`\n")
                rows = mysql.find(table)
                if rows:
                    for row in rows:
                        # NULL 값 처리
                        values = []
                        for value in row:
                            if value is None:
                                values.append('NULL')
                            elif isinstance(value, str):
                                # 문자열 이스케이프 처리
                                value = value.replace("'", "''")
                                values.append(f"'{value}'")
                            else:
                                values.append(str(value))
                        
                        # INSERT 문 생성
                        f.write(f"INSERT INTO `{table}` VALUES ({', '.join(values)});\n")
                    f.write("\n")
        
        print(f"데이터베이스 백업이 완료되었습니다: {backup_file}")
        
    except Exception as e:
        print(f"백업 중 오류 발생: {str(e)}")


# ** test
#--------------------------------------------------------------------
def get_notices_gap(gap=3):
    """
    특정 카테고리의 공고 목록을 반환합니다.
    """
    result = find_notices_with_category(add_where=f"`posted_date` >= DATE_SUB(NOW(), INTERVAL {gap} DAY)")

    # 각 row의 org_name에 해당하는 'org_region', 'registration' 필드값을 가져오기
    for item in result:
        add_settings_to_notice(item)
    
    return result

if __name__ == "__main__":
    pass
    # print(find_settings_notice_detail(addStr="", out_type="dicts"))
    # print(find_settings_notice_detail_by_name(name="강화군청"))
    category = "무관"
    print(find_notices_by_category(category, day_gap=15))
    # print(find_details_by_status("진행"))
    # print(find_details_by_status("제외"))
    # name = "강화군청"
    # print(find_settings_notice_detail_by_name(name))