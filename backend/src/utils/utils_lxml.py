import time
from lxml.html import fromstring
from lxml.etree import tostring
from lxml import etree
import requests
from utils.utils_data import valid_str, decode_html_text
import codecs
import html
import re
import urllib
from urllib.parse import unquote
import os

SEPERATOR = "|-"

# ** sub functions(callback)
# * list


def _today(sep="-"):
  return time.strftime("%Y" + sep + "%m" + sep + "%d",
                       time.localtime(time.time()))


def _get_outerhtml(nodes, joiner=SEPERATOR):
  return joiner.join([str(node.text_content().strip()) for node in nodes])


def _get_outerhtml(el):
  html_bytes = tostring(el, encoding='utf-8', pretty_print=True)
  # print(html_bytes)
  # 노드의 HTML만 반환하도록 수정
  # 노드를 새로운 문서의 루트로 만들어 HTML을 생성
  rst = html_bytes.decode('utf-8').replace("&#13;",
                                           "").replace("\n",
                                                       "").replace("\t",
                                                                   "").strip()
  # print(rst)
  # 추가 부모 태그가 있는지 확인하고 잘라내기
  end_tag = f"</{el.tag}>"
  if end_tag in rst:
    end_index = rst.find(end_tag) + len(end_tag)
    rst = rst[:end_index]
  return rst


def _get_innerhtml(el):
  # HTML 노드를 문자열로 변환
  html_bytes = tostring(el, encoding='utf-8', pretty_print=True)
  html_str = html_bytes.decode('utf-8')

  # 최외곽 태그를 'div'로 교체 (문자열 처리 방식)
  # 시작 태그 찾기
  start_tag_end = html_str.find('>') + 1
  # 끝 태그 찾기
  end_tag_start = html_str.rfind('</')

  if start_tag_end > 0 and end_tag_start > 0:
    # 시작 태그와 끝 태그 교체
    html_str = '<div>' + html_str[start_tag_end:end_tag_start] + '</div>'

  return html_str


def get_val(root, xpath, target, joiner=SEPERATOR):
  """root, xpath, target => value
  """
  #   print(f"@@@ get_val 호출: xpath={xpath}, target={target}")
  if not valid_str(xpath):
    # print("@@@ xpath가 유효하지 않음")
    return ""

  try:
    # 상대 경로인 경우 현재 노드를 기준으로 검색
    if xpath.startswith('./'):
      # 노드 내에서 상대 경로 검색
      # print(f"@@@ 상대 경로 처리: {xpath}")
      xpath = xpath[1:] if xpath.startswith('.') else xpath

    nodes = root.xpath(xpath)
    # print(f"@@@ xpath='{xpath}'로 {len(nodes)}개 노드 발견")

    if nodes is None or len(nodes) == 0:
      #   print(f"@@@ xpath='{xpath}'에 해당하는 노드 없음") !! TODO: 에러 발생
      return ""
  except Exception as e:
    print(f"@@@ xpath 실행 중 오류: {str(e)}")
    # print(f"@@@ root: {type(root)}, xpath: {xpath}, target: {target}")
    return ""


