#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MySQL Database Migration Script
Bid 데이터베이스의 스키마를 ilmac_bid_db 데이터베이스에 새로 생성합니다.
"""

import pymysql
import csv
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()


class DatabaseMigrator:
    def __init__(self, source_db='Bid', target_db='ilmac_bid_db'):
        self.source_db = source_db
        self.target_db = target_db
        self.config = {
            'host': os.getenv('MYSQL_HOST', 'localhost'),
            'user': os.getenv('MYSQL_USER', 'root'),
            'password': os.getenv('MYSQL_PASSWORD', ''),
            'port': int(os.getenv('MYSQL_PORT', 3306)),
            'charset': 'utf8mb4',
            'autocommit': True
        }
        self.conn = None
        self.cursor = None
    
    def connect(self, database=None):
        """데이터베이스 연결"""
        try:
            config = self.config.copy()
            if database:
                config['database'] = database
            
            self.conn = pymysql.connect(**config)
            self.cursor = self.conn.cursor()
            
            db_info = f" (database: {database})" if database else ""
            print(f"MySQL 서버에 연결되었습니다{db_info}")
            return True
        except pymysql.Error as err:
            print(f"연결 실패: {err}")
            return False
    
    def disconnect(self):
        """데이터베이스 연결 해제"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("데이터베이스 연결이 해제되었습니다.")
    
    def create_database(self):
        """새로운 데이터베이스 생성"""
        if not self.connect():
            return False
        
        try:
            # 데이터베이스 존재 여부 확인
            self.cursor.execute("SHOW DATABASES LIKE %s", (self.target_db,))
            exists = self.cursor.fetchone()
            
            if exists:
                print(f"데이터베이스 '{self.target_db}'가 이미 존재합니다.")
                print(f"기존 데이터베이스 '{self.target_db}' 삭제 중...")
                self.cursor.execute(f"DROP DATABASE `{self.target_db}`")
            
            # 새 데이터베이스 생성
            print(f"새 데이터베이스 '{self.target_db}' 생성 중...")
            self.cursor.execute(f"""
                CREATE DATABASE `{self.target_db}` 
                CHARACTER SET utf8mb4 
                COLLATE utf8mb4_unicode_ci
            """)
            
            print(f"데이터베이스 '{self.target_db}' 생성 완료!")
            return True
            
        except pymysql.Error as err:
            print(f"데이터베이스 생성 실패: {err}")
            return False
        finally:
            self.disconnect()
    
    def create_tables(self, schema_file_path):
        """스키마 파일로부터 테이블 생성"""
        if not self.connect(self.target_db):
            return False
        
        try:
            # SQL 파일 읽기
            with open(schema_file_path, 'r', encoding='utf-8') as f:
                schema_content = f.read()
            
            # CREATE TABLE 문들을 추출
            import re
            create_table_pattern = r'(CREATE TABLE `[^`]+`.*?ENGINE=\w+.*?)(?=\n\n--|$)'
            statements = re.findall(create_table_pattern, schema_content, re.DOTALL | re.IGNORECASE)
            
            print(f"총 {len(statements)}개의 SQL 문을 실행합니다...")
            
            success_count = 0
            for i, statement in enumerate(statements, 1):
                if not statement:
                    continue
                    
                try:
                    # 테이블명 추출
                    table_match = statement.find('CREATE TABLE `')
                    if table_match != -1:
                        table_start = table_match + len('CREATE TABLE `')
                        table_end = statement.find('`', table_start)
                        table_name = statement[table_start:table_end]
                        print(f"  {i}. 테이블 '{table_name}' 생성 중...")
                    
                    self.cursor.execute(statement)
                    success_count += 1
                    
                except pymysql.Error as err:
                    print(f"  오류: {err}")
                    print(f"  실패한 SQL 문의 시작: {statement[:100]}...")
            
            print(f"\n테이블 생성 완료! ({success_count}/{len(statements)} 성공)")
            return True
            
        except Exception as e:
            print(f"테이블 생성 실패: {e}")
            return False
        finally:
            self.disconnect()
    
    def insert_csv_data(self, csv_file_path, table_name):
        """CSV 파일 데이터를 테이블에 입력"""
        if not self.connect(self.target_db):
            return False
        
        try:
            with open(csv_file_path, 'r', encoding='utf-8') as f:
                csv_reader = csv.reader(f)
                headers = next(csv_reader)  # 헤더 행
                
                # 테이블 존재 확인
                self.cursor.execute(f"SHOW TABLES LIKE '{table_name}'")
                if not self.cursor.fetchone():
                    print(f"테이블 '{table_name}'이 존재하지 않습니다.")
                    return False
                
                # 기존 데이터 삭제
                self.cursor.execute(f"DELETE FROM `{table_name}`")
                
                # 데이터 입력
                rows = list(csv_reader)
                if not rows:
                    print(f"'{csv_file_path}' 파일에 데이터가 없습니다.")
                    return True
                
                # INSERT 문 생성
                placeholders = ', '.join(['%s'] * len(headers))
                column_names = ', '.join([f'`{col}`' for col in headers])
                sql = f"INSERT INTO `{table_name}` ({column_names}) VALUES ({placeholders})"
                
                # 배치 입력
                self.cursor.executemany(sql, rows)
                
                print(f"  테이블 '{table_name}'에 {len(rows)}건의 데이터를 입력했습니다.")
                return True
                
        except Exception as e:
            print(f"CSV 데이터 입력 실패 ({table_name}): {e}")
            return False
        finally:
            self.disconnect()
    
    def verify_migration(self):
        """마이그레이션 결과 확인"""
        if not self.connect(self.target_db):
            return False
        
        try:
            # 테이블 목록 조회
            self.cursor.execute("SHOW TABLES")
            tables = self.cursor.fetchall()
            
            print(f"\n=== 마이그레이션 결과 확인 ===")
            print(f"데이터베이스: {self.target_db}")
            print(f"생성된 테이블 수: {len(tables)}")
            
            for table in tables:
                table_name = table[0]
                self.cursor.execute(f"SELECT COUNT(*) FROM `{table_name}`")
                count = self.cursor.fetchone()[0]
                print(f"  - {table_name}: {count}건")
            
            return True
            
        except pymysql.Error as err:
            print(f"확인 실패: {err}")
            return False
        finally:
            self.disconnect()


