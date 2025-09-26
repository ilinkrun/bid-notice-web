import os
import sys
import re
import pymysql
import json
from pymysql import cursors
from datetime import datetime, timezone, timedelta
from utils.utils_mysql import Mysql, _where_like_unit, _where_eq_unit
from utils.utils_data import arr_from_csv, dict_from_tuple, dicts_from_tuples, csv_from_dicts, csv_added_defaults, _now


# ** logs, errors
# --------------------------------------------------------------------
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

      # new_count 값 가져오기
      new_count = log.get("new_count", 0)

      # SQL 쿼리 문자열 직접 구성
      sql = f"""
      INSERT INTO logs_notice_scraping (org_name, error_code, error_message, scraped_count, new_count, inserted_count, time)
      VALUES ('{log["org_name"]}', {error_code if error_code is not None else 'NULL'},
      '{error_message.replace("'", "''") if error_message else ''}',
      {log["scraped_count"]}, {new_count}, {log["inserted_count"]}, '{log["time"]}')
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
  fields = [
      "org_name", "error_code", "error_message", "scraped_count",
      "inserted_count", "time"
  ]
  kst = timezone(timedelta(hours=9))
  logs = mysql.find(
      "logs_notice_scraping",
      fields=fields,
      addStr=f"WHERE time >= '{
          datetime.now(kst) -
          timedelta(
              days=day_gap)}' ORDER BY time DESC")
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
  fields = ["orgs", "time"]
  kst = timezone(timedelta(hours=9))
  errors = mysql.find(
      "errors_notice_scraping",
      fields=fields,
      addStr=f"WHERE time >= '{
          datetime.now(kst) -
          timedelta(
              days=day_gap)}' ORDER BY time DESC")
  mysql.close()
  if out_type == "dicts":
    return [dict(zip(fields, error)) for error in errors]
  else:
    return errors


if __name__ == "__main__":
  pass
  # print(find_logs_notice_scraping(day_gap=15, out_type="dicts"))