#   if target == "content":
#     print(f"!!!! BEFORE content 값: {str(nodes)}")

  try:
    if target == "text" or target is None:
      # text() 노드를 명시적으로 찾아서 처리
      text_nodes = root.xpath(xpath + "/text()")
      if text_nodes and len(text_nodes) > 0:
        rst = " ".join(
            [txt.strip() for txt in text_nodes if txt.strip() != ""])
        # print(f"@@@ text 노드에서 값 추출: {rst}")
      else:
        # text_content() 메서드 사용
        if len(nodes) == 1:
          rst = nodes[0].text_content().strip()
        else:
          rst = joiner.join(
              [str(node.text_content().strip()) for node in nodes])
        # print(f"@@@ text_content()로 값 추출: {rst}")
    elif target == "content":
      #   print(f"!!!! content 값: {str(nodes)}")
      rst = joiner.join([str(node.text_content().strip()) for node in nodes])
    #   print(f"!!! content 값: {rst}")
    elif target == "first":  # content 중 첫번째 요소만
      rst = str(nodes[0].text_content().strip())
    #   print(f"!!! content 값: {rst}")
    elif target == "outerhtml":
      rst = _get_outerhtml(nodes[0])
    #   # HTML 노드를 문자열로 변환
    #   html_bytes = tostring(nodes[0], encoding='utf-8', pretty_print=True)
    #   # print(html_bytes)
    #   # 노드의 HTML만 반환하도록 수정
    #   # 노드를 새로운 문서의 루트로 만들어 HTML을 생성
    #   rst = html_bytes.decode('utf-8').replace("&#13;", "").replace("\n", "").replace("\t", "").strip()
    #   # print(rst)
    #   # 추가 부모 태그가 있는지 확인하고 잘라내기
    #   end_tag = f"</{nodes[0].tag}>"
    #   if end_tag in rst:
    #     end_index = rst.find(end_tag) + len(end_tag)
    #     rst = rst[:end_index]
    elif target == "innerhtml" or target == "html":
      rst = _get_innerhtml(nodes[0])
    #   # HTML 노드를 문자열로 변환
    #   html_bytes = tostring(nodes[0], encoding='utf-8', pretty_print=True)
    #   html_str = html_bytes.decode('utf-8')

    #   # 최외곽 태그를 'div'로 교체 (문자열 처리 방식)
    #   # 시작 태그 찾기
    #   start_tag_end = html_str.find('>') + 1
    #   # 끝 태그 찾기
    #   end_tag_start = html_str.rfind('</')

    #   if start_tag_end > 0 and end_tag_start > 0:
    #     # 시작 태그와 끝 태그 교체
    #     html_str = '<div>' + html_str[start_tag_end:end_tag_start] + '</div>'

    #   rst = html_str
    else:
      # 속성 값 가져오기
      values = []
      for node in nodes:
        attr_val = node.get(target, "").strip()
        values.append(attr_val)
        # print(f"@@@ 노드 속성 '{target}' 값: {attr_val}")
      rst = joiner.join(values)
      # print(f"@@@ 최종 속성 값: {rst}")

    return rst.strip() if rst is not None else ""
  except Exception as e:
    # print(f"@@@ 값 추출 중 오류: {str(e)}")
    return ""


