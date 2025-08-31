1. backup_mysql.py

```sh
cd /_exp/projects/bid-notice-web/backend/src/migration/create_new_database.py
uv run backup_mysql.py
```

2. create_new_database.py
```sh
cd /_exp/projects/bid-notice-web/backend/src/migration
uv run create_new_database.py
```

3. backup_mysql.py

```sh
cd /_exp/projects/bid-notice-web/backend/src/migration/create_new_database.py
uv run backup_mysql2.py
```

4. change_tables.py

```sh
cd /_exp/projects/bid-notice-web/backend/src/migration/create_new_database.py
uv run change_tables.py
```

5. update_migration_info.py

```sh
cd /_exp/projects/bid-notice-web/backend/src/migration/create_new_database.py
uv run update_migration_info.py
```

---

원본 sql문을 기준으로 새로운 데이터베이스에 테이블들의 필드명을 변경하고 변경 정보를 table로 저장하려고 해요.

1. 예를 들어, 아래와 같은 1-1.의 CREATE문의 경우 1-2.와 같이, table_migration_fields에 저장합니다.

1-1. 원본 CREATE SQL문
"""
CREATE TABLE `notices` (
  `nid` int(11) NOT NULL AUTO_INCREMENT COMMENT '순번: 공고 아이디',
  `sn` int(11) NOT NULL COMMENT '일련번호',
  `기관명` varchar(40) COLLATE utf8_unicode_ci NOT NULL COMMENT 'org_name: 기관이름',
  ...
"""

1-2. table_migration_fields 테이블
"""
table_migration_fields
id  table_name  field_src   field_dst   remark
1   notices 기관명 org_name    공고 아이디
"""

1.3. 변경된 SQL문
"""
CREATE TABLE `notices` (
  `nid` int(11) NOT NULL AUTO_INCREMENT COMMENT '순번: 공고 아이디',
  `sn` int(11) NOT NULL COMMENT '일련번호',
  `org_name` varchar(40) COLLATE utf8_unicode_ci NOT NULL COMMENT '기관명: 기관이름',
  ...
"""

1.4. table_field_label_mappings(web 등에서 필드의 레이블로 사용할 값 대조) 테이블
"""
table_field_label_mappings

id  table_name  field_key   field_label   remark
1   notices nid org_name    순번    공고 아이디
"""

> 변경 규칙을 아래와 같아요.
0) 생성 파일
- 변경된 CREATE sql은 Bid_schema_new.sql로 저장
    - table_migration_fields 테이블 생성 sql 추가
    - table_field_label_mappings 테이블 생성 sql 추가

- table_migration_fields.csv: table_migration_fields 입력값
- able_field_label_mappings.csv: table_field_label_mappings 입력값

1) COMMENT의 시작 문자가 영어인 경우:
- COMMENT 문자열을 ':'로 split한 배열의 [0] 번째 문자열을 필드명으로 사용하고, 필드명은 COMMENT의 ':' split한 배열의 [0] 번째 문자열로 보낸후 COMMENT로 변경

2) 필드명이 변경된 경우
  - table_migration_fields 에 등록(':'로 split한 배열의 [1] 번째 문자열은 remark)
  - CREATE 문 변경

3) 모든 필드들에 대해 변경된 필드명, 코멘트를 기준으로 table_field_label_mappings에 등록(':'로 split한 배열의 [1] 번째 문자열은 remark)
