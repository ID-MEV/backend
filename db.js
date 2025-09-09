const mariadb = require('mariadb');
require('dotenv').config({ path: '.env' });

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectionLimit: 5
});

async function initializeDatabase() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to MariaDB.");

        // Create database if not exists
        await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log(`Database '${process.env.DB_NAME}' ensured.`);

        // Use the created database
        await conn.query(`USE ${process.env.DB_NAME}`);

        // Create videos table if not exists
        const createVideosTableQuery = `
            CREATE TABLE IF NOT EXISTS videos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                url VARCHAR(255) NOT NULL UNIQUE,
                publishedAt DATETIME,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await conn.query(createVideosTableQuery);
        console.log("Table 'videos' ensured.");

        // Create memos table if not exists
        const createMemosTableQuery = `
            CREATE TABLE IF NOT EXISTS memos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                content TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await conn.query(createMemosTableQuery);
        console.log("Table 'memos' ensured.");

        // Create memo_deleted table if not exists
        const createMemoDeletedTableQuery = `
            CREATE TABLE IF NOT EXISTS memo_deleted (
                id INT,
                content TEXT,
                created_at TIMESTAMP,
                deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await conn.query(createMemoDeletedTableQuery);
        console.log("Table 'memo_deleted' ensured.");

    } catch (err) {
        console.error("Error initializing database:", err);
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    pool,
    initializeDatabase
};