def get_rows(html, rowXpath, elements, cb_after_row=None, cb_after_rows=None):
  """html, rowXpath, elements, ... => get elements values(dicts)
  cb_after_row: row당 콜백, cb_after_rows: rows 완료후 콜백
  """
  # 디버깅 로그 추가
  # print("@@@ get_rows 시작")
  # print(f"@@@ rowXpath: {rowXpath}")
  # print(f"@@@ elements 타입: {type(elements)}")
  # print(f"@@@ elements: {elements}")

  rows = []
  nodes = fromstring(html).xpath(rowXpath)
  # print(f"@@@ rowXpath 노드 개수: {len(nodes)}")

  els = {}
  try:
    for element in elements:  # TODO: element.get을 1회만 하도록 변경
      # print(f"@@@ 처리 중인 element: {element}")
      key = element.get("key", None)
      xpath = element.get("xpath", None)
      target = element.get("target", None)
      callback = element.get("callback", None)
      # print(f"@@@ key: {key}, xpath: {xpath}, target: {target}, callback: {callback}")

      if valid_str(key) and valid_str(xpath):
        els[key] = tuple([xpath, target, callback])
  except Exception as e:
    # print(f"@@@ elements 처리 중 오류: {str(e)}")
    raise

  # print(f"@@@ 처리된 els: {els}")

  for idx, node in enumerate(nodes):
    # print(f"@@@ 노드 {idx+1}/{len(nodes)} 처리 중")
    row = {}
    rst = ""
    try:
      for (key, (xpath, target, callback)) in els.items():
        # print(f"@@@ 키 '{key}' 처리 중, xpath: {xpath}, target: {target}")
        # * 각 element data 반환
        rst = get_val(node, xpath, target)

        # * 데이터 후처리(callback)
        if callback is not None:
          # print(f"@@@ '{key}'의 callback 실행: {callback}")
          try:
            if not rst or rst.strip() == '':
              # print(f"@@@ 경고: '{key}'의 값이 비어 있어 callback 건너뜀")
              rst = ""
            else:
              rst = eval(callback) if ("(" in callback) or (
                  "rst" in callback) else callback
              # print(f"@@@ callback 실행 후 '{key}'의 값: {rst}")
          except Exception as e:
            # print(f"@@@ callback 실행 중 오류: {str(e)}, 원본 값 유지")
            # 에러 발생 시 원본 값 유지
            pass

        row[key] = rst if rst is not None else ""

        # * 데이터 후처리(row)
        if cb_after_row is not None:
          # print(f"@@@ '{key}'의 cb_after_row 실행")
          cb_after_row(row, key, rst)
    except Exception as e:
      # print(f"@@@ 노드 {idx+1} 처리 중 오류 발생: {str(e)}")
      # 오류 발생 시 해당 노드의 HTML 출력
      # print(f"@@@ 문제의 노드 HTML: {tostring(node, encoding='utf-8')}")
      raise

    # * 데이터 후처리(rows)
    try:
      if cb_after_rows is not None:
        # print(f"@@@ cb_after_rows 실행")
        cb_after_rows(rows, row, key, rst)
    except Exception as e:
      # print(f"@@@ cb_after_rows 처리 중 오류: {str(e)}")
      raise

  # print(f"@@@ 최종 추출된 행 개수: {len(rows)}")
  return rows


# * Detail Page
def get_dict(html, elements, cb_on_key={}):
  dct = {}
  root = fromstring(html)

  for element in elements:
    key = element.get("key", None)
    xpath = element.get("xpath", None)
    target = element.get("target", None)
    callback = element.get("callback", None)

    if not valid_str(key) or not valid_str(xpath):  # key나 xpath가 없는 경우
      continue

    if key in cb_on_key.keys():  # 별도 콜백이 있는 경우
      # print(f"@@@@ 별도 콜백: {key}")
      rs = cb_on_key[key](root, xpath, target, callback)
      if (rs is not None):
        dct[key] = rs
    else:  # 별도 콜백이 없는 경우
      rst = get_val(root, xpath, target)

      # TODO: callback 실행
      if callback:
        if "rst" in callback:
          # print(f"**callback key({key}): {callback}, rst: |{rst}|")
          try:
            rst = eval(callback)
          except BaseException:
            pass
        else:
          # pass
          rst = callback
      dct[key] = rst

  return dct


def remove_els_from_html(html_string, xpaths=[]):
  """
  HTML 문자열에서 주어진 XPath들에 해당하는 요소들을 제거합니다.

  Args:
      html_string (str): 처리할 HTML 문자열
      xpaths (list): 제거할 요소들의 XPath 목록 (예: ['//script', '//style', '//comment()'])

  Returns:
      str: 요소들이 제거된 HTML 문자열
  """
  try:
    # HTML 문자열을 파싱하여 트리 생성
    tree = fromstring(html_string)

    # 각 XPath에 대해 요소 제거
    for xpath in xpaths:
      elements = tree.xpath(xpath)

      # 찾은 요소들 제거
      for element in elements:
        parent = element.getparent()
        if parent is not None:  # 부모 요소가 있는 경우만 제거
          parent.remove(element)

    # 수정된 HTML 트리를 문자열로 변환
    # cleaned_html = str(tostring(tree, encoding='utf-8', pretty_print=True))
    cleaned_html = tostring(tree,
                            encoding='unicode',
                            pretty_print=True,
                            method='html')
    return cleaned_html

  except Exception as e:
    print(f"HTML 요소 제거 중 오류 발생: {e}")
    return html_string  # 오류 발생 시 원본 HTML 반환


