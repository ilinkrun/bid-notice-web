## spider_list.py

```sh
root@10460f19ff54:/_exp/projects/bid-notice-web/backend/src# uv run spider_list.py
```

[X] playwright install 에러
- Dockerfile 에서 `RUN ... playwright install ... `

[] notice_list, logs_notice_scraping의 nid, id가 1부터 시작되지 않음
- 사용하던 데이터베이스를 변경하고, table 이름, field 이름 등을 변경하고 notice_list, logs_notice_scraping 등에 있던 데이터도 삭제하였는데, /_exp/projects/bid-notice-web/_docs/backend/src/server_spider.py 를 실행하면 notice_list, logs_notice_scraping의 nid, id가 1부터 시작되지 않네요.