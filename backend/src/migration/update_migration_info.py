#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migration Info Update Script
table_migration_fields와 table_field_label_mappings 테이블의 table_name을 
table_name_mappings.csv에 따라 새로운 테이블명으로 업데이트합니다.
"""

import pymysql
import csv
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()


class MigrationInfoUpdater:
    def __init__(self, database='ilmac_bid_db'):
        self.database = database
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
    
    def connect(self):
        """데이터베이스 연결"""
        try:
            config = self.config.copy()
            config['database'] = self.database
            
            self.conn = pymysql.connect(**config)
            self.cursor = self.conn.cursor()
            
            print(f"데이터베이스 '{self.database}'에 연결되었습니다.")
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
    
    def load_table_name_mappings(self, csv_file_path):
        """CSV 파일에서 테이블명 매핑 정보 로드"""
        mappings = {}
        
        try:
            with open(csv_file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                
                # 첫 번째 행(헤더) 건너뛰기
                for line in lines[1:]:
                    line = line.strip()
                    if not line:
                        continue
                    
                    # 공백으로 분리 (여러 공백도 처리)
                    parts = line.split()
                    
                    if len(parts) >= 2:
                        old_table = parts[0]
                        new_table = parts[1]
                        mappings[old_table] = new_table
            
            print(f"테이블명 매핑 정보 {len(mappings)}건을 로드했습니다.")
            return mappings
            
        except Exception as e:
            print(f"CSV 파일 로드 실패: {e}")
            return {}
    
    def get_migration_tables_count(self):
        """마이그레이션 테이블들의 레코드 수 확인"""
        try:
            # table_migration_fields 테이블 확인
            self.cursor.execute("SELECT COUNT(*) FROM table_migration_fields")
            migration_fields_count = self.cursor.fetchone()[0]
            
            # table_field_label_mappings 테이블 확인
            self.cursor.execute("SELECT COUNT(*) FROM table_field_label_mappings")
            label_mappings_count = self.cursor.fetchone()[0]
            
            print(f"현재 상태:")
            print(f"  - table_migration_fields: {migration_fields_count}건")
            print(f"  - table_field_label_mappings: {label_mappings_count}건")
            
            return migration_fields_count, label_mappings_count
            
        except pymysql.Error as err:
            print(f"테이블 확인 실패: {err}")
            return 0, 0
    
    def get_unique_table_names(self, table_name):
        """특정 테이블에서 고유한 table_name 목록 조회"""
        try:
            self.cursor.execute(f"SELECT DISTINCT table_name FROM `{table_name}` ORDER BY table_name")
            table_names = [row[0] for row in self.cursor.fetchall()]
            return table_names
            
        except pymysql.Error as err:
            print(f"테이블명 목록 조회 실패: {err}")
            return []
    
    def update_table_migration_fields(self, mappings):
        """table_migration_fields 테이블의 table_name 업데이트"""
        print("\n=== table_migration_fields 업데이트 ===")
        
        # 현재 테이블명 목록 조회
        current_tables = self.get_unique_table_names('table_migration_fields')
        print(f"현재 table_migration_fields의 고유 테이블명: {current_tables}")
        
        update_count = 0
        skip_count = 0
        
        for old_table, new_table in mappings.items():
            if old_table in current_tables:
                try:
                    # 테이블명 업데이트
                    sql = "UPDATE table_migration_fields SET table_name = %s WHERE table_name = %s"
                    self.cursor.execute(sql, (new_table, old_table))
                    affected_rows = self.cursor.rowcount
                    
                    if affected_rows > 0:
                        print(f"  '{old_table}' -> '{new_table}': {affected_rows}건 업데이트")
                        update_count += affected_rows
                    else:
                        skip_count += 1
                        
                except pymysql.Error as err:
                    print(f"  업데이트 실패 ({old_table} -> {new_table}): {err}")
            else:
                skip_count += 1
        
        print(f"table_migration_fields 업데이트 완료: {update_count}건 업데이트, {skip_count}건 건너뜀")
        return update_count
    
    def update_table_field_label_mappings(self, mappings):
        """table_field_label_mappings 테이블의 table_name 업데이트"""
        print("\n=== table_field_label_mappings 업데이트 ===")
        
        # 현재 테이블명 목록 조회
        current_tables = self.get_unique_table_names('table_field_label_mappings')
        print(f"현재 table_field_label_mappings의 고유 테이블명: {current_tables}")
        
        update_count = 0
        skip_count = 0
        
        for old_table, new_table in mappings.items():
            if old_table in current_tables:
                try:
                    # 테이블명 업데이트
                    sql = "UPDATE table_field_label_mappings SET table_name = %s WHERE table_name = %s"
                    self.cursor.execute(sql, (new_table, old_table))
                    affected_rows = self.cursor.rowcount
                    
                    if affected_rows > 0:
                        print(f"  '{old_table}' -> '{new_table}': {affected_rows}건 업데이트")
                        update_count += affected_rows
                    else:
                        skip_count += 1
                        
                except pymysql.Error as err:
                    print(f"  업데이트 실패 ({old_table} -> {new_table}): {err}")
            else:
                skip_count += 1
        
        print(f"table_field_label_mappings 업데이트 완료: {update_count}건 업데이트, {skip_count}건 건너뜀")
        return update_count
    
    def verify_updates(self, mappings):
        """업데이트 결과 확인"""
        print("\n=== 업데이트 결과 확인 ===")
        
        # table_migration_fields 확인
        print("1. table_migration_fields 테이블:")
        migration_tables = self.get_unique_table_names('table_migration_fields')
        for table in sorted(migration_tables):
            # 원래 테이블명 찾기
            original_name = None
            for old_table, new_table in mappings.items():
                if new_table == table:
                    original_name = old_table
                    break
            
            if original_name:
                print(f"  - {table} (이전명: {original_name})")
            else:
                print(f"  - {table}")
        
        # table_field_label_mappings 확인
        print("\n2. table_field_label_mappings 테이블:")
        label_tables = self.get_unique_table_names('table_field_label_mappings')
        for table in sorted(label_tables):
            # 원래 테이블명 찾기
            original_name = None
            for old_table, new_table in mappings.items():
                if new_table == table:
                    original_name = old_table
                    break
            
            if original_name:
                print(f"  - {table} (이전명: {original_name})")
            else:
                print(f"  - {table}")
        
        # 최종 개수 확인
        final_migration_count, final_label_count = self.get_migration_tables_count()
        print(f"\n최종 레코드 수:")
        print(f"  - table_migration_fields: {final_migration_count}건")
        print(f"  - table_field_label_mappings: {final_label_count}건")
    
    def process_updates(self, mappings):
        """전체 업데이트 프로세스 실행"""
        if not self.connect():
            return False
        
        try:
            # 현재 상태 확인
            self.get_migration_tables_count()
            
            # 1. table_migration_fields 업데이트
            migration_updates = self.update_table_migration_fields(mappings)
            
            # 2. table_field_label_mappings 업데이트
            label_updates = self.update_table_field_label_mappings(mappings)
            
            # 3. 결과 확인
            self.verify_updates(mappings)
            
            print(f"\n=== 전체 업데이트 완료 ===")
            print(f"총 업데이트: {migration_updates + label_updates}건")
            
            return True
            
        except Exception as e:
            print(f"업데이트 중 오류 발생: {e}")
            return False
        finally:
            self.disconnect()


def main():
    """메인 실행 함수"""
    print("=== Migration Info Table Name Update ===")
    print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 파일 경로 설정
    base_dir = "/_exp/projects/bid-notice-web/backend/src/migration/data"
    mappings_file = os.path.join(base_dir, "table_name_mappings.csv")
    
    # 파일 존재 확인
    if not os.path.exists(mappings_file):
        print(f"매핑 파일이 없습니다: {mappings_file}")
        return False
    
    # 업데이터 초기화
    updater = MigrationInfoUpdater(database='ilmac_bid_db')
    
    # 1. 테이블명 매핑 정보 로드
    print("1. 테이블명 매핑 정보 로드...")
    mappings = updater.load_table_name_mappings(mappings_file)
    
    if not mappings:
        print("매핑 정보를 로드할 수 없습니다.")
        return False
    
    # 매핑 정보 출력
    print("\n로드된 매핑 정보:")
    for old_table, new_table in mappings.items():
        print(f"  {old_table} -> {new_table}")
    
    # 2. 업데이트 실행
    print(f"\n2. 마이그레이션 정보 테이블 업데이트 실행...")
    if not updater.process_updates(mappings):
        print("업데이트에 실패했습니다.")
        return False
    
    print(f"\n완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=== 마이그레이션 정보 업데이트 완료 ===")
    
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