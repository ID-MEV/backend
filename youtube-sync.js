require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mariadb = require('mariadb');
const axios = require('axios');

const dbPool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5,
});

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const PLAYLIST_IDS = `${process.env.PLAYLIST_IDS},${process.env.PLAYLIST_IDS_choir},${process.env.PLAYLIST_IDS_special}`.split(',');

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';

async function fetchVideosFromPlaylist(playlistId) {
    try {
        const response = await axios.get(YOUTUBE_API_URL, {
            params: {
                part: 'snippet',
                playlistId: playlistId,
                maxResults: 50, // 최대 50개까지 가져옴
                key: YOUTUBE_API_KEY,
            },
        });

        return response.data.items.map(item => ({
            playlistId: playlistId,
            videoId: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
            position: item.snippet.position,
            publishedAt: item.snippet.publishedAt,
        }));
    } catch (error) {
        console.error(`Playlist ${playlistId}로부터 영상을 가져오는 데 실패했습니다:`, error.response ? error.response.data : error.message);
        return [];
    }
}

async function syncYoutubeData() {
    let conn;
    try {
        conn = await dbPool.getConnection();
        console.log('데이터 동기화를 위해 데이터베이스에 연결되었습니다.');

        // TRUNCATE TABLE to ensure a clean slate
        await conn.query('TRUNCATE TABLE youtube_videos_cache');
        console.log('youtube_videos_cache 테이블이 비워졌습니다.');

        for (const playlistId of PLAYLIST_IDS) {
            console.log(`${playlistId} 재생목록 동기화를 시작합니다.`);
            const videos = await fetchVideosFromPlaylist(playlistId.trim());

            if (videos.length > 0) {
                // Filter out duplicates based on playlistId and videoId
                const uniqueVideos = [];
                const seen = new Set();
                videos.forEach(video => {
                    const key = `${video.playlistId}-${video.videoId}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueVideos.push(video);
                    }
                });

                // 새 데이터 삽입
                const query = 'INSERT INTO youtube_videos_cache (playlistId, videoId, title, url, position, publishedAt) VALUES (?, ?, ?, ?, ?, ?)';
                const values = uniqueVideos.map(v => [
                    v.playlistId, 
                    v.videoId, 
                    v.title, 
                    v.url, 
                    v.position, 
                    new Date(v.publishedAt).toISOString().slice(0, 19).replace('T', ' ')
                ]);
                
                console.log('Videos to insert:', uniqueVideos); // Log uniqueVideos
                await conn.batch(query, values);
                console.log(`${playlistId}에 ${uniqueVideos.length}개의 새 영상 데이터가 저장되었습니다.`);
            }
        }
        console.log('모든 재생목록의 동기화가 완료되었습니다.');

    } catch (err) {
        console.error("데이터 동기화 중 오류 발생:", err);
    } finally {
        if (conn) {
            conn.release();
            console.log('데이터베이스 연결이 해제되었습니다.');
        }
    }
}

// 스크립트 직접 실행 시 동기화 함수 호출
if (require.main === module) {
    syncYoutubeData().then(() => {
        dbPool.end();
        console.log('DB 풀이 종료되었습니다.');
    });
}

module.exports = { syncYoutubeData };
