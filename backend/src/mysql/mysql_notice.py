import os
import sys
import re
import pymysql
import json
from pymysql import cursors
from datetime import datetime, timezone, timedelta
from utils.utils_mysql import Mysql, _where_like_unit, _where_eq_unit
from utils.utils_data import arr_from_csv, dict_from_tuple, dicts_from_tuples, csv_from_dicts, csv_added_defaults, _now
from mysql.mysql_settings import (CATEGORIES, find_settings_notice_category,
                            get_search_weight, filter_by_not,
                            add_settings_to_notice)

DELTA_HOURS = 46

# SUB FUNCTIONS


def get_gap_date(day_gap=10, format='%Y-%m-%d'):
  from datetime import timezone, timedelta as td
  kst = timezone(td(hours=9))
  return (datetime.now(kst) - timedelta(days=day_gap)).strftime(format)


def search_notice_list(keywords,
                       nots,
                       min_point,
                       field="title",
                       add_fields=[],
                       add_where=""):
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
  dicts = get_search_weight(keywords,
                            min_point=min_point,
                            add_fields=add_fields,
                            add_where=add_where)
  return filter_by_not(nots, dicts, field)


# ** NOTICES
# --------------------------------------------------------------------
def find_last_notice(name, field="title"):
  mysql = Mysql()  # 로컬 MySQL 객체 생성
  rs = mysql.find("notice_list",
                  fields=["sn", field],
                  addStr=f"WHERE `org_name`='{name}' ORDER BY `sn` desc",
                  limit=1)
  mysql.close()
  return rs if rs is not None else (0, "제목없음")


# ** main functions


def find_notice_list(names, keywords):
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

  result = mysql.find("notice_list",
                      ["org_region", "org_name", "title", "posted_date"],
                      addStr)
  mysql.close()
  return result


def find_notice_list_for_statistics(
        fields=["org_name", "posted_date", "category", "created_at"],
        renames=["orgName", "postedAt", "category", "createdAt"],
        day_gap=5):
  """
  통계를 위한 공고 목록을 조회하고 지역 정보를 추가하는 함수

  Args:
      fields (list): 조회할 필드 목록
      renames (list): 반환할 때 사용할 필드명 목록
      day_gap (int): 현재 시간으로부터 몇 일 전까지의 데이터를 조회할지

  Returns:
      list: [{"orgName": "org_name", "region": "org_region", "postedAt": "YYYY-MM-DD", "createdAt": "YYYY-MM-DD", "category": ""}, ...]
  """
  from mysql.mysql_settings import find_settings_notice_list

  mysql = Mysql()
  try:
    # 기준 날짜 계산 (day_gap일 전)
    result = mysql.find(
        "notice_list",
        fields=fields,
        addStr=f"WHERE STR_TO_DATE(`posted_date`, '%Y-%m-%d') >= '{get_gap_date(day_gap)}' ORDER BY `posted_date` DESC")

    # settings_notice_list에서 기관별 org_region 정보 조회
    settings = dicts_from_tuples(["orgName", "region"],
                                 find_settings_notice_list(
                                     fields=["org_name", "org_region"],
                                     out_type="tuples"))

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

      # orgName에 해당하는 region 정보 추가
      notice["region"] = region_map.get(notice["orgName"], "")
      notices.append(notice)

    return notices

  except Exception as e:
    print(f"통계 데이터 조회 중 오류 발생: {str(e)}")
    return []
  finally:
    mysql.close()


def find_notice_list_with_category(fields=[
    "nid", "title", "detail_url", "posted_date", "posted_by", "org_name",
    "category"
],
        add_where=""):
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
          notice_dict["posted_date"] = notice_dict["posted_date"].strftime(
              '%Y-%m-%d')
        except (AttributeError, ValueError):
          pass

      result.append(notice_dict)

    return result

  except Exception as e:
    print(f"notices 검색 중 오류 발생: {str(e)}")
    return []


def find_notice_list_by_category(category, day_gap=2, is_selected=0):
  """
  카테고리별로 notices를 검색하는 함수

  Args:
      category (str): 카테고리명('무관' 또는 카테고리명 또는 '제외')
      day_gap (int): 현재 시간으로부터 몇 일 전까지의 notices를 검색할지 (기본값: 2일)

  Returns:
      list: [{"nid": "", "title": "", "detail_url": "", "posted_date": "YYYY-mm-dd", "posted_by": "", "org_name": "", "org_region": "", "registration": ""}, ...]
  """
  mysql = Mysql()
  try:
    # 제외된 공고를 조회하는 경우
    if category == '제외':
      search_str = f"WHERE is_selected = -1"
    else:
      # 카테고리별 notices 검색
      # !! 업무로 선택된 공고(is_selected = 1)
      search_str = f"WHERE category = '{category}' AND is_selected = {is_selected}"
    
    if day_gap > 0:
      search_str += f" AND STR_TO_DATE(`posted_date`, '%Y-%m-%d') >= '{get_gap_date(day_gap)}' ORDER BY `posted_date` DESC"

    fields = [
        "nid", "title", "detail_url", "posted_date", "posted_by", "org_name",
        "category"
    ]
    notices = mysql.find("notice_list", fields=fields, addStr=search_str)

    # 튜플 리스트를 딕셔너리 리스트로 변환하고 posted_date 형식 변환
    result = []
    for notice in notices:
      notice_dict = dict(zip(fields, notice))
      if notice_dict["posted_date"]:
        try:
          # datetime.date 객체를 'YYYY-mm-dd' 형식으로 변환
          notice_dict["posted_date"] = notice_dict["posted_date"].strftime(
              '%Y-%m-%d')
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


