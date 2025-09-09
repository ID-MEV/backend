const express = require('express');
const cron = require('node-cron');
const { initializeDatabase, pool } = require('./db');
const { cacheYoutubeVideos } = require('./cache');
require('dotenv').config({ path: '.env' });
const cors = require('cors'); // 1. cors 모듈 추가

const app = express();
app.use(express.json());
app.use(cors({
    origin: [
        'https://mev.o-r.kr',
        'http://localhost:5173',
        'http://mev.o-r.kr:5173'
    ]
}));
const PORT = process.env.PORT || 5101;

const memoRouter = require('./memo'); // Add this line

// Initialize database and start caching
initializeDatabase().then(() => {
    console.log("Database initialization complete.");

    // Schedule YouTube video caching every Sunday at 3:00 PM
    cron.schedule('0 15 * * SUN', async () => {
        console.log('Running scheduled YouTube video caching...');
        await cacheYoutubeVideos();
    }, {
        scheduled: true,
        timezone: "Asia/Seoul" // 한국 시간대 설정
    });
    console.log("YouTube video caching scheduled for every Sunday at 3:00 PM (Asia/Seoul).");

}).catch(err => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
});

// Memo API 라우트 (Add this block)
app.use('/api/memo', memoRouter);

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