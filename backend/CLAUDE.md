# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## System Overview

This is a **Korean government bid notice scraping system** that automatically collects and categorizes public procurement announcements. The system uses a multi-server FastAPI architecture with web scraping, database management, and API services.

## Architecture

### Multi-Server Setup
Four FastAPI servers run simultaneously:
- **`server_spider.py` (port 11301)** - Web scraping operations using Playwright and lxml
- **`server_mysql.py` (port 11302)** - Direct database operations and data management  
- **`server_bid.py` (port 11303)** - Main business logic, keyword matching, and external APIs
- **`server_board.py` (port 11307)** - Bulletin board system for manual content management

### Core Components
- **Spider modules** (`spider_*.py`) - Web scraping with configurable XPath selectors
- **MySQL modules** (`mysql_*.py`) - Database operations with connection pooling
- **Utils modules** (`utils_*.py`) - Data processing, logging, search, and XML parsing utilities

### Database Schema
Key tables:
- `notices` - Scraped bid notices with metadata
- `details` - Detailed content and attachments
- `files` - File attachment tracking  
- `settings_list` - Scraping configuration per organization
- `settings_category` - Keyword search and scoring rules
- `settings_category` - Category classification settings

## Development Commands

### Environment Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with MySQL credentials and API keys
```

### Running Servers
```bash
# Start all servers
./start_servers.sh

# Or individually:
python server_spider.py    # Port 11301
python server_mysql.py     # Port 11302  
python server_bid.py       # Port 11303
python server_board.py     # Port 11307
```

### Scraping Operations
```bash
# Manual scraping test
python spider_list.py

# Check scraping logs
tail -f logs/spider_list.log
```

### Database Operations
```bash
# Test database connection
python utils_mysql.py

# Run bid processing
python mysql_bid.py
```

## Key Workflows

### Automated Scraping (Cron)
- Daily execution at 10:00 AM and 10:00 PM KST
- Configured in `config/crontab`
- Logs to `logs/cron.log`

### Data Processing Pipeline
1. **Scrape** - Collect notices from government websites using configured XPath selectors
2. **Extract** - Parse content, extract details and file attachments  
3. **Classify** - Match against keywords and assign categories with weighted scoring
4. **Store** - Save to MySQL with proper encoding and relationships

### Configuration Management
- Organization scraping settings stored in `settings_list` table
- XPath selectors, pagination, login credentials per site
- Keyword rules in `settings_category` with scoring weights
- Category classification in `settings_category`

## API Endpoints

### Spider Server (11301)
- `POST /spider/notice_list/{org_name}` - Scrape specific organization
- `GET /spider/test/{org_name}` - Test scraping configuration

### MySQL Server (11302) 
- `GET /mysql/notice_list` - Query notices with filters
- `POST /mysql/notice_list/{nid}` - Update notice details
- `GET /mysql/files/{nid}` - Get file attachments

### Bid Server (11303)
- `GET /bid/search` - Search notices with keyword matching
- `GET /bid/categories` - Get categorized notices  
- `POST /bid/classify/{nid}` - Manually classify notice

## Development Patterns

### Database Connections
Always use connection context managers:
```python
from utils_mysql import get_connection
with get_connection() as conn:
    # Database operations
    pass
```

### Error Handling
Follow standardized error response format:
```python
{"error_code": int, "error_message": str, "data": None}
```

### Logging
Use consistent logging patterns:
```python
from utils_log import setup_logger
logger = setup_logger(__name__)
```

### Korean Text Processing
Handle Korean encoding properly:
```python
# Use UTF-8 encoding for Korean text
# Check utils_data.py for text processing utilities
```

## Configuration Files

### Environment Variables (.env)
Required variables:
- MySQL connection: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`  
- API keys and external service credentials

### Cron Configuration
- `config/crontab` - Automated scheduling
- `scripts/entrypoint*.sh` - Startup scripts with different configurations

## Troubleshooting

### Common Issues
- **Connection errors**: Check MySQL credentials in .env file
- **Scraping failures**: Verify XPath selectors in settings_list table
- **Korean encoding**: Ensure UTF-8 handling throughout pipeline
- **Memory issues**: Monitor Playwright browser instances and connection pools

### Log Files
- `logs/server_*.log` - Server operation logs
- `logs/spider_*.log` - Scraping operation logs  
- `logs/cron.log` - Scheduled task logs
- `logs/entrypoint.log` - Container startup logs

### Development Testing
Use `scripts/test.py` for development testing and debugging specific components.

## File Organization

- **Root level**: Main server files and entry scripts
- **`config/`**: System configuration files  
- **`scripts/`**: Deployment and utility scripts
- **`logs/`**: Application logs (created at runtime)
- **Spider modules**: Web scraping implementations
- **MySQL modules**: Database abstraction layer
- **Utils modules**: Shared utilities and helpers