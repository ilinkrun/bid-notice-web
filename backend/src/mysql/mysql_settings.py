import os
import sys
import re
import pymysql
import json
from pymysql import cursors
from datetime import datetime, timezone, timedelta
from utils.utils_mysql import Mysql, _where_like_unit, _where_eq_unit
from utils.utils_data import arr_from_csv, dict_from_tuple, dicts_from_tuples, csv_from_dicts, csv_added_defaults, _now

# ** Global Variables for Settings
CATEGORIES = ["공사점검", "성능평가", "기타"]
SEPERATOR = "|-"  # 스크랩 요소(key,target,callback), file_name, file_url 분리자

SETTINGS_NOTICE_LIST_FIELDS = [
    "oid", "org_name", "url", "iframe", "rowXpath", "paging", "startPage", "endPage",
    "login", "use", "org_region", "registration", "title", "detail_url",
    "posted_date", "posted_by", "company_in_charge", "org_man", "exception_row"
]

SETTINGS_NOTICE_LIST_CONFIG_FIELDS = [
    "oid", "org_name", "url", "iframe", "rowXpath", "paging", "startPage", "endPage", "login",
    "org_region", "registration", "use", "company_in_charge", "org_man", "exception_row"
]
SETTINGS_NOTICE_LIST_BRIEF_FIELDS = [
    "oid", "org_name", "url", "org_region", "registration", "use", "company_in_charge"
]
SETTINGS_NOTICE_LIST_ELEMENT_FIELDS = [
    "title", "detail_url", "posted_date", "posted_by"
]
SETTINGS_NOTICE_DETAIL_FIELDS = [
    "oid", "org_name", "title", "body_html", "file_name", "file_url", "preview",
    "notice_div", "notice_num", "org_dept", "org_man", "org_tel", "use", 
    "sample_url", "down"
]
SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS = [
    "oid", "org_name", "use", "sample_url", "down"
]
SETTINGS_NOTICE_DETAIL_ELEMENT_FIELDS = [
    "title", "body_html", "file_name", "file_url", "preview", "notice_div", 
    "notice_num", "org_dept", "org_man", "org_tel"
]
SETTINGS_NOTICE_CATEGORY_FIELDS = [
    "sn", "keywords", "nots", "min_point", "category", "creator", "memo"
]

ELEMENT_KEYS = ["key", "xpath", "callback"]

# settings_notice_list 데이터를 저장할 JSON 파일 경로
SETTINGS_NOTICE_LIST_JSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data',
    'settings_notice_list.json')


# ** SETTINGS(category)
# --------------------------------------------------------------------
def find_all_settings_notice_category(fields=SETTINGS_NOTICE_CATEGORY_FIELDS,
                                      addStr="WHERE `use` = 1"):
  """
  모든 키워드 설정을 가져오는 함수

  Returns:
      list: [{"sn": "", "keywords": "", "nots": "", "min_point": 0, "category": ""}, ...]
  """
  mysql = Mysql()  # 로컬 MySQL 객체 생성
  result = mysql.find("settings_notice_category", fields=fields, addStr=addStr)
  mysql.close()
  return dicts_from_tuples(fields, result)


def find_settings_notice_category(category,
                                  fields=["keywords", "nots", "min_point"]):
  """
  특정 카테고리의 키워드 설정을 가져오는 함수

  Args:
      category (str): 카테고리명

  Returns:
      dict: {"keywords": "", "nots": "", "min_point": 0} 또는 None
  """
  mysql = Mysql()  # 로컬 MySQL 객체 생성
  result = mysql.find("settings_notice_category",
                      fields=fields,
                      addStr=f"WHERE `category`='{category}'")
  mysql.close()
  if len(result) == 0:
    return None
  r = result[0]
  return dict_from_tuple(fields, r)


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


def get_search_weight(keywords,
                      min_point=4,
                      field="title",
                      table_name="notice_list",
                      add_fields=[],
                      add_where=""):
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
      if nid not in rsts:
        rsts[nid] = {field: r[3], "matched": r[0], "point": r[1]}
        for (i, add_field) in enumerate(add_fields):
          rsts[nid][add_field] = r[i + 4]
      else:
        rsts[nid]["matched"] += f",{r[0]}"
        rsts[nid]["point"] += int(r[1])
        for (i, add_field) in enumerate(add_fields):
          rsts[nid][add_field] = r[i + 4]

  mysql.close()  # MySQL 연결 종료
  return [{
      nid: rst
  } for (nid, rst) in rsts.items() if rst["point"] >= int(min_point)]


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
  if (not_str.strip() == ""):
    return dicts

  rsts = []
  for data in dicts:
    for (nid, row) in data.items():
      if not is_not_ins(not_str, row[field]):
        rsts.append(data)

  return rsts


