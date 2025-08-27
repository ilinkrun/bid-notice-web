http://localhost:3011/settings/list 에서 항목을 클릭했을 때, 나타나는 모달의 내용은 settingsList 을 사용해서 불러와 주세요.
아래와 같은 응답이 있을 경우

기관명: 기관명값     지역: 인천
url: @https://www.gp22.go.kr/portal/selectGosiList.do?key=2148&not_ancmt_se_code=01 
행xpath: //*[@id=\"board\"]/table/tbody/tr
페이징: //div[contains(@class, \"pagination\")]/span/a[contains(text(),\"${i}\")]
시작 페이지: 1   마지막 페이지: 3
제외항목: [  ]  등록 [  ]  사용 [  ]
-----
스크랩 요소

key  | xpath | attribute | callback
제목 | td[4]/a |   | 
상세페이지주소 | td[4]/a | href | "https://www.gp.go.kr/portal/" + rst.split("/")[1]
...


----
{
  "url": "https://www.gp22.go.kr/portal/selectGosiList.do?key=2148&not_ancmt_se_code=01",
  "iframe": null,
  "rowXpath": "//*[@id=\"board\"]/table/tbody/tr",
  "paging": "//div[contains(@class, \"pagination\")]/span/a[contains(text(),\"${i}\")]",
  "startPage": 1,
  "endPage": 3,
  "login": null,
  "elements": [
    {
      "key": "제목",
      "xpath": "td[4]/a"
    },
    {
      "key": "상세페이지주소",
      "xpath": "td[4]/a",
      "target": "href",
      "callback": "\"https://www.gp.go.kr/portal/\" + rst.split(\"/\")[1]"
    },
    {
      "key": "작성일",
      "xpath": "td[3]"
    },
    {
      "key": "작성자",
      "xpath": "td[5]"
    }
  ],
  "지역": "인천",
  "등록": 1
}

===

`C:\JnJ\Developments\Servers\nextjs\ilmac-bid\src\app\settings\list\page.tsx` 파일을 참고하여,

`C:\JnJ\Developments\Servers\nextjs\ilmac-bid\src\app\settings\detail\page.tsx` 파일을 구현해주세요.

graphql 은 아래의 2개의 쿼리를 참고해주세요.

  settingsDetails {
    title
    orgName
  }


  settingDetail(orgName: $orgName) {
    orgName
    elements {
      key
      xpath
      target
      callback
    }
  }

