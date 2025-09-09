const axios = require('axios');
require('dotenv').config({ path: '.env' });

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = 'YOUR_YOUTUBE_CHANNEL_ID'; // 여기에 실제 YouTube 채널 ID를 입력하세요.

async function getYoutubeVideos() {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: YOUTUBE_API_KEY,
                channelId: YOUTUBE_CHANNEL_ID,
                part: 'snippet',
                order: 'date',
                type: 'video',
                maxResults: 50 // 가져올 최대 결과 수
            }
        });

        const videos = response.data.items.map(item => ({
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            publishedAt: item.snippet.publishedAt
        }));

        return videos;

    } catch (error) {
        console.error("Error fetching YouTube videos:", error.response ? error.response.data : error.message);
        return [];
    }
}

module.exports = {
    getYoutubeVideos
};