# ** SETTINGS(list, detail) - Element handling functions
# --------------------------------------------------------------------
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
    if v is None:
      continue
    if not isinstance(v, str) or v.strip() == "":
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
      element = {
          "key": k,
          "xpath": xpath,
          "target": vs[1].strip(),
          "callback": vs[2].strip()
      }
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


# ** SETTINGS(list)
# --------------------------------------------------------------------
def find_settings_notice_list(fields=SETTINGS_NOTICE_LIST_BRIEF_FIELDS,
                              addStr="WHERE `use`=1",
                              out_type="dicts"):
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


def _find_settings_notice_list_by_org_name(
        name, fields=SETTINGS_NOTICE_LIST_CONFIG_FIELDS):
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
    result = mysql.find("settings_notice_list",
                        fields=fields,
                        addStr=f"WHERE `org_name`='{name}'")
    return result
  except Exception as e:
    print(f"기관명 '{name}' 설정 검색 중 오류 발생: {str(e)}")
    return []


def find_settings_notice_list_by_org_name(
        name, fields=SETTINGS_NOTICE_LIST_CONFIG_FIELDS, out_type="tuple"):
  site_config = _find_settings_notice_list_by_org_name(name, fields)[0]
  config = dict_from_tuple(fields, site_config)
  elements_config = {
      SETTINGS_NOTICE_LIST_ELEMENT_FIELDS[i]: v
      for (i, v) in enumerate(
          _find_settings_notice_list_by_org_name(
              name, fields=SETTINGS_NOTICE_LIST_ELEMENT_FIELDS)[0])
  }
  config["elements"] = unpack_settings_elements(elements_config)

  # use, org_region, registration 필드 추가
  config["use"] = site_config[fields.index("use")] if "use" in fields else None
  config["org_region"] = site_config[fields.index(
      "org_region")] if "org_region" in fields else None
  config["registration"] = site_config[fields.index(
      "registration")] if "registration" in fields else None

  if out_type == "dict":
    return config
  elif out_type == "tuple":
    return tuple([config.get(field, None) for field in fields + ["elements"]])


def _find_settings_notice_list_by_oid(
        oid, fields=SETTINGS_NOTICE_LIST_CONFIG_FIELDS):
  """
  OID로 설정 목록을 검색하는 함수

  Args:
      oid (int): OID
      fields (list): 검색할 필드명 리스트

  Returns:
      list: 설정 목록 리스트
  """
  mysql = None
  try:
    mysql = Mysql()  # 로컬 MySQL 객체 생성
    result = mysql.find("settings_notice_list",
                        fields=fields,
                        addStr=f"WHERE `oid`={oid}")
    return result
  except Exception as e:
    print(f"OID '{oid}' 설정 검색 중 오류 발생: {str(e)}")
    return []
  finally:
    if mysql:
      mysql.close()


def find_settings_notice_list_by_oid(
        oid, fields=SETTINGS_NOTICE_LIST_CONFIG_FIELDS, out_type="tuple"):
  """
  OID로 설정 목록을 검색하는 함수 (find_settings_notice_list_by_org_name 참조)

  Args:
      oid (int): OID
      fields (list): 검색할 필드명 리스트
      out_type (str): 출력 타입 ("dict" 또는 "tuple")

  Returns:
      dict 또는 tuple: 설정 상세 페이지의 보기, 편집 모드시 데이터값
  """
  try:
    # Use CONFIG_FIELDS first since we know it works
    site_configs = _find_settings_notice_list_by_oid(oid, fields=SETTINGS_NOTICE_LIST_CONFIG_FIELDS)
    if not site_configs:
      return {} if out_type == "dict" else None
      
    site_config = site_configs[0]
    config = dict_from_tuple(SETTINGS_NOTICE_LIST_CONFIG_FIELDS, site_config)
    
    # Extract element fields individually (the only method that works)
    try:
      elements_config = {}
      for field in SETTINGS_NOTICE_LIST_ELEMENT_FIELDS:
        try:
          field_data = _find_settings_notice_list_by_oid(oid, fields=[field])
          if field_data and field_data[0] and field_data[0][0]:
            elements_config[field] = field_data[0][0]
        except Exception:
          # Skip this field if query fails
          continue
      
      if elements_config:
        config["elements"] = unpack_settings_elements(elements_config)
      else:
        config["elements"] = []
    except Exception as element_error:
      print(f"Element extraction failed for OID {oid}: {element_error}")
      config["elements"] = []

    if out_type == "dict":
      return config
    elif out_type == "tuple":
      return tuple([config.get(field, None) for field in fields + ["elements"]])
  except Exception as e:
    print(f"OID '{oid}' 설정 조회 중 오류 발생: {str(e)}")
    return {} if out_type == "dict" else None


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
    fields = ["org_name"]
    fields.extend(keys)
    settings = find_settings_notice_list(fields=fields, out_type="dicts")
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


