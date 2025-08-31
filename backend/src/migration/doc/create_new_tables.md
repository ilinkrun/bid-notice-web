
## database 생성

```sql
CREATE DATABASE IF NOT EXISTS ilmac_bid_db;
```

1. table 생성

- /_exp/projects/bid-notice-web/backend/src/migration/data/Bid_schema_new.sql


2. table 입력

- /_exp/projects/bid-notice-web/backend/src/migration/data/table_field_label_mappings.csv

- /_exp/projects/bid-notice-web/backend/src/migration/data/table_migration_fields.csv



3. table 이름 변경

/_exp/projects/bid-notice-web/backend/src/migration/data/migration_table_mappings.csv

4. table 갱신
- table_field_label_mappings, table_migration_fields 
/_exp/projects/bid-notice-web/backend/src/migration/data/migration_table_mappings.csv