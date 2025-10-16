import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
});

const [rows] = await pool.query('SELECT * FROM notices LIMIT 10');
console.log(rows);
