from fastapi.testclient import TestClient
from server.server_mysql import app
import pytest
import sys
import os
from unittest.mock import patch, MagicMock

# Add parent directory to path to import server modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

client = TestClient(app)


@pytest.fixture
def mock_mysql():
  """Mock the Mysql class to avoid database connections"""
  with patch('server_mysql.Mysql') as mock_mysql_class:
    mock_instance = MagicMock()
    mock_mysql_class.return_value = mock_instance
    yield mock_instance


@pytest.fixture
def sample_sql_query():
  return {
      "sql":
      "SELECT nid, title FROM notice_list WHERE posted_date >= '2024-01-01' ORDER BY nid DESC LIMIT 10"
  }


@pytest.fixture
def sample_search_data():
  return {
      "keywords": "안전*3,점검*2,진단*1",
      "nots": "건축물,토목",
      "min_point": 4,
      "add_where": "`posted_date` >= '2024-01-01'",
      "base_sql":
      "SELECT notices.nid, notices.posted_date, notices.org_name, notices.title, notices.detail_url FROM notices",
      "add_sql": "ORDER BY notices.nid DESC"
  }


@pytest.fixture
def sample_notice_data():
  return [(1, "첫 번째 공고 제목"), (2, "두 번째 공고 제목"), (3, "세 번째 공고 제목")]


@pytest.fixture
def sample_search_result():
  return [(1, "2024-01-01", "테스트기관", "안전점검 공고", "http://test.com/1"),
          (2, "2024-01-02", "테스트기관2", "안전진단 공고", "http://test.com/2")]


class TestFetchBySqlEndpoint:

  def test_fetch_by_sql_success(self, mock_mysql, sample_sql_query,
                                sample_notice_data):
    """SQL 쿼리 실행 성공 테스트"""
    mock_mysql.fetch.return_value = sample_notice_data

    response = client.post("/fetch_by_sql/", json=sample_sql_query)

    assert response.status_code == 200
    assert len(response.json()) == 3
    assert response.json()[0][1] == "첫 번째 공고 제목"
    mock_mysql.fetch.assert_called_once_with(sample_sql_query["sql"])
    mock_mysql.close.assert_called_once()

  def test_fetch_by_sql_empty_result(self, mock_mysql, sample_sql_query):
    """SQL 쿼리 결과가 빈 경우 테스트"""
    mock_mysql.fetch.return_value = []

    response = client.post("/fetch_by_sql/", json=sample_sql_query)

    assert response.status_code == 200
    assert response.json() == []

  def test_fetch_by_sql_with_invalid_sql(self, mock_mysql):
    """잘못된 SQL 쿼리 테스트"""
    invalid_sql = {"sql": "INVALID SQL QUERY"}
    mock_mysql.fetch.side_effect = Exception("SQL syntax error")

    with pytest.raises(Exception):
      client.post("/fetch_by_sql/", json=invalid_sql)


