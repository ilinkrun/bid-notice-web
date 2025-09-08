from fastapi.testclient import TestClient
from server.server_bid import app
import pytest
import sys
import os
from unittest.mock import patch, MagicMock
from typing import Dict, List
from contextlib import ExitStack

# Add parent directory to path to import server modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

client = TestClient(app)


@pytest.fixture
def mock_mysql_functions():
  """Mock all MySQL-related functions to avoid database connections"""
  with ExitStack() as stack:
    mock_settings_list = stack.enter_context(
        patch('server_bid.find_settings_notice_list'))
    mock_settings_by_name = stack.enter_context(
        patch('server_bid.find_settings_notice_list_by_name'))
    mock_settings_detail = stack.enter_context(
        patch('server_bid.find_settings_notice_detail'))
    mock_settings_detail_by_name = stack.enter_context(
        patch('server_bid.find_settings_notice_detail_by_name'))
    mock_detail_config = stack.enter_context(
        patch('server_bid.detail_config_by_name'))
    mock_notice_list = stack.enter_context(
        patch('server_bid.find_notice_list_with_category'))
    mock_notice_by_category = stack.enter_context(
        patch('server_bid.find_notice_list_by_category'))
    mock_notice_statistics = stack.enter_context(
        patch('server_bid.find_notice_list_for_statistics'))
    mock_last_notice = stack.enter_context(
        patch('server_bid.find_last_notice'))
    mock_search_notice = stack.enter_context(
        patch('server_bid.search_notice_list'))
    mock_upsert_notice = stack.enter_context(
        patch('server_bid.upsert_notice_list'))
    mock_update_status = stack.enter_context(
        patch('server_bid.update_notice_status'))
    mock_find_bids = stack.enter_context(patch('server_bid.find_my_bids'))
    mock_find_bids_status = stack.enter_context(
        patch('server_bid.find_my_bids_by_status'))
    mock_find_logs = stack.enter_context(
        patch('server_bid.find_logs_notice_scraping'))
    mock_find_errors = stack.enter_context(
        patch('server_bid.find_errors_notice_scraping'))
    mock_scrape_list = stack.enter_context(patch('server_bid.scrape_list'))
    mock_delete_old = stack.enter_context(
        patch('server_bid.delete_old_notice_list'))
    mock_backup = stack.enter_context(patch('server_bid.backup_db'))
    mock_all_categories = stack.enter_context(
        patch('server_bid.find_all_settings_notice_category'))
    mock_category = stack.enter_context(
        patch('server_bid.find_settings_notice_category'))
    mock_search_weight = stack.enter_context(
        patch('server_bid.get_search_weight'))
    mock_filter_not = stack.enter_context(patch('server_bid.filter_by_not'))
    mock_keyword_weights = stack.enter_context(
        patch('server_bid.get_keyword_weight_list'))
    mock_add_settings = stack.enter_context(
        patch('server_bid.add_settings_to_notice'))

    yield {
        'settings_list': mock_settings_list,
        'settings_by_name': mock_settings_by_name,
        'settings_detail': mock_settings_detail,
        'settings_detail_by_name': mock_settings_detail_by_name,
        'detail_config': mock_detail_config,
        'notice_list': mock_notice_list,
        'notice_by_category': mock_notice_by_category,
        'notice_statistics': mock_notice_statistics,
        'last_notice': mock_last_notice,
        'search_notice': mock_search_notice,
        'upsert_notice': mock_upsert_notice,
        'update_status': mock_update_status,
        'find_bids': mock_find_bids,
        'find_bids_status': mock_find_bids_status,
        'find_logs': mock_find_logs,
        'find_errors': mock_find_errors,
        'scrape_list': mock_scrape_list,
        'delete_old': mock_delete_old,
        'backup': mock_backup,
        'all_categories': mock_all_categories,
        'category': mock_category,
        'search_weight': mock_search_weight,
        'filter_not': mock_filter_not,
        'keyword_weights': mock_keyword_weights,
        'add_settings': mock_add_settings
    }


@pytest.fixture
def sample_settings_data():
  return {
      "org_name": "테스트기관",
      "use": "1",
      "url": "http://test.example.com",
      "iframe": "",
      "rowXpath": "//tr",
      "title": "td[1]",
      "detail_url": "td[1]/a",
      "posted_date": "td[2]",
      "posted_by": "td[3]",
      "exception_row": "",
      "paging": "",
      "startPage": "1",
      "endPage": "1",
      "login": "",
      "org_region": "서울",
      "_비고": ""
  }


