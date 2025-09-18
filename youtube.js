/**
 * @file Defines the YouTube video API routes.
 * @module routes/youtube
 */

const express = require('express');
const router = express.Router();
const youtubeController = require('./controllers/youtubeController');

/**
 * GET /api/youtube-videos
 * Retrieves a list of YouTube videos for a given playlist ID.
 * @name GET /api/youtube-videos
 * @function
 * @memberof module:routes/youtube
 * @param {string} playlistId - The ID of the YouTube playlist.
 * @returns {Array<Object>} A JSON array of video objects, each with a title and URL.
 */
router.get('/', youtubeController.getVideosByPlaylist);

module.exports = router;