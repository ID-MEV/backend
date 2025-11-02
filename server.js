const express = require('express');
const cron = require('node-cron');
const { initializeDatabase, pool } = require('./db');
const { cacheYoutubeVideos } = require('./cache');
const { getPlaylistVideos } = require('./services/youtubeService');
const { syncYoutubeData } = require('./youtube-sync');
require('dotenv').config({ path: '.env' });
const cors = require('cors'); // 1. cors 모듈 추가

const app = express();
app.use(express.json());
app.use(cors({
    origin: [
        'https://mev.o-r.kr',
        'http://localhost:5173',
        'http://mev.o-r.kr:5173',
        'https://seongrim.o-r.kr'
    ]
}));
const PORT = process.env.PORT || 5101;

const memoRouter = require('./memo');
const backgroundRouter = require('./background'); // Add this line
const youtubeRouter = require('./youtube');
const sermonRouter = require('./sermons');

// Initialize database and start caching
initializeDatabase().then(() => {
    console.log("Database initialization complete.");

    // Schedule YouTube video caching for Monday-Saturday at 7:30 AM
    cron.schedule('30 7 * * MON-SAT', async () => {
        console.log('Running scheduled YouTube video caching for Monday-Saturday at 7:30 AM...');
        await cacheYoutubeVideos();
        await syncYoutubeData();
    }, {
        scheduled: true,
        timezone: "Asia/Seoul"
    });

    // Schedule YouTube video caching for Sunday at 3:00 PM
    cron.schedule('0 15 * * SUN', async () => {
        console.log('Running scheduled YouTube video caching for Sunday at 3:00 PM...');
        await cacheYoutubeVideos();
        await syncYoutubeData();
    }, {
        scheduled: true,
        timezone: "Asia/Seoul"
    });

    // Schedule YouTube video caching for Wednesday at 10:00 PM
    cron.schedule('0 22 * * WED', async () => {
        console.log('Running scheduled YouTube video caching for Wednesday at 10:00 PM...');
        await cacheYoutubeVideos();
        await syncYoutubeData();
    }, {
        scheduled: true,
        timezone: "Asia/Seoul"
    });
    console.log("YouTube video caching scheduled: Mon-Sat at 7:30 AM, Sun at 3:00 PM, Wed at 10:00 PM (Asia/Seoul).");

}).catch(err => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
});

// API Routes
app.use('/api/memo', memoRouter);
app.use('/api/settings', backgroundRouter); // Add this line
app.use('/api/youtube-videos', youtubeRouter);
app.use('/api/sermons', sermonRouter);

// API endpoint to get cached videos
app.get('/api/videos', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const videos = await conn.query("SELECT title, url, publishedAt FROM videos ORDER BY publishedAt DESC");
        res.json(videos);
    } catch (err) {
        console.error("Error fetching cached videos:", err);
        res.status(500).json({ message: "Error fetching cached videos" });
    } finally {
        if (conn) conn.release();
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});