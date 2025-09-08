# Bid Notice Scraper Project - Core Python Modules Documentation

## Table of Contents

1. [Spider Modules](#spider-modules)
   - [spider_list.py](#spider_listpy)
   - [spider_detail.py](#spider_detailpy)
   - [spider_lxml.py](#spider_lxmlpy)

2. [MySQL Modules](#mysql-modules)
   - [utils_mysql.py](#utils_mysqlpy)
   - [mysql_bid.py](#mysql_bidpy)
   - [mysql_board.py](#mysql_boardpy)

3. [Utilities Modules](#utilities-modules)
   - [utils_data.py](#utils_datapy)
   - [utils_log.py](#utils_logpy)
   - [utils_lxml.py](#utils_lxmlpy)
   - [utils_search.py](#utils_searchpy)

4. [Server Modules](#server-modules)
   - [server_bid.py](#server_bidpy)
   - [server_spider.py](#server_spiderpy)
   - [server_mysql.py](#server_mysqlpy)
   - [server_board.py](#server_boardpy)

---

## Spider Modules

### spider_list.py

**Purpose**: Main scraping module for government bid notices from various Korean public institutions.

#### Key Global Variables
- `HEADLESS = True`: Controls browser headless mode
- `SEPERATOR = "|-"`: Separator for scraping elements and file paths
- `ERROR_CODES`: Dictionary of error codes for different failure scenarios
- `TABLE_NOTICES = "notices"`: Main notices table name

#### Main Functions

##### `scrape_list(org_name, start_page=1, end_page=1, debug=False)`
**Purpose**: Scrapes bid notice listings from specified organization
**Parameters**:
- `org_name (str)`: Name of the organization to scrape
- `start_page (int)`: Starting page number
- `end_page (int)`: Ending page number  
- `debug (bool)`: Enable debug mode for HTML saving

**Returns**: `dict` with structure:
```python
{
    'org_name': str,
    'error_code': int,  # 0 for success
    'error_message': str,
    'data': List[Dict]  # Scraped notice data
}
```

##### `fetch_list_pages(names, save=True)`
**Purpose**: Batch scraping function that processes multiple organizations
**Parameters**:
- `names (list)`: List of organization names
- `save (bool)`: Whether to save results to database

**Returns**: List of scraping results

##### `insertListData(csv)`
**Purpose**: Inserts scraped data into database with duplicate checking
**Parameters**:
- `csv (list)`: CSV format data with headers and rows

**Returns**: List of dictionaries with insertion counts per organization

#### Helper Functions

##### `get_format_date(date_str)`
**Purpose**: Converts various date string formats to 'YYYY-MM-DD'
**Parameters**: `date_str (str)`: Date string to convert
**Returns**: `str`: Formatted date string

##### `_get_rows_after_row(row, key, rst)`
**Purpose**: Callback function for post-processing row data
**Parameters**:
- `row (dict)`: Current row data
- `key (str)`: Field key being processed
- `rst (str)`: Raw scraped value

#### Dependencies
- `requests`: HTTP requests
- `playwright`: Browser automation as fallback
- `utils_mysql.Mysql`: Database operations
- `utils_lxml`: HTML parsing utilities

---

### spider_detail.py

**Purpose**: Handles scraping of detailed bid notice pages and file downloads.

#### Main Functions

##### `_fetch_detail_by_org_name(url, name, required_keys=["제목"])`
**Purpose**: Scrapes detailed information from a notice URL
**Parameters**:
- `url (str)`: URL of the detail page
- `name (str)`: Organization name
- `required_keys (list)`: Required fields to validate scraping success

**Returns**: `dict` containing detailed notice information

##### `upsert_detail_by_nid(nid)`
**Purpose**: Fetches and saves detail information for a notice ID
**Parameters**: `nid (int)`: Notice ID from database
**Returns**: `dict`: Saved detail information

##### `download_by_nid(nid, folder="/path/")`
**Purpose**: Downloads all files associated with a notice
**Parameters**:
- `nid (int)`: Notice ID
- `folder (str)`: Download destination folder

#### File URL Processing Functions

##### `_file_url_href(rst)`, `_file_url_js(rst, base_url)`, etc.
**Purpose**: Various callback functions for processing different file URL formats
**Parameters**: 
- `rst (str)`: Raw extracted URL/data
- `base_url (str)`: Base URL for relative links

#### Dependencies
- `requests`: HTTP requests
- `playwright`: Browser automation
- `utils_mysql.Mysql`: Database operations
- `spider_lxml`: HTML parsing

---

### spider_lxml.py

**Purpose**: Core HTML parsing utilities using lxml library.

#### Main Functions

##### `get_val(root, xpath, target, joiner=SEPERATOR)`
**Purpose**: Extracts values from HTML elements using XPath
**Parameters**:
- `root`: lxml HTML tree root
- `xpath (str)`: XPath expression
- `target (str)`: Target attribute or content type
- `joiner (str)`: Separator for multiple values

**Returns**: `str`: Extracted value

**Supported targets**:
- `"text"` or `None`: Text content
- `"content"`: All text content
- `"outerhtml"`: Full element HTML
- `"innerhtml"/"html"`: Inner HTML
- Attribute names: Element attributes

##### `get_rows(html, rowXpath, elements, cb_after_row=None, cb_after_rows=None)`
**Purpose**: Extracts multiple rows of data from HTML
**Parameters**:
- `html (str)`: HTML content
- `rowXpath (str)`: XPath for row elements
- `elements (list)`: List of element configurations
- `cb_after_row`: Callback for row processing
- `cb_after_rows`: Callback for final row processing

**Returns**: `list`: List of extracted row dictionaries

##### `get_dict(html, elements, cb_on_key={})`
**Purpose**: Extracts single dictionary from HTML
**Parameters**:
- `html (str)`: HTML content
- `elements (list)`: Element extraction configurations
- `cb_on_key (dict)`: Special callback functions for specific keys

**Returns**: `dict`: Extracted data

##### `remove_scripts_from_html(html_string)`
**Purpose**: Removes script tags and comments from HTML
**Parameters**: `html_string (str)`: HTML to clean
**Returns**: `str`: Cleaned HTML

#### File Download Functions

##### `download_by_url_with_headers(url, output_dir='downloads', filename=None, headers=None)`
**Purpose**: Downloads files with custom headers
**Parameters**:
- `url (str)`: Download URL
- `output_dir (str)`: Output directory
- `filename (str)`: Custom filename
- `headers (dict)`: HTTP headers

**Returns**: `str`: Downloaded file path or None if failed

---

## MySQL Modules

### utils_mysql.py

**Purpose**: Base MySQL database wrapper providing core CRUD operations.

#### Class: Mysql

##### `__init__(config=None)`
**Purpose**: Initialize MySQL connection
**Parameters**: `config (dict)`: Optional connection configuration

##### `fetch(sql, limit=0, close=False)`
**Purpose**: Execute SELECT query and return results
**Parameters**:
- `sql (str)`: SQL query
- `limit (int)`: Result limit (0=all, 1=single row)
- `close (bool)`: Close connection after query

**Returns**: Query results as tuples

##### `exec(sql, close=False)`
**Purpose**: Execute non-SELECT queries (INSERT, UPDATE, DELETE)
**Parameters**:
- `sql (str)`: SQL query
- `close (bool)`: Close connection after query

##### `find(table_name, fields=None, addStr="", limit=0, close=False)`
**Purpose**: Select data from table with conditions
**Parameters**:
- `table_name (str)`: Target table
- `fields (list)`: Columns to select
- `addStr (str)`: Additional SQL conditions
- `limit (int)`: Result limit
- `close (bool)`: Close connection

**Returns**: List of tuples

##### `insert(table_name, data, close=False, inType="csv")`
**Purpose**: Insert multiple rows
**Parameters**:
- `table_name (str)`: Target table
- `data`: Data in CSV or dict format
- `inType (str)`: "csv" or "dicts"

##### `upsert(table_name, data, updKeys=[], close=False, inType="csv")`
**Purpose**: Insert or update on duplicate key
**Parameters**:
- `table_name (str)`: Target table
- `data`: Data to upsert
- `updKeys (list)`: Keys to update on duplicate

##### `update(table_name, update_data, where_condition=None, close=False)`
**Purpose**: Update existing records
**Parameters**:
- `table_name (str)`: Target table
- `update_data (dict)`: Column-value pairs
- `where_condition (str)`: WHERE clause

#### Helper Functions

##### `_where_like_unit(values, field, joiner="or")`
**Purpose**: Generate LIKE WHERE clauses
**Parameters**:
- `values (list)`: Values to search
- `field (str)`: Column name
- `joiner (str)`: "or" or "and"

**Returns**: `str`: WHERE clause

##### `_where_eq_unit(values, field, joiner="or")`
**Purpose**: Generate equality WHERE clauses
**Parameters**: Similar to `_where_like_unit`
**Returns**: `str`: WHERE clause

---

### mysql_bid.py

**Purpose**: Specialized MySQL operations for bid notice system with advanced search and categorization.

#### Global Constants
- `CATEGORIES = ["공사점검", "성능평가", "기타"]`: System categories
- `SETTINGS_NOTICE_LIST_FIELDS`: Configuration fields for list scraping
- `SETTINGS_NOTICE_DETAIL_FIELDS`: Configuration fields for detail scraping

#### Settings Management Functions

##### `find_settings_list(fields, addStr="WHERE use=1", out_type="dicts")`
**Purpose**: Retrieve scraping configuration for organizations
**Parameters**:
- `fields (list)`: Fields to retrieve
- `addStr (str)`: Additional SQL conditions
- `out_type (str)`: Output format ("dicts", "tuples", "csv")

**Returns**: Organization settings in specified format

##### `find_settings_list_by_org_name(name, fields, out_type="tuple")`
**Purpose**: Get specific organization's scraping settings
**Parameters**:
- `name (str)`: Organization name
- `fields (list)`: Fields to retrieve
- `out_type (str)`: Output format

**Returns**: Organization configuration with elements

##### `upsert_settings_list(name, data)`
**Purpose**: Update organization settings including elements
**Parameters**:
- `name (str)`: Organization name
- `data (dict)`: Settings data with elements

**Returns**: `bool`: Success status

#### Category and Search Functions

##### `find_all_settings_category(fields, addStr="WHERE use=1")`
**Purpose**: Get all keyword search settings
**Returns**: List of category configurations

##### `search_notice_list(keywords, nots, min_point, field="제목", add_fields=[], add_where="")`
**Purpose**: Advanced keyword search with weighting and exclusions
**Parameters**:
- `keywords (str)`: "keyword*weight,keyword*weight,..." format
- `nots (str)`: Comma-separated exclusion terms
- `min_point (int)`: Minimum score threshold
- `field (str)`: Search field
- `add_fields (list)`: Additional fields to return
- `add_where (str)`: Additional WHERE conditions

**Returns**: List of matching notices with scores

##### `get_search_weight(keywords, min_point=4, field="제목", table_name="notices", add_fields=[], add_where="")`
**Purpose**: Weighted keyword search implementation
**Returns**: List of dictionaries with match details

##### `filter_by_not(not_str="", dicts=[], field="sn")`
**Purpose**: Filter results by exclusion terms
**Parameters**:
- `not_str (str)`: Comma-separated exclusion terms
- `dicts (list)`: Data to filter
- `field (str)`: Field to check exclusions against

**Returns**: Filtered results list

#### Notice Management Functions

##### `find_notice_list_by_category(category, day_gap=15)`
**Purpose**: Get notices by category within timeframe
**Parameters**:
- `category (str)`: Category name or "무관" for uncategorized
- `day_gap (int)`: Days back to search

**Returns**: List of categorized notices with region/registration info

##### `update_category_batch(category, delta_hours=23, start_time=None)`
**Purpose**: Batch update notice categories based on keywords
**Parameters**:
- `category (str)`: Category to update
- `delta_hours (int)`: Hours back to process
- `start_time (str)`: UTC start time

##### `update_all_category(delta_hours=23, start_time=None)`
**Purpose**: Update all categories in batch
**Parameters**: Similar to `update_category_batch`

#### Utility Functions

##### `unpack_settings_elements(settings={})`
**Purpose**: Convert settings dictionary to element configuration list
**Parameters**: `settings (dict)`: Settings with "xpath|-target|-callback" format
**Returns**: `list`: Element configuration objects

##### `pack_settings_elements(elements)`
**Purpose**: Convert element list back to settings dictionary
**Parameters**: `elements (list)`: Element configuration objects
**Returns**: `dict`: Settings dictionary

##### `add_settings_to_notice(notice, keys=['지역', '등록'])`
**Purpose**: Add organization settings to notice data
**Parameters**:
- `notice (dict)`: Notice data
- `keys (list)`: Setting keys to add

**Returns**: Enhanced notice data

---

### mysql_board.py

**Purpose**: Simple board/forum CRUD operations for development communication.

#### Table Schema
```sql
CREATE TABLE channel_dev (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    format ENUM('text', 'markdown', 'html') DEFAULT 'text',
    writer VARCHAR(50) NOT NULL,
    password CHAR(4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_visible BOOLEAN DEFAULT TRUE
);
```

#### Functions

##### `create_post(data, table_name='channel_dev')`
**Purpose**: Create new board post
**Parameters**:
- `data (dict)`: Post data with required fields
- `table_name (str)`: Target table

**Returns**: `int`: Created post ID

##### `get_post(post_id, table_name='channel_dev')`
**Purpose**: Retrieve specific post
**Parameters**:
- `post_id (int)`: Post ID
- `table_name (str)`: Source table

**Returns**: `dict`: Post data or None

##### `update_post(post_id, data, password, table_name='channel_dev')`
**Purpose**: Update post with password verification
**Parameters**:
- `post_id (int)`: Post ID
- `data (dict)`: Update data
- `password (str)`: Verification password
- `table_name (str)`: Target table

**Returns**: `bool`: Success status

##### `delete_post(post_id, password, table_name='channel_dev')`
**Purpose**: Delete post with password verification
**Parameters**: Similar to update_post
**Returns**: `bool`: Success status

##### `list_posts(page=1, per_page=20, only_visible=True, table_name='channel_dev')`
**Purpose**: Get paginated post list
**Parameters**:
- `page (int)`: Page number
- `per_page (int)`: Posts per page  
- `only_visible (bool)`: Show only visible posts
- `table_name (str)`: Source table

**Returns**: `tuple`: (total_count, posts_list)

---

## Utilities Modules

### utils_data.py

**Purpose**: Data manipulation, file operations, and encoding utilities.

#### Core Utility Functions

##### `valid_str(val)`
**Purpose**: Check if value is valid non-empty string
**Parameters**: `val`: Value to check
**Returns**: `bool`: Validity status

##### `is_empty(val)`
**Purpose**: Check if value is empty (None, empty string, list, or dict)
**Parameters**: `val`: Value to check
**Returns**: `bool`: Empty status

#### Data Conversion Functions

##### `dict_from_tuple(fields, tp)`
**Purpose**: Create dictionary from field names and tuple
**Parameters**:
- `fields (list)`: Field names
- `tp (tuple)`: Values tuple

**Returns**: `dict`: Created dictionary

##### `dicts_from_tuples(fields, tuples)`
**Purpose**: Create list of dictionaries from field names and tuple list
**Parameters**:
- `fields (list)`: Field names
- `tuples (list)`: List of value tuples

**Returns**: `list`: List of dictionaries

##### `csv_from_dict(dct)` / `csv_from_dicts(dicts)`
**Purpose**: Convert dictionary/dictionaries to CSV format
**Parameters**: Dictionary or list of dictionaries
**Returns**: `list`: CSV format [headers, row1, row2, ...]

##### `csv_added_defaults(csv, defaults={}, is_push=False)`
**Purpose**: Add default columns to CSV data
**Parameters**:
- `csv (list)`: CSV data
- `defaults (dict)`: Default column values
- `is_push (bool)`: Append vs prepend columns

**Returns**: `list`: Enhanced CSV data

#### File Operations

##### `save_html(html, filename)` / `load_html(file_path)`
**Purpose**: Save/load HTML content to/from files
**Parameters**:
- `html (str)`: HTML content
- `filename (str)`: File path

##### `find_folders(root_path, search='', recursive=False)`
**Purpose**: Search for directories matching pattern
**Parameters**:
- `root_path (str)`: Search root
- `search (str)`: Search pattern
- `recursive (bool)`: Recursive search

**Returns**: `list`: Matching directory paths

##### `find_files(root_path, search='', recursive=False, file_extension=None)`
**Purpose**: Search for files matching criteria
**Parameters**: Similar to find_folders plus file_extension
**Returns**: `list`: Matching file paths

#### Encoding Functions

##### `fix_encoding_response(response)`
**Purpose**: Fix encoding issues in HTTP responses
**Parameters**: `response`: requests.Response object
**Returns**: `str`: Properly decoded text

##### `contains_korean(text)`
**Purpose**: Check if text contains Korean characters
**Parameters**: `text (str)`: Text to check
**Returns**: `bool`: Contains Korean

##### `decode_html_text(html_text)`
**Purpose**: Decode HTML entities and escaped unicode
**Parameters**: `html_text (str)`: HTML text
**Returns**: `str`: Decoded text

#### NAS/Directory Management

##### `find_folder_by_category(category="공사점검", full=True)`
**Purpose**: Get folder path for specific project category
**Parameters**:
- `category (str)`: Project category
- `full (bool)`: Return full path

**Returns**: `str`: Folder path

##### `find_notice_folder(category="공사점검", company='일맥', org_name='종로구청')`
**Purpose**: Find or generate folder for specific notice
**Parameters**:
- `category (str)`: Project category
- `company (str)`: Company name
- `org_name (str)`: Organization name

**Returns**: `str`: Notice folder path

---

### utils_log.py

**Purpose**: Logging utilities (currently minimal implementation).

**Contents**: Contains basic logging structure placeholder.

---

### utils_lxml.py

**Purpose**: Extended lxml utilities (duplicate of spider_lxml.py functionality).

**Note**: This appears to be a duplicate of the spider_lxml.py functionality with the same core functions:
- `get_val()`: XPath value extraction
- `get_rows()`: Multiple row extraction  
- `get_dict()`: Single dictionary extraction
- `remove_scripts_from_html()`: HTML cleaning
- File download functions

---

### utils_search.py

**Purpose**: Advanced search utilities for database queries with keyword weighting.

#### Search Configuration

##### `find_default_keyword(domain="공사점검")`
**Purpose**: Get default search settings for domain
**Parameters**: `domain (str)`: Search domain
**Returns**: `tuple`: (keywords, exclusions, min_score)

##### `find_default_keywords(domains=SEARCH_DOMAINS)`
**Purpose**: Get search settings for multiple domains
**Parameters**: `domains (list)`: Domain list
**Returns**: `dict`: Domain settings mapping

#### Core Search Functions

##### `get_keyword_weight_list(keyword_weight_str)`
**Purpose**: Parse weighted keyword string
**Parameters**: `keyword_weight_str (str)`: "word*weight,word*weight" format
**Returns**: `list`: [(keyword, weight), ...] pairs

##### `get_search_weight(keyword_weight_str, min_point=4, add_where="")`
**Purpose**: Perform weighted keyword search
**Parameters**:
- `keyword_weight_str (str)`: Weighted keywords
- `min_point (int)`: Minimum score threshold
- `add_where (str)`: Additional WHERE conditions

**Returns**: `list`: [{nid: {title, matched, point}}, ...]

##### `find_nids_by_search_setting(keyword_weight_str, nots_str, min_point, add_where="")`
**Purpose**: Get notice IDs matching search criteria
**Parameters**:
- `keyword_weight_str (str)`: Weighted keywords
- `nots_str (str)`: Exclusion terms
- `min_point (int)`: Score threshold
- `add_where (str)`: Additional conditions

**Returns**: `list`: Matching notice IDs

#### Database Integration

##### `find_nids_in_table(nids, table_name, exist=True)`
**Purpose**: Check which notice IDs exist in specific table
**Parameters**:
- `nids (list)`: Notice IDs to check
- `table_name (str)`: Target table
- `exist (bool)`: Return existing vs missing IDs

**Returns**: `list`: Filtered notice IDs

##### `find_notice_list_by_nids(nids, base_sql="", add_sql="")`
**Purpose**: Get detailed notice information by IDs
**Parameters**:
- `nids (list)`: Notice IDs
- `base_sql (str)`: Base SQL query
- `add_sql (str)`: Additional SQL clauses

**Returns**: Database query results

##### `find_nids_for_fetch_notice_details(last_date=None)`
**Purpose**: Find notice IDs needing detail scraping
**Parameters**: `last_date (str)`: Last processed date
**Returns**: `list`: Notice IDs for detail processing

---

## Server Modules

### server_bid.py

**Purpose**: Main FastAPI server providing comprehensive bid notice management API.

#### Server Configuration
- **Host**: 0.0.0.0
- **Port**: 11303
- **CORS**: Enabled for all origins
- **Middleware**: Request timing logging

#### API Endpoints

##### Settings Management
- `GET /settings_list`: Get all scraping configurations
- `GET /settings_list/{org_name}`: Get specific organization settings
- `POST /settings_list/{org_name}`: Update organization settings
- `GET /settings_detail`: Get all detail scraping settings
- `GET /settings_detail/{org_name}`: Get organization detail settings

##### Notice Operations
- `GET /notice_list?gap={days}`: Get recent notices within timeframe
- `GET /notice_list/{category}?gap={days}`: Get notices by category
- `GET /notice_list_statistics?gap={days}`: Get statistical data
- `GET /last_notice/{org_name}?field={field}`: Get organization's latest notice
- `POST /search_notice_list`: Advanced keyword search
- `POST /notice_list`: Batch update notice data

##### Bid Management
- `GET /my_bids`: Get all bids
- `GET /my_bids/{status}`: Get bids by status

##### Scraping Operations
- `GET /check_fetch_list?org_name={name}`: Test organization scraping

##### Keyword/Category Management
- `GET /settings_categorys`: Get all category configurations
- `GET /settings_categorys/{category}`: Get specific category settings
- `POST /category_weight_search`: Weighted keyword search
- `POST /filter_notice_list`: Filter notices by exclusion terms
- `GET /parse_keyword_weights?keyword_weight_str={str}`: Parse keyword weights

##### System Management
- `DELETE /delete_old_notice_list?day_gap={days}`: Clean old notices
- `POST /backup_db`: Backup database
- `GET /logs_scraping?gap={days}`: Get scraping logs
- `GET /errors_notice_scraping?gap={days}`: Get error logs

#### Request/Response Models

**KeywordSearch**:
```python
{
    "keywords": "keyword*weight,keyword*weight",
    "min_point": 4,
    "field": "제목",
    "add_fields": ["상세페이지주소", "작성일"],
    "add_where": "additional SQL conditions"
}
```

**Search**:
```python
{
    "keywords": "weighted keywords",
    "nots": "exclusion,terms",
    "min_point": 4,
    "add_where": "SQL conditions"
}
```

---

### server_spider.py

**Purpose**: Lightweight FastAPI server focused on scraping operations.

#### Server Configuration
- **Port**: 11301
- **Reload**: Disabled for production

#### API Endpoints

##### `GET /check_fetch_list?org_name={name}`
**Purpose**: Test scraping functionality for organization
**Parameters**: `org_name (str)`: Organization name
**Returns**: Scraping result with error codes and data

##### `POST /test_csv/`
**Purpose**: Test CSV data processing
**Parameters**: CSV request body
**Returns**: Echoed CSV data

##### `GET /hello`
**Purpose**: Health check endpoint
**Returns**: Simple greeting message

---

### server_mysql.py

**Purpose**: Direct MySQL operations server with advanced search capabilities.

#### Server Configuration
- **Port**: 11302
- **Direct SQL**: Enabled for complex queries

#### API Endpoints

##### `POST /fetch_by_sql/`
**Purpose**: Execute arbitrary SQL queries
**Request Body**:
```python
{
    "sql": "SELECT * FROM notices WHERE ..."
}
```
**Returns**: Query results

##### `POST /notice_list_by_search/`
**Purpose**: Advanced notice search with keyword weighting
**Request Body**:
```python
{
    "keywords": "keyword*weight,keyword*weight",
    "nots": "exclusion,terms",
    "min_point": 4,
    "add_where": "additional conditions",
    "base_sql": "custom base query",
    "add_sql": "ORDER BY clauses"
}
```

**Search Process**:
1. Parse weighted keywords
2. Execute individual keyword searches
3. Aggregate and score results
4. Apply exclusion filters
5. Return filtered notice IDs and details

---

### server_board.py

**Purpose**: Board/forum management server for team communication.

#### Server Configuration
- **Port**: 11307
- **CORS**: Enabled for cross-origin access

#### API Endpoints

##### `POST /posts/{table_name}`
**Purpose**: Create new post
**Request Body**:
```python
{
    "title": "Post title",
    "content": "Post content",
    "writer": "Author name",
    "password": "1234",
    "format": "text|markdown|html",
    "is_visible": true
}
```
**Returns**: `{"id": post_id}`

##### `GET /posts/{table_name}/{post_id}`
**Purpose**: Get specific post
**Returns**: Full post data including metadata

##### `PUT /posts/{table_name}/{post_id}`
**Purpose**: Update post with password verification
**Request Body**: Post data including password
**Returns**: Success confirmation

##### `DELETE /posts/{table_name}/{post_id}`
**Purpose**: Delete post with password verification
**Request Body**: `{"password": "1234"}`
**Returns**: Success confirmation

##### `GET /posts/{table_name}?page=1&per_page=20&only_visible=true`
**Purpose**: Get paginated post list
**Parameters**:
- `page (int)`: Page number
- `per_page (int)`: Posts per page  
- `only_visible (bool)`: Filter visibility

**Returns**:
```python
{
    "total_count": 100,
    "page": 1,
    "per_page": 20,
    "posts": [...]
}
```

---

## Key Relationships and Dependencies

### Module Dependencies

1. **spider_list.py** → utils_mysql, mysql_bid, utils_lxml, utils_data
2. **spider_detail.py** → utils_mysql, mysql_bid, spider_lxml
3. **mysql_bid.py** → utils_mysql, utils_data
4. **server_bid.py** → mysql_bid, spider_list (comprehensive API)
5. **utils_search.py** → utils_mysql, utils_data

### Data Flow

1. **Scraping**: spider_list → spider_detail → database
2. **Search**: utils_search → mysql_bid → filtered results
3. **API**: server_bid → mysql_bid → database operations
4. **File Operations**: spider_detail → utils_lxml → file downloads

### Error Handling

All modules implement comprehensive error handling with:
- Standardized error codes in spider_list.py
- Try-catch blocks with graceful fallbacks
- Logging for debugging and monitoring
- HTTP status codes in server modules

### Configuration Management

Settings are stored in database tables:
- `settings_list`: Organization scraping configurations
- `settings_detail`: Detail page extraction rules
- `settings_category`: Keyword search configurations

This documentation provides a complete reference for the bid-notice-scraper project's core Python modules, their functions, parameters, return types, and interdependencies.