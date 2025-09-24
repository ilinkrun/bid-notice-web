/**
 * Update categories for notice_list and g2b_notices tables based on settings_notice_category
 * This script updates existing data with the new category definitions from settings_notice_category table
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

interface CategorySetting {
  sn: number;
  keywords: string;
  nots: string;
  min_point: number;
  category: string;
  creator?: string;
  memo?: string;
}

interface KeywordWeight {
  keyword: string;
  weight: number;
}

interface NoticeForCategory {
  id: number;
  bidNtceNm: string;
  category?: string;
  tableName: string;
}

interface MatchResult {
  id: number;
  bidNtceNm: string;
  matched: string;
  point: number;
  tableName: string;
}

interface TableConfig {
  name: string;
  titleField: string;
  idField: string;
}

class CategoryUpdater {
  private connection: mysql.Connection;

  constructor(connection: mysql.Connection) {
    this.connection = connection;
  }

  /**
   * Get all active category settings from settings_notice_category table
   */
  async getCategorySettings(): Promise<CategorySetting[]> {
    try {
      const [rows] = await this.connection.execute(`
        SELECT sn, keywords, nots, min_point, category, creator, memo
        FROM settings_notice_category
        WHERE \`use\` = 1
        ORDER BY sn
      `) as any;

      return rows;
    } catch (error: any) {
      console.error('Error fetching category settings:', error.message);
      return [];
    }
  }

  /**
   * Parse keyword weight string like "키워드*가중치,키워드*가중치,..."
   */
  parseKeywordWeights(keywordWeightStr: string): KeywordWeight[] {
    const keywordWeights: KeywordWeight[] = [];

    for (const kw of keywordWeightStr.trim().split(',')) {
      const parts = kw.split('*');
      const keyword = parts[0].trim();

      if (keyword === '') continue;

      const weight = parts.length < 2 ? 1 : parseInt(parts[1].trim());
      keywordWeights.push({ keyword, weight });
    }

    return keywordWeights;
  }

  /**
   * Search notices with keyword weights and calculate points from both tables
   */
  async searchNoticesWithWeights(
    keywords: string,
    minPoint: number,
    resetCategories: boolean = false
  ): Promise<MatchResult[]> {
    const keywordWeights = this.parseKeywordWeights(keywords);
    const results: { [key: string]: MatchResult } = {}; // key: tableName:id

    console.log(`Searching with keywords: ${keywords}`);
    console.log(`Parsed keyword weights:`, keywordWeights);

    // Search in both tables
    const tables = [
      { name: 'notice_list', titleField: 'title', idField: 'nid' },
      { name: 'g2b_notices', titleField: 'bidNtceNm', idField: 'id' }
    ];

    for (const table of tables) {
      for (const { keyword, weight } of keywordWeights) {
        let whereClause = `WHERE \`${table.titleField}\` LIKE ?`;
        const params = [`%${keyword}%`];

        // Only update notices that don't have a category or are '무관' unless resetCategories is true
        if (!resetCategories) {
          whereClause += ` AND (category IS NULL OR category = '' OR category = '무관')`;
        }

        try {
          const [rows] = await this.connection.execute(`
            SELECT ${table.idField} as id, ${table.titleField} as bidNtceNm, category
            FROM ${table.name}
            ${whereClause}
          `, params) as any;

          console.log(`  Table "${table.name}" - Keyword "${keyword}" (weight: ${weight}): found ${rows.length} notices`);

          for (const row of rows) {
            const key = `${table.name}:${row.id}`;
            if (!(key in results)) {
              results[key] = {
                id: row.id,
                bidNtceNm: row.bidNtceNm,
                matched: keyword,
                point: weight,
                tableName: table.name
              };
            } else {
              results[key].matched += `,${keyword}`;
              results[key].point += weight;
            }
          }
        } catch (error: any) {
          console.error(`Error searching table "${table.name}" with keyword "${keyword}":`, error.message);
        }
      }
    }

    // Filter by minimum point
    const filteredResults = Object.values(results).filter(result => result.point >= minPoint);
    console.log(`After min_point filter (>= ${minPoint}): ${filteredResults.length} notices remain from both tables`);

    return filteredResults;
  }

  /**
   * Check if text contains any exclusion strings
   */
  isExcluded(notStr: string, text: string): boolean {
    if (!notStr.trim()) return false;

    for (const excludeStr of notStr.split(',')) {
      const trimmed = excludeStr.trim();
      if (trimmed && text.includes(trimmed)) {
        console.log(`    Excluded by keyword: "${trimmed}" found in "${text}"`);
        return true;
      }
    }
    return false;
  }

  /**
   * Filter results by exclusion strings
   */
  filterByNots(notStr: string, results: MatchResult[]): MatchResult[] {
    if (!notStr.trim()) return results;

    console.log(`Filtering by exclusion keywords: ${notStr}`);

    const filtered = results.filter(result => {
      const isExcluded = this.isExcluded(notStr, result.bidNtceNm);
      if (!isExcluded) {
        console.log(`    Kept ${result.tableName} ID ${result.id}: "${result.bidNtceNm}"`);
      }
      return !isExcluded;
    });

    console.log(`After exclusion filter: ${filtered.length} notices remain`);
    return filtered;
  }

  /**
   * Update category for a single category type in both tables
   */
  async updateCategoryBatch(category: string, resetCategories: boolean = false): Promise<void> {
    console.log(`\n=== Updating category '${category}' ===`);

    // Get category settings
    const settings = await this.getCategorySettings();
    const categorySetting = settings.find(s => s.category === category);

    if (!categorySetting) {
      console.log(`No keyword settings found for category '${category}'`);
      return;
    }

    console.log(`Keywords: ${categorySetting.keywords}`);
    console.log(`Exclusions: ${categorySetting.nots}`);
    console.log(`Min point: ${categorySetting.min_point}`);

    try {
      const matchedNotices = await this.searchNoticesWithWeights(
        categorySetting.keywords,
        categorySetting.min_point,
        resetCategories
      );

      console.log(`Found ${matchedNotices.length} notices matching keywords with sufficient points`);

      if (matchedNotices.length === 0) {
        console.log(`No notices found for category '${category}'`);
        return;
      }

      // Filter by exclusion strings
      const filteredNotices = this.filterByNots(
        categorySetting.nots,
        matchedNotices
      );

      console.log(`After filtering exclusions: ${filteredNotices.length} notices`);

      if (filteredNotices.length === 0) {
        console.log(`No notices remain after filtering for category '${category}'`);
        return;
      }

      // Group by table
      const noticesByTable = filteredNotices.reduce((acc, notice) => {
        if (!acc[notice.tableName]) {
          acc[notice.tableName] = [];
        }
        acc[notice.tableName].push(notice);
        return acc;
      }, {} as { [tableName: string]: MatchResult[] });

      // Update category for matched notices in each table
      let totalUpdatedCount = 0;

      for (const [tableName, notices] of Object.entries(noticesByTable)) {
        console.log(`\nUpdating ${notices.length} notices in table "${tableName}"`);
        let updatedCount = 0;

        for (const notice of notices) {
          try {
            // Check if table has updatedAt column
            const hasUpdatedAt = await this.hasColumn(tableName, 'updatedAt');
            
            // Determine the correct ID field name for this table
            const idField = tableName === 'notice_list' ? 'nid' : 'id';
            
            let updateQuery = `UPDATE ${tableName} SET category = ?`;
            const params = [category];

            if (hasUpdatedAt) {
              updateQuery += `, updatedAt = CURRENT_TIMESTAMP`;
            }

            updateQuery += ` WHERE ${idField} = ?`;
            params.push(notice.id);

            await this.connection.execute(updateQuery, params);

            updatedCount++;
            totalUpdatedCount++;
            console.log(`  Updated ${tableName} ID ${notice.id}: "${notice.bidNtceNm}" (point: ${notice.point})`);
          } catch (error: any) {
            console.error(`Failed to update ${tableName} ID ${notice.id}:`, error.message);
          }
        }

        console.log(`Updated ${updatedCount} notices in table "${tableName}"`);
      }

      console.log(`Category '${category}' update completed: ${totalUpdatedCount} notices updated across all tables`);

    } catch (error: any) {
      console.error(`Error updating category '${category}':`, error.message);
    }
  }

  /**
   * Check if a table has a specific column
   */
  async hasColumn(tableName: string, columnName: string): Promise<boolean> {
    try {
      const [rows] = await this.connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ? 
        AND COLUMN_NAME = ?
      `, [tableName, columnName]) as any;

      return rows.length > 0;
    } catch (error: any) {
      console.error(`Error checking column "${columnName}" in table "${tableName}":`, error.message);
      return false;
    }
  }

  /**
   * Update all categories in both tables
   */
  async updateAllCategories(resetCategories: boolean = false): Promise<void> {
    console.log('=== Starting category update for all categories in both tables ===');
    console.log(`Reset existing categories: ${resetCategories}`);

    const settings = await this.getCategorySettings();
    const categories = [...new Set(settings.map(s => s.category))];

    console.log(`Found categories: ${categories.join(', ')}`);

    // If resetCategories is true, reset all categories to '무관' first
    if (resetCategories) {
      console.log('\n=== Resetting all categories to "무관" ===');
      await this.resetAllCategories();
    }

    for (const category of categories) {
      await this.updateCategoryBatch(category, resetCategories);
    }

    console.log('\n=== Category update completed ===');
  }

  /**
   * Reset all categories to '무관' in both tables
   */
  async resetAllCategories(): Promise<void> {
    const tables = ['notice_list', 'g2b_notices'];

    for (const tableName of tables) {
      try {
        // Check if table has updatedAt column
        const hasUpdatedAt = await this.hasColumn(tableName, 'updatedAt');
        
        let updateQuery = `UPDATE ${tableName} SET category = '무관'`;
        
        if (hasUpdatedAt) {
          updateQuery += `, updatedAt = CURRENT_TIMESTAMP`;
        }

        const [result] = await this.connection.execute(updateQuery) as any;
        
        console.log(`Reset ${result.affectedRows} notices to "무관" in table "${tableName}"`);
      } catch (error: any) {
        console.error(`Error resetting categories in table "${tableName}":`, error.message);
      }
    }
  }

  /**
   * Get statistics of category distribution for both tables
   */
  async getCategoryStats(): Promise<void> {
    const tables = ['notice_list', 'g2b_notices'];

    for (const tableName of tables) {
      try {
        const [rows] = await this.connection.execute(`
          SELECT
            COALESCE(category, 'No Category') as category,
            COUNT(*) as count
          FROM ${tableName}
          GROUP BY category
          ORDER BY count DESC
        `) as any;

        console.log(`\n=== Category Distribution for ${tableName} ===`);
        let total = 0;
        for (const row of rows) {
          console.log(`${row.category}: ${row.count} notices`);
          total += row.count;
        }
        console.log(`Total: ${total} notices`);
      } catch (error: any) {
        console.error(`Error getting category stats for table "${tableName}":`, error.message);
      }
    }
  }

  /**
   * Get count of unclassified notices in both tables
   */
  async getUnclassifiedCount(): Promise<{ notice_list: number; g2b_notices: number }> {
    const result = { notice_list: 0, g2b_notices: 0 };
    const tables = ['notice_list', 'g2b_notices'] as const;

    for (const tableName of tables) {
      try {
        const [rows] = await this.connection.execute(`
          SELECT COUNT(*) as unclassified
          FROM ${tableName}
          WHERE category IS NULL OR category = '' OR category = '무관'
        `) as any;

        result[tableName] = rows[0].unclassified;
      } catch (error: any) {
        console.error(`Error getting unclassified count for table "${tableName}":`, error.message);
      }
    }

    return result;
  }

  /**
   * Main update process
   */
  async updateCategories(resetCategories: boolean = false): Promise<void> {
    console.log('=== Updating categories for notice_list and g2b_notices tables ===');

    try {
      // Get current stats before update
      console.log('\n--- Before Update ---');
      await this.getCategoryStats();

      const unclassifiedBefore = await this.getUnclassifiedCount();
      console.log(`\nUnclassified notices before update:`);
      console.log(`  notice_list: ${unclassifiedBefore.notice_list}`);
      console.log(`  g2b_notices: ${unclassifiedBefore.g2b_notices}`);

      // Run category update
      await this.updateAllCategories(resetCategories);

      // Get updated stats after update
      console.log('\n--- After Update ---');
      await this.getCategoryStats();

      const unclassifiedAfter = await this.getUnclassifiedCount();
      console.log(`\nUnclassified notices after update:`);
      console.log(`  notice_list: ${unclassifiedAfter.notice_list}`);
      console.log(`  g2b_notices: ${unclassifiedAfter.g2b_notices}`);

      console.log(`\nUpdate summary:`);
      console.log(`  notice_list: ${unclassifiedBefore.notice_list - unclassifiedAfter.notice_list} notices reclassified`);
      console.log(`  g2b_notices: ${unclassifiedBefore.g2b_notices - unclassifiedAfter.g2b_notices} notices reclassified`);

    } catch (error: any) {
      console.error('Error during category update:', error.message);
    }
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  // Database configuration
  const dbConfig = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'test',
    charset: 'utf8mb4',
    timezone: '+00:00'
  };

  let connection: mysql.Connection | null = null;

  try {
    console.log('=== Notice Category Update Script ===');
    console.log('This script updates categories in notice_list and g2b_notices tables');
    console.log('based on the latest settings in settings_notice_category table');

    // Check command line arguments
    const resetCategories = process.argv.includes('--reset');
    if (resetCategories) {
      console.log('\n⚠️  RESET MODE: All existing categories will be reset to "무관" before update');
    } else {
      console.log('\n🔄 INCREMENTAL MODE: Only unclassified or "무관" notices will be updated');
    }

    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('Database connected');

    // Create updater and run update
    const updater = new CategoryUpdater(connection);

    // Update categories in both tables
    await updater.updateCategories(resetCategories);

  } catch (error: any) {
    console.error(`Category update failed: ${error.message}`);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { CategoryUpdater };