# *


def remove_scripts_from_html(html_string):
  """
  HTML 문자열에서 script 태그를 보다 강력하게 제거

  Args:
      html_string: 처리할 HTML 문자열

  Returns:
      script 태그가 제거된 HTML 문자열
  """
  try:
    # 1. 정규표현식으로 먼저 간단하게 script 태그 제거
    # html_string = html_string.replace("script", "SCR")
    pattern = r'^\s+$'
    html_string = re.sub(pattern, '', html_string, flags=re.MULTILINE)
    html_string = re.sub('\n{2,}', '\n', html_string)

    pattern = r'<!--.*?-->'
    html_string = re.sub(pattern, '', html_string, flags=re.DOTALL)

    pattern = r'<script[^>]*>.*?</script>'
    html_string = re.sub(pattern, '', html_string, flags=re.DOTALL)

    return html_string

    # 2. HTML 파싱
    # tree = fromstring(html_string)

    # # 3. 남아있는 script 태그 찾기
    # script_elements = tree.xpath('//script')

    # # 4. 각 script 태그 제거
    # for script in script_elements:
    #     parent = script.getparent()
    #     if parent is not None:  # 부모 요소가 있는 경우에만 제거
    #         parent.remove(script)

    # # 5. HTML로 직렬화
    # clean_html = etree.tostring(tree, encoding='unicode', method='html')

    # # 6. 혹시 남아있는 script 태그를 정규표현식으로 한 번 더 제거
    # final_clean_html = re.sub(pattern, '', clean_html, flags=re.DOTALL)

    # return final_clean_html

  except Exception as e:
    print(f"HTML에서 script 제거 중 오류 발생: {e}")
    return html_string  # 오류 발생 시 원본 HTML 반환


# *


def download_by_url(url, output_dir='downloads', filename=None):
  """URL에서 파일을 다운로드하여 지정된 디렉토리에 저장합니다.

  Args:
    url (str): 다운로드할 파일의 URL
    output_dir (str): 다운로드한 파일을 저장할 디렉토리 (기본값: 'downloads')
    filename (str, optional): 저장할 파일 이름. 지정하지 않으면 URL에서 추출하거나 임시 이름 사용

  Returns:
    str: 다운로드한 파일의 경로. 실패 시 None 반환
  """
  try:
    # URL 디코딩
    # decoded_url = unquote(url)
    decoded_url = unquote(url)
    # print(f"decoded_url: {decoded_url}")

    # 출력 디렉토리가 없으면 생성
    if not os.path.exists(output_dir):
      os.makedirs(output_dir)

    # 파일명이 지정되지 않은 경우 URL에서 추출
    if not filename:
      filename = os.path.basename(urllib.parse.urlparse(decoded_url).path)
      # URL에서 파일명을 추출할 수 없는 경우 임시 이름 사용
      if not filename:
        filename = f"download_{int(time.time())}"

    # 파일 경로 생성
    file_path = os.path.join(output_dir, filename)

    # 파일 다운로드
    response = requests.get(decoded_url, stream=True)
    response.raise_for_status()  # 오류 발생 시 예외 발생

    # 파일 저장
    total_size = 0
    with open(file_path, 'wb') as f:
      for chunk in response.iter_content(chunk_size=8192):
        if chunk:
          total_size += len(chunk)
          f.write(chunk)
          print(f"다운로드 중... {total_size} bytes 받음", end='\r')

    print(f"\n파일이 성공적으로 다운로드되었습니다: {file_path}")
    print(f"파일 크기: {total_size} bytes")
    return file_path

  except requests.Timeout:
    print("오류: 요청 시간 초과")
    return None
  except requests.ConnectionError:
    print("오류: 서버에 연결할 수 없습니다")
    return None
  except Exception as e:
    print(f"다운로드 중 오류 발생: {str(e)}")
    return None


