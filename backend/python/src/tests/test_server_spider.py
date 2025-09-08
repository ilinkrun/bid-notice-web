from fastapi.testclient import TestClient
from server.server_spider import app
import pytest
import sys
import os
from unittest.mock import patch, MagicMock

# Add parent directory to path to import server modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

client = TestClient(app)


@pytest.fixture
def mock_scrape_list():
  """Mock the scrape_list function to avoid actual web scraping"""
  with patch('server_spider.scrape_list') as mock:
    yield mock


@pytest.fixture
def mock_error_codes():
  """Mock ERROR_CODES dictionary"""
  with patch('server_spider.ERROR_CODES') as mock:
    mock.__getitem__.return_value = 999
    mock.get.return_value = 999
    mock.return_value = {
        "UNKNOWN_ERROR": 999,
        "CONNECTION_ERROR": 100,
        "PARSING_ERROR": 200,
        "TIMEOUT_ERROR": 300
    }
    yield mock


@pytest.fixture
def successful_scrape_result():
  """Sample successful scraping result"""
  return {
      "org_name":
      "테스트기관",
      "success":
      True,
      "error_code":
      0,
      "error_message":
      "",
      "data_count":
      2,
      "data": [{
          "title": "첫 번째 공고",
          "detail_url": "http://test.com/detail/1",
          "posted_date": "2024-01-01",
          "posted_by": "담당자1"
      }, {
          "title": "두 번째 공고",
          "detail_url": "http://test.com/detail/2",
          "posted_date": "2024-01-02",
          "posted_by": "담당자2"
      }]
  }


@pytest.fixture
def failed_scrape_result():
  """Sample failed scraping result"""
  return {
      "org_name": "실패기관",
      "success": False,
      "error_code": 100,
      "error_message": "연결 시간 초과",
      "data_count": 0,
      "data": []
  }


class TestCheckFetchListEndpoint:

  def test_check_fetch_list_success(self, mock_scrape_list,
                                    successful_scrape_result):
    """정상적인 스크래핑 성공 테스트"""
    mock_scrape_list.return_value = successful_scrape_result

    response = client.get("/check_fetch_list?org_name=테스트기관")

    assert response.status_code == 200
    result = response.json()
    assert result["org_name"] == "테스트기관"
    assert result["success"] is True
    assert result["error_code"] == 0
    assert result["data_count"] == 2
    assert len(result["data"]) == 2

    # scrape_list 함수가 올바른 파라미터로 호출되었는지 확인
    mock_scrape_list.assert_called_once_with("테스트기관", start_page=1, end_page=2)

  def test_check_fetch_list_failure(self, mock_scrape_list,
                                    failed_scrape_result):
    """스크래핑 실패 테스트"""
    mock_scrape_list.return_value = failed_scrape_result

    response = client.get("/check_fetch_list?org_name=실패기관")

    assert response.status_code == 200
    result = response.json()
    assert result["org_name"] == "실패기관"
    assert result["success"] is False
    assert result["error_code"] == 100
    assert "연결 시간 초과" in result["error_message"]
    assert result["data_count"] == 0
    assert result["data"] == []

  def test_check_fetch_list_exception_handling(self, mock_scrape_list,
                                               mock_error_codes):
    """예외 발생 시 처리 테스트"""
    mock_scrape_list.side_effect = Exception("예상치 못한 오류")

    response = client.get("/check_fetch_list?org_name=오류기관")

    assert response.status_code == 200
    result = response.json()
    assert result["org_name"] == "오류기관"
    assert result["error_code"] == 999  # UNKNOWN_ERROR
    assert "스크래핑 중 예상치 못한 오류 발생" in result["error_message"]
    assert "예상치 못한 오류" in result["error_message"]
    assert result["data"] == []

  def test_check_fetch_list_empty_org_name(self, mock_scrape_list):
    """빈 기관명으로 요청하는 경우 테스트"""
    mock_scrape_list.return_value = {
        "org_name": "",
        "success": False,
        "error_code": 400,
        "error_message": "기관명이 필요합니다",
        "data_count": 0,
        "data": []
    }

    response = client.get("/check_fetch_list?org_name=")

    assert response.status_code == 200
    result = response.json()
    assert result["org_name"] == ""
    assert result["success"] is False

  def test_check_fetch_list_korean_org_name(self, mock_scrape_list,
                                            successful_scrape_result):
    """한글 기관명으로 요청하는 경우 테스트"""
    korean_org_name = "서울특별시강동송파교육지원청"
    successful_scrape_result["org_name"] = korean_org_name
    mock_scrape_list.return_value = successful_scrape_result

    response = client.get(f"/check_fetch_list?org_name={korean_org_name}")

    assert response.status_code == 200
    result = response.json()
    assert result["org_name"] == korean_org_name
    mock_scrape_list.assert_called_once_with(korean_org_name,
                                             start_page=1,
                                             end_page=2)

  def test_check_fetch_list_special_characters_in_org_name(
          self, mock_scrape_list):
    """특수문자가 포함된 기관명 테스트"""
    special_org_name = "테스트기관(특별)"
    mock_scrape_list.return_value = {
        "org_name": special_org_name,
        "success": True,
        "error_code": 0,
        "error_message": "",
        "data_count": 0,
        "data": []
    }

    response = client.get(f"/check_fetch_list?org_name={special_org_name}")

    assert response.status_code == 200
    result = response.json()
    assert result["org_name"] == special_org_name


