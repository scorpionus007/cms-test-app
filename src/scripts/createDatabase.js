/**
 * Creates the MySQL database if it doesn't exist.
 * Run: npm run db:create
 * Requires .env with DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const dbName = process.env.DB_NAME || 'securedapp_cms';
const password = process.env.DB_PASSWORD;

async function createDatabase() {
  if (password === undefined || password === null || String(password).trim() === '') {
    console.error('DB_PASSWORD is not set in .env. Add a line: DB_PASSWORD=your_mysql_password');
    process.exit(1);
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: password,
    });
  } catch (err) {
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('MySQL access denied. Check your .env:');
      console.error('  - DB_USER (e.g. root)');
      console.error('  - DB_PASSWORD (your MySQL password; no quotes, no spaces around =)');
      console.error('Example: DB_PASSWORD=mypassword123');
    } else {
      console.error('Connection failed:', err.message);
    }
    process.exit(1);
  }

  try {
    await connection.query(
      'CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
      [dbName]
    );
    console.log(`Database '${dbName}' is ready.`);
  } catch (err) {
    console.error('Failed to create database:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

createDatabase();
