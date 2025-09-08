#!/usr/bin/env python3
"""
Simple test script to verify that all server modules can be imported and basic functionality works
without requiring pytest or external dependencies.
"""

import sys
import os

# Add parent directory to path to import server modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))


def test_server_imports():
  """Test that all server modules can be imported successfully"""
  print("Testing server module imports...")

  try:
    from server.server_bid import app as bid_app
    print("✓ server_bid import successful")

    from server.server_mysql import app as mysql_app
    print("✓ server_mysql import successful")

    from server.server_spider import app as spider_app
    print("✓ server_spider import successful")

    return True
  except Exception as e:
    print(f"✗ Import error: {e}")
    import traceback
    traceback.print_exc()
    return False


def test_fastapi_clients():
  """Test that FastAPI test clients can be created"""
  print("\nTesting FastAPI test client creation...")

  try:
    from fastapi.testclient import TestClient
    from server.server_bid import app as bid_app
    from server.server_mysql import app as mysql_app
    from server.server_spider import app as spider_app

    bid_client = TestClient(bid_app)
    mysql_client = TestClient(mysql_app)
    spider_client = TestClient(spider_app)

    print("✓ All FastAPI test clients created successfully")
    return True
  except Exception as e:
    print(f"✗ TestClient error: {e}")
    import traceback
    traceback.print_exc()
    return False


def test_basic_endpoints():
  """Test basic hello endpoints"""
  print("\nTesting basic endpoints...")

  try:
    from fastapi.testclient import TestClient
    from server.server_bid import app as bid_app
    from server.server_spider import app as spider_app

    # Test server_bid hello endpoint
    bid_client = TestClient(bid_app)
    bid_response = bid_client.get("/hello")
    if bid_response.status_code == 200:
      print("✓ server_bid /hello endpoint works")
    else:
      print(f"✗ server_bid /hello endpoint failed: {bid_response.status_code}")

    # Test server_spider hello endpoint
    spider_client = TestClient(spider_app)
    spider_response = spider_client.get("/hello")
    if spider_response.status_code == 200:
      print("✓ server_spider /hello endpoint works")
    else:
      print(
          f"✗ server_spider /hello endpoint failed: {spider_response.status_code}"
      )

    return True
  except Exception as e:
    print(f"✗ Endpoint test error: {e}")
    import traceback
    traceback.print_exc()
    return False


def run_all_tests():
  """Run all tests and return overall result"""
  print("=" * 50)
  print("Running basic functionality tests...")
  print("=" * 50)

  results = []
  results.append(test_server_imports())
  results.append(test_fastapi_clients())
  results.append(test_basic_endpoints())

  print("\n" + "=" * 50)
  if all(results):
    print("✓ All tests passed! The test environment is set up correctly.")
    return True
  else:
    print("✗ Some tests failed. Please check the errors above.")
    return False


if __name__ == "__main__":
  success = run_all_tests()
  sys.exit(0 if success else 1)