def main():
    """메인 실행 함수"""
    print("=== MySQL Database Migration ===")
    print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 파일 경로
    base_dir = "/_exp/projects/bid-notice-web/backend/src/migration/data"
    schema_file = os.path.join(base_dir, "Bid_schema_new.sql")
    migration_fields_csv = os.path.join(base_dir, "table_migration_fields.csv")
    label_mappings_csv = os.path.join(base_dir, "table_field_label_mappings.csv")
    
    # 파일 존재 확인
    required_files = [schema_file, migration_fields_csv, label_mappings_csv]
    for file_path in required_files:
        if not os.path.exists(file_path):
            print(f"필수 파일이 없습니다: {file_path}")
            return False
    
    # 마이그레이션 실행
    migrator = DatabaseMigrator(source_db='Bid', target_db='ilmac_bid_db')
    
    # 1. 새 데이터베이스 생성
    print("\n1. 새 데이터베이스 생성...")
    if not migrator.create_database():
        print("데이터베이스 생성에 실패했습니다.")
        return False
    
    # 2. 테이블 생성
    print("\n2. 테이블 생성...")
    if not migrator.create_tables(schema_file):
        print("테이블 생성에 실패했습니다.")
        return False
    
    # 3. CSV 데이터 입력
    print("\n3. 마이그레이션 데이터 입력...")
    
    # table_migration_fields 테이블에 데이터 입력
    print("  - table_migration_fields 데이터 입력...")
    if not migrator.insert_csv_data(migration_fields_csv, 'table_migration_fields'):
        print("migration_fields 데이터 입력 실패")
    
    # table_field_label_mappings 테이블에 데이터 입력
    print("  - table_field_label_mappings 데이터 입력...")
    if not migrator.insert_csv_data(label_mappings_csv, 'table_field_label_mappings'):
        print("label_mappings 데이터 입력 실패")
    
    # 4. 결과 확인
    print("\n4. 마이그레이션 결과 확인...")
    migrator.verify_migration()
    
    print(f"\n완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=== 마이그레이션 완료 ===")
    
    return True


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n작업이 사용자에 의해 중단되었습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"\n예상치 못한 오류가 발생했습니다: {e}")
        sys.exit(1)