def update_category_batch(category, delta_hours=DELTA_HOURS, start_time=None):
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
    start_time = (datetime.now(kst) -
                  timedelta(hours=delta_hours)).strftime('%Y-%m-%d %H:%M:%S')

  # 카테고리별 키워드 설정 가져오기
  keywords = find_settings_notice_category(category)
  if keywords is None:
    print(f"카테고리 '{category}'에 대한 키워드 설정이 없습니다.")
    return

  # notices 검색
  mysql = Mysql()
  try:
    # scraped_at이 start_time 이후인 notices 검색
    search_str = f"WHERE scraped_at >= '{start_time}' AND category = '무관'"
    notices = mysql.find("notice_list",
                         fields=["nid", "title"],
                         addStr=search_str)
    print(f"해당 {category} notices: {len(notices)}")

    if not notices:
      print(f"'{start_time}' 이후의 notices가 없습니다.")
      return

    # 카테고리에 해당하는 notices 검색
    matched_notice_list = search_notice_list(
        keywords["keywords"],
        keywords["nots"],
        keywords["min_point"],
        add_fields=["nid"],
        add_where=f"scraped_at >= '{start_time}' AND category = '무관'")

    if not matched_notice_list:
      print(f"카테고리 '{category}'에 해당하는 notices가 없습니다.")
      return

    # 검색된 notices에 대해 category 업데이트
    for notice in matched_notice_list:
      for nid, data in notice.items():
        mysql.update("notice_list", {"category": category}, f"nid = {nid}")

    print(
        f"카테고리 '{category}'에 대한 category 업데이트 완료: {len(matched_notice_list)}개")

  except Exception as e:
    print(f"category 업데이트 중 오류 발생: {str(e)}")


def update_notice_category_by_nids(nids, category):
  """
  특정 nid들의 카테고리를 업데이트하는 함수
  
  Args:
      nids (list): 업데이트할 nid 리스트
      category (str): 새로운 카테고리명
  
  Returns:
      int: 업데이트된 레코드 수
  """
  if not nids:
    return 0
    
  mysql = Mysql()
  updated_count = 0
  
  try:
    for nid in nids:
      # nid가 존재하는지 확인
      existing = mysql.find("notice_list", ["nid"], f"WHERE nid = {nid}")
      if existing:
        # 카테고리 업데이트
        mysql.update("notice_list", {"category": category}, f"nid = {nid}")
        updated_count += 1
        print(f"Updated nid {nid} to category '{category}'")
      else:
        print(f"Notice with nid {nid} not found")
    
    print(f"Total updated: {updated_count} notices")
    return updated_count
    
  except Exception as e:
    print(f"Error updating notice categories: {str(e)}")
    raise e
  finally:
    mysql.close()


def exclude_notices_by_nids(nids):
  """
  특정 nid들을 업무에서 제외하는 함수 (is_selected=-1로 설정)
  
  Args:
      nids (list): 제외할 nid 리스트
  
  Returns:
      int: 업데이트된 레코드 수
  """
  if not nids:
    return 0
    
  mysql = Mysql()
  updated_count = 0
  
  try:
    for nid in nids:
      # nid가 존재하는지 확인
      existing = mysql.find("notice_list", ["nid"], f"WHERE nid = {nid}")
      if existing:
        # is_selected를 -1로 업데이트
        mysql.update("notice_list", {"is_selected": -1}, f"nid = {nid}")
        updated_count += 1
        print(f"Excluded nid {nid} from work")
      else:
        print(f"Notice with nid {nid} not found")
    
    print(f"Total excluded: {updated_count} notices")
    return updated_count
    
  except Exception as e:
    print(f"Error excluding notices: {str(e)}")
    raise e
  finally:
    mysql.close()


def restore_notices_by_nids(nids):
  """
  특정 nid들을 업무에 복원하는 함수 (is_selected=0으로 설정)
  
  Args:
      nids (list): 복원할 nid 리스트
  
  Returns:
      int: 업데이트된 레코드 수
  """
  if not nids:
    return 0
    
  mysql = Mysql()
  updated_count = 0
  
  try:
    for nid in nids:
      # nid가 존재하는지 확인
      existing = mysql.find("notice_list", ["nid"], f"WHERE nid = {nid}")
      if existing:
        # is_selected를 0으로 업데이트
        mysql.update("notice_list", {"is_selected": 0}, f"nid = {nid}")
        updated_count += 1
        print(f"Restored nid {nid} to work")
      else:
        print(f"Notice with nid {nid} not found")
    
    print(f"Total restored: {updated_count} notices")
    return updated_count
    
  except Exception as e:
    print(f"Error restoring notices: {str(e)}")
    raise e
  finally:
    mysql.close()


