import re
from datetime import datetime
import codecs
import html
import os
from dotenv import load_dotenv

# .env 파일의 경로 설정 (상위 디렉토리에 있는 .env 파일을 로드)
dotenv_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
# print(f"ENV 파일 경로: {dotenv_path}")
dotenv_path = './.env'

# .env 파일 로드
load_dotenv(dotenv_path)


def save_html(html, filename):
  """html 문자열을 파일로 저장하는 함수"""
  with open(filename, "w", encoding="utf-8") as f:
    f.write(html)


def load_html(file_path):
  try:
    with open(file_path, 'r', encoding='utf-8') as file:
      content = file.read()
    return content
  except UnicodeDecodeError:
    # UTF-8로 읽기 실패한 경우 다른 인코딩 시도
    with open(file_path, 'r', encoding='cp949') as file:  # 한글 파일에 자주 사용되는 인코딩
      content = file.read()
    return content
  except Exception as e:
    print(f"파일 읽기 오류: {e}")
    return None


def _now(format="%Y-%m-%d %H:%M:%S"):
  """현재 시간을 KST 타임존으로 반환"""
  from datetime import timezone, timedelta
  kst = timezone(timedelta(hours=9))
  return datetime.now(kst).strftime(format)
  # """현재 시간을 항상 KST 타임존(Asia/Seoul)으로 반환"""
  # import pytz
  # kst = pytz.timezone('Asia/Seoul')
  # return datetime.now(kst).strftime(format)
  # """현재 시간을 시스템 타임존(Asia/Seoul)으로 반환"""
  # return datetime.now().strftime(format)



# ** utils


def valid_str(val):
  return False if (val is None) or (val.strip() == "") or (type(val)
                                                           != str) else True


def is_empty(val):
  if val is None:
    return True
  elif isinstance(val, str):
    return val.strip() == ""
  elif isinstance(val, list):
    return len(val) == 0
  elif isinstance(val, dict):
    return val == {}


def arr_from_csv(csv, index=0, has_header=False):
  arr = [c[index] for c in csv]
  return arr[1:] if has_header else arr


def dict_from_tuple(fields, tp):
  return {fields[i]: v for (i, v) in enumerate(tp)}


def dicts_from_tuples(fields, tuples):
  return [{fields[i]: tp[i] for i in range(0, len(tp))} for tp in tuples]


def csv_from_dict(dct):
  if dct is None or (not isinstance(dct, dict)):
    return []
  return [list(dct.keys()), list(dct.values())]


def csv_from_dicts(dicts):
  csv = []
  # print(f"dicts: |{dicts}|")
  if dicts is None or (len(dicts) == 0):
    return []
  keys = dicts[0].keys()
  csv = [list(keys)]
  csv.extend([[dic[k] for k in keys] for dic in dicts])
  return csv


def csv_added_defaults(csv, defaults={}, is_push=False):
  add_keys = list(defaults.keys())
  add_vals = list(defaults.values())
  # print("add_keys, add_vals", add_keys, add_vals)
  if (is_push):
    csv = [
        arr + (add_keys if i == 0 else add_vals) for (i, arr) in enumerate(csv)
    ]
  else:
    csv = [(add_keys if i == 0 else add_vals) + arr
           for (i, arr) in enumerate(csv)]
  return csv


# * 한글 인코딩 교정


def contains_korean(text):
  # 한글 유니코드 범위: 가-힣
  korean_pattern = re.compile('[가-힣]+')
  return bool(korean_pattern.search(text))


def fix_encoding_response(response):
  # 원본 인코딩 확인
  original_encoding = response.encoding
  # print(f"원본 인코딩: {original_encoding}")

  # Content-Type 헤더에서 charset 확인
  content_type = response.headers.get('content-type', '')
  # print(f"Content-Type: {content_type}")

  # 여러 인코딩 시도
  encodings = ['utf-8', 'euc-kr', 'cp949']
  for encoding in encodings:
    try:
      decoded_text = response.content.decode(encoding)
      if contains_korean(decoded_text):
        # print(f"성공한 인코딩: {encoding}")
        return decoded_text
    except UnicodeDecodeError:
      continue

  return response.text


def fix_encoding(html):
  # 입력이 이미 문자열인 경우 그대로 반환
  if isinstance(html, str):
    return html

  # 여러 인코딩 시도
  encodings = ['utf-8', 'euc-kr', 'cp949']
  for encoding in encodings:
    try:
      html_decoded = html.decode(encoding)
      if contains_korean(html_decoded):
        # print(f"성공한 인코딩: {encoding}")
        return html_decoded
    except UnicodeDecodeError:
      continue
    except AttributeError:
      # 이미 문자열인 경우
      return html

  # 모든 인코딩 시도 실패 시 기본값 반환
  return html.decode('utf-8', errors='ignore')


def decode_html_text(html_text):
  """HTML 문자열에서 문자 코드를 한글로 변환하는 함수

  Args:
      html_text (str): 변환할 HTML 문자열

  Returns:
      str: 변환된 문자열
  """
  # 이스케이프된 유니코드 처리 (\\xeb -> \xeb)
  text = html_text.replace('\\\\x', '\\x')

  # 이스케이프된 유니코드를 실제 문자로 변환
  try:
    text = codecs.decode(text, 'unicode_escape')
  except BaseException:
    pass

  # HTML 엔티티 디코딩
  text = html.unescape(text)

  # HTML 태그 제거 (선택적)
  # text = re.sub(r'<[^>]+>', '', text)

  return text


def get_env(key):
  return os.environ.get(key, '')


# * NAS 폴더, 파일


