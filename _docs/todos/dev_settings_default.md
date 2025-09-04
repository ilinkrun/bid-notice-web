## 앱 기본값 설정 페이지 수정
~~~~
- 메뉴: 설정 > 앱 기본값 설정

- url: http://14.34.23.70:11501/settings/default

- 페이지 구조

"""

[아이콘] NAS 설정

- [아이콘] NAS 폴더(<- settings_nas_path)

| 순번 | 이름 | 사용영역 | 깊이 | 폴더명 | 비고 |
| 1 | root | all |  1 | /nas/_ilmac | root |
| 2 | 공사점검 | notice |  2 | 24_공사점검 |  |
...

- [아이콘] NAS 정보
  - Synology NAS
  - ...

"""

---

[아이콘] UI 설정

  - [] 다크모드 [X] 라이트모드
  - ...

[아이콘] 테마 색상 설정
  - 기본 테마: gray
  - 공고 목록: green
  - 입찰 목록: blue

---


[아이콘] 스크랩 설정

- 스크랩 주기: 매일 10, 22시
- ...

---

## 수정 대상 및 참고 파일

- frontend:
  - /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/settings/default/page.tsx

- graphql: 신규 생성!!
  - /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/api/graphql/resolvers/settingsDefault.ts
  - /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/frontend/src/app/api/graphql/schema/settingsDefault.ts

- backend:
  - /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/src/server_bid.py
  - /volume1/docker/platforms/ilmac-ubuntu-dev/projects/bid-notice-web/backend/src/mysql_settings.py

- database:
"""
CREATE TABLE `settings_nas_path` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '순번: 아이디',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '이름',
  `area` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '영역',
  `depth` tinyint(4) NOT NULL DEFAULT '0',
  `folder` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '폴더',
  `remark` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '비고',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='설정(NAS 폴더 경로)'
"""
