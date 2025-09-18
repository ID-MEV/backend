const { pool } = require('../db'); // Adjust path as needed

async function syncYoutubeVideos(playlistId, videos) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 1. Delete existing data for the given playlistId
        await conn.query('DELETE FROM youtube_videos WHERE playlistId = ?', [playlistId]);

        // 2. Insert new video data
        if (videos.length > 0) {
            const insertQuery = 'INSERT INTO youtube_videos (playlistId, title, url) VALUES (?, ?, ?)';
            const values = videos.map(video => [playlistId, video.title, video.url]);
            await conn.batch(insertQuery, values);
        }

        await conn.commit();
        console.log(`Successfully synchronized ${videos.length} videos for playlistId: ${playlistId}`);
    } catch (error) {
        if (conn) await conn.rollback();
        console.error(`Error synchronizing videos for playlistId ${playlistId}:`, error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    syncYoutubeVideos
};