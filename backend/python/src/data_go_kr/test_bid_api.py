#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv

# utils_mysql 모듈 import를 위한 경로 추가
sys.path.append('/exposed/projects/bid-notice-web/backend/python/src')
from utils.utils_mysql import Mysql

def load_service_key():
    """Load service key from .env file"""
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    load_dotenv(env_path)
    return os.getenv('DATA_GO_KR_SERVICE_KEY')

def save_response_to_file(data):
    """Save API response to JSON file with timestamp"""
    now = datetime.now()
    filename = f"res_{now.strftime('%m%d_%H_%M_%S')}.json"

    # Create responses directory if it doesn't exist
    # responses_dir = os.path.join(os.path.dirname(__file__), 'responses')
    responses_dir = '/exposed/projects/bid-notice-web/backend/python/src/data_go_kr/responses'
    os.makedirs(responses_dir, exist_ok=True)

    # Full file path
    file_path = os.path.join(responses_dir, filename)

    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Response saved to: {file_path}")
    except Exception as e:
        print(f"Error saving response to file: {e}")

def camel_to_snake(name):
    """Convert camelCase to snake_case"""
    import re
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def convert_keys_to_snake_case(data_dict):
    """Convert all dictionary keys from camelCase to snake_case"""
    return {camel_to_snake(k): v for k, v in data_dict.items()}

def safe_val_str(val):
    """값을 MySQL 쿼리에서 사용할 수 있는 형식으로 안전하게 변환"""
    if val is None:
        return "NULL"
    elif isinstance(val, str):
        return "'" + val.replace("'", "\\'").replace('"', '\\"') + "'"
    else:
        return str(val)

def save_to_mysql(data):
    """Save API response data to MySQL notices_g2b table"""
    try:
        mysql = Mysql()
        
        # response > body > items 배열에서 데이터 추출
        if 'response' not in data or 'body' not in data['response'] or 'items' not in data['response']['body']:
            print("No items found in API response")
            return
        
        items = data['response']['body']['items']
        if not items:
            print("Empty items array")
            return
        
        print(f"Processing {len(items)} items...")
        
        for item in items:
            # 카멜케이스를 스네이크케이스로 변환
            snake_case_item = convert_keys_to_snake_case(item)
            
            # None 키 제거 및 빈 문자열 처리
            cleaned_item = {}
            for key, value in snake_case_item.items():
                # None 키나 빈 키 제거
                if key is None or key == '':
                    continue
                    
                # 빈 문자열을 None으로 변환
                if value == "":
                    cleaned_item[key] = None
                else:
                    cleaned_item[key] = value
            
            # 수동으로 INSERT 쿼리 생성 (None 값 처리를 위해)
            try:
                keys = list(cleaned_item.keys())
                values = list(cleaned_item.values())
                
                keys_str = ", ".join([f"`{k}`" for k in keys])
                vals_str = ", ".join([safe_val_str(v) for v in values])
                
                sql = f"INSERT IGNORE INTO notices_g2b ({keys_str}) VALUES ({vals_str});"
                mysql.exec(sql)
                
                print(f"Inserted: {cleaned_item.get('bid_ntce_no', 'N/A')} - {cleaned_item.get('bid_ntce_nm', 'N/A')[:50]}...")
            except Exception as e:
                print(f"Error inserting item {cleaned_item.get('bid_ntce_no', 'N/A')}: {e}")
                continue
        
        print("MySQL save completed")
        
    except Exception as e:
        print(f"Error saving to MySQL: {e}")
    finally:
        if 'mysql' in locals():
            mysql.close()

def test_bid_pblnc_list_info_service():
    """Test getBidPblancListInfoServc API"""
    
    # Load service key
    service_key = load_service_key()
    if not service_key:
        print("Error: SERVICE_KEY not found in .env file")
        return None
    
    # API endpoint
    base_url = "https://apis.data.go.kr/1230000/ad/BidPublicInfoService"
    endpoint = f"{base_url}/getBidPblancListInfoServc"
    
    # Calculate date range (last 3 days)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=3)
    
    # Parameters - try different date format
    params = {
        'serviceKey': service_key,
        'pageNo': '1',
        'numOfRows': '10',  # Get 10 records for testing
        'type': 'json',     # Response format
        'inqryDiv': '1',    # 조회구분 (1: 공고일자)
        'inqryBgnDt': start_date.strftime('%Y%m%d%H%M'),  # YYYYMMDDHHMM 형식
        'inqryEndDt': end_date.strftime('%Y%m%d%H%M')     # YYYYMMDDHHMM 형식
    }
    
    print("=== 공공데이터포털 입찰공고 API 테스트 ===")
    print(f"Endpoint: {endpoint}")
    print(f"Parameters: {json.dumps(params, indent=2, ensure_ascii=False)}")
    print()
    
    try:
        # Make API request
        print("Making API request...")
        response = requests.get(endpoint, params=params, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print()
        
        if response.status_code == 200:
            try:
                # Parse JSON response
                data = response.json()
                
                print("=== API Response ===")
                print(json.dumps(data, indent=2, ensure_ascii=False))
                
                # Extract and display key information
                if 'header' in data:
                    header = data['header']
                    print(f"\n=== Header Info ===")
                    print(f"Result Code: {header.get('resultCode', 'N/A')}")
                    print(f"Result Message: {header.get('resultMsg', 'N/A')}")
                
                if 'body' in data and data['body']:
                    body = data['body']
                    print(f"\n=== Body Info ===")
                    print(f"Page Number: {body.get('pageNo', 'N/A')}")
                    print(f"Number of Rows: {body.get('numOfRows', 'N/A')}")
                    print(f"Total Count: {body.get('totalCount', 'N/A')}")
                    
                    # Display items if available
                    if 'items' in body and body['items']:
                        items = body['items']
                        print(f"\n=== Items Info ===")
                        
                        if isinstance(items.get('item'), list):
                            print(f"Number of items: {len(items['item'])}")
                            for i, item in enumerate(items['item'], 1):
                                print(f"\n--- Item {i} ---")
                                print(f"입찰공고번호: {item.get('bidNtceNo', 'N/A')}")
                                print(f"입찰공고명: {item.get('bidNtceNm', 'N/A')}")
                                print(f"공고기관명: {item.get('ntceInsttNm', 'N/A')}")
                                print(f"수요기관명: {item.get('dminsttNm', 'N/A')}")
                                print(f"입찰공고일: {item.get('bidNtceDt', 'N/A')}")
                                print(f"입찰마감일시: {item.get('bidClseDt', 'N/A')}")
                                print(f"개찰일시: {item.get('opengDt', 'N/A')}")
                                print(f"예정가격: {item.get('presmptPrce', 'N/A')}")
                                print(f"공고구분명: {item.get('ntceKindNm', 'N/A')}")
                        elif isinstance(items.get('item'), dict):
                            item = items['item']
                            print(f"Single item found:")
                            print(f"입찰공고번호: {item.get('bidNtceNo', 'N/A')}")
                            print(f"입찰공고명: {item.get('bidNtceNm', 'N/A')}")
                            print(f"공고기관명: {item.get('ntceInsttNm', 'N/A')}")
                            print(f"수요기관명: {item.get('dminsttNm', 'N/A')}")
                        else:
                            print("No items found in response")
                    else:
                        print("No items found in response")
                
                # Save response to file
                save_response_to_file(data)
                
                # Save to MySQL database
                save_to_mysql(data)
                
                return data
                
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON response: {e}")
                print(f"Raw response: {response.text[:1000]}...")
                return None
        else:
            print(f"Error: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
        return None

if __name__ == "__main__":
    test_bid_pblnc_list_info_service()