def download_by_url_with_headers(url,
                                 output_dir='downloads',
                                 filename=None,
                                 headers=None):
  """
  URL에서 파일을 다운로드합니다. 기본 헤더에 사용자 정의 헤더를 덮어쓰는 방식으로 적용합니다.

  Args:
      url (str): 다운로드 URL
      output_dir (str): 다운로드한 파일을 저장할 디렉토리 (기본값: 'downloads')
      filename (str, optional): 저장할 파일 이름. 지정하지 않으면 서버에서 제공하는 이름 사용
      headers (dict, optional): 추가할 사용자 정의 헤더

  Returns:
      str: 다운로드한 파일의 경로. 실패 시 None 반환
  """
  try:
    # 출력 디렉토리가 없으면 생성
    if not os.path.exists(output_dir):
      os.makedirs(output_dir)

    # 세션 생성
    session = requests.Session()

    # 먼저 메인 페이지 방문하여 쿠키 획득
    parsed_url = urllib.parse.urlparse(url)
    main_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
    session.get(main_url, verify=False)

    # 기본 헤더 설정
    default_headers = {
        'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Upgrade-Insecure-Requests': '1'
    }

    # 사용자 정의 헤더가 있으면 기본 헤더에 덮어쓰기
    if headers:
      default_headers.update(headers)

    print(f"GET 요청 시도 중... URL: {url}")
    print(f"사용 헤더: {default_headers}")

    # GET 요청으로 파일 다운로드
    response = session.get(
        url,
        headers=default_headers,
        stream=True,
        verify=False,  # SSL 인증서 검증 비활성화
        timeout=300,
        allow_redirects=True)

    # 응답 확인
    print(f"서버 응답 코드: {response.status_code}")
    print(f"응답 헤더: {response.headers}")

    if response.status_code != 200:
      print(f"오류: 서버 응답 코드 {response.status_code}")
      print(f"응답 내용: {response.text[:500]}")  # 응답 내용 일부 출력
      return None

    # 파일명 결정
    if not filename:
      # Content-Disposition 헤더에서 파일명 추출 시도
      if 'Content-Disposition' in response.headers:
        disposition = response.headers['Content-Disposition']
        print(f"Content-Disposition: {disposition}")
        if 'filename*=UTF-8' in disposition:
          # UTF-8 인코딩된 파일명 처리
          filename_match = re.search(r"filename\*=UTF-8''(.+)", disposition)
          if filename_match:
            filename = urllib.parse.unquote(filename_match.group(1))
        else:
          # 일반 filename 처리
          filename_match = re.search(r'filename="?([^"]+)"?', disposition)
          if filename_match:
            filename = filename_match.group(1)

      # URL에서 파일명 추출 시도
      if not filename:
        filename = os.path.basename(urllib.parse.urlparse(url).path)

      # 여전히 파일명이 없으면 임시 이름 생성
      if not filename:
        filename = f"download_{int(time.time())}"

    print(f"저장할 파일명: {filename}")

    # 파일 저장
    file_path = os.path.join(output_dir, filename)
    total_size = 0
    with open(file_path, 'wb') as f:
      for chunk in response.iter_content(chunk_size=8192):
        if chunk:
          total_size += len(chunk)
          f.write(chunk)
          print(f"다운로드 중... {total_size} bytes 받음", end='\r')

    print(f"\n파일이 성공적으로 다운로드되었습니다: {file_path}")
    print(f"파일 크기: {total_size} bytes")
    return file_path

  except requests.Timeout:
    print("오류: 요청 시간 초과")
    print("타임아웃 값을 늘리거나 서버 상태를 확인해주세요.")
    return None
  except requests.ConnectionError:
    print("오류: 서버에 연결할 수 없습니다")
    print("네트워크 연결 상태나 서버 상태를 확인해주세요.")
    return None
  except Exception as e:
    print(f"다운로드 중 오류 발생: {str(e)}")
    return None
  finally:
    if 'session' in locals():
      session.close()