@pytest.fixture
def sample_notice_data():
  return [{
      "nid": 1,
      "posted_date": "2024-01-01",
      "org_name": "테스트기관",
      "title": "테스트 공고",
      "detail_url": "http://test.com/detail/1",
      "notice_num": "TEST-001",
      "file_name": "test.pdf",
      "created_at": "2024-01-01 10:00:00"
  }]


class TestSettingsNoticeListEndpoints:

  def test_get_settings_notice_list_success(self, mock_mysql_functions):
    mock_mysql_functions['settings_list'].return_value = [{
        "org_name": "기관1",
        "use": "1"
    }, {
        "org_name": "기관2",
        "use": "0"
    }]

    response = client.get("/settings_notice_list")
    assert response.status_code == 200
    assert len(response.json()) == 2

  def test_get_settings_notice_list_by_name_success(self, mock_mysql_functions,
                                                    sample_settings_data):
    mock_mysql_functions[
        'settings_by_name'].return_value = sample_settings_data

    response = client.get("/settings_notice_list/테스트기관")
    assert response.status_code == 200
    assert response.json()["org_name"] == "테스트기관"

  def test_get_settings_notice_list_by_name_not_found(self,
                                                      mock_mysql_functions):
    mock_mysql_functions['settings_by_name'].return_value = None

    response = client.get("/settings_notice_list/존재하지않는기관")
    assert response.status_code == 404

  def test_upsert_settings_notice_list_success(self, mock_mysql_functions,
                                               sample_settings_data):
    mock_mysql_functions[
        'settings_by_name'].return_value = sample_settings_data

    response = client.post("/settings_notice_list/테스트기관",
                           json=sample_settings_data)
    assert response.status_code == 200


class TestSettingsNoticeDetailEndpoints:

  def test_get_all_settings_notice_detail_success(self, mock_mysql_functions):
    mock_mysql_functions['settings_detail'].return_value = [{
        "org_name": "기관1",
        "title": "xpath1"
    }, {
        "org_name": "기관2",
        "title": "xpath2"
    }]

    response = client.get("/settings_notice_detail")
    assert response.status_code == 200
    assert len(response.json()) == 2

  def test_get_settings_notice_detail_success(self, mock_mysql_functions):
    mock_mysql_functions['settings_detail_by_name'].return_value = {
        "org_name": "테스트기관",
        "title": "//h1",
        "body_html": "//div[@class='content']"
    }

    response = client.get("/settings_notice_detail/테스트기관")
    assert response.status_code == 200
    assert response.json()["org_name"] == "테스트기관"

  def test_get_settings_notice_detail_not_found(self, mock_mysql_functions):
    mock_mysql_functions['settings_detail_by_name'].return_value = None

    response = client.get("/settings_notice_detail/존재하지않는기관")
    assert response.status_code == 200
    assert response.json() == {}

  def test_get_detail_config_success(self, mock_mysql_functions):
    mock_mysql_functions['detail_config'].return_value = {
        "org_name": "테스트기관",
        "config": "test_config"
    }

    response = client.get("/detail_config/테스트기관")
    assert response.status_code == 200
    assert response.json()["org_name"] == "테스트기관"


