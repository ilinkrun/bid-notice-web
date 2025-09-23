===

- json /exposed/projects/bid-notice-web/backend/python/src/data_go_kr/responses/res_0913_15_51_50.json 응답 데이터(items)를 저장할 mysql 테이블을 생성하는 sql문을 만들어주세요. item의 key를 그대로(camel case) column 이름으로 사용해주세요.
- /exposed/projects/bid-notice-web/backend/python/src/data_go_kr/docs/spec_12.md 파일의 내용을 참고하여 데이터타입, 코멘트를 적용시켜주세요.
- sql문은 /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/python/src/data_go_kr/docs/table_12.sql 파일의 내용과 같이 컬럼별 설정을 1줄로 줄바꿈을 하고, sql 구문 오류가 있는지, 저장전에 다시 한번 확인하고, create_table_12.sql로 저장해주세요.

---

테스트 파일 /exposed/projects/bid-notice-web/backend/python/src/data_go_kr/test_bid_api.py 에서 결과값을 /exposed/projects/bid-notice-web/backend/python/src/data_go_kr/docs/table_12.sql 을 참고하여, mysql notices_g2b 테이블에 저장하는 코드를 생성해주세요. items

- mysql 연결 및 래퍼함수들은 /exposed/projects/bid-notice-web/backend/python/src/utils/utils_mysql.py 를 참고해주세요.