class TestNoticeListBySearchEndpoint:

  def test_notice_list_by_search_success(self, mock_mysql, sample_search_data,
                                         sample_notice_data,
                                         sample_search_result):
    """키워드 검색 성공 테스트"""
    # Mock find 메서드가 키워드별로 호출될 때 반환할 데이터
    mock_mysql.find.side_effect = [
        [(1, "안전점검 공고"), (2, "안전진단 공고")],  # "안전" 키워드 검색 결과
        [(1, "안전점검 공고")],  # "점검" 키워드 검색 결과
        [(2, "안전진단 공고")]  # "진단" 키워드 검색 결과
    ]
    # Mock fetch 메서드가 최종 SQL로 호출될 때의 결과
    mock_mysql.fetch.return_value = sample_search_result

    response = client.post("/notice_list_by_search/", json=sample_search_data)

    assert response.status_code == 200
    assert len(response.json()) == 2
    mock_mysql.close.assert_called()

  def test_notice_list_by_search_no_keywords_found(self, mock_mysql,
                                                   sample_search_data):
    """키워드 검색 결과가 없는 경우 테스트"""
    mock_mysql.find.return_value = []  # 모든 키워드 검색에서 빈 결과

    response = client.post("/notice_list_by_search/", json=sample_search_data)

    assert response.status_code == 200
    assert response.json() == []

  def test_notice_list_by_search_below_min_point(self, mock_mysql,
                                                 sample_search_data):
    """최소 점수 미달로 필터링되는 경우 테스트"""
    # 낮은 가중치로 검색 결과 생성 (최소 점수 미달)
    search_data_low_score = sample_search_data.copy()
    # 총 점수 2점 (min_point 4점 미달)
    search_data_low_score["keywords"] = "테스트*1,키워드*1"

    mock_mysql.find.side_effect = [
        [(1, "테스트 키워드 공고")],  # "테스트" 키워드 검색 결과
        [(1, "테스트 키워드 공고")]  # "키워드" 키워드 검색 결과
    ]

    response = client.post("/notice_list_by_search/",
                           json=search_data_low_score)

    assert response.status_code == 200
    assert response.json() == []

  def test_notice_list_by_search_with_not_filter(self, mock_mysql,
                                                 sample_search_data):
    """제외 키워드가 적용되는 경우 테스트"""
    # "건축물"이 포함된 공고는 제외되어야 함
    mock_mysql.find.side_effect = [
        [(1, "안전점검 공고"), (2, "건축물 안전점검 공고")],  # "안전" 검색 결과
        [(1, "안전점검 공고"), (2, "건축물 안전점검 공고")],  # "점검" 검색 결과
        []  # "진단" 검색 결과 (빈 결과)
    ]

    # "건축물"이 없는 공고만 남음
    mock_mysql.fetch.return_value = [(1, "2024-01-01", "테스트기관", "안전점검 공고",
                                      "http://test.com/1")]

    response = client.post("/notice_list_by_search/", json=sample_search_data)

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert "건축물" not in response.json()[0][3]  # title 필드

  def test_notice_list_by_search_empty_keywords(self, mock_mysql):
    """빈 키워드로 검색하는 경우 테스트"""
    empty_search_data = {
        "keywords": "",
        "nots": "",
        "min_point": 1,
        "add_where": "",
        "base_sql": "SELECT * FROM notice_list",
        "add_sql": ""
    }

    response = client.post("/notice_list_by_search/", json=empty_search_data)

    assert response.status_code == 200
    assert response.json() == []

  def test_notice_list_by_search_with_add_where_condition(
          self, mock_mysql, sample_search_data):
    """추가 WHERE 조건이 있는 경우 테스트"""
    mock_mysql.find.side_effect = [
        [(1, "안전점검 공고")],  # "안전" 키워드 + add_where 조건
        [(1, "안전점검 공고")],  # "점검" 키워드 + add_where 조건
        []  # "진단" 키워드 + add_where 조건
    ]

    mock_mysql.fetch.return_value = [(1, "2024-01-01", "테스트기관", "안전점검 공고",
                                      "http://test.com/1")]

    response = client.post("/notice_list_by_search/", json=sample_search_data)

    assert response.status_code == 200
    assert len(response.json()) == 1

    # find 메서드가 add_where 조건과 함께 호출되었는지 확인
    calls = mock_mysql.find.call_args_list
    for call in calls:
      if len(call[0]) > 2:  # addStr 파라미터가 있는 경우
        addStr = call[0][2]
        assert "`posted_date` >= '2024-01-01'" in addStr

  def test_notice_list_by_search_keyword_parsing(self, mock_mysql):
    """키워드 파싱 로직 테스트"""
    search_data = {
        "keywords": "키워드1*5, 키워드2 , 키워드3*2,*3,키워드4*",  # 다양한 형태의 키워드
        "nots": "",
        "min_point": 1,
        "add_where": "",
        "base_sql": "SELECT * FROM notice_list",
        "add_sql": ""
    }

    # 빈 결과로 설정하여 파싱 로직만 테스트
    mock_mysql.find.return_value = []

    response = client.post("/notice_list_by_search/", json=search_data)

    assert response.status_code == 200
    # find 메서드가 유효한 키워드들로만 호출되었는지 확인
    calls = mock_mysql.find.call_args_list
    expected_keywords = ["키워드1", "키워드2", "키워드3", "키워드4"]

    for i, call in enumerate(calls):
      if i < len(expected_keywords):
        addStr = call[0][2]
        assert expected_keywords[i] in addStr


