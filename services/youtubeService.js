const axios = require('axios');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';

async function getPlaylistVideos(playlistId) {
    if (!YOUTUBE_API_KEY) {
        throw new Error('YOUTUBE_API_KEY is not defined in environment variables.');
    }
    if (!playlistId) {
        throw new Error('playlistId is required.');
    }

    try {
        const response = await axios.get(BASE_URL, {
            params: {
                part: 'snippet',
                playlistId: playlistId,
                key: YOUTUBE_API_KEY,
                maxResults: 50 // You can adjust this as needed
            }
        });

        const videos = response.data.items.map(item => ({
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
        }));

        return videos;
    } catch (error) {
        console.error('Error fetching YouTube playlist videos:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    getPlaylistVideos
};