def _upsert_settings_notice_list_by_org_name(name, data):
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
    existing_data = mysql.find("settings_notice_list", ["org_name"],
                               f"WHERE org_name = '{name}'")

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


def upsert_settings_notice_list_by_org_name(name, data):
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

    # _upsert_settings_notice_list_by_org_name 함수 호출
    return _upsert_settings_notice_list_by_org_name(name, data_copy)
  except Exception as e:
    print(f"설정 업데이트 중 오류 발생: {str(e)}")
    return False


def _upsert_settings_notice_list_by_oid(oid, data):
  """
  OID로 설정 목록을 업데이트하는 함수

  Args:
      oid (int): OID
      data (dict): 설정 데이터

  Returns:
      bool: 성공 여부
  """
  mysql = None
  try:
    # data에 'oid' 키가 없으면 추가
    if 'oid' not in data:
      data['oid'] = oid

    # None 값을 빈 문자열로 변환
    for key, value in data.items():
      if value is None:
        data[key] = ""

    # 딕셔너리를 CSV 형식으로 변환
    csv_data = csv_from_dicts([data])

    mysql = Mysql()

    # 기존 데이터가 있는지 확인
    existing_data = mysql.find("settings_notice_list", ["oid"],
                               f"WHERE oid = {oid}")

    if existing_data:
      # 기존 데이터가 있으면 UPDATE 실행
      update_data = {}
      for key, value in data.items():
        if key != 'oid':  # oid는 WHERE 조건으로 사용하므로 제외
          update_data[key] = value

      # UPDATE 쿼리 실행
      mysql.update("settings_notice_list", update_data, f"oid = {oid}")
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