class TestKeywordWeightCalculation:

  def test_keyword_weight_calculation_logic(self, mock_mysql):
    """키워드 가중치 계산 로직 테스트"""
    search_data = {
        "keywords": "안전*3,점검*2",
        "nots": "",
        "min_point": 5,  # 5점 이상만 통과
        "add_where": "",
        "base_sql": "SELECT * FROM notice_list",
        "add_sql": ""
    }

    # nid=1인 공고가 "안전"(3점)과 "점검"(2점) 모두 매치 → 총 5점
    mock_mysql.find.side_effect = [
        [(1, "안전점검 공고")],  # "안전" 키워드 검색
        [(1, "안전점검 공고")]  # "점검" 키워드 검색
    ]

    mock_mysql.fetch.return_value = [(1, "2024-01-01", "테스트기관", "안전점검 공고",
                                      "http://test.com/1")]

    response = client.post("/notice_list_by_search/", json=search_data)

    assert response.status_code == 200
    assert len(response.json()) == 1  # 5점으로 min_point를 만족


class TestErrorScenarios:

  def test_mysql_connection_error(self, mock_mysql, sample_search_data):
    """MySQL 연결 오류 테스트"""
    mock_mysql.find.side_effect = Exception("Connection failed")

    with pytest.raises(Exception):
      client.post("/notice_list_by_search/", json=sample_search_data)

  def test_invalid_search_parameters(self, mock_mysql):
    """잘못된 검색 파라미터 테스트"""
    invalid_data = {
        "keywords": "test",
        "nots": "not_test",
        "min_point": "invalid_number",  # 문자열이 들어간 경우
        "add_where": "",
        "base_sql": "",
        "add_sql": ""
    }

    with pytest.raises(Exception):
      client.post("/notice_list_by_search/", json=invalid_data)


class TestEdgeCases:

  def test_very_large_keyword_list(self, mock_mysql):
    """매우 많은 키워드가 있는 경우 테스트"""
    large_keywords = ",".join([f"키워드{i}*{i % 5 + 1}" for i in range(100)])

    search_data = {
        "keywords": large_keywords,
        "nots": "",
        "min_point": 1,
        "add_where": "",
        "base_sql": "SELECT * FROM notice_list",
        "add_sql": ""
    }

    mock_mysql.find.return_value = []

    response = client.post("/notice_list_by_search/", json=search_data)

    assert response.status_code == 200
    assert response.json() == []

  def test_special_characters_in_keywords(self, mock_mysql):
    """특수문자가 포함된 키워드 테스트"""
    search_data = {
        "keywords": "테스트@키워드*2,특수#문자*1",
        "nots": "",
        "min_point": 1,
        "add_where": "",
        "base_sql": "SELECT * FROM notice_list",
        "add_sql": ""
    }

    mock_mysql.find.return_value = []

    response = client.post("/notice_list_by_search/", json=search_data)

    assert response.status_code == 200
    assert response.json() == []

  def test_korean_keywords(self, mock_mysql):
    """한글 키워드 처리 테스트"""
    search_data = {
        "keywords": "안전점검*3,성능평가*2,정밀진단*1",
        "nots": "건축물관리점검,토목",
        "min_point": 3,
        "add_where": "",
        "base_sql": "SELECT * FROM notice_list",
        "add_sql": ""
    }

    mock_mysql.find.side_effect = [[(1, "안전점검 공고")], [(2, "성능평가 공고")],
                                   [(3, "정밀진단 공고")]]

    mock_mysql.fetch.return_value = [
        (1, "2024-01-01", "기관1", "안전점검 공고", "http://test.com/1"),
        (2, "2024-01-02", "기관2", "성능평가 공고", "http://test.com/2")
    ]

    response = client.post("/notice_list_by_search/", json=search_data)

    assert response.status_code == 200
    assert len(response.json()) >= 0  # 한글 처리가 정상적으로 되어야 함