class TestTestCsvEndpoint:

  def test_test_csv_success(self):
    """CSV 테스트 엔드포인트 정상 동작 테스트"""
    csv_data = {"csv": "컬럼1,컬럼2,컬럼3\n값1,값2,값3\n값4,값5,값6"}

    response = client.post("/test_csv/", json=csv_data)

    assert response.status_code == 200
    assert response.json() == csv_data["csv"]

  def test_test_csv_empty_csv(self):
    """빈 CSV 데이터 테스트"""
    csv_data = {"csv": ""}

    response = client.post("/test_csv/", json=csv_data)

    assert response.status_code == 200
    assert response.json() == ""

  def test_test_csv_korean_data(self):
    """한글 CSV 데이터 테스트"""
    csv_data = {
        "csv": "제목,기관명,작성일\n안전점검공고,테스트기관,2024-01-01\n성능평가공고,테스트기관2,2024-01-02"
    }

    response = client.post("/test_csv/", json=csv_data)

    assert response.status_code == 200
    assert response.json() == csv_data["csv"]
    assert "안전점검공고" in response.json()
    assert "테스트기관" in response.json()

  def test_test_csv_large_data(self):
    """큰 CSV 데이터 처리 테스트"""
    large_csv = "컬럼1,컬럼2,컬럼3\n" + \
        "\n".join([f"값{i},값{i + 1},값{i + 2}" for i in range(1000)])
    csv_data = {"csv": large_csv}

    response = client.post("/test_csv/", json=csv_data)

    assert response.status_code == 200
    assert response.json() == large_csv


class TestHelloEndpoint:

  def test_hello_endpoint(self):
    """Hello 엔드포인트 테스트"""
    response = client.get("/hello")

    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}

  def test_hello_endpoint_multiple_calls(self):
    """Hello 엔드포인트 다중 호출 테스트"""
    for _ in range(10):
      response = client.get("/hello")
      assert response.status_code == 200
      assert response.json() == {"message": "Hello, World!"}


class TestScrapeListIntegration:

  def test_scrape_list_parameters(self, mock_scrape_list,
                                  successful_scrape_result):
    """scrape_list 함수 파라미터 전달 테스트"""
    mock_scrape_list.return_value = successful_scrape_result

    client.get("/check_fetch_list?org_name=파라미터테스트기관")

    # 고정된 start_page=1, end_page=2 파라미터가 전달되는지 확인
    mock_scrape_list.assert_called_once_with("파라미터테스트기관",
                                             start_page=1,
                                             end_page=2)

  def test_scrape_list_return_structure(self, mock_scrape_list):
    """scrape_list 반환 구조 테스트"""
    expected_structure = {
        "org_name":
        "구조테스트기관",
        "success":
        True,
        "error_code":
        0,
        "error_message":
        "",
        "data_count":
        1,
        "first_page_data":
        None,
        "data": [{
            "title": "구조 테스트 공고",
            "detail_url": "http://test.com/detail/structure",
            "posted_date": "2024-01-01",
            "posted_by": "구조담당자"
        }]
    }
    mock_scrape_list.return_value = expected_structure

    response = client.get("/check_fetch_list?org_name=구조테스트기관")

    assert response.status_code == 200
    result = response.json()

    # 반환 구조의 모든 필드가 올바른지 확인
    assert "org_name" in result
    assert "success" in result or "error_code" in result  # 성공/실패 표시
    assert "data" in result
    if result.get("success", True) and result.get("error_code", 0) == 0:
      assert isinstance(result["data"], list)


