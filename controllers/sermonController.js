
const { pool } = require('../db');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

async function getLatestSermons(req, res) {
    const sermonPlaylistIds = process.env.SERMON_PLAYLIST_IDS ? process.env.SERMON_PLAYLIST_IDS.split(',') : [];

    if (sermonPlaylistIds.length === 0) {
        return res.status(400).json({ message: 'SERMON_PLAYLIST_IDS is not defined in .env file' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        
        const query = `
            SELECT videoId, title, publishedAt
            FROM youtube_videos_cache
            WHERE playlistId IN (?)
            ORDER BY publishedAt DESC
            LIMIT 3
        `;
        
        const rows = await conn.query(query, [sermonPlaylistIds]);

        const sermons = rows.map(row => ({
            ...row,
            thumbnail: `https://img.youtube.com/vi/${row.videoId}/hqdefault.jpg`
        }));

        res.status(200).json(sermons);

    } catch (error) {
        console.error("Error fetching latest sermons:", error);
        res.status(500).json({ message: "Internal Server Error" });
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    getLatestSermons
};
