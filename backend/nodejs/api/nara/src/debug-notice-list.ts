/**
 * Debug script to check notice_list table structure and sample data
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function main(): Promise<void> {
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
    console.log('=== Debug notice_list Table ===');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('Database connected');

    // 1. Check table structure
    console.log('\n1. Table Structure:');
    try {
      const [columns] = await connection.execute(`
        SHOW COLUMNS FROM notice_list
      `) as any;
      
      console.log('Columns in notice_list:');
      columns.forEach((col: any) => {
        console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `Key: ${col.Key}` : ''}`);
      });
    } catch (error: any) {
      console.error('Error checking table structure:', error.message);
    }

    // 2. Check total count
    console.log('\n2. Total Records:');
    try {
      const [countResult] = await connection.execute(`
        SELECT COUNT(*) as total FROM notice_list
      `) as any;
      
      console.log(`Total notices: ${countResult[0].total}`);
    } catch (error: any) {
      console.error('Error getting total count:', error.message);
    }

    // 3. Check category distribution
    console.log('\n3. Current Category Distribution:');
    try {
      const [categoryStats] = await connection.execute(`
        SELECT 
          COALESCE(category, 'NULL/Empty') as category,
          COUNT(*) as count
        FROM notice_list 
        GROUP BY category 
        ORDER BY count DESC 
        LIMIT 10
      `) as any;
      
      categoryStats.forEach((row: any) => {
        console.log(`  ${row.category}: ${row.count} notices`);
      });
    } catch (error: any) {
      console.error('Error getting category stats:', error.message);
    }

    // 4. Check sample data - look for title-like fields
    console.log('\n4. Sample Data (first 3 records):');
    try {
      const [sampleData] = await connection.execute(`
        SELECT * FROM notice_list LIMIT 3
      `) as any;
      
      sampleData.forEach((row: any, index: number) => {
        console.log(`\nRecord ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          // Show full value for title-like fields, truncate others
          const displayValue = (key.toLowerCase().includes('title') || 
                               key.toLowerCase().includes('name') || 
                               key.toLowerCase().includes('ntce') ||
                               key === 'category') ? 
                               value : 
                               (typeof value === 'string' && value.length > 50 ? 
                                value.substring(0, 50) + '...' : value);
          console.log(`  ${key}: ${displayValue}`);
        });
      });
    } catch (error: any) {
      console.error('Error getting sample data:', error.message);
    }

    // 5. Test keyword search on different potential title fields
    console.log('\n5. Testing Keyword Search on Potential Title Fields:');
    const testKeyword = '안전';
    
    // Common field names to test
    const potentialTitleFields = ['title', 'bidNtceNm', 'name', 'notice_name', 'subject', 'content'];
    
    for (const fieldName of potentialTitleFields) {
      try {
        const [testResult] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM notice_list 
          WHERE \`${fieldName}\` LIKE ?
        `, [`%${testKeyword}%`]) as any;
        
        if (testResult[0].count > 0) {
          console.log(`  Field "${fieldName}": ${testResult[0].count} matches for keyword "${testKeyword}"`);
          
          // Show sample matches
          const [sampleMatches] = await connection.execute(`
            SELECT id, \`${fieldName}\` as field_value, category
            FROM notice_list 
            WHERE \`${fieldName}\` LIKE ?
            LIMIT 2
          `, [`%${testKeyword}%`]) as any;
          
          sampleMatches.forEach((match: any, idx: number) => {
            console.log(`    Sample ${idx + 1}: ID=${match.id}, Value="${match.field_value}", Category=${match.category || 'NULL'}`);
          });
        }
      } catch (error: any) {
        // Field doesn't exist, skip silently
        console.log(`  Field "${fieldName}": doesn't exist`);
      }
    }

    // 6. Check for records that might match our categories
    console.log('\n6. Testing Category Keywords:');
    const categoryKeywords = ['진단', '점검', '설계', '감리', '구조', '안전'];
    
    for (const keyword of categoryKeywords) {
      try {
        // Test on title field
        const [titleResult] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM notice_list 
          WHERE title LIKE ?
        `, [`%${keyword}%`]) as any;
        
        if (titleResult[0].count > 0) {
          console.log(`  Keyword "${keyword}" in title: ${titleResult[0].count} matches`);
        }
      } catch (error: any) {
        console.log(`  Error testing keyword "${keyword}":`, error.message);
      }
    }

  } catch (error: any) {
    console.error(`Debug failed: ${error.message}`);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}