class TestNoticeListEndpoints:

  @patch('server_bid.DAY_GAP', '7')
  def test_get_notice_list_gap_default(self, mock_mysql_functions,
                                       sample_notice_data):
    mock_mysql_functions['notice_list'].return_value = sample_notice_data
    mock_mysql_functions['add_settings'].return_value = None

    response = client.get("/notice_list")
    assert response.status_code == 200
    assert len(response.json()) == 1

  @patch('server_bid.DAY_GAP', '7')
  def test_get_notice_list_gap_custom(self, mock_mysql_functions,
                                      sample_notice_data):
    mock_mysql_functions['notice_list'].return_value = sample_notice_data
    mock_mysql_functions['add_settings'].return_value = None

    response = client.get("/notice_list?gap=3")
    assert response.status_code == 200
    assert len(response.json()) == 1

  @patch('server_bid.DAY_GAP', '7')
  def test_get_notice_list_gap_category(self, mock_mysql_functions,
                                        sample_notice_data):
    mock_mysql_functions[
        'notice_by_category'].return_value = sample_notice_data
    mock_mysql_functions['add_settings'].return_value = None

    response = client.get("/notice_list/공사점검?gap=5")
    assert response.status_code == 200
    assert len(response.json()) == 1

  @patch('server_bid.DAY_GAP', '7')
  def test_get_notice_list_for_statistics(self, mock_mysql_functions):
    mock_mysql_functions['notice_statistics'].return_value = [{
        "org_name":
        "기관1",
        "posted_date":
        "2024-01-01",
        "category":
        "공사점검"
    }]

    response = client.get("/notice_list_statistics?gap=1")
    assert response.status_code == 200
    assert len(response.json()) == 1

  def test_get_last_notice_success(self, mock_mysql_functions):
    mock_mysql_functions['last_notice'].return_value = {"title": "최근 공고"}

    response = client.get("/last_notice/테스트기관?field=title")
    assert response.status_code == 200
    assert response.json()["title"] == "최근 공고"

  def test_search_notice_list_success(self, mock_mysql_functions,
                                      sample_notice_data):
    mock_mysql_functions['search_notice'].return_value = sample_notice_data

    search_data = {
        "keywords": "안전,점검",
        "nots": "건축물",
        "min_point": 2,
        "add_where": "`posted_date` >= '2024-01-01'",
        "base_sql": "",
        "add_sql": ""
    }

    response = client.post("/search_notice_list", json=search_data)
    assert response.status_code == 200
    assert len(response.json()) == 1

  def test_upsert_notice_list_success(self, mock_mysql_functions):
    mock_mysql_functions['upsert_notice'].return_value = None

    notice_data = [{"nid": 1, "category": "공사점검", "status": "진행"}]

    response = client.post("/notice_list", json=notice_data)
    assert response.status_code == 200
    assert response.json()["success"] is True

  def test_update_notice_status_success(self, mock_mysql_functions):
    mock_mysql_functions['update_status'].return_value = None

    status_data = {"nid": 1, "from": "제외", "to": "진행"}

    response = client.post("/notice_list/status", json=status_data)
    assert response.status_code == 200
    assert response.json()["success"] is True


class TestBidsEndpoints:

  def test_get_bids_success(self, mock_mysql_functions):
    mock_mysql_functions['find_bids'].return_value = [{
        "nid": 1,
        "status": "진행",
        "title": "테스트 입찰"
    }]

    response = client.get("/my_bids")
    assert response.status_code == 200
    assert len(response.json()) == 1

  def test_get_bids_by_status_success(self, mock_mysql_functions):
    mock_mysql_functions['find_bids_status'].return_value = [{
        "nid": 1,
        "status": "진행",
        "title": "테스트 입찰"
    }]

    response = client.get("/my_bids/진행")
    assert response.status_code == 200
    assert len(response.json()) == 1


class TestLogsAndErrorsEndpoints:

  @patch('server_bid.DAY_GAP', '7')
  def test_get_logs_success(self, mock_mysql_functions):
    mock_mysql_functions['find_logs'].return_value = [{
        "id":
        1,
        "message":
        "스크래핑 성공",
        "created_at":
        "2024-01-01 10:00:00"
    }]

    response = client.get("/logs_notice_scraping?gap=1")
    assert response.status_code == 200
    assert len(response.json()) == 1

  @patch('server_bid.DAY_GAP', '7')
  def test_get_errors_success(self, mock_mysql_functions):
    mock_mysql_functions['find_errors'].return_value = [{
        "id":
        1,
        "error_message":
        "스크래핑 실패",
        "created_at":
        "2024-01-01 10:00:00"
    }]

    response = client.get("/errors_notice_scraping?gap=1")
    assert response.status_code == 200
    assert len(response.json()) == 1


class TestScrapingEndpoints:

  def test_check_fetch_list_success(self, mock_mysql_functions):
    mock_mysql_functions['scrape_list'].return_value = {
        "org_name": "테스트기관",
        "error_code": 0,
        "error_message": "",
        "data": [{
            "title": "테스트 공고"
        }]
    }

    response = client.get("/check_fetch_list?org_name=테스트기관")
    assert response.status_code == 200
    assert response.json()["error_code"] == 0

  def test_check_fetch_list_error(self, mock_mysql_functions):
    mock_mysql_functions['scrape_list'].side_effect = Exception("스크래핑 오류")

    response = client.get("/check_fetch_list?org_name=테스트기관")
    assert response.status_code == 200
    assert "스크래핑 중 예상치 못한 오류 발생" in response.json()["error_message"]