def upsert_settings_notice_list_by_oid(oid, data):
  """
  OID로 설정 목록을 업데이트하는 함수 (elements 요소 포함)
  (upsert_settings_notice_list_by_org_name 함수 참조)

  Args:
      oid (int): OID
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

    # _upsert_settings_notice_list_by_oid 함수 호출
    return _upsert_settings_notice_list_by_oid(oid, data_copy)
  except Exception as e:
    print(f"설정 업데이트 중 오류 발생: {str(e)}")
    return False


# ** SETTINGS(detail)
# --------------------------------------------------------------------


def find_settings_notice_detail(fields=SETTINGS_NOTICE_DETAIL_FIELDS,
                                addStr="WHERE `use`=1",
                                out_type="dicts"):
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


def _find_settings_notice_detail_by_org_name(
        name,
        fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS,
        table_name="settings_notice_detail",
        out_type="tuple"):
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
    result = mysql.find(table_name,
                        fields=fields,
                        addStr=f"WHERE `org_name`='{name}'")
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


def find_settings_notice_detail_by_org_name(
        name,
        fields=SETTINGS_NOTICE_DETAIL_FIELDS,
        table_name="settings_notice_detail",
        out_type="dicts"):
  """
  기관명으로 설정 상세를 조회하는 함수 - find_settings_notice_detail 패턴 따름
  """
  mysql = Mysql()  # 로컬 MySQL 객체 생성
  result = mysql.find(table_name,
                      fields=fields,
                      addStr=f"WHERE `org_name`='{name}' AND `use`=1")
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


def detail_config_by_org_name(name,
                              fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS,
                              table_name="settings_notice_detail"):
  """
  기관명으로 상세 페이지 설정을 가져오는 함수

  Args:
      name (str): 기관명
      fields (list): 가져올 필드 목록
      table_name (str): 테이블 이름

  Returns:
      dict: 설정 정보
  """
  return find_settings_notice_detail_by_org_name(name, fields, table_name)


def get_detail_elements(settings):
  """
  설정에서 상세 페이지 요소를 추출하는 함수

  Args:
      settings (dict): 설정 정보

  Returns:
      dict: 상세 페이지 요소
  """
  return unpack_settings_elements(settings)


def _find_settings_notice_detail_by_oid(
        oid, fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS):
  """
  OID로 설정 상세를 검색하는 함수

  Args:
      oid (int): OID
      fields (list): 검색할 필드명 리스트

  Returns:
      list: 설정 목록 리스트
  """
  mysql = None
  try:
    mysql = Mysql()  # 로컬 MySQL 객체 생성
    result = mysql.find("settings_notice_detail",
                        fields=fields,
                        addStr=f"WHERE `oid`={oid}")
    return result
  except Exception as e:
    print(f"OID '{oid}' 상세 설정 검색 중 오류 발생: {str(e)}")
    return []
  finally:
    if mysql:
      mysql.close()


def find_settings_notice_detail_by_oid(
        oid, fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS, out_type="dict"):
  """
  OID로 설정 상세를 검색하는 함수 (find_settings_notice_list_by_oid 참조)

  Args:
      oid (int): OID
      fields (list): 검색할 필드명 리스트
      out_type (str): 출력 타입 ("dict" 또는 "tuple")

  Returns:
      dict 또는 tuple: 설정 상세 페이지의 보기, 편집 모드시 데이터값
  """
  try:
    # 기본 config 필드들 가져오기
    site_configs = _find_settings_notice_detail_by_oid(oid, fields=SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS)
    if not site_configs:
      # 데이터가 없으면 빈 딕셔너리/None 반환
      return {} if out_type == "dict" else None
      
    site_config = site_configs[0]
    config = dict_from_tuple(SETTINGS_NOTICE_DETAIL_CONFIG_FIELDS, site_config)
    
    # element 필드들 개별적으로 가져오기
    try:
      elements_config = {}
      for field in SETTINGS_NOTICE_DETAIL_ELEMENT_FIELDS:
        try:
          field_data = _find_settings_notice_detail_by_oid(oid, fields=[field])
          if field_data and field_data[0] and field_data[0][0] is not None:
            elements_config[field] = field_data[0][0]
        except Exception:
          # 이 필드에서 쿼리 실패하면 건너뛰기
          continue
      
      # 가져온 element 필드들을 config에 병합
      config.update(elements_config)
    except Exception as element_error:
      print(f"Element extraction failed for detail OID {oid}: {element_error}")

    if out_type == "dict":
      return config
    elif out_type == "tuple":
      return tuple([config.get(field, None) for field in fields])
  except Exception as e:
    print(f"OID '{oid}' 상세 설정 조회 중 오류 발생: {str(e)}")
    return {} if out_type == "dict" else None


def _upsert_settings_notice_detail_by_oid(oid, data):
  """
  OID로 설정 상세를 업데이트하는 함수

  Args:
      oid (int): OID
      data (dict): 설정 데이터

  Returns:
      bool: 성공 여부
  """
  mysql = None
  try:
    # data에 'oid' 키가 없으면 추가
    if 'oid' not in data:
      data['oid'] = oid

    # None 값을 빈 문자열로 변환
    for key, value in data.items():
      if value is None:
        data[key] = ""

    # 딕셔너리를 CSV 형식으로 변환
    csv_data = csv_from_dicts([data])

    mysql = Mysql()

    # 기존 데이터가 있는지 확인
    existing_data = mysql.find("settings_notice_detail", ["oid"],
                               f"WHERE oid = {oid}")

    if existing_data:
      # 기존 데이터가 있으면 UPDATE 실행
      update_data = {}
      for key, value in data.items():
        if key != 'oid':  # oid는 WHERE 조건으로 사용하므로 제외
          update_data[key] = value

      # UPDATE 쿼리 실행
      mysql.update("settings_notice_detail", update_data, f"oid = {oid}")
    else:
      # 기존 데이터가 없으면 INSERT 실행
      mysql.insert("settings_notice_detail", csv_data)

    return True
  except Exception as e:
    print(f"상세 설정 업데이트 중 오류 발생: {str(e)}")
    return False
  finally:
    if mysql:
      mysql.close()


def upsert_settings_notice_detail_by_oid(oid, data):
  """
  OID로 설정 상세를 업데이트하는 함수

  Args:
      oid (int): OID
      data (dict): 설정 데이터

  Returns:
      bool: 성공 여부
  """
  try:
    # data 복사본 생성
    data_copy = data.copy()

    # _upsert_settings_notice_detail_by_oid 함수 호출
    return _upsert_settings_notice_detail_by_oid(oid, data_copy)
  except Exception as e:
    print(f"상세 설정 업데이트 중 오류 발생: {str(e)}")
    return False


if __name__ == "__main__":
  pass
  print(find_settings_notice_detail())
