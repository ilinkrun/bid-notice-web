import mysql from 'mysql2/promise';

// MySQL 연결 설정
const dbConfig = {
  host: process.env.MYSQL_HOST || '1.231.118.217',
  port: parseInt(process.env.MYSQL_PORT || '2306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'mysqlIlmac1!',
  database: process.env.MYSQL_DATABASE || 'ilmac_bid_db',
  charset: 'utf8mb4',
  timezone: '+09:00',
};

// 연결 풀 생성
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export { pool };

// 헬퍼 함수들
export const executeQuery = async (query: string, params?: any[]) => {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('MySQL Query Error:', error);
    throw error;
  }
};

export const executeTransaction = async (queries: { query: string; params?: any[] }[]) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    console.error('MySQL Transaction Error:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// 연결 테스트 함수
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL connection successful');
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    return false;
  }
};