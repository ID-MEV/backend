const { pool } = require('./db');
const { getYoutubeVideos } = require('./youtube');

async function cacheYoutubeVideos() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log("Connected to MariaDB for caching.");

        const videos = await getYoutubeVideos();
        if (videos.length === 0) {
            console.log("No YouTube videos to cache.");
            return;
        }

        for (const video of videos) {
            try {
                await conn.query(
                    'INSERT INTO videos (title, url, publishedAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title), publishedAt = VALUES(publishedAt)',
                    [video.title, video.url, video.publishedAt]
                );
            } catch (insertError) {
                console.error(`Error inserting/updating video '${video.title}':`, insertError.message);
            }
        }
        console.log(`Successfully cached ${videos.length} YouTube videos.`);

    } catch (err) {
        console.error("Error during YouTube video caching:", err);
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    cacheYoutubeVideos
};
