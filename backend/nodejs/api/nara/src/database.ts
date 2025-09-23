/**
 * Database manager for Korean government bid notices
 * Handles MySQL operations, keyword matching, and data processing
 */

import mysql from 'mysql2/promise';
import {
  BidNotice,
  KeywordRule,
  ApiCollectionLog,
  KeywordMatch,
  CollectionResult,
  CREATE_TABLES_ORDER,
  DEFAULT_KEYWORD_RULES
} from './models.js';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface DatabaseStats {
  total_notices: number;
  processed_notices: number;
  matched_notices: number;
  category_distribution: Record<string, number>;
  recent_collections: Array<{
    date: string;
    count: number;
    status: string;
  }>;
}

export class DatabaseManager {
  private config: DatabaseConfig;
  private pool: mysql.Pool;

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.pool = mysql.createPool({
      ...config,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
      timezone: '+00:00'
    });

    console.log('[Database] MySQL pool created');
  }

  /**
   * Get database connection
   */
  async getConnection(): Promise<mysql.PoolConnection> {
    return await this.pool.getConnection();
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('[Database] Connection pool closed');
  }

  /**
   * Create required tables
   */
  async createTables(dropExisting: boolean = false): Promise<void> {
    const connection = await this.getConnection();

    try {
      console.log('[Database] Starting table creation');

      for (const [tableName, tableSQL] of CREATE_TABLES_ORDER) {
        try {
          if (dropExisting) {
            await connection.execute(`DROP TABLE IF EXISTS ${tableName}`);
            console.log(`[Database] Existing table dropped: ${tableName}`);
          }

          await connection.execute(tableSQL);
          console.log(`[Database] Table created: ${tableName}`);

        } catch (error: any) {
          console.error(`[Database] Table ${tableName} creation failed:`, error.message);
          throw error;
        }
      }

      // Insert default keyword rules
      await this.insertDefaultKeywordRules(connection);

      console.log('[Database] All tables created successfully');

    } catch (error: any) {
      console.error('[Database] Table creation error:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Insert default keyword rules
   */
  private async insertDefaultKeywordRules(connection: mysql.PoolConnection): Promise<void> {
    try {
      // Check if keyword rules already exist
      const [existing] = await connection.execute(
        'SELECT COUNT(*) as count FROM keyword_rules'
      ) as any;

      if (existing[0].count > 0) {
        console.log('[Database] Keyword rules already exist, skipping');
        return;
      }

      console.log('[Database] Inserting default keyword rules');

      const insertSQL = `
        INSERT INTO keyword_rules (keyword, category, weight, match_field, match_type, is_negative, is_active, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      for (const rule of DEFAULT_KEYWORD_RULES) {
        await connection.execute(insertSQL, [
          rule.keyword,
          rule.category,
          rule.weight,
          rule.match_field,
          rule.match_type,
          rule.is_negative,
          rule.is_active,
          rule.created_by || 'system'
        ]);
      }

      console.log(`[Database] ${DEFAULT_KEYWORD_RULES.length} default keyword rules inserted`);

    } catch (error: any) {
      console.error('[Database] Default keyword rules insertion failed:', error.message);
      throw error;
    }
  }

  /**
   * Save or update bid notice
   */
  async saveBidNotice(noticeData: BidNotice): Promise<{ id: number; isNew: boolean }> {
    const connection = await this.getConnection();

    try {
      const bidNoticeNo = noticeData.bid_notice_no;
      if (!bidNoticeNo) {
        throw new Error('Bid notice number is required');
      }

      // Check if notice already exists
      const [existing] = await connection.execute(
        'SELECT id, updated_at FROM public_bid_notices WHERE bid_notice_no = ?',
        [bidNoticeNo]
      ) as any;

      // Prepare data for database
      const dbData = { ...noticeData };
      delete dbData.id; // Remove ID from insert/update data

      if (existing.length > 0) {
        // Update existing record
        const noticeId = existing[0].id;

        const updateFields = Object.keys(dbData)
          .map(key => `${key} = ?`)
          .join(', ');

        const updateValues = Object.values(dbData);

        await connection.execute(
          `UPDATE public_bid_notices SET ${updateFields} WHERE id = ?`,
          [...updateValues, noticeId]
        );

        console.log(`[Database] Bid notice updated: ${bidNoticeNo} (ID: ${noticeId})`);
        return { id: noticeId, isNew: false };

      } else {
        // Insert new record
        const insertFields = Object.keys(dbData).join(', ');
        const insertPlaceholders = Object.keys(dbData).map(() => '?').join(', ');
        const insertValues = Object.values(dbData);

        const [result] = await connection.execute(
          `INSERT INTO public_bid_notices (${insertFields}) VALUES (${insertPlaceholders})`,
          insertValues
        ) as any;

        const noticeId = result.insertId;
        console.log(`[Database] Bid notice inserted: ${bidNoticeNo} (ID: ${noticeId})`);
        return { id: noticeId, isNew: true };
      }

    } catch (error: any) {
      console.error('[Database] Bid notice save failed:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Batch save bid notices
   */
  async saveBidNotices(notices: BidNotice[]): Promise<{
    saved: number;
    new_count: number;
    updated_count: number;
    errors: string[]
  }> {
    let saved = 0;
    let newCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    console.log(`[Database] Starting batch save of ${notices.length} notices`);

    for (const notice of notices) {
      try {
        const { isNew } = await this.saveBidNotice(notice);
        saved++;

        if (isNew) {
          newCount++;
        } else {
          updatedCount++;
        }

        if (saved % 10 === 0) {
          console.log(`[Database] Batch save progress: ${saved}/${notices.length}`);
        }

      } catch (error: any) {
        const errorMsg = `Failed to save notice ${notice.bid_notice_no}: ${error.message}`;
        console.error(`[Database] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    console.log(`[Database] Batch save completed: ${saved} saved (${newCount} new, ${updatedCount} updated), ${errors.length} errors`);

    return { saved, new_count: newCount, updated_count: updatedCount, errors };
  }

  /**
   * Save API collection log
   */
  async saveCollectionLog(
    apiEndpoint: string,
    requestParams: any,
    result: CollectionResult,
    startDate?: Date,
    endDate?: Date,
    startedAt?: Date
  ): Promise<number> {
    const connection = await this.getConnection();

    try {
      const logData = {
        api_endpoint: apiEndpoint,
        request_params: JSON.stringify(requestParams),
        total_count: result.total_count,
        collected_count: result.collected_count,
        new_count: result.new_count,
        updated_count: result.updated_count,
        error_count: result.error_count,
        start_date: startDate,
        end_date: endDate,
        status: result.error_count === 0 ? 'completed' : 'failed',
        started_at: startedAt || new Date(),
        completed_at: new Date(),
        error_message: result.errors.slice(0, 5).join('; ') || null, // First 5 errors only
        error_details: result.errors.length > 0 ? JSON.stringify(result.errors) : null
      };

      // Calculate duration if started_at is provided
      if (startedAt) {
        const durationMs = Date.now() - startedAt.getTime();
        (logData as any).duration_seconds = Math.floor(durationMs / 1000);
      }

      const fields = Object.keys(logData).join(', ');
      const placeholders = Object.keys(logData).map(() => '?').join(', ');
      const values = Object.values(logData);

      const [result_db] = await connection.execute(
        `INSERT INTO api_collection_logs (${fields}) VALUES (${placeholders})`,
        values
      ) as any;

      const logId = result_db.insertId;
      console.log(`[Database] Collection log saved: ID ${logId}`);
      return logId;

    } catch (error: any) {
      console.error('[Database] Collection log save failed:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Apply keyword matching to unprocessed notices
   */
  async applyKeywordMatching(limit: number = 100): Promise<number> {
    const connection = await this.getConnection();

    try {
      // Get active keyword rules
      const [keywordRules] = await connection.execute(`
        SELECT keyword, category, weight, match_field, match_type, is_negative
        FROM keyword_rules
        WHERE is_active = 1
      `) as any;

      if (keywordRules.length === 0) {
        console.warn('[Database] No active keyword rules found');
        return 0;
      }

      // Get unprocessed notices
      const [unprocessed] = await connection.execute(`
        SELECT id, bid_notice_name, dept_name, work_class_name, industry_name
        FROM public_bid_notices
        WHERE is_processed = 0
        LIMIT ?
      `, [limit]) as any;

      if (unprocessed.length === 0) {
        console.log('[Database] No unprocessed notices found');
        return 0;
      }

      let processedCount = 0;

      for (const notice of unprocessed) {
        const noticeId = notice.id;
        const contentFields = {
          title: notice.bid_notice_name || '',
          dept_name: notice.dept_name || '',
          work_class: notice.work_class_name || '',
          industry: notice.industry_name || '',
          content: [
            notice.bid_notice_name,
            notice.dept_name,
            notice.work_class_name,
            notice.industry_name
          ].filter(Boolean).join(' ')
        };

        const matches = this.findKeywordMatches(keywordRules, contentFields);

        // Calculate match results
        let updateData: any;
        if (matches.length > 0) {
          const { category, keywords, totalScore } = this.calculateMatchResults(matches);
          updateData = {
            category,
            keywords: JSON.stringify(keywords),
            score: totalScore,
            is_matched: 1,
            is_processed: 1
          };
        } else {
          updateData = {
            is_matched: 0,
            is_processed: 1
          };
        }

        // Update notice
        const updateFields = Object.keys(updateData)
          .map(key => `${key} = ?`)
          .join(', ');

        await connection.execute(
          `UPDATE public_bid_notices SET ${updateFields} WHERE id = ?`,
          [...Object.values(updateData), noticeId]
        );

        processedCount++;
      }

      console.log(`[Database] Keyword matching completed: ${processedCount} notices processed`);
      return processedCount;

    } catch (error: any) {
      console.error('[Database] Keyword matching failed:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Find keyword matches for content fields
   */
  private findKeywordMatches(
    keywordRules: any[],
    contentFields: Record<string, string>
  ): KeywordMatch[] {
    const matches: KeywordMatch[] = [];

    for (const rule of keywordRules) {
      const { keyword, category, weight, match_field, match_type, is_negative } = rule;

      // Select search text based on match_field
      let searchText: string;
      if (match_field === 'all') {
        searchText = Object.values(contentFields).join(' ').toLowerCase();
      } else {
        searchText = (contentFields[match_field] || '').toLowerCase();
      }

      if (!searchText) continue;

      // Perform matching
      let isMatch = false;
      const lowerKeyword = keyword.toLowerCase();

      switch (match_type) {
        case 'exact':
          isMatch = lowerKeyword === searchText;
          break;
        case 'contains':
          isMatch = searchText.includes(lowerKeyword);
          break;
        case 'regex':
          try {
            const regex = new RegExp(keyword, 'i');
            isMatch = regex.test(searchText);
          } catch (error) {
            console.warn(`[Database] Invalid regex pattern: ${keyword}`);
            continue;
          }
          break;
      }

      // Handle negative keywords
      if (is_negative) {
        isMatch = !isMatch;
      }

      if (isMatch) {
        matches.push({
          keyword,
          category,
          weight,
          field: match_field,
          match_type
        });
      }
    }

    return matches;
  }

  /**
   * Calculate final category, keywords, and score from matches
   */
  private calculateMatchResults(matches: KeywordMatch[]): {
    category: string;
    keywords: string[];
    totalScore: number;
  } {
    if (matches.length === 0) {
      return { category: '', keywords: [], totalScore: 0 };
    }

    // Calculate category scores
    const categoryScores: Record<string, number> = {};
    const matchedKeywords: string[] = [];
    let totalScore = 0;

    for (const match of matches) {
      if (!categoryScores[match.category]) {
        categoryScores[match.category] = 0;
      }
      categoryScores[match.category] += match.weight;
      totalScore += match.weight;
      matchedKeywords.push(match.keyword);
    }

    // Select category with highest score
    const bestCategory = Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)[0][0];

    return {
      category: bestCategory,
      keywords: [...new Set(matchedKeywords)], // Remove duplicates
      totalScore
    };
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<DatabaseStats> {
    const connection = await this.getConnection();

    try {
      // Total notices
      const [totalResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM public_bid_notices'
      ) as any;
      const totalNotices = totalResult[0].count;

      // Processed notices
      const [processedResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM public_bid_notices WHERE is_processed = 1'
      ) as any;
      const processedNotices = processedResult[0].count;

      // Matched notices
      const [matchedResult] = await connection.execute(
        'SELECT COUNT(*) as count FROM public_bid_notices WHERE is_matched = 1'
      ) as any;
      const matchedNotices = matchedResult[0].count;

      // Category distribution
      const [categoryResult] = await connection.execute(`
        SELECT category, COUNT(*) as count
        FROM public_bid_notices
        WHERE category IS NOT NULL
        GROUP BY category
      `) as any;
      const categoryDistribution: Record<string, number> = {};
      for (const row of categoryResult) {
        categoryDistribution[row.category] = row.count;
      }

      // Recent collections
      const [recentResult] = await connection.execute(`
        SELECT started_at, total_count, status
        FROM api_collection_logs
        ORDER BY started_at DESC
        LIMIT 5
      `) as any;
      const recentCollections = recentResult.map((row: any) => ({
        date: row.started_at?.toISOString()?.split('T')[0] || 'N/A',
        count: row.total_count,
        status: row.status
      }));

      return {
        total_notices: totalNotices,
        processed_notices: processedNotices,
        matched_notices: matchedNotices,
        category_distribution: categoryDistribution,
        recent_collections: recentCollections
      };

    } catch (error: any) {
      console.error('[Database] Statistics query failed:', error.message);
      throw error;
    } finally {
      connection.release();
    }
  }
}

/**
 * Test database functionality
 */
export async function testDatabase(): Promise<void> {
  const config: DatabaseConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'test'
  };

  const dbManager = new DatabaseManager(config);

  try {
    console.log('=== Database Test ===');

    // Create tables
    console.log('Creating tables...');
    await dbManager.createTables(true); // Drop existing for test
    console.log('Tables created successfully');

    // Get statistics
    const stats = await dbManager.getStatistics();
    console.log('\n=== Database Statistics ===');
    console.log(JSON.stringify(stats, null, 2));

    // Test keyword matching
    console.log('\n=== Testing Keyword Matching ===');
    const processed = await dbManager.applyKeywordMatching();
    console.log(`Processed: ${processed} notices`);

  } catch (error: any) {
    console.error(`[Database Test] Test failed: ${error.message}`);
  } finally {
    await dbManager.close();
  }
}