#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MySQL Schema Migration Script
원본 SQL 스키마에서 한글 필드명을 영문으로 변경하고 마이그레이션 정보를 생성합니다.
"""

import re
import csv
import os
from typing import Dict, List, Tuple, Optional


class SchemaMigrator:
    def __init__(self, input_sql_path: str, output_dir: str = "."):
        self.input_sql_path = input_sql_path
        self.output_dir = output_dir
        self.migration_fields = []  # table_migration_fields 데이터
        self.label_mappings = []    # table_field_label_mappings 데이터
        
    def parse_comment(self, comment: str) -> Tuple[Optional[str], str]:
        """
        COMMENT에서 영문 필드명과 한글 설명을 분리합니다.
        
        Args:
            comment: COMMENT 문자열 (예: 'org_name: 기관이름')
            
        Returns:
            (영문필드명, 한글설명) 또는 (None, 원본설명)
        """
        if not comment:
            return None, ""
            
        # ':' 로 분리
        parts = comment.split(':', 1)
        
        if len(parts) >= 2:
            # 첫 번째 부분이 영문으로 시작하는지 확인
            potential_field = parts[0].strip()
            if potential_field and re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', potential_field):
                return potential_field, parts[1].strip()
        
        return None, comment.strip()
    
    def extract_create_table_info(self, create_statement: str) -> Tuple[str, List[Dict]]:
        """
        CREATE TABLE 문에서 테이블명과 필드 정보를 추출합니다.
        
        Args:
            create_statement: CREATE TABLE SQL 문
            
        Returns:
            (테이블명, 필드정보리스트)
        """
        # 테이블명 추출
        table_match = re.search(r'CREATE TABLE `([^`]+)`', create_statement, re.IGNORECASE)
        if not table_match:
            return None, []
        
        table_name = table_match.group(1)
        fields = []
        
        # 필드 정의 부분만 추출 (CREATE TABLE ... ( 와 ) 사이)
        field_section_match = re.search(r'CREATE TABLE.*?\((.*?)\)(?:\s+ENGINE)', create_statement, re.DOTALL | re.IGNORECASE)
        if not field_section_match:
            return table_name, []
        
        field_section = field_section_match.group(1)
        
        # 각 줄을 분석하여 필드 정의 추출
        lines = field_section.split('\n')
        
        for line in lines:
            line = line.strip().rstrip(',')
            if not line or line.startswith('PRIMARY KEY') or line.startswith('UNIQUE KEY') or line.startswith('KEY') or line.startswith(')'):
                continue
                
            # 필드 정의 패턴: `필드명` 타입 [제약조건] COMMENT '설명'
            field_match = re.match(r'`([^`]+)`\s+(.*?)(?:\s+COMMENT\s+[\'"]([^\'"]*)[\'"])?$', line)
            
            if field_match:
                field_name = field_match.group(1)
                field_type = field_match.group(2).strip()
                comment = field_match.group(3) if field_match.group(3) else ""
                
                # COMMENT에서 제약조건 부분 제거 (NOT NULL, DEFAULT 등)
                type_parts = field_type.split()
                clean_type_parts = []
                skip_next = False
                
                for i, part in enumerate(type_parts):
                    if skip_next:
                        skip_next = False
                        continue
                    if part.upper() in ['NOT', 'NULL', 'DEFAULT', 'AUTO_INCREMENT', 'ON', 'UPDATE', 'CURRENT_TIMESTAMP']:
                        if part.upper() == 'DEFAULT' and i + 1 < len(type_parts):
                            skip_next = True
                        continue
                    clean_type_parts.append(part)
                
                clean_field_type = ' '.join(clean_type_parts)
                
                fields.append({
                    'name': field_name,
                    'type': clean_field_type,
                    'original_line': line,
                    'comment': comment
                })
        
        return table_name, fields
    
    def migrate_table(self, create_statement: str) -> str:
        """
        CREATE TABLE 문을 마이그레이션합니다.
        
        Args:
            create_statement: 원본 CREATE TABLE 문
            
        Returns:
            변경된 CREATE TABLE 문
        """
        table_name, fields = self.extract_create_table_info(create_statement)
        if not table_name:
            return create_statement
        
        print(f"  Table: {table_name}, Fields: {len(fields)}")
        
        migrated_statement = create_statement
        
        # 필드명 변경 매핑을 저장 (키와 인덱스에서 사용)
        field_mapping = {}
        
        for field in fields:
            field_name = field['name']
            comment = field['comment']
            original_line = field['original_line']
            
            # COMMENT에서 영문 필드명 추출
            english_field, korean_desc = self.parse_comment(comment)
            
            new_field_name = field_name
            new_comment = comment
            
            # 필드명이 한글인 경우 처리
            has_korean = bool(re.search(r'[가-힣]', field_name))
            
            # 1) 필드명이 한글이고 COMMENT에 영문 필드명이 있는 경우
            if has_korean and english_field:
                new_field_name = english_field
                new_comment = f"{field_name}: {korean_desc}" if korean_desc else field_name
                
                # migration_fields에 추가
                self.migration_fields.append({
                    'table_name': table_name,
                    'field_src': field_name,
                    'field_dst': english_field,
                    'remark': korean_desc
                })
                
                # 원본 줄을 새로운 줄로 교체
                new_line = original_line.replace(f'`{field_name}`', f'`{new_field_name}`')
                if comment:
                    new_line = re.sub(r"COMMENT\s+['\"][^'\"]*['\"]", f"COMMENT '{new_comment}'", new_line)
                
                migrated_statement = migrated_statement.replace(original_line, new_line)
            
            # 2) 필드명이 한글이지만 COMMENT에 영문 필드명이 없는 경우 - 자동 변환
            elif has_korean:
                # 간단한 한글 -> 영문 매핑
                korean_to_english = {
                    '제목': 'title',
                    '내용': 'content', 
                    '기관명': 'org_name',
                    '파일이름': 'file_name',
                    '파일주소': 'file_url',
                    '상세페이지주소': 'detail_url',
                    '작성일': 'posted_date',
                    '작성자': 'posted_by',
                    '공고구분': 'notice_div',
                    '공고번호': 'notice_num',
                    '담당부서': 'org_dept',
                    '담당자': 'org_man',
                    '연락처': 'org_tel',
                    '본문': 'body_html',
                    '다운폴더': 'down_folder',
                    '검색명': 'search_name',
                    '검색어': 'search_keyword',
                    '배제어': 'exclude_keyword',
                    '최소점수': 'min_score',
                    '적용분야': 'apply_field',
                    '적용기관': 'apply_org',
                    '적용지역': 'apply_region',
                    '메모': 'memo',
                    '미리보기': 'preview',
                    '지역': 'region',
                    '등록': 'registration',
                    '담당업체': 'company_in_charge',
                    '사용': 'use_yn',
                    '제외항목': 'exception_path'
                }
                
                if field_name in korean_to_english:
                    new_field_name = korean_to_english[field_name]
                    new_comment = f"{field_name}: {comment}" if comment else field_name
                    
                    # migration_fields에 추가
                    self.migration_fields.append({
                        'table_name': table_name,
                        'field_src': field_name,
                        'field_dst': new_field_name,
                        'remark': comment
                    })
                    
                    # 원본 줄을 새로운 줄로 교체
                    new_line = original_line.replace(f'`{field_name}`', f'`{new_field_name}`')
                    if comment:
                        new_line = re.sub(r"COMMENT\s+['\"][^'\"]*['\"]", f"COMMENT '{new_comment}'", new_line)
                    else:
                        new_line = new_line.rstrip() + f" COMMENT '{new_comment}'"
                    
                    migrated_statement = migrated_statement.replace(original_line, new_line)
            
            # 필드명 매핑 저장
            if new_field_name != field_name:
                field_mapping[field_name] = new_field_name
            
            # label_mappings에 추가 (모든 필드)
            final_field_name = new_field_name
            if new_field_name != field_name:
                # 필드명이 변경된 경우
                final_label = field_name
                final_remark = korean_desc if english_field else comment
            else:
                # 필드명이 변경되지 않은 경우  
                if ':' in comment:
                    parts = comment.split(':', 1)
                    final_label = parts[0].strip()
                    final_remark = parts[1].strip() if len(parts) > 1 else comment
                else:
                    final_label = comment if comment else field_name
                    final_remark = comment
            
            self.label_mappings.append({
                'table_name': table_name,
                'field_key': final_field_name,
                'field_label': final_label,
                'remark': final_remark
            })
        
        # PRIMARY KEY, UNIQUE KEY, KEY에서 한글 필드명 변경
        for old_field, new_field in field_mapping.items():
            # PRIMARY KEY에서 변경
            migrated_statement = re.sub(
                rf'PRIMARY KEY \(`{re.escape(old_field)}`\)',
                f'PRIMARY KEY (`{new_field}`)',
                migrated_statement
            )
            
            # UNIQUE KEY에서 변경
            migrated_statement = re.sub(
                rf'UNIQUE KEY ([^(]+) \(`{re.escape(old_field)}`\)',
                rf'UNIQUE KEY \1 (`{new_field}`)',
                migrated_statement
            )
            
            # KEY에서 변경 (복합 키도 처리)
            migrated_statement = re.sub(
                rf'KEY ([^(]+) \([^)]*`{re.escape(old_field)}`[^)]*\)',
                lambda m: m.group(0).replace(f'`{old_field}`', f'`{new_field}`'),
                migrated_statement
            )
        
        return migrated_statement
    
    def process_sql_file(self):
        """
        SQL 파일을 처리하여 마이그레이션을 실행합니다.
        """
        with open(self.input_sql_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # CREATE TABLE 문들을 찾아서 각각 처리
        create_table_pattern = r'(CREATE TABLE `[^`]+`.*?ENGINE=\w+.*?)(?=\n\n--|$)'
        matches = re.findall(create_table_pattern, content, re.DOTALL | re.IGNORECASE)
        
        print(f"Found {len(matches)} CREATE TABLE statements")
        
        migrated_content = content
        
        for i, match in enumerate(matches):
            print(f"Processing table {i+1}/{len(matches)}")
            migrated_table = self.migrate_table(match)
            migrated_content = migrated_content.replace(match, migrated_table)
        
        # 마이그레이션 테이블 생성 SQL 추가
        migration_tables_sql = self.generate_migration_tables_sql()
        migrated_content += "\n\n" + migration_tables_sql
        
        # 결과 파일 저장
        output_sql_path = os.path.join(self.output_dir, "Bid_schema_new.sql")
        with open(output_sql_path, 'w', encoding='utf-8') as f:
            f.write(migrated_content)
        
        # CSV 파일들 저장
        self.save_migration_fields_csv()
        self.save_label_mappings_csv()
        
        print(f"마이그레이션 완료!")
        print(f"- 변경된 스키마: {output_sql_path}")
        print(f"- 필드 마이그레이션 정보: {len(self.migration_fields)} 건")
        print(f"- 라벨 매핑 정보: {len(self.label_mappings)} 건")
    
    def generate_migration_tables_sql(self) -> str:
        """
        마이그레이션 테이블들의 CREATE SQL을 생성합니다.
        """
        return """