class TestUtilityEndpoints:

  def test_test_csv_endpoint(self):
    csv_data = {"csv": "test,data,csv"}

    response = client.post("/test_csv/", json=csv_data)
    assert response.status_code == 200
    assert response.json() == "test,data,csv"

  def test_hello_endpoint(self):
    response = client.get("/hello")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, World!"}


class TestDatabaseManagementEndpoints:

  def test_delete_old_notice_list_success(self, mock_mysql_functions):
    mock_mysql_functions['delete_old'].return_value = 10

    response = client.delete("/delete_old_notice_list?day_gap=30")
    assert response.status_code == 200
    assert "10개의 오래된 공고가 삭제되었습니다" in response.json()["message"]

  def test_backup_database_success(self, mock_mysql_functions):
    mock_mysql_functions['backup'].return_value = "backup_file.sql"

    response = client.post("/backup_db")
    assert response.status_code == 200
    assert response.json()["success"] is True


class TestKeywordEndpoints:

  def test_get_all_categorys_success(self, mock_mysql_functions):
    mock_mysql_functions['all_categories'].return_value = [{
        "category": "공사점검",
        "keywords": "안전,점검"
    }, {
        "category": "성능평가",
        "keywords": "성능,평가"
    }]

    response = client.get("/settings_notice_categorys")
    assert response.status_code == 200
    assert len(response.json()) == 2

  def test_get_categorys_by_category_success(self, mock_mysql_functions):
    mock_mysql_functions['category'].return_value = [{
        "sn": 1,
        "keywords": "안전,점검",
        "category": "공사점검"
    }]

    response = client.get("/settings_notice_categorys/공사점검")
    assert response.status_code == 200
    assert len(response.json()) == 1

  def test_get_categorys_by_category_not_found(self, mock_mysql_functions):
    mock_mysql_functions['category'].return_value = []

    response = client.get("/settings_notice_categorys/존재하지않는카테고리")
    assert response.status_code == 404

  def test_search_by_keyword_weight_success(self, mock_mysql_functions,
                                            sample_notice_data):
    mock_mysql_functions['search_weight'].return_value = sample_notice_data

    search_data = {
        "keywords": "안전*3,점검*2",
        "min_point": 4,
        "field": "title",
        "table_name": "notice_list",
        "add_fields": ["detail_url", "posted_date"],
        "add_where": "`posted_date` >= '2024-01-01'"
    }

    response = client.post("/category_weight_search", json=search_data)
    assert response.status_code == 200
    assert len(response.json()) == 1

  def test_filter_notice_list_success(self, mock_mysql_functions,
                                      sample_notice_data):
    mock_mysql_functions['filter_not'].return_value = sample_notice_data

    filter_data = {
        "not_str": "건축물,토목",
        "dicts": sample_notice_data,
        "field": "title"
    }

    response = client.post("/filter_notice_list", json=filter_data)
    assert response.status_code == 200
    assert len(response.json()) == 1

  def test_parse_keyword_weights_success(self, mock_mysql_functions):
    mock_mysql_functions['keyword_weights'].return_value = [("안전", 3),
                                                            ("점검", 2),
                                                            ("진단", 1)]

    response = client.get(
        "/parse_keyword_weights?keyword_weight_str=안전*3,점검*2,진단*1")
    assert response.status_code == 200
    assert len(response.json()) == 3


class TestErrorHandling:

  def test_settings_exception_handling(self, mock_mysql_functions):
    mock_mysql_functions['settings_list'].side_effect = Exception(
        "Database error")

    response = client.get("/settings_notice_list")
    assert response.status_code == 500

  def test_notice_list_exception_handling(self, mock_mysql_functions):
    mock_mysql_functions['notice_list'].side_effect = Exception(
        "Database error")

    response = client.get("/notice_list")
    assert response.status_code == 500

  def test_search_exception_handling(self, mock_mysql_functions):
    mock_mysql_functions['search_notice'].side_effect = Exception(
        "Search error")

    search_data = {"keywords": "테스트", "nots": "", "min_point": 1}

    response = client.post("/search_notice_list", json=search_data)
    assert response.status_code == 500