class TestErrorScenarios:

  def test_connection_timeout_error(self, mock_scrape_list, mock_error_codes):
    """연결 타임아웃 오류 시나리오"""
    timeout_error = {
        "org_name": "타임아웃기관",
        "success": False,
        "error_code": 300,  # TIMEOUT_ERROR
        "error_message": "연결 시간이 초과되었습니다",
        "data_count": 0,
        "data": []
    }
    mock_scrape_list.return_value = timeout_error

    response = client.get("/check_fetch_list?org_name=타임아웃기관")

    assert response.status_code == 200
    result = response.json()
    assert result["error_code"] == 300
    assert "연결 시간이 초과되었습니다" in result["error_message"]

  def test_parsing_error(self, mock_scrape_list, mock_error_codes):
    """파싱 오류 시나리오"""
    parsing_error = {
        "org_name": "파싱오류기관",
        "success": False,
        "error_code": 200,  # PARSING_ERROR
        "error_message": "웹페이지 구조를 분석할 수 없습니다",
        "data_count": 0,
        "data": []
    }
    mock_scrape_list.return_value = parsing_error

    response = client.get("/check_fetch_list?org_name=파싱오류기관")

    assert response.status_code == 200
    result = response.json()
    assert result["error_code"] == 200
    assert "웹페이지 구조를 분석할 수 없습니다" in result["error_message"]

  def test_unknown_exception_handling(self, mock_scrape_list,
                                      mock_error_codes):
    """알 수 없는 예외 처리"""
    mock_error_codes.__getitem__.return_value = 999
    mock_scrape_list.side_effect = RuntimeError("알 수 없는 런타임 오류")

    response = client.get("/check_fetch_list?org_name=런타임오류기관")

    assert response.status_code == 200
    result = response.json()
    assert result["org_name"] == "런타임오류기관"
    assert result["error_code"] == 999
    assert "스크래핑 중 예상치 못한 오류 발생" in result["error_message"]
    assert "알 수 없는 런타임 오류" in result["error_message"]


class TestEdgeCases:

  def test_very_long_org_name(self, mock_scrape_list):
    """매우 긴 기관명 처리 테스트"""
    very_long_name = "매우" * 100 + "긴기관명"
    mock_scrape_list.return_value = {
        "org_name": very_long_name,
        "success": True,
        "error_code": 0,
        "error_message": "",
        "data_count": 0,
        "data": []
    }

    response = client.get(f"/check_fetch_list?org_name={very_long_name}")

    assert response.status_code == 200
    result = response.json()
    assert result["org_name"] == very_long_name

  def test_org_name_with_spaces(self, mock_scrape_list,
                                successful_scrape_result):
    """공백이 포함된 기관명 테스트"""
    org_name_with_spaces = "테스트 기관 이름"
    successful_scrape_result["org_name"] = org_name_with_spaces
    mock_scrape_list.return_value = successful_scrape_result

    response = client.get(f"/check_fetch_list?org_name={org_name_with_spaces}")

    assert response.status_code == 200
    result = response.json()
    assert result["org_name"] == org_name_with_spaces

  def test_partial_scraping_success(self, mock_scrape_list):
    """부분적 스크래핑 성공 (일부 데이터만 수집) 테스트"""
    partial_success = {
        "org_name":
        "부분성공기관",
        "success":
        True,
        "error_code":
        0,
        "error_message":
        "일부 페이지에서 오류 발생",
        "data_count":
        1,
        "data": [{
            "title": "성공한 공고",
            "detail_url": "http://test.com/success/1",
            "posted_date": "2024-01-01",
            "posted_by": "담당자"
        }]
    }
    mock_scrape_list.return_value = partial_success

    response = client.get("/check_fetch_list?org_name=부분성공기관")

    assert response.status_code == 200
    result = response.json()
    assert result["success"] is True
    assert result["data_count"] == 1
    assert "일부 페이지에서 오류 발생" in result["error_message"]


class TestResponseFormat:

  def test_response_format_consistency(self, mock_scrape_list):
    """응답 형식 일관성 테스트"""
    test_cases = [{
        "org_name": "형식테스트1",
        "success": True,
        "error_code": 0,
        "error_message": "",
        "data_count": 2,
        "data": [{
            "title": "공고1"
        }, {
            "title": "공고2"
        }]
    }, {
        "org_name": "형식테스트2",
        "success": False,
        "error_code": 100,
        "error_message": "오류 발생",
        "data_count": 0,
        "data": []
    }]

    for test_case in test_cases:
      mock_scrape_list.return_value = test_case

      response = client.get(
          f"/check_fetch_list?org_name={test_case['org_name']}")

      assert response.status_code == 200
      result = response.json()

      # 필수 필드들이 모두 존재하는지 확인
      assert "org_name" in result
      assert "error_code" in result
      assert "error_message" in result
      assert "data" in result
      assert isinstance(result["data"], list)

  def test_data_field_structure(self, mock_scrape_list):
    """data 필드 내부 구조 테스트"""
    structured_data = {
        "org_name":
        "데이터구조테스트",
        "success":
        True,
        "error_code":
        0,
        "error_message":
        "",
        "data_count":
        1,
        "data": [{
            "title": "구조화된 공고",
            "detail_url": "http://test.com/structured/1",
            "posted_date": "2024-01-01",
            "posted_by": "구조담당자",
            "additional_field": "추가 정보"
        }]
    }
    mock_scrape_list.return_value = structured_data

    response = client.get("/check_fetch_list?org_name=데이터구조테스트")

    assert response.status_code == 200
    result = response.json()

    if result.get("data_count", 0) > 0:
      first_item = result["data"][0]
      # 일반적으로 예상되는 필드들이 있는지 확인
      expected_fields = ["title", "detail_url", "posted_date", "posted_by"]
      for field in expected_fields:
        if field in first_item:
          assert isinstance(first_item[field], str)
