
## 중복 리스트

## 세종

td[3]/a[1]|-href|-"https://www.sejong.go.kr/prog/publicNotice/kor/sub02_0302/C2/view.do?not_ancmt_mgt_no=" + rst.split("=")[-1]

### 동대문구
- pageIndex 2, 3 제외시 일치

https://www.ddm.go.kr/www/selectEminwonWebView.do?pageUnit=10&pageIndex=2&searchCnd=all&key=3291&searchNotAncmtSeCode=01,02,04,05,06,07&notAncmtMgtNo=19102

https://www.ddm.go.kr/www/selectEminwonWebView.do?pageUnit=10&pageIndex=3&searchCnd=all&key=3291&searchNotAncmtSeCode=01,02,04,05,06,07&notAncmtMgtNo=19102

=>
https://www.ddm.go.kr/www/selectEminwonWebView.do?&key=3291&searchNotAncmtSeCode=01,02,04,05,06,07&notAncmtMgtNo=19102

https://www.ddm.go.kr/www/selectEminwonWebView.do?key=3291&notAncmtMgtNo=19102

> 변경
td[2]/a|-href|-"https://www.ddm.go.kr/www/" + rst.split("/")[1]
=>
td[3]/a[1]|-href|-"https://www.ddm.go.kr/www/selectEminwonWebView.do?key=" + rst.split("&key")[-1]




### 성동구
- pageIndex 2, 3 제외시 일치

https://www.sd.go.kr/main/selectBbsNttView.do?bbsNo=184&nttNo=345073&&pageUnit=10&key=1473&pageIndex=2

https://www.sd.go.kr/main/selectBbsNttView.do?bbsNo=184&nttNo=345073&&pageUnit=10&key=1473&pageIndex=3

=>
https://www.sd.go.kr/main/selectBbsNttView.do?bbsNo=184&nttNo=345073&key=1473

> 변경
td[2]/a|-href|-"https://www.sd.go.kr/main/" + rst.split("/")[1]
=>
td[2]/a|-href|-"https://www.sd.go.kr/main/" + rst.split("/")[1].split("&pageIndex")[0]

### 군포시청

https://www.gunpo.go.kr/www/selectEminwonView.do?key=3907&Not_ancmt_se_code=&not_ancmt_mgt_no=41170&notAncmtSeCd=01&searchCnd=all&searchKrwd=&pageIndex=2

https://www.gunpo.go.kr/www/selectEminwonView.do?key=3907&Not_ancmt_se_code=&not_ancmt_mgt_no=41170&notAncmtSeCd=01&searchCnd=all&searchKrwd=&pageIndex=2

https://www.gunpo.go.kr/www/selectEminwonView.do?key=3907&Not_ancmt_se_code=01&not_ancmt_mgt_no=41170&notAncmtSeCd=01


=>
https://www.gunpo.go.kr/www/selectEminwonView.do?key=3907&Not_ancmt_se_code=&not_ancmt_mgt_no=41170&notAncmtSeCd=01

> 변경
td[2]/a|-href|-"https://www.gunpo.go.kr/www/" + rst.split("/")[1]
=>
td[2]/a|-href|-"https://www.gunpo.go.kr/www/selectEminwonView.do?key=" + rst.split("&key")[-1]





### 강남구
https://www.gangnam.go.kr/notice/view.do?not_ancmt_mgt_no=57795&mid=ID05_04021

https://www.gangnam.go.kr/notice/view.do?not_ancmt_mgt_no=57795&mid=ID05_0402&pgno=2&keyfield=BNI_MAIN_TITLE&lists=10&deptField=BNI_DEP_CODE

https://www.gangnam.go.kr/notice/view.do?not_ancmt_mgt_no=57921&mid=ID05_040201&pgno=1&keyfield=BNI_MAIN_TITLE&keyword=%EC%95%88%EC%A0%84&lists=10&deptField=BNI_DEP_CODE


=>
https://www.gangnam.go.kr/notice/view.do?not_ancmt_mgt_no=57795

> 변경
td[3]/a|-href|-"https://www.gangnam.go.kr" + rst
=>
td[3]/a|-href|-"https://www.gangnam.go.kr" + rst.split("&")[0]


https://www.gangnam.go.kr/notice/view.do?not_ancmt_mgt_no=57930&mid=ID05_040201

### 용산구
https://www.yongsan.go.kr/portal/bbs/B0000095/view.do?nttId=689259&menuNo=200233&pageUnit=10&pageIndex=2

https://www.yongsan.go.kr/portal/bbs/B0000095/view.do?nttId=689259&menuNo=200233&pageUnit=10&pageIndex=1

=>
https://www.yongsan.go.kr/portal/bbs/B0000095/view.do?nttId=689259&menuNo=200233

> 변경
td[3]/a|-href|-"https://www.yongsan.go.kr" + rst
=>
td[3]/a|-href|-"https://www.yongsan.go.kr" + rst.split("&pageUnit")[0]


### 수자원공사
https://www.kwater.or.kr/news/sub01/noti01View.do?seq=137743&brdId=KO27&orderByField=&orderByDirection=&s_mid=105&pageNo=2

https://www.kwater.or.kr/news/sub01/noti01View.do?seq=137743&brdId=KO27&orderByField=&orderByDirection=&s_mid=105&pageNo=3


=>
https://www.kwater.or.kr/news/sub01/noti01View.do?seq=137743&brdId=KO27&orderByField=&orderByDirection=&s_mid=105

> 변경
td[4]/a|-href|-"https://www.kwater.or.kr" + rst
=>
td[4]/a|-href|-"https://www.kwater.or.kr" + rst.split("&pageNo")[0]


### 한국철도공사

https://info.korail.com/info/selectBbsNttView.do;jsessionid=tIiWZytea1IaH93cLFvaif6NovUdHQSSG9qpXjJv16i0El3KvvT1clhTqta0osaV?key=910&bbsNo=200&nttNo=24270&searchCtgry=&searchCnd=all&searchKrwd=&integrDeptCode=&pageIndex=1

https://info.korail.com/info/selectBbsNttView.do;jsessionid=tlCER1MWtafQCpuyf6L7ZLRj9TCdl4AoPq41jzk0ArknEegqv1VhSlfx5ciXxiBl?key=910&bbsNo=200&nttNo=24270&searchCtgry=&searchCnd=all&searchKrwd=&integrDeptCode=&pageIndex=1

=>
https://info.korail.com/info/selectBbsNttView.do?key=910&bbsNo=200&nttNo=24270


> 변경
td[2]/a|-href|-"https://info.korail.com/info/" + rst.split("/")[1]
=>
td[2]/a|-href|-"https://info.korail.com/info/selectBbsNttView.do?key=" + rst.split("key=")[1].split("&search")[0]

### 화성시청

https://eminwon.hscity.go.kr/emwp/gov/mogaha/ntis/web/ofr/action/OfrAction.do?epcCheck=&jndinm=OfrNotAncmtEJB&context=NTIS&method=selectOfrNotAncmt&methodnm=selectOfrNotAncmtRegst&homepage_pbs_yn=Y&subCheck=Y&not_ancmt_mgt_no=130600

https://eminwon.hscity.go.kr/emwp/gov/mogaha/ntis/web/ofr/action/OfrAction.do?epcCheck=&jndinm=OfrNotAncmtEJB&context=NTIS&method=selectOfrNotAncmt&methodnm=selectOfrNotAncmtRegst&homepage_pbs_yn=Y&subCheck=Y&not_ancmt_mgt_no=130881