"""
http://14.34.23.70:11501/api/graphql
"""

```gql
query Notices($gap: Int) {
  notices(gap: $gap) {
    category
    nid
  }
}

{
  "gap": 1
}
```


```gql
query NoticesByCategory($category: String!) {
  noticesByCategory(category: $category) {
    category
  }
}

{
  "category": "무관"
}
```
