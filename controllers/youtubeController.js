/**
 * @file Controller for handling YouTube video related requests.
 * @module controllers/youtubeController
 */

console.log('--- youtubeController.js loaded (version 1) ---');

const { pool } = require('../db');

/**
 * Retrieves a list of YouTube videos for a given playlist ID from the database.
 * @function getVideosByPlaylist
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {void} Sends a JSON response with video data or an error message.
 */
async function getVideosByPlaylist(req, res) {
    const { playlistId } = req.query;
    console.log(`[youtubeController] Received request for playlistId: ${playlistId}`);

    if (!playlistId) {
        console.log('[youtubeController] playlistId is missing.');
        return res.status(400).json({ message: 'playlistId is required' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        const videos = await conn.query(
            "SELECT title, url FROM youtube_videos_cache WHERE playlistId = ?",
            [playlistId]
        );
        console.log(`[youtubeController] Query result for playlistId ${playlistId}:`, videos);

        if (videos.length === 0) {
            console.log(`[youtubeController] No videos found for playlistId: ${playlistId}`);
            return res.status(404).json({ message: 'No videos found for the given playlistId' });
        }

        res.status(200).json(videos);
    } catch (error) {
        console.error("Error fetching videos from MariaDB:", error);
        res.status(500).json({ message: "Internal Server Error" });
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    getVideosByPlaylist
};