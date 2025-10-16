/**
 * Category classification for g2b_notices based on bidNtceNm (bid notice name)
 * Ported from Python mysql_notice.py update_all_category function
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

interface G2bNoticeForCategory {
  id: number;
  bidNtceNm: string;
}

interface MatchResult {
  id: number;
  bidNtceNm: string;
  matched: string;
  point: number;
}

class CategoryClassifier {
  private connection: mysql.Connection;

  constructor(connection: mysql.Connection) {
    this.connection = connection;
  }

  /**
   * Get all category settings from settings_notice_category table
   */
  async getCategorySettings(): Promise<CategorySetting[]> {
    try {
      const [rows] = await this.connection.execute(`
        SELECT sn, keywords, nots, min_point, category, creator, memo
        FROM settings_notice_category
        WHERE \`use\` = 1
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
   * Search notices with keyword weights and calculate points
   */
  async searchNoticesWithWeights(
    keywords: string,
    minPoint: number,
    field: string = 'bidNtceNm',
    addWhere: string = ''
  ): Promise<MatchResult[]> {
    const keywordWeights = this.parseKeywordWeights(keywords);
    const results: { [id: number]: MatchResult } = {};

    for (const { keyword, weight } of keywordWeights) {
      let whereClause = `WHERE \`${field}\` LIKE ?`;
      const params = [`%${keyword}%`];

      if (addWhere) {
        whereClause += ` AND ${addWhere}`;
      }

      try {
        const [rows] = await this.connection.execute(`
          SELECT id, bidNtceNm
          FROM g2b_notices
          ${whereClause}
        `, params) as any;

        for (const row of rows) {
          const id = row.id;
          if (!(id in results)) {
            results[id] = {
              id,
              bidNtceNm: row.bidNtceNm,
              matched: keyword,
              point: weight
            };
          } else {
            results[id].matched += `,${keyword}`;
            results[id].point += weight;
          }
        }
      } catch (error: any) {
        console.error(`Error searching with keyword "${keyword}":`, error.message);
      }
    }

    // Filter by minimum point
    return Object.values(results).filter(result => result.point >= minPoint);
  }

  /**
   * Check if text contains any exclusion strings
   */
  isExcluded(notStr: string, text: string): boolean {
    if (!notStr.trim()) return false;

    for (const excludeStr of notStr.split(',')) {
      const trimmed = excludeStr.trim();
      if (trimmed && text.includes(trimmed)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Filter results by exclusion strings
   */
  filterByNots(notStr: string, results: MatchResult[], field: string = 'bidNtceNm'): MatchResult[] {
    if (!notStr.trim()) return results;

    return results.filter(result => {
      const fieldValue = field === 'bidNtceNm' ? result.bidNtceNm : '';
      return !this.isExcluded(notStr, fieldValue);
    });
  }

  /**
   * Update category for a single category type
   */
  async updateCategoryBatch(category: string): Promise<void> {
    console.log(`\nUpdating category '${category}'...`);

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
      // Search notices that match keywords and have no category assigned yet
      const addWhere = "category IS NULL OR category = '' OR category = '무관'";

      const matchedNotices = await this.searchNoticesWithWeights(
        categorySetting.keywords,
        categorySetting.min_point,
        'bidNtceNm',
        addWhere
      );

      console.log(`Found ${matchedNotices.length} notices matching keywords`);

      if (matchedNotices.length === 0) {
        console.log(`No notices found for category '${category}'`);
        return;
      }

      // Filter by exclusion strings
      const filteredNotices = this.filterByNots(
        categorySetting.nots,
        matchedNotices,
        'bidNtceNm'
      );

      console.log(`After filtering exclusions: ${filteredNotices.length} notices`);

      if (filteredNotices.length === 0) {
        console.log(`No notices remain after filtering for category '${category}'`);
        return;
      }

      // Update category for matched notices
      let updatedCount = 0;
      for (const notice of filteredNotices) {
        try {
          await this.connection.execute(`
            UPDATE g2b_notices
            SET category = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [category, notice.id]);

          updatedCount++;
          console.log(`  Updated notice ID ${notice.id}: "${notice.bidNtceNm}" (score: ${notice.point})`);
        } catch (error: any) {
          console.error(`Failed to update notice ID ${notice.id}:`, error.message);
        }
      }

      console.log(`Category '${category}' update completed: ${updatedCount} notices updated`);

    } catch (error: any) {
      console.error(`Error updating category '${category}':`, error.message);
    }
  }

  /**
   * Update all categories (equivalent to Python's update_all_category)
   */
  async updateAllCategories(): Promise<void> {
    console.log('=== Starting category classification for all categories ===');

    const settings = await this.getCategorySettings();
    const categories = [...new Set(settings.map(s => s.category))];

    console.log(`Found categories: ${categories.join(', ')}`);

    for (const category of categories) {
      await this.updateCategoryBatch(category);
    }

    console.log('\n=== Category classification completed ===');
  }

  /**
   * Get statistics of category distribution
   */
  async getCategoryStats(): Promise<void> {
    try {
      const [rows] = await this.connection.execute(`
        SELECT
          COALESCE(category, 'No Category') as category,
          COUNT(*) as count
        FROM g2b_notices
        GROUP BY category
        ORDER BY count DESC
      `) as any;

      console.log('\n=== Category Distribution ===');
      for (const row of rows) {
        console.log(`${row.category}: ${row.count} notices`);
      }
    } catch (error: any) {
      console.error('Error getting category stats:', error.message);
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
    console.log('=== G2B Notices Category Classification ===');

    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('Database connected');

    // Create classifier and run classification
    const classifier = new CategoryClassifier(connection);

    // Show current stats
    console.log('\n--- Before Classification ---');
    await classifier.getCategoryStats();

    // Run classification
    await classifier.updateAllCategories();

    // Show updated stats
    console.log('\n--- After Classification ---');
    await classifier.getCategoryStats();

  } catch (error: any) {
    console.error(`Classification failed: ${error.message}`);
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

export { CategoryClassifier };

// 하천, 교