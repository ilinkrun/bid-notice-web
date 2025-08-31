#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MySQL Table Name Change Script
ilmac_bid_db 데이터베이스의 테이블명을 table_name_mappings.csv 기준으로 변경합니다.
"""

import pymysql
import csv
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()


class TableRenamer:
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
    
    def load_table_mappings(self, csv_file_path):
        """CSV 파일에서 테이블 매핑 정보 로드"""
        mappings = []
        
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
                        table_src = parts[0]
                        table_dst = parts[1]
                        remark = ' '.join(parts[2:]) if len(parts) > 2 else ''
                        
                        mappings.append({
                            'table_src': table_src,
                            'table_dst': table_dst,
                            'remark': remark
                        })
            
            print(f"테이블 매핑 정보 {len(mappings)}건을 로드했습니다.")
            return mappings
            
        except Exception as e:
            print(f"CSV 파일 로드 실패: {e}")
            return []
    
    def get_existing_tables(self):
        """현재 데이터베이스의 테이블 목록 조회"""
        try:
            self.cursor.execute("SHOW TABLES")
            tables = [table[0] for table in self.cursor.fetchall()]
            return tables
        except pymysql.Error as err:
            print(f"테이블 목록 조회 실패: {err}")
            return []
    
    def check_foreign_keys(self, table_name):
        """테이블의 외래키 제약조건 확인"""
        try:
            # 해당 테이블을 참조하는 외래키들 조회
            self.cursor.execute("""
                SELECT 
                    CONSTRAINT_NAME,
                    TABLE_NAME,
                    COLUMN_NAME,
                    REFERENCED_TABLE_NAME,
                    REFERENCED_COLUMN_NAME
                FROM information_schema.KEY_COLUMN_USAGE
                WHERE REFERENCED_TABLE_SCHEMA = %s 
                AND REFERENCED_TABLE_NAME = %s
            """, (self.database, table_name))
            
            foreign_keys = self.cursor.fetchall()
            
            if foreign_keys:
                print(f"  경고: '{table_name}' 테이블을 참조하는 외래키가 {len(foreign_keys)}개 있습니다:")
                for fk in foreign_keys:
                    print(f"    - {fk[1]}.{fk[2]} -> {fk[3]}.{fk[4]} ({fk[0]})")
            
            return foreign_keys
            
        except pymysql.Error as err:
            print(f"외래키 확인 실패: {err}")
            return []
    
    def rename_table(self, old_name, new_name):
        """테이블명 변경"""
        try:
            # 테이블명 변경 SQL 실행
            sql = f"RENAME TABLE `{old_name}` TO `{new_name}`"
            self.cursor.execute(sql)
            
            print(f"  테이블명 변경 성공: '{old_name}' -> '{new_name}'")
            return True
            
        except pymysql.Error as err:
            print(f"  테이블명 변경 실패 ({old_name} -> {new_name}): {err}")
            return False
    
    def update_table_comment(self, table_name, comment):
        """테이블 COMMENT 업데이트"""
        try:
            # 테이블 COMMENT 변경 SQL 실행
            sql = f"ALTER TABLE `{table_name}` COMMENT = %s"
            self.cursor.execute(sql, (comment,))
            
            print(f"    COMMENT 업데이트 성공: '{comment}'")
            return True
            
        except pymysql.Error as err:
            print(f"    COMMENT 업데이트 실패: {err}")
            return False
    
    def process_table_renaming(self, mappings):
        """테이블명 변경 프로세스 실행"""
        if not self.connect():
            return False
        
        try:
            existing_tables = self.get_existing_tables()
            print(f"현재 데이터베이스에 {len(existing_tables)}개의 테이블이 있습니다.")
            
            success_count = 0
            skip_count = 0
            failed_count = 0
            
            print("\n=== 테이블명 변경 시작 ===")
            
            for i, mapping in enumerate(mappings, 1):
                old_name = mapping['table_src']
                new_name = mapping['table_dst']
                remark = mapping['remark']
                
                print(f"\n{i}. {old_name} -> {new_name} ({remark})")
                
                # 원본 테이블이 존재하는지 확인
                if old_name not in existing_tables:
                    print(f"  건너뜀: 원본 테이블 '{old_name}'이 존재하지 않습니다.")
                    skip_count += 1
                    continue
                
                # 대상 테이블명이 이미 존재하는지 확인
                if new_name in existing_tables:
                    print(f"  건너뜀: 대상 테이블명 '{new_name}'이 이미 존재합니다.")
                    skip_count += 1
                    continue
                
                # 같은 이름인 경우 건너뛰기
                if old_name == new_name:
                    print(f"  건너뜀: 원본과 대상 테이블명이 동일합니다.")
                    skip_count += 1
                    continue
                
                # 외래키 제약조건 확인 (경고만)
                self.check_foreign_keys(old_name)
                
                # 테이블명 변경 실행
                if self.rename_table(old_name, new_name):
                    # 테이블 COMMENT 업데이트 (remark가 있는 경우)
                    if remark:
                        self.update_table_comment(new_name, remark)
                    
                    success_count += 1
                    # existing_tables 리스트도 업데이트
                    existing_tables.remove(old_name)
                    existing_tables.append(new_name)
                else:
                    failed_count += 1
            
            print(f"\n=== 테이블명 변경 완료 ===")
            print(f"성공: {success_count}건")
            print(f"건너뜀: {skip_count}건")
            print(f"실패: {failed_count}건")
            print(f"총 처리: {len(mappings)}건")
            
            return True
            
        except Exception as e:
            print(f"테이블명 변경 중 오류 발생: {e}")
            return False
        finally:
            self.disconnect()
    
    def update_table_comments_only(self, mappings):
        """이미 변경된 테이블들의 COMMENT만 업데이트"""
        if not self.connect():
            return False
        
        try:
            existing_tables = self.get_existing_tables()
            print(f"현재 데이터베이스에 {len(existing_tables)}개의 테이블이 있습니다.")
            
            success_count = 0
            skip_count = 0
            failed_count = 0
            
            print("\n=== 테이블 COMMENT 업데이트 시작 ===")
            
            for i, mapping in enumerate(mappings, 1):
                old_name = mapping['table_src']
                new_name = mapping['table_dst']
                remark = mapping['remark']
                
                print(f"\n{i}. {new_name} COMMENT 업데이트: '{remark}'")
                
                # 변경된 테이블명이 존재하는지 확인
                if new_name not in existing_tables:
                    # 원본 테이블명으로도 확인
                    if old_name in existing_tables:
                        target_table = old_name
                        print(f"  원본 테이블명 '{old_name}'을 사용합니다.")
                    else:
                        print(f"  건너뜀: 테이블 '{new_name}' 또는 '{old_name}'이 존재하지 않습니다.")
                        skip_count += 1
                        continue
                else:
                    target_table = new_name
                
                # remark가 없는 경우 건너뛰기
                if not remark:
                    print(f"  건너뜀: COMMENT가 비어있습니다.")
                    skip_count += 1
                    continue
                
                # 테이블 COMMENT 업데이트
                if self.update_table_comment(target_table, remark):
                    success_count += 1
                else:
                    failed_count += 1
            
            print(f"\n=== 테이블 COMMENT 업데이트 완료 ===")
            print(f"성공: {success_count}건")
            print(f"건너뜀: {skip_count}건")
            print(f"실패: {failed_count}건")
            print(f"총 처리: {len(mappings)}건")
            
            return True
            
        except Exception as e:
            print(f"테이블 COMMENT 업데이트 중 오류 발생: {e}")
            return False
        finally:
            self.disconnect()
    
    def verify_changes(self, mappings):
        """변경 결과 확인"""
        if not self.connect():
            return False
        
        try:
            existing_tables = self.get_existing_tables()
            
            print(f"\n=== 변경 결과 확인 ===")
            print(f"현재 데이터베이스의 테이블 목록 ({len(existing_tables)}개):")
            
            for table in sorted(existing_tables):
                # 매핑에서 이 테이블이 변경된 결과인지 확인
                original_name = None
                for mapping in mappings:
                    if mapping['table_dst'] == table:
                        original_name = mapping['table_src']
                        break
                
                if original_name:
                    print(f"  - {table} (이전명: {original_name})")
                else:
                    print(f"  - {table}")
            
            return True
            
        except Exception as e:
            print(f"변경 결과 확인 실패: {e}")
            return False
        finally:
            self.disconnect()


def main():
    """메인 실행 함수"""
    print("=== MySQL Table Renaming ===")
    print(f"시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 파일 경로 설정
    base_dir = "/_exp/projects/bid-notice-web/backend/src/migration/data"
    mappings_file = os.path.join(base_dir, "table_name_mappings.csv")
    
    # 파일 존재 확인
    if not os.path.exists(mappings_file):
        print(f"매핑 파일이 없습니다: {mappings_file}")
        return False
    
    # 테이블 리네이머 초기화
    renamer = TableRenamer(database='ilmac_bid_db')
    
    # 1. 매핑 정보 로드
    print("1. 테이블 매핑 정보 로드...")
    mappings = renamer.load_table_mappings(mappings_file)
    
    if not mappings:
        print("매핑 정보를 로드할 수 없습니다.")
        return False
    
    # 매핑 정보 출력
    print("\n로드된 매핑 정보:")
    for mapping in mappings:
        print(f"  {mapping['table_src']} -> {mapping['table_dst']} ({mapping['remark']})")
    
    # 2. 테이블명 변경 또는 COMMENT 업데이트 선택
    print("\n작업 선택:")
    print("1. 테이블명 변경 + COMMENT 업데이트")
    print("2. COMMENT만 업데이트 (테이블명은 이미 변경됨)")
    
    # 사용자 입력 없이 COMMENT만 업데이트하도록 설정 (이미 테이블명이 변경되었으므로)
    choice = "2"  # COMMENT만 업데이트
    
    if choice == "1":
        # 테이블명 변경 실행
        print(f"\n2. 테이블명 변경 실행...")
        if not renamer.process_table_renaming(mappings):
            print("테이블명 변경에 실패했습니다.")
            return False
    else:
        # COMMENT만 업데이트
        print(f"\n2. 테이블 COMMENT 업데이트 실행...")
        if not renamer.update_table_comments_only(mappings):
            print("테이블 COMMENT 업데이트에 실패했습니다.")
            return False
    
    # 3. 변경 결과 확인
    print("3. 변경 결과 확인...")
    renamer.verify_changes(mappings)
    
    print(f"\n완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=== 테이블명 변경 완료 ===")
    
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