def update_all_category(delta_hours=DELTA_HOURS, start_time=None):
  """
  모든 카테고리에 대해 category 업데이트를 수행하는 함수

  Args:
      categories (list): 카테고리명 리스트 (사용하지 않음, 모든 카테고리에 대해 업데이트)
      delta_hours (int): 현재 시간으로부터 몇 시간 전까지 검색할지 (기본값: DELTA_HOURS시간)
      start_time (str, optional): 검색 시작 시간 (UTC). 기본값: 현재 시간 - delta_hours
  """
  mysql = Mysql()
  try:
    for category in CATEGORIES:
      print(f"\n카테고리 '{category}' 업데이트 시작...")
      update_category_batch(category,
                            delta_hours=delta_hours,
                            start_time=start_time)

  except Exception as e:
    print(f"전체 category 업데이트 중 오류 발생: {str(e)}")


def upsert_notice_list(data):
  """
  여러 공고를 업데이트하는 함수

  Args:
      data (list): 업데이트할 데이터 리스트 [{nid: xxx, ...}, ...]
  """
  mysql = Mysql()
  try:
    print(f'upsert_notice_list data: {data}')
    # 전체 데이터를 한 번에 업데이트
    mysql.upsert("notice_list", data, inType="dicts")
    print(f"{len(data)}개의 공고가 업데이트되었습니다.")
  except Exception as e:
    print(f"공고 업데이트 중 오류 발생: {str(e)}")
  finally:
    mysql.close()

# ** my_bids
# --------------------------------------------------------------------


def find_notice_by_nid(
        nid,
        fields=["org_name", "category", "posted_date"],
        out_type="dict"):
  mysql = Mysql()
  rs = mysql.find("notice_list", fields, f"WHERE nid = {nid}")
  mysql.close()
  if not rs:
    return None
  if out_type == "dict":
    return dict(zip(fields, rs[0]))
  else:
    return rs[0]


def find_my_bids(fields=[
    "mid", "nid", "status", "title", "started_at", "ended_at", "detail", "memo"
],
        addStr=""):
  from mysql.mysql_settings import find_settings_notice_list

  mysql = Mysql()
  my_bids = mysql.find("my_bids", fields=fields, addStr=addStr)
  mysql.close()
  dicts = [dict(zip(fields, bid)) for bid in my_bids]
  settings = find_settings_notice_list(fields=["org_name", "org_region"],
                                       out_type="dicts")
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


def find_my_bids_by_status(status,
                           fields=[
                               "mid", "nid", "status", "title", "started_at",
                               "ended_at", "detail", "memo"
                           ],
                           addStr=""):
  dicts = find_my_bids(fields=fields,
                       addStr=f"WHERE status = '{status}' {addStr}")
  return dicts


def find_my_bid_by_nid(nid, fields=["mid", "nid", "status", "title", "started_at", "ended_at", "detail", "memo"]):
  """
  특정 nid로 입찰 정보를 조회하는 함수
  
  Args:
      nid (str): 조회할 nid
      fields (list): 조회할 필드 목록
      
  Returns:
      dict: 입찰 정보 딕셔너리 또는 None
  """
  from mysql.mysql_settings import find_settings_notice_list
  
  mysql = Mysql()
  my_bid = mysql.find("my_bids", fields=fields, addStr=f"WHERE nid = {nid}")
  mysql.close()
  
  if not my_bid:
    return None
    
  bid_dict = dict(zip(fields, my_bid[0]))
  
  # 공고 정보 추가
  notice = find_notice_by_nid(nid)
  if notice:
    bid_dict.update(notice)
    
    # 기관별 지역 정보 추가
    settings = find_settings_notice_list(fields=["org_name", "org_region"], out_type="dicts")
    bid_dict["org_region"] = ""
    for setting in settings:
      if setting.get("org_name") == bid_dict["org_name"]:
        bid_dict["org_region"] = setting.get("org_region", "")
        break
  
  return bid_dict


def upsert_my_bids(data):
  mysql = Mysql()
  mysql.upsert("my_bids", data, inType="dicts")
  mysql.close()


# ** test
# --------------------------------------------------------------------
def get_notice_list_gap(gap=3):
  """
  특정 카테고리의 공고 목록을 반환합니다.
  """
  result = find_notice_list_with_category(
      add_where=f"`posted_date` >= DATE_SUB(NOW(), INTERVAL {gap} DAY)")

  # 각 row의 org_name에 해당하는 'org_region', 'registration' 필드값을 가져오기
  for item in result:
    add_settings_to_notice(item)

  return result


if __name__ == "__main__":
  pass
  # category = "무관"
  # print(find_notice_list_by_category(category, day_gap=2))
  update_all_category()
