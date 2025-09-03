## spider_list.py

```sh
root@10460f19ff54:/_exp/projects/bid-notice-web/backend/src# uv run spider_list.py
```

[X] playwright install 에러
- Dockerfile 에서 `RUN ... playwright install ... `

[] notice_list, logs_notice_scraping의 nid, id가 1부터 시작되지 않음
- 사용하던 데이터베이스를 변경하고, table 이름, field 이름 등을 변경하고 notice_list, logs_notice_scraping 등에 있던 데이터도 삭제하였는데, /_exp/projects/bid-notice-web/_docs/backend/src/server_spider.py 를 실행하면 notice_list, logs_notice_scraping의 nid, id가 1부터 시작되지 않네요.


===

### select mid, title, `status` from my_bids;
- 목록
    6	강동구 건설공사 안전점검 수행기관 지정 공고 [성내동 457 근린생활시설 신축공사]	진행
    7	「서초동 1577-12 외 1필지 근린생활시설 신축공사」 안전점검 수행기관 지정 결과 공고	진행
- 삭제
  - my_bids에 status = NULL / mid: 1~5
  - 신사동 629-38 근린생활시설 해체공사

### select title, category, is_selected from notice_list where is_selected = 1;

2392	안전점검 수행기관 지정 공고「신사동 629-38 근린생활시설 해체공사」	공사점검	1
2414	강동구 건설공사 안전점검 수행기관 지정 공고 [성내동 457 근린생활시설 신축공사]	공사점검	1
3229	「서초동 1577-12 외 1필지 근린생활시설 신축공사」 안전점검 수행기관 지정 결과 공고	공사점검	1
5340	2025년 초등학교 2학기 개학기 위해요소 안전점검 및 단속 새글	기타	1


=====
### '진행' 처리 중 에러

5340	2025년 초등학교 2학기 개학기 위해요소 안전점검 및 단속 새글	기타	1

=> 에러 로그에 남길 것
- notice_list: is_selected = 1
- notice_detail: 데이터 insert 안됨
- my_bids: 데이터 insert 안됨