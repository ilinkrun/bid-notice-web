# Korean Government Bid Notice API (Nara)

Node.js implementation for collecting and processing Korean government bid notices from the public data portal (data.go.kr).

This is a refactored version of the Python implementation, providing the same functionality with modern TypeScript/Node.js architecture.

## Features

- **API Client**: Fetch bid notices from Korean government public data portal
- **Data Parser**: Convert raw API responses to structured database format
- **Database Manager**: MySQL operations with connection pooling and keyword matching
- **Collector**: Orchestrate data collection with error handling and pagination
- **Service Layer**: High-level business logic combining all components

## Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Edit .env with your credentials
```

## Configuration

Required environment variables in `.env`:

```env
DATA_GO_KR_SERVICE_KEY=your_service_key_here
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password_here
MYSQL_DATABASE=bid_notice
```

## Usage

### Development Commands

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Run built version
npm start

# Run tests
npm run test
```

### CLI Commands

```bash
# Test API client functionality
npm run dev test-api

# Test database functionality
npm run dev test-database

# Test complete service
npm run dev test-service

# Collect today's notices
npm run dev collect-today

# Collect last 3 days of notices
npm run dev collect-latest
```

### Programmatic Usage

```typescript
import { BidNoticeService } from '@/nara-api';

const config = {
  serviceKey: 'your_service_key',
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'password',
  database: 'bid_notice'
};

const service = new BidNoticeService(config);

// Initialize (create tables)
await service.initialize();

// Collect today's notices
const result = await service.collectTodayNotices({
  saveToDatabase: true,
  applyKeywordMatching: true
});

console.log(`Collected ${result.collection_result.collected_count} notices`);

// Cleanup
await service.close();
```

## Architecture

### Core Components

- **ApiClient** (`api-client.ts`): HTTP client for Korean government APIs
- **Parser** (`parser.ts`): Data transformation and validation
- **Collector** (`collector.ts`): Data collection orchestration
- **Database** (`database.ts`): MySQL operations and keyword matching
- **Service** (`service.ts`): High-level business logic
- **Models** (`models.ts`): TypeScript interfaces and database schemas

### Database Schema

Key tables created automatically:

- `public_bid_notices`: Bid notice data with metadata
- `keyword_rules`: Keyword matching rules for categorization
- `api_collection_logs`: API call logs and statistics

### Data Flow

1. **Collect**: Fetch raw data from government APIs
2. **Parse**: Convert to structured format with type validation
3. **Store**: Save to MySQL with duplicate detection
4. **Process**: Apply keyword matching for categorization
5. **Log**: Record collection statistics and errors

## API Reference

### BidNoticeService

Main service class providing high-level operations.

```typescript
// Collect today's notices
await service.collectTodayNotices(options);

// Collect date range
await service.collectNotices({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
  saveToDatabase: true
});

// Get statistics
const stats = await service.getStatistics();
```

### DataGoKrApiClient

Low-level API client for direct government API access.

```typescript
const client = new DataGoKrApiClient('service_key');

// Get specific page
const notices = await client.getBidPblancListInfoServc({
  pageNo: 1,
  numOfRows: 100,
  inqryBgnDt: '202401010000',
  inqryEndDt: '202401310000'
});

// Get all pages
const allNotices = await client.getAllBidList(startDate, endDate);
```

### DatabaseManager

Direct database operations and keyword matching.

```typescript
const db = new DatabaseManager(config);

// Create tables
await db.createTables();

// Save notices
await db.saveBidNotices(notices);

// Apply keyword matching
await db.applyKeywordMatching(100);
```

## Error Handling

The system includes comprehensive error handling:

- API request failures with retry logic
- Database connection issues
- Data parsing errors
- Invalid date formats
- Network timeouts

All errors are logged with context and can be accessed through result objects.

## Keyword Matching

Automatic categorization using configurable keyword rules:

- **Categories**: IT/소프트웨어, 하드웨어/네트워크, 컨설팅/용역, etc.
- **Match Types**: exact, contains, regex
- **Fields**: title, dept_name, work_class, industry, or all
- **Scoring**: Weighted scoring with category selection

## Performance

- Connection pooling for database efficiency
- Pagination for large data sets
- Rate limiting for API requests
- Batch operations for bulk saves
- Configurable processing limits

## Development

### Project Structure

```
src/
├── api-client.ts      # Government API client
├── parser.ts          # Data transformation
├── collector.ts       # Collection orchestration
├── database.ts        # MySQL operations
├── service.ts         # Business logic
├── models.ts          # Types and schemas
├── index.ts           # Main entry point
└── test-bid-api.ts    # Test script
```

### Testing

Run the test script to verify functionality:

```bash
# Test API connectivity
npm run dev test-api

# Test database operations
npm run dev test-database

# Test complete integration
npm run dev test-service
```

## Migration from Python

This Node.js implementation provides equivalent functionality to the original Python version:

- Same API endpoints and parameters
- Compatible database schema
- Identical keyword matching logic
- Similar error handling patterns
- Equivalent performance characteristics

Key improvements:
- Modern TypeScript with full type safety
- Promise-based async/await patterns
- Better error handling and logging
- Modular architecture with clear separation
- Comprehensive testing and documentation

## License

This project is part of the Korean government bid notice system.