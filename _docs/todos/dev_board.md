- 글 수정 모드 http://14.34.23.70:11501/channels/board/dev/1?mode=edit 에서
에디터를 'Markdown'으로 선택했을 때, 편집 영역에 글이 html로 뜹니다. markdown으로 뜨도록 해주세요.
- 'Markdown' 에디터 우측의 미리보기 섹션에 미리보기 중, li에는 글 앞에 블릿 모양이 나타나도록 해주세요.
- markdown 으로 편집할 때는 주소가 http://14.34.23.70:11501/channels/board/dev/1?mode=edit&format=markdown 로 변경되도록 해주세요.

## 제목

> 이미지

![테스트이미지](/uploads/1756721513771-t63wnc.jpeg)

- 블릿 1
  - 블릿 1-1
- 블릿 2
  - 블릿 2-1
  - 블릿 2-2

```python
def test():
    print('test')
```



글 수정 모드는 '저장' 버튼 클릭시, 변경 사항 저장후 
  상세 페이지로 이동(redirect)하는 기능만 추가하면 
  괜찮네요.

===

http://14.34.23.70:11501/channels/board/dev
에서 '글쓰기' 버튼을 누르고 글을 쓴 후 저장했더니,

게시글 생성에 실패했습니다: Request failed with status code 500


- '글쓰기' 주소를 '/channels/board/[board]/new'로 해주세요.
- 글쓰기의 기능은 글 수정 페이지를 참고하여 구현해주세요.
- 글쓰기도 글 수정과 같이 markdown 모드를 default로 하고, html로 글쓰는 것은 비활성화(html 버튼 비활성화)해주세요.
'/channels/board/[board]/new' = ''/channels/board/[board]/new?format=markdown'
- '글쓰기'는 저장후 목록 페이지로 이동(redirect)하도록 해주세요.
- 글 저장시 markdown_source, content를 모두 저장하도록 해주세요.

====

- 글 내용 상세 페이지에서 글 제목 섹션과 글 내용 섹션, 댓글 섹션이 부드럽게 구분되도록 배경색을 옅은 색으로 다르게 넣어주세요


