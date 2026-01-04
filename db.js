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

        // Add isImportant column to memos table if not exists
        const alterMemosTableQuery = `
            ALTER TABLE memos
            ADD COLUMN IF NOT EXISTS isImportant BOOLEAN DEFAULT FALSE
        `;
        await conn.query(alterMemosTableQuery);
        console.log("Column 'isImportant' in table 'memos' ensured.");

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

        // Create user_settings table if not exists
        const createUserSettingsTableQuery = `
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id INT PRIMARY KEY,
                theme_color VARCHAR(50) DEFAULT '#1E4040',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        await conn.query(createUserSettingsTableQuery);
        console.log("Table 'user_settings' ensured.");

        // Alter theme_color column to support longer strings like 'transparent'
        const alterUserSettingsTableQuery = `
            ALTER TABLE user_settings
            MODIFY COLUMN theme_color VARCHAR(50) DEFAULT '#1E4040'
        `;
        await conn.query(alterUserSettingsTableQuery);
        console.log("Column 'theme_color' in table 'user_settings' ensured to be VARCHAR(50).");

        // Add a default user setting if not exists
        // (Assuming a default user_id of 1 for simplicity, replace with actual user management)
        const insertDefaultUserSettingQuery = `
            INSERT IGNORE INTO user_settings (user_id, theme_color) VALUES (1, '#1E4040')
        `;
        await conn.query(insertDefaultUserSettingQuery);
        console.log("Default user setting ensured for user_id 1.");

        // Create users table if not exists
        const createUsersTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await conn.query(createUsersTableQuery);
        console.log("Table 'users' ensured.");

        // Create members table if not exists
        const createMembersTableQuery = `
            CREATE TABLE IF NOT EXISTS members (
                ID VARCHAR(255) PRIMARY KEY,
                이름 VARCHAR(255) NOT NULL,
                순 VARCHAR(255),
                직분 VARCHAR(255),
                성별 VARCHAR(10),
                배우자 VARCHAR(255),
                양음력 VARCHAR(10),
                생년월일 VARCHAR(255),
                자택번호 VARCHAR(255),
                휴대번호 VARCHAR(255),
                가족사항 TEXT,
                주소 TEXT,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await conn.query(createMembersTableQuery);
        console.log("Table 'members' ensured.");

        // Alter 'ID' column of 'members' table to VARCHAR(255) if it's not already
        const alterMembersIdColumnQuery = `
            ALTER TABLE members MODIFY ID VARCHAR(255) PRIMARY KEY;
        `;
        try {
            await conn.query(alterMembersIdColumnQuery);
            console.log("Table 'members' ID column ensured to be VARCHAR(255) PRIMARY KEY.");
        } catch (alterErr) {
            if (!alterErr.sqlMessage || !alterErr.sqlMessage.includes("Duplicate column name 'ID'") && !alterErr.sqlMessage.includes("already exists") && !alterErr.sqlMessage.includes("invalid column type")) {
                 console.warn("Could not alter 'members' ID column to VARCHAR(255) (might already be correct or other issue):", alterErr.message);
            }
        }



        // Add password_hash column to users table if not exists
        const alterUsersTableQuery = `
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NOT NULL
        `;
        await conn.query(alterUsersTableQuery);
        console.log("Column 'password_hash' in table 'users' ensured.");




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
