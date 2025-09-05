import os
import csv
from datetime import datetime, timezone, timedelta
from utils.utils_mysql import Mysql
from utils.utils_data import _now


def get_filename(prefix="schema_backup",
                 filename=None,
                 foldername="../../_backups/database/",
                 ext="sql"):
  # 파일명 생성
  if not filename:
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{prefix}_{timestamp}.{ext}"

  return os.path.join(foldername, filename)


# ** SCHEMA BACKUP
# --------------------------------------------------------------------


def schema_backup(filename=None, foldername="../../_backups/database/"):
  """
  MySQL 스키마 백업을 수행하는 함수

  Args:
      filename (str, optional): 저장할 파일명. 없으면 자동 생성

  Returns:
      str: 저장된 파일명 또는 None (실패 시)
  """
  mysql = Mysql()
  try:
    # 모든 테이블 목록 가져오기
    tables_query = """
            SELECT table_name, table_comment, engine, table_rows
            FROM information_schema.tables
            WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """
    tables = mysql.fetch(tables_query)

    if not tables:
      print("백업할 테이블이 없습니다.")
      return None

    # 백업 내용 생성
    all_statements = []
    header = f"""-- MySQL Schema Backup
-- Database: Current Database
-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- Total Tables: {len(tables)}

"""
    all_statements.append(header)

    print(f"총 {len(tables)}개의 테이블을 백업합니다...")

    for table_info in tables:
      table_name = table_info[0]
      table_comment = table_info[1] or 'No comment'
      engine = table_info[2]
      table_rows = table_info[3] or 0

      print(f"처리 중: {table_name} ({engine}, {table_rows} rows)")

      # CREATE TABLE 문 가져오기
      create_query = f"SHOW CREATE TABLE `{table_name}`"
      create_result = mysql.fetch(create_query)

      if create_result and len(create_result) > 0:
        create_statement = create_result[0][1]

        table_header = f"""-- =============================================
-- Table: {table_name}
-- Engine: {engine}
-- Rows: {table_rows}
-- Comment: {table_comment}
-- ============================================="""

        all_statements.append(f"{table_header}\n{create_statement}")
      else:
        print(f"경고: {table_name} 테이블의 CREATE 문을 가져올 수 없습니다.")

    # 백업 내용 조합
    backup_content = "\n\n".join(all_statements)

    # 파일명 생성
    filename = get_filename("schema_backup", filename, foldername)

    # 파일 저장
    with open(filename, 'w', encoding='utf-8') as f:
      f.write(backup_content)

    file_size = os.path.getsize(filename)
    print(f"백업 완료!")
    print(f"파일명: {filename}")
    print(f"파일크기: {file_size:,} bytes")
    return filename

  except Exception as e:
    print(f"스키마 백업 중 오류 발생: {str(e)}")
    return None
  finally:
    mysql.close()


# ** backup db tables(sql)
# --------------------------------------------------------------------


def backup_db_sql(filename=None,
                  foldername="../../_backups/database/",
                  tables=[
                      "settings_notice_list", "settings_notice_detail",
                      "settings_notice_category", "logs_notice_scraping",
                      "errors_notice_scraping"
                  ]):
  """
  MySQL Bid 데이터베이스 전체를 백업하는 함수

  백업 파일은 /home/MoonDev/backup.sql에 저장됩니다.
  """
  # 백업 파일 경로
  backup_file = get_filename("db_backup", filename, foldername)

  # MySQL 연결
  mysql = Mysql()
  try:

    with open(backup_file, 'w', encoding='utf-8') as f:
      # 헤더 추가
      f.write(f"-- MySQL Backup\n")
      f.write(f"-- Date: {_now()}\n")
      f.write(f"-- Database: Bid\n\n")

      # 각 테이블별로 백업
      for table in tables:
        # 테이블 구조 백업
        f.write(f"\n-- Table structure for table `{table}`\n")
        create_table_result = mysql.fetch(f"SHOW CREATE TABLE `{table}`")
        create_table = create_table_result[0][1] if create_table_result else ""
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


# ** backup csv
# --------------------------------------------------------------------
def backup_table_csv(table_name,
                     filename=None,
                     foldername="../../_backups/database/"):
  """
  특정 테이블을 CSV 형식으로 백업하는 함수

  Args:
      table_name (str): 백업할 테이블명
      filename (str, optional): 저장할 파일명. 없으면 자동 생성
      foldername (str): 저장할 폴더 경로

  Returns:
      str: 저장된 파일명 또는 None (실패 시)
  """
  mysql = Mysql()
  try:
    # 테이블 존재 여부 확인
    table_check = mysql.fetch(f"SHOW TABLES LIKE '{table_name}'")
    if not table_check:
      print(f"테이블 '{table_name}'이 존재하지 않습니다.")
      return None

    # 컬럼 정보 가져오기
    columns_query = f"SHOW COLUMNS FROM `{table_name}`"
    columns_info = mysql.fetch(columns_query)
    if not columns_info:
      print(f"테이블 '{table_name}'의 컬럼 정보를 가져올 수 없습니다.")
      return None

    # 컬럼명 추출
    column_names = [col[0] for col in columns_info]

    # 데이터 조회
    rows = mysql.find(table_name)

    # 파일명 생성
    backup_file = get_filename(f"table_backup_{table_name}",
                               filename,
                               foldername,
                               ext="csv")

    # 폴더가 없으면 생성
    os.makedirs(foldername, exist_ok=True)

    # CSV 파일로 저장
    with open(backup_file, 'w', newline='', encoding='utf-8') as csvfile:
      writer = csv.writer(csvfile)

      # 헤더 쓰기
      writer.writerow(column_names)

      # 데이터 쓰기
      if rows:
        for row in rows:
          # NULL 값을 빈 문자열로 변환
          processed_row = ['' if val is None else str(val) for val in row]
          writer.writerow(processed_row)

    row_count = len(rows) if rows else 0
    file_size = os.path.getsize(backup_file)

    print(f"CSV 백업 완료!")
    print(f"테이블: {table_name}")
    print(f"행 수: {row_count:,}")
    print(f"파일명: {backup_file}")
    print(f"파일크기: {file_size:,} bytes")

    return backup_file

  except Exception as e:
    print(f"CSV 백업 중 오류 발생: {str(e)}")
    return None
  finally:
    mysql.close()


# ** delete
# --------------------------------------------------------------------
def delete_old_notice_list(day_gap=15, condition="is_selected = 0"):
  """
  오래된 notices를 삭제하는 함수(is_selected = 0이고 scraped_at이 day_gap일 전인 notices)

  Args:
      day_gap (int): 현재 시간으로부터 몇 일 전까지의 notices를 삭제할지 (기본값: 15일)
  """
  mysql = Mysql()
  kst = timezone(timedelta(hours=9))
  mysql.delete("notice_list", f"{condition} AND scraped_at < '{_now()}'")
  mysql.close()


if __name__ == "__main__":
  pass
  # schema_backup()
  # backup_db()
  # schema_backup("schema_backup.sql")
  # delete_old_notice_list()
  backup_table_csv("notice_list")