-- =============================================
-- Migration Tables
-- =============================================

-- Table: table_migration_fields
CREATE TABLE `table_migration_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `table_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '테이블명',
  `field_src` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '원본 필드명',
  `field_dst` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '변경 필드명',
  `remark` text COLLATE utf8mb4_unicode_ci COMMENT '비고',
  PRIMARY KEY (`id`),
  KEY `idx_table_name` (`table_name`),
  KEY `idx_field_src` (`field_src`),
  KEY `idx_field_dst` (`field_dst`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='필드 마이그레이션 정보';

-- Table: table_field_label_mappings
CREATE TABLE `table_field_label_mappings` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '아이디',
  `table_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '테이블명',
  `field_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '필드키',
  `field_label` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '필드라벨',
  `remark` text COLLATE utf8mb4_unicode_ci COMMENT '비고',
  PRIMARY KEY (`id`),
  KEY `idx_table_field` (`table_name`, `field_key`),
  KEY `idx_field_key` (`field_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='필드 라벨 매핑 정보';
"""
    
    def save_migration_fields_csv(self):
        """
        table_migration_fields.csv 파일을 저장합니다.
        """
        csv_path = os.path.join(self.output_dir, "table_migration_fields.csv")
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'table_name', 'field_src', 'field_dst', 'remark'])
            
            for i, row in enumerate(self.migration_fields, 1):
                writer.writerow([
                    i,
                    row['table_name'],
                    row['field_src'],
                    row['field_dst'],
                    row['remark']
                ])
        
        print(f"CSV 저장: {csv_path}")
    
    def save_label_mappings_csv(self):
        """
        table_field_label_mappings.csv 파일을 저장합니다.
        """
        csv_path = os.path.join(self.output_dir, "table_field_label_mappings.csv")
        
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'table_name', 'field_key', 'field_label', 'remark'])
            
            for i, row in enumerate(self.label_mappings, 1):
                writer.writerow([
                    i,
                    row['table_name'],
                    row['field_key'],
                    row['field_label'],
                    row['remark']
                ])
        
        print(f"CSV 저장: {csv_path}")


def main():
    """메인 실행 함수"""
    input_sql = "/_exp/projects/bid-notice-web/database/migration/Bid_schema_backup_20250831_072842.sql"
    output_dir = "/_exp/projects/bid-notice-web/database/migration"
    
    migrator = SchemaMigrator(input_sql, output_dir)
    migrator.process_sql_file()


if __name__ == "__main__":
    main()