def find_folder_by_category(category="공사점검", full=True):
  config = {
      "foler_공사점검": "24_공사점검",
      "foler_성능평가": "13_성능평가",
      "foler_기타": "31_기타용역",
  }
  folder = "24_공사점검" if not f"foler_{category}" in config else config[
      f"foler_{category}"]
  return f"{get_env('NAS_ROOT')}/{folder}" if full else folder


# company: 일맥, 링크
def find_dir_bid_notice(category="공사점검"):
  return f"{find_folder_by_category(category)}/{get_env('BID_NOTICE_FOLDER')}"


def _find_directories(root_path, search='', recursive=False):
  """
  특정 디렉토리에서 하위 폴더들을 검색하는 함수

  Args:
      root_path: 검색을 시작할 루트 디렉토리 경로
      search: 검색할 폴더 이름 (빈 문자열은 모든 폴더 검색, 문자열 또는 컴파일된 정규식 패턴)
      recursive: True면 모든 하위 폴더를 재귀적으로 검색, False면 직계 하위 폴더만 검색

  Returns:
      발견된 폴더들의 절대 경로 리스트
  """
  if not os.path.exists(root_path) or not os.path.isdir(root_path):
    return []
    # raise ValueError(f"'{root_path}'는 유효한 디렉토리가 아닙니다.")

  result = []

  # 정규식 패턴 준비
  if isinstance(search, str):
    if search == '':
      # 빈 문자열이면 모든 폴더 검색 (항상 매치됨)
      pattern = re.compile('.*')
    else:
      # 일반 문자열을 정규식 패턴으로 변환
      pattern = re.compile(re.escape(search))
  else:
    # 이미 컴파일된 정규식 패턴인 경우
    pattern = search

  # 비재귀적 검색 - 직계 하위 폴더만 검색
  for item in os.listdir(root_path):
    item_path = os.path.join(root_path, item)
    if os.path.isdir(item_path) and pattern.search(item):
      result.append(item_path)

  # 재귀적 검색이 활성화된 경우
  if recursive:
    for item in os.listdir(root_path):
      item_path = os.path.join(root_path, item)
      if os.path.isdir(item_path):
        # 매칭되지 않은 폴더라도 그 안에서 재귀 검색 계속
        sub_dirs = _find_directories(item_path, search, recursive=True)
        result.extend(sub_dirs)

  return result


def find_folders(root_path, search='', recursive=False):
  return [
      dir.replace(f'{root_path}/', '')
      for dir in _find_directories(root_path, search, recursive)
  ]


def _find_files(root_path, search='', recursive=False, file_extension=None):
  """
  특정 디렉토리에서 파일들을 검색하는 함수

  Args:
      root_path: 검색을 시작할 루트 디렉토리 경로
      search: 검색할 파일 이름 패턴 (빈 문자열은 모든 파일 검색, 문자열 또는 컴파일된 정규식 패턴)
      recursive: True면 모든 하위 폴더를 재귀적으로 검색, False면 직계 하위 폴더만 검색
      file_extension: 특정 파일 확장자로 필터링 (예: '.txt', '.py' 등) - None이면 모든 확장자 검색

  Returns:
      발견된 파일들의 절대 경로 리스트
  """
  if not os.path.exists(root_path) or not os.path.isdir(root_path):
    # raise ValueError(f"'{root_path}'는 유효한 디렉토리가 아닙니다.")
    return []

  result = []

  # 정규식 패턴 준비
  if isinstance(search, str):
    if search == '':
      # 빈 문자열이면 모든 파일 검색 (항상 매치됨)
      pattern = re.compile('.*')
    else:
      # 일반 문자열을 정규식 패턴으로 변환
      pattern = re.compile(re.escape(search))
  else:
    # 이미 컴파일된 정규식 패턴인 경우
    pattern = search

  # 직계 하위 항목 검색
  for item in os.listdir(root_path):
    item_path = os.path.join(root_path, item)

    # 파일인 경우 패턴과 확장자 체크
    if os.path.isfile(item_path):
      # 파일 이름이 패턴과 일치하는지 확인
      if pattern.search(item):
        # 확장자 필터링이 있는 경우
        if file_extension is not None:
          if item.endswith(file_extension):
            result.append(item_path)
        else:
          result.append(item_path)

    # 재귀적 검색이 활성화된 경우 디렉토리를 더 탐색
    elif recursive and os.path.isdir(item_path):
      sub_files = _find_files(item_path, search, recursive, file_extension)
      result.extend(sub_files)

  return result


def find_files(root_path, search='', recursive=False, file_extension=None):
  return [
      file.replace(f'{root_path}/', '')
      for file in _find_files(root_path, search, recursive, file_extension)
  ]


if __name__ == "__main__":
  pass
  # print(find_folder_by_category(category="기타1"))
  # print(find_dir_bid_notice(category="공사점검"))

  dirs = find_folders('/nas/24_공사점검/3 . 용역 입찰공고')
  # dirs = find_directories(find_dir_bid_notice(category="성능평가"), search = '', recursive = False)
  print(dirs)

  # files = find_files('/nas/24_공사점검/3 . 용역 입찰공고', search = '')
  # print(files)

  # folder = find_folder_by_org(root_path = '/nas/24_공사점검/3 . 용역 입찰공고', company='일맥', org_name='종로구')
  folder = find_notice_folder(category="성능평가", company='일맥', org_name='종로구청')
  print(folder)

  # print(get_com_sn_org_from_folder(folder='[일맥] 15. 종로구청(60)'))

  # print(get_folder_from_com_sn_org(com="일맥", sn=1, org="가평군청"))

  # print(get_max_sn_org_folder(root_path = '/nas/24_공사점검/3 . 용역 입찰공고', com="일맥"))
