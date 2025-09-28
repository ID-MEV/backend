require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mariadb = require('mariadb');

const dbPool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
});

async function createTable() {
    let conn;
    try {
        conn = await dbPool.getConnection();
        console.log('데이터베이스에 연결되었습니다.');

        const query = `
            CREATE TABLE IF NOT EXISTS youtube_videos_cache (
                id INT AUTO_INCREMENT PRIMARY KEY,
                playlistId VARCHAR(255) NOT NULL,
                videoId VARCHAR(255) NOT NULL,
                title VARCHAR(255) NOT NULL,
                url VARCHAR(255) NOT NULL,
                position INT NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_video (playlistId, videoId)
            )
        `;

        await conn.query(query);
        console.log("\'youtube_videos_cache\' 테이블이 성공적으로 생성되었거나 이미 존재합니다.");

        const alterQuery = `
            ALTER TABLE youtube_videos_cache
            ADD COLUMN IF NOT EXISTS publishedAt DATETIME
        `;
        await conn.query(alterQuery);
        console.log("'youtube_videos_cache' 테이블에 'publishedAt' 컬럼이 추가되었거나 이미 존재합니다.");

    } catch (err) {
        console.error("테이블 생성 중 오류 발생:", err);
    } finally {
        if (conn) {
            conn.release();
            console.log('데이터베이스 연결이 해제되었습니다.');
        }
        // Terminate the pool
        await dbPool.end();
        console.log('DB 풀이 종료되었습니다.');
    }
}

createTable();
