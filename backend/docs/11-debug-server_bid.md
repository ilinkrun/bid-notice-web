

"""
http://192.168.0.2:11301/check_fetch_list
"""

/exposed/apps/backends/bid-notice-scraper/app/server_bid.py 서버가 제대로 작동하는지 테스트를 하려고 해요.

root@9a3e98d21219:/exposed/apps/backends/bid-notice-scraper/scripts# ./start_servers.sh


## test server api

> postman(ilinkrun@gmail.com)

```sh
# 11301
uv run python server_spider.py
# http://192.168.0.2:11301/hello

# 11302
uv run python server_mysql.py
# http://192.168.0.2:11303/settings_list

# 11303 
uv run python server_bid.py
# http://192.168.0.2:11303/settings_list



```