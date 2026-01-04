const { pool } = require('./db');

async function getTableSchema() {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("DESCRIBE users;");
        console.log("Schema for 'users' table:");
        console.table(rows);
    } catch (err) {
        console.error("Error fetching 'users' table schema:", err);
    } finally {
        if (conn) conn.release();
        process.exit(0);
    }
}

getTableSchema();
