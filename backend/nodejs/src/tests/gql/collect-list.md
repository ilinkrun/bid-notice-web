
```graphql
mutation {
    collectListWithSettings(settings: {
      oid: 2
      orgName: "가평군청"
      url: "https://www.gp.go.kr/portal/selectGosiList.do?key=2148&not_ancmt_se_code=01"
      rowXpath: "//*[@id=\"board\"]/table/tbody/tr"
      paging: "//div[contains(@class, \"pagination\")]/span/a[contains(text(),\"${i}\")]"
      startPage: 1
      endPage: 3
      use: 1
      orgRegion: "인천"
      registration: "1"
      title: "td[4]/a"
      detailUrl: "td[4]/a"
      postedDate: "td[3]"
      postedBy: "td[5]"
    }) {
      orgName
      errorCode
      errorMessage
      data {
        title
        detailUrl
        postedAt
        orgName
      }
    }
  }

---


```graphql
mutation {
  collectListWithSettings(settings: {
    oid: 107
    orgName: "한국공항공사"
    url: "https://www.airport.co.kr/www/cms/frCon/index.do?MENU_ID=870"
    rowXpath: "//*[@id=\"tbody\"]/tr"
    paging: "//ul[@class=\"paging\"]/li/button[contains(text(),\"${i}\")]"
    startPage: 1
    endPage: 3
    use: 1
    orgRegion: "전국"
    registration: "1"
    title: "td[2]/a"
    detailUrl: "td[2]/a"
    postedDate: "td[5]/span"
    postedBy: "td[4]/span"
  }) {
    orgName
    errorCode
    errorMessage
    data {
      title
      detailUrl
      postedAt
      orgName
    }
  }
}
```