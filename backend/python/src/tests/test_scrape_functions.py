#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
스크래핑 함수들에 대한 테스트 모듈
"""

import sys
import os

from spider.spider_list import (
    scrape_list,
    scrape_list_by_settings,
    get_scrapping_settings,
    find_settings_by_org_name,
    find_org_names
)

# def test_scrape_functions():
#     """리팩토링된 스크래핑 함수들을 테스트"""
#     try:
#         from spider.spider_list import (
#             scrape_list,
#             scrape_list_by_settings,
#             get_scrapping_settings,
#             find_settings_by_org_name,
#             find_org_names
#         )

#         print("=== 스크래핑 함수 테스트 ===")

#         # 사용 가능한 기관명 목록 조회
#         print("\n0. 사용 가능한 기관명 조회:")
#         try:
#             org_names = find_org_names()
#             if org_names and len(org_names) > 0:
#                 print(f"   ✓ 총 {len(org_names)}개 기관 확인")
#                 test_org = org_names[0]  # 첫 번째 기관으로 테스트
#                 print(f"   테스트 기관: {test_org}")
#             else:
#                 print("   ✗ 사용 가능한 기관이 없습니다.")
#                 test_org = "한국공항공사"  # 기본값 사용
#                 print(f"   기본 테스트 기관 사용: {test_org}")
#         except Exception as e:
#             print(f"   ✗ 기관명 목록 조회 실패: {e}")
#             test_org = "한국공항공사"  # 기본값 사용
#             print(f"   기본 테스트 기관 사용: {test_org}")

#         # 1. 설정 조회 함수들 테스트
#         print(f"\n1. 설정 조회 함수 테스트 ({test_org}):")

#         # 기존 함수 테스트
#         settings1 = get_scrapping_settings(test_org)
#         if settings1:
#             print("   ✓ get_scrapping_settings() 성공")
#         else:
#             print("   ✗ get_scrapping_settings() 실패")

#         # 새로운 함수 테스트
#         settings2 = find_settings_by_org_name(test_org)
#         if settings2:
#             print("   ✓ find_settings_by_org_name() 성공")
#         else:
#             print("   ✗ find_settings_by_org_name() 실패")

#         # 두 함수 결과 비교
#         if settings1 and settings2:
#             if settings1 == settings2:
#                 print("   ✓ 두 함수의 결과가 동일함")
#                 settings = settings1
#                 print(f"   설정 필드 수: {len(settings)}")

#                 # 설정 내용 간략 출력
#                 if len(settings) >= 3:
#                     org_name_from_settings = settings[1]
#                     url = settings[2]
#                     print(f"   기관명: {org_name_from_settings}")
#                     print(f"   URL: {url[:50]}..." if len(url) > 50 else f"   URL: {url}")
#             else:
#                 print("   ✗ 두 함수의 결과가 다름")
#                 settings = settings1
#         else:
#             settings = settings1 or settings2

#         # 2. 스크래핑 함수들 테스트 (실제 실행하지 않고 구조만 확인)
#         print(f"\n2. 스크래핑 함수 구조 테스트:")

#         if settings:
#             print("   ✓ 설정이 준비됨")

#             # 함수 시그니처 확인
#             try:
#                 import inspect

#                 # scrape_list 함수
#                 sig1 = inspect.signature(scrape_list)
#                 print(f"   scrape_list 매개변수: {list(sig1.parameters.keys())}")

#                 # scrape_list_by_settings 함수
#                 sig2 = inspect.signature(scrape_list_by_settings)
#                 print(f"   scrape_list_by_settings 매개변수: {list(sig2.parameters.keys())}")

#                 print("   ✓ 함수 시그니처 확인 완료")

#                 # 매개변수 기본값 확인
#                 for name, param in sig2.parameters.items():
#                     if param.default != inspect.Parameter.empty:
#                         print(f"   - {name} 기본값: {param.default}")

#             except Exception as e:
#                 print(f"   ✗ 함수 시그니처 확인 실패: {e}")
#         else:
#             print(f"   ✗ {test_org}에 대한 설정을 찾을 수 없습니다.")

#         # 3. 사용 예시
#         print(f"\n3. 사용 예시:")
#         print("   # 방법 1 - 기존 방식 (기관명 직접 사용)")
#         print(f"   result = scrape_list('{test_org}', start_page=1, end_page=1)")
#         print()
#         print("   # 방법 2 - 새로운 방식 (설정 직접 전달)")
#         print(f"   settings = find_settings_by_org_name('{test_org}')")
#         print("   if settings:")
#         print("       result = scrape_list_by_settings(settings, start_page=1, end_page=1)")

#         print("\n=== 테스트 완료 ===")
#         return True

#     except Exception as e:
#         print(f"테스트 중 오류 발생: {e}")
#         import traceback
#         traceback.print_exc()
#         return False


# def test_settings_validation():
#     """설정 검증 테스트"""
#     print("\n=== 설정 검증 테스트 ===")

#     try:
#         from spider.spider_list import find_settings_by_org_name

#         # 1. 존재하는 기관명 테스트
#         print("1. 유효한 기관명 테스트:")
#         test_orgs = ["한국공항공사", "서울특별시", "부산광역시"]

#         for org in test_orgs:
#             settings = find_settings_by_org_name(org)
#             if settings:
#                 print(f"   ✓ {org}: 설정 존재 ({len(settings)}개 필드)")
#             else:
#                 print(f"   ✗ {org}: 설정 없음")

#         # 2. 존재하지 않는 기관명 테스트
#         print("\n2. 무효한 기관명 테스트:")
#         invalid_orgs = ["존재하지않는기관", ""]

#         for org in invalid_orgs:
#             settings = find_settings_by_org_name(org)
#             if settings:
#                 print(f"   ✗ {org}: 예상치 못한 설정 존재")
#             else:
#                 print(f"   ✓ {org}: 설정 없음 (예상된 결과)")

#     except Exception as e:
#         print(f"설정 검증 테스트 중 오류 발생: {e}")


def test_dict_settings():
    """새로운 dict 기반 설정 시스템 테스트"""
    print("=== Dict 기반 설정 시스템 테스트 ===")

    try:
        # 1. 설정 조회 (dict 형식)
        print("1. Dict 형식 설정 조회 테스트:")
        test_org = '가평군청'
        settings_dict = find_settings_by_org_name(test_org, output_format='dict')

        if settings_dict:
            print(f"   ✓ {test_org} 설정 조회 성공")
            print(f"   - 기관명: {settings_dict.get('org_name', 'N/A')}")
            print(f"   - URL: {settings_dict.get('url', 'N/A')[:60]}...")
            print(f"   - 시작페이지: {settings_dict.get('startPage', 'N/A')}")
            print(f"   - 종료페이지: {settings_dict.get('endPage', 'N/A')}")
            print(f"   - rowXpath: {settings_dict.get('rowXpath', 'N/A')[:50]}...")
        else:
            print(f"   ✗ {test_org} 설정 조회 실패")
            return False

        # 2. 설정 검증
        print("\n2. 설정 필수 필드 검증:")
        required_fields = ['org_name', 'url', 'rowXpath', 'startPage', 'endPage']
        for field in required_fields:
            value = settings_dict.get(field)
            if value:
                print(f"   ✓ {field}: {value}")
            else:
                print(f"   ✗ {field}: 누락")

        # 3. scrape_list_by_settings 함수 시그니처 확인
        print("\n3. 새로운 함수 시그니처 확인:")
        import inspect
        sig = inspect.signature(scrape_list_by_settings)
        params = list(sig.parameters.keys())
        print(f"   scrape_list_by_settings 매개변수: {params}")

        if 'settings' in params and len(params) == 2:  # settings, debug
            print("   ✓ 함수 시그니처가 예상대로 변경됨")
        else:
            print("   ✗ 함수 시그니처가 예상과 다름")

        # 4. 사용 예시 출력
        print("\n4. 새로운 사용 방법:")
        print("   # Dict 기반 설정으로 스크래핑")
        print(f"   settings = find_settings_by_org_name('{test_org}')")
        print("   if settings:")
        print("       result = scrape_list_by_settings(settings)")
        print("       # 또는 디버그 모드로")
        print("       result = scrape_list_by_settings(settings, debug=True)")

        print("\n   # 설정 수정 예시")
        print("   settings['startPage'] = 1")
        print("   settings['endPage'] = 2")
        print("   result = scrape_list_by_settings(settings)")

        return True

    except Exception as e:
        print(f"테스트 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_compatibility():
    """기존 인터페이스 호환성 테스트"""
    print("\n=== 기존 인터페이스 호환성 테스트 ===")

    try:
        test_org = '가평군청'

        # 기존 방식으로도 작동하는지 확인
        print(f"1. 기존 scrape_list 함수 호출 테스트 ({test_org}):")

        import inspect
        sig = inspect.signature(scrape_list)
        params = list(sig.parameters.keys())
        print(f"   scrape_list 매개변수: {params}")

        if 'org_name' in params:
            print("   ✓ 기존 인터페이스 유지됨")
        else:
            print("   ✗ 기존 인터페이스가 변경됨")

        print(f"   # 기존 사용법")
        print(f"   result = scrape_list('{test_org}', start_page=1, end_page=2)")

        return True

    except Exception as e:
        print(f"호환성 테스트 중 오류 발생: {e}")
        return False


if __name__ == "__main__":
    print("스크래핑 함수 테스트 시작\n")

    success1 = test_dict_settings()
    success2 = test_compatibility()

    if success1 and success2:
        print("\n✓ 모든 테스트가 완료되었습니다.")
    else:
        print("\n✗ 일부 테스트가 실